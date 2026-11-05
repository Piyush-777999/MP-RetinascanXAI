# RetinaScan-XAI — Development, Architecture & Operations Guide

**Explainable AI Clinical Decision Support System for Point-of-Care Ophthalmology**  
**Engineering Guide · System Architecture · Operations Runbook · Version 3.0**

---

## 1. Architectural History & Problem-Solution Matrix

During early iterations of RetinaScan-XAI, several architectural bottlenecks were identified. The table below documents each challenge, its root cause, and how it was systematically resolved in Version 3.0:

| # | Identified Bottleneck | Clinical / Engineering Risk | Root Cause | Implemented Solution in v3.0 | Status |
| :-: | :--- | :--- | :--- | :--- | :---: |
| **1** | **Train / Inference Preprocessing Mismatch** | Subtle feature distortion and degraded live accuracy | Inference applied CLAHE/Ben-Graham while training initially used raw images | Extracted single source of truth into `ml_script/preprocess.py`. Inference strictly uses `val_transforms` (resize + normalize) matching training. | ✅ Resolved |
| **2** | **Data Leakage in Evaluation** | Artificially inflated sensitivity/specificity metrics | Re-splitting datasets with `train_test_split` risked subtle split shifts | Created `ml_script/split_dataset.py`, freezing `train_ids.csv`, `val_ids.csv`, and `val_ids_v2.csv` permanently on disk. | ✅ Resolved |
| **3** | **Decision Threshold Inconsistency** | Training logged 0.50 threshold while evaluation used Youden's J | Hardcoded binary cutoff during training epochs | Standardized Youden's J Index optimization on validation ROC curve (`0.1657` for v2 multi-center). | ✅ Resolved |
| **4** | **Fragile OOD Heuristics** | False rejections of real scans or failure to reject non-medical photos | Primitive corner brightness & red-ratio checks | Engineered multi-stage chromatic, structural (Hough orthogonal lines), vascular, and confidence gatekeeper in `inference.py`. | ✅ Resolved |
| **5** | **Duplicated Model Architecture** | Cryptic `state_dict` mismatch errors across scripts | `build_model()` copy-pasted across 4 separate files | Centralized `build_model()` exclusively in `ml_script/model.py`. All training, testing, and backend modules import from here. | ✅ Resolved |
| **6** | **Grad-CAM Hook Memory Leak** | Server memory growth and progressive latency degradation | Forward/backward hooks accumulated on singleton model | Refactored `GradCAMSimple` to register hooks per request and guarantee `h.remove()` inside a `finally` block. | ✅ Resolved |
| **7** | **Camera Sensor Optical Cropping** | Slicing 34% off wide-angle fundus photos, obscuring optic disc | Fixed circular viewports using `object-fit: cover` | Built reactive `imgBounds` letterbox calculation in `Results.jsx` and `Canvas.jsx`, locking all overlays to the true sensor ratio. | ✅ Resolved |

---

## 2. Production System Architecture

RetinaScan-XAI employs a decoupled 3-tier architecture optimized for edge devices (standard clinic laptops) without requiring cloud connectivity:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENT / BROWSER RUNTIME                        │
│                                                                        │
│  React 18 + Vite (SPA) · Tailwind & Custom Design System               │
│  ├── Doctor PACS Console (Zoom, Pan, ETDRS Grid, Red-Free Filter)      │
│  ├── In-Silico Laser Counterfactual Studio (Canvas 2D / Event Hooks)   │
│  ├── ASHA Patient Counselor (Web Speech API TTS, Multi-Language Dics)  │
│  └── Storage Engine (HTML5 LocalStorage Intake Persistence)            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / JSON (REST)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        FASTAPI BACKEND RUNTIME                         │
│                                                                        │
│  Asynchronous ASGI Web Engine (Uvicorn / Port 8000)                    │
│  ├── Concurrency Lock (asyncio.Lock — Single-threaded Inference Cap)   │
│  ├── Static File Server (FastAPI StaticFiles — Generated Heatmaps)     │
│  └── Multi-Endpoint Routing Controller (/upload, /counterfactual, etc) │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Memory Buffers
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       DEEP LEARNING & CV ENGINE                        │
│                                                                        │
│  PyTorch 2.2+ (CPU / CUDA 12.1 Auto-Detection)                         │
│  ├── ResNet-50 v2 Backbone (Multi-Center Trained: APTOS + MESSIDOR)    │
│  ├── Grad-CAM Engine (layer4[-1] gradient hooks with auto-cleanup)     │
│  ├── Morphological Lesion Segmentor (OpenCV Otsu, Black-hat, Top-hat)  │
│  ├── In-Silico Biophysical Inpainting Engine (Fast Marching Telea)     │
│  └── ETDRS 9-Zone Macular Spatial Geometry & CSME Risk Engine          │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Core Modules & Engineering Specifications

