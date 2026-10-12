// 12 demo patients (levels 0-3) — IDs kept in sync with demoPresets below
export const allPatients = [
  // Level 0 (Healthy) – preset patient Priya Sharma + 2 others
  { id: "#DR-88220", name: "Priya Sharma",      age: 34, gender: "F", village: "PHC Mandawar",          severity: 0, label: "No Apparent DR",   confidence: 98.7, findings: "Clean vitreous, no lesions detected.",                       status: "Routine 12-mo",          diabetesDuration: 4,  hba1c: 6.2 },
  { id: "#DR-88225", name: "Smt. Lakshmi Bai", age: 52, gender: "F", village: "Bassi CHC",             severity: 0, label: "No Apparent DR",   confidence: 97.2, findings: "Healthy fundus, clear macula.",                              status: "Cleared",                diabetesDuration: 4,  hba1c: 5.9 },
  { id: "#DR-88226", name: "Ravi Kumar",        age: 45, gender: "M", village: "Sanganer Camp",         severity: 0, label: "No Apparent DR",   confidence: 99.1, findings: "No abnormalities.",                                         status: "Routine 12-mo",          diabetesDuration: 3,  hba1c: 5.7 },
  // Level 1 (Mild) – preset patient Arjun Mehta + 2 others
  { id: "#DR-88221", name: "Arjun Mehta",       age: 49, gender: "M", village: "Kishangarh Sub-Center", severity: 1, label: "Mild NPDR",        confidence: 89.1, findings: "Isolated microaneurysms detected.",                         status: "Secondary Review",       diabetesDuration: 7,  hba1c: 7.4 },
  { id: "#DR-88227", name: "Suresh Patel",      age: 61, gender: "M", village: "Jamwa Ramgarh",         severity: 1, label: "Mild NPDR",        confidence: 91.4, findings: "Few dot-blot hemorrhages.",                                status: "Monitor",                diabetesDuration: 9,  hba1c: 7.8 },
  { id: "#DR-88228", name: "Smt. Anjali Nair",  age: 55, gender: "F", village: "Shahpura Sub-Center",   severity: 1, label: "Mild NPDR",        confidence: 88.3, findings: "Single microaneurysm in superior quadrant.",               status: "Review",                 diabetesDuration: 5,  hba1c: 7.1 },
  // Level 2 (Moderate) – preset patient Smt. Geeta Sharma + 2 others
  { id: "#DR-88219", name: "Smt. Geeta Sharma", age: 58, gender: "F", village: "Alwar District",        severity: 2, label: "Moderate NPDR",    confidence: 96.4, findings: "14 microaneurysms, hemorrhages, hard exudates.",           status: "Urgent Priority",        diabetesDuration: 12, hba1c: 9.1 },
  { id: "#DR-88229", name: "Mohan Lal",          age: 67, gender: "M", village: "Tijara CHC",            severity: 2, label: "Moderate NPDR",    confidence: 94.8, findings: "Intraretinal hemorrhages in nasal quadrant.",             status: "Needs Verification",     diabetesDuration: 15, hba1c: 8.8 },
  { id: "#DR-88230", name: "Smt. Sunita Devi",   age: 51, gender: "F", village: "Bhiwadi Camp",          severity: 2, label: "Moderate NPDR",    confidence: 93.2, findings: "Hard exudates forming circinate rings.",                  status: "Priority",               diabetesDuration: 10, hba1c: 8.5 },
  // Level 3 (Severe) – preset patient Kiran Devi + 2 others
  { id: "#DR-88222", name: "Kiran Devi",         age: 71, gender: "F", village: "Behror Mobile Unit",   severity: 3, label: "Severe NPDR",      confidence: 97.9, findings: "Cotton wool spots, venous beading.",                      status: "Immediate Referral",     diabetesDuration: 18, hba1c: 10.2 },
  { id: "#DR-88231", name: "Smt. Radha Rani",     age: 63, gender: "F", village: "Neemrana SC",          severity: 3, label: "Severe NPDR",      confidence: 95.5, findings: "Intraretinal microvascular abnormalities.",              status: "Critical",               diabetesDuration: 14, hba1c: 9.8 },
  { id: "#DR-88232", name: "Gopal Das",            age: 59, gender: "M", village: "Kotputli CHC",         severity: 3, label: "Severe NPDR",      confidence: 98.0, findings: "Extensive hemorrhages > 4 quadrants.",                  status: "Ophthalmologist Required", diabetesDuration: 11, hba1c: 10.5 },
];

// Severity colors (matches the mockups)
export const severityColors = {
  0: { bg: "#22c55e", label: "Healthy",    text: "#ffffff", border: "#22c55e", tagBg: "#dcfce7", tagText: "#15803d" },
  1: { bg: "#eab308", label: "Mild",       text: "#ffffff", border: "#eab308", tagBg: "#fef9c3", tagText: "#854d0e" },
  2: { bg: "#f59e0b", label: "Moderate",   text: "#ffffff", border: "#f59e0b", tagBg: "#ffedd5", tagText: "#9a3412" },
  3: { bg: "#ea580c", label: "Severe",     text: "#ffffff", border: "#ea580c", tagBg: "#fee2e2", tagText: "#991b1b" },
  4: { bg: "#dc2626", label: "Prolif. DR", text: "#ffffff", border: "#dc2626", tagBg: "#fef2f2", tagText: "#7f1d1d" },
};

