# Clinical Demonstration Walkthrough

**RetinaScan-XAI: Interactive Clinical Demonstration Guide & Judge Presentation Script**

**Version:** 3.0 | **Duration:** 8–10 Minutes | **Audience:** Clinical Judges, Technical Evaluators, Health Administrators

---

## 📋 Pre-Demo Checklist

- [ ] **Backend Server:** Running via `start_backend.bat` (Verify `[OK] Real ResNet-50 model found` in terminal).
- [ ] **Frontend Application:** Running via `start_frontend.bat` (Verify `http://localhost:5173` opens cleanly).
- [ ] **Display Setup:** Browser set to fullscreen mode (`F11`).
- [ ] **Test Images Ready:**
  - 1 Real Diabetic Retinopathy Fundus Scan (e.g. `img_2_od.jpg` or any APTOS image).
  - 1 Non-Fundus Out-of-Distribution Image (e.g. watermelon, document screenshot, or human face).
- [ ] **Audio Enabled:** Ensure system speakers / headphones are unmuted to demonstrate the ASHA multilingual voice synthesizer.
- [ ] **Hot-Key Test:** Confirm `Ctrl+Shift+R` instantly resets the workstation.

---

## ⏱️ Step-by-Step Clinical Demo Flow

### Act 1: The Clinical Dilemma & Vision (1 Minute)
* **Screen:** `Home.jsx`
* **Speaker Script:**
  > "Diabetic Retinopathy is the leading preventable cause of blindness in working-age adults. In rural India, there are 77 million diabetics but only one ophthalmologist for every 100,000 citizens. Patients typically discover their disease only after irreversible vision loss occurs.
  > 
  > Most AI diagnostic tools are opaque black boxes that doctors do not trust, and their outputs are too complex for rural patients. Today, we present **RetinaScan-XAI**—an offline-first, dual-persona clinical decision support system delivering quad-level explainability at the point of care."
* **Action:** Click **"New Screening Intake"** or **"Start Screening"**.

---

### Act 2: Patient Registration & Optical Camera Sensor Parity (1 Minute)
* **Screen:** `Upload.jsx`
* **Speaker Script:**
  > "At a primary health center, a health technician or ASHA worker intakes the patient. Notice our preset clinical demo cards—let's select **Smt. Geeta Sharma**, a 58-year-old patient with 12 years of diabetes and an HbA1c of 8.9%."
* **Action:** Click Smt. Geeta Sharma's preset card. Observe auto-filled patient fields.
* **Speaker Script:**
  > "Different fundus cameras output different aspect ratios—some square (1:1), others wide-angle rectangular (1.51:1). Conventional web viewers crop 34% of wide-angle scans, hiding the optic disc. RetinaScan-XAI features **Dynamic Letterbox Aspect-Ratio Calibration**, guaranteeing pixel-perfect alignment across all camera hardware."
* **Action:** Click **"Start AI Screening"**.

---

### Act 3: Automated Quality Gate & Edge Inference (1 Minute)
* **Screens:** `QualityCheck.jsx` → `Processing.jsx`
* **Speaker Script:**
  > "Immediately upon submission, our local Image Quality Assessment gate evaluates Focus, Illumination, and Field-of-View coverage. 
  > 
  > Next, our processing engine executes CLAHE contrast enhancement, runs the deep ResNet-50 v2 inference, extracts Grad-CAM++ saliency gradients, executes computer vision lesion segmentation, and computes macular ETDRS proximity calipers—all in under 200 milliseconds entirely offline on this laptop."
* **Action:** Watch animations complete and auto-advance to `Results.jsx`.

---

### Act 4: Doctor Workstation — ICDR Staging & Diagnostic Saliency (1.5 Minutes)
* **Screen:** `Results.jsx` (Doctor Workstation Mode)
* **Speaker Script:**
  > "Here is our Doctor Clinical Workstation. The AI classifies Smt. Geeta Sharma as **Grade 2: Moderate NPDR** with 96.4% confidence.
  > 
  > To explain the diagnosis, we provide multiple interactive visual layers:
  > 1. **Grad-CAM++ Saliency:** Observe how the heatmaps localize right over the vascular arcade where microvascular leakage occurs. We can adjust opacity seamlessly.
  > 2. **Red-Free Optical Filter:** Toggling the 540nm green channel isolates blood vessels and highlights microaneurysms against the fundus background.
  > 3. **Clinical Optical Zoom:** Ophthalmologists can zoom smoothly from 100% up to 300% and drag-to-pan across the macula to examine microvascular capillary details without eye strain."
* **Action:** Toggle Grad-CAM opacity slider. Toggle Red-Free filter. Click zoom steppers (`1.5x`, `2x`) and drag the image with the mouse.

---

### Act 5: Automated ETDRS 9-Zone Macular Grid & CSME Profiler (1.5 Minutes)
* **Screen:** `Results.jsx`
* **Speaker Script:**
  > "Clinically Significant Macular Edema (CSME) is what actually causes blindness. We have digitally implemented the clinical gold-standard **Early Treatment Diabetic Retinopathy Study (ETDRS) 9-Zone Macular Grid**.
  > 
  > The system calculates sub-millimeter proximity calipers from the foveal center ($150\,\mu m$ per 1% coordinate). Notice the alert: **Center-Involved CSME Risk**. Hard exudates have been detected within $500\,\mu m$ of the foveal subfield. The system automatically elevates the triage protocol from routine care to an urgent 7–14 day vitreoretinal specialist referral."
* **Action:** Point out the concentric ETDRS rings (CSF, Inner Ring, Outer Ring) and hover over the CSME Risk warning banner.

---

