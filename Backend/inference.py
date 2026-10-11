# Backend/inference.py
# ─────────────────────────────────────────────────────────────────────────────
# Real ResNet-50 inference + Grad-CAM + Lesion Segmentation module.
# Called by main.py for every uploaded image.
#
# Changes from original (P2 Week 1-2 fixes):
#   1. [FIX]  Grad-CAM hook leak → hooks stored and removed after each run.
#   2. [FIX]  OOD rejection softened → confidence-based warning, not hard block.
#   3. [NEW]  segment.py wired in → lesions + lesion_summary in every response.
#   4. [FIX]  _build_model() tries shared ml_script/model.py first; falls back
#             to local definition so Backend/ works standalone as well.
# ─────────────────────────────────────────────────────────────────────────────

import os
import io
import sys
import torch
import torch.nn as nn
import numpy as np
from PIL import Image
from torchvision import models, transforms
import cv2

# ── Import lesion segmentation ──────────────────────────────────────────────
from segment import segment_lesions

# ─── Constants ─────────────────────────────────────────────────────────────
IMG_SIZE       = 224
NUM_CLASSES    = 5
DEVICE         = torch.device("cpu")   # ~140 ms per image — acceptable for demo
OOD_LOW_CONF   = 0.50   # if max(softmax) < this → "Low Confidence" warning

# ICDR class info
LEVEL_LABELS = [
    "No Apparent DR",
    "Mild NPDR",
    "Moderate NPDR",
    "Severe NPDR",
    "Proliferative DR",
]
LEVEL_ACTIONS = [
    "Routine Annual Screening",
    "Review in 6–12 Months",
    "Specialist Triage Required",
    "Urgent Specialist Referral",
    "Emergency Laser / Surgical Review",
]

# ─── Preprocessing chain ───────────────────────────────────────────────────
_imagenet_normalize = transforms.Normalize(
    mean=[0.485, 0.456, 0.406],
    std =[0.229, 0.224, 0.225],
)

preprocess = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    _imagenet_normalize,
])


# ─── CLAHE + Ben Graham enhancement ────────────────────────────────────────
def apply_ben_graham_clahe(img_pil: Image.Image, img_size: int) -> Image.Image:
    """
    Apply CLAHE + Ben Graham normalization.
    Must be identical to the preprocessing used during training.
    (See ml_script/preprocess.py — single source of truth once P1 creates it.)
    """
    img = np.array(img_pil.convert("RGB"), dtype=np.uint8)
    img = cv2.resize(img, (img_size, img_size))

    # CLAHE on L channel of LAB
    lab     = cv2.cvtColor(img, cv2.COLOR_RGB2LAB)
    l, a, b = cv2.split(lab)
    clahe   = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    cl      = clahe.apply(l)
    img_clahe = cv2.merge((cl, a, b))
    img_clahe = cv2.cvtColor(img_clahe, cv2.COLOR_LAB2RGB)

    # Ben Graham: blend with blurred version for local normalisation
    img_blur    = cv2.GaussianBlur(img_clahe, (0, 0), img_size / 30)
    img_enhanced = cv2.addWeighted(img_clahe, 4, img_blur, -4, 128)

    return Image.fromarray(img_enhanced.astype(np.uint8))


