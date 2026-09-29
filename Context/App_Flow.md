# Application Flow Document

**RetinaScan-XAI: Screen-by-Screen User Flow Specification**

Version: 1.0 | Companion: UI/UX Design Document, API Contract

---

## 1. Overview

The application follows a linear screening pipeline. The user progresses through a fixed sequence of screens. Navigation is controlled by `App.jsx` which acts as a state machine.

---

## 2. Screen Flow Diagram

```
HOME --> UPLOAD --> QUALITY CHECK --> PROCESSING --> RESULTS --> CANVAS
  |                                                    |           |
  +--> ADMIN                                           +--> QUEUE  +--> REFERRAL
```

**Primary Happy Path:**
```
Home -> Upload -> QualityCheck -> Processing -> Results -> Canvas
```

**Error Path (OOD Rejection):**
```
Home -> Upload -> QualityCheck -> Processing -> [API returns error] -> Alert -> Upload
```

**Demo Reset:**
```
Any Screen -> Ctrl+Shift+R -> Home
```

---

## 3. Screen Specifications

### 3.1 Home (Landing Screen)

**Purpose:** Entry point. Shows system status and 3 module cards.

**Layout:** Full-width dark-navy background. Three glass-morphism cards:
1. "New Screening" -- navigates to Upload
2. "Review Queue" -- navigates to Queue
3. "Analytics" -- navigates to Admin

**User Action:** Click any card to navigate.

---

### 3.2 Upload (Patient Intake)

**Purpose:** Register patient and upload fundus image.

**Layout:** 2-column form.
- Left column: Patient fields (Name, Age, Sex, Diabetes Duration, Eye Side, Notes)
- Right column: Preset demo patient cards (click to auto-fill)
- Bottom: Drag-and-drop image upload zone + "Start Screening" button

**User Action:** Fill form or click preset card, upload image, click "Start Screening".

**On Submit:**
1. `App.jsx` stores patient data + image in state.
2. Navigation advances to QualityCheck.

---

### 3.3 QualityCheck (IQA Animation)

**Purpose:** Simulated Image Quality Assessment gate.

**Layout:** Dark panel with 3 sequential animated progress bars:
1. Focus Analysis
2. Illumination Check
3. Field-of-View Validation

**Behavior:**
- Each bar fills over 1-2 seconds with a green completion animation.
- All 3 bars must complete before auto-advancing.
- Auto-navigates to Processing after ~4 seconds total.

**Note:** This is a UI animation only. The actual quality check (OOD validation) happens server-side during inference.

---

### 3.4 Processing (Inference Animation)

**Purpose:** Animated loading screen while the backend processes the image.

**Layout:** Center-screen conic-gradient spinning ring with a sequential checklist:
1. "Initializing DeepRetina-v4 Engine..."
2. "Applying CLAHE Enhancement..."
3. "Running ResNet-50 Forward Pass..."
4. "Generating Grad-CAM Overlay..."
5. "Computing Severity Classification..."

**Behavior:**
- On mount, `App.jsx` sends `POST /upload` with the image.
- Checklist items resolve one by one as a timed animation.
- When API response arrives AND all animation steps complete, navigate to Results.
- If API returns `mode: "error"`, show alert and navigate back to Upload.

---

### 3.5 Results (Clinical Results Viewer)

**Purpose:** Display the AI diagnosis.

**Layout:**
- Top: Patient context bar (name, age, eye side)
- Center: Large severity badge with color-coded background (green/yellow/orange/red)
- Below: 5 horizontal probability bars for each ICDR level
- Below: Clinical action recommendation text
- Bottom: "View Detailed Analysis" button (navigates to Canvas)

**Data Source:** `severity`, `confidence`, `label`, `action`, `all_probs` from API response.

---

### 3.6 Canvas (PACS Workstation)

**Purpose:** Detailed clinical review with interactive image annotations.

**Layout:**
- Left panel: Circular fundus image with Grad-CAM overlay toggle
- Numbered lesion pins overlaid on image (from `data.js` coordinates)
- Hover pins to see lesion type + confidence
- Right panel: Findings table listing each detected lesion
- Bottom: Action buttons (Approve, Override, Generate Referral)

**Data Source:** `heatmap_url` from API + lesion coordinates from `data.js`.

---

### 3.7 Queue (Patient Review Queue)

**Purpose:** List of patients awaiting or completed review.

**Layout:** Table/list with columns: Patient Name, Severity Badge, Confidence, Status (Pending/Reviewed), Timestamp.

**Data Source:** Mock data from `data.js`.

---

### 3.8 Referral (Referral Letter)

**Purpose:** Auto-generated referral letter for severe cases (Level 2+).

**Layout:** Formal letter template with:
- Patient demographics
- Screening date and facility
- AI severity grade + confidence
- Clinical recommendation
- Screening technician signature line

---

### 3.9 Admin (Analytics Dashboard)

**Purpose:** Operational metrics for program administrators.

**Layout:** Dashboard with cards/charts:
- Total screenings today / this week / this month
- Severity distribution pie chart
- Referable DR percentage
- Average confidence score
- System uptime status

**Data Source:** Mock data from `data.js`.

---

## 4. State Management

`App.jsx` manages global state via React `useState`:

```javascript
const [screen, setScreen] = useState("home");        // Current screen
const [patientData, setPatientData] = useState(null); // From Upload form
const [uploadedImage, setUploadedImage] = useState(null); // File object
const [result, setResult] = useState(null);           // API response
```

Navigation is a simple switch statement rendering the active component. No router library is used.

---

## 5. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+Shift+R | Reset entire app to Home screen (clear all state) |
