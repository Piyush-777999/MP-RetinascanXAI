# UI/UX Design Document

**RetinaScan-XAI: Clinical Workstation & Community Health Interface Design Specification**

**Version:** 3.0 | **Companion:** App Flow Document v3.0, PRD v3.0 | **Status:** PRODUCTION

---

## 1. Design Philosophy & Aesthetic Strategy

RetinaScan-XAI unifies two distinct clinical worlds into one seamless software platform:
1. **The Tertiary Doctor Console:** A high-precision PACS (Picture Archiving and Communication System) environment for ophthalmologists, featuring sub-pixel lesion overlays, zoom/pan ergonomics, and laser simulation.
2. **The Community ASHA Counseling Hub:** A warm, compassionate, culturally accessible vernacular portal using rural health pictograms and spoken regional audio to empower patients with low literacy.

Rather than generic dark modes or cold hospital dashboards, the interface is styled around the **Earthy Botanical (`EB`) & Clinical Hospital Design System**: a calming, dignified palette combining deep forest greens, soft sage, warm ivory, and crisp clinical accents that minimize visual fatigue during long screening shifts.

---

## 2. Design Tokens & Palette

### 2.1 The Clinical Nature & Neutral Tokens (`EB` Tokens)
```css
/* Core Surfaces & Typography */
--eb-forest:      #25351A;    /* Primary brand, headers, active steppers */
--eb-olive:       #4C3D12;    /* Secondary headers, accents */
--eb-ivory:       #F4F4E9;    /* Calming workstation canvas background */
--eb-sage:        #7D8960;    /* Muted brand accents, borders */
--eb-celery:      #E3EBC9;    /* Highlight pills, subtle active states */
--eb-grayGreen:   #D0D4C2;    /* Dividers, inactive border strokes */
--eb-ink:         #171812;    /* Primary text (high-contrast clinical black) */
--eb-inkMuted:    #858575;    /* Secondary captions, metadata, units */
--eb-hairline:    rgba(76, 61, 18, 0.15); /* Delicate structural borders */
```

### 2.2 ICDR Severity Diagnostic Color Tokens
Consistent across all screens, badges, probability bars, and triage cards:

| Grade | Clinical Label | Primary Hex | Soft Background | Border Token |
| :---: | :--- | :---: | :---: | :---: |
| **0** | No Apparent DR | `#22c55e` (Emerald) | `rgba(34, 197, 94, 0.10)` | `rgba(34, 197, 94, 0.30)` |
| **1** | Mild NPDR | `#84cc16` (Lime) | `rgba(132, 204, 22, 0.10)` | `rgba(132, 204, 22, 0.30)` |
| **2** | Moderate NPDR | `#f59e0b` (Amber) | `rgba(245, 158, 11, 0.12)` | `rgba(245, 158, 11, 0.35)` |
| **3** | Severe NPDR | `#ea580c` (Orange) | `rgba(234, 88, 12, 0.12)` | `rgba(234, 88, 12, 0.35)` |
| **4** | Proliferative DR | `#dc2626` (Red) | `rgba(220, 38, 38, 0.12)` | `rgba(220, 38, 38, 0.35)` |

### 2.3 Pathological Lesion Marker Tokens
Used in the diagnostic findings table, pin overlays, and anatomical quadrant radar:
- **Microaneurysms (MA):** `#ef4444` (Vivid Crimson Dot, $8-120\,\text{px}^2$)
- **Hemorrhages (HE):** `#f97316` (Deep Orange Flame/Blot, $120-2500\,\text{px}^2$)
- **Hard Exudates (EX):** `#eab308` (Bright Gold Lipid Plaque, $15-3000\,\text{px}^2$)
- **Argon Laser Photocoagulation Burns:** `#10b981` (Therapeutic Green Blanching Rings)

---

## 3. Optical Ergonomics & Layout Calibration

### 3.1 Dynamic Aspect-Ratio Letterbox Calibration (`imgBounds`)
Standard web viewports using `object-fit: cover` or rigid circular masks cause severe diagnostic errors by cropping up to 34% of wide-angle camera sensors (1.51:1 ratio), obscuring the optic disc and nasal arcades.

