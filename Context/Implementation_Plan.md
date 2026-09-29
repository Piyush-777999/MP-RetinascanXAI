# Implementation Plan

**RetinaScan-XAI: 4-Week Build Schedule**

Version: 1.0 | Team Size: 3 | Companion: PRD, TRD, API Contract

---

## 1. Team Structure

| ID | Role | Owns | Skills |
|----|------|------|--------|
| P1 | ML Engineer | `ml_script/` | Python, PyTorch, OpenCV, scikit-learn |
| P2 | Backend Engineer | `Backend/` | Python, FastAPI, REST APIs, OpenCV |
| P3 | Frontend Engineer | `Frontend/retinascan-app/` | React, CSS, Vite, JavaScript |

---

## 2. Parallel Workflow Design

The plan is designed so nobody is ever blocked waiting for someone else.

- **Weeks 1-2:** All 3 work independently. P2 uses mock responses. P3 uses `data.js` mock data.
- **Week 3:** P2 and P3 integrate via the frozen API contract. P1 is independent.
- **Week 4:** All 3 polish and rehearse the demo together.

**Only soft dependency:** P2 needs P1's `.pth` model weights by end of Week 2. P2 develops against a random model until then.

---

## 3. Week-by-Week Deliverables

### Week 1 -- Foundation (Zero Dependencies)

**P1:** Set up shared `model.py` and `preprocess.py` modules. Freeze train/val split IDs. Begin training run.

**P2:** Set up FastAPI server with `/upload` (mock mode), `/health` endpoint, CORS, and static file serving.

**P3:** Initialize React app. Build `Home.jsx`, `Upload.jsx`, and `data.js`. Set up design tokens in `index.css`.

### Week 2 -- Core Pipeline (Soft Dependency)

**P1:** Complete training. Upload `.pth` to Drive. Write `evaluate_model.py`. Generate `evaluation_report.json`.

**P2:** Write `inference.py` with CLAHE, Grad-CAM, OOD check. Wire real inference into `/upload`. Add `/eval-report`.

**P3:** Build `QualityCheck.jsx`, `Processing.jsx`, `Results.jsx`. Wire animated screening flow.

### Week 3 -- Integration & Advanced Features

**P1:** Write `messidor_test.py`. Run MATLAB scripts. Prepare presentation slides.

**P2:** Soften OOD detection. Add asyncio.Lock concurrency guard. Test real API with P3's frontend.

**P3:** Build `Canvas.jsx`, `Queue.jsx`. Wire `App.jsx` to real `/upload` API. Handle OOD errors.

### Week 4 -- Polish & Demo Prep

**P1:** Lock evaluation report. Prepare judge Q&A. Demo rehearsal.

**P2:** Stress test. Finalize start scripts. Demo rehearsal.

**P3:** Build `Referral.jsx`, `Admin.jsx`. Add Ctrl+Shift+R reset. Demo rehearsal.

---

## 4. Integration Points

| When | Who | What |
|------|-----|------|
| Day 1 | All | Agree on API Contract (see API_Contract.md). Freeze it. |
| End of Week 2 | P1 -> P2 | P1 uploads `.pth` to Google Drive. P2 downloads and tests. |
| End of Week 3 | P2 + P3 | 1-hour integration session. P3 wires `fetch()` to P2's API. |

---

## 5. Architecture Safeguards

These rules prevent the critical issues identified in the architectural review:

| Rule | Prevents |
|------|----------|
| `model.py` is the ONLY place `build_model()` exists | state_dict key mismatch across files |
| `preprocess.py` is the ONLY place transforms are defined | train/inference preprocessing mismatch |
| `train_ids.csv` and `val_ids.csv` are frozen after first split | data leakage between train and val sets |
| `data.js` schema is frozen | frontend/backend JSON key mismatch |
| Demo threshold (0.1162) is locked after Week 2 | accidental metric changes |

---

## 6. Definition of Done

The project is demo-ready when all of the following are true:

- [ ] Full screening flow (Upload -> IQA -> Processing -> Results -> Canvas) runs without errors
- [ ] Real fundus image produces correct severity grade + Grad-CAM heatmap
- [ ] Non-fundus image (watermelon/face) is rejected with clear error message
- [ ] `evaluation_report.json` shows Sensitivity >= 90% and Specificity >= 85%
- [ ] Server survives 5 rapid sequential uploads without crash
- [ ] Ctrl+Shift+R resets the entire demo instantly
- [ ] 10-minute live demo rehearsal completes without any glitch