### Act 6: Interactive In-Silico Laser Counterfactual XAI Laboratory (2 Minutes)
* **Screen:** `Results.jsx`
* **Speaker Script:**
  > "Now for our core innovation: **In-Silico Laser Counterfactual XAI**. How can a doctor verify if the deep learning model is genuinely detecting diabetic lesions rather than camera noise?
  > 
  > We allow the doctor to perform virtual laser photocoagulation surgery directly in the software."
* **Action:** Click **"⚡ In-Silico Laser XAI"** button to enter laser mode. Click on 2 suspect hemorrhage/exudate lesions or click freehand to place argon laser photocoagulation spots.
* **Speaker Script:**
  > "We have selected these pathological clusters. Now let's click **'Fire In-Silico Laser & Re-evaluate'**."
* **Action:** Click the button.
* **Speaker Script:**
  > "Look at the result: Our backend used biophysical Fast Marching Telea inpainting to reconstruct healthy retinal pigment epithelium with laser blanching scars. It immediately re-evaluated the treated scan through ResNet-50.
  > 
  > The Grade 2 probability dropped by **24.8%**, down-staging the patient to Grade 1. This provides definitive, quantitative causal proof ($\Delta P$) that those specific lesions caused the initial diagnosis!"

---

### Act 7: ASHA Community Health Worker & Patient Counseling Hub (1.5 Minutes)
* **Screen:** `Results.jsx` (Click **"Switch to ASHA & Patient View"**)
* **Speaker Script:**
  > "Specialist metrics are meaningless if the patient does not understand why they must travel to a district hospital. With one click, we switch from the Doctor Console to the **ASHA & Patient Counseling Hub**.
  > 
  > The interface transforms into culturally tailored, vernacular regional language. Let's switch to Hindi and play the spoken audio."
* **Action:** Select **हिन्दी (Hindi)** from the language switcher. Click the **"🔊 सुनें (Listen Audio)"** button.
* **Audio plays:** *"नमस्ते श्रीमती गीता शर्मा जी। आपकी आँख की जांच में मध्यम स्तर का डायबिटिक रेटिनोपैथी और पुतली के केंद्र में मैक्यूलर सूजन पाई गई है..."*
* **Speaker Script:**
  > "Notice how the voice synthesizer automatically localized the patient's name into Devanagari script and explained the condition in simple terms. 
  > 
  > We also provide rural dietary pictograms—eat spinach, fenugreek, and lentils; strictly avoid sweets and sugary tea—and a one-click printable take-home slip."
* **Action:** Click **"Print Advice Slip"** to preview the referral document.

---

### Act 8: Out-of-Distribution (OOD) Safety & Gatekeeper Test (1 Minute)
* **Action:** Press `Ctrl+Shift+R` to reset. Navigate to `Upload.jsx`. Select and upload a non-fundus picture (e.g., watermelon, face, or desktop screenshot). Click "Start AI Screening".
* **Speaker Script:**
  > "What happens if a health worker accidentally uploads a non-medical photo or a photo of a watermelon? Conventional AI models hallucinate a disease grade.
  > 
  > Watch RetinaScan-XAI: Our multistage chromatic and anatomical gatekeeper instantly halts execution and alerts the operator: 'Image lacks characteristic retinal melanin pigment signature.' It never outputs a hallucinated medical diagnosis."

---

### Act 9: Multi-Center Clinical Validation Metrics (30 Seconds)
* **Speaker Script:**
  > "Our production model (ResNet-50 v2) was trained on 4,324 multi-center images from both APTOS 2019 and MESSIDOR-2. On our held-out test split of 1,082 images:
  > - **Sensitivity (Referable DR):** 93.3% (Target: $\ge 90\%$)
  > - **Specificity:** 86.2% (Target: $\ge 85\%$)
  > - **AUC-ROC:** 0.9702
  > - **NPV:** 95.8% — missing only 26 out of 389 positive cases.
  > 
  > RetinaScan-XAI bridges the gap from primary community care to tertiary ophthalmology with verified causal explainability."

---

## 🎯 Evaluator Q&A Cheat Sheet

| Question | Defending Response |
| :--- | :--- |
| **Why ResNet-50 over Vision Transformers?** | Edge inference latency and memory stability. ResNet-50 achieves $<140\,\text{ms}$ inference on standard clinic CPUs with $<2.8\,\text{GB}$ RAM usage, running flawlessly offline without requiring dedicated edge GPUs. |
| **What is the decision threshold for referable DR?** | **`0.1657`** for ResNet-50 v2 (calibrated via Youden's J Index maximizing $\text{Sensitivity} + \text{Specificity}$ on validation ROC). Model v1 on APTOS used `0.1162`. |
| **How does In-Silico Laser Photocoagulation work?** | It applies Navier-Stokes / Telea biophysical inpainting on the pixel region of targeted lesions, reconstructing healthy retinal tissue with laser blanching rings, and re-executes the forward pass to measure causal probability shift ($\Delta P$). |
| **How is ETDRS 9-zone distance calibrated?** | On a standard 45° posterior pole fundus scan ($\approx 15,000\,\mu m$ FOV), $1\%$ normalized coordinate space corresponds to $150\,\mu m$. CSF is $1\,\text{mm}$ ($r = 500\,\mu m$), Inner ring is $3\,\text{mm}$, Outer ring is $6\,\text{mm}$. |
| **How do you handle different camera aspect ratios?** | We use dynamic letterbox calibration (`imgBounds`), calculating the bounding box dynamically from `naturalWidth` and `naturalHeight` so wide-angle rectangular cameras (1.51:1) are never clipped. |
| **Is patient data kept private?** | Yes, 100% offline edge processing. Zero data or scans leave the clinic laptop, complying with ABDM and medical data sovereignty guidelines. |
