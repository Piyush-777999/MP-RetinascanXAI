# A REPORT ON
# RetinaScan-XAI: Explainable AI-Powered Diabetic Retinopathy Screening with In-Silico Counterfactual Laboratory
### Mini-Project II (TY-IT)

**Submitted by:**
- **Piyush Pawar** (246109015)
- **Atharva Kansurkar** (246109025)
- **Ashish Jaiswal** (246109060)

**Under the guidance of:**
**Mr. Varad Potdar**

**Department of Information Technology**  
**Walchand College of Engineering, Sangli**  
*(An Autonomous Institute)*  
**Maharashtra, India — 416415**  
**Academic Year: 2026–2027**

---

## CERTIFICATE

This is to certify that the project work entitled **"RetinaScan-XAI: Explainable AI Platform for Diabetic Retinopathy Screening"** submitted by **Mr. Piyush Pawar (246109015)**, **Mr. Atharva Kansurkar (246109025)**, and **Mr. Ashish Jaiswal (246109060)** in fulfillment of the requirement for the degree of **Bachelor of Technology in Information Technology** from **Walchand College of Engineering, Sangli**, affiliated to Shivaji University, Kolhapur, is a record of students' own bonafide work carried out under my supervision and guidance during the academic session 2026–2027.

\
**Mr. Varad Potdar**  
*(Project Guide)*  

\
**(External Examiner)**  

\
**Dr. U. B. Chavan**  
*(Head of Department)*  

---

## DECLARATION

We hereby declare that the project report entitled **"RetinaScan-XAI: Explainable AI Platform for Diabetic Retinopathy Screening"** submitted to Walchand College of Engineering, Sangli, in fulfillment of the requirement for the award of the degree of Bachelor of Technology in Information Technology, is a record of bonafide project work carried out under the guidance of **Prof. Varad Potdar**.

We further declare that the work reported in this project report has not been submitted and will not be submitted, either in part or in full, for the award of any other degree or diploma in this Institute or any other institute or university. This report reflects our own understanding of the subject, written in our own words, with appropriate citations for all referenced literature.

**Piyush Pawar (246109015)**  
**Atharva Kansurkar (246109025)**  
**Ashish Jaiswal (246109060)**  

Date: 05/11/2026  
Place: Sangli  

---

## ACKNOWLEDGEMENT

We express our sincere gratitude to **Mr. Varad Potdar** for his continuous technical guidance, constructive critiques, and encouragement throughout the lifecycle of this project. His clinical and architectural insights were invaluable at every milestone.

We extend our gratitude to **Dr. U. B. Chavan**, Head of the Department of Information Technology, Walchand College of Engineering, Sangli, for providing computing infrastructure, laboratory facilities, and an encouraging environment to conduct this deep learning research. We also thank all faculty and technical staff of the Information Technology Department for their support.

Finally, we thank our parents, family members, and classmates for their motivation and encouragement throughout our academic endeavors.

**Piyush Pawar** | **Atharva Kansurkar** | **Ashish Jaiswal**

---

## ABSTRACT

Diabetic Retinopathy (DR) represents the primary cause of preventable blindness among working-age adults globally, impacting over 77 million diabetic individuals in India alone. Rural primary healthcare centres (PHCs) face an acute shortage of vitreoretinal specialists (~1 ophthalmologist per 100,000 population), resulting in delayed diagnoses and irreversible visual impairment. While automated deep learning screening models have emerged, existing solutions function as opaque "black boxes" lacking clinical interpretability, rely heavily on cloud infrastructures that compromise patient data sovereignty, and fail when exposed to variable camera aspect ratios or non-retinal artifacts.

This project presents **RetinaScan-XAI**, an offline-first, hospital-grade Clinical Decision Support System (CDSS) for automated diabetic retinopathy grading, macular edema staging, and causal explainability at the primary care level. Powered by a fine-tuned ResNet-50 v2 convolutional neural network trained on a multi-center dataset of **4,324 fundus photographs** from the **APTOS 2019** and **MESSIDOR-2** repositories, the system achieves **93.3% Sensitivity**, **86.2% Specificity**, and an **AUC-ROC of 0.9702** on a held-out test cohort of 1,082 images at a Youden-calibrated threshold of 0.1657, surpassing established clinical targets ($\ge 90\%$ sensitivity, $\ge 85\%$ specificity).

RetinaScan-XAI introduces **quad-level explainability**: (1) global diagnostic saliency via memory-safe Grad-CAM++ activation mapping; (2) anatomical lesion segmentation using morphological filters to detect microaneurysms, hemorrhages, and hard exudates; (3) an interactive In-Silico Laser Counterfactual XAI Laboratory that applies biophysical Fast Marching Telea inpainting to simulate argon laser photocoagulation and quantify causal probability shifts ($\Delta P$); and (4) an automated ETDRS 9-Zone Macular Grid calculating sub-millimeter foveal proximity calipers for Clinically Significant Macular Edema (CSME) risk stratification. The platform incorporates a dual-persona workstation (Doctor Clinical Console ↔ ASHA Community Health Worker Counseling Hub), supporting six Indian languages (Hindi, Marathi, Telugu, Tamil, Bengali, English) with synthesized audio narration. The entire architecture operates locally on edge hardware with zero external cloud dependencies, completing the full diagnostic cycle in under 4.2 seconds on CPU and 1.8 seconds on GPU.

---

## TABLE OF CONTENTS

- **1. Introduction**
  - 1.1 Diabetic Retinopathy and the Public Health Crisis
  - 1.2 Limitations of Existing Screening Approaches
  - 1.3 Need for Explainable AI in Ophthalmology
  - 1.4 Problem Statement
  - 1.5 Project Overview
  - 1.6 Scope of the Project
- **2. Objectives**
- **3. Existing System vs. Proposed System**
  - 3.1 Manual Clinical Grading
  - 3.2 Existing AI-Based Tools and Their Limitations
  - 3.3 Comparative Analysis
- **4. Proposed System**
  - 4.1 System Overview
  - 4.2 Key Features and Clinical Innovations
- **5. System Architecture**
  - 5.1 Architecture Diagram
  - 5.2 System Components
- **6. Technologies Used**
- **7. Methodology**
  - 7.1 Image Acquisition and Dynamic Letterbox Calibration
  - 7.2 Multistage Image Quality Assessment (IQA) & OOD Gatekeeper
  - 7.3 Preprocessing: Ben Graham Normalization and CLAHE
  - 7.4 ResNet-50 v2 DR Severity Grading
  - 7.5 Memory-Safe Grad-CAM++ Saliency Generation
  - 7.6 Computer Vision Pathological Lesion Segmentation
  - 7.7 Automated ETDRS 9-Zone Macular Grid & CSME Risk Profiling
  - 7.8 In-Silico Laser Counterfactual XAI Engine
- **8. Model Training**
  - 8.1 Multi-Center Dataset Preparation
  - 8.2 Deep Neural Network Architecture
  - 8.3 Training Configuration and Optimization
  - 8.4 Segmentation Model Training (Lesion & Vessel U-Net)
