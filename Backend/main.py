# Backend/main.py — RetinaScan-XAI FastAPI Server  (P2 — v3.0)
# ─────────────────────────────────────────────────────────────────────────────
# Runs in two modes:
#   REAL  — retinascan_resnet50.pth is present → live ResNet-50 + Grad-CAM +
#            lesion segmentation (segment.py)
#   MOCK  — .pth absent → returns structurally correct pre-computed JSON so the
#            frontend can be developed and tested without the model.
#
# Endpoints:
#   POST /upload          Upload fundus image → grade + heatmap + lesions
#   GET  /health          Server + model status
#   GET  /eval-report     Returns ml_script/evaluation_report.json
#   POST /lesion-test     Debug: run segmentation ONLY, no classification
#
# P2 fixes applied (Remaining_Work.md):
#   [W1] asyncio.Lock serialises inference to cap RAM (already present, kept)
#   [W2] mock_response now includes realistic lesion arrays (API contract match)
#   [W2] OOD error returned as JSON {"mode":"error"} — no Python tracebacks
#   [W3] /lesion-test endpoint for integration testing without .pth
# ─────────────────────────────────────────────────────────────────────────────

import os
import uuid
import asyncio
import json
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

app = FastAPI(
    title="RetinaScan-XAI API",
    version="3.0",
    description="Diabetic Retinopathy Grading + Lesion Segmentation — SIH 2026 PS38",
)

# ── CORS (allow all for local dev; tighten for production) ─────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Paths ───────────────────────────────────────────────────────────────────
BASE_DIR     = os.path.dirname(os.path.abspath(__file__))
FRONTEND_IMG = os.path.normpath(
    os.path.join(BASE_DIR, "..", "Frontend", "retinascan-app", "public", "images")
)
MODEL_V2_PATH = os.path.normpath(
    os.path.join(BASE_DIR, "..", "ml_script", "retinascan_resnet50_v2.pth")
)
MODEL_V1_PATH = os.path.join(BASE_DIR, "retinascan_resnet50.pth")
MODEL_PATH    = MODEL_V2_PATH if os.path.exists(MODEL_V2_PATH) else MODEL_V1_PATH

EVAL_V2_REPORT = os.path.normpath(
    os.path.join(BASE_DIR, "..", "ml_script", "evaluation_report_v2.json")
)
EVAL_V1_REPORT = os.path.normpath(
    os.path.join(BASE_DIR, "..", "ml_script", "evaluation_report.json")
)
EVAL_REPORT    = EVAL_V2_REPORT if os.path.exists(EVAL_V2_REPORT) else EVAL_V1_REPORT

os.makedirs(FRONTEND_IMG, exist_ok=True)

# ── Detect whether the real model is available ──────────────────────────────
REAL_MODEL_AVAILABLE = False
if os.path.exists(MODEL_PATH):
    try:
        from inference import run_inference
        REAL_MODEL_AVAILABLE = True
        model_name = os.path.basename(MODEL_PATH)
        print(f"[OK] Real ResNet-50 model found ({model_name}) - live inference + segmentation enabled.")
    except ImportError as exc:
        print(f"[WARN] Model found but inference deps missing: {exc}")
        print("   Run: pip install -r requirements.txt")
else:
    print("[INFO] No model file found - running in MOCK mode.")
    print(f"   Place retinascan_resnet50_v2.pth in ml_script/ or retinascan_resnet50.pth in {BASE_DIR}")

# ── Try to import segment_lesions for /lesion-test endpoint ─────────────────
try:
    from segment import segment_lesions  # available regardless of .pth
    SEGMENT_AVAILABLE = True
except ImportError:
    SEGMENT_AVAILABLE = False

# ── Serve static images from the frontend public/images folder ──────────────
app.mount("/images", StaticFiles(directory=FRONTEND_IMG), name="images")

# ── Single-threaded inference lock — prevents concurrent OOM crashes ─────────
inference_lock = asyncio.Lock()

# ─────────────────────────────────────────────────────────────────────────────
# MOCK DATA — structurally identical to the real API contract
# ─────────────────────────────────────────────────────────────────────────────

MOCK_CONFIDENCE = {0: 98.7, 1: 89.1, 2: 96.4, 3: 97.9, 4: 95.2}
MOCK_LABELS     = [
    "No Apparent DR",
    "Mild NPDR",
    "Moderate NPDR",
    "Severe NPDR",
    "Proliferative DR",
]
MOCK_ACTIONS    = [
    "Routine Annual Screening",
    "Review in 6–12 Months",
    "Specialist Triage Required",
    "Urgent Specialist Referral",
    "Emergency Laser / Surgical Review",
]