// 4 Preset Demo Patients for the Upload screen
// fovea: { x, y } = clinically measured foveal pit position (% of canvas)
// For macula-centered photos (Field 2), fovea ≈ (50, 50).
// For disc-macula combined photos (Field 1), fovea is temporal — measured from actual images.
export const demoPresets = [
  {
    id: "#DR-88220", name: "Priya S.",   fullName: "Priya Sharma",      age: 34, gender: "F", village: "PHC Mandawar",          severity: 0, label: "No Apparent DR",  confidence: 98.7, findings: "Clean vitreous, no lesions detected.",             status: "Routine 12-mo",      diabetesDuration: 4,  hba1c: 6.2,
    // img_0_od: disc at (32%, 55%), fovea (FAZ) at (62%, 60%) — posterior-pole combined field
    fovea: { x: 62.0, y: 59.5 },
    lesions: [],
    lesionSummary: { microaneurysm_count: 0, hemorrhage_count: 0, exudate_count: 0, total_lesion_area_px: 0 },
  },
  {
    id: "#DR-88221", name: "Arjun M.",   fullName: "Arjun Mehta",        age: 49, gender: "M", village: "Kishangarh Sub-Center", severity: 1, label: "Mild NPDR",       confidence: 89.1, findings: "Isolated microaneurysms detected.",                status: "Secondary Review",   diabetesDuration: 7,  hba1c: 7.4,
    // img_1_od: disc pushed right (~97%), fovea approx center (50, 50) — macula-centered
    fovea: { x: 50.0, y: 50.0 },
    lesions: [
      { id: 1, type: "microaneurysm", x: 38, y: 32, bbox: [190, 160, 202, 172], area_px: 78, confidence: 88 },
      { id: 2, type: "microaneurysm", x: 62, y: 55, bbox: [315, 280, 326, 291], area_px: 62, confidence: 82 },
    ],
    lesionSummary: { microaneurysm_count: 2, hemorrhage_count: 0, exudate_count: 0, total_lesion_area_px: 140 },
  },
  {
    id: "#DR-88219", name: "Geeta S. ★", fullName: "Smt. Geeta Sharma",  age: 58, gender: "F", village: "Alwar District",        severity: 2, label: "Moderate NPDR",   confidence: 96.4, findings: "14 microaneurysms, hemorrhages, hard exudates.",  status: "Urgent Priority",    diabetesDuration: 12, hba1c: 9.1,
    // img_2_od: macula-centered Field 2 — fovea at dead center (50, 50)
    fovea: { x: 50.0, y: 50.0 },
    lesions: [
      { id: 1,  type: "microaneurysm", x: 35, y: 28, bbox: [175, 140, 187, 152], area_px: 82, confidence: 91 },
      { id: 2,  type: "microaneurysm", x: 42, y: 44, bbox: [215, 225, 225, 235], area_px: 64, confidence: 87 },
      { id: 3,  type: "microaneurysm", x: 65, y: 38, bbox: [330, 195, 342, 207], area_px: 71, confidence: 84 },
      { id: 4,  type: "microaneurysm", x: 58, y: 62, bbox: [295, 315, 305, 325], area_px: 55, confidence: 82 },
      { id: 5,  type: "hemorrhage",    x: 48, y: 36, bbox: [240, 180, 275, 215], area_px: 680, confidence: 89 },
      { id: 6,  type: "hemorrhage",    x: 68, y: 52, bbox: [340, 260, 380, 300], area_px: 820, confidence: 86 },
      { id: 7,  type: "hardExudate",   x: 44, y: 56, bbox: [220, 280, 245, 305], area_px: 360, confidence: 93 },
      { id: 8,  type: "hardExudate",   x: 40, y: 66, bbox: [200, 335, 230, 360], area_px: 380, confidence: 90 },
      { id: 9,  type: "hardExudate",   x: 52, y: 70, bbox: [265, 355, 290, 380], area_px: 310, confidence: 88 },
      { id: 10, type: "hardExudate",   x: 62, y: 68, bbox: [315, 345, 340, 370], area_px: 290, confidence: 85 },
      { id: 11, type: "microaneurysm", x: 28, y: 46, bbox: [142, 235, 152, 245], area_px: 58, confidence: 80 },
      { id: 12, type: "microaneurysm", x: 72, y: 40, bbox: [368, 205, 378, 215], area_px: 60, confidence: 79 },
      { id: 13, type: "hemorrhage",    x: 55, y: 26, bbox: [280, 130, 310, 160], area_px: 540, confidence: 83 },
      { id: 14, type: "hardExudate",   x: 48, y: 52, bbox: [240, 260, 255, 275], area_px: 220, confidence: 92 },
    ],
    lesionSummary: { microaneurysm_count: 6, hemorrhage_count: 3, exudate_count: 5, total_lesion_area_px: 4130 },
  },
  {
    id: "#DR-88222", name: "Kiran D.",   fullName: "Kiran Devi",         age: 71, gender: "F", village: "Behror Mobile Unit",    severity: 3, label: "Severe NPDR",     confidence: 97.9, findings: "Cotton wool spots, venous beading.",              status: "Immediate Referral", diabetesDuration: 18, hba1c: 10.2,
    // img_3_od: disc at left (23%), fovea at (50, 50) — standard macula-centered
    fovea: { x: 50.0, y: 50.0 },
    lesions: [
      { id: 1,  type: "microaneurysm", x: 26, y: 24, bbox: [130, 120, 142, 132], area_px: 92, confidence: 94 },
      { id: 2,  type: "microaneurysm", x: 44, y: 22, bbox: [225, 110, 235, 121], area_px: 75, confidence: 91 },
      { id: 3,  type: "microaneurysm", x: 74, y: 35, bbox: [378, 178, 389, 189], area_px: 80, confidence: 88 },
      { id: 4,  type: "hemorrhage",    x: 32, y: 40, bbox: [160, 200, 220, 260], area_px: 1840, confidence: 95 },
      { id: 5,  type: "hemorrhage",    x: 65, y: 30, bbox: [330, 150, 390, 210], area_px: 1650, confidence: 92 },
      { id: 6,  type: "hemorrhage",    x: 58, y: 64, bbox: [290, 320, 360, 385], area_px: 2100, confidence: 90 },
      { id: 7,  type: "hardExudate",   x: 28, y: 68, bbox: [140, 345, 180, 385], area_px: 950, confidence: 93 },
      { id: 8,  type: "hardExudate",   x: 38, y: 75, bbox: [195, 380, 235, 415], area_px: 780, confidence: 89 },
      { id: 9,  type: "cottonWool",    x: 48, y: 45, bbox: [245, 230, 290, 275], area_px: 1200, confidence: 92 },
      { id: 10, type: "cottonWool",    x: 62, y: 52, bbox: [315, 265, 355, 300], area_px: 890, confidence: 87 },
    ],
    lesionSummary: { microaneurysm_count: 3, hemorrhage_count: 3, exudate_count: 2, cotton_wool_count: 2, total_lesion_area_px: 9657 },
  },
];

