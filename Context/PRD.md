# Product Requirements Document (PRD)

**RetinaScan-XAI: Explainable AI Platform for Diabetic Retinopathy Screening in Rural India**

Focus Area: Clinical Ophthalmology / MedTech | Architecture: Deep Learning & XAI | Version: 2.0

---

## 1. Executive Summary

RetinaScan-XAI is a clinical decision support system that screens fundus (retinal) photographs for Diabetic Retinopathy (DR) and delivers clinically interpretable results to frontline health workers in rural primary healthcare centres (PHCs). The system pairs a deep learning classification core (ResNet-50 fine-tuned on APTOS 2019) with Grad-CAM explainability overlays and a lightweight, offline-first clinical web interface. This pipeline allows a single remote ophthalmologist to validate hundreds of screenings per day in under 30 seconds per review.

---

## 2. Problem Statement

India has 77M+ diabetic adults (2nd globally). Over 18% develop Diabetic Retinopathy, a leading but preventable cause of blindness. Rural India has approximately 1 ophthalmologist per 100,000 population. Existing AI screening tools operate as non-interpretable black boxes, and degrade on lower-quality images from portable fundus cameras used in rural settings.

---

## 3. Goals & Objectives

| # | Objective | Target |
|---|-----------|--------|
| G1 | Evaluate and enhance raw fundus image quality before grading | Auto-reject ungradeable images; provide recapture feedback |
| G2 | Segment clinically critical retinal structures | Optic disc, fovea, vessel tree, microaneurysms, exudates |
| G3 | Grade DR severity automatically | ICDR Levels 0-4 (No DR through Proliferative DR) |
| G4 | Clinical-grade accuracy for referable DR (Level 2+) | Sensitivity > 90%, Specificity > 85% on validated benchmarks |
| G5 | Generate explainable AI overlays | Grad-CAM heatmaps aligned with detected lesions |
| G6 | Operate offline at the edge | 100% offline execution for capture, grading, and report generation |

**Out of Scope (v1):** Mobile native apps, direct EHR integration, non-DR ocular pathology diagnosis, multi-language localization.

---

## 4. Target Users

| User | Profile | Needs |
|------|---------|-------|
| Health Worker (PHC Operator) | Non-specialist staff at rural PHCs using portable cameras | Simple capture workflow, immediate quality validation, color-coded severity flags |
| Remote Ophthalmologist | Specialist validating AI-graded screenings from a central hub | Explainable evidence layers, toggleable overlays, single-click validation |
| Program Admin | District health supervisor managing clinic performance | Aggregated dashboards, screening throughput metrics |
| Patient | Rural citizen undergoing preventative screening | Accurate, rapid evaluation and clear referral if diagnosed |

---

## 5. Functional Requirements

### FR1 -- Image Quality Assessment (IQA) & Enhancement
Execute local IQA to inspect illumination, focus, and field-of-view. If marginal, apply adaptive filters (CLAHE, local normalization). If ungradeable, reject with actionable operator feedback.

### FR2 -- Retinal Structure Segmentation
Map core biomarkers: optic disc/fovea localization, retinal vascular tree tracing, microaneurysm identification, exudate/hemorrhage clustering. Flag proliferative indicators (neovascularization).

### FR3 -- DR Severity Grading
Classify DR severity on ICDR 0-4 scale using fine-tuned ResNet-50. Must meet referable DR accuracy threshold of Sensitivity > 90% and Specificity > 85%.

### FR4 -- Explainability Module
Generate Grad-CAM heatmaps from the final convolutional layer, aligned with detected lesions. Auto-generate a structured clinical summary for remote review in under 30 seconds.

### FR5 -- Clinical Review Interface
Web dashboard allowing remote clinicians to review flagged scans with toggleable diagnostic layers (vascular maps, exudates, XAI heatmaps). Color-coded severity headers with single-click validation controls.

### FR6 -- Offline-First Operation
All critical clinical functions (image capture, quality check, DR classification, explainability generation) must work with no network connection.

---

## 6. Technical Architecture

The system uses a 3-layer decoupled architecture:

1. **ML Core Layer:** ResNet-50 classifier with CLAHE/Ben Graham preprocessing and Grad-CAM explainability.
2. **API Layer:** FastAPI local server (localhost:8000) bridging the ML core to the frontend. Single-threaded inference queue to prevent memory exhaustion.
3. **Frontend Layer:** React + Vite single-page application with a clinical PACS-style interface for image review and lesion annotation.

---

## 7. Success Metrics

| Metric | Target |
|--------|--------|
| Clinical Sensitivity (Referable DR, Level 2+) | > 90% (Validated on APTOS 2019 + MESSIDOR-2) |
| Clinical Specificity (Referable DR, Level 2+) | > 85% (Validated on APTOS 2019 + MESSIDOR-2) |
| Ophthalmologist Review Speed | < 30 seconds per automated case via XAI overlays |
| IQA Rejection Accuracy | Zero false-reject rate for clean fundus images |
| Edge Resilience | 100% of screening functions operational offline |

---

## 8. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| Clinical Accuracy | Sensitivity > 90%, Specificity > 85% against APTOS 2019 and MESSIDOR-2 |
| Latency | Single-image processing (enhancement + grading + heatmap) < 8 seconds on standard clinic laptop |
| Offline | All primary screening functions run without internet |
| Resource Limits | Must operate on standard laptops with < 3GB peak memory usage |
| Usability | Zero training curve; simple color-coded indicators for health technicians |

---

## 9. Benchmark Datasets

| Dataset | Use | Focus |
|---------|-----|-------|
| APTOS 2019 Blindness Detection | Primary training + validation | 5-class severity grading |
| MESSIDOR-2 | Cross-dataset generalization test | Distribution plausibility check |

---

## 10. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Variable field image quality from low-cost cameras | High | Rigorous IQA gate + CLAHE enhancement |
| Diagnostic false negatives on referable cases | Critical | Conservative decision threshold (0.1162), mandatory specialist review |
| Skepticism of deep learning outputs | Medium | Grad-CAM explainability aligned with detected lesions |
| Non-fundus image uploads (watermelons, faces) | Medium | OOD validation heuristic + low-confidence fallback |
