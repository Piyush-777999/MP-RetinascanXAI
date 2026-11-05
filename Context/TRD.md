# Technical Requirements Document (TRD)

**RetinaScan-XAI: High-Performance Explainable AI Platform for Point-of-Care Diabetic Eye Care**

**Version:** 3.0 | **Companion:** PRD v3.0 | **Status:** PRODUCTION

---

## 1. System Architecture

RetinaScan-XAI runs entirely on the edge (standard clinic laptop or desktop workstation) with zero cloud dependencies. It employs a decoupled 3-tier architecture:

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

## 2. Machine Learning Core Specifications

### 2.1 Model Architecture (`ml_script/model.py`)
- **Backbone:** Deep Residual Network with 50 layers (ResNet-50), initialized with ImageNet weights.
- **Classification Head:**
  ```python
  model.fc = nn.Sequential(
      nn.Dropout(p=0.4),
      nn.Linear(2048, 512),
      nn.ReLU(inplace=True),
      nn.Dropout(p=0.3),
      nn.Linear(512, 5)  # 5 ICDR classes: Grade 0 through 4
  )
  ```
- **Architectural Single Source of Truth:** `build_model()` is strictly imported from `ml_script/model.py`.

### 2.2 Training & Preprocessing Pipeline
- **Preprocessing Pipeline (`ml_script/preprocess.py`):**
  - Input resolution: $224 \times 224$ pixels.
  - ImageNet normalization: $\mu = [0.485, 0.456, 0.406]$, $\sigma = [0.229, 0.224, 0.225]$.
  - Training augmentations: RandomCrop(224) with pad 32, RandomHorizontalFlip, RandomVerticalFlip, RandomRotation(20°), ColorJitter(brightness=0.2, contrast=0.2, saturation=0.1).
- **Multi-Center Training (`ml_script/train_classifier_v2.py`):**
  - Datasets: APTOS 2019 ($3,662$ images) + MESSIDOR-2 ($1,744$ gradable images) = $5,406$ total images.
  - Train Split: $4,324$ images ($80\%$).
  - Held-out Validation Cohort: $1,082$ images ($20\%$).
  - Optimization: AdamW ($\text{lr} = 10^{-4}$, $\text{weight\_decay} = 10^{-4}$), Mixed Precision (AMP), Checkpoint resume every 5 epochs.

### 2.3 Optimal Decision Threshold & Binary Referable DR
- **Referable DR Definition:** Positive if Grade $\ge 2$ (Moderate NPDR, Severe NPDR, or Proliferative DR).
- **Referable Probability Calculation:**
  $$P(\text{Referable}) = P(\text{Grade 2}) + P(\text{Grade 3}) + P(\text{Grade 4})$$
- **Youden's J Optimization:**
  $$J = \max_t \left( \text{Sensitivity}(t) + \text{Specificity}(t) - 1 \right)$$
- **Calibrated Production Thresholds:**
  - Model v1 (APTOS single-center): $t = 0.1162$ ($\text{Sensitivity} = 97.65\%$, $\text{Specificity} = 89.20\%$).
  - Model v2 (Multi-center production): $t = 0.1657$ ($\text{Sensitivity} = 93.32\%$, $\text{Specificity} = 86.15\%$, $\text{AUC} = 0.9702$).

---

## 3. Explainable AI & Computational Geometry

### 3.1 Memory-Safe Grad-CAM++ Engine
- Target Layer: `model.layer4[-1]` (final convolutional block).
- Forward and backward hooks capture activations $A^k$ and gradients $\frac{\partial Y^c}{\partial A^k}$.
- Global Average Pooling generates feature importance weights:
  $$\alpha_k^c = \frac{1}{Z} \sum_i \sum_j \frac{\partial Y^c}{\partial A_{i,j}^k}$$
- Coarse localization map:
  $$L_{\text{Grad-CAM}}^c = \text{ReLU}\left( \sum_k \alpha_k^c A^k \right)$$
- **Hook Leak Prevention:** Hooks are registered inside a protected context and explicitly unhooked (`h.remove()`) in a `finally` block, preventing memory accumulation.
- Heatmap Rendering: Bicubic interpolation to native resolution, masked by eroded FOV boundary, rendered with JET colormap, and exported as transparent 4-channel BGRA PNG.

### 3.2 In-Silico Laser Counterfactual XAI Engine (`Backend/counterfactual.py`)
- Simulates clinical argon laser photocoagulation ($532\,\text{nm}$) on targeted lesions and freehand spots.
- **Biophysical Tissue Reconstruction:**
  - Ablation mask $M$ is constructed from selected lesion bounding boxes and laser spots (radius $r = 18\,\text{px}$).
  - Inpainting via Telea Fast Marching Method (`cv2.inpaint(img, mask, inpaintRadius=5, flags=cv2.INPAINT_TELEA)`), synthesizing healthy retinal pigment epithelium (RPE).
  - Superimposes therapeutic photocoagulation blanching rings (outer gray border with pale coagulated center).
- **Causal Delta & Attribution Calculation:**
  - Let $P_{\text{orig}}$ and $P_{\text{treated}}$ denote softmax probability vectors before and after laser ablation.
  - Probability drop for primary severity grade $g$:
    $$\Delta P = (P_{\text{treated}}[g] - P_{\text{orig}}[g]) \times 100\%$$
  - Normalized Causal Attribution Score:
    $$\text{CAS} = \min\left(100.0, \; \max\left(0.0, \; \frac{P_{\text{orig}}[g] - P_{\text{treated}}[g]}{P_{\text{orig}}[g]} \times 100\%\right)\right)$$
  - Grade Downstaging: Computed from $\text{argmax}(P_{\text{treated}})$.

