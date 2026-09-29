# RetinaScan-XAI — Work Distribution & 3-Week Implementation Plan

**SIH 2026 · PS38 · 3-Person Team**

---

## Team

| ID | Role | Notes |
|----|------|-------|
| **P1** | Team Lead + ML Engineer | Has built all existing code. Focuses on architecture fixes and oversight. |
| **P2** | Backend Engineer | Owns `Backend/`. Takes on lesion segmentation port + all server hardening. |
| **P3** | Frontend Engineer | Owns `Frontend/`. Removes all mock data dependencies, wires real lesion data. |

---

## Current State

The classification pipeline (upload → preprocessing → ResNet-50 → Grad-CAM → severity grade) is functional end-to-end. What is NOT yet production-ready:

1. **Lesion segmentation is not in the live pipeline.** The MATLAB script (`segment_lesions.m`) exists but is standalone. The frontend currently displays hardcoded mock lesion data. This must be replaced with real per-image lesion detection.
2. **Model architecture is duplicated across 4 files.** Any change to the fc layer in one file silently breaks all others.
3. **Train/val split is not frozen.** Re-sorting the CSV will leak training data into evaluation.
4. **Preprocessing mismatch.** Training uses raw images; inference applies CLAHE. Must align.

---

## Repository File Structure

```
RetinascanXAI/
│
├── README.md                              [P1]  DONE
├── .gitignore                             [P1]  DONE
├── model_link.txt                         [P1]  TODO   Google Drive URL to .pth
├── Remaining_Work.md                      [P1]  DONE   This document
│
├── start_backend.bat                      [P2]  FIX    Update paths for new repo
├── start_frontend.bat                     [P3]  FIX    Update paths for new repo
├── install_deps.bat                       [P2]  FIX    Update paths for new repo
│
├── Context/                               [P1]  DONE   7 context documents
│
├── ml_script/                             ← P1 OWNS
│   ├── model.py                           [P1]  TODO   Single source of truth for build_model()
│   ├── preprocess.py                      [P1]  TODO   Single source of truth for all transforms
│   ├── split_dataset.py                   [P1]  TODO   One-time script to freeze train/val IDs
│   ├── train_ids.csv                      [P1]  TODO   Frozen training IDs
│   ├── val_ids.csv                        [P1]  TODO   Frozen validation IDs
│   ├── train_model.py                     [P1]  FIX    Import from model.py + preprocess.py
│   ├── evaluate_model.py                  [P1]  FIX    Import from model.py + preprocess.py
│   ├── messidor_test.py                   [P1]  FIX    Import from model.py
│   ├── visualise_metrics.py               [P1]  DONE
│   ├── evaluation_report.json             [P1]  DONE
│   └── matlab/
│       ├── segment_lesions.m              [P1]  DONE   Reference implementation (MATLAB)
│       ├── preprocess_retina.m            [P1]  TODO   MATLAB CLAHE enhancement (for MathWorks showcase)
│       ├── generate_report.m              [P1]  TODO   MATLAB PDF report generator (for MathWorks showcase)
│       └── README.md                      [P1]  DONE
│
├── Backend/                               ← P2 OWNS
│   ├── main.py                            [P2]  FIX    Add asyncio.Lock, lesion endpoint, path fixes
│   ├── inference.py                       [P2]  FIX    Fix hooks, align preprocessing, import shared model
│   ├── segment.py                         [P2]  TODO   Python port of segment_lesions.m (core deliverable)
│   ├── requirements.txt                   [P2]  FIX    Add any new deps
│   └── retinascan_resnet50.pth            [—]   DONE   Trained weights (gitignored, on Drive)
│
└── Frontend/retinascan-app/               ← P3 OWNS
    ├── index.html                         [P3]  DONE
    ├── vite.config.js                     [P3]  DONE
    ├── package.json                       [P3]  DONE
    └── src/
        ├── App.jsx                        [P3]  FIX    Wire real lesion data, add reset shortcut
        ├── App.css                        [P3]  DEL    Remove (styles in index.css)
        ├── data.js                        [P3]  FIX    Remove hardcoded lesion coords, keep only schema/colors
        ├── index.css                      [P3]  DONE
        ├── main.jsx                       [P3]  DONE
        └── components/
            ├── Home.jsx                   [P3]  DONE
            ├── Header.jsx                 [P3]  DONE
            ├── Footer.jsx                 [P3]  DONE
            ├── Upload.jsx                 [P3]  DONE
            ├── QualityCheck.jsx           [P3]  DONE
            ├── Processing.jsx             [P3]  DONE
            ├── Results.jsx                [P3]  FIX    Use real API data only, remove fallback image paths
            ├── Canvas.jsx                 [P3]  FIX    Render real lesion pins from API, not mock data
            ├── Queue.jsx                  [P3]  DONE
            ├── Referral.jsx               [P3]  DONE
            └── Admin.jsx                  [P3]  DONE
```

