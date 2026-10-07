# Backend/segment.py
# ─────────────────────────────────────────────────────────────────────────────
# Python port of ml_script/matlab/segment_lesions.m
# Detects three DR lesion classes using OpenCV morphological operations.
#
# Pipeline (mirrors the MATLAB implementation exactly):
#   Green channel + CLAHE
#   → morphological background subtraction
#   → Otsu threshold
#   → connectedComponentsWithStats
#   → size / circularity filter  →  microaneurysms   (4–150 px)
#                                →  hemorrhages      (150–3000 px)
#   Red+Green bright channel
#   → CLAHE → high threshold → exclude optic-disc (>5000 px)
#                                →  hard exudates   (<5000 px)
#
# Public API:
#   segment_lesions(img_pil: PIL.Image) -> dict
#
# Output schema matches API contract in Context/API_Contract.md:
#   {
#     "lesions": [{"type", "bbox", "area_px", "confidence"}, ...],
#     "lesion_summary": {
#         "microaneurysm_count", "hemorrhage_count", "exudate_count",
#         "total_lesion_area_px"
#     }
#   }
# ─────────────────────────────────────────────────────────────────────────────

import cv2
import numpy as np
from PIL import Image

# ── Working resolution for segmentation ────────────────────────────────────
SEG_SIZE = 512   # resize input to this before processing; bboxes are in 512-space

# ── Morphological structuring element for background estimation ─────────────
_BG_KERNEL_RADIUS = 12   # matches MATLAB strel('disk', 12)

# ── Lesion size thresholds (in pixels at SEG_SIZE resolution) ──────────────
MA_AREA_MIN   =    4
MA_AREA_MAX   =  150
MA_CIRC_MIN   =  0.4    # circularity (4π·area / perimeter²)

HEM_AREA_MIN  =  150
HEM_AREA_MAX  = 3000

EX_NOISE_MIN  =   20    # remove blobs smaller than this (noise)
EX_OPTIC_MAX  = 5000    # blobs larger than this are the optic disc

# ── CLAHE parameters (mirror MATLAB adapthisteq defaults) ───────────────────
CLAHE_CLIP    = 2.0
CLAHE_GRID    = (8, 8)

# ── Confidence score heuristics (no ground-truth → proxy via area/circ) ────
def _ma_confidence(area_px, circularity):
    """Proxy confidence for microaneurysm: high circ + size near 30 px → ~0.90."""
    circ_score = min(circularity / 1.0, 1.0)          # circularity capped at 1
    size_score = 1.0 - abs(area_px - 30) / 150        # peaks at 30 px
    size_score = max(0.0, min(size_score, 1.0))
    return round(0.5 * circ_score + 0.5 * size_score, 2)

def _hem_confidence(area_px):
    """Proxy confidence for hemorrhage: larger blobs up to HEM_AREA_MAX → higher conf."""
    score = min(area_px / HEM_AREA_MAX, 1.0)
    return round(0.55 + 0.35 * score, 2)

def _ex_confidence(area_px):
    """Proxy confidence for exudate: moderate area → higher conf."""
    score = min(area_px / 2000, 1.0)
    return round(0.50 + 0.40 * score, 2)


# ─────────────────────────────────────────────────────────────────────────────
# Internal helpers
# ─────────────────────────────────────────────────────────────────────────────

def _to_bgr_uint8(img_pil: Image.Image, size: int) -> np.ndarray:
    """Convert PIL image → resized uint8 BGR numpy array."""
    img = img_pil.convert("RGB")
    img_np = np.array(img, dtype=np.uint8)
    img_np = cv2.resize(img_np, (size, size), interpolation=cv2.INTER_LINEAR)
    return cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)


def _clahe_green(bgr: np.ndarray) -> np.ndarray:
    """Apply CLAHE to the green channel (best contrast for dark lesions)."""
    green = bgr[:, :, 1]
    clahe = cv2.createCLAHE(clipLimit=CLAHE_CLIP, tileGridSize=CLAHE_GRID)
    return clahe.apply(green)


