# Backend/main.py — RetinaScan-XAI FastAPI Server
# Supports BOTH modes:
#   - REAL: loads retinascan_resnet50.pth for live inference
#   - MOCK: falls back to pre-computed heatmaps if model not present

import os
import uuid
import asyncio
import json
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

app = FastAPI(title="RetinaScan-XAI API", version="2.0")

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR      = os.path.dirname(os.path.abspath(__file__))
FRONTEND_IMG  = os.path.join(BASE_DIR, "..", "Frontend", "retinascan-app", "public", "images")
MODEL_PATH    = os.path.join(BASE_DIR, "retinascan_resnet50.pth")
EVAL_REPORT   = os.path.join(BASE_DIR, "..", "ml_script", "evaluation_report.json")

FRONTEND_IMG = os.path.normpath(FRONTEND_IMG)
os.makedirs(FRONTEND_IMG, exist_ok=True)

# ── Check if real model exists ─────────────────────────────────────────────────
REAL_MODEL_AVAILABLE = os.path.exists(MODEL_PATH)
if REAL_MODEL_AVAILABLE:
    try:
        from inference import run_inference
        print("✅ Real ResNet-50 model found — live inference enabled")
    except ImportError as e:
        REAL_MODEL_AVAILABLE = False
        print(f"⚠️  Model found but inference deps missing: {e}")
        print("   Run: pip install torch torchvision opencv-python pillow")
else:
    print("ℹ️  No model file found — running in MOCK mode")
    print(f"   To enable real inference, place retinascan_resnet50.pth in: {BASE_DIR}")

# ── Serve static images ────────────────────────────────────────────────────────
app.mount("/images", StaticFiles(directory=FRONTEND_IMG), name="images")

# ── Single-threaded inference lock (prevents OOM) ─────────────────────────────
inference_lock = asyncio.Lock()

# ── Mock fallback data ─────────────────────────────────────────────────────────
MOCK_MAP = {
    "demo_0": 0, "demo_1": 1, "demo_2": 2, "demo_3": 3, "demo_4": 4,
    "level_0": 0, "level_1": 1, "level_2": 2, "level_3": 3, "level_4": 4,
    "img_0": 0, "img_1": 1, "img_2": 2, "img_3": 3, "img_4": 4,
}
MOCK_CONFIDENCE = {0: 98.7, 1: 89.1, 2: 96.4, 3: 97.9, 4: 95.2}
MOCK_LABELS = [
    "No Apparent DR", "Mild NPDR", "Moderate NPDR",
    "Severe NPDR", "Proliferative DR"
]
MOCK_ACTIONS = [
    "Routine Annual Screening", "Review in 6–12 Months",
    "Specialist Triage Required", "Urgent Specialist Referral",
    "Emergency Laser / Surgical Review"
]

def mock_response(filename: str):
    base = filename.split(".")[0].lower()
    sev  = 2  # default to moderate
    for key, val in MOCK_MAP.items():
        if key in base:
            sev = val
            break
    return {
        "severity":    sev,
        "confidence":  MOCK_CONFIDENCE[sev],
        "label":       MOCK_LABELS[sev],
        "action":      MOCK_ACTIONS[sev],
        "heatmap_url": f"/images/heatmap_{sev}_od.jpg",
        "mode":        "mock",
        "message":     "Mock mode — place retinascan_resnet50.pth in Backend/ for live inference",
    }

# ─────────────────────────────────────────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    """
    Upload a fundus image for DR grading.
    Returns severity (0–4), confidence, label, and heatmap URL.
    """
    image_bytes = await file.read()

    if not REAL_MODEL_AVAILABLE:
        return mock_response(file.filename)

    # Real inference (single-threaded to cap RAM usage)
    async with inference_lock:
        try:
            heatmap_name = f"heatmap_live_{uuid.uuid4().hex[:8]}.jpg"
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

        except Exception as e:
            print(f"❌ Inference error: {e}")
            if "OOD_REJECT" in str(e):
                return {"error": str(e).replace("OOD_REJECT: ", ""), "mode": "error"}
                
            # Graceful fallback to mock on any error
            fallback = mock_response(file.filename)
            fallback["error"]   = str(e)
            fallback["mode"]    = "fallback"
            return fallback


@app.get("/health")
async def health():
    return {
        "status":          "ok",
        "model_loaded":    REAL_MODEL_AVAILABLE,
        "inference_mode":  "real" if REAL_MODEL_AVAILABLE else "mock",
    }


@app.get("/eval-report")
async def eval_report():
    """Returns the evaluation report JSON (sensitivity/specificity proof)."""
    if not os.path.exists(EVAL_REPORT):
        raise HTTPException(
            status_code=404,
            detail="Evaluation report not found. Run ml_script/evaluate_model.py first."
        )
    with open(EVAL_REPORT) as f:
        return json.load(f)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)