# API Contract Document

**RetinaScan-XAI: Clinical Workstation & In-Silico XAI Backend Specification**

**Version:** 3.0 | **Status:** PRODUCTION FROZEN | **Base URL:** `http://localhost:8000`

---

## 1. Architectural Overview

The RetinaScan-XAI Backend exposes a high-performance, asynchronous REST API powered by **FastAPI** and **PyTorch**. The server operates in two modes:
1. **REAL MODE (`mode: "real"`):** Activated when `ml_script/retinascan_resnet50_v2.pth` (or `Backend/retinascan_resnet50.pth`) is present. Executes live deep learning inference, Grad-CAM saliency extraction, computer vision lesion segmentation, automated ETDRS 9-zone macular grid calculations, and in-silico laser counterfactual simulation.
2. **MOCK MODE (`mode: "mock"`):** Fallback mode when model weights are not loaded. Returns structurally identical clinical payloads so frontend testing and UI development can proceed without GPU/heavy weights.

---

## 2. API Endpoints Summary

| Method | Endpoint | Description | Request Type | Response Mode |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/upload` | Full diagnostic screening pipeline (IQA, ResNet-50 grading, Grad-CAM, lesion segmentation, ETDRS grid) | `multipart/form-data` | `real` / `mock` / `error` |
| `POST` | `/counterfactual-laser` | In-silico laser photocoagulation ablation, Telea inpainting, re-inference & causal $\Delta P$ attribution | `application/json` | `json` |
| `POST` | `/etdrs-profile` | Fovea-centered ETDRS 9-zone macular grid calculation and CSME threat stratification | `application/json` | `json` |
| `POST` | `/lesion-test` | Diagnostic computer vision lesion segmentation without deep learning model | `multipart/form-data` | `segment_only` |
| `GET` | `/health` | Server liveness, model load state, and hardware execution status | None | `json` |
| `GET` | `/eval-report` | Locked multi-center clinical validation metrics (ResNet-50 v2 / APTOS + MESSIDOR-2) | None | `json` |
| `GET` | `/images/{filename}` | Static file server for generated Grad-CAMs, treated scans, and upload artifacts | None | Image Binary |

---

## 3. Detailed Endpoint Specifications

### 3.1 `POST /upload`
Submits a retinal fundus photograph for clinical quality assessment, diabetic retinopathy grading, Grad-CAM generation, pathological lesion detection, and macular edema staging.

#### Request
- **Headers:** `Content-Type: multipart/form-data`
- **Body:** `file: <binary image file>` (JPEG, PNG, BMP, TIFF)

#### Success Response (`200 OK`, `mode: "real"` or `"mock"`)
```json
{
  "severity": 2,
  "confidence": 96.4,
  "label": "Moderate NPDR",
  "action": "Specialist Triage Required",
  "heatmap_url": "/images/heatmap_live_762fe0ec.png",
  "image_url": "/images/scan_live_762fe0ec.jpg",
  "all_probs": [0.0002, 0.0095, 0.9097, 0.0170, 0.0636],
  "mode": "real",
  "lesions": [
    {
      "id": 1,
      "type": "microaneurysm",
      "bbox": [120, 88, 134, 101],
      "area_px": 87,
      "confidence": 0.82
    },
    {
      "id": 2,
      "type": "hemorrhage",
      "bbox": [200, 150, 240, 185],
      "area_px": 620,
      "confidence": 0.74
    },
    {
      "id": 3,
      "type": "exudate",
      "bbox": [90, 170, 130, 200],
      "area_px": 450,
      "confidence": 0.91
    }
  ],
  "lesion_summary": {
    "microaneurysm_count": 5,
    "hemorrhage_count": 2,
    "exudate_count": 3,
    "total_lesion_area_px": 2340
  },
  "etdrs_profile": {
    "eye": "od",
    "fovea": { "x_pct": 50.0, "y_pct": 50.0 },
    "csme_risk": "HIGH",
    "csme_classification": "Center-Involved Diabetic Macular Edema (CI-DME)",
    "closest_exudate_microns": 320.5,
    "sector_counts": {
      "CSF": 1,
      "IS": 1,
      "IN": 0,
      "II": 1,
      "IT": 0,
      "OS": 0,
      "ON": 0,
      "OI": 0,
      "OT": 0,
      "Peripheral": 0
    },
    "urgent_referral_recommended": true
  },
  "ood_warnings": []
}
```

#### Out-of-Distribution Rejection Response (`200 OK`, `mode: "error"`)
If the image fails the physiological fundus gatekeeper (e.g. non-retinal image, severe glare, document screenshot, missing blood vessels):
```json
{
  "mode": "error",
  "error": "Image lacks characteristic retinal melanin pigment (R/B ratio 1.12 < 1.70). Please upload a valid retinal scan."
}
```

---

### 3.2 `POST /counterfactual-laser`
Simulates clinical laser photocoagulation (argon 532nm green laser) or lesion ablation on targeted pathologies. Replaces diseased retinal pigment epithelium with healthy tissue via biophysical Telea inpainting, executes re-inference through the ResNet-50 backbone, generates counterfactual Grad-CAM, and calculates causal attribution metrics.

#### Request (`application/json`)
```json
{
  "image_identifier": "/images/img_2_od.jpg",
  "original_severity": 2,
  "original_probs": [0.0002, 0.0095, 0.9097, 0.0170, 0.0636],
  "ablated_lesions": [
    {
      "id": 1,
      "type": "hemorrhage",
      "x": 48.5,
      "y": 32.1,
      "area_px": 620,
      "bbox": [200, 150, 240, 185]
    }
  ],
  "laser_spots": [
    {
      "x": 52.0,
      "y": 34.0,
      "radius": 18.0
    }
  ]
}
```

#### Response (`200 OK`)
```json
{
  "success": true,
  "counterfactual": {
    "severity": 1,
    "label": "Mild NPDR",
    "confidence": 78.4,
    "probs": [0.0120, 0.7840, 0.1420, 0.0380, 0.0240],
    "heatmap_url": "/images/heatmap_laser_a98df2c1.png",
    "treated_image_url": "/images/laser_treated_a98df2c1.jpg",
    "lesions": [],
    "lesion_summary": {
      "microaneurysm_count": 1,
      "hemorrhage_count": 0,
      "exudate_count": 1,
      "total_lesion_area_px": 510
    }
  },
  "causal_metrics": {
    "probability_delta_pct": -24.8,
    "causal_attribution_score": 82.5,
    "causal_strength": "Decisive Causal Role",
    "grade_shift": "Down-staged from Grade 2 → Grade 1",
    "clinical_verdict": "Causal Validation Confirmed: In-silico ablation of targeted lesions reduced Grade 2 probability by 24.8%."
  }
}
```

---

### 3.3 `POST /etdrs-profile`
Calculates sub-millimeter concentric zone distributions and Clinically Significant Macular Edema (CSME) risk using the standard ETDRS 9-zone layout.

#### Request (`application/json`)
```json
{
  "lesions": [
    { "type": "exudate", "bbox": [230, 240, 250, 260], "area_px": 280 }
  ],
  "fovea_x": 50.0,
  "fovea_y": 50.0,
  "eye": "od"
}
```

#### Response (`200 OK`)
```json
{
  "eye": "od",
  "fovea": { "x_pct": 50.0, "y_pct": 50.0 },
  "csme_risk": "HIGH",
  "csme_classification": "Center-Involved Diabetic Macular Edema (CI-DME)",
  "closest_exudate_microns": 420.0,
  "sector_counts": {
    "CSF": 1,
    "IS": 0,
    "IN": 0,
    "II": 0,
    "IT": 0,
    "OS": 0,
    "ON": 0,
    "OI": 0,
    "OT": 0,
    "Peripheral": 0
  },
  "urgent_referral_recommended": true
}
```

---

### 3.4 `POST /lesion-test`
Standalone diagnostic endpoint to test morphological lesion segmentation without loading the deep neural network.

#### Request
- **Headers:** `Content-Type: multipart/form-data`
- **Body:** `file: <binary image>`

#### Response (`200 OK`)
```json
{
  "mode": "segment_only",
  "lesions": [
    { "type": "microaneurysm", "bbox": [110, 95, 122, 107], "area_px": 78, "confidence": 0.81 }
  ],
  "lesion_summary": {
    "microaneurysm_count": 1,
    "hemorrhage_count": 0,
    "exudate_count": 0,
    "total_lesion_area_px": 78
  }
}
```

---

### 3.5 `GET /health`
Returns system status, model availability, and active inference configuration.

#### Response (`200 OK`)
```json
{
  "status": "ok",
  "model_loaded": true,
  "segment_loaded": true,
  "inference_mode": "real",
  "api_version": "3.0"
}
```

---

### 3.6 `GET /eval-report`
Returns the frozen multi-center clinical validation metrics (ResNet-50 v2, evaluated across held-out sets of APTOS 2019 and MESSIDOR-2).

#### Response (`200 OK`)
```json
{
  "model": "RetinaScan-XAI ResNet-50 v2",
  "note": "Trained on 80% of APTOS and 80% of MESSIDOR independently. Val 20% held-out for evaluation.",
  "datasets": [
    "APTOS 2019 (3662 images)",
    "MESSIDOR-2 (1744 gradable images)"
  ],
  "train_count": 4324,
  "validation_set": 1082,
  "overall_accuracy": 0.72,
  "binary_referable_dr": {
    "definition": "Positive = ICDR Level 2, 3, or 4",
    "optimal_threshold": 0.1657,
    "threshold_method": "Youden's J index on ROC curve",
    "sensitivity": 0.9332,
    "specificity": 0.8615,
    "ppv": 0.7908,
    "npv": 0.9583,
    "f1_score": 0.8561,
    "auc_roc": 0.9702,
    "confusion_matrix": {
      "true_positive": 363,
      "true_negative": 597,
      "false_positive": 96,
      "false_negative": 26
    }
  },
  "benchmark_targets_met": {
    "sensitivity_90_percent": true,
    "specificity_85_percent": true
  }
}
```

---

## 4. ICDR Standard Severity Mapping

| Grade | Clinical Label | Recommended Clinical Action | Priority |
| :---: | :--- | :--- | :---: |
| **0** | No Apparent DR | Routine Annual Screening | Normal |
| **1** | Mild NPDR | Review in 6–12 Months | Routine |
| **2** | Moderate NPDR | Specialist Triage Required (14–30 Days) | Priority |
| **3** | Severe NPDR | Urgent Specialist Referral (within 7 Days) | Urgent |
| **4** | Proliferative DR | Emergency Laser / Surgical Review (24–48 Hours) | Emergency |

---

## 5. Middleware & Safeguards

1. **CORS:** Configured for local development (`allow_origins=["*"]`).
2. **Concurrency Serialization:** Enforced via `asyncio.Lock()` to ensure inference executes sequentially and caps system RAM usage under 3GB.
3. **Structured Error Handling:** All errors return HTTP 200 with `{"mode": "error", "error": "..."}` or HTTP 415 for unsupported media types. Raw Python tracebacks are never leaked to the client.