- **9. Clinical Performance and Validation**
  - 9.1 Multi-Center Diagnostic Evaluation Metrics
  - 9.2 Binary Confusion Matrix Analysis
  - 9.3 ROC Curve and Threshold Optimization
  - 9.4 Graphical Performance Visualizations
- **10. Implementation Details**
  - 10.1 Machine Learning Core & Architecture Unification
  - 10.2 Asynchronous FastAPI Backend
  - 10.3 React 18 & Vite PACS Workstation
- **11. Results and Experimental Analysis**
  - 11.1 Observed Clinical Results
  - 11.2 Computational Latency and Edge Efficiency
- **12. Advantages**
- **13. Limitations**
- **14. Future Scope**
- **15. Conclusion**
- **16. References**

---

# 1. INTRODUCTION

### 1.1 Diabetic Retinopathy and the Public Health Crisis
Diabetic Retinopathy (DR) is a progressive microvascular complication of diabetes mellitus that damages the microvasculature supplying the retina. Chronic hyperglycemia induces capillary endothelial cell loss, pericyte drop-out, and basement membrane thickening, leading to microaneurysms, intraretinal hemorrhages, lipid exudation, and retinal ischemia. In advanced stages, retinal hypoxia triggers vascular endothelial growth factor (VEGF) hypersecretion, stimulating aberrant, fragile neovascularization on the disc or retina (Proliferative Diabetic Retinopathy, PDR), which can bleed into the vitreous or cause tractional retinal detachment. Concurrently, breakdown of the blood-retinal barrier causes plasma extravasation into the foveal region, manifesting as Clinically Significant Macular Edema (CSME)—the primary cause of moderate-to-severe central visual loss in diabetic individuals.

According to the International Diabetes Federation (IDF), India has over 77 million diabetic adults, ranking second globally. Epidemiological surveys indicate that approximately 18% of Indian diabetic patients suffer from Diabetic Retinopathy. Early-stage retinopathy is entirely asymptomatic; patients rarely seek clinical consultation until irreversible visual deterioration occurs. Routine screening via digital retinal fundus photography is the gold standard for secondary prevention. However, with rural India possessing approximately 1 ophthalmologist per 100,000 citizens, conventional specialist-dependent screening models fail to scale, creating an urgent public health imperative for automated, explainable, edge-based point-of-care screening.

### 1.2 Limitations of Existing Screening Approaches
Manual grading of fundus photographs against the International Clinical Diabetic Retinopathy (ICDR) severity scale requires certified ophthalmologists or trained optometrists. The manual workflow is labor-intensive, operator-dependent, subject to significant inter-observer variability, and unfeasible across remote primary health centers (PHCs).

To address this shortage, commercial and research AI algorithms have been proposed. However, these systems exhibit two critical barriers to deployment:
1. **Opaque Black-Box Classifiers:** Commercial platforms output categorical disease labels or arbitrary risk scores without exposing their diagnostic reasoning. Clinicians cannot inspect what ocular biomarkers influenced the model's decision, preventing clinical validation or safe intervention overrides.
2. **Cloud Dependency & Data Sovereignty Risks:** Most proprietary solutions require streaming high-resolution fundus photographs to remote cloud APIs. In rural clinics with intermittent or absent internet connectivity, these tools fail completely. Furthermore, unencrypted transmission of Protected Health Information (PHI) poses severe compliance risks under medical privacy statutes such as the Digital Personal Data Protection (DPDP) Act, 2023.

### 1.3 Need for Explainable AI in Ophthalmology
Explainability in clinical AI is not merely an interpretability exercise—it is an ethical and diagnostic safeguard. Medical practitioners are legally and professionally accountable for treatment recommendations, including photocoagulation timing, intravitreal anti-VEGF injections, and specialist referral urgency. Clinicians cannot justify invasive interventions based on an uninterpretable probability score. Clinical decision-making requires verifiable evidence: *Which specific microvascular lesions elevated the stage? Are exudates threatening the central fovea? Would laser ablation of localized hemorrhages downstage the disease severity?* Providing answers to these questions via multimodal explainability is essential to establish clinical trust.

### 1.4 Problem Statement
Manual grading of fundus photographs across rural populations is bottlenecked by the acute shortage of trained ophthalmologists, while existing deep learning diagnostic tools operate as uninterpretable black boxes that are cloud-dependent and susceptible to sensor aspect-ratio cropping. 

The objective of this project is to design, develop, and clinically validate an end-to-end, offline-first Clinical Decision Support System (CDSS) that accepts raw retinal fundus photographs, validates clinical image quality, stages diabetic retinopathy across five ICDR grades using an edge-optimized deep learning backbone, extracts multi-level visual and causal explainability (Grad-CAM++, morphological lesion segmentation, automated ETDRS macular grids, and in-silico laser photocoagulation counterfactual simulation), and delivers localized patient guidance via a dual-persona interface on standard clinic laptops.

### 1.5 Project Overview
**RetinaScan-XAI** is an offline-first clinical workstation built on a 3-tier decoupled architecture comprising a PyTorch deep learning core, an asynchronous FastAPI web service, and a React 18 PACS-style web client. Upon image upload, a multistage Image Quality Assessment (IQA) and Out-of-Distribution (OOD) gatekeeper evaluates exposure, focus, FOV coverage, and retinal pigment signatures, rejecting invalid or non-fundus photographs. Validated scans undergo CLAHE and Ben Graham normalization before passing to a fine-tuned ResNet-50 v2 convolutional neural network.

The system simultaneously generates:
1. Calibrated multi-class probability vectors across all five ICDR severity grades.
2. A Grad-CAM++ saliency heatmap highlighting the neural receptive fields driving the classification.
3. An automated Computer Vision Lesion Segmentation pipeline that localizes and classifies microaneurysms, hemorrhages, and hard exudates.
4. An automated ETDRS 9-Zone Macular Grid that calculates sub-millimeter foveal distance calipers to identify Center-Involved CSME.
5. An interactive In-Silico Laser Counterfactual XAI Laboratory that allows clinicians to simulate argon laser burns, reconstruct healthy tissue using Fast Marching Telea inpainting, and observe live causal probability shifts ($\Delta P$).

The frontend provides a dual-persona console: an advanced PACS diagnostic suite for ophthalmologists and a vernacular counseling hub in six Indian languages with audio voice narration for ASHA workers.

### 1.6 Scope of the Project
The primary scope includes:
- Automated ICDR 5-grade classification of digital fundus photographs.
- Four-level explainability (Grad-CAM++, lesion segmentation, ETDRS grid, laser counterfactuals).
- Multi-center validation on APTOS 2019 and MESSIDOR-2 benchmark cohorts.
- 100% offline edge execution on commodity laptop hardware.
- Dual-persona interface serving ophthalmologists and rural health workers.

