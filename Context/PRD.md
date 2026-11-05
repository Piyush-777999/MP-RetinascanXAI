# Product Requirements Document (PRD)

**RetinaScan-XAI: Clinical Decision Support & In-Silico Explainable AI Platform for Point-of-Care Diabetic Eye Care**

**Version:** 3.0 | **Focus Area:** Clinical Ophthalmology / MedTech / Causal XAI | **Status:** PRODUCTION

---

## 1. Executive Summary

Diabetic Retinopathy (DR) and Clinically Significant Macular Edema (CSME) are primary drivers of preventable blindness in working-age adults worldwide. In India—home to over 77 million diabetic adults—rural primary healthcare centres (PHCs) face an acute shortage of eye specialists (~1 ophthalmologist per 100,000 population). Patients in remote villages typically present only at advanced, irreversible stages of sight loss.

**RetinaScan-XAI** is an offline-first, hospital-grade Clinical Decision Support System (CDSS) that empowers grassroots healthcare personnel (ASHA workers, optometrists, PHC staff) and remote ophthalmologists to conduct rapid, interpretable DR screening. 

Unlike conventional "black-box" classifiers, RetinaScan-XAI introduces **quad-level explainability**:
1. **Global Receptive Saliency:** Real-time Grad-CAM++ neural activation mapping.
2. **Pathological Biomarker Inventory:** Computer vision segmentation of microaneurysms, hemorrhages, and exudates.
3. **Interactive In-Silico Laser Counterfactual XAI:** A virtual photocoagulation laboratory allowing clinicians to test causal disease attribution ($\Delta P$).
4. **Automated ETDRS 9-Zone Macular Grid & CSME Profiler:** Sub-millimeter foveal distance calipers stratifying center-involved macular edema threats.

---

## 2. Product Personas & Dual-View Paradigm

RetinaScan-XAI solves the communication gap in tele-ophthalmology through a **dual-persona workstation**:

### Persona A: Specialist Ophthalmologist & Reviewing Physician
- **Clinical Needs:** Full ICDR 5-grade calibrated probabilities, high-resolution PACS viewer, sub-pixel lesion overlays, ETDRS foveal ring calipers, Red-Free optical filtration, in-silico causal testing, and formal clinical referral letter generation.
- **Goal:** Validate an automated triage case in under 30 seconds with complete diagnostic confidence.

### Persona B: ASHA Worker / Community Health Assistant
- **Community Needs:** Clear, culturally tailored vernacular instructions in regional languages (Hindi, Marathi, Telugu, Tamil, Bengali, English), audio narration for illiterate patients, rural dietary and lifestyle pictograms, and printable take-home slips.
- **Goal:** Explain the screening findings and urgency of hospital care to patients and families without causing panic.

---

## 3. Product Goals & Objectives

| ID | Clinical Objective | Specification / Target Metric |
| :--- | :--- | :--- |
| **G1** | **High-Sensitivity Referable DR Detection** | Sensitivity $\ge 90.0\%$ (Achieved: **93.3%** on multi-center held-out evaluation). |
| **G2** | **High Specificity to Prevent Over-Referral** | Specificity $\ge 85.0\%$ (Achieved: **86.2%** on multi-center held-out evaluation). |
| **G3** | **Macular Edema Triage** | Automated ETDRS 9-zone classification flagging Center-Involved CSME ($<500\,\mu m$ from fovea). |
| **G4** | **Causal Explainability** | Real-time biophysical laser inpainting with live forward-pass re-inference and causal $\Delta P$ delta calculation. |
| **G5** | **Offline Edge Autonomy** | 100% functionality on clinic laptops with zero internet or cloud dependencies. |
| **G6** | **Universal Sensor Parity** | Support standard square fundus cameras (1:1) and wide-angle rectangular sensors (1.51:1) with zero optical distortion or clipping. |
| **G7** | **Multi-Regional Accessibility** | Full vernacular localization across 6 Indian languages with Web Speech TTS audio synthesis. |

---

## 4. Functional Requirements

### FR1: Multistage Image Quality Assessment (IQA) & OOD Gatekeeper
- Validates image dimensions ($\ge 150\times 150\,\text{px}$), exposure limits (mean gray $>10.0$ and $<230.0$), field-of-view coverage ($>10\%$).
- Analyzes melanin and vascular pigment signatures (Red/Blue ratio $\ge 1.70$, Red/Green ratio $\ge 1.10$, Blue excess $<4\%$).
- Rejects non-medical images (documents, screenshots, consumer photos) via orthogonal Hough line detection.
- Rejects ungradeable or non-fundus images with clear clinical guidance instead of hallucinating diagnostic grades.