// Image paths pointing to local /public/images/
export const imagePaths = {
  0: { fundus: "/images/img_0_od.jpg", heatmap: "/images/heatmap_0_od.jpg" },
  1: { fundus: "/images/img_1_od.jpg", heatmap: "/images/heatmap_1_od.jpg" },
  2: { fundus: "/images/img_2_od.jpg", heatmap: "/images/heatmap_2_od.jpg" },
  3: { fundus: "/images/img_3_od.jpg", heatmap: "/images/heatmap_3_od.jpg" },
  4: { fundus: "/images/img_4_od.jpg", heatmap: "/images/heatmap_4_od.jpg" },
};

// Patient stories for demo narration
export const patientStories = {
  0: "Healthy retina. No diabetic retinopathy detected. Routine annual screening recommended.",
  1: "Mild Non-Proliferative DR. Isolated microaneurysms detected. Monitor annually.",
  2: "Moderate Non-Proliferative DR. Multiple microaneurysms, hemorrhages, and hard exudates. Refer to ophthalmologist.",
  3: "Severe Non-Proliferative DR. Extensive hemorrhages, cotton wool spots, and venous beading. Urgent specialist referral required.",
};

// ==== NEW EXPORTS — do not modify anything above this line ====

// Lesion type definitions — color + short symbol for pins
export const lesionTypes = {
  microaneurysm: { label: "Microaneurysm",      color: "#ef4444", symbol: "MA"  },
  hemorrhage:    { label: "Hemorrhage",          color: "#f97316", symbol: "HE"  },
  hardExudate:   { label: "Hard Exudate",        color: "#eab308", symbol: "EX"  },
  exudate:       { label: "Hard Exudate",        color: "#eab308", symbol: "EX"  },
  cottonWool:    { label: "Cotton Wool Spot",    color: "#a855f7", symbol: "CWS" },
  neovascular:   { label: "Neovascularization",  color: "#ec4899", symbol: "NV"  },
};

// Map backend lesion types to standard frontend types
export function normalizeLesionType(type) {
  if (!type) return 'microaneurysm';
  const lower = String(type).toLowerCase();
  if (lower === 'exudate' || lower === 'hardexudate') return 'hardExudate';
  if (lower === 'microaneurysm' || lower === 'ma') return 'microaneurysm';
  if (lower === 'hemorrhage' || lower === 'haemorrhage' || lower === 'hem') return 'hemorrhage';
  if (lower === 'cottonwool' || lower === 'cws') return 'cottonWool';
  if (lower === 'neovascular' || lower === 'nv') return 'neovascular';
  return type;
}

// Compute anatomical region label from x,y coordinates
export function getLesionRegion(x, y) {
  const horiz = x < 40 ? "Temporal" : x > 60 ? "Nasal" : "Macular";
  const vert  = y < 40 ? "Superior" : y > 60 ? "Inferior" : "Central";
  return `${vert} ${horiz}`;
}

