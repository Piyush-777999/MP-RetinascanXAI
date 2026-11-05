# Application Flow Document

**RetinaScan-XAI: Clinical Interface State Machine & Multi-Persona Screening Flow**

**Version:** 3.0 | **Companion:** UI/UX Design Document, API Contract v3.0

---

## 1. High-Level Flow Topology

The application is architected around an extensible state machine managed in `App.jsx`. It supports 9 primary screens, dual clinical personas, and LocalStorage-backed persistence:

```
                  ┌─────────────────────────────────────────────────────────┐
                  │                       HOME SCREEN                       │
                  │        (Intake Portal · Queue View · Analytics)         │
                  └──────┬───────────────────────┬────────────────────┬─────┘
                         │                       │                    │
            "New Scan"   │          "Open Queue" │                    │ "Audit / Admin"
                         ▼                       ▼                    ▼
                  ┌──────────────┐        ┌──────────────┐     ┌──────────────┐
                  │    UPLOAD    │        │  QUEUE VIEW  │     │  ADMIN VIEW  │
                  └──────┬───────┘        └──────┬───────┘     └──────────────┘
                         │                       │
      Start Screening    ▼                       │ Select Patient
                  ┌──────────────┐               │
                  │ QUALITYCHECK │               │
                  └──────┬───────┘               │
                         │ Auto-advance          │
                         ▼                       │
                  ┌──────────────┐               │
                  │  PROCESSING  │               │
                  └──────┬───────┘               │
                         │ Auto-advance          │
                         ▼                       │
                  ┌──────────────────────────────▼──────────────────────────┐
                  │                      RESULTS SCREEN                     │
                  │   ┌────────────────────────┐  ┌───────────────────────┐ │
                  │   │  Doctor Console View   │  │  ASHA Counselor View  │ │
                  │   │  (ETDRS, Laser XAI)    │  │  (Audio, Pictograms)  │ │
                  │   └───────────┬────────────┘  └───────────┬───────────┘ │
                  └───────────────┼───────────────────────────┼─────────────┘
                                  │                           │
                   "Open PACS"    ▼                           ▼  "Print Slip"
                          ┌──────────────┐             ┌──────────────┐
                          │  PACS CANVAS │             │ REFERRAL DOC │
                          └──────────────┘             └──────────────┘
```

---

## 2. Screen-by-Screen Specifications

### 2.1 Home Screen (`Home.jsx`)
- **Header:** Displays system status (Online / Ready), active language selector, and title.
- **Hero Unit:** Clean hospital-grade welcome banner explaining the point-of-care screening workflow.
- **Three Core Action Cards:**
  1. *Patient Intake & Scan Upload:* Launches new screening intake.
  2. *Tele-Ophthalmology Triage Queue:* Opens prioritized triage list.
  3. *Audit & Analytics Dashboard:* Shows throughput and severity distributions.
- **Quick Patient Switcher:** Immediate access to pre-calibrated clinical demo patients across all 5 ICDR grades.

### 2.2 Upload Screen (`Upload.jsx`)
- **2-Column Clinical Layout:**
  - *Left Column (Patient Demographics):* Patient ID, Full Name, Age, Gender, Village / PHC Center, Diabetes Duration, HbA1c level, Laterality selector (OD: Right Eye vs OS: Left Eye), and clinical notes.
  - *Right Column (Preset Demo Patients):* Rapid selection cards for instant demo fill (e.g., Smt. Geeta Sharma, Mohd. Shafi, Harpreet Kaur).
- **Drag-and-Drop Image Uploader:** File picker supporting JPEG, PNG, TIFF, and BMP fundus photographs.
- **Actions:**
  - Clicking "Start AI Screening" executes local client thumbnail generation, validates inputs, and triggers the asynchronous `/upload` backend request while transitioning to `QualityCheck`.

### 2.3 QualityCheck Screen (`QualityCheck.jsx`)
- **Animated Clinical Quality Assurance Gate:**
  - Three sequential IQA progress tracks:
    1. *Focus & Sharpness Analysis* (Target: $>90\%$).
    2. *Illumination & Exposure Homogeneity* (Target: $>88\%$).
    3. *Field-of-View (FOV) Geometric Coverage* (Target: $>92\%$).
  - Once all 3 bars complete, checks turn green, and the view automatically transitions to `Processing`.

### 2.4 Processing Screen (`Processing.jsx`)
- **Inference Diagnostic Tracker:**
  - Visual spinning progress ring with live status checkpoints:
    1. *Preprocessing & Contrast Enhancement:* CLAHE & circular FOV isolation.
    2. *ResNet-50 v2 Deep Neural Inference:* 5-class calibrated softmax evaluation.
    3. *Grad-CAM++ & Morphological Lesion Mapping:* Activation hooks, vessel subtraction, optic disc masking.
    4. *ETDRS Macular Profiling:* Fovea distance caliper computation.