### 3.3 Automated ETDRS 9-Zone Macular Grid & CSME Profiler (`Backend/etdrs.py`)
- Clinical Gold Standard: Early Treatment Diabetic Retinopathy Study (ETDRS) 9-zone layout centered on the fovea.
- **Spatial Metric Calibration:**
  - Standard 45° posterior pole fundus scan diameter $\approx 15,000\,\mu m$.
  - 1% normalized coordinate $\approx 150\,\mu m$.
  - **Central Foveal Subfield (CSF):** Diameter $= 1.0\,\text{mm}$ ($r = 500\,\mu m = 3.33\%$).
  - **Inner Macular Ring:** Diameter $= 3.0\,\text{mm}$ ($r = 1500\,\mu m = 10.0\%$), sectors: Inner Superior (IS), Inner Nasal (IN), Inner Inferior (II), Inner Temporal (IT).
  - **Outer Macular Ring:** Diameter $= 6.0\,\text{mm}$ ($r = 3000\,\mu m = 20.0\%$), sectors: Outer Superior (OS), Outer Nasal (ON), Outer Inferior (OI), Outer Temporal (OT).
  - **Laterality Mirroring:** Automatically mirrors Nasal vs. Temporal sectors based on Eye side (`od` vs `os`).
- **Clinically Significant Macular Edema (CSME) Diagnostic Rules:**
  - High Risk (Center-Involved): Any hard exudate within CSF ($\le 500\,\mu m$ from foveal center). Immediate OCT and anti-VEGF / focal laser triage within 7–14 days.
  - Moderate Risk (Non-Center Involved): Hard exudates within Inner Ring ($500\,\mu m < d \le 1500\,\mu m$). Specialist referral within 1 month.
  - Low Risk: Exudates confined to Outer Ring ($1500\,\mu m < d \le 3000\,\mu m$) or zero macular exudates.

---

## 4. Computer Vision Lesion Segmentation Pipeline (`Backend/segment.py`)

1. **Retinal FOV Aperture Masking:** Thresholds luminance ($>20$), applies morphological erosion with $15\times 15$ elliptical structuring element to eliminate camera border reflections.
2. **Optic Disc (OD) Exclusion:** Localizes optic cup via Gaussian smoothing ($\sigma=35$) and `minMaxLoc`, generating a $55\,\text{px}$ radius exclusion zone to prevent physiological blind spots from registering as exudates.
3. **Vascular Tree Extraction & Subtraction:** Extracts blood vessels via CLAHE on the green channel and morphological black-hat filtering ($9\times 9$ ellipse, threshold $>12$). Dilates vessels by $5\,\text{px}$ to mask out capillary junctions.
4. **Dark Lesion Detection (Microaneurysms & Hemorrhages):**
   - Applies morphological closing ($25\times 25$ ellipse) on green channel, subtracts enhanced green from background estimate.
   - Applies Otsu thresholding ($0.75 \times \text{Otsu}$), subtracts vessel mask, OD mask, and border mask.
   - Connected component analysis evaluates area and circularity ($c = \frac{4\pi \cdot \text{area}}{\text{perimeter}^2}$):
     - **Microaneurysms:** $8 \le \text{area} \le 120\,\text{px}$, $c \ge 0.55$.
     - **Hemorrhages:** $120 < \text{area} < 2500\,\text{px}$, $c \ge 0.20$.
5. **Bright Lesion Detection (Hard Exudates):**
   - Morphological top-hat filter on green channel ($21\times 21$ ellipse).
   - High threshold ($>35$), masks out OD and boundary. Connected component area filter ($15 \le \text{area} < 3000\,\text{px}$).
6. **ICDR Standardization Harmonization:** If the classifier confirms Grade 0 (No DR), the segmentor enforces an empty lesion inventory.

---

## 5. Frontend Architecture & Visual Ergonomics

### 5.1 Dynamic Aspect-Ratio Letterbox Calibration (`imgBounds`)
- Solves optical cropping on wide-angle fundus cameras (e.g. $1600\times 1062$, $1.51:1$ ratio) vs square sensors ($1050\times 1050$, $1:1$ ratio).
- Measures natural aspect ratio upon `onLoad` and locks overlays inside calibrated relative bounds:
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
- Guaranteed 100% overlay alignment for Grad-CAM, lesion pins, ETDRS grid, and laser spots.

### 5.2 Clinical Optical Zoom & Drag-to-Pan Inspection
- Zoom range: $100\%$ to $300\%$, with discrete preset steppers ($1\times, 1.5\times, 2\times, 2.5\times$) and mouse wheel support.
- Drag-to-pan recalculates container coordinate offsets while clamping panning within image borders.
- Synchronous CSS transforms scale and translate the image and SVG overlays simultaneously.

### 5.3 Web Speech API Audio Synthesis
- Multi-lingual Text-to-Speech (TTS) engine querying `window.speechSynthesis`.
- Automatically binds regional voice packs (BCP-47 tags: `hi-IN`, `mr-IN`, `te-IN`, `ta-IN`, `bn-IN`, `en-IN`).
- Generates speech for culturally respectful names and regional advice scripts.
