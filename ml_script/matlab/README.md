# MATLAB Toolkit — Quick Start Guide
## RetinaScan-XAI, SIH 2026

---

## Step 1 — Open MATLAB

1. Go to **https://matlab.mathworks.com**
2. Sign in with your **Walchand college email**
3. Once logged in, click **"Open MATLAB Online"**

---

## Step 2 — Upload the Scripts

In MATLAB Online, click the **"Upload"** button (top left, folder icon) and upload:
- `preprocess_retina.m`
- `segment_lesions.m`
- `generate_report.m`

---

## Step 3 — Test the Preprocessing

In the MATLAB command window, type:

```matlab
% Upload any retina image first (drag & drop into MATLAB Online)
enhanced = preprocess_retina('your_retina_image.jpg');
```

You will see 3 plots: Original → Green Channel → Enhanced

---

## Step 4 — Test Lesion Segmentation

```matlab
[ma, hem, ex, stats] = segment_lesions('your_retina_image.jpg');
disp(stats)
```

You will see 6 plots showing each lesion type highlighted.

---

## Step 5 — Generate a PDF Report

```matlab
generate_report('retina.jpg', 2, 97.7, 'Mrs. Sunita Devi', 'report.pdf')
```

This creates a professional PDF report. The PDF opens automatically.

---

## What Each Script Uses (Toolboxes)

| Script                | MATLAB Toolbox Required          |
|-----------------------|----------------------------------|
| `preprocess_retina.m` | Image Processing Toolbox         |
| `segment_lesions.m`   | Image Processing Toolbox         |
| `generate_report.m`   | Report Generator Toolbox         |

All three should be included in your Walchand campus license.

---

## How This Connects to Our Python Pipeline

```
[MATLAB] preprocess_retina.m  →  enhanced image
         ↓
[Python] inference.py         →  grade 0-4, confidence, Grad-CAM
         ↓
[MATLAB] generate_report.m    →  PDF screening report
```

For the SIH demo, you can show:
1. Run `preprocess_retina` in MATLAB → show the enhancement
2. Switch to browser → upload the same image → show Python results
3. Run `generate_report` in MATLAB → show the PDF

That demonstrates the FULL MathWorks toolkit integration!