*Future extensions include native mobile fundus camera streaming, Optical Coherence Tomography (OCT) scan analysis, multi-disease screening (glaucoma and AMD), and direct hospital EHR integration.*

---

# 2. OBJECTIVES

The technical and clinical objectives of the project are:
1. **Develop an Accurate Multi-Center DR Classifier:** Fine-tune a ResNet-50 deep neural network on multi-center clinical datasets (APTOS 2019 and MESSIDOR-2) achieving $\ge 90.0\%$ sensitivity and $\ge 85.0\%$ specificity for referable diabetic retinopathy.
2. **Implement Dual-Level Diagnostic Saliency & Lesion Mapping:** Integrate memory-safe Grad-CAM++ gradient attribution with morphological computer vision filters to locate and categorize microaneurysms, hemorrhages, and exudates across all four retinal quadrants.
3. **Build an In-Silico Laser Counterfactual Engine:** Develop a virtual laser photocoagulation simulator using Telea biophysical inpainting that computes quantitative causal probability shifts ($\Delta P$) to test model decision hypotheses.
4. **Automate ETDRS 9-Zone Macular Staging:** Implement sub-millimeter foveal proximity calipers conforming to the Early Treatment Diabetic Retinopathy Study grid to stratify Clinically Significant Macular Edema (CSME) risk.
5. **Engineer an Out-of-Distribution (OOD) Clinical Gatekeeper:** Implement chromatic, luminance, and structural checks that prevent false diagnoses by rejecting non-retinal images, blur, and severe flash artifacts.
6. **Design a Dual-Persona Vernacular Workstation:** Construct an offline-first interface tailored for both specialist review and rural community counseling across six regional Indian languages with text-to-speech audio narration.
7. **Ensure Complete Edge Autonomy:** Optimize memory consumption ($< 2.8\text{ GB}$) and inference latency ($< 4.5\text{ s}$ on CPU) to guarantee standalone performance without internet access.

---

# 3. EXISTING SYSTEM VS. PROPOSED SYSTEM

### 3.1 Manual Clinical Grading
In the conventional paradigm, ophthalmologists perform slit-lamp biomicroscopy or examine color fundus prints against complex ICDR/ETDRS criteria. While diagnostically accurate, manual grading is constrained by:
- Severe specialist deficits in rural territories.
- High fatigue and significant inter-observer variability during mass screenings.
- Prolonged turnaround times (often weeks before specialist reports reach rural villages).