### 3.1 Unified Model Architecture (`ml_script/model.py`)
`build_model()` is defined exclusively here:
```python
def build_model(num_classes: int = 5) -> nn.Module:
    model = models.resnet50(weights=models.ResNet50_Weights.DEFAULT)
    in_features = model.fc.in_features  # 2048 for ResNet-50
    model.fc = nn.Sequential(
        nn.Dropout(0.4),
        nn.Linear(in_features, 512),
        nn.ReLU(),
        nn.Dropout(0.3),
        nn.Linear(512, num_classes),
    )
    return model
```

### 3.2 Unified Image Transforms (`ml_script/preprocess.py`)
- **Training Pipeline (`train_transforms`):**
  Resize to $256 \times 256 \to$ RandomCrop($224 \times 224$) $\to$ Horizontal & Vertical Flips $\to$ Rotation($20^\circ$) $\to$ ColorJitter $\to$ ImageNet Normalization.
- **Validation & Live Inference Pipeline (`val_transforms`):**
  Direct resize to $224 \times 224 \to$ ToTensor $\to$ ImageNet Normalization. Ensures live inference strictly mirrors the validation distribution.

### 3.3 Multi-Center Training Pipeline (`ml_script/train_classifier_v2.py`)
- **Datasets Combined:** APTOS 2019 ($3,662$ images) + MESSIDOR-2 ($1,744$ gradable images) = $5,406$ total images.
- **Data Partitions:** $4,324$ training images ($80\%$) and $1,082$ held-out validation images ($20\%$).
- **Optimization:** Mixed-precision training (torch.cuda.amp), AdamW optimizer ($\text{lr} = 10^{-4}$, $\text{weight\_decay} = 10^{-4}$), checkpointing every 5 epochs.
- **Held-Out Validation Results (`evaluation_report_v2.json`):**
  - **Sensitivity (Referable DR):** **93.32%** (363 / 389 positive cases detected).
  - **Specificity (Referable DR):** **86.15%** (597 / 693 non-referable cases cleared).
  - **AUC-ROC:** **0.9702**.
  - **Negative Predictive Value (NPV):** **95.83%**.
  - **Optimal Decision Threshold:** **`0.1657`** via Youden's J Index.

### 3.4 In-Silico Laser Counterfactual XAI (`Backend/counterfactual.py`)
Enables clinicians to test whether suspect lesions causally caused the deep network's prediction:
1. Clinician selects lesion markers or freehand coordinates.
2. System builds an ablation mask $M$.
3. Telea Fast Marching inpainting (`cv2.inpaint`) reconstructs healthy retinal pigment epithelium (RPE) with argon photocoagulation blanching rings.
4. ResNet-50 v2 executes a live forward pass on the treated scan.
5. Computes probability drop $\Delta P = P_{\text{treated}}[g] - P_{\text{baseline}}[g]$ and Causal Attribution Score (CAS).

