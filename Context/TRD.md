# Technical Requirements Document (TRD)

**RetinaScan-XAI: Explainable AI Platform for Diabetic Retinopathy Screening**

Problem ID: SIH26038 | Version: 1.0 | Companion: PRD v1.0

---

## 1. Purpose & Scope

This TRD translates the clinical and operational needs from the PRD into formal engineering specifications. It covers modular design, data contracts, algorithms, APIs, and validation protocols.

---

## 2. System Architecture

The system runs on a standard clinic laptop, operating autonomously without internet. A 3-layer architecture decouples the ML inference core from the responsive web interface.

```
CLINIC LAPTOP (Edge Device)
|
|  React Frontend (Vite, localhost:5173)
|       |
|       | HTTP/JSON
|       v
|  FastAPI Edge Server (Uvicorn, localhost:8000)
|       |
|       | Single-Threaded Inference Queue
|       v
|  ML Inference Engine
|    - CLAHE + Ben Graham Preprocessing
|    - ResNet-50 Severity Classifier
|    - Grad-CAM Explainability
|    - OOD Validation Gate
|       |
|       v
|  Static File Storage (heatmaps, reports)
```

---

## 3. Module Specifications

### 3.1 Image Quality Assessment & Enhancement Module

Executes local IQA to inspect illumination, focus, and field-of-view before grading.

**Enhancement Pipeline:**
1. CLAHE (Contrast Limited Adaptive Histogram Equalization) on the L channel of LAB color space, clipLimit=2.0, tileGrid=(8,8).
2. Ben Graham Normalization: GaussianBlur blend with sigma = imageSize/30, weight formula: `addWeighted(img, 4, blur, -4, 128)`.

**OOD (Out-of-Distribution) Validation:**
- Corner darkness check: fundus images have dark circular masks, corners should be < 0.35 mean brightness.
- Center color profile: fundus images are red/orange dominant. Red channel must exceed green and blue.
- Low-confidence fallback: if model top-class softmax < 0.40, flag as "Low Confidence" rather than hard-rejecting.

**Performance Budget:** < 1.5 seconds per image.

### 3.2 DR Severity Grading Module

**Network:** Fine-tuned ResNet-50, accepting a preprocessed fundus image (224x224) and producing a Softmax vector over 5 severity classes:
- Level 0: No Apparent DR
- Level 1: Mild NPDR
- Level 2: Moderate NPDR
- Level 3: Severe NPDR
- Level 4: Proliferative DR

**Binary Referable DR Decision:**
- Referable probability = sum of P(Level 2) + P(Level 3) + P(Level 4)
- Decision threshold: **0.1162** (calculated via Youden's J index on APTOS 2019 validation set)
- If referable probability >= 0.1162, flag as "Referable DR -- Specialist Triage Required"

**Model Architecture:**
```python
ResNet-50 (ImageNet pretrained)
  -> fc replaced with:
     Dropout(0.4)
     Linear(2048, 512)
     ReLU()
     Dropout(0.3)
     Linear(512, 5)
```

**Training Configuration:**
- Dataset: APTOS 2019 (3,662 images, 80/20 stratified split)
- Optimizer: AdamW (lr=1e-4, weight_decay=1e-4)
- Scheduler: CosineAnnealingLR (T_max=20)
- Loss: CrossEntropyLoss with inverse-frequency class weights
- Epochs: 20
- Augmentation: RandomCrop, HorizontalFlip, VerticalFlip, Rotation(20), ColorJitter

**Validated Performance (APTOS 2019 val set, 733 images):**

| Metric | Value |
|--------|-------|
| Sensitivity (Referable DR) | 97.6% |
| Specificity | 89.2% |
| AUC-ROC | 0.978 |
| Overall 5-class Accuracy | 79.4% |
| PPV | 86.1% |
| NPV | 98.2% |
| F1 Score | 0.915 |

### 3.3 Explainability (XAI) Module

**Grad-CAM** generates activation heatmaps from `layer4[-1]` (final ResNet block) for the predicted class.

Process:
1. Forward pass records activations via forward hook.
2. Backward pass records gradients via backward hook.
3. Weighted combination: `cam = ReLU(sum(mean_gradients * activations))`.
4. Normalize to [0, 1], resize to image dimensions.
5. Apply JET colormap, blend with original image (60% original, 40% heatmap).
6. Save as JPEG for frontend display.

### 3.4 Middleware / Integration Bridge

- **FastAPI Server:** Local REST engine bound to localhost:8000.
- **Concurrency Guard:** `asyncio.Lock` serializes inference requests, preventing OOM on concurrent uploads.
- **Static File Server:** Serves generated heatmap images from `/images/` path.
- **Mock Fallback:** If no `.pth` file is present, returns pre-computed mock data from `data.js` schema.

### 3.5 Frontend Module

React + Vite SPA with vanilla CSS (dark-navy glassmorphism design system). Nine component screens:

| Screen | Purpose |
|--------|---------|
| Home | Landing dashboard with 3 module cards |
| Upload | 2-column clinical intake form with preset patient cards |
| QualityCheck | Animated IQA gate (Focus/Illumination/FOV bars) |
| Processing | Inference animation (conic ring spinner + step checklist) |
| Results | Severity badge, ICDR probability bars, patient header |
| Canvas | PACS workstation with fundus image, lesion pins, Grad-CAM toggle |
| Queue | Patient review queue with severity badges |
| Referral | Auto-generated referral letter for severe cases |
| Admin | Analytics dashboard with screening counts |

---

## 4. API Specification

All endpoints are on localhost:8000. JSON payloads use snake_case.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /upload | Upload fundus image; returns severity grade + heatmap URL |
| GET | /health | Server status and model load state |
| GET | /eval-report | Full evaluation metrics JSON |

See `API_Contract.md` for exact request/response schemas.

---

## 5. Technical Specifications

| Category | Specification |
|----------|--------------|
| Runtime | Python 3.10+, Node.js 18+ |
| ML Framework | PyTorch (ResNet-50, torchvision) |
| Image Processing | OpenCV (CLAHE, Ben Graham, Grad-CAM overlay) |
| API Server | FastAPI + Uvicorn |
| Frontend | React 18 + Vite |
| Memory Budget | Peak inference < 3GB |
| Latency | Full pipeline (IQA + Grade + Heatmap) < 8 seconds on CPU |
| Offline | 100% of screening functions work without internet |

---

## 6. Validation Protocols

| Test Type | Description |
|-----------|-------------|
| Benchmark Validation | Sensitivity > 90%, Specificity > 85%, AUC measured on APTOS 2019 val set |
| Cross-Dataset Check | Distribution plausibility on MESSIDOR-2 (predicted referable rate vs published 46.5%) |
| OOD Robustness | Non-fundus images (faces, objects) correctly rejected |
| Stress Test | 10 rapid sequential uploads without crash or memory leak |
| E2E Demo | Full 10-minute screening workflow without any errors |