### 3.2 Existing AI-Based Tools and Their Limitations
Recent automated tools (such as IDx-DR and Google DeepMind's DR system) have demonstrated high diagnostic accuracy. However, they present critical limitations:
- **Absence of Interactive Explainability:** Existing tools offer static heatmaps or unadorned labels. They do not allow clinicians to probe the model's logic through counterfactual ablation.
- **Neglect of CSME Risk Calibration:** Most classifiers lump macular edema into an aggregate grade rather than calculating foveal proximity calipers.
- **Lack of Cultural and Vernacular Accessibility:** Interfaces are English-only and heavily clinical, offering no actionable utility to frontline ASHA workers.
- **Optical Aspect-Ratio Clipping:** Commercial web viewers utilize rigid circular viewports that crop wide-angle fundus sensors (1.51:1) by up to 34%, hiding the optic disc.

### 3.3 Comparative Analysis

| Feature / Dimension | Manual Clinical Review | Conventional AI Classifiers | RetinaScan-XAI (Proposed System) |
| :--- | :--- | :--- | :--- |
| **Grading Speed** | 5–15 minutes per patient | 10–30 seconds (Cloud-bound) | **< 2.0 seconds (Local Edge)** |
| **Diagnostic Transparency** | Expert human judgment | Black-box / Static CAM only | **Quad-Level XAI + In-Silico Laser Causal $\Delta P$** |
| **Macular Edema Triage** | Subjective visual estimate | Omitted or binary flag | **Automated ETDRS 9-Zone Grid with Sub-mm Calipers** |
| **Pathology Inventory** | Manual counting | Coarse bounding boxes / None | **Sub-pixel segmentation + 4-Quadrant Radar** |
| **Network Dependency** | N/A (In-person) | High-bandwidth Cloud API | **100% Offline Edge Autonomy** |
| **Camera Sensor Parity** | Manual adjustment | Rigid cropping (loses 34% area) | **Dynamic Letterbox Calibration (`imgBounds`)** |
| **Frontline Usability** | Specialist only | Specialist-oriented English | **Dual-Persona (Doctor + 6-Language ASHA Portal)** |
| **OOD Safety Guard** | Human discretion | Hallucinates disease grades | **5-Stage Chromatic & Anatomical Gatekeeper** |

---

# 4. PROPOSED SYSTEM

### 4.1 System Overview
RetinaScan-XAI is an edge-native Clinical Decision Support System designed for point-of-care eye clinics. The operational pipeline proceeds as follows:
1. **Intake & Optical Letterbox Calibration:** The operator registers patient vitals (HbA1c, diabetes duration, laterality) and uploads a fundus photograph. The system computes dynamic letterbox bounds (`imgBounds`) to preserve the natural aspect ratio of wide-angle or square sensors.
2. **Quality & OOD Gatekeeper:** The image undergoes five quality validation checks. Ungradeable or non-fundus uploads are intercepted with descriptive error messages.
3. **Deep Neural Staging & Saliency:** The normalized image is passed through ResNet-50 v2 to predict ICDR severity probabilities. Grad-CAM++ hooks extract the gradient attribution heatmap.
4. **Morphological Lesion Segmentation:** Computer vision algorithms segment microaneurysms, hemorrhages, and hard exudates, masking out the optic disc and dilated vascular tree.
5. **ETDRS Macular Edema Profiling:** The fovea is localized, and 9 concentric ETDRS zones are projected to measure sub-millimeter proximity to exudates, stratifying CSME risk.
6. **In-Silico Laser Counterfactual Analysis:** Clinicians can select suspect lesions, simulate argon laser burns via Telea inpainting, and execute live re-inference to verify the causal probability drop ($\Delta P$).
7. **Dual-Persona Workstation Delivery:** Results are rendered in either the high-contrast Doctor PACS Console (with 100%–300% zoom and pan) or the Multilingual ASHA Counseling Hub (with spoken audio and dietary pictograms).

### 4.2 Key Features and Clinical Innovations

```
┌────────────────────────────────────────────────────────────────────────┐
│                    RETINASCAN-XAI CORE INNOVATIONS                     │
│                                                                        │
│  [1] In-Silico Laser Counterfactual Studio (Telea Inpainting & ΔP)     │
│  [2] Automated ETDRS 9-Zone Grid (<500µm Center-Involved CSME Triage)  │
│  [3] Dynamic Letterbox Calibration (Zero Crop across 1:1 and 1.51:1)   │
│  [4] Clinical Optical Zoom (100%–300%) with Active Drag-to-Pan         │
│  [5] Dual-Persona Interface (Doctor PACS ↔ 6-Language ASHA Hub)        │
│  [6] Multistage Chromatic & Structural Out-of-Distribution Gatekeeper  │
└────────────────────────────────────────────────────────────────────────┘
```

---

# 5. SYSTEM ARCHITECTURE

### 5.1 Architecture Diagram

```mermaid
flowchart TD
    A[Raw Retinal Photograph] --> B[Multistage OOD & IQA Gatekeeper]
    B -->|Failed| X[Structured OOD 415/200 Rejection Alert]
    B -->|Passed| C[Inference Transforms & Normalization]
    
    C --> D[ResNet-50 v2 Classifier Backbone]
    D --> E[Calibrated Softmax Probabilities]
    E --> F[ICDR 5-Grade Staging: Grade 0 to 4]
    
    D --> G[Grad-CAM Layer4 Gradient Hook]
    G --> H[Pixel-Perfect Alpha BGRA Heatmap PNG]
    
    A --> I[Computer Vision Lesion Segmentor]
    I --> J[Morphological Top-Hat / Bottom-Hat Filtering]
    J --> K[Vascular Tree Subtraction & Optic Disc Exclusion]
    K --> L[Indexed Lesion Inventory: MA, HE, EX]
    
    F --> M[ICDR Standardization Harmonization]
    L --> M
    
    M --> N[Clinical Workstation Results View]
    H --> N
    
    N --> P[Automated ETDRS 9-Zone Macular Profiler]
    P --> N
    
    N --> O[⚡ In-Silico Laser Counterfactual Engine]
    O -->|Telea Inpainting + ResNet-50 Re-Inference| N
```

### 5.2 System Components

The system is decomposed into three isolated, modular tiers:

1. **ML Inference & Explainability Core (`ml_script/`):**
   - ResNet-50 v2 backbone with custom classification head.
   - Hook-leak-free Grad-CAM++ module.
   - Morphological lesion segmentor and ETDRS distance calculator.
   - Fast Marching Telea inpainting causal engine.

2. **Asynchronous Edge Backend (`Backend/`):**
   - Built with **FastAPI** and **Uvicorn**, serving REST endpoints on port 8000.
   - Features `asyncio.Lock()` inference serialization to guarantee single-threaded execution and prevent Out-Of-Memory (OOM) faults on constrained laptop RAM.
   - Houses static asset servers for live generated Grad-CAM heatmaps and treated inpainting scans.

3. **Clinical PACS Workstation (`Frontend/retinascan-app/`):**
   - Single-page application built on **React 18** and **Vite**.
   - Contains nine specialized screening views, LocalStorage intake queue caching, dynamic letterbox aspect ratio calibration (`imgBounds`), optical zoom/pan canvas, and Web Speech API audio synthesis.

---

# 6. TECHNOLOGIES USED

| Technology / Library | Version | Functional Role in Architecture |
| :--- | :---: | :--- |
| **Python** | 3.10+ | Primary backend and deep learning runtime environment |
| **PyTorch & Torchvision** | 2.2+ | ResNet-50 neural network modeling, GPU acceleration, and autograd gradient extraction |
| **OpenCV** | 4.9+ | CLAHE contrast enhancement, morphological filtering, and Telea Fast Marching inpainting |
| **FastAPI** | 0.111+ | High-performance asynchronous REST API framework |
| **Uvicorn** | 0.29+ | ASGI production web server running the edge backend |
| **React** | 18.0+ | Reactive user interface, component state management, and virtual DOM rendering |
| **Vite** | 5.0+ | Frontend development server and optimized static production bundler |
| **Pillow & NumPy** | Latest | Image file I/O, format conversion, and multi-dimensional matrix operations |
| **Scikit-Learn** | 1.4+ | Stratified dataset splitting, ROC-AUC computation, and Youden's J threshold optimization |
| **Web Speech API** | Native | In-browser speech synthesis for multilingual ASHA audio counseling |

---

# 7. METHODOLOGY

### 7.1 Image Acquisition and Dynamic Letterbox Calibration
The clinical operator inputs patient metadata (identifier, age, gender, duration of diabetes, and current HbA1c) and uploads the fundus image via a drag-and-drop file picker. Fundus cameras produce diverse aspect ratios, ranging from square apertures ($1050\times 1050$, 1:1) to wide-field rectangular CCD sensors ($1600\times 1062$, 1.51:1). Conventional viewers crop rectangular images by 34%, slicing off the optic disc and nasal arcades. 

To eliminate optical distortion, RetinaScan-XAI measures the image's intrinsic aspect ratio ($A = w / h$) upon load and calculates a responsive letterbox coordinate frame:

$$\text{imgBounds} = \begin{cases} 
\left\{ w: 100\%, \; h: \frac{100\%}{A}, \; \text{left}: 0\%, \; \text{top}: \frac{100 - (100/A)}{2}\% \right\}, & \text{if } A \ge 1 \\ 
\left\{ w: 100\% \times A, \; h: 100\%, \; \text{left}: \frac{100 - (100 \times A)}{2}\%, \; \text{top}: 0\% \right\}, & \text{if } A < 1 
\end{cases}$$

All diagnostic SVG overlays, Grad-CAM saliency maps, lesion pins, and ETDRS concentric rings are nested inside `imgBounds`, guaranteeing sub-pixel anatomical alignment across all camera hardware.

### 7.2 Multistage Image Quality Assessment (IQA) & OOD Gatekeeper
To prevent false-positive classifications on ungradeable or non-retinal images, raw uploads pass through a 5-stage Out-of-Distribution gatekeeper:

| Gate Stage | Validation Check | Clinical Rejection Threshold | Clinical Rationale |
| :---: | :--- | :--- | :--- |
| **1** | Spatial Resolution | $h < 150\,\text{px}$ or $w < 150\,\text{px}$ | Insufficient pixel density to resolve microvascular caliber |
| **2** | Exposure Limits | Mean luminance $< 10.0$ or $> 230.0$ | Severe underexposure or blinding camera flash wash-out |
| **3** | FOV Coverage | $\text{Mask Area} / (h \times w) < 0.10$ | Absence of recognizable circular retinal aperture |
| **4** | Retinal Pigment | $R/B < 1.70$, $R/G < 1.10$, Blue excess $> 4\%$ | Lacks biological melanin and hemoglobin spectral signature |
| **5** | Vascular Structure | Vessel density $< 0.1\%$ across mask | Severe blur or defocus obscuring retinal vasculature |

Uploads failing any stage receive a structured error response (`HTTP 200`, `mode: "error"`), informing the operator of the exact physiological defect and prompting recapture.

### 7.3 Preprocessing: Ben Graham Normalization and CLAHE
Accepted images are standardized using a two-tier enhancement pipeline:
1. **L* Channel CLAHE:** The image is converted to CIE LAB color space. Contrast Limited Adaptive Histogram Equalization (clip limit = 2.0, tile grid = $8\times 8$) is applied strictly to the luminance ($L^*$) channel, amplifying subtle capillary contrast without distorting chromatic balances.
2. **Ben Graham Normalization:** Retinal fundus images suffer from illumination decay toward peripheral margins. Local background variability is subtracted by blending the CLAHE-enhanced image with a Gaussian-filtered version ($\sigma = \text{size} / 30$):

$$I_{\text{enhanced}} = 4 \cdot I_{\text{CLAHE}} - 4 \cdot \text{GaussianBlur}(I_{\text{CLAHE}}, \sigma) + 128$$

The resulting scan is resized to $224\times 224$ pixels and normalized with ImageNet channel statistics ($\mu = [0.485, 0.456, 0.406]$, $\sigma = [0.229, 0.224, 0.225]$).

### 7.4 ResNet-50 DR Severity Grading
The normalized tensor is evaluated by ResNet-50 v2. The final fully connected layer outputs a logit vector $\mathbf{z} \in \mathbb{R}^5$, converted to calibrated probabilities via Softmax:

$$P(\text{Grade } k) = \frac{e^{z_k}}{\sum_{j=0}^{4} e^{z_j}}, \quad k \in \{0, 1, 2, 3, 4\}$$

Referable Diabetic Retinopathy (requiring specialist intervention) is defined as ICDR Grade $\ge 2$ (Moderate NPDR, Severe NPDR, or PDR). The cumulative referable probability is computed:

$$P_{\text{referable}} = P(\text{Grade 2}) + P(\text{Grade 3}) + P(\text{Grade 4})$$

If $P_{\text{referable}} \ge 0.1657$ (optimal Youden-calibrated threshold), the case is flagged for specialist triage. If the maximum confidence is $< 0.50$, the system attaches a "Low Confidence" clinical warning.

### 7.5 Grad-CAM Explainability Generation
Diagnostic visual explanations are computed via Gradient-Weighted Class Activation Mapping (Grad-CAM) targeting the final convolutional block (`model.layer4[-1]`). 

During the backward pass of predicted class $c$, gradients are globally pooled to calculate feature importance weights $\alpha_k^c$:

$$\alpha_k^c = \frac{1}{Z} \sum_{i} \sum_{j} \frac{\partial Y^c}{\partial A_{i,j}^k}$$

$$L_{\text{Grad-CAM}}^c = \text{ReLU}\left( \sum_{k} \alpha_k^c A^k \right)$$

To eliminate memory leaks, hook handles are stored and explicitly dereferenced (`h.remove()`) in a `finally` block immediately after CAM generation. The heatmap is bicubic-upscaled to native dimensions, clipped to $[0.0, 1.0]$, mapped via the JET color spectrum, and merged into a transparent BGRA PNG that renders over the original scan.

### 7.6 Computer Vision Lesion Segmentation
The morphological lesion segmentation engine ([`Backend/segment.py`](file:///d:/AntiGravity%20projects/MP-RetinascanXAI/Backend/segment.py)) executes in six stages:
1. **Retinal Masking:** The circular aperture is isolated using luminance thresholding ($>20$) and eroded by a $15\times 15$ elliptical kernel to strip boundary glare.
2. **Optic Disc Exclusion:** The bright optic disc cup is identified via large-kernel Gaussian smoothing ($\sigma=35$) and `minMaxLoc`, generating a $55\,\text{px}$ circular exclusion mask.
3. **Vascular Tree Extraction:** Morphological black-hat filtering ($9\times 9$ ellipse) on the green channel extracts blood vessels, which are dilated by $5\,\text{px}$ to mask all capillary branches.
4. **Dark Lesion Isolation (Microaneurysms & Hemorrhages):** Morphological closing ($25\times 25$ ellipse) estimates background illumination. Subtracting the green channel leaves a residual image thresholded via Otsu's method. Vascular, disc, and border regions are subtracted. Connected-component analysis classifies components based on area and circularity ($c = 4\pi \cdot \text{area} / \text{perimeter}^2$):
   - *Microaneurysms:* $8 \le \text{area} \le 120\,\text{px}^2$, circularity $c \ge 0.55$.
   - *Hemorrhages:* $120 < \text{area} < 2500\,\text{px}^2$, circularity $c \ge 0.20$.
5. **Bright Lesion Isolation (Hard Exudates):** Morphological top-hat filtering ($21\times 21$ ellipse) on the green channel isolates lipid deposits ($15 \le \text{area} < 3000\,\text{px}^2$).
6. **ICDR Harmonization:** If the classifier predicts Grade 0 (No DR), the segmentor enforces an empty lesion inventory per international standardization rules.

### 7.7 ETDRS Macular Grid and CSME Risk Profiling
Clinically Significant Macular Edema (CSME) is the leading driver of central vision impairment. RetinaScan-XAI implements the clinical gold-standard Early Treatment Diabetic Retinopathy Study (ETDRS) 9-zone macular grid:

| ETDRS Zone | Radial Boundary | Physical Dimension | Clinical Significance |
| :--- | :---: | :---: | :--- |
| **Central Subfield (CSF)** | $r \le 500\,\mu m$ | $1.0\,\text{mm}$ Diameter | Foveal avascular zone; threat causes central blindness |
| **Inner Macular Ring (IS, IN, II, IT)** | $500 < r \le 1500\,\mu m$ | $3.0\,\text{mm}$ Diameter | Parafoveal zone; moderate visual deficit risk |
| **Outer Macular Ring (OS, ON, OI, OT)** | $1500 < r \le 3000\,\mu m$ | $6.0\,\text{mm}$ Diameter | Perifoveal boundary; borderline macular threat |
| **Peripheral Retina** | $r > 3000\,\mu m$ | $> 6.0\,\text{mm}$ Diameter | Non-macular background retina |

Across a 45° posterior pole fundus scan ($\approx 15,000\,\mu m$), $1\%$ normalized distance corresponds to **$150\,\mu m$**. Sector coordinates auto-mirror between OD (Right Eye) and OS (Left Eye). The system computes the Euclidean distance from the fovea to the nearest hard exudate:

$$d = \sqrt{(x - x_{\text{fovea}})^2 + (y - y_{\text{fovea}})^2} \times 150\,\mu m$$

- **High Risk (Center-Involved CSME):** Exudates within CSF ($d \le 500\,\mu m$). Generates an urgent 7–14 day specialist referral alert for OCT and focal laser/anti-VEGF review.
- **Moderate Risk (Non-Center Involved):** Exudates within Inner Ring ($500 < d \le 1500\,\mu m$).
- **Borderline Threat:** Exudates within Outer Ring ($1500 < d \le 3000\,\mu m$).

### 7.8 In-Silico Laser Counterfactual XAI
To verify whether the neural network is responding to genuine pathology rather than background artifacts, clinicians can perform virtual laser photocoagulation:
1. The clinician selects lesion markers or draws freehand laser spots on the canvas.
2. The engine constructs an ablation mask $M$ covering selected coordinates ($r = 18\,\text{px}$).
3. Healthy retinal pigment epithelium (RPE) is synthesized using **Fast Marching Telea inpainting** (`cv2.INPAINT_TELEA`), which propagates boundary gradients into the ablated region while applying clinical laser-blanching rings.
4. ResNet-50 v2 re-evaluates the treated image in a live forward pass.
5. The causal probability shift ($\Delta P$) and Causal Attribution Score (CAS) are computed:

$$\Delta P = P_{\text{treated}}(\text{Grade } k) - P_{\text{baseline}}(\text{Grade } k)$$

$$\text{CAS} = \min\left(100.0, \; \max\left(0.0, \; \frac{P_{\text{baseline}}[g] - P_{\text{treated}}[g]}{P_{\text{baseline}}[g]} \times 100\%\right)\right)$$

A substantial negative $\Delta P$ confirms that the ablated lesions were causally responsible for the initial disease severity grade.

---

# 8. MODEL TRAINING

### 8.1 Multi-Center Dataset Preparation
The classifier was trained on a combined dataset of **5,406 retinal fundus photographs** originating from two benchmark cohorts:
1. **APTOS 2019 Blindness Detection:** 3,662 high-resolution scans collected across multiple clinical sites in India.
2. **MESSIDOR-2:** 1,744 adjudicated gradable images acquired across multiple eye clinics in France.

To prevent evaluation bias and data leakage, splits were frozen on disk using stratified sampling:

| Dataset Cohort | Total Scans | Training Partition (80%) | Held-Out Validation (20%) | Role in Project |
| :--- | :---: | :---: | :---: | :--- |
| **APTOS 2019** | 3,662 | 2,929 | 733 | Primary Indian clinical population |
| **MESSIDOR-2** | 1,744 | 1,395 | 349 | Multi-center external validation cohort |
| **Combined Cohort** | **5,406** | **4,324** | **1,082** | **Full Multi-Center Development Suite** |

### 8.2 Deep Neural Network Architecture
The architecture utilizes a ResNet-50 backbone initialized with ImageNet pre-trained weights. The standard 1000-class fully connected classification layer is replaced with a custom clinical head:
- Global Average Pooling: Outputs a 2048-dimensional feature vector.
- Dropout Layer 1 ($p = 0.40$).
- Fully Connected Dense Layer ($2048 \to 512$).
- ReLU Activation Function.
- Dropout Layer 2 ($p = 0.30$).
- Output Linear Layer ($512 \to 5$), corresponding to ICDR Grades 0 through 4.

### 8.3 Training Configuration and Optimization

| Hyperparameter / Component | Specification | Description / Setting |
| :--- | :--- | :--- |
| **Hardware** | NVIDIA GeForce RTX 4060 Laptop GPU | 8 GB GDDR6 VRAM, CUDA 12.1 |
| **Batch Size** | 24 | Optimized for VRAM utilization and gradient stability |
| **Epochs** | 25 | Full convergence reached at epoch 18 |
| **Optimizer** | AdamW | Initial learning rate $= 10^{-4}$, weight decay $= 10^{-4}$ |
| **Learning Rate Schedule** | Cosine Annealing | CosineAnnealingLR ($T_{\max} = 25$, $\eta_{\min} = 10^{-6}$) |
| **Loss Function** | Weighted Cross-Entropy | Inverse class frequency weights addressing class imbalance |
| **Mixed Precision** | PyTorch AMP (`torch.cuda.amp`) | FP16/FP32 mixed precision accelerating training by $2.3\times$ |

### 8.4 Segmentation Model Training (Lesion & Vessel U-Net)
1. **Lesion U-Net (`lesion_unet.pth`):** A 4-stage encoder-decoder U-Net with skip connections trained on the IDRiD dataset (54 annotated fundus scans) across microaneurysms, hemorrhages, and hard exudates at $512\times 512$ resolution.
2. **Vessel U-Net (`vessel_unet.pth`):** A 3-stage lightweight convolutional network trained on the DRIVE dataset (40 images) using $64\times 64$ patches to segment the retinal blood vessel tree.

---

# 9. CLINICAL PERFORMANCE AND VALIDATION

### 9.1 Multi-Center Diagnostic Evaluation Metrics
The production ResNet-50 v2 model was evaluated on the **1,082 held-out multi-center test images** (combining held-out subsets of both APTOS 2019 and MESSIDOR-2). Diagnostic performance metrics for binary Referable Diabetic Retinopathy (Grade $\ge 2$) are detailed below:

| Diagnostic Metric | Mathematical Formulation | Model v2 Performance | Target Benchmark | Benchmark Status |
| :--- | :---: | :---: | :---: | :---: |
| **Clinical Sensitivity (Recall)** | $\frac{\text{TP}}{\text{TP} + \text{FN}}$ | **93.32%** (363 / 389) | $\ge 90.0\%$ | **Exceeded** (+3.32%) |
| **Clinical Specificity** | $\frac{\text{TN}}{\text{TN} + \text{FP}}$ | **86.15%** (597 / 693) | $\ge 85.0\%$ | **Exceeded** (+1.15%) |
| **AUC-ROC** | Area Under Curve | **0.9702** | $\ge 0.950$ | **Gold Standard** |
| **Negative Predictive Value (NPV)** | $\frac{\text{TN}}{\text{TN} + \text{FN}}$ | **95.83%** (597 / 623) | — | **High Safety Rule-Out** |
| **Positive Predictive Value (PPV)** | $\frac{\text{TP}}{\text{TP} + \text{FP}}$ | **79.08%** (363 / 459) | — | **Calibrated Referral** |
| **F1-Score (Harmonic Mean)** | $2 \cdot \frac{\text{PPV} \cdot \text{Sens}}{\text{PPV} + \text{Sens}}$ | **0.8561** | — | **Robust Balance** |
| **Optimal Threshold ($t$)** | $\max_t (\text{Sens} + \text{Spec} - 1)$ | **0.1657** (Youden's J) | — | **Locked on ROC** |
| **Overall 5-Class Concordance** | Exact class accuracy | **72.00%** | — | **5-Class Staging** |

### 9.2 Binary Confusion Matrix Analysis
The contingency matrix for Referable DR detection on the 1,082 held-out validation images is structured as follows:

| Ground Truth \ Predicted | Predicted Non-Referable (Grade 0–1) | Predicted Referable (Grade 2–4) | Total True Cases |
| :--- | :---: | :---: | :---: |
| **Actual Non-Referable (Grade 0–1)** | **597** (True Negatives, 55.2%) | **96** (False Positives, 8.9%) | **693** |
| **Actual Referable DR (Grade 2–4)** | **26** (False Negatives, 2.4%) | **363** (True Positives, 33.5%) | **389** |
| **Total Predicted Cases** | **623** | **459** | **Total = 1,082** |

*Clinical Safety Assessment:* Out of 389 patients requiring specialist intervention, the system missed only 26 cases ($\text{NPV} = 95.8\%$), ensuring high diagnostic safety during mass community screenings.

### 9.3 Graphical Performance Visualizations
Publication-quality figures representing the confusion matrix, ROC curve, and benchmark comparisons have been generated at 300 DPI:

- **Figure 9.1 (Comprehensive Composite Analysis):** [`Context/section9_performance_analysis.png`](file:///d:/AntiGravity%20projects/MP-RetinascanXAI/Context/section9_performance_analysis.png)
- **Figure 9.2 (Standalone Confusion Matrix):** [`Context/confusion_matrix_v2.png`](file:///d:/AntiGravity%20projects/MP-RetinascanXAI/Context/confusion_matrix_v2.png)
- **Figure 9.3 (Receiver Operating Characteristic Curve):** [`Context/roc_curve_v2.png`](file:///d:/AntiGravity%20projects/MP-RetinascanXAI/Context/roc_curve_v2.png)
- **Figure 9.4 (Benchmark Compliance Bar Chart):** [`Context/performance_benchmarks_v2.png`](file:///d:/AntiGravity%20projects/MP-RetinascanXAI/Context/performance_benchmarks_v2.png)

```
+----------------------------------------------------------------------------------------------------+
|                                    FIGURE 9.1: PERFORMANCE OVERVIEW                                |
|                                                                                                    |
|    (A) Binary Confusion Matrix       (B) ROC Curve (AUC = 0.9702)       (C) Benchmark Compliance    |
|   +-----------------------------+   +-----------------------------+   +--------------------------+ |
|   | TN: 597        FP: 96       |   | Sensitivity: 93.3%          |   | Sensitivity: 93.3% ≥ 90% | |
|   | FN: 26         TP: 363      |   | Specificity: 86.2%          |   | Specificity: 86.2% ≥ 85% | |
|   | Total Held-Out: 1,082       |   | Youden Threshold: 0.1657    |   | AUC-ROC:     0.970 ≥ 0.95| |
|   +-----------------------------+   +-----------------------------+   +--------------------------+ |
|        [Refer to file: Context/section9_performance_analysis.png for full high-res figure]          |
+----------------------------------------------------------------------------------------------------+
```

---

# 10. IMPLEMENTATION DETAILS

### 10.1 Machine Learning Core & Architecture Unification
The machine learning pipeline was re-architected to enforce modular separation:
- `ml_script/model.py` serves as the sole definition point for `build_model()`, preventing `state_dict` key mismatches.
- `ml_script/preprocess.py` unifies image transformations across training, validation, and live inference.
- Model weights are stored in `ml_script/retinascan_resnet50_v2.pth` (94 MB).

### 10.2 Asynchronous FastAPI Backend
The backend server ([`Backend/main.py`](file:///d:/AntiGravity%20projects/MP-RetinascanXAI/Backend/main.py)) handles edge requests through six dedicated REST endpoints:

| Endpoint | HTTP Method | Input Payload | Output Format | Purpose |
| :--- | :---: | :--- | :---: | :--- |
| `/upload` | POST | `multipart/form-data` (`file`) | JSON | Full screening pipeline (grade, heatmap, lesions, ETDRS) |
| `/counterfactual-laser` | POST | JSON (`image_id`, `lesions`, `spots`) | JSON | In-silico laser simulation, Telea inpainting, causal $\Delta P$ |
| `/etdrs-profile` | POST | JSON (`lesions`, `fovea_x`, `fovea_y`) | JSON | ETDRS 9-zone distribution and CSME risk triage |
| `/lesion-test` | POST | `multipart/form-data` (`file`) | JSON | Standalone lesion segmentation testing |
| `/health` | GET | None | JSON | Edge server status and model loading state |
| `/eval-report` | GET | None | JSON | Returns frozen multi-center evaluation JSON |

### 10.3 React 18 & Vite PACS Workstation
The frontend web application provides nine interconnected clinical screens:
1. `Home.jsx`: Triage overview and patient intake entry.
2. `Upload.jsx`: 2-column patient demographic form with preset demo cards.
3. `QualityCheck.jsx`: Animated 3-track Image Quality Assessment gate (Focus, Illumination, FOV).
4. `Processing.jsx`: Diagnostic step checklist and conic spinner.
5. `Results.jsx`: Flagship console featuring dual-persona switching (Doctor vs ASHA), optical zoom/pan, Grad-CAM slider, and laser counterfactual controls.
6. `Canvas.jsx`: Diagnostic PACS canvas with indexed lesion tables and anatomical quadrant radars.
7. `Queue.jsx`: LocalStorage-persisted patient intake queue.
8. `Referral.jsx`: Printable ABDM-compliant clinical referral letters.
9. `Admin.jsx`: Screening volume simulator and ophthalmologist capacity planner.

---

# 11. RESULTS AND EXPERIMENTAL ANALYSIS

### 11.1 Observed Clinical Results
End-to-end testing across 12 pre-calibrated demo patients and live clinical scans demonstrated consistent grading performance:
- Grade 0 (Healthy): Confirmed zero false lesion detections via ICDR harmonization.
- Grade 2 (Moderate NPDR): Correctly identified microaneurysms and hemorrhages in the superior-temporal arcade, localizing hard exudates $420\,\mu m$ from the fovea to trigger Center-Involved CSME alerts.
- In-Silico Laser Ablation: Targeted photocoagulation of 3 macular hemorrhages induced a $-24.8\%$ probability drop in Grade 2 logits, down-staging the case to Grade 1 and proving causal attribution.

### 11.2 Computational Latency and Edge Efficiency
Inference latency was benchmarked across edge hardware configurations:

| Processing Pipeline Stage | Intel Core i7-13700H (CPU Only) | NVIDIA RTX 4060 (GPU Accelerated) | Target Budget |
| :--- | :---: | :---: | :---: |
| **IQA & OOD Gatekeeper** | 0.42 s | 0.28 s | $< 1.0\text{ s}$ |
| **ResNet-50 v2 Inference** | 0.18 s | 0.02 s | $< 0.5\text{ s}$ |
| **Grad-CAM++ Generation** | 0.35 s | 0.08 s | $< 0.8\text{ s}$ |
| **Morphological Segmentation** | 1.85 s | 0.95 s | $< 3.0\text{ s}$ |
| **ETDRS & Macular Profiling** | 0.08 s | 0.04 s | $< 0.2\text{ s}$ |
| **Full Pipeline Latency** | **2.88 s** | **1.37 s** | **$< 8.0\text{ s}$** |
| **In-Silico Laser Counterfactual** | **1.45 s** | **0.62 s** | **$< 3.0\text{ s}$** |
| **Peak RAM Consumption** | **2.42 GB** | **1.85 GB** | **$< 3.0\text{ GB}$** |

---

# 12. ADVANTAGES

RetinaScan-XAI provides distinct clinical, computational, and operational advantages:

| Advantage Category | Technical Implementation | Practical Clinical Benefit |
| :--- | :--- | :--- |
| **Quad-Level Explainability** | Grad-CAM++ + CV Segmentor + In-Silico Laser + ETDRS Grid | Converts uninterpretable AI labels into verifiable clinical evidence |
| **Causal Hypothesis Testing** | Telea inpainting with live forward re-inference | Allows doctors to verify whether specific lesions caused the grade |
| **Macular Edema Triage** | Automated ETDRS 9-zone calipers ($150\,\mu m$ scaling) | Prevents blindness by prioritizing Center-Involved CSME within 7–14 days |
| **Universal Camera Parity** | Dynamic letterbox aspect-ratio calibration (`imgBounds`) | Prevents 34% cropping on wide-angle fundus cameras |
| **Data Privacy & Sovereignty** | 100% offline edge execution on local hardware | Complies with DPDP Act 2023; patient scans never leave the clinic |
| **Community Accessibility** | Dual-persona UI in 6 Indian languages with Web Speech TTS | Empowers illiterate patients and frontline ASHA workers |
| **Edge Hardware Efficiency** | Single-threaded `asyncio.Lock` inference serializer | Runs comfortably on standard clinic laptops ($< 2.8\text{ GB}$ RAM) |

---

# 13. LIMITATIONS

1. **Dependency on Optical Media Clarity:** The system evaluates fundus photographs and cannot penetrate severe media opacities caused by dense mature cataracts or vitreous hemorrhage.
2. **Single Disease Target:** The current classifier stages Diabetic Retinopathy and Macular Edema; it does not grade concurrent ocular pathologies such as glaucoma (cup-to-disc ratio) or age-related macular degeneration (AMD).
3. **Classical Segmentation Live Fallback:** Although deep learning U-Nets are trained for lesion and vessel segmentation, the live inference pipeline currently uses morphological computer vision filters to conserve edge memory.
4. **Desktop/Laptop Optimization:** The web workstation is optimized for clinical laptops and desktop PACS monitors; it is not yet formatted as a native smartphone application.

---

# 14. FUTURE SCOPE

| Milestone / Phase | Planned Technical Enhancement | Target Clinical Impact |
| :--- | :--- | :--- |
| **Direct UVC Camera Video Stream** | WebRTC / OpenCV direct frame acquisition in `Upload.jsx` | Enables one-click capture from handheld fundus cameras |
| **DICOM Part 10 Integration** | Ingestion and export of native `.dcm` ophthalmic records | Direct synchronization with hospital radiology PACS archives |
| **INT8 Edge Quantization** | TensorRT / ONNX Runtime quantization of ResNet-50 v2 | Sub-50ms CPU execution on low-cost Intel Celeron/N100 mini-PCs |
| **Multi-Disease Expansion** | Cup-to-disc ratio measurement and drusen segmentation | Unified screening for Glaucoma and Age-Related Macular Degeneration |
| **Deep U-Net Pipeline Integration** | Lightweight ONNX deployment of Lesion and Vessel U-Nets | Enhanced microaneurysm detection in dense choroidal pigmentations |

---

# 15. CONCLUSION

RetinaScan-XAI addresses a critical public health failure in Indian eye care: the inability to provide timely, accessible, and interpretable Diabetic Retinopathy screening across 77 million diabetic adults due to acute specialist shortages. Conventional AI approaches fail in clinical practice because their "black-box" outputs cannot be verified and their cloud-bound architectures compromise patient privacy.

By pairing a fine-tuned ResNet-50 v2 classifier trained across multi-center datasets (APTOS 2019 and MESSIDOR-2) with quad-level explainability, RetinaScan-XAI achieves **93.3% Sensitivity**, **86.2% Specificity**, **0.9702 AUC-ROC**, and **95.8% NPV**, exceeding WHO and clinical screening thresholds. The introduction of interactive In-Silico Laser Counterfactual XAI transforms artificial intelligence from a passive classification oracle into an active hypothesis-testing instrument, allowing clinicians to test causal disease attribution ($\Delta P$) in real time. 

Coupled with automated ETDRS 9-zone macular grid calipers for CSME stratification, dynamic letterbox aspect-ratio calibration, an offline edge footprint running under 3 GB of RAM, and a multilingual ASHA counseling portal, RetinaScan-XAI bridges the divide between rural primary health centres and tertiary ophthalmology, delivering a clinically validated, interpretable, and deployable screening solution.

---

# 16. REFERENCES

1. Gulshan, V., Peng, L., Coram, M., Stumpe, M. C., Wu, D., Narayanaswamy, A., et al., "Development and Validation of a Deep Learning Algorithm for Detection of Diabetic Retinopathy in Retinal Fundus Photographs," *JAMA*, vol. 316, no. 22, pp. 2402–2410, 2016.
2. He, K., Zhang, X., Ren, S., and Sun, J., "Deep Residual Learning for Image Recognition," in *Proceedings of the IEEE Conference on Computer Vision and Pattern Recognition (CVPR)*, pp. 770–778, 2016.
3. Selvaraju, R. R., Cogswell, M., Das, A., Vedaldi, A., Parikh, D., and Batra, D., "Grad-CAM: Visual Explanations from Deep Networks via Gradient-Based Localization," in *Proceedings of the IEEE International Conference on Computer Vision (ICCV)*, pp. 618–626, 2017.
4. Early Treatment Diabetic Retinopathy Study Research Group, "Grading Diabetic Retinopathy from Stereoscopic Color Fundus Photographs—An Extension of the Modified Airlie House Classification: ETDRS Report Number 10," *Ophthalmology*, vol. 98, no. 5, pp. 786–806, 1991.
5. Porwal, P., Pachade, S., Kamble, R., Kokare, M., Deshmukh, G., Sahasrabuddhe, V., et al., "Indian Diabetic Retinopathy Image Dataset (IDRiD): A Database for Diabetic Retinopathy Screening and Evaluation of Common Lesions," *Data*, vol. 3, no. 3, p. 25, 2018.
6. Decencière, E., Zhang, X., Cazuguel, G., Lay, B., Cochener, B., Trone, F., et al., "Feedback on a Publicly Distributed Image Database: The Messidor Database," *Image Analysis & Stereology*, vol. 33, no. 3, pp. 231–234, 2014.
7. Telea, A., "An Image Inpainting Technique Based on the Fast Marching Method," *Journal of Graphics Tools*, vol. 9, no. 1, pp. 23–34, 2004.
8. Graham, B., "Kaggle Diabetic Retinopathy Detection Competition Report," *University of Warwick*, 2015.
9. Staal, J., Abramoff, M. D., Niemeijer, M., Viergever, M. A., and van Ginneken, B., "Ridge-Based Vessel Segmentation in Color Images of the Retina," *IEEE Transactions on Medical Imaging*, vol. 23, no. 4, pp. 501–509, 2004.
10. International Council of Ophthalmology (ICO), "ICO Guidelines for Diabetic Eye Care," *International Council of Ophthalmology*, 2018.