### 3.5 Automated ETDRS 9-Zone Macular Grid & CSME Profiler (`Backend/etdrs.py`)
- Digitizes the Early Treatment Diabetic Retinopathy Study 9-zone layout.
- Spatial Calibration: $1\%$ coordinate space on a 45° fundus scan corresponds to **$150\,\mu m$**.
- Central Foveal Subfield (CSF): Diameter $1\,\text{mm}$ ($r = 500\,\mu m$).
- Inner Ring: Diameter $3\,\text{mm}$ ($r = 1500\,\mu m$: IS, IN, II, IT).
- Outer Ring: Diameter $6\,\text{mm}$ ($r = 3000\,\mu m$: OS, ON, OI, OT).
- Automatic Nasal/Temporal laterality mirroring between OD (Right Eye) and OS (Left Eye).
- CSME Risk Engine: Flags **High Risk (Center-Involved)** if hard exudates are within $500\,\mu m$ of fovea, mandating immediate 7–14 day specialist OCT referral.

### 3.6 Anatomical Lesion Segmentation (`Backend/segment.py`)
- Retinal FOV boundary masking ($15\times 15$ elliptical structuring element).
- Optic Disc localization & $55\,\text{px}$ exclusion zone to avoid false exudate triggers.
- Retinal vascular tree extraction & $5\,\text{px}$ dilation to prevent capillary junctions from registering as microaneurysms.
- Connected component morphological analysis:
  - Microaneurysms: Area $8-120\,\text{px}^2$, circularity $c \ge 0.55$.
  - Hemorrhages: Area $120-2500\,\text{px}^2$, circularity $c \ge 0.20$.
  - Hard Exudates: Green channel top-hat filtering, area $15-3000\,\text{px}^2$.
- Grade-Aware Harmonization: Enforces zero lesions on Grade 0 (No DR) scans per ICDR standard.

---

## 4. Developer Setup & Operations Runbook

### 4.1 Prerequisites
- **Operating System:** Windows 10/11, Linux, or macOS
- **Python:** Version 3.10 or 3.11
- **Node.js:** Version 18.0 or higher
- **Hardware:** Standard CPU (min 4 cores, 8GB RAM) or NVIDIA GPU with CUDA 12.1+

### 4.2 Installation via Automated Batch Scripts (Windows)
Double-click `install_deps.bat` or run:
```bat
REM Step 1: Install Python dependencies
cd Backend
pip install -r requirements.txt

REM Step 2: Install Frontend dependencies
cd ..\Frontend\retinascan-app
npm install
```

### 4.3 Running the Services

#### Option A: One-Click Batch Launchers
- Backend: Double-click `start_backend.bat` (launches FastAPI on `http://localhost:8000`).
- Frontend: Double-click `start_frontend.bat` (launches Vite on `http://localhost:5173`).

#### Option B: Manual CLI Commands
**Terminal 1 (Backend):**
```bash
cd Backend
python main.py
```
*Verify output:*
```
[OK] Real ResNet-50 model found (retinascan_resnet50_v2.pth) - live inference + segmentation enabled.
Starting FastAPI on http://localhost:8000
```

**Terminal 2 (Frontend):**
```bash
cd Frontend/retinascan-app
npm run dev
```
*Open your browser at:* `http://localhost:5173`

---

## 5. Verification & Health Check Endpoints

| Command | Expected Output |
| :--- | :--- |
| `curl http://localhost:8000/health` | `{"status":"ok","model_loaded":true,"inference_mode":"real","api_version":"3.0"}` |
| `curl http://localhost:8000/eval-report` | Full JSON containing locked multi-center validation metrics |
| `Ctrl + Shift + R` (in browser) | Instantly resets application state and returns to Home view |

---

## 6. Coding Standards & Ground Rules

1. **`ml_script/model.py` is the ONLY place `build_model()` is defined.** Never duplicate model construction in scripts.
2. **`ml_script/preprocess.py` is the ONLY place image transforms are defined.**
3. **`train_ids.csv` and `val_ids_v2.csv` are frozen.** Never re-generate splits during model evaluation to prevent data leakage.
4. **All backend errors must return structured JSON.** Never return raw Python tracebacks to the client.
5. **Inference must remain single-threaded via `asyncio.Lock()`.** Guarantees peak RAM usage remains under 3GB on clinic laptops.
6. **Patient data sovereignty is absolute.** All processing executes locally on the edge device; zero health data or patient fundus scans leave the premises.