---

## API Contract

P1 hands `Context/API_Contract.md` to P2 and P3 on Day 1. The `/upload` response is being extended to include real lesion data:

### Updated `POST /upload` Response

```json
{
  "severity":    2,
  "confidence":  96.4,
  "label":       "Moderate NPDR",
  "action":      "Specialist Triage Required",
  "heatmap_url": "/images/heatmap_live_abc123.jpg",
  "all_probs":   [0.01, 0.05, 0.72, 0.14, 0.08],
  "mode":        "real",
  "lesions": [
    {
      "type": "microaneurysm",
      "bbox": [120, 88, 134, 101],
      "area_px": 87,
      "confidence": 0.82
    },
    {
      "type": "hemorrhage",
      "bbox": [200, 150, 240, 185],
      "area_px": 620,
      "confidence": 0.74
    },
    {
      "type": "exudate",
      "bbox": [90, 170, 130, 200],
      "area_px": 450,
      "confidence": 0.91
    }
  ],
  "lesion_summary": {
    "microaneurysm_count": 5,
    "hemorrhage_count": 2,
    "exudate_count": 3,
    "total_lesion_area_px": 2340
  }
}
```

**P2 builds the backend to produce this. P3 builds the frontend to consume it. Neither changes the schema without P1 approval.**

---

## WEEK 1 — Architecture Fixes + Lesion Segmentation Port

### P1 (Team Lead + ML) — Architecture Surgery

This week you fix the structural issues and hand off to P2/P3.

| Day | Task | File | Time |
|-----|------|------|------|
| 1 | Create `model.py` — extract `build_model()` | `ml_script/model.py` | 30 min |
| 1 | Create `preprocess.py` — extract transforms | `ml_script/preprocess.py` | 30 min |
| 2 | Create `split_dataset.py`, run it, commit frozen CSVs | `ml_script/split_dataset.py` | 30 min |
| 2 | Update `train_model.py` to use shared imports + frozen IDs | `ml_script/train_model.py` | 1 hr |
| 3 | Update `evaluate_model.py` and `messidor_test.py` same way | Both files | 1 hr |
| 3 | Hand API Contract to P2 and P3, walk them through it | Meeting | 30 min |
| 4 | Update `model_link.txt` with Google Drive URL | `model_link.txt` | 10 min |
| 4 | Review P2's `segment.py` progress, provide guidance | Code review | 1 hr |
| 5 | Validate everything runs: `evaluate_model.py` produces same metrics | Terminal | 1 hr |

### P2 (Backend) — Lesion Segmentation Port (Core Deliverable)

This is your biggest contribution to the project. You are porting the MATLAB lesion detection to Python.