**The Solution:**
All diagnostic viewports in [Results.jsx](file:///d:/AntiGravity%20projects/MP-RetinascanXAI/Frontend/retinascan-app/src/components/Results.jsx) and [Canvas.jsx](file:///d:/AntiGravity%20projects/MP-RetinascanXAI/Frontend/retinascan-app/src/components/Canvas.jsx) compute a reactive `imgBounds` bounding box based on the image's intrinsic aspect ratio:
```javascript
const imgBounds = useMemo(() => {
  if (imgAspect >= 1) {
    const heightPct = 100 / imgAspect;
    const topPct = (100 - heightPct) / 2;
    return { width: '100%', height: `${heightPct}%`, left: '0%', top: `${topPct}%` };
  } else {
    const widthPct = 100 * imgAspect;
    const leftPct = (100 - widthPct) / 2;
    return { width: `${widthPct}%`, height: '100%', left: `${leftPct}%`, top: '0%' };
  }
}, [imgAspect]);
```
This guarantees that **the fundus scan, Grad-CAM overlay, lesion pins, laser spots, and ETDRS concentric rings are nested in an identical coordinate matrix** with zero distortion.

### 3.2 Clinical Optical Zoom & Drag-to-Pan Controls
To allow ophthalmologists to inspect microvascular details (e.g., $15\,\mu m$ microaneurysms):
- **Steppers:** Discrete magnification buttons for `1x`, `1.5x`, `2x`, `2.5x`, and `↺ Reset`.
- **Mouse Wheel Zoom:** Smooth incremental zoom bounded between $100\%$ and $300\%$.
- **Drag-to-Pan Inspection:** When magnified ($>100\%$), clicking and dragging translates the viewport with an active `grab` / `grabbing` cursor, clamped to the image boundary.

---

## 4. Key Workstation Component Specifications

### 4.1 In-Silico Laser Counterfactual Studio
- **Laser Mode Toggle:** Activates a crosshair targeting reticle.
- **Target Selection:** Clicking existing lesion pins or freehand coordinates drops 532nm argon laser blanching circles.
- **Causal Execution:** An animated button triggers the biophysical inpainting and ResNet-50 re-evaluation.
- **Comparison Drawer:** Side-by-side split screen showing Baseline vs. Laser Treated fundus, accompanied by a causal attribution metric pill ($\Delta P$ percentage drop and down-staging verdict).

### 4.2 Automated ETDRS 9-Zone Macular Grid Overlay
- **Concentric SVG Rings:** Centered over the macula:
  - Central Subfield (CSF, $1\,\text{mm}$ diameter, radius $500\,\mu m$).
  - Inner Ring ($3\,\text{mm}$ diameter, radius $1500\,\mu m$).
  - Outer Ring ($6\,\text{mm}$ diameter, radius $3000\,\mu m$).
- **Foveal Reticle Calibration:** Draggable central target allowing doctors to recalibrate fovea localization.
- **High-Risk CSME Alert Pill:** Flashes a distinct terracotta warning badge when exudates are detected within the $500\,\mu m$ center subfield.

### 4.3 Red-Free (540nm) Optical Filtration
- Replicates standard ophthalmic slit-lamp green filtration.
- Enhances contrast between retinal blood vessels / hemorrhages and the background choroid, allowing clinicians to distinguish tiny microaneurysms from retinal pigment alterations.

### 4.4 ASHA Multilingual Audio & Pictogram Hub
- **Language Switcher Dropdown:** Fast switching between Hindi, Marathi, Telugu, Tamil, Bengali, and English.
- **Audio Synthesizer Card:** Plays voice guidance via browser speech synthesis, pronouncing regional names and localized directions.
- **Dietary & Lifestyle Pictograms:**
  - Recommended Foods: Spinach, Fenugreek, Lentils, Bitter Gourd (with clean icons).
  - Prohibited Foods: Sweets, Sugary Tea, Fried Street Foods (with warning badges).
- **Printable Advice Slip:** High-contrast, single-page print layout formatted for rural patients and family members.