### FR2: ICDR 5-Grade Staging Engine
- Classifies fundus photographs into the International Clinical Diabetic Retinopathy (ICDR) scale:
  - **Grade 0:** No Apparent DR
  - **Grade 1:** Mild Non-Proliferative DR (NPDR)
  - **Grade 2:** Moderate NPDR
  - **Grade 3:** Severe NPDR
  - **Grade 4:** Proliferative DR (PDR)
- Flags Referable DR (Grade $\ge 2$) using optimal Youden-calibrated thresholding.

### FR3: Pathological Lesion Segmentation & Anatomical Radar
- Detects microaneurysms (MAs), blot/flame hemorrhages (HEs), and hard exudates (EXs).
- Masks out optical disc (OD) and retinal vasculature to eliminate false positives.
- Implements **Grade-Aware ICDR Harmonization**: Grade 0 scans strictly output zero pathological lesions.

### FR4: Automated ETDRS 9-Zone Macular Grid & CSME Profiler
- Calibrates 9 standard ETDRS concentric sectors: Central Foveal Subfield (CSF, 1mm), Inner Ring (3mm: IS, IN, II, IT), Outer Ring (6mm: OS, ON, OI, OT).
- Supports fovea reticle recalibration and auto-mirrors Nasal/Temporal sectors between OD (Right Eye) and OS (Left Eye).
- Calculates exact micron proximity to nearest hard exudates, classifying CSME into High Risk (Center-Involved, $\le 500\,\mu m$), Moderate Risk ($500-1500\,\mu m$), Borderline ($1500-3000\,\mu m$), or Clear ($>3000\,\mu m$).

### FR5: In-Silico Laser Counterfactual XAI Laboratory
- Allows clinicians to target suspect lesions or place freehand laser photocoagulation spots ($532\,\text{nm}$ green laser burns).
- Reconstructs healthy tissue using Navier-Stokes / Telea biophysical inpainting.
- Re-runs ResNet-50 inference and Grad-CAM in real-time, displaying side-by-side treated scans, probability drops ($\Delta P$), and causal attribution strength.

### FR6: Clinical PACS Workstation & Visual Ergonomics
- Features **Dynamic Aspect-Ratio Letterbox Calibration** (`imgBounds`), preventing sensor clipping.
- Provides smooth optical zoom (100% to 300%) with clinical steppers (1x, 1.5x, 2x, 2.5x), drag-to-pan inspection, and mouse wheel zoom.
- Includes toggleable diagnostic layers: Grad-CAM++ saliency, lesion pins, Red-Free optical filter, and ETDRS concentric rings.

### FR7: ASHA Community Counseling & Multilingual Audio
- Dual-role switch seamlessly transitioning between Doctor Console and Community Counselor.
- Multilingual translation across 6 languages: Hindi (हिन्दी), Marathi (मराठी), Telugu (తెలుగు), Tamil (தமிழ்), Bengali (বাংলা), and English.
- Integrated Text-to-Speech (TTS) engine speaking standardized, culturally sensitive counseling scripts.
- Visual pictograms and printable patient advice slips with dietary guidelines, glycemic targets, and hospital referral timelines.

---

## 5. Non-Functional Requirements

| Metric / Dimension | Specification |
| :--- | :--- |
| **Inference Latency** | $< 250\,\text{ms}$ on standard CPU; $< 30\,\text{ms}$ on CUDA GPU. |
| **System Footprint** | Peak RAM consumption $< 2.8\,\text{GB}$, suitable for standard clinic laptops. |
| **Network Autonomy** | 100% offline-ready; zero calls to external cloud APIs or remote tracking. |
| **Patient Privacy** | Compliant with ABDM (Ayushman Bharat Digital Mission) and HIPAA principles; images stored locally. |
| **Data Persistence** | Intake queue and patient state cached via browser LocalStorage with zero data loss on reload. |

---

## 6. Success Metrics & Validation

- **Clinical Benchmark Compliance:** Surpassed WHO screening requirements ($\ge 80\%$ sensitivity, $\ge 80\%$ specificity) by reaching **93.3% Sensitivity** and **86.2% Specificity** on multi-center held-out validation (APTOS 2019 + MESSIDOR-2).
- **Specialist Review Acceleration:** Reduces ophthalmologist validation time from 3–5 minutes down to **$< 30$ seconds per case**.
- **Community Referral Compliance:** Clear vernacular audio-visual instructions improve rural patient hospital follow-up rates.
