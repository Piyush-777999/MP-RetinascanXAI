// 12 demo patients (levels 0-3)
export const allPatients = [
  // Level 0 (Healthy) – 3 patients
  { id: "#DR-88220", name: "Ram Kishore",      age: 64, gender: "M", village: "PHC Mandawar",          severity: 0, label: "No Apparent DR",   confidence: 98.7, findings: "Clean vitreous, no lesions detected.",                       status: "Routine 12-mo",          diabetesDuration: 6,  hba1c: 6.2 },
  { id: "#DR-88225", name: "Smt. Lakshmi Bai", age: 52, gender: "F", village: "Bassi CHC",             severity: 0, label: "No Apparent DR",   confidence: 97.2, findings: "Healthy fundus, clear macula.",                              status: "Cleared",                diabetesDuration: 4,  hba1c: 5.9 },
  { id: "#DR-88226", name: "Ravi Kumar",        age: 45, gender: "M", village: "Sanganer Camp",         severity: 0, label: "No Apparent DR",   confidence: 99.1, findings: "No abnormalities.",                                         status: "Routine 12-mo",          diabetesDuration: 3,  hba1c: 5.7 },
  // Level 1 (Mild) – 3 patients
  { id: "#DR-88221", name: "Fatima Dawood",     age: 49, gender: "F", village: "Kishangarh Sub-Center", severity: 1, label: "Mild NPDR",        confidence: 89.1, findings: "Isolated microaneurysms detected.",                         status: "Secondary Review",       diabetesDuration: 7,  hba1c: 7.4 },
  { id: "#DR-88227", name: "Suresh Patel",      age: 61, gender: "M", village: "Jamwa Ramgarh",         severity: 1, label: "Mild NPDR",        confidence: 91.4, findings: "Few dot-blot hemorrhages.",                                status: "Monitor",                diabetesDuration: 9,  hba1c: 7.8 },
  { id: "#DR-88228", name: "Smt. Anjali Nair",  age: 55, gender: "F", village: "Shahpura Sub-Center",   severity: 1, label: "Mild NPDR",        confidence: 88.3, findings: "Single microaneurysm in superior quadrant.",               status: "Review",                 diabetesDuration: 5,  hba1c: 7.1 },
  // Level 2 (Moderate) – Geeta is the star demo patient
  { id: "#DR-88219", name: "Smt. Geeta Sharma", age: 58, gender: "F", village: "Alwar District",        severity: 2, label: "Moderate NPDR",    confidence: 96.4, findings: "14 microaneurysms, hemorrhages, hard exudates.",           status: "Urgent Priority",        diabetesDuration: 12, hba1c: 9.1 },
  { id: "#DR-88229", name: "Mohan Lal",          age: 67, gender: "M", village: "Tijara CHC",            severity: 2, label: "Moderate NPDR",    confidence: 94.8, findings: "Intraretinal hemorrhages in nasal quadrant.",             status: "Needs Verification",     diabetesDuration: 15, hba1c: 8.8 },
  { id: "#DR-88230", name: "Smt. Sunita Devi",   age: 51, gender: "F", village: "Bhiwadi Camp",          severity: 2, label: "Moderate NPDR",    confidence: 93.2, findings: "Hard exudates forming circinate rings.",                  status: "Priority",               diabetesDuration: 10, hba1c: 8.5 },
  // Level 3 (Severe) – 3 patients
  { id: "#DR-88222", name: "Iqbal Singh",         age: 71, gender: "M", village: "Behror Mobile Unit",   severity: 3, label: "Severe NPDR",      confidence: 97.9, findings: "Cotton wool spots, venous beading.",                      status: "Immediate Referral",     diabetesDuration: 18, hba1c: 10.2 },
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
export const demoPresets = [
  { id: "#DR-88220", name: "Priya S.",   fullName: "Priya Sharma",      age: 34, gender: "F", village: "PHC Mandawar",          severity: 0, label: "No Apparent DR",  confidence: 98.7, findings: "Clean vitreous, no lesions detected.",             status: "Routine 12-mo",      diabetesDuration: 4,  hba1c: 6.2 },
  { id: "#DR-88221", name: "Arjun M.",   fullName: "Arjun Mehta",        age: 49, gender: "M", village: "Kishangarh Sub-Center", severity: 1, label: "Mild NPDR",       confidence: 89.1, findings: "Isolated microaneurysms detected.",                status: "Secondary Review",   diabetesDuration: 7,  hba1c: 7.4 },
  { id: "#DR-88219", name: "Geeta S. ★", fullName: "Smt. Geeta Sharma",  age: 58, gender: "F", village: "Alwar District",        severity: 2, label: "Moderate NPDR",   confidence: 96.4, findings: "14 microaneurysms, hemorrhages, hard exudates.",  status: "Urgent Priority",    diabetesDuration: 12, hba1c: 9.1 },
  { id: "#DR-88222", name: "Kiran D.",   fullName: "Kiran Devi",         age: 71, gender: "F", village: "Behror Mobile Unit",    severity: 3, label: "Severe NPDR",     confidence: 97.9, findings: "Cotton wool spots, venous beading.",              status: "Immediate Referral", diabetesDuration: 18, hba1c: 10.2 },
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
  cottonWool:    { label: "Cotton Wool Spot",    color: "#a855f7", symbol: "CWS" },
  neovascular:   { label: "Neovascularization",  color: "#ec4899", symbol: "NV"  },
};

// x, y are percentages of image width/height — pins scale with image
export const lesionsBySeverity = {
  0: [],
  1: [
    { id: 1, type: "microaneurysm", x: 62, y: 48, confidence: 89 },
    { id: 2, type: "microaneurysm", x: 58, y: 55, confidence: 82 },
  ],
  2: [
    { id: 1, type: "microaneurysm", x: 62, y: 42, confidence: 92 },
    { id: 2, type: "microaneurysm", x: 68, y: 48, confidence: 88 },
    { id: 3, type: "microaneurysm", x: 55, y: 52, confidence: 85 },
    { id: 4, type: "hemorrhage",    x: 72, y: 58, confidence: 94 },
    { id: 5, type: "hemorrhage",    x: 48, y: 62, confidence: 90 },
    { id: 6, type: "hardExudate",   x: 40, y: 55, confidence: 87 },
    { id: 7, type: "hardExudate",   x: 35, y: 48, confidence: 83 },
    { id: 8, type: "microaneurysm", x: 65, y: 65, confidence: 81 },
  ],
  3: [
    { id: 1,  type: "hemorrhage",    x: 60, y: 40, confidence: 96 },
    { id: 2,  type: "hemorrhage",    x: 72, y: 45, confidence: 94 },
    { id: 3,  type: "hemorrhage",    x: 45, y: 55, confidence: 92 },
    { id: 4,  type: "cottonWool",    x: 68, y: 60, confidence: 91 },
    { id: 5,  type: "cottonWool",    x: 38, y: 48, confidence: 89 },
    { id: 6,  type: "microaneurysm", x: 55, y: 68, confidence: 87 },
    { id: 7,  type: "microaneurysm", x: 62, y: 72, confidence: 85 },
    { id: 8,  type: "hardExudate",   x: 42, y: 58, confidence: 88 },
    { id: 9,  type: "hardExudate",   x: 78, y: 52, confidence: 84 },
    { id: 10, type: "hemorrhage",    x: 52, y: 35, confidence: 90 },
  ],
  4: [
    { id: 1,  type: "neovascular",   x: 50, y: 45, confidence: 98 },
    { id: 2,  type: "neovascular",   x: 62, y: 40, confidence: 96 },
    { id: 3,  type: "hemorrhage",    x: 45, y: 55, confidence: 97 },
    { id: 4,  type: "hemorrhage",    x: 70, y: 58, confidence: 95 },
    { id: 5,  type: "hemorrhage",    x: 55, y: 68, confidence: 94 },
    { id: 6,  type: "cottonWool",    x: 38, y: 62, confidence: 92 },
    { id: 7,  type: "cottonWool",    x: 72, y: 50, confidence: 90 },
    { id: 8,  type: "hardExudate",   x: 42, y: 48, confidence: 89 },
    { id: 9,  type: "microaneurysm", x: 60, y: 35, confidence: 88 },
    { id: 10, type: "microaneurysm", x: 68, y: 75, confidence: 86 },
    { id: 11, type: "neovascular",   x: 55, y: 60, confidence: 94 },
    { id: 12, type: "hemorrhage",    x: 48, y: 42, confidence: 93 },
  ],
};

// Deterministic probability distribution per severity (sums to 100)
export function getProbabilityDistribution(severity) {
  const base = [1, 2, 3, 4, 5]; // filler values per grade
  // predicted grade gets ~92%, neighbours get split of remaining
  const dist = [0, 0, 0, 0, 0];
  dist[severity] = 91 + (severity * 1.3) % 5; // deterministic 91-95
  const remaining = 100 - dist[severity];
  const others = [0, 1, 2, 3, 4].filter(i => i !== severity);
  // adjacent grades get more
  others.forEach((i, idx) => {
    const dist_ = Math.abs(i - severity);
    dist[i] = dist_ === 1 ? Math.round(remaining * 0.35) : Math.round(remaining * 0.1);
  });
  // normalize to exactly 100
  const total = dist.reduce((a, b) => a + b, 0);
  const diff = 100 - total;
  dist[severity] += diff;
  return dist;
}

// Compute anatomical region label from x,y coordinates
export function getLesionRegion(x, y) {
  const horiz = x < 40 ? "Temporal" : x > 60 ? "Nasal" : "Macular";
  const vert  = y < 40 ? "Superior" : y > 60 ? "Inferior" : "Central";
  return `${vert} ${horiz}`;
}