| Day | Task | File | Details |
|-----|------|------|---------|
| 1 | Read `ml_script/matlab/segment_lesions.m` line by line | — | Understand the morphological pipeline: CLAHE → background subtraction → threshold → connected components → classify by size/circularity |
| 1 | Read `Context/API_Contract.md` | — | Understand the exact JSON shape including the new `lesions` array |
| 2 | Write `segment.py` — microaneurysm detection | `Backend/segment.py` | Port the MA detection: `cv2.morphologyEx(MORPH_CLOSE)` → subtract → `cv2.threshold(OTSU)` → `cv2.connectedComponentsWithStats()` → filter area 4-150px, circularity >= 0.4 |
| 3 | Write `segment.py` — hemorrhage + exudate detection | `Backend/segment.py` | Hemorrhages: same dark pipeline but area 150-3000px. Exudates: bright channel (red+green), high threshold, exclude optic disc (area > 5000px) |
| 4 | Write `segment_lesions()` function that returns the `lesions` array + `lesion_summary` dict matching the API contract | `Backend/segment.py` | Function signature: `segment_lesions(img_pil) -> dict` with `lesions` list and `lesion_summary` |
| 5 | Wire `segment.py` into `inference.py` — call it after ResNet-50, merge results into response | `Backend/inference.py` | `run_inference()` now returns the full response including real lesion data |

### P3 (Frontend) — Remove All Mock Data Dependencies

| Day | Task | File | Details |
|-----|------|------|---------|
| 1 | Read `Context/API_Contract.md` | — | Understand the `lesions` array and `lesion_summary` you'll receive |
| 1 | `npm install` in new repo, verify app loads | Terminal | |
| 2 | Clean `data.js` — remove all hardcoded lesion coordinates | `data.js` | Keep severity colors, labels, actions. Remove `lesionCoords`, `mockFindings`, any hardcoded pixel positions |
| 3 | Rewrite `Canvas.jsx` — render lesion pins from `result.lesions` instead of mock data | `Canvas.jsx` | Each lesion in the API response has `bbox` — use `(bbox[0]+bbox[2])/2, (bbox[1]+bbox[3])/2` as pin center. Map `type` to pin color. Show `area_px` and `confidence` in tooltip. |
| 4 | Rewrite findings table in `Canvas.jsx` — populate from `result.lesions` array | `Canvas.jsx` | Table columns: #, Type, Confidence, Area. Rows come from the API, not mock data. |
| 5 | Clean `Results.jsx` — remove hardcoded image `onError` fallbacks | `Results.jsx` | If image fails to load, show a grey placeholder div with "Image unavailable" text. Don't guess paths. |

---

## WEEK 2 — Integration + Testing

### P1 (Team Lead) — Oversight + MATLAB (If Time)

| Day | Task | Details |
|-----|------|---------|
| 1 | Code review P2's `segment.py` | Does it match the MATLAB output? Run both on same image, compare lesion counts. |
| 2 | Code review P3's Canvas.jsx rewrite | Upload a real image → do the pins appear at real locations? |
| 3 | Run `evaluate_model.py` with shared imports, confirm metrics unchanged | sens=97.6%, spec=89.2% must not change |
| 4 | Run `messidor_test.py` on MESSIDOR-2 | Generate `cross_dataset_report.json` |
| 5 | *Optional:* Write `preprocess_retina.m` + `generate_report.m` for MathWorks showcase | Only if time permits. These are standalone scripts for a separate MATLAB tab during presentation. |

### P2 (Backend) — Integration + Hardening

| Day | Task | File | Details |
|-----|------|------|---------|
| 1 | Fix Grad-CAM hook leak | `inference.py` | Store hook handles, call `.remove()` after each generation. Or instantiate GradCAM once with the singleton model. |
| 2 | Import `build_model` from shared `model.py` | `inference.py` | Remove local `_build_model()`. Either `sys.path.append` or copy `model.py` into Backend. |
| 3 | Add `asyncio.Lock` to serialize inference | `main.py` | `inference_lock = asyncio.Lock()` → `async with inference_lock:` around the inference call |
| 4 | Soften OOD rejection | `inference.py` | After forward pass, if `max(probs) < 0.40`, return `{ "mode": "error", "error": "Low confidence..." }`. Keep heuristic checks as warnings. |
| 5 | Integration test with P3 | — | Upload 5 real fundus images through the React UI. Verify: real grade + real heatmap + real lesion pins. |

