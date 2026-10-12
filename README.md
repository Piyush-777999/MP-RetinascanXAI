# RetinaScan-XAI 👁️⚡

[![PyTorch](https://img.shields.io/badge/PyTorch-2.2+-EE4C2C?style=flat&logo=pytorch&logoColor=white)](https://pytorch.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.0+-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![OpenCV](https://img.shields.io/badge/OpenCV-4.9+-5C3EE8?style=flat&logo=opencv&logoColor=white)](https://opencv.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **Explainable AI-Powered Point-of-Care Diabetic Retinopathy Screening, Automated ETDRS Macular Staging & In-Silico Counterfactual Laboratory for Rural Primary Health Centers.**  
> *Developed for Smart India Hackathon (SIH) · Problem Statement PS38.*

---

## 📑 Table of Contents
- [Executive Overview](#-executive-overview)
- [Key Innovations & Differentiators](#-key-innovations--differentiators)
- [Dual-Persona Workstation Architecture](#-dual-persona-workstation-architecture)
  - [1. Doctor & Ophthalmologist Clinical Console](#1-doctor--ophthalmologist-clinical-console)
  - [2. ASHA & Community Health Worker Counseling Portal](#2-asha--community-health-worker-counseling-portal)
- [How In-Silico Counterfactual XAI Works](#-how-in-silico-counterfactual-xai-works)
- [Automated ETDRS 9-Zone Macular Grid & CSME Profiler](#-automated-etdrs-9-zone-macular-grid--csme-profiler)
- [Optical Geometry & Aspect-Ratio Letterbox Calibration](#-optical-geometry--aspect-ratio-letterbox-calibration)
- [Clinical Optical Zoom & Drag-to-Pan Inspection](#-clinical-optical-zoom--drag-to-pan-inspection)
- [System Architecture](#-system-architecture)
- [Clinical Performance & Validation (ResNet-50 v2)](#-clinical-performance--validation-resnet-50-v2)
- [Repository Structure](#-repository-structure)
- [Quickstart & Demo Execution (2 Clicks)](#-quickstart--demo-execution-2-clicks)
- [Cloud Deployment Guide (Render & Hugging Face)](#-cloud-deployment-guide-render--hugging-face)
- [REST API Reference](#-rest-api-reference)
- [Ethical, Privacy & Clinical Safeguards](#-ethical-privacy--clinical-safeguards)

---

## 🌟 Executive Overview

Diabetic Retinopathy (DR) is the single leading cause of preventable blindness among working-age adults globally. In rural India and low-resource settings, Primary Health Centres (PHCs) face an acute shortage of vitreoretinal specialists, resulting in late-stage presentations of vision-threatening Proliferative DR (PDR) and Clinically Significant Macular Edema (CSME).

**RetinaScan-XAI** is an offline-first, hospital-grade Clinical Decision Support System (CDSS) that empowers Accredited Social Health Activists (ASHAs), Auxiliary Nurse Midwives (ANMs), and general medical officers to perform instant, explainable DR screening at the point of care.

Unlike conventional "black-box" classifiers, RetinaScan-XAI delivers **quad-level clinical explainability**:
1. **Global Diagnostic Saliency (Grad-CAM++):** Visualizes the exact deep neural receptive fields that drove the ICDR severity grading.
2. **Exhaustive Pathological Inventory (CV Segmentor):** Detects, categorizes, counts, and pins every Microaneurysm (MA), Hemorrhage (HE), and Hard Exudate (EX) across all four anatomical quadrants.
3. **Interactive In-Silico Laser Counterfactual XAI:** A virtual laser photocoagulation engine that enables clinicians to simulate biophysical lesion ablation and causally verify neural network behavior in real-time.
4. **Automated ETDRS 9-Zone Macular Grid & CSME Risk Profiler:** Digital realization of the gold-standard Early Treatment Diabetic Retinopathy Study grid, calculating sub-millimeter proximity calipers from the fovea to classify macular edema threat.

---

## 🔬 Key Innovations & Differentiators

| Clinical Feature | Conventional AI Systems | RetinaScan-XAI |
| :--- | :--- | :--- |
| **Explainability** | Passive, static heatmaps only | **Interactive In-Silico Laser Counterfactual Simulation (Biophysical Telea Inpainting + Causal $\Delta P$)** |
| **Macular Edema (CSME) Triage** | Ignored or lumped into DR grade | **Automated ETDRS 9-Zone Concentric Grid with Sub-millimeter Foveal Proximity Stratification (<500µm Center-Involved)** |
| **Pathology Pinpointing** | Coarse bounding boxes or none | **Sub-pixel centroid segmentation + 4-quadrant anatomical radar (ST, SN, IT, IN)** |
| **Camera Sensor Parity** | Crops wide-angle sensors by 34%, hiding optic disc | **Dynamic Letterbox Aspect-Ratio Calibration (`imgBounds` lock)** |
| **Inspection Ergonomics** | Fixed static image viewer | **Clinical Optical Zoom (100%–300%) with Drag-to-Pan & Mouse Wheel Zoom** |
| **Dual User Personas** | Monolithic, jargon-heavy interface | **One-click toggle: Doctor Clinical Console ↔ ASHA Rural Pictogram Counselor** |
| **Multilingual Support** | English only | **Full Vernacular Hindi & English with localized audio/pictogram guidance** |
| **Out-of-Distribution Safety** | Hallucinates predictions on non-retinal images | **Multistage IQA & Chromatic OOD Gatekeeper (Structured 415/200 rejection)** |
| **Deployment Footprint** | Cloud-dependent, high latency | **Dual Mode: Offline Local Execution (0.3s) or Cloud Web Service via Render/HuggingFace** |

---

## 👥 Dual-Persona Workstation Architecture

RetinaScan-XAI bridges the gap between tertiary vitreoretinal specialists and rural grassroots healthcare workers through dedicated clinical views:

### 1. Doctor & Ophthalmologist Clinical Console
* **ICDR 5-Grade Staging:** Displays calibrated multi-class probability distributions across Grade 0 (No DR) through Grade 4 (Proliferative DR).
* **Synchronized Overlays:** Toggle Grad-CAM++ heatmaps, lesion pins, 540nm Red-Free optical filtration, and ETDRS concentric rings.
* **In-Silico Laser Surgery:** Interactive targeting reticle allowing clinicians to select lesion clusters, simulate 532nm photocoagulation blanching, and re-evaluate neural network logits.
* **Optical Zoom & Pan:** Magnify suspect capillaries up to 300% and pan smoothly across the posterior pole.
* **Clinical Export:** One-click generation of formalized DICOM-style triage reports and printable specialist referral letters.

### 2. ASHA & Community Health Worker Counseling Portal
* **Vernacular Communication:** Accessible in **Hindi** and **English**, transforming complex terminology into culturally accessible language.
* **Pictographic Patient Slips:** Clear visual indicators (traffic-light urgency badges, eye pictograms) for rural patients with low literacy.
* **Standardized Clinical Scripts:** Evidence-based talking points covering glycemic management, blood pressure targets, and laser follow-up urgency.
* **Dietary & Lifestyle Guidance:** Culturally tailored recommendations for diabetic diet management in Indian rural communities.

---

## ⚡ How In-Silico Counterfactual XAI Works

Traditional deep learning models are opaque: clinicians cannot verify whether the network is responding to genuine pathology or spurious background artifacts. RetinaScan-XAI introduces **Causal Counterfactual Interactivity**:

```
[Target Selected Lesions] ──► [Biophysical Telea Inpainting] ──► [Live ResNet-50 Forward Pass] ──► [Quantitative Causal Report]
  (Hemorrhages/Exudates)       (Healthy RPE Reconstruction)          (Logits & Grad-CAM)           (Δ P & Diagnostic Insight)
```

1. **Targeting & Selection:** The doctor targets suspect lesion pins or freehand laser coordinates on the fundus photograph.
2. **Biophysical Tissue Reconstruction:** The backend applies **Fast Marching Navier-Stokes / Telea Inpainting** to reconstruct healthy Retinal Pigment Epithelium (RPE) over the ablated tissue, superimposing clinical **argon laser photocoagulation blanching rings**.
3. **Live Counterfactual Re-Inference:** The inpainted scan undergoes a live forward pass through the PyTorch ResNet-50 backbone.
4. **Causal Attribution Calculation:** The system computes the exact causal delta:
   $$\Delta P = P_{\text{baseline}}(\text{Grade } k) - P_{\text{treated}}(\text{Grade } k)$$
   * If $\Delta P$ is significant, it provides quantitative proof that the targeted lesions causally drove the initial diagnosis.
   * If $\Delta P < 0.5\%$, the system reports **"Minimal Causal Shift"**, informing the clinician that severe pathology (e.g. Neovascularization at the Disc) remains active elsewhere.

---

## 🎯 Automated ETDRS 9-Zone Macular Grid & CSME Profiler

Clinically Significant Macular Edema (CSME) is the primary driver of central visual loss in diabetic patients. RetinaScan-XAI implements the clinical gold-standard **Early Treatment Diabetic Retinopathy Study (ETDRS)** 9-zone macular grid centered on the fovea:

```
                      [ Outer Superior (OS, 6mm) ]
             ┌──────────────────────────────────────────┐
             │         [ Inner Superior (IS, 3mm) ]     │
             │   ┌──────────────────────────────────┐   │
   [ Outer   │   │  [ Inner Temporal (IT) ]         │   │   [ Outer
   Temporal  │   │       ┌──────────────┐           │   │   Nasal
   (OT, 6mm) │   │       │ CSF (1mm) ⨁  │   [ IN ]  │   │   (ON, 6mm) ]
             │   │       └──────────────┘           │   │
             │   │         [ Inner Inferior (II) ]  │   │
             │   └──────────────────────────────────┘   │
             │         [ Outer Inferior (OI, 6mm) ]     │
             └──────────────────────────────────────────┘
```

### 1. Sub-Millimeter Spatial Calibration
* Across a standard 45° posterior pole fundus scan ($\approx 15,000\,\mu m$ diameter), each 1% normalized coordinate space maps to **$150\,\mu m$**.
* **Central Subfield (CSF):** $1.0\,\text{mm}$ diameter ($r = 500\,\mu m \approx 3.33\%$).
* **Inner Macular Ring:** $3.0\,\text{mm}$ diameter ($r = 1500\,\mu m \approx 10.0\%$), divided into IS, IN, II, IT.
* **Outer Macular Ring:** $6.0\,\text{mm}$ diameter ($r = 3000\,\mu m \approx 20.0\%$), divided into OS, ON, OI, OT.
* **Anatomical Laterality:** Automatically mirrors Nasal vs Temporal sectors between **OD** (Right Eye) and **OS** (Left Eye).

### 2. CSME Clinical Risk Stratification
The engine computes the exact Euclidean foveal distance to every hard exudate:
$$d = \sqrt{(x - x_{\text{fovea}})^2 + (y - y_{\text{fovea}})^2} \times 150\,\mu m$$

* **🔴 Center-Involved CSME (High Risk):** Hard exudates detected within $500\,\mu m$ of the foveal center ($d \le 500\,\mu m$). **Protocol:** Immediate Macular OCT & Anti-VEGF / Focal Laser evaluation within **7–14 Days**.
* **🟡 Non-Center Involved CSME (Moderate Risk):** Hard exudates in the inner macular ring ($500 < d \le 1500\,\mu m$). **Protocol:** Specialist referral within **1 Month**.
* **🟡 Borderline Macular Threat:** Hard exudates in outer ring ($1500 < d \le 3000\,\mu m$).
* **🟢 Clear / Low Risk:** No exudative lesions within the 6mm ETDRS perimeter.

---

## 📐 Optical Geometry & Aspect-Ratio Letterbox Calibration

Different fundus cameras output different aspect ratios:
* **Square Scans:** $1050 \times 1050$ (1:1, e.g. Priya Sharma).
* **Rectangular Sensor Scans:** $1600 \times 1062$ (1.51:1, e.g. Geeta Sharma & APTOS camera sensors).

In standard web applications, rendering rectangular images with `object-fit: cover` inside a circular aperture crops 34% of the image horizontally, slicing off the optic disc and nasal quadrants.

**The RetinaScan-XAI Fix:**
Both [Results.jsx](file:///d:/AntiGravity%20projects/MP-RetinascanXAI/Frontend/retinascan-app/src/components/Results.jsx) and [Canvas.jsx](file:///d:/AntiGravity%20projects/MP-RetinascanXAI/Frontend/retinascan-app/src/components/Canvas.jsx) dynamically compute calibrated letterbox bounds (`imgBounds` memo) upon reading image natural dimensions:
```javascript
const imgBounds = useMemo(() => {
  if (imgAspect >= 1) {
    const heightPct = 100 / imgAspect;
    const topPct = (100 - heightPct) / 2;
    return { width: '100%', height: `${heightPct}%`, left: '0%', top: `${topPct}%` };
  } else {
    const widthPct = 100 * imgAspect;
    const leftPct = (100 - widthPct) / 2;
    return { width: `${widthPct}%`, height: '100%', left: `${leftPct}%`, top: '0%' };
  }
}, [imgAspect]);
```
The fundus photo, Grad-CAM overlay, lesion pins, and ETDRS grid are nested inside this calibrated frame, guaranteeing **pixel-perfect alignment across all camera sensors**.

---

## 🔍 Clinical Optical Zoom & Drag-to-Pan Inspection

Microaneurysms measure only $15$ to $50\,\mu m$ (1 to 3 pixels on standard fundus photographs). To allow ophthalmologists to examine microvascular details without eye strain, RetinaScan-XAI incorporates a dedicated optical zoom system:

* **Magnification Range:** Smooth zoom from **100% up to 300%**.
* **Clinical Presets:** Instant steppers for **`1x`**, **`1.5x`**, **`2x`**, and **`2.5x`** with a one-click **`↺ Reset`** button.
* **Interactive Drag-to-Pan:** When magnified, clicking and dragging allows doctors to pan across the macula, fovea, and optic disc with an active grab cursor.
* **Mouse Wheel Zoom:** Scroll up to zoom in, scroll down to zoom out.
* **Synchronized Overlays:** All lesion markers, ETDRS grid sectors, Grad-CAM overlays, and laser ablation spots transform in lockstep.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    A[Raw Retinal Photograph] --> B[Multistage OOD & IQA Gatekeeper]
    B -->|Passed| C[Ben Graham Normalization + CLAHE Preprocessing]
    B -->|Failed| X[Structured OOD 415/200 Rejection Alert]
    
    C --> D[ResNet-50 Classifier Backbone]
    D --> E[Calibrated Softmax Probabilities]
    E --> F[ICDR 5-Grade Staging Grade 0-4]
    
    D --> G[Grad-CAM Layer4 Gradient Hook]
    G --> H[Pixel-Perfect Alpha PNG Heatmap]
    
    A --> I[Computer Vision Lesion Segmentor]
    I --> J[Morphological Top-Hat / Bottom-Hat Filtering]
    J --> K[Vascular Tree Subtraction & Optic Disc Exclusion]
    K --> L[Indexed Lesion Inventory MA, HE, EX]
    
    F --> M[ICDR Harmonization Engine]
    L --> M
    M --> N[Clinical Workstation Results View]
    H --> N
    
    N --> O[⚡ In-Silico Laser Counterfactual Engine]
    O -->|Telea Inpainting + ResNet Re-Inference| N
```

---

## 📊 Clinical Performance & Validation (ResNet-50 v2)

Powered by **`retinascan_resnet50_v2.pth`**, fine-tuned across **4,324 multi-center images** (APTOS 2019 + MESSIDOR-2). Evaluation is performed on a **held-out test cohort of 1,082 images** (20% held-out from each dataset):

| Clinical Metric | Model v2 (Multi-Center Held-Out) | Target Benchmark | Clinical Impact | Status |
| :--- | :---: | :---: | :--- | :---: |
| **Sensitivity (Referable DR: Grade ≥ 2)** | **93.3%** (`0.9332`) | $\ge 90.0\%$ | Detects 363 out of 389 positive cases | ✅ Exceeds Target |
| **Specificity (Referable DR)** | **86.2%** (`0.8615`) | $\ge 85.0\%$ | Clears 597 out of 693 non-referable cases | ✅ Exceeds Target |
| **AUC-ROC** | **0.9702** | $\ge 0.950$ | High discriminatory power across fundus camera types | ✅ Gold Standard |
| **Negative Predictive Value (NPV)** | **95.8%** (`0.9583`) | — | High rule-out safety for community screening | ✅ High Safety |
| **Positive Predictive Value (PPV)** | **79.1%** (`0.7908`) | — | Reliable specialist referral prioritization | ✅ Calibrated |
| **F1-Score** | **0.8561** | — | Balanced precision-recall trade-off | ✅ Robust |
| **Optimal Decision Threshold** | **0.1657** | — | Calibrated via Youden's J Index on validation ROC | ✅ Locked |
| **Overall 5-Class Concordance** | **72.0%** | — | 5-stage ordinal classification accuracy | ✅ Reliable |

### 🔍 Held-Out Validation Confusion Matrix (1,082 Images)
```
                   Predicted Non-Referable    Predicted Referable (≥ Grade 2)
Actual Non-Referable         597 (TN)                      96 (FP)
Actual Referable              26 (FN)                     363 (TP)
```
> **Safety Note:** Out of 389 referable DR cases in the test split, the model missed **only 26 cases** ($\text{NPV} = 95.8\%$), ensuring patients requiring urgent photocoagulation or anti-VEGF therapy are safely triaged.

---

## 📂 Repository Structure

```
MP-RetinascanXAI/
├── Backend/                                # FastAPI Asynchronous Deep Learning Server
│   ├── main.py                             # API endpoints: /upload, /counterfactual-laser, /health
│   ├── inference.py                        # ResNet-50 inference, Grad-CAM, Ben Graham CLAHE, OOD gatekeeper
│   ├── counterfactual.py                   # In-silico laser ablation, Telea inpainting, causal ΔP engine
│   ├── etdrs.py                            # ETDRS 9-zone macular grid calculator & CSME risk engine
│   ├── segment.py                          # Morphological lesion segmentation, vessel subtraction, disc mask
│   ├── retinascan_resnet50.pth             # Local PyTorch weights (281.5 MB, gitignored)
│   └── requirements.txt                    # Python dependencies
│
├── Frontend/
│   └── retinascan-app/                     # Hospital-Grade React 18 + Vite Web Application
│       ├── src/
│       │   ├── apiConfig.js                # Centralized backend resolver (VITE_API_URL / localhost fallback)
│       │   ├── App.jsx                     # Application state machine, routing, and upload handling
│       │   ├── data.js                     # Clinical data schema, 12 demo patients, ICDR color tokens
│       │   ├── translations.js             # Vernacular Hindi & English translation dictionary
│       │   ├── index.css                   # Clinical hospital light design system & tokens
│       │   ├── components/
│       │   │   ├── Results.jsx             # Diagnostic console, In-Silico Laser XAI, Optical Zoom & Pan
│       │   │   ├── AshaPatientCounselor.jsx# Vernacular patient counselor with pictograms & audio scripts
│       │   │   ├── Canvas.jsx              # High-contrast PACS diagnostic canvas with letterbox lock
│       │   │   ├── QualityCheck.jsx        # Dynamic Image Quality Assessment (IQA) gate
│       │   │   ├── Processing.jsx          # Inference progress visualization & diagnostic tracker
│       │   │   ├── Home.jsx                # Rural intake portal & patient selector
│       │   │   ├── Upload.jsx              # Point-of-care patient intake & scan upload
│       │   │   ├── Queue.jsx               # Tele-ophthalmology triage queue with urgency badges
│       │   │   ├── Referral.jsx            # Printable clinical referral letter generator
│       │   │   ├── Admin.jsx               # Audit logging & screening analytics dashboard
│       │   │   └── LanguageSwitcher.jsx    # Vernacular language selector
│       │   └── main.jsx                    # React entrypoint
│       └── public/images/                  # Curated fundus scans, Grad-CAMs, and demo assets
│
├── ml_script/                              # Model Training & Evaluation Pipelines
│   ├── model.py                            # PyTorch ResNet-50 architecture definition
│   ├── preprocess.py                       # Ben Graham circular FOV masking & CLAHE color balancing
│   ├── train_classifier_v2.py              # Multi-center training pipeline (APTOS + MESSIDOR-2)
│   ├── evaluate_model.py                   # Sensitivity, specificity, AUC-ROC & Youden's J optimizer
│   ├── retinascan_resnet50_v2.pth          # Active production weights (93.3% Sens / 86.2% Spec)
│   └── evaluation_report_v2.json           # Locked performance metrics for ResNet-50 v2
│
├── start_backend.bat                       # One-click Windows launcher for FastAPI (port 8000)
├── start_frontend.bat                      # One-click Windows launcher for Vite dev server (port 5173)
├── install_deps.bat                        # Automated Windows dependency installation script
└── README.md                               # Project documentation & clinical specifications
```

---

## 🚀 Quickstart & Demo Execution (2 Clicks)

For presentations, college vivas, and hackathons, running locally on your laptop guarantees **instant response times (<0.3s), full 16GB+ RAM capacity, and zero reliance on venue Wi-Fi**.

### Method 1: One-Click Windows Launchers
1. Double-click **[`start_backend.bat`](file:///d:/AntiGravity%20projects/MP-RetinascanXAI/start_backend.bat)** → Starts FastAPI on `http://localhost:8000`.
2. Double-click **[`start_frontend.bat`](file:///d:/AntiGravity%20projects/MP-RetinascanXAI/start_frontend.bat)** → Starts Vite and opens your browser at `http://localhost:5173`.

### Method 2: Manual Terminal Execution
```bash
# Terminal 1 — Backend
cd Backend
pip install -r requirements.txt
python main.py

# Terminal 2 — Frontend
cd Frontend/retinascan-app
npm install
npm run dev
```

### Instant Mobile / Public Tunnel for Demos
If an evaluator wants to open the app on their phone or tablet during your presentation, run:
```bash
npx localtunnel --port 5173
```
This generates an instant public HTTPS URL that forwards directly to your laptop while using your laptop's GPU/CPU for inference.

---

## ☁️ Cloud Deployment Guide (Render & Hugging Face)

### Deploying on Render

#### Step 1: Push Code to GitHub
```bash
git add .
git commit -m "feat: complete deployment readiness"
git push origin main
```

#### Step 2: Backend (Render Web Service)
1. In Render Dashboard, click **New +** → **Web Service**.
2. Connect your repository.
3. Configure settings:
   - **Root Directory:** `Backend`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Note your backend URL: `https://your-backend.onrender.com`.

#### Step 3: Frontend (Render Static Site)
1. Click **New +** → **Static Site**.
2. Configure settings:
   - **Root Directory:** `Frontend/retinascan-app`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
3. In **Environment Variables**, add:
   - `VITE_API_URL` = `https://your-backend.onrender.com`

---

## 📡 REST API Reference

### `POST /upload`
Uploads a retinal fundus photograph for automated grading and lesion segmentation.
* **Payload:** `multipart/form-data` with `file: <binary_image>`
* **Response (JSON):**
```json
{
  "severity": 2,
  "confidence": 96.4,
  "label": "Moderate NPDR",
  "action": "Specialist Triage Required — refer within 1 month",
  "heatmap_url": "/images/heatmap_live_762fe0ec.png",
  "image_url": "/images/scan_live_762fe0ec.jpg",
  "all_probs": [0.0002, 0.0095, 0.9097, 0.017, 0.0636],
  "lesions": [
    { "id": 1, "type": "microaneurysm", "x": 35.2, "y": 28.4, "area_px": 82, "confidence": 91 },
    { "id": 13, "type": "hemorrhage", "x": 55.1, "y": 26.3, "area_px": 540, "confidence": 83 }
  ],
  "lesion_summary": {
    "microaneurysm_count": 6,
    "hemorrhage_count": 3,
    "exudate_count": 5,
    "total_lesion_area_px": 4130
  },
  "mode": "real"
}
```

### `POST /counterfactual-laser`
Simulates laser ablation on targeted lesions, re-runs ResNet-50 inference, and calculates causal metrics.
* **Payload (JSON):**
```json
{
  "image_identifier": "/images/img_2_od.jpg",
  "original_severity": 2,
  "original_probs": [0.0002, 0.0095, 0.9097, 0.017, 0.0636],
  "ablated_lesions": [
    { "id": 13, "x": 55.1, "y": 26.3, "area_px": 540, "type": "hemorrhage" }
  ],
  "laser_spots": []
}
```
* **Response (JSON):**
```json
{
  "success": true,
  "counterfactual": {
    "severity": 1,
    "label": "Mild NPDR",
    "confidence": 78.4,
    "probs": [0.012, 0.784, 0.142, 0.038, 0.024],
    "heatmap_url": "/images/heatmap_laser_a98df2c1.png",
    "treated_image_url": "/images/laser_treated_a98df2c1.jpg"
  },
  "causal_metrics": {
    "probability_delta_pct": -24.8,
    "causal_attribution_score": 82.5,
    "causal_strength": "Decisive Causal Role",
    "grade_shift": "Down-staged from Grade 2 → Grade 1",
    "clinical_verdict": "Causal Validation Confirmed: Ablation of targeted lesions reduced Grade 2 probability by 24.8%."
  }
}
```

---

## 🛡️ Ethical, Privacy & Clinical Safeguards

1. **Intended Use:** RetinaScan-XAI is an **Adjunctive Clinical Decision Support System (CDSS)** engineered for preliminary triage in community screening camps. It does not replace formal slit-lamp biomicroscopy by a certified ophthalmologist.
2. **Out-of-Distribution Fail-Safe:** The system immediately rejects non-fundus photographs, blurry images, and non-medical graphics, returning structured error alerts rather than hallucinated diagnoses.
3. **Data Sovereignty & Privacy:** The application operates completely offline. No patient retinal photographs or Protected Health Information (PHI) leave the local clinic premises.

---

<p align="center">
  <b>RetinaScan-XAI — Point-of-Care Ophthalmology Powered by Causal Explainability.</b>
</p>
