# API Contract Document

**RetinaScan-XAI: Frontend-Backend Integration Specification**

Version: 1.0 | Status: FROZEN (Do not modify without team lead approval)

---

## Overview

This document defines the exact JSON contract between the Backend (P2) and Frontend (P3). Both parties must implement against this spec from Day 1. The Backend must always return these exact keys. The Frontend must only read these keys.

**Base URL:** `http://localhost:8000`

---

## Endpoints

### 1. `POST /upload`

Upload a fundus image for DR grading.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: Form field `file` containing the image (JPEG/PNG)

**Success Response (200):**
```json
{
  "severity":    2,
  "confidence":  96.4,
  "label":       "Moderate NPDR",
  "action":      "Specialist Triage Required",
  "heatmap_url": "/images/heatmap_live_abc123.jpg",
  "all_probs":   [0.01, 0.05, 0.72, 0.14, 0.08],
  "mode":        "real",
  "lesions": [
    { "type": "microaneurysm", "bbox": [120, 88, 134, 101], "area_px": 87, "confidence": 0.82 },
    { "type": "hemorrhage",    "bbox": [200, 150, 240, 185], "area_px": 620, "confidence": 0.74 },
    { "type": "exudate",       "bbox": [90, 170, 130, 200],  "area_px": 450, "confidence": 0.91 }
  ],
  "lesion_summary": {
    "microaneurysm_count": 5,
    "hemorrhage_count": 2,
    "exudate_count": 3,
    "total_lesion_area_px": 2340
  }
}
```

**Field Definitions:**

| Field | Type | Description |
|-------|------|-------------|
| `severity` | int (0-4) | ICDR severity level |
| `confidence` | float | Top-class probability as percentage (0-100) |
| `label` | string | Human-readable severity label |
| `action` | string | Clinical action recommendation |
| `heatmap_url` | string | Relative URL to the Grad-CAM overlay image |
| `all_probs` | float[5] | Softmax probabilities for all 5 classes [L0, L1, L2, L3, L4] |
| `mode` | string | `"real"` (live inference), `"mock"` (pre-computed fallback) |
| `lesions` | array | List of detected lesion objects (see below) |
| `lesion_summary` | object | Aggregate lesion counts and total area |

**Lesion Object Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `type` | string | `"microaneurysm"`, `"hemorrhage"`, or `"exudate"` |
| `bbox` | int[4] | Bounding box `[x1, y1, x2, y2]` in pixel coordinates (224x224 space) |
| `area_px` | int | Lesion area in pixels |
| `confidence` | float | Detection confidence (0.0 - 1.0) based on morphological feature strength |

**Lesion Summary Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `microaneurysm_count` | int | Number of detected microaneurysms |
| `hemorrhage_count` | int | Number of detected hemorrhages |
| `exudate_count` | int | Number of detected exudates |
| `total_lesion_area_px` | int | Combined pixel area of all lesions |

**Severity Labels & Actions:**

| severity | label | action |
|----------|-------|--------|
| 0 | No Apparent DR | Routine Annual Screening |
| 1 | Mild NPDR | Review in 6-12 Months |
| 2 | Moderate NPDR | Specialist Triage Required |
| 3 | Severe NPDR | Urgent Specialist Referral |
| 4 | Proliferative DR | Emergency Laser / Surgical Review |

**OOD Rejection Response (200, mode=error):**
```json
{
  "mode":  "error",
  "error": "No circular retinal mask detected (Corners too bright)."
}
```

Frontend behavior on `mode === "error"`:
- Show browser alert with `error` message
- Abort pipeline animations
- Return user to Upload screen

**Mock Fallback Response (200, mode=mock):**
```json
{
  "severity":    2,
  "confidence":  96.4,
  "label":       "Moderate NPDR",
  "action":      "Specialist Triage Required",
  "heatmap_url": "/images/heatmap_2_od.jpg",
  "all_probs":   [0.01, 0.05, 0.72, 0.14, 0.08],
  "mode":        "mock"
}
```

Returned when no `.pth` model file is present. Frontend treats it identically to `"real"` mode.

---

### 2. `GET /health`

Check server status and model availability.

**Response (200):**
```json
{
  "status":       "ok",
  "model_loaded": true,
  "inference_mode": "real"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | `"ok"` if server is running |
| `model_loaded` | bool | `true` if `.pth` file is loaded |
| `inference_mode` | string | `"real"` or `"mock"` |

---

### 3. `GET /eval-report`

Returns the full model evaluation metrics.

**Response (200):**
```json
{
  "model": "RetinaScan-XAI ResNet-50 Fine-Tuned",
  "dataset": "APTOS 2019 Blindness Detection",
  "validation_set": 733,
  "overall_accuracy": 0.794,
  "binary_referable_dr": {
    "definition": "Positive = ICDR Level 2, 3, or 4",
    "optimal_threshold": 0.1162,
    "threshold_method": "Youden's J index",
    "sensitivity": 0.9765,
    "specificity": 0.892,
    "ppv": 0.8609,
    "npv": 0.9823,
    "f1_score": 0.9151,
    "auc_roc": 0.9783,
    "confusion_matrix": {
      "true_positive": 291,
      "true_negative": 388,
      "false_positive": 47,
      "false_negative": 7
    }
  },
  "benchmark_targets_met": {
    "sensitivity_90_percent": true,
    "specificity_85_percent": true
  }
}
```

---

### 4. `GET /images/{filename}`

Serves static heatmap images generated during inference.

**Response:** JPEG image file (served via FastAPI StaticFiles mount).

---

## CORS Configuration

Backend must include the following CORS headers to allow frontend (localhost:5173) to fetch:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Error Handling Rules

1. Backend must NEVER return a raw Python traceback to the frontend.
2. All errors must be returned as valid JSON with `"mode": "error"` and an `"error"` string.
3. Frontend must check `response.mode` before accessing any other fields.
4. If `fetch()` itself fails (network error), frontend shows "Backend not running" alert.

---

## Schema Source of Truth

The mock data schema in `Frontend/retinascan-app/src/data.js` defines the canonical field names. Backend response keys must exactly match the keys used in `data.js`. Any schema change requires team lead approval.