- Automatically transitions to `Results` upon pipeline completion.

### 2.5 Results Screen (`Results.jsx`) — Dual Persona Clinical Console
The flagship workstation screen featuring a **3-Actor Persona Switcher**:

#### A. Doctor Clinical Workstation (Default)
- **Diagnostic Header:** ICDR Grade Badge (0 to 4), Clinical Label, Confidence score, and Recommended Action Window.
- **Full Softmax Probability Distribution:** Visual bars for all 5 grades.
- **Optical Inspection Console:**
  - Letterbox-calibrated fundus viewport (`imgBounds`).
  - Optical Zoom steppers ($1\times, 1.5\times, 2\times, 2.5\times, 3\times$) and mouse wheel zoom.
  - Interactive Drag-to-Pan navigation across macular and nasal quadrants.
  - Layer Toggles: Grad-CAM++ saliency (with opacity slider), Lesion markers, Red-Free 540nm green channel filter, and ETDRS 9-Zone concentric grid.
- **Automated ETDRS 9-Zone Macular Grid & CSME Profiler:**
  - Central Subfield (CSF, 1mm), Inner Ring (3mm), Outer Ring (6mm).
  - Center-Involved CSME warning if hard exudates lie within $500\,\mu m$ of fovea.
  - Interactive foveal reticle for position adjustment.
- **In-Silico Laser Counterfactual XAI Laboratory:**
  - Clinician toggles "Laser Mode", selects suspect lesion pins or freehand spots ($532\,\text{nm}$ green photocoagulation).
  - Clicks "Fire Laser & Re-evaluate".
  - Backend runs biophysical Telea inpainting, executes ResNet-50 re-inference, and displays side-by-side treated scans, probability drop ($\Delta P$), and causal attribution score.
- **Actions:** "Open PACS Canvas", "Print Specialist Referral", "Switch to ASHA View".

#### B. ASHA & Community Health Worker Counseling Portal
- **Culturally Tailored Vernacular Interface:**
  - Switchable between Hindi, Marathi, Telugu, Tamil, Bengali, and English.
- **Web Speech API Audio Narration:**
  - A single click plays a spoken, compassionate audio explanation in the chosen Indian language.
  - Audio pronunciation is localized with respectful Indian honorifics (e.g. Smt. Geeta Sharma).
- **Rural Pictogram Directives:**
  - Traffic-light hospital urgency badge (e.g., "7 to 14 days" for high CSME risk).
  - Eye protection icon, glycemic control badge, and dietary food cards ("Eat: Spinach, Fenugreek, Bitter gourd, Dal; Avoid: Sweets, Sugar tea, Fried snacks").
- **Take-Home Advice Slip:** One-click printing of a localized patient counseling slip.

### 2.6 PACS Canvas Screen (`Canvas.jsx`)
- High-contrast clinical PACS diagnostic canvas.
- Features indexed pathological findings table listing every detected Microaneurysm, Hemorrhage, and Hard Exudate with pixel areas and confidence scores.
- Anatomical Quadrant Radar partitioning lesions across Superior-Temporal (ST), Superior-Nasal (SN), Inferior-Temporal (IT), and Inferior-Nasal (IN).

### 2.7 Triage Queue Screen (`Queue.jsx`)
- Triage review queue displaying both pre-baked demo patients and live scanned patients persisted in `localStorage`.
- Severity badges, confidence metrics, laterality tags, and triage urgency filters (All, Referrals, Routine).
- Selecting any patient immediately reloads their scan and full diagnostic profile across the workstation.

### 2.8 Referral Screen (`Referral.jsx`)
- Formal printable Clinical Referral Slip and Specialist Triage Letter.
- Formatted for Ayushman Bharat Digital Mission (ABDM) compliance with patient demographics, ICDR classification, ETDRS CSME risk findings, specialist referral timeline, and institutional sign-off sections.

### 2.9 Admin Screen (`Admin.jsx`)
- PHC screening analytics and capacity planning simulator.
- Interactive sliders for daily screening volume, camera count, and available ophthalmologists.
- Calculates daily review backlogs and days to queue exhaustion.

---

## 3. Global Shortcuts & Exception Handling

- **`Ctrl+Shift+R` (Instant Demo Reset):** Global key listener resetting the application state machine, clearing temporary uploads, and returning to the baseline Moderate NPDR demo patient.
- **Out-of-Distribution Error Interception:** If the backend detects a non-fundus scan or poor illumination, the upload is safely rejected with an informative alert, and the UI cleanly restores the last known valid patient state without crashing.