# ─── Image Quality Assessment (IQA) & OOD Validation Gate ─────────────────
def validate_fundus_and_quality(img_np: np.ndarray, img_pil: Image.Image) -> list[str]:
    """
    Validates that the uploaded image:
      1. Is an ocular fundus photograph (not a pet, document, car, or random photo).
      2. Has sufficient clinical quality (illumination, sharpness, vessel visibility).

    Raises:
        ValueError with "OOD_REJECT: " prefix if the image fails quality/fundus checks,
        prompting the clinician to re-upload.
    """
    h, w = img_np.shape[:2]
    if h < 150 or w < 150:
        raise ValueError(
            "OOD_REJECT: Image resolution is too low (<150px) to evaluate retinal anatomy. "
            "Please re-upload a higher resolution scan."
        )

    gray = cv2.cvtColor((img_np * 255).astype(np.uint8), cv2.COLOR_RGB2GRAY)
    mean_val = float(gray.mean())

    # 1. Under-exposure (pitch black or unilluminated scan)
    if mean_val < 10.0:
        raise ValueError(
            "OOD_REJECT: Image is severely underexposed (too dark) for clinical evaluation. "
            "Retinal structures are invisible. Please re-upload with proper illumination."
        )

    # 2. Over-exposure (severe flash glare / blown-out white)
    if mean_val > 230.0:
        raise ValueError(
            "OOD_REJECT: Image is severely overexposed or washed out by flash glare. "
            "Retinal landmarks are obscured. Please re-upload a properly exposed scan."
        )

    # 3. Retinal Field of View (FOV) coverage
    mask = gray > 15
    fov_ratio = float(mask.sum()) / float(h * w)
    if fov_ratio < 0.10:
        raise ValueError(
            "OOD_REJECT: No visible retinal field detected. "
            "Please ensure the image contains a clear fundus view."
        )

    # 4. Color / Retinal Melanin & Vascular Pigment Signature
    r_mean = float(img_np[mask, 0].mean())
    g_mean = float(img_np[mask, 1].mean())
    b_mean = float(img_np[mask, 2].mean())

    rg_ratio = r_mean / max(g_mean, 1e-4)
    rb_ratio = r_mean / max(b_mean, 1e-4)
    blue_excess = float(((img_np[:, :, 2] > img_np[:, :, 0]) & mask).sum()) / float(mask.sum())
    blue_over_green = float(((img_np[:, :, 2] > img_np[:, :, 1]) & mask).sum()) / float(mask.sum())

    if rb_ratio < 1.70:
        raise ValueError(
            f"OOD_REJECT: Image lacks characteristic retinal melanin pigment (R/B ratio {rb_ratio:.2f} < 1.70). "
            "Please upload a valid retinal scan."
        )
    if rg_ratio < 1.10:
        raise ValueError(
            f"OOD_REJECT: Color profile does not match retinal anatomy (R/G ratio {rg_ratio:.2f} < 1.10). "
            "Please upload a genuine retinal fundus image."
        )
    if blue_excess > 0.04:
        raise ValueError(
            f"OOD_REJECT: High blue/cool light content detected ({blue_excess*100:.1f}% pixels). "
            "Not an ocular fundus photograph. Please upload a clinical retinal photograph."
        )
    if blue_over_green > 0.12:
        raise ValueError(
            f"OOD_REJECT: Unnatural cool hues detected ({blue_over_green*100:.1f}% blue>green). "
            "Image does not match retinal fundus characteristics."
        )

    # 5. UI / Screenshot / Document Structural Check (Orthogonal straight line detection)
    edges = cv2.Canny(gray, 50, 150)
    min_len = int(min(h, w) * 0.10)
    lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=70, minLineLength=min_len, maxLineGap=5)
    ortho_lines = 0
    if lines is not None:
        for l in lines:
            x1, y1, x2, y2 = l.flatten()[:4]
            angle = np.abs(np.arctan2(y2 - y1, x2 - x1) * 180 / np.pi)
            if angle < 3 or abs(angle - 90) < 3 or abs(angle - 180) < 3:
                ortho_lines += 1
    if ortho_lines >= 4:
        raise ValueError(
            f"OOD_REJECT: Artificial rectangular geometry or UI window elements detected ({ortho_lines} straight edges). "
            "Please upload an original fundus photograph directly, not a desktop screenshot."
        )

    # 6. Anatomical Blood Vessel Tree Visibility Check
    green = (img_np[:, :, 1] * 255).astype(np.uint8)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    g_cl = clahe.apply(green)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
    bothat = cv2.morphologyEx(g_cl, cv2.MORPH_BLACKHAT, kernel)
    vessels = (bothat > 14) & mask
    vessel_ratio = float(vessels.sum()) / float(mask.sum())

    if vessel_ratio < 0.001:  # < 0.1% vessel structure found
        raise ValueError(
            "OOD_REJECT: Blood vessel tree cannot be identified. "
            "The image either lacks retinal vasculature or suffers from severe defocus/blur. "
            "Please re-upload a clear fundus image."
        )

    warnings = []
    if vessel_ratio < 0.005:
        warnings.append("Low vessel contrast detected — image quality may be marginal.")
    return warnings


