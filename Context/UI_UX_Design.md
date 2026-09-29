# UI/UX Design Document

**RetinaScan-XAI: Clinical Interface Design Specification**

Version: 1.0 | Companion: App Flow Document, PRD

---

## 1. Design Philosophy

The interface is designed to look like a professional PACS (Picture Archiving and Communication System) workstation -- not a student project. The aesthetic is inspired by high-end medical imaging software used in hospital radiology departments.

**Core Principles:**
- Dark-navy background with teal/cyan accents for a clinical, premium feel
- Glass-morphism panels with backdrop-blur and subtle borders
- Tabular figures for numerical data (monospaced digits)
- Color-coded severity using a consistent palette across all screens
- Micro-animations for loading states and transitions
- Zero clutter -- every element serves a clinical purpose

---

## 2. Design Tokens

### Colors

```css
--bg-primary:     #030c14;    /* Deep navy background */
--bg-surface:     #0a1628;    /* Card/panel background */
--bg-glass:       rgba(10, 22, 40, 0.7);  /* Glass-morphism panels */
--border-glass:   rgba(255, 255, 255, 0.06);
--accent-teal:    #00d4aa;    /* Primary accent, buttons, links */
--accent-cyan:    #00b4d8;    /* Secondary accent */
--text-primary:   #e8f4f8;    /* Main text */
--text-secondary: #7a8ba0;    /* Muted labels */
--text-dim:       #4a5568;    /* Disabled/placeholder text */
```

### Severity Colors

```css
--severity-0:     #10b981;    /* Green -- No DR */
--severity-1:     #f59e0b;    /* Amber -- Mild */
--severity-2:     #f97316;    /* Orange -- Moderate */
--severity-3:     #ef4444;    /* Red -- Severe */
--severity-4:     #dc2626;    /* Dark Red -- Proliferative */
```

### Typography

```css
--font-body:      'Inter', -apple-system, sans-serif;
--font-mono:      'JetBrains Mono', 'Fira Code', monospace;
--font-tabular:   font-variant-numeric: tabular-nums;
```

### Spacing & Sizing

```css
--radius-sm:      6px;
--radius-md:      12px;
--radius-lg:      20px;
--shadow-glass:   0 8px 32px rgba(0, 0, 0, 0.3);
--blur-glass:     backdrop-filter: blur(12px);
```

---

## 3. Component Design Specs

### 3.1 Header Bar
- Height: 56px
- Background: `--bg-surface` with bottom border
- Left: RetinaScan-XAI logo + "Clinical Edition" tag
- Right: System status indicator (green dot = backend connected)

### 3.2 Severity Badge
- Rounded pill shape, 48px height
- Background: severity color with 15% opacity
- Border: 2px solid severity color
- Text: severity level number + label in white bold
- Used in: Results, Queue, Canvas

### 3.3 Glass Panel
- Background: `--bg-glass`
- Border: 1px solid `--border-glass`
- Border-radius: `--radius-md`
- Backdrop-filter: blur(12px)
- Box-shadow: `--shadow-glass`

### 3.4 Probability Bars
- 5 horizontal bars, one per ICDR level
- Width proportional to probability value
- Color matches severity color
- Label on left: "Level 0: No DR"
- Value on right: "72.4%"
- Font: `--font-mono` with tabular-nums

### 3.5 Lesion Pins (Canvas Screen)
- Circular markers, 24px diameter
- Color-coded by lesion type:
  - Microaneurysm: Red (#ef4444)
  - Exudate: Yellow (#fbbf24)
  - Hemorrhage: Orange (#f97316)
  - Neovascularization: Purple (#a855f7)
- Numbered sequentially (1, 2, 3...)
- Hover tooltip shows: lesion type, confidence %, pixel area
- Pulse animation on hover

### 3.6 Conic Ring Spinner (Processing Screen)
- 120px diameter ring
- Background: conic-gradient from teal to transparent
- CSS animation: rotate 360deg, 1.5s linear infinite
- Centered on screen with checklist below

---

## 4. Screen Layouts

### Home Screen
```
+-----------------------------------------------+
| [Header Bar]                                    |
+-----------------------------------------------+
|                                                 |
|   RetinaScan-XAI                               |
|   Clinical Decision Support System              |
|                                                 |
|   +-------------+  +-------------+  +--------+ |
|   | New          |  | Review      |  | Admin  | |
|   | Screening    |  | Queue       |  | Panel  | |
|   +-------------+  +-------------+  +--------+ |
|                                                 |
|   [Status: Backend Connected]                   |
|   [Stats: 847 screenings | 97.6% sensitivity]  |
+-----------------------------------------------+
```

### Upload Screen
```
+-----------------------------------------------+
| [Header Bar]                                    |
+--------------------+---------------------------+
| Patient Form       | Demo Presets               |
| Name: [________]   | [Rajesh K. - Moderate]    |
| Age:  [________]   | [Priya S. - Severe]       |
| Sex:  [________]   | [Amit P. - No DR]         |
| Eye:  [L/R]        | [Sunita D. - Proliferative|
| Notes: [________]  |                           |
+--------------------+---------------------------+
| [Drag & Drop Upload Zone]                       |
| [============ START SCREENING ===============]  |
+-----------------------------------------------+
```

### Results Screen
```
+-----------------------------------------------+
| [Header Bar]                                    |
| [Patient: Rajesh K. | Age: 54 | Right Eye]     |
+-----------------------------------------------+
|                                                 |
|   +-------------------------------------------+ |
|   |  SEVERITY: Level 2 - Moderate NPDR        | |
|   |  Confidence: 96.4%                        | |
|   +-------------------------------------------+ |
|                                                 |
|   L0: No DR         |===            |   1.2%   |
|   L1: Mild           |=====          |   5.3%   |
|   L2: Moderate        |==================| 72.4%  |
|   L3: Severe          |=======        | 14.1%   |
|   L4: Proliferative   |====           |   7.0%   |
|                                                 |
|   Action: Specialist Triage Required            |
|   [========= VIEW DETAILED ANALYSIS =========] |
+-----------------------------------------------+
```

### Canvas Screen
```
+-----------------------------+-------------------+
| [Fundus Image]              | Findings           |
|                             | 1. Microaneurysm   |
|        (1)                  |    Conf: 87%       |
|    (3)     (2)              | 2. Exudate         |
|                             |    Conf: 92%       |
|        (4)                  | 3. Hemorrhage      |
|                             |    Conf: 78%       |
| [Toggle: Grad-CAM ON/OFF]  | 4. Microaneurysm   |
|                             |    Conf: 81%       |
+-----------------------------+-------------------+
| [Approve] [Override] [Generate Referral]         |
+-----------------------------------------------+
```

---

## 5. Responsive Behavior

- Minimum viewport: 1024x768 (clinic laptop screens)
- No mobile layout required (v1 is desktop-only)
- Tables collapse to single-column on viewports < 900px
- Font sizes scale with `clamp()` for readability

---

## 6. Animation Specifications

| Animation | Duration | Easing |
|-----------|----------|--------|
| Screen transition | 300ms | ease-in-out |
| QualityCheck bar fill | 1.5s per bar | ease-out |
| Processing ring spin | 1.5s per rotation | linear, infinite |
| Checklist item resolve | 800ms | ease-in |
| Lesion pin pulse | 1s | ease-in-out, infinite (on hover) |
| Severity badge entrance | 500ms | cubic-bezier(0.34, 1.56, 0.64, 1) |
