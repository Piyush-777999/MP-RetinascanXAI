# RetinaScan-XAI

**Explainable AI-Powered Diabetic Retinopathy Screening for Rural India**
Smart India Hackathon 2026 · Problem Statement PS38 · Sponsored by MathWorks

---

## Overview

RetinaScan-XAI is a point-of-care clinical decision support system designed for primary health centres (PHCs) in rural India. It enables ANMs and AYUSH doctors with no ophthalmology training to perform automated, explainable Diabetic Retinopathy (DR) screening using a standard fundus camera.

**Key capabilities:**
- Automated 5-class DR grading (ICDR 0–4) using a fine-tuned ResNet-50
- Grad-CAM++ explainability overlay highlighting the lesion regions
- CLAHE + Ben Graham preprocessing to standardise low-quality rural camera images
- Image Quality Assessment (IQA) gate before inference
- Out-of-Distribution (OOD) rejection to block non-fundus images
- Clinical PACS-style workstation UI with lesion pins, confidence scores, and referral letters
- Offline-capable — no internet required at the clinic

**Clinical performance on APTOS 2019 validation set (733 images):**

| Metric | Value | SIH Target |
|--------|-------|------------|
| Sensitivity (Referable DR) | **97.6%** | ≥ 90% ✅ |
| Specificity | **89.2%** | ≥ 85% ✅ |
| AUC-ROC | **0.978** | — |
| Overall 5-class Accuracy | **79.4%** | — |
| Decision Threshold | **0.1162** (Youden's J) | — |

---

## Repository Structure

```
retinascan-xai/
│
├── README.md                          # This file
├── .gitignore
├── model_link.txt                     # Google Drive link to trained .pth weights
├── install_deps.bat                   # One-click dependency installer (Windows)
├── start_backend.bat                  # One-click backend server start
├── start_frontend.bat                 # One-click frontend server start
│
├── ml_script/                         # P1 — ML Engineer
│   ├── train_model.py                 # ResNet-50 training loop on APTOS 2019
│   ├── evaluate_model.py              # Generates sensitivity/specificity/AUC report
│   ├── messidor_test.py               # External validation on MESSIDOR-2 dataset
│   ├── visualise_metrics.py           # ROC curve + confusion matrix plots
│   ├── evaluation_report.json         # Final metrics output (served by backend)
│   └── matlab/
│       ├── segment_lesions.m          # MATLAB lesion segmentation (MathWorks toolkit)
│       └── README.md                  # How to run MATLAB scripts
│
├── Backend/                           # P2 — Backend Engineer
│   ├── main.py                        # FastAPI server — /upload, /health, /eval-report
│   ├── inference.py                   # ResNet-50 forward pass + Grad-CAM + CLAHE + OOD
│   └── requirements.txt              # Python dependencies
│
└── Frontend/
    └── retinascan-app/                # P3 — Frontend Engineer
        ├── index.html
        ├── vite.config.js
        ├── package.json
        └── src/
            ├── App.jsx                # Root: navigation state machine + API fetch
            ├── data.js                # Mock data schema (shared source of truth)
            ├── index.css              # Global design tokens (colors, fonts, shadows)
            └── components/
                ├── Home.jsx           # Landing screen — 3 module layout
                ├── Upload.jsx         # Patient intake form — 2 column layout
                ├── QualityCheck.jsx   # IQA gate — 3 animated progress bars
                ├── Processing.jsx     # Inference animation — conic ring + checklist
                ├── Results.jsx        # Clinical results viewer with probability bars
                ├── Canvas.jsx         # PACS workstation — lesion pins + Grad-CAM overlay
                ├── Queue.jsx          # Patient review queue
                ├── Referral.jsx       # Auto-generated referral letter
                └── Admin.jsx          # Analytics dashboard — capacity + throughput
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| ML Model | ResNet-50 (PyTorch, APTOS 2019 fine-tuned) |
| Explainability | Grad-CAM++ (layer4 of ResNet-50) |
| Preprocessing | CLAHE + Ben Graham Normalization (OpenCV) |
| OOD Detection | Heuristic fundus signature validation |
| Backend | FastAPI + Uvicorn |
| Frontend | React 18 + Vite |
| Styling | Vanilla CSS (glass-morphism, dark-navy design system) |
| MATLAB Integration | MathWorks Image Processing Toolbox (lesion segmentation) |

---

## Setup & Running

### Prerequisites

- Python 3.10+
- Node.js 18+
- MATLAB R2023b+ (optional, for lesion segmentation only)

### 1. Install Dependencies

```bash
.\install_deps.bat
```

Or manually:
```bash
# Python
pip install torch torchvision fastapi uvicorn opencv-python pillow scikit-learn pandas matplotlib

# Node
cd Frontend/retinascan-app
npm install
```

### 2. Get the Model Weights

Download `retinascan_resnet50.pth` from the link in `model_link.txt` and place it in `Backend/`.

If no model is present, the backend automatically runs in **mock mode** with pre-computed heatmaps — the frontend works identically.

### 3. Start the Application

```bash
.\start_backend.bat     # Terminal 1 — FastAPI on http://localhost:8000
.\start_frontend.bat    # Terminal 2 — React on http://localhost:5173
```

Then open **http://localhost:5173** in your browser.

### Demo Reset

Press `Ctrl + Shift + R` at any time to reset the entire demo flow back to the home screen.

---

## API Reference

### `POST /upload`
Upload a fundus image for DR grading.

**Response:**
```json
{
  "severity":    2,
  "confidence":  96.4,
  "label":       "Moderate NPDR",
  "action":      "Specialist Triage Required",
  "heatmap_url": "/images/heatmap_live_abc123.jpg",
  "all_probs":   [0.01, 0.05, 0.72, 0.14, 0.08],
  "mode":        "real"
}
```

If a non-fundus image is uploaded (OOD rejection):
```json
{
  "mode":  "error",
  "error": "No circular retinal mask detected (Corners too bright)."
}
```

### `GET /health`
Returns server status and model load state.

### `GET /eval-report`
Returns the full `evaluation_report.json` — sensitivity, specificity, AUC, confusion matrix.

---

## Inference Pipeline

```
Raw Fundus Image
      │
      ▼
OOD Validation (corner + color check)
      │
      ▼
CLAHE (LAB color space, clipLimit=2.0)
      │
      ▼
Ben Graham Normalization (GaussianBlur blend)
      │
      ▼
ResNet-50 Forward Pass (224×224)
      │
      ▼
Softmax → argmax → Severity Grade (0–4)
      │
      ▼
Grad-CAM++ (layer4) → Heatmap overlay
      │
      ▼
Binary Referable DR: sum(P2+P3+P4) ≥ 0.1162 → Refer
```

---

## Development Guide

### Team Roles

| Person | Role | Owns |
|--------|------|------|
| P1 | ML Engineer | `ml_script/` |
| P2 | Backend Engineer | `Backend/` |
| P3 | Frontend Engineer | `Frontend/` |

### Week-by-Week Plan

#### Week 1 — Foundation *(All Independent)*

| | P1 | P2 | P3 |
|--|----|----|-----|
| **Goal** | Working training loop | Server + mock mode | Home + Upload screens |
| **Deliverable** | `train_model.py` runs 1 epoch | `/upload` returns mock JSON | React app on `localhost:5173` |

#### Week 2 — Core Pipeline *(One Soft Dependency)*

| | P1 | P2 | P3 |
|--|----|----|-----|
| **Goal** | Full training + evaluation | Real inference wired | IQA + Processing animations |
| **Deliverable** | `.pth` on Drive + `evaluation_report.json` | `inference.py` with CLAHE + Grad-CAM | `QualityCheck.jsx`, `Processing.jsx` |

> P2 uses a dummy random model until P1 drops the `.pth`. No blocking.

#### Week 3 — Clinical UI + Integration *(Connect at end of week)*

| | P1 | P2 | P3 |
|--|----|----|-----|
| **Goal** | External validation | API polish + eval endpoint | Results + Canvas + Queue |
| **Deliverable** | MESSIDOR-2 results + ROC plots | `/eval-report` endpoint | `Results.jsx`, `Canvas.jsx`, `Queue.jsx` |

> Integration happens once at end of Week 3. P2 and P3 meet for 1 hour to connect the API.

#### Week 4 — Polish + Demo Prep

| | P1 | P2 | P3 |
|--|----|----|-----|
| **Goal** | Locked metrics + judge prep | Server hardening | Referral + Admin + final polish |
| **Deliverable** | Locked `evaluation_report.json` + slides | OOD tuning, inference lock | `Referral.jsx`, `Admin.jsx`, demo reset |

### Ground Rules

1. **`data.js` schema is frozen** — P2's API response keys must match exactly
2. **Model weights go on Google Drive, not Git** — add the link to `model_link.txt`
3. **Commit per feature, not per day** — branches: `ml/training`, `backend/inference`, `frontend/ui`
4. **P2 always returns valid JSON** — frontend must never see a raw Python traceback
5. **Demo threshold is `0.1162` — locked** — this is what gives 97.6% sensitivity

---

## Dataset

- **Primary training:** [APTOS 2019 Blindness Detection](https://www.kaggle.com/competitions/aptos2019-blindness-detection) — 3,662 images
- **External validation:** MESSIDOR-2 — 1,748 images
- **Preprocessing:** CLAHE + Ben Graham normalization (matches MATLAB training pipeline)

> The dataset is not included in this repository. Download from Kaggle and place in `DataSet/aptos2019-blindness-detection/`.

---

## License

This project is developed for SIH 2026. All rights reserved by the team.

---

*RetinaScan-XAI — Bringing specialist-level eye care to every PHC in India.*