def _circularity(area_px: int, perimeter: float) -> float:
    """Computes 4π·A / P².  Returns 0 if perimeter is 0."""
    if perimeter < 1e-4:
        return 0.0
    return (4 * np.pi * area_px) / (perimeter ** 2)


def _stats_to_bbox(x, y, w, h):
    """Return [x1,y1,x2,y2] bounding box."""
    return [int(x), int(y), int(x + w), int(y + h)]


# ─────────────────────────────────────────────────────────────────────────────
# Microaneurysm + Hemorrhage detection  (dark-channel pipeline)
# ─────────────────────────────────────────────────────────────────────────────

def _detect_dark_lesions(green_eq: np.ndarray):
    """
    Port of MATLAB dark-lesion pipeline:
      background = morphological closing with radius-12 disk
      residual   = background - green_eq
      threshold  = Otsu × 0.6   (lower → more sensitive)
      connected-components → classify by area + circularity
    """
    # Build disk structuring element (≈ MATLAB strel('disk', _BG_KERNEL_RADIUS))
    se_radius = _BG_KERNEL_RADIUS
    se = cv2.getStructuringElement(
        cv2.MORPH_ELLIPSE,
        (2 * se_radius + 1, 2 * se_radius + 1)
    )

    # Background estimate via morphological closing → subtract green
    bg_est = cv2.morphologyEx(green_eq, cv2.MORPH_CLOSE, se)
    residual = cv2.subtract(bg_est, green_eq)

    # Otsu threshold on residual, scaled down for sensitivity
    otsu_val, _ = cv2.threshold(residual, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    thresh_val = max(1, int(otsu_val * 0.6))
    _, binary_dark = cv2.threshold(residual, thresh_val, 255, cv2.THRESH_BINARY)

    # Connected components with full stats
    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(
        binary_dark, connectivity=8
    )

    microaneurysms = []
    hemorrhages    = []

    for lbl in range(1, num_labels):   # skip background label 0
        area = int(stats[lbl, cv2.CC_STAT_AREA])
        x    = int(stats[lbl, cv2.CC_STAT_LEFT])
        y    = int(stats[lbl, cv2.CC_STAT_TOP])
        w    = int(stats[lbl, cv2.CC_STAT_WIDTH])
        h    = int(stats[lbl, cv2.CC_STAT_HEIGHT])

        # Compute contour perimeter for circularity
        mask = (labels == lbl).astype(np.uint8) * 255
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        perimeter = cv2.arcLength(contours[0], True) if contours else 0.0
        circ = _circularity(area, perimeter)

        bbox = _stats_to_bbox(x, y, w, h)

        if MA_AREA_MIN <= area <= MA_AREA_MAX and circ >= MA_CIRC_MIN:
            microaneurysms.append({
                "type":       "microaneurysm",
                "bbox":       bbox,
                "area_px":    area,
                "confidence": _ma_confidence(area, circ),
            })
        elif HEM_AREA_MIN < area < HEM_AREA_MAX:
            hemorrhages.append({
                "type":       "hemorrhage",
                "bbox":       bbox,
                "area_px":    area,
                "confidence": _hem_confidence(area),
            })

    return microaneurysms, hemorrhages


# ─────────────────────────────────────────────────────────────────────────────
# Hard Exudate detection  (bright-channel pipeline)
# ─────────────────────────────────────────────────────────────────────────────

def _detect_exudates(bgr: np.ndarray):
    """
    Port of MATLAB exudate pipeline:
      bright_ch = (red + green) / 2
      CLAHE → Otsu + 0.15 → binary
      remove noise < EX_NOISE_MIN px
      remove blobs > EX_OPTIC_MAX px (optic disc)
    """
    red   = bgr[:, :, 2].astype(np.float32)
    green = bgr[:, :, 1].astype(np.float32)
    bright_ch = np.clip((red + green) / 2, 0, 255).astype(np.uint8)

    clahe = cv2.createCLAHE(clipLimit=1.0, tileGridSize=CLAHE_GRID)
    bright_eq = clahe.apply(bright_ch)

    # Otsu threshold + offset (only very bright regions)
    otsu_val, _ = cv2.threshold(bright_eq, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    thresh_val = min(int(otsu_val + 0.15 * 255), int(0.85 * 255))
    _, bright_mask = cv2.threshold(bright_eq, thresh_val, 255, cv2.THRESH_BINARY)

    # Remove tiny noise
    kernel_open = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    bright_mask = cv2.morphologyEx(bright_mask, cv2.MORPH_OPEN, kernel_open)

    # Connected components
    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(
        bright_mask, connectivity=8
    )

    exudates = []
    for lbl in range(1, num_labels):
        area = int(stats[lbl, cv2.CC_STAT_AREA])
        if area < EX_NOISE_MIN:
            continue       # noise
        if area > EX_OPTIC_MAX:
            continue       # optic disc

        x = int(stats[lbl, cv2.CC_STAT_LEFT])
        y = int(stats[lbl, cv2.CC_STAT_TOP])
        w = int(stats[lbl, cv2.CC_STAT_WIDTH])
        h = int(stats[lbl, cv2.CC_STAT_HEIGHT])

        exudates.append({
            "type":       "exudate",
            "bbox":       _stats_to_bbox(x, y, w, h),
            "area_px":    area,
            "confidence": _ex_confidence(area),
        })

    return exudates


# ─────────────────────────────────────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────────────────────────────────────

def segment_lesions(img_pil: Image.Image) -> dict:
    """
    Run the full lesion segmentation pipeline on a PIL RGB image.

    Args:
        img_pil:  PIL.Image (any mode; will be converted to RGB internally)

    Returns:
        {
          "lesions": [
            {"type": "microaneurysm"|"hemorrhage"|"exudate",
             "bbox": [x1, y1, x2, y2],   # pixel coords at SEG_SIZE resolution
             "area_px": int,
             "confidence": float},
            ...
          ],
          "lesion_summary": {
            "microaneurysm_count": int,
            "hemorrhage_count":    int,
            "exudate_count":       int,
            "total_lesion_area_px": int
          }
        }

    Notes:
        • bboxes are in SEG_SIZE (512×512) coordinate space.
          The frontend scales them using:   pin_x = bbox_cx / SEG_SIZE * display_width
        • Returns empty lists (not raises) on any internal failure so the
          main inference pipeline always gets a valid response.
    """
    try:
        bgr = _to_bgr_uint8(img_pil, SEG_SIZE)
        green_eq = _clahe_green(bgr)

        microaneurysms, hemorrhages = _detect_dark_lesions(green_eq)
        exudates = _detect_exudates(bgr)

        all_lesions = microaneurysms + hemorrhages + exudates

        # Sort by confidence descending so frontend can cap at N if needed
        all_lesions.sort(key=lambda x: x["confidence"], reverse=True)

        total_area = sum(l["area_px"] for l in all_lesions)

        summary = {
            "microaneurysm_count":  len(microaneurysms),
            "hemorrhage_count":     len(hemorrhages),
            "exudate_count":        len(exudates),
            "total_lesion_area_px": total_area,
        }

        print(
            f"[segment] MA={len(microaneurysms)}  "
            f"HEM={len(hemorrhages)}  "
            f"EX={len(exudates)}  "
            f"total_area={total_area}px"
        )

        return {"lesions": all_lesions, "lesion_summary": summary}

    except Exception as exc:
        # Never crash the inference pipeline
        print(f"[segment] WARNING — segmentation failed: {exc}")
        return {
            "lesions": [],
            "lesion_summary": {
                "microaneurysm_count":  0,
                "hemorrhage_count":     0,
                "exudate_count":        0,
                "total_lesion_area_px": 0,
            },
        }