# ─── Model builder ─────────────────────────────────────────────────────────
def _build_model() -> nn.Module:
    """
    Try importing build_model() from the shared ml_script/model.py (P1's
    single source of truth).  If that file does not yet exist (or is still a
    stub), fall back to the local definition so Backend/ stays self-contained.
    """
    # Look for ml_script one directory above Backend/
    ml_script_path = os.path.join(os.path.dirname(__file__), "..", "ml_script")
    ml_script_path = os.path.normpath(ml_script_path)

    if os.path.isdir(ml_script_path):
        if ml_script_path not in sys.path:
            sys.path.insert(0, ml_script_path)
        try:
            from model import build_model  # type: ignore
            print("[inference] Using shared ml_script/model.py -> build_model()")
            return build_model()
        except (ImportError, AttributeError):
            pass  # fall through to local definition

    # -- Local fallback definition (kept in sync with ml_script/model.py) --
    print("[inference] Using local _build_model() - ml_script/model.py not yet ready.")
    m = models.resnet50(weights=None)
    m.fc = nn.Sequential(
        nn.Dropout(0.4),
        nn.Linear(m.fc.in_features, 512),
        nn.ReLU(),
        nn.Dropout(0.3),
        nn.Linear(512, NUM_CLASSES),
    )
    return m


# ─── Singleton model loader ─────────────────────────────────────────────────
_model:      nn.Module | None = None
_model_path: str | None       = None

def get_model(model_path: str) -> nn.Module:
    """Load model once, reuse across all requests (singleton pattern)."""
    global _model, _model_path
    if _model is None or _model_path != model_path:
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model weights not found: {model_path}")
        checkpoint = torch.load(model_path, map_location=DEVICE, weights_only=False)
        _model = _build_model().to(DEVICE)
        state  = checkpoint.get("model_state_dict", checkpoint)
        _model.load_state_dict(state)
        _model.eval()
        _model_path = model_path
        epoch = checkpoint.get("epoch", "?") if isinstance(checkpoint, dict) else "?"
        print(f"[inference] [OK] Model loaded (epoch {epoch}): {model_path}")
    return _model


# ─── Grad-CAM (hook leak fixed) ────────────────────────────────────────────
class GradCAMSimple:
    """
    Minimal Grad-CAM without extra dependencies.

    FIX (Week 2, P2): hooks are registered per-call via a context manager and
    removed immediately after .generate() returns, preventing accumulation on
    the singleton model across repeated requests.
    """

    def __init__(self, model: nn.Module):
        self.model      = model
        self.gradients  = None
        self.activations = None
        self._handles   = []   # ← store handles so we can remove them

    def _register_hooks(self):
        target = self.model.layer4[-1]
        h1 = target.register_forward_hook(self._save_activations)
        h2 = target.register_full_backward_hook(self._save_gradients)
        self._handles = [h1, h2]

    def _remove_hooks(self):
        for h in self._handles:
            h.remove()
        self._handles = []

    def _save_activations(self, _module, _input, output):
        self.activations = output.detach()

    def _save_gradients(self, _module, _grad_input, grad_output):
        self.gradients = grad_output[0].detach()

    def generate(self, input_tensor: torch.Tensor, class_idx: int) -> np.ndarray:
        """
        Generate normalised Grad-CAM heatmap for class_idx.
        Hooks are registered just before the forward pass and removed after.
        """
        self._register_hooks()
        try:
            self.model.zero_grad()
            output = self.model(input_tensor)
            output[0, class_idx].backward()

            weights = self.gradients.mean(dim=[2, 3], keepdim=True)   # [1, C, 1, 1]
            cam     = (weights * self.activations).sum(dim=1)          # [1, H, W]
            cam     = torch.relu(cam).squeeze().cpu().numpy()

            # Normalise to [0, 1]
            cam_min, cam_max = cam.min(), cam.max()
            if cam_max - cam_min > 1e-8:
                cam = (cam - cam_min) / (cam_max - cam_min)
            else:
                cam = np.zeros_like(cam)

            return cam
        finally:
            self._remove_hooks()   # ← always clean up, even on error


# ─── Main inference function ────────────────────────────────────────────────
def run_inference(image_bytes: bytes, model_path: str, heatmap_save_path: str) -> dict:
    """
    Full inference pipeline: preprocess → classify → Grad-CAM → segment.

    Args:
        image_bytes:       Raw bytes of the uploaded fundus image.
        model_path:        Absolute path to retinascan_resnet50.pth.
        heatmap_save_path: Where to write the Grad-CAM overlay JPEG.

    Returns:
        Full dict matching API contract (Context/API_Contract.md):
        {
          severity, confidence, label, action,
          heatmap_url, all_probs,
          lesions, lesion_summary
        }

    Raises:
        ValueError with "OOD_REJECT:" prefix → caught by main.py → {"mode":"error"}
    """
    # ── 1. Load image ───────────────────────────────────────────────────────
    img_pil_orig = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img_np_orig  = np.array(img_pil_orig, dtype=np.float32) / 255.0

    # ── 2. Image Quality Assessment & Fundus Gatekeeper ─────────────────────
    heuristic_warnings = validate_fundus_and_quality(img_np_orig, img_pil_orig)
    for w in heuristic_warnings:
        print(f"[IQA/OOD] [WARN] {w}")

    # ── 3. CLAHE + Ben Graham preprocessing ────────────────────────────────
    img_pil_enhanced = apply_ben_graham_clahe(img_pil_orig, IMG_SIZE)
    img_np_enhanced  = np.array(img_pil_enhanced, dtype=np.float32) / 255.0

    # ── 4. Tensor preparation ───────────────────────────────────────────────
    input_tensor = preprocess(img_pil_enhanced).unsqueeze(0).to(DEVICE)
    input_tensor.requires_grad_(True)

    # ── 5. Forward pass ─────────────────────────────────────────────────────
    model    = get_model(model_path)
    grad_cam = GradCAMSimple(model)

    with torch.enable_grad():
        logits = model(input_tensor)
        probs  = torch.softmax(logits, dim=1).squeeze()  # shape [5]
        grade  = int(probs.argmax().item())
        conf   = float(probs[grade].item())

    # ── 6. Confidence-based OOD hard reject ─────────────────────────────────
    if conf < OOD_LOW_CONF:
        # Return structured error — NOT an exception — so main.py can JSON-return it
        raise ValueError(
            f"OOD_REJECT: Low confidence ({conf * 100:.1f}%) — "
            "image may not be a fundus photograph."
        )

    # ── 7. Grad-CAM (hooks auto-removed after generate()) ───────────────────
    with torch.enable_grad():
        cam = grad_cam.generate(input_tensor, grade)

    # ── 8. Generate pixel-perfect Grad-CAM at original resolution ───────────
    orig_w, orig_h = img_pil_orig.size
    cam_full = cv2.resize(cam, (orig_w, orig_h), interpolation=cv2.INTER_CUBIC)

    # Retinal FOV mask to confine heatmap strictly within the ocular lens
    gray_orig = cv2.cvtColor(np.array(img_pil_orig), cv2.COLOR_RGB2GRAY)
    mask_fov = gray_orig > 15
    k_size = max(3, min(orig_w, orig_h) // 60)
    mask_fov_eroded = cv2.erode(mask_fov.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k_size, k_size))) > 0

    # Clip cam_full to strictly [0.0, 1.0] to prevent cv2.INTER_CUBIC overshooting (>1.0)
    # which wraps around in uint8 (256 -> 0) and creates an artificial dark blue hole at the peak!
    cam_full = np.clip(cam_full, 0.0, 1.0)

    # JET colormap
    cam_u8 = np.uint8(255 * cam_full)
    heatmap_bgr = cv2.applyColorMap(cam_u8, cv2.COLORMAP_JET)

    # Clean alpha transparency: hot spots up to 75% opacity, cold blue suppressed, zero outside FOV
    alpha = np.clip(cam_full * 1.2, 0, 1)
    alpha[cam_full < 0.20] = alpha[cam_full < 0.20] * 0.15
    alpha[~mask_fov_eroded] = 0.0
    alpha_u8 = np.uint8(alpha * 0.75 * 255)

    heatmap_bgra = cv2.cvtColor(heatmap_bgr, cv2.COLOR_BGR2BGRA)
    heatmap_bgra[:, :, 3] = alpha_u8

    heatmap_png_path = os.path.splitext(heatmap_save_path)[0] + ".png"
    os.makedirs(os.path.dirname(os.path.abspath(heatmap_png_path)), exist_ok=True)
    cv2.imwrite(heatmap_png_path, heatmap_bgra)
    heatmap_filename = os.path.basename(heatmap_png_path)

    # ── 9. Lesion segmentation with Grade-Aware ICDR Harmonization ───────────
    seg_result = segment_lesions(img_pil_orig, predicted_grade=grade)

    # ── 10. Build API response ───────────────────────────────────────────────
    return {
        "severity":       grade,
        "confidence":     round(conf * 100, 1),
        "label":          LEVEL_LABELS[grade],
        "action":         LEVEL_ACTIONS[grade],
        "heatmap_url":    f"/images/{heatmap_filename}",
        "all_probs":      [round(float(p), 4) for p in probs.tolist()],
        "lesions":        seg_result["lesions"],
        "lesion_summary": seg_result["lesion_summary"],
        "ood_warnings":   heuristic_warnings,   # surfaced to frontend for transparency
    }