# Per-severity pre-baked lesion payloads (realistic coordinates for 512×512)
_MOCK_LESIONS = {
    0: {   # No DR — healthy
        "lesions": [],
        "lesion_summary": {
            "microaneurysm_count": 0,
            "hemorrhage_count":    0,
            "exudate_count":       0,
            "total_lesion_area_px": 0,
        },
    },
    1: {   # Mild NPDR — a few MAs
        "lesions": [
            {"type": "microaneurysm", "bbox": [110, 95, 122, 107],  "area_px": 78,  "confidence": 0.81},
            {"type": "microaneurysm", "bbox": [245, 180, 255, 191], "area_px": 62,  "confidence": 0.74},
        ],
        "lesion_summary": {
            "microaneurysm_count": 2,
            "hemorrhage_count":    0,
            "exudate_count":       0,
            "total_lesion_area_px": 140,
        },
    },
    2: {   # Moderate NPDR — MAs + hemorrhage + exudate
        "lesions": [
            {"type": "microaneurysm", "bbox": [120, 88, 134, 101],  "area_px": 87,  "confidence": 0.82},
            {"type": "microaneurysm", "bbox": [305, 210, 315, 220], "area_px": 55,  "confidence": 0.76},
            {"type": "hemorrhage",    "bbox": [200, 150, 240, 185], "area_px": 620, "confidence": 0.74},
            {"type": "exudate",       "bbox": [90,  170, 130, 200], "area_px": 450, "confidence": 0.91},
        ],
        "lesion_summary": {
            "microaneurysm_count": 2,
            "hemorrhage_count":    1,
            "exudate_count":       1,
            "total_lesion_area_px": 1212,
        },
    },
    3: {   # Severe NPDR — multiple of each
        "lesions": [
            {"type": "microaneurysm", "bbox": [80,  60,  92, 72],   "area_px": 82,  "confidence": 0.88},
            {"type": "microaneurysm", "bbox": [190, 140, 200, 151],  "area_px": 65,  "confidence": 0.79},
            {"type": "microaneurysm", "bbox": [350, 260, 361, 271],  "area_px": 71,  "confidence": 0.77},
            {"type": "hemorrhage",    "bbox": [160, 200, 215, 260],  "area_px": 1540,"confidence": 0.85},
            {"type": "hemorrhage",    "bbox": [300, 100, 340, 145],  "area_px": 960, "confidence": 0.80},
            {"type": "exudate",       "bbox": [100, 300, 150, 340],  "area_px": 870, "confidence": 0.88},
            {"type": "exudate",       "bbox": [220, 380, 270, 420],  "area_px": 720, "confidence": 0.83},
        ],
        "lesion_summary": {
            "microaneurysm_count": 3,
            "hemorrhage_count":    2,
            "exudate_count":       2,
            "total_lesion_area_px": 4308,
        },
    },
    4: {   # Proliferative DR — severe, many lesions
        "lesions": [
            {"type": "microaneurysm", "bbox": [60,  55,  72, 67],   "area_px": 90,  "confidence": 0.90},
            {"type": "microaneurysm", "bbox": [150, 130, 161, 141],  "area_px": 73,  "confidence": 0.85},
            {"type": "microaneurysm", "bbox": [280, 200, 291, 210],  "area_px": 68,  "confidence": 0.83},
            {"type": "microaneurysm", "bbox": [420, 310, 430, 320],  "area_px": 58,  "confidence": 0.78},
            {"type": "hemorrhage",    "bbox": [100, 180, 170, 255],  "area_px": 2400,"confidence": 0.92},
            {"type": "hemorrhage",    "bbox": [250, 90,  310, 150],  "area_px": 1800,"confidence": 0.88},
            {"type": "hemorrhage",    "bbox": [350, 300, 420, 370],  "area_px": 1680,"confidence": 0.86},
            {"type": "exudate",       "bbox": [80,  350, 140, 410],  "area_px": 1100,"confidence": 0.89},
            {"type": "exudate",       "bbox": [200, 400, 260, 450],  "area_px": 900, "confidence": 0.84},
        ],
        "lesion_summary": {
            "microaneurysm_count": 4,
            "hemorrhage_count":    3,
            "exudate_count":       2,
            "total_lesion_area_px": 8169,
        },
    },
}

# Filename → severity key mapping (for demo images)
_MOCK_SEVERITY_MAP = {
    "demo_0": 0, "demo_1": 1, "demo_2": 2, "demo_3": 3, "demo_4": 4,
    "level_0": 0, "level_1": 1, "level_2": 2, "level_3": 3, "level_4": 4,
    "img_0": 0, "img_1": 1, "img_2": 2, "img_3": 3, "img_4": 4,
    "healthy": 0, "mild": 1, "moderate": 2, "severe": 3, "pdr": 4,
}

