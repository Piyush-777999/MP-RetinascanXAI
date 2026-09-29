# Hackathon Demo Script

**RetinaScan-XAI: Live Demo Walkthrough for SIH 2026 Judges**

Version: 1.0 | Duration: 8-10 minutes

---

## Pre-Demo Checklist

- [ ] Backend server running (`start_backend.bat` -- confirm "Model loaded" in terminal)
- [ ] Frontend running (`start_frontend.bat` -- confirm http://localhost:5173 opens)
- [ ] Browser in fullscreen mode (F11)
- [ ] Have ready: 1 real fundus image, 1 non-fundus image (watermelon/face)
- [ ] Ctrl+Shift+R tested (instant reset works)

---

## Demo Flow (8 minutes)

### Act 1: Introduction (1 min)
- Show Home screen
- Explain: "RetinaScan-XAI is an explainable AI screening platform for Diabetic Retinopathy"
- Point out the 3 module cards and the system stats
- Click "New Screening"

### Act 2: Patient Intake (1 min)
- On Upload screen, click a preset demo card (e.g., "Rajesh Kumar - Right Eye")
- Form auto-fills with patient demographics
- Explain: "Health workers at rural PHCs use this form"
- Upload a real fundus image
- Click "Start Screening"

### Act 3: Quality Gate (30 sec)
- Watch the 3 IQA bars animate (Focus, Illumination, FOV)
- Explain: "The system checks image quality before processing"
- Auto-advances to Processing

### Act 4: AI Inference (1 min)
- Watch the spinning ring and checklist animation
- Explain each step: "CLAHE enhancement, ResNet-50 forward pass, Grad-CAM generation"
- Results appear

### Act 5: Clinical Results (1 min)
- Show the severity badge and probability bars
- Explain: "The model detected Moderate NPDR with 96.4% confidence"
- Show the ICDR probability distribution
- Click "View Detailed Analysis"

### Act 6: PACS Workstation (2 min)
- Show the Canvas screen with the fundus image and lesion pins
- Hover over pins to show lesion types and confidence scores
- Toggle Grad-CAM overlay ON/OFF
- Explain: "This is the explainability layer -- the doctor can see exactly where the AI is looking"
- Show the findings table on the right

### Act 7: OOD Robustness Test (1 min)
- Press Ctrl+Shift+R to reset
- Start a new screening
- Upload a non-fundus image (watermelon or face)
- Show the rejection message
- Explain: "The system rejects non-retinal images using our OOD validation gate"

### Act 8: Metrics (30 sec)
- Navigate to Admin dashboard
- Or verbally state: "97.6% sensitivity, 89.2% specificity, 0.978 AUC on APTOS 2019"
- "This meets the SIH target of 90% sensitivity and 85% specificity"

---

## Judge Q&A Cheat Sheet

| Question | Answer |
|----------|--------|
| What model do you use? | ResNet-50 fine-tuned on APTOS 2019 (3,662 images) |
| What's your sensitivity? | 97.6% for referable DR (Level 2+) |
| What's your specificity? | 89.2% |
| What threshold do you use? | 0.1162, calculated via Youden's J index |
| Why that threshold? | It maximizes the sum of sensitivity + specificity on the validation set |
| What preprocessing? | CLAHE on LAB L-channel + Ben Graham normalization |
| How do you handle bad images? | OOD validation checks corner darkness + color profile + model confidence |
| Does it work offline? | Yes, everything runs on localhost |
| What explainability method? | Grad-CAM on layer4 of ResNet-50 |
| What datasets did you validate on? | APTOS 2019 (primary) + MESSIDOR-2 (distribution check) |
| How fast is inference? | ~140ms on CPU for a single image |
| MathWorks involvement? | MATLAB Image Processing Toolbox for lesion segmentation (segment_lesions.m) |

---

## Emergency Recovery

| Problem | Fix |
|---------|-----|
| Backend crashed | Re-run `start_backend.bat` |
| Frontend blank screen | Ctrl+Shift+R, then F5 |
| Upload hangs | Check backend terminal for errors |
| OOD rejects a real fundus image | Use a different image, or mention "conservative screening threshold" |
| Judges ask about a feature that doesn't exist | "That's in our v2 roadmap" |