### P3 (Frontend) — Integration + Error Handling

| Day | Task | File | Details |
|-----|------|------|---------|
| 1 | Wire `App.jsx` to real `/upload` endpoint | `App.jsx` | Replace any `setTimeout` mock logic with `fetch("http://localhost:8000/upload", ...)` |
| 2 | Handle all 3 response modes in `App.jsx` | `App.jsx` | `mode: "real"` → results. `mode: "error"` → alert + back to Upload. Network error → "Backend not running" message. |
| 3 | Add `Ctrl+Shift+R` reset shortcut | `App.jsx` | `useEffect` with `keydown` listener. Reset all state, navigate to home. `e.preventDefault()` to block browser refresh. |
| 4 | Handle edge case: `lesions` array is empty | `Canvas.jsx` | If API returns `lesions: []`, show "No lesions detected — healthy retina" message instead of empty canvas. |
| 5 | Integration test with P2 | — | Full flow with real backend: upload → IQA animation → processing → real results → real lesion pins on canvas. |

---

## WEEK 3 — Hardening + Presentation Prep

### P1 (Team Lead) — Final Validation + Presentation

| Day | Task | Details |
|-----|------|---------|
| 1 | Lock `evaluation_report.json` — commit as final | No more metric changes after this. |
| 2 | Prepare presentation slides | Architecture diagram, pipeline flow, ROC curve, confusion matrix, lesion segmentation comparison (MATLAB vs Python output side-by-side) |
| 3 | Write judge Q&A answers | "What threshold?" → 0.1162. "What datasets?" → APTOS 2019 + MESSIDOR-2. "How does segmentation work?" → morphological operations. |
| 4 | Full team rehearsal #1 | Run entire flow. Time it. Note issues. |
| 5 | Full team rehearsal #2 | Fix issues from #1. Must be flawless. |

### P2 (Backend) — Stress Testing + Deployment

| Day | Task | Details |
|-----|------|---------|
| 1 | Stress test: 10 rapid uploads | Open 3 browser tabs, upload simultaneously. asyncio.Lock should queue them. No crash, no memory leak. |
| 2 | Test on clean machine | Copy repo to fresh folder. Run `install_deps.bat` then `start_backend.bat`. Must work first try. |
| 3 | Verify memory: upload 10 images, check Task Manager stays under 3GB | — |
| 4 | Rehearsal #1 with team | — |
| 5 | Rehearsal #2 with team | — |

### P3 (Frontend) — Final Polish + Deployment

| Day | Task | Details |
|-----|------|---------|
| 1 | Delete `App.css`. Remove any `import './App.css'` | Cleanup |
| 2 | Test on clean machine | Clone fresh, `npm install`, `npm run dev`. Must work first try. |
| 3 | Verify all screens render with zero console errors | Open DevTools, click through every screen. |
| 4 | Rehearsal #1 with team | — |
| 5 | Rehearsal #2 with team | — |

---

## Ground Rules

| # | Rule |
|---|------|
| 1 | **This is a production project, not a prototype.** All mock data must be replaced with real API responses. |
| 2 | **`model.py` is the ONLY place `build_model()` exists.** |
| 3 | **`preprocess.py` is the ONLY place transforms are defined.** |
| 4 | **`train_ids.csv` and `val_ids.csv` are NEVER regenerated.** |
| 5 | **API contract is FROZEN.** Neither P2 nor P3 changes response keys without P1 approval. |
| 6 | **Decision threshold is `0.1162` — locked.** |
| 7 | **P2 always returns valid JSON on error.** Frontend must never see a Python stack trace. |
| 8 | **Model weights stay on Google Drive, not Git.** |
| 9 | **No hardcoded image paths or lesion coordinates anywhere in the frontend.** Everything comes from the API. |