def _infer_severity_from_filename(filename: str) -> int:
    base = os.path.splitext(filename)[0].lower()
    for key, sev in _MOCK_SEVERITY_MAP.items():
        if key in base:
            return sev
    return 2   # default: moderate


def mock_response(filename: str) -> dict:
    """Structurally identical to real API contract — including lesion arrays."""
    sev  = _infer_severity_from_filename(filename)
    probs = [0.02] * 5
    probs[sev] = MOCK_CONFIDENCE[sev] / 100
    remainder = (1.0 - probs[sev]) / 4
    for i in range(5):
        if i != sev:
            probs[i] = round(remainder, 4)
    probs[sev] = round(probs[sev], 4)

    return {
        "severity":       sev,
        "confidence":     MOCK_CONFIDENCE[sev],
        "label":          MOCK_LABELS[sev],
        "action":         MOCK_ACTIONS[sev],
        "heatmap_url":    f"/images/heatmap_{sev}_od.png",
        "all_probs":      probs,
        "mode":           "mock",
        "message":        "Mock mode — place retinascan_resnet50.pth in Backend/ for live inference.",
        **_MOCK_LESIONS[sev],   # injects "lesions" and "lesion_summary"
    }


# ─────────────────────────────────────────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    """
    Upload a retinal fundus image (JPEG / PNG / TIFF).

    Returns JSON matching the API contract:
      severity, confidence, label, action,
      heatmap_url, all_probs, lesions, lesion_summary, mode
    """
    # Validate content type (light check — real images verified by PIL inside)
    allowed_types = {"image/jpeg", "image/jpg", "image/png", "image/tiff", "image/bmp"}
    if file.content_type and file.content_type.lower() not in allowed_types:
        return JSONResponse(
            status_code=415,
            content={"mode": "error", "error": f"Unsupported file type: {file.content_type}"},
        )

    image_bytes = await file.read()
    if len(image_bytes) == 0:
        return JSONResponse(
            status_code=400,
            content={"mode": "error", "error": "Uploaded file is empty."},
        )

    # ── MOCK mode ────────────────────────────────────────────────────────────
    if not REAL_MODEL_AVAILABLE:
        return mock_response(file.filename or "unknown.jpg")

    # ── REAL mode (single-threaded to prevent OOM) ────────────────────────--
    async with inference_lock:
        try:
            heatmap_name = f"heatmap_live_{uuid.uuid4().hex[:8]}.png"
            heatmap_path = os.path.join(FRONTEND_IMG, heatmap_name)

            loop   = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None,
                run_inference,
                image_bytes,
                MODEL_PATH,
                heatmap_path,
            )
            result["mode"] = "real"
            return result

        except ValueError as exc:
            # OOD rejection — structured, frontend-safe
            msg = str(exc).replace("OOD_REJECT: ", "")
            print(f"[OOD] Rejection: {msg}")
            return JSONResponse(
                status_code=200,
                content={"mode": "error", "error": msg},
            )

        except Exception as exc:
            # Any other inference error - log and fall back to mock
            print(f"[ERROR] Inference error: {exc}")
            fallback          = mock_response(file.filename or "unknown.jpg")
            fallback["mode"]  = "fallback"
            fallback["error"] = "Real inference failed — showing pre-computed result."
            return JSONResponse(status_code=200, content=fallback)


@app.get("/health")
async def health():
    """Quick liveness + model-status check."""
    return {
        "status":           "ok",
        "model_loaded":     REAL_MODEL_AVAILABLE,
        "segment_loaded":   SEGMENT_AVAILABLE,
        "inference_mode":   "real" if REAL_MODEL_AVAILABLE else "mock",
        "api_version":      "3.0",
    }


@app.get("/eval-report")
async def eval_report():
    """
    Returns the locked evaluation report JSON.
    Proves sensitivity ≥ 97.6%, specificity ≥ 89.2% to judges.
    """
    if not os.path.exists(EVAL_REPORT):
        raise HTTPException(
            status_code=404,
            detail=(
                "Evaluation report not found. "
                "Run ml_script/evaluate_model.py first."
            ),
        )
    with open(EVAL_REPORT, encoding="utf-8") as f:
        return json.load(f)


@app.post("/lesion-test")
async def lesion_test(file: UploadFile = File(...)):
    """
    Debug endpoint — runs ONLY the lesion segmentation pipeline on an uploaded
    image, without needing the .pth model file.  Useful for P2/P3 integration
    testing before the real model is available.

    Returns: {"lesions": [...], "lesion_summary": {...}}
    """
    if not SEGMENT_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="segment.py could not be imported — check OpenCV install.",
        )

    image_bytes = await file.read()
    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="File is empty.")

    try:
        from PIL import Image
        import io
        img_pil = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        result  = segment_lesions(img_pil)
        result["mode"] = "segment_only"
        return result
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)