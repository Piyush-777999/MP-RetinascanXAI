import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  lesionTypes,
  normalizeLesionType,
  getLesionRegion,
} from '../data.js';
import { getT } from '../translations.js';
import AshaPatientCounselor from './AshaPatientCounselor.jsx';
import { API_BASE_URL, getFullImageUrl } from '../apiConfig.js';

/* ── Clinical Design tokens (Hospital Light Theme) ───────────────────────── */
const D = {
  bg:       '#f8fafc',
  panel:    '#ffffff',
  card:     '#ffffff',
  border:   '#e2e8f0',
  borderLight: '#f1f5f9',
  primary:  '#0284c7',
  primaryHover: '#0369a1',
  primaryLight: '#f0f9ff',
  success:  '#16a34a',
  text:     '#0f172a',
  sub:      '#475569',
  muted:    '#64748b',
  mono:     'JetBrains Mono, "Courier New", monospace',
};

const GRADE_LABELS = [
  { key: 0, name: 'Grade 0: No DR',           color: '#15803d', bg: '#dcfce7', border: '#bbf7d0', shortName: 'Healthy (No DR)' },
  { key: 1, name: 'Grade 1: Mild NPDR',        color: '#b45309', bg: '#fef3c7', border: '#fde68a', shortName: 'Mild NPDR' },
  { key: 2, name: 'Grade 2: Moderate NPDR',    color: '#c2410c', bg: '#ffedd5', border: '#fed7aa', shortName: 'Moderate NPDR' },
  { key: 3, name: 'Grade 3: Severe NPDR',      color: '#b91c1c', bg: '#fee2e2', border: '#fecaca', shortName: 'Severe NPDR' },
  { key: 4, name: 'Grade 4: Proliferative DR', color: '#991b1b', bg: '#fef2f2', border: '#fca5a5', shortName: 'Proliferative DR' },
];

const SEVERITY_ACTIONS = [
  'Routine annual re-screening recommended',
  'Monitor in 6–12 months with repeat fundus photography',
  'Specialist triage required — refer to ophthalmologist within 1 month',
  'Urgent specialist referral — evaluate within 1 week',
  'Emergency triage — evaluate within 24 hours for laser/anti-VEGF',
];

const LEGEND_TYPES = [
  { type: 'microaneurysm', label: 'Microaneurysms (MA)',   color: '#dc2626', bg: '#fee2e2', border: '#fecaca', symbol: 'MA' },
  { type: 'hemorrhage',    label: 'Hemorrhages (HE)',       color: '#ea580c', bg: '#ffedd5', border: '#fed7aa', symbol: 'HE' },
  { type: 'hardExudate',   label: 'Hard Exudates (EX)',     color: '#0284c7', bg: '#e0f2fe', border: '#bae6fd', symbol: 'EX' },
  { type: 'cottonWool',    label: 'Cotton Wool Spots',      color: '#7c3aed', bg: '#ede9fe', border: '#ddd6fe', symbol: 'CWS' },
  { type: 'neovascular',   label: 'Neovascularization',     color: '#db2777', bg: '#fce7f3', border: '#fbcfe8', symbol: 'NV' },
];

const KEYFRAMES = `
  @keyframes pin-pulse {
    0%   { transform: translate(-50%,-50%) scale(1);   opacity: 0.8; }
    50%  { transform: translate(-50%,-50%) scale(2.2); opacity: 0; }
    100% { transform: translate(-50%,-50%) scale(1);   opacity: 0; }
  }
  @keyframes pin-in {
    from { transform: translate(-50%,-50%) scale(0); opacity: 0; }
    to   { transform: translate(-50%,-50%) scale(1); opacity: 1; }
  }
  @keyframes bar-grow {
    from { width: 0; }
  }
  @keyframes fade-up {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes laser-pulse {
    0%   { box-shadow: 0 0 6px #06b6d4, inset 0 0 6px #06b6d4; }
    50%  { box-shadow: 0 0 16px #06b6d4, inset 0 0 10px #06b6d4; }
    100% { box-shadow: 0 0 6px #06b6d4, inset 0 0 6px #06b6d4; }
  }
  @keyframes laser-spin {
    from { transform: translate(-50%,-50%) rotate(0deg); }
    to   { transform: translate(-50%,-50%) rotate(360deg); }
  }
`;

function getQuadrant(x, y) {
  return (y < 50 ? 'S' : 'I') + (x < 50 ? 'T' : 'N');
}

// ── ETDRS 9-Zone Macular Constants & Spatial Scaling ─────────────────────────
// Standard 45° posterior pole fundus image ≈ 15,000 µm across diameter
// 1% normalized coordinate ≈ 150 µm
export const MICRONS_PER_PERCENT = 150.0;
export const RADIUS_CSF_PCT   = 500.0 / 150.0;  // 3.333% radius = 1.0mm diameter Central Subfield (CSF)
export const RADIUS_INNER_PCT = 1500.0 / 150.0; // 10.0% radius = 3.0mm diameter Inner Ring
export const RADIUS_OUTER_PCT = 3000.0 / 150.0; // 20.0% radius = 6.0mm diameter Outer Ring

export function classifyEtdrsSector(dxPct, dyPct, eye = 'od') {
  const distPct = Math.sqrt(dxPct * dxPct + dyPct * dyPct);
  const distUm = distPct * MICRONS_PER_PERCENT;

  // In screen coordinates y goes down, so math_y = -dyPct
  let mathAngle = Math.atan2(-dyPct, dxPct) * (180 / Math.PI);
  if (mathAngle < 0) mathAngle += 360;

  let vert = 'Superior';
  let vertCode = 'S';
  if (mathAngle >= 45 && mathAngle < 135) {
    vert = 'Superior';
    vertCode = 'S';
  } else if (mathAngle >= 225 && mathAngle < 315) {
    vert = 'Inferior';
    vertCode = 'I';
  } else if (mathAngle >= 135 && mathAngle < 225) {
    // Left side of fundus
    if (eye.toLowerCase() === 'od') {
      vert = 'Temporal';
      vertCode = 'T';
    } else {
      vert = 'Nasal';
      vertCode = 'N';
    }
  } else {
    // Right side of fundus
    if (eye.toLowerCase() === 'od') {
      vert = 'Nasal';
      vertCode = 'N';
    } else {
      vert = 'Temporal';
      vertCode = 'T';
    }
  }

  if (distPct <= RADIUS_CSF_PCT) {
    return { code: 'CSF', name: 'Central Subfield (1mm)', distUm, distPct };
  } else if (distPct <= RADIUS_INNER_PCT) {
    return { code: `I${vertCode}`, name: `Inner ${vert} (3mm)`, distUm, distPct };
  } else if (distPct <= RADIUS_OUTER_PCT) {
    return { code: `O${vertCode}`, name: `Outer ${vert} (6mm)`, distUm, distPct };
  } else {
    return { code: 'Peripheral', name: 'Peripheral Retina (>6mm)', distUm, distPct };
  }
}

function parseLesion(lesion, idx, foveaAnchor = { x: 50, y: 50 }, eye = 'od') {
  const normType = normalizeLesionType(lesion.type);
  const lt = lesionTypes[normType] || lesionTypes.microaneurysm;
  let x = 50;
  let y = 50;

  if (lesion.x != null && lesion.y != null) {
    x = lesion.x;
    y = lesion.y;
  } else if (Array.isArray(lesion.bbox) && lesion.bbox.length === 4) {
    const [x1, y1, x2, y2] = lesion.bbox;
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    if (x1 <= 1 && x2 <= 1 && y1 <= 1 && y2 <= 1) {
      x = cx * 100;
      y = cy * 100;
    } else {
      x = (cx / 512) * 100;
      y = (cy / 512) * 100;
    }
  }

  x = Math.max(0, Math.min(100, x));
  y = Math.max(0, Math.min(100, y));

  let confidence = null;
  if (lesion.confidence != null) {
    confidence = lesion.confidence <= 1
      ? Math.round(lesion.confidence * 100)
      : Math.round(lesion.confidence);
  }

  const area_px = lesion.area_px ?? lesion.area ?? null;
  const id = lesion.id ?? (idx + 1);

  // ETDRS distance and sector classification
  const dx = x - (foveaAnchor?.x ?? 50);
  const dy = y - (foveaAnchor?.y ?? 50);
  const etdrs = classifyEtdrsSector(dx, dy, eye || 'od');
  const isCsmeThreat = (normType === 'hardExudate' || normType === 'exudate') && etdrs.distUm <= 1500;

  return {
    id,
    type: normType,
    rawType: lesion.type,
    x,
    y,
    confidence,
    area_px,
    bbox: lesion.bbox,
    lt,
    etdrsSector: etdrs.code,
    etdrsSectorName: etdrs.name,
    distUm: etdrs.distUm,
    isCsmeThreat,
  };
}

export default function Results({
  navigate,
  patient,
  severity = 2,
  selectedEye = 'od',
  setSelectedEye = () => {},
  heatmapUrl = '',
  uploadedImageUrl = '',
  lesions: propLesions,
  lesionSummary,
  allProbs,
  onQueue,
  etdrsProfile: propEtdrsProfile,
  currentAppLang = 'hi',
  uploadError = null,
  apiResponse = null,
  clearUploadError = null,
}) {
  const [showHeatmap,  setShowHeatmap]  = useState(true);
  const [showPins,     setShowPins]     = useState(true);
  const [showRedFree,  setShowRedFree]  = useState(false);
  const [hoveredId,    setHoveredId]    = useState(null);
  const [bilateral,    setBilateral]    = useState(false);
  const [imgError,     setImgError]     = useState(false);
  const [heatmapError, setHeatmapError] = useState(false);
  const [filterType,   setFilterType]   = useState('all');
  const [imgAspect,    setImgAspect]    = useState(1);

  const imgBounds = useMemo(() => {
    if (imgAspect > 1.01) {
      const h = (100 / imgAspect);
      const top = (100 - h) / 2;
      return { left: 0, top, width: 100, height: h };
    } else if (imgAspect < 0.99) {
      const w = imgAspect * 100;
      const left = (100 - w) / 2;
      return { left, top: 0, width: w, height: 100 };
    }
    return { left: 0, top: 0, width: 100, height: 100 };
  }, [imgAspect]);

  // ── Optical Zoom & Pan State for Doctor Inspection ──
  const [zoom, setZoom] = useState(100); // 100% to 300%
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ startX: 0, startY: 0, initPanX: 0, initPanY: 0 });

  // Reset zoom & pan when switching patients or eyes
  useEffect(() => {
    setZoom(100);
    setPan({ x: 0, y: 0 });
  }, [patient?.id, selectedEye]);

  const handleWheelZoom = (e) => {
    if (laserMode) return; // Avoid conflict during laser targeting
    const delta = e.deltaY < 0 ? 15 : -15;
    setZoom(prev => {
      const next = Math.min(300, Math.max(100, prev + delta));
      if (next === 100) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  const handlePanStart = (e) => {
    if (laserMode || zoom <= 100) return;
    if (e.target.closest('[data-no-pan="true"]')) return;
    setIsPanning(true);
    panStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initPanX: pan.x,
      initPanY: pan.y,
    };
  };

  const handlePanMove = (e) => {
    if (!isPanning || zoom <= 100) return;
    const dx = e.clientX - panStartRef.current.startX;
    const dy = e.clientY - panStartRef.current.startY;
    const maxPan = (zoom - 100) * 1.8;
    setPan({
      x: Math.max(-maxPan, Math.min(maxPan, panStartRef.current.initPanX + dx)),
      y: Math.max(-maxPan, Math.min(maxPan, panStartRef.current.initPanY + dy)),
    });
  };

  const handlePanEnd = () => {
    setIsPanning(false);
  };

  // ── ETDRS 9-Zone Macular Grid & CSME State ──
  const [showEtdrsGrid,        setShowEtdrsGrid]        = useState(true); // Active by default for immediate clinical impact
  const [selectedEtdrsSector,  setSelectedEtdrsSector]  = useState(null); // 'CSF' | 'IS' | 'IN' | 'II' | 'IT' | etc.
  // Per-patient fovea anchor: initialized from patient.fovea (clinically measured), falls back to (50,50).
  // Clinician can drag the reticle on the ETDRS grid to recalibrate.
  const [foveaAnchor, setFoveaAnchor] = useState(() => ({
    x: patient?.fovea?.x ?? 50.0,
    y: patient?.fovea?.y ?? 50.0,
  }));
  const [isDraggingFovea, setIsDraggingFovea] = useState(false);

  // Keep fovea anchor in sync when patient changes (e.g. switching presets)
  useEffect(() => {
    setFoveaAnchor({
      x: patient?.fovea?.x ?? 50.0,
      y: patient?.fovea?.y ?? 50.0,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient?.id]);

  // ── 3-Actor Role View Switcher: 'doctor' | 'asha' ──
  const [activeView, setActiveView] = useState('doctor');

  // ── In-Silico Laser Counterfactual XAI State ──
  const [laserMode,              setLaserMode]              = useState(false);
  const [selectedLaserLesionIds, setSelectedLaserLesionIds] = useState([]);
  const [laserSpots,             setLaserSpots]             = useState([]);
  const [isFiringLaser,          setIsFiringLaser]          = useState(false);
  const [counterfactualResult,   setCounterfactualResult]   = useState(null);
  const [counterfactualError,    setCounterfactualError]    = useState(null);
  const [laserDisplayMode,       setLaserDisplayMode]       = useState('treated'); // 'treated' | 'cf_heatmap' | 'original'

  const sev       = severity ?? patient?.severity ?? 2;
  const eye       = selectedEye || 'od';
  const gradeInfo = GRADE_LABELS[sev] || GRADE_LABELS[2];
  const conf      = patient?.confidence != null ? patient.confidence : (91 + sev * 1.4).toFixed(1);

  const rawLesions = propLesions || patient?.lesions || [];
  const lesions = useMemo(() => {
    if (!Array.isArray(rawLesions)) return [];
    return rawLesions.map((l, idx) => parseLesion(l, idx, foveaAnchor, eye));
  }, [rawLesions, foveaAnchor, eye]);

  // Active lesions accounting for real-time In-Silico Laser ablation
  const activeLesions = useMemo(() => {
    if (counterfactualResult && (laserDisplayMode === 'treated' || laserDisplayMode === 'cf_heatmap')) {
      const ablatedIds = new Set(selectedLaserLesionIds);
      return lesions.filter(l => !ablatedIds.has(l.id));
    }
    return lesions;
  }, [lesions, counterfactualResult, laserDisplayMode, selectedLaserLesionIds]);

  // Reactive ETDRS 9-Zone distribution & CSME risk stratification
  const etdrsProfile = useMemo(() => {
    let closestExudateDist = Infinity;
    let closestMaDist = Infinity;
    let closestHemDist = Infinity;
    let exudatesInCsf = 0;
    let exudatesInInner = 0;
    let exudatesInOuter = 0;

    const sectorCounts = {
      CSF: { microaneurysm: 0, hemorrhage: 0, exudate: 0, total: 0 },
      IS:  { microaneurysm: 0, hemorrhage: 0, exudate: 0, total: 0 },
      IN:  { microaneurysm: 0, hemorrhage: 0, exudate: 0, total: 0 },
      II:  { microaneurysm: 0, hemorrhage: 0, exudate: 0, total: 0 },
      IT:  { microaneurysm: 0, hemorrhage: 0, exudate: 0, total: 0 },
      OS:  { microaneurysm: 0, hemorrhage: 0, exudate: 0, total: 0 },
      ON:  { microaneurysm: 0, hemorrhage: 0, exudate: 0, total: 0 },
      OI:  { microaneurysm: 0, hemorrhage: 0, exudate: 0, total: 0 },
      OT:  { microaneurysm: 0, hemorrhage: 0, exudate: 0, total: 0 },
      Peripheral: { microaneurysm: 0, hemorrhage: 0, exudate: 0, total: 0 },
    };

    activeLesions.forEach(l => {
      const sec = l.etdrsSector;
      const isEx = l.type === 'hardExudate' || l.type === 'exudate';
      const isHem = l.type === 'hemorrhage';
      const isMa = l.type === 'microaneurysm';

      if (isEx) {
        if (l.distUm < closestExudateDist) closestExudateDist = l.distUm;
        if (l.distUm <= 500) exudatesInCsf++;
        else if (l.distUm <= 1500) exudatesInInner++;
        else if (l.distUm <= 3000) exudatesInOuter++;
      } else if (isMa) {
        if (l.distUm < closestMaDist) closestMaDist = l.distUm;
      } else if (isHem) {
        if (l.distUm < closestHemDist) closestHemDist = l.distUm;
      }

      if (sectorCounts[sec]) {
        if (isEx) sectorCounts[sec].exudate++;
        else if (isHem) sectorCounts[sec].hemorrhage++;
        else if (isMa) sectorCounts[sec].microaneurysm++;
        sectorCounts[sec].total++;
      }
    });

    let csmeRisk = 'LOW';
    let csmeLabel = 'No Macular Edema Risk';
    let badgeColor = '#16a34a';
    let badgeBg = '#dcfce7';
    let triage = 'Routine Annual Retinal Screening';
    let protocol = 'No hard exudates or microvascular leakage detected within the 6mm ETDRS macular zone. Macular architecture intact.';

    if (exudatesInCsf > 0) {
      csmeRisk = 'HIGH';
      csmeLabel = 'Center-Involved CSME (High Risk)';
      badgeColor = '#dc2626';
      badgeBg = '#fee2e2';
      triage = 'Urgent Retina Specialist Evaluation within 7–14 Days';
      protocol = `ETDRS Criterion 1 Met: ${exudatesInCsf} hard exudate(s) detected within 500 µm of foveal center (closest: ${Math.round(closestExudateDist)} µm). Severe threat of irreversible central visual loss. Immediate Macular OCT & Anti-VEGF / Focal Laser evaluation required.`;
    } else if (exudatesInInner > 0) {
      csmeRisk = 'MODERATE';
      csmeLabel = 'Non-Center Involved CSME (Moderate)';
      badgeColor = '#ea580c';
      badgeBg = '#ffedd5';
      triage = 'Retina Specialist Referral within 1 Month';
      protocol = `ETDRS Criterion 2 Met: ${exudatesInInner} hard exudate(s) in inner macular ring (500–1500 µm, closest: ${Math.round(closestExudateDist)} µm). Progressive foveal lipid migration risk. Recommend macular OCT.`;
    } else if (exudatesInOuter > 0) {
      csmeRisk = 'BORDERLINE';
      csmeLabel = 'Borderline Macular Threat (Outer Ring)';
      badgeColor = '#ca8a04';
      badgeBg = '#fef9c3';
      triage = 'Routine Diabetic Macular Review (3–6 Months)';
      protocol = `Hard exudates detected in 3–6mm outer macular zone. Foveal center currently spared. Intensify glycemic and lipid management.`;
    }

    const macularTotal = Object.keys(sectorCounts)
      .filter(k => k !== 'Peripheral')
      .reduce((acc, k) => acc + sectorCounts[k].total, 0);

    return {
      csmeRisk,
      csmeLabel,
      badgeColor,
      badgeBg,
      triage,
      protocol,
      closestExudateDist: closestExudateDist !== Infinity ? closestExudateDist : null,
      closestMaDist: closestMaDist !== Infinity ? closestMaDist : null,
      closestHemDist: closestHemDist !== Infinity ? closestHemDist : null,
      exudatesInCsf,
      exudatesInInner,
      exudatesInOuter,
      sectorCounts,
      macularTotal,
    };
  }, [activeLesions]);

  const typeCounts = useMemo(() => {
    const counts = { all: lesions.length, microaneurysm: 0, hemorrhage: 0, hardExudate: 0, other: 0 };
    lesions.forEach(l => {
      if (counts[l.type] !== undefined) counts[l.type]++;
      else counts.other++;
    });
    return counts;
  }, [lesions]);

  const filteredLesions = useMemo(() => {
    let list = lesions;
    if (filterType !== 'all') {
      list = list.filter(l => l.type === filterType);
    }
    if (selectedEtdrsSector) {
      list = list.filter(l => l.etdrsSector === selectedEtdrsSector);
    }
    return list;
  }, [lesions, filterType, selectedEtdrsSector]);

  const probs = useMemo(() => {
    const raw = allProbs || patient?.all_probs;
    if (Array.isArray(raw) && raw.length === 5) {
      return raw.map(p => p <= 1 ? Math.round(p * 100) : Math.round(p));
    }
    const base = [0, 0, 0, 0, 0];
    base[sev] = patient?.confidence ? Math.round(patient.confidence) : 95;
    return base;
  }, [allProbs, patient?.all_probs, sev, patient?.confidence]);

  const fundusPath = uploadedImageUrl || patient?.imageUrl || `/images/img_${sev}_${eye}.jpg`;
  const defaultPresetHeatmap = `/images/heatmap_${sev}_${eye}.png`;
  const heatmapPath = uploadedImageUrl
    ? (heatmapUrl ? getFullImageUrl(heatmapUrl) : '')
    : defaultPresetHeatmap;

  const currentFundusPath = useMemo(() => {
    if (counterfactualResult && (laserDisplayMode === 'treated' || laserDisplayMode === 'cf_heatmap')) {
      const u = counterfactualResult.counterfactual.treated_image_url;
      return getFullImageUrl(u);
    }
    return fundusPath;
  }, [counterfactualResult, laserDisplayMode, fundusPath]);

  const currentHeatmapPath = useMemo(() => {
    if (counterfactualResult) {
      if (laserDisplayMode === 'cf_heatmap') {
        const u = counterfactualResult.counterfactual.heatmap_url;
        return getFullImageUrl(u);
      }
      if (laserDisplayMode === 'treated') {
        return ''; // Pure treated tissue inspection — do NOT overlay stale baseline heatmap!
      }
      if (laserDisplayMode === 'original') {
        return heatmapPath;
      }
    }
    return heatmapPath;
  }, [counterfactualResult, laserDisplayMode, heatmapPath]);

  const handleFireLaser = async () => {
    if (selectedLaserLesionIds.length === 0 && laserSpots.length === 0) {
      alert("Please select at least one lesion pin or target a spot with the laser!");
      return;
    }
    setIsFiringLaser(true);
    setCounterfactualError(null);

    const ablated = lesions.filter(l => selectedLaserLesionIds.includes(l.id));
    const baseProbs = (allProbs || patient?.all_probs || probs.map(p => p / 100));

    try {
      const resp = await fetch(`${API_BASE_URL}/counterfactual-laser`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_identifier: apiResponse?.image_url || patient?.serverImageUrl || fundusPath,
          ablated_lesions: ablated.map(l => ({
            id: l.id,
            type: l.type,
            x: l.x,
            y: l.y,
            area_px: l.area_px,
            bbox: l.bbox,
          })),
          laser_spots: laserSpots,
          original_severity: sev,
          original_probs: baseProbs,
        }),
      });

      if (!resp.ok) {
        throw new Error(`Server returned HTTP ${resp.status}`);
      }

      const data = await resp.json();
      setCounterfactualResult(data);
      setLaserDisplayMode('treated');
    } catch (err) {
      console.error("In-silico laser failed:", err);
      setCounterfactualError(err.message || "Failed to execute in-silico laser.");
    } finally {
      setIsFiringLaser(false);
    }
  };

  const handleCanvasClick = (e) => {
    if (!laserMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    const distFromCenter = Math.sqrt((xPct - 50) ** 2 + (yPct - 50) ** 2);
    if (distFromCenter <= 48) {
      setLaserSpots(prev => [...prev, { x: Math.round(xPct * 10) / 10, y: Math.round(yPct * 10) / 10, radius: 18 }]);
    }
  };

  const presentTypes = LEGEND_TYPES.filter(t => lesions.some(l => l.type === t.type));

  const quadCounts = { ST: 0, SN: 0, IT: 0, IN: 0 };
  lesions.forEach(l => {
    const q = getQuadrant(l.x, l.y);
    if (quadCounts[q] !== undefined) quadCounts[q]++;
  });

  const studyId  = patient?.id?.replace('#', '') || 'STUDY-DR88219';
  const patName  = patient?.fullName || patient?.name || 'Smt. Geeta Sharma';

  const handleQueueClick = () => { if (onQueue) onQueue(); else if (navigate) navigate('queue'); };

  useEffect(() => {
    const id = 'results-keyframes-light';
    if (!document.getElementById(id)) {
      const s = document.createElement('style');
      s.id = id; s.textContent = KEYFRAMES;
      document.head.appendChild(s);
    }
  }, []);

  // Dedicated fallback screen if the active scan failed validation
  if (patient?.mode === 'error' || apiResponse?.mode === 'error') {
    return (
      <div style={{
        minHeight: 'calc(100vh - 56px)',
        background: D.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}>
        <div style={{
          maxWidth: 520,
          background: '#ffffff',
          borderRadius: 16,
          border: '1px solid #fecaca',
          padding: '36px 32px',
          textAlign: 'center',
          boxShadow: '0 4px 16px rgba(220,38,38,0.08)',
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: '#fee2e2', color: '#dc2626',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 800, margin: '0 auto 16px',
          }}>
            !
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#991b1b', margin: '0 0 8px' }}>
            Non-Retinal Image / Validation Rejected
          </h2>
          <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, margin: '0 0 20px' }}>
            {apiResponse?.error || patient?.error || "The uploaded image was rejected because it is not an ocular fundus photograph. Diabetic retinopathy classification, ETDRS staging, and lesion mapping require a 45° posterior pole retinal photograph."}
          </p>
          <button
            onClick={() => navigate('upload')}
            style={{
              all: 'unset', cursor: 'pointer',
              padding: '10px 22px', borderRadius: 8,
              background: '#0284c7', color: '#ffffff',
              fontSize: 13, fontWeight: 700,
              boxShadow: '0 2px 8px rgba(2,132,199,0.25)',
            }}
          >
            ← Return to Patient Intake to Upload Retinal Scan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      height: 'calc(100vh - 56px)',
      maxHeight: 'calc(100vh - 56px)',
      minHeight: 'calc(100vh - 56px)',
      background: D.bg,
      color: D.text,
      fontFamily: 'Inter, system-ui, sans-serif',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      animation: 'fade-up 0.25s ease both',
    }}>

      {/* ── Warning Banner if Live Upload was rejected ── */}
      {uploadError && (
        <div style={{
          background: '#fef2f2', borderBottom: '1px solid #fecaca',
          padding: '7px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: 12, color: '#991b1b', flexShrink: 0, gap: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 800 }}>⚠️ Live Upload Rejected:</span>
            <span>{uploadError} Displaying previous verified clinical record (<strong>{patName}</strong>).</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <button
              onClick={() => navigate('upload')}
              style={{
                all: 'unset', cursor: 'pointer', fontWeight: 700, textDecoration: 'underline', color: '#b91c1c',
                fontSize: 12,
              }}
            >
              Upload Retinal Scan &rarr;
            </button>
            <button
              onClick={() => { if (clearUploadError) clearUploadError(); }}
              aria-label="Dismiss banner"
              style={{
                all: 'unset', cursor: 'pointer',
                width: 20, height: 20, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#fecaca', color: '#991b1b',
                fontSize: 12, fontWeight: 900, lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* ── Top Bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '10px 24px',
        background: '#ffffff', borderBottom: `1px solid ${D.border}`,
        flexShrink: 0, flexWrap: 'wrap',
      }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', boxShadow: '0 0 0 3px #dcfce7', flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: D.text }}>
          Diagnostic Results · ICDR Classification & Lesion Mapping
        </span>
        <span style={{ padding: '3px 10px', borderRadius: 6, background: '#f1f5f9', border: `1px solid ${D.border}`, fontFamily: D.mono, fontSize: 11, color: D.sub }}>
          Study ID: <strong>{studyId}</strong> · Eye: <strong style={{ color: D.primary }}>{eye.toUpperCase()}</strong>
        </span>

        {/* ── 3-Actor Persona Mode Switcher (Doctor vs ASHA & Patient) ── */}
        <div style={{
          display: 'flex',
          background: '#f1f5f9',
          border: `1px solid ${D.border}`,
          borderRadius: 8,
          padding: 2,
          gap: 2,
        }}>
          <button
            onClick={() => setActiveView('doctor')}
            style={{
              all: 'unset', cursor: 'pointer',
              padding: '5px 12px', borderRadius: 6,
              fontSize: 11.5, fontWeight: activeView === 'doctor' ? 700 : 500,
              background: activeView === 'doctor' ? '#0284c7' : 'transparent',
              color: activeView === 'doctor' ? '#ffffff' : D.sub,
              boxShadow: activeView === 'doctor' ? '0 1px 3px rgba(2,132,199,0.3)' : 'none',
              display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.12s',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4.5 3h3v5.5a4 4 0 0 0 8 0V3h3" />
              <path d="M12 12.5V17a3 3 0 0 0 6 0v-2.5" />
              <circle cx="18" cy="14" r="2" />
            </svg>
            <span>{getT(currentAppLang).doctorView}</span>
          </button>

          <button
            onClick={() => setActiveView('asha')}
            style={{
              all: 'unset', cursor: 'pointer',
              padding: '5px 12px', borderRadius: 6,
              fontSize: 11.5, fontWeight: activeView === 'asha' ? 700 : 500,
              background: activeView === 'asha' ? '#047857' : 'transparent',
              color: activeView === 'asha' ? '#ffffff' : D.sub,
              boxShadow: activeView === 'asha' ? '0 1px 3px rgba(4,120,87,0.3)' : 'none',
              display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.12s',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <polyline points="16 11 18 13 22 9" />
            </svg>
            <span>{getT(currentAppLang).ashaView}</span>
          </button>
        </div>

        <div style={{ flex: 1 }} />

        {/* Eye toggle */}
        <div style={{ display: 'flex', background: '#f1f5f9', border: `1px solid ${D.border}`, borderRadius: 8, padding: 2, gap: 2 }}>
          {['od', 'os'].map(e => (
            <button key={e} onClick={() => setSelectedEye(e)} style={{
              all: 'unset', cursor: 'pointer',
              padding: '4px 12px', borderRadius: 6,
              fontFamily: D.mono, fontSize: 11, fontWeight: 700,
              background: eye === e ? '#ffffff' : 'transparent',
              color: eye === e ? D.primary : D.muted,
              boxShadow: eye === e ? '0 1px 3px rgba(15,23,42,0.06)' : 'none',
            }}>
              {e.toUpperCase()}
            </button>
          ))}
        </div>

        <button onClick={() => setBilateral(v => !v)} style={{
          all: 'unset', cursor: 'pointer',
          padding: '5px 12px', borderRadius: 7,
          background: bilateral ? '#f5f3ff' : '#ffffff',
          border: `1px solid ${bilateral ? '#c4b5fd' : D.border}`,
          fontSize: 11, fontWeight: 600,
          color: bilateral ? '#7c3aed' : D.sub,
        }}>⊞ Bilateral</button>

        <button onClick={() => navigate?.('upload')} style={{
          all: 'unset', cursor: 'pointer',
          padding: '5px 14px', borderRadius: 7,
          background: '#ffffff', border: `1px solid ${D.border}`,
          fontSize: 12, fontWeight: 600, color: D.sub,
        }}>← New Scan</button>
      </div>

      {/* ── Patient header strip ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 20,
        padding: '12px 24px',
        background: '#ffffff',
        borderBottom: `1px solid ${D.border}`,
        boxShadow: '0 1px 2px rgba(15,23,42,0.03)',
        flexShrink: 0, flexWrap: 'wrap',
      }}>
        {/* Grade badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '6px 14px', borderRadius: 8,
          background: gradeInfo.bg, border: `1px solid ${gradeInfo.border}`,
        }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: gradeInfo.color }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: gradeInfo.color }}>{gradeInfo.shortName}</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: gradeInfo.color, opacity: 0.85 }}>ICDR LEVEL {sev}</div>
          </div>
        </div>

        {/* Patient name */}
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: D.text }}>{patName}</div>
          <div style={{ fontSize: 11, color: D.muted, marginTop: 1 }}>
            {patient?.age ? `${patient.age}Y` : '58Y'} / {patient?.gender === 'M' ? 'Male' : 'Female'} · {patient?.village || 'PHC Mandawar'}
          </div>
        </div>

        <div style={{ width: 1, height: 32, background: D.border }} />

        {/* Confidence */}
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: D.primary }}>{conf}%</div>
          <div style={{ fontSize: 10, fontWeight: 600, color: D.muted }}>AI CONFIDENCE</div>
        </div>

        {/* Lesion count */}
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#d97706' }}>{lesions.length}</div>
          <div style={{ fontSize: 10, fontWeight: 600, color: D.muted }}>LESIONS DETECTED</div>
        </div>

        {/* HbA1c */}
        {patient?.hba1c && (
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: patient.hba1c > 9 ? '#b91c1c' : '#15803d' }}>{patient.hba1c}%</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: D.muted }}>HbA1c</div>
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* Recommendation banner */}
        <div style={{
          padding: '8px 14px', borderRadius: 8,
          background: gradeInfo.bg,
          border: `1px solid ${gradeInfo.border}`,
          fontSize: 12, fontWeight: 700,
          color: gradeInfo.color,
          maxWidth: 320,
        }}>
          ⚡ {patient?.action || SEVERITY_ACTIONS[sev] || 'Clinical Review Required'}
        </div>

        {/* 3-Actor Quick Switch CTA */}
        <button
          onClick={() => setActiveView(activeView === 'doctor' ? 'asha' : 'doctor')}
          style={{
            all: 'unset', cursor: 'pointer',
            padding: '8px 16px', borderRadius: 8,
            background: activeView === 'doctor' ? '#047857' : '#0284c7',
            color: '#ffffff',
            fontSize: 12, fontWeight: 700,
            boxShadow: activeView === 'doctor' ? '0 2px 6px rgba(4,120,87,0.25)' : '0 2px 6px rgba(2,132,199,0.25)',
            display: 'flex', alignItems: 'center', gap: 7,
            transition: 'all 0.15s ease',
          }}
          title={activeView === 'doctor' ? "Switch to Patient & ASHA Spoken Counseling Hub" : "Return to Doctor Clinical Diagnostics"}
        >
          {activeView === 'doctor' ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <polyline points="16 11 18 13 22 9" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4.5 3h3v5.5a4 4 0 0 0 8 0V3h3" />
              <path d="M12 12.5V17a3 3 0 0 0 6 0v-2.5" />
              <circle cx="18" cy="14" r="2" />
            </svg>
          )}
          <span>{activeView === 'doctor' ? getT(currentAppLang).switchToAsha : getT(currentAppLang).switchToDoctor}</span>
        </button>

        {/* Queue CTA */}
        <button onClick={handleQueueClick} style={{
          all: 'unset', cursor: 'pointer',
          padding: '8px 18px', borderRadius: 8,
          background: D.primary, color: '#ffffff',
          fontSize: 12, fontWeight: 700,
          boxShadow: '0 2px 6px rgba(2,132,199,0.25)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          Review Queue →
        </button>
      </div>

      {/* ── Main Body: Conditional on Active Actor Persona ── */}
      {activeView === 'asha' ? (
        <AshaPatientCounselor
          patient={patient}
          severity={sev}
          csmeRisk={etdrsProfile.csmeRisk}
          onPrintSlip={() => navigate('referral')}
          onSwitchToDoctor={() => setActiveView('doctor')}
          currentAppLang={currentAppLang}
        />
      ) : (
        /* ── Doctor Clinical Workstation (Viewport for Doctor & Clinical Team) ── */
        <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>

        {/* ════ LEFT PANEL — Fundus viewport (ALWAYS STAYS FIXED ON LEFT) ════ */}
        <div style={{
          flex: '0 0 56%',
          maxWidth: '56%',
          height: '100%',
          maxHeight: '100%',
          minHeight: 0,
          display: 'flex', flexDirection: 'column',
          borderRight: `1px solid ${D.border}`,
          background: '#ffffff',
          position: 'sticky',
          top: 0,
          alignSelf: 'flex-start',
          overflow: 'hidden',
          zIndex: 5,
        }}>
          {/* Toolbar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 18px',
            background: '#ffffff', borderBottom: `1px solid ${D.border}`,
            flexShrink: 0, flexWrap: 'wrap',
          }}>
            <ToolBtn active={showHeatmap} onClick={() => setShowHeatmap(v => !v)} label="Grad-CAM++ Heatmap" accent />
            <div style={{ width: 1, height: 18, background: D.border }} />
            <ToolBtn active={showPins}    onClick={() => setShowPins(v => !v)}    label={`Lesion Pins (${lesions.length})`} icon="⊕" />
            <div style={{ width: 1, height: 18, background: D.border }} />
            <ToolBtn active={showRedFree} onClick={() => setShowRedFree(v => !v)} label="Red-Free (540nm)" />
            <div style={{ width: 1, height: 18, background: D.border }} />
            <button
              onClick={() => {
                const next = !showEtdrsGrid;
                setShowEtdrsGrid(next);
                if (!next) setSelectedEtdrsSector(null);
              }}
              style={{
                all: 'unset', cursor: 'pointer',
                padding: '4px 11px', borderRadius: 6,
                fontSize: 11, fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 6,
                background: showEtdrsGrid ? '#0284c7' : '#f0f9ff',
                color: showEtdrsGrid ? '#ffffff' : '#0369a1',
                border: `1px solid ${showEtdrsGrid ? '#0284c7' : '#bae6fd'}`,
                boxShadow: showEtdrsGrid ? '0 1px 3px rgba(2,132,199,0.3)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ fontSize: 12 }}>🎯</span>
              <span>ETDRS Grid</span>
              <span style={{
                background: showEtdrsGrid ? '#ffffff' : etdrsProfile.badgeColor,
                color: showEtdrsGrid ? etdrsProfile.badgeColor : '#ffffff',
                borderRadius: 8, padding: '1px 6px', fontSize: 9, fontWeight: 800,
              }}>
                {etdrsProfile.csmeRisk}
              </span>
            </button>
            <div style={{ width: 1, height: 18, background: D.border }} />
            <button
              onClick={() => {
                const next = !laserMode;
                setLaserMode(next);
                if (next) {
                  setShowHeatmap(false);
                  if (selectedLaserLesionIds.length === 0) {
                    const defaults = lesions.filter(l => l.type === 'hemorrhage' || l.type === 'hardExudate').slice(0, 3).map(l => l.id);
                    if (defaults.length > 0) setSelectedLaserLesionIds(defaults);
                  }
                }
              }}
              style={{
                all: 'unset', cursor: 'pointer',
                padding: '4px 12px', borderRadius: 6,
                fontSize: 11, fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 5,
                background: laserMode ? '#042f2e' : '#f0fdfa',
                color: laserMode ? '#2dd4bf' : '#0f766e',
                border: `1px solid ${laserMode ? '#14b8a6' : '#99f6e4'}`,
                boxShadow: laserMode ? '0 0 10px rgba(20,184,166,0.35)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ fontSize: 12 }}>⚡</span>
              <span>In-Silico Laser XAI</span>
              {selectedLaserLesionIds.length > 0 && (
                <span style={{
                  background: laserMode ? '#14b8a6' : '#0d9488',
                  color: '#ffffff', borderRadius: 10, padding: '1px 6px', fontSize: 9, fontWeight: 800,
                }}>
                  {selectedLaserLesionIds.length}
                </span>
              )}
            </button>
            <div style={{ width: 1, height: 18, background: D.border }} />
            <button
              onClick={() => setActiveView('asha')}
              style={{
                all: 'unset', cursor: 'pointer',
                padding: '4px 10px', borderRadius: 6,
                fontSize: 11, fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 6,
                background: '#ecfdf5', color: '#047857',
                border: '1px solid #a7f3d0',
                transition: 'all 0.12s ease',
              }}
              title="Open ASHA Patient Spoken Guidance & Pictograms"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <polyline points="16 11 18 13 22 9" />
              </svg>
              <span>{getT(currentAppLang).ashaView}</span>
            </button>
            <div style={{ flex: 1 }} />
            {/* Quick Zoom Pill in Toolbar */}
            <div style={{
              display: 'flex', alignItems: 'center', background: '#f8fafc',
              border: `1px solid ${D.border}`, borderRadius: 6, padding: '2px 5px', gap: 4,
            }}>
              <span style={{ fontSize: 11, color: D.muted }}>🔍</span>
              <button
                onClick={() => setZoom(z => { const n = Math.max(100, z - 25); if (n === 100) setPan({x:0, y:0}); return n; })}
                title="Zoom Out"
                style={{
                  all: 'unset', cursor: zoom <= 100 ? 'not-allowed' : 'pointer',
                  padding: '1px 6px', borderRadius: 4,
                  fontSize: 12, fontWeight: 800, color: zoom <= 100 ? D.muted : D.sub,
                  background: '#ffffff', border: `1px solid ${D.border}`, lineHeight: 1,
                }}
              >−</button>
              <span style={{
                fontFamily: D.mono, fontSize: 11, fontWeight: 800,
                color: zoom > 100 ? D.primary : D.text, minWidth: 38, textAlign: 'center',
              }}>
                {zoom}%
              </span>
              <button
                onClick={() => setZoom(z => Math.min(300, z + 25))}
                title="Zoom In"
                style={{
                  all: 'unset', cursor: zoom >= 300 ? 'not-allowed' : 'pointer',
                  padding: '1px 6px', borderRadius: 4,
                  fontSize: 12, fontWeight: 800, color: zoom >= 300 ? D.muted : D.sub,
                  background: '#ffffff', border: `1px solid ${D.border}`, lineHeight: 1,
                }}
              >+</button>
              {zoom > 100 && (
                <button
                  onClick={() => { setZoom(100); setPan({ x: 0, y: 0 }); }}
                  title="Reset Zoom to 100%"
                  style={{
                    all: 'unset', cursor: 'pointer', padding: '1px 6px', borderRadius: 4,
                    fontSize: 10, fontWeight: 700, color: '#dc2626', background: '#fee2e2',
                  }}
                >↺ 1x</button>
              )}
            </div>
            <div style={{ width: 1, height: 18, background: D.border }} />
            <span style={{ fontSize: 11, color: D.muted, fontWeight: 500 }}>FOV 45° Posterior Pole</span>
          </div>

          {/* ── ETDRS 9-Zone Protocol Control Bar (Active when ETDRS Mode toggled) ── */}
          {showEtdrsGrid && (
            <div style={{
              padding: '6px 18px',
              background: '#f0f9ff',
              borderBottom: '1px solid #bae6fd',
              display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
              animation: 'fade-up 0.2s ease both',
              fontSize: 11, color: '#0369a1',
            }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: '#e0f2fe', border: '1px solid #7dd3fc',
                padding: '2px 7px', borderRadius: 5, fontSize: 10, fontWeight: 800,
                color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.04em',
              }}>
                🎯 ETDRS 9-Zone Protocol
              </span>

              <span>
                Scale: <strong>1% ≈ 150 µm</strong> · <strong>1mm CSF</strong> (500µm) · <strong>3mm Inner</strong> · <strong>6mm Outer</strong>
              </span>

              <div style={{ flex: 1 }} />

              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '2px 8px', borderRadius: 4,
                background: etdrsProfile.badgeBg, border: `1px solid ${etdrsProfile.badgeColor}`,
                color: etdrsProfile.badgeColor, fontWeight: 700, fontSize: 10.5,
              }}>
                ● {etdrsProfile.csmeLabel}
              </span>

              {selectedEtdrsSector && (
                <button
                  onClick={() => setSelectedEtdrsSector(null)}
                  style={{
                    all: 'unset', cursor: 'pointer',
                    padding: '2px 8px', borderRadius: 4,
                    background: '#0284c7', color: '#ffffff',
                    fontSize: 10, fontWeight: 700,
                  }}
                >
                  ✕ Clear Sector ({selectedEtdrsSector})
                </button>
              )}
            </div>
          )}

          {/* ── In-Silico Laser Control Bar (Active when Laser Mode toggled) ── */}
          {laserMode && (
            <div style={{
              padding: '8px 18px',
              background: '#042f2e',
              borderBottom: '1px solid #14b8a6',
              display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
              animation: 'fade-up 0.2s ease both',
              color: '#ccfbf1',
            }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(20,184,166,0.2)', border: '1px solid #14b8a6',
                padding: '3px 9px', borderRadius: 6, fontSize: 10, fontWeight: 800,
                letterSpacing: '0.06em', color: '#2dd4bf', textTransform: 'uppercase',
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2dd4bf', animation: 'laser-pulse 1s infinite' }} />
                In-Silico Laser Surgery (XAI)
              </span>

              <span style={{ fontSize: 11, color: '#99f6e4' }}>
                Targeting: <strong>{selectedLaserLesionIds.length + laserSpots.length}</strong> site(s)
              </span>

              <div style={{ display: 'flex', gap: 5 }}>
                <button onClick={() => setSelectedLaserLesionIds(lesions.filter(l => l.type === 'hemorrhage').map(l => l.id))} style={{
                  all: 'unset', cursor: 'pointer', padding: '2px 8px', borderRadius: 4,
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)',
                  fontSize: 10, fontWeight: 600, color: '#fed7aa',
                }}>+ Hemorrhages</button>
                <button onClick={() => setSelectedLaserLesionIds(lesions.filter(l => l.type === 'hardExudate').map(l => l.id))} style={{
                  all: 'unset', cursor: 'pointer', padding: '2px 8px', borderRadius: 4,
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)',
                  fontSize: 10, fontWeight: 600, color: '#bae6fd',
                }}>+ Exudates</button>
                <button onClick={() => setSelectedLaserLesionIds(lesions.map(l => l.id))} style={{
                  all: 'unset', cursor: 'pointer', padding: '2px 8px', borderRadius: 4,
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)',
                  fontSize: 10, fontWeight: 600, color: '#fef08a',
                }}>+ All</button>
                {(selectedLaserLesionIds.length > 0 || laserSpots.length > 0) && (
                  <button onClick={() => { setSelectedLaserLesionIds([]); setLaserSpots([]); }} style={{
                    all: 'unset', cursor: 'pointer', padding: '2px 8px', borderRadius: 4,
                    background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)',
                    fontSize: 10, fontWeight: 600, color: '#fca5a5',
                  }}>Clear</button>
                )}
              </div>

              <div style={{ flex: 1 }} />

              {counterfactualError && (
                <span style={{
                  fontSize: 11, color: '#fca5a5', background: 'rgba(239,68,68,0.25)',
                  padding: '3px 9px', borderRadius: 5, border: '1px solid #ef4444',
                }}>
                  ⚠️ {counterfactualError}
                </span>
              )}

              <button
                onClick={handleFireLaser}
                disabled={isFiringLaser}
                style={{
                  all: 'unset', cursor: isFiringLaser ? 'wait' : 'pointer',
                  padding: '5px 14px', borderRadius: 6,
                  background: isFiringLaser ? '#0d9488' : 'linear-gradient(135deg, #0d9488, #059669)',
                  color: '#ffffff', fontSize: 11, fontWeight: 800,
                  boxShadow: '0 0 12px rgba(20,184,166,0.5)',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {isFiringLaser ? '⚡ Inpainting & Retesting AI...' : '⚡ Fire Laser & Retest AI'}
              </button>
            </div>
          )}

          {/* Image area — High-contrast medical viewer frame */}
          <div style={{
            flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#0a1017', position: 'relative', overflow: 'hidden', padding: 12,
          }}>
            {/* Patient overlay — top left */}
            <div style={{
              position: 'absolute', top: 14, left: 14, zIndex: 10,
              background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(6px)',
              border: `1px solid rgba(255,255,255,0.12)`, borderRadius: 7, padding: '7px 11px',
              fontFamily: D.mono, fontSize: 10, lineHeight: 1.7, color: '#e2e8f0',
            }}>
              <div><span style={{ color: '#94a3b8' }}>PATIENT: </span><strong style={{ color: '#ffffff' }}>{studyId}</strong></div>
              <div><span style={{ color: '#94a3b8' }}>EYE: </span><strong style={{ color: '#38bdf8' }}>{eye.toUpperCase()} ({eye === 'od' ? 'RIGHT' : 'LEFT'})</strong></div>
              <div><span style={{ color: '#94a3b8' }}>FOV: </span>45° POSTERIOR POLE</div>
            </div>

            {/* Tech overlay — top right */}
            <div style={{
              position: 'absolute', top: 14, right: 14, zIndex: 10,
              background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(6px)',
              border: `1px solid rgba(255,255,255,0.12)`, borderRadius: 7, padding: '7px 11px',
              fontFamily: D.mono, fontSize: 10, lineHeight: 1.7, color: '#e2e8f0', textAlign: 'right',
            }}>
              <div><span style={{ color: '#94a3b8' }}>HEATMAP: </span><strong style={{ color: showHeatmap ? '#38bdf8' : '#94a3b8' }}>{showHeatmap ? 'ON' : 'OFF'}</strong></div>
              <div><span style={{ color: '#94a3b8' }}>PINS: </span><strong style={{ color: '#ffffff' }}>{showPins ? filteredLesions.length : 0}</strong></div>
              <div><span style={{ color: '#94a3b8' }}>RES: </span>512 × 512 px</div>
            </div>

            {/* ── View Switcher Pill (Active when Counterfactual Result is computed) ── */}
            {counterfactualResult && (
              <div style={{
                position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', zIndex: 25,
                background: 'rgba(15,23,42,0.92)', backdropFilter: 'blur(8px)',
                border: '1px solid #14b8a6', borderRadius: 20, padding: '3px 6px',
                display: 'flex', alignItems: 'center', gap: 4, boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
              }}>
                {[
                  { key: 'treated', label: '✓ Treated Fundus' },
                  { key: 'cf_heatmap', label: 'Post-Laser Heatmap' },
                  { key: 'original', label: 'Baseline Scan' },
                ].map(m => (
                  <button key={m.key} onClick={() => {
                    setLaserDisplayMode(m.key);
                    if (m.key === 'cf_heatmap') setShowHeatmap(true);
                  }} style={{
                    all: 'unset', cursor: 'pointer',
                    padding: '4px 11px', borderRadius: 14, fontSize: 10, fontWeight: 700,
                    background: laserDisplayMode === m.key ? '#0d9488' : 'transparent',
                    color: laserDisplayMode === m.key ? '#ffffff' : '#94a3b8',
                    transition: 'all 0.15s',
                  }}>
                    {m.label}
                  </button>
                ))}
                <button onClick={() => {
                  setCounterfactualResult(null);
                  setLaserDisplayMode('treated');
                  setSelectedLaserLesionIds([]);
                  setLaserSpots([]);
                }} style={{
                  all: 'unset', cursor: 'pointer',
                  padding: '4px 9px', borderRadius: 14, fontSize: 10, fontWeight: 700,
                  color: '#f87171', borderLeft: '1px solid rgba(255,255,255,0.2)', marginLeft: 3,
                }}>
                  ↺ Reset
                </button>
              </div>
            )}

            {/* ── Circular fundus with lesion pins ── */}
            <div
              onWheel={handleWheelZoom}
              onMouseDown={handlePanStart}
              onMouseMove={handlePanMove}
              onMouseUp={handlePanEnd}
              onMouseLeave={handlePanEnd}
              style={{
                position: 'relative',
                width: 'min(470px, calc(100% - 24px), calc(100vh - 240px))',
                height: 'min(470px, calc(100% - 24px), calc(100vh - 240px))',
                aspectRatio: '1 / 1',
                borderRadius: '50%',
                overflow: 'hidden',
                background: '#000000',
                boxShadow: laserMode
                  ? '0 0 0 2px #14b8a6, 0 0 35px rgba(20,184,166,0.45)'
                  : '0 0 0 1px rgba(255,255,255,0.1), 0 0 50px rgba(0,0,0,0.8)',
                flexShrink: 0,
                cursor: laserMode ? 'crosshair' : (zoom > 100 ? (isPanning ? 'grabbing' : 'grab') : 'default'),
                transition: 'box-shadow 0.3s ease',
                userSelect: 'none',
              }}
            >
              {/* Inner container calibrated exactly to the fundus image's rendered aspect ratio */}
              <div
                onClick={handleCanvasClick}
                style={{
                  position: 'absolute',
                  top: `${imgBounds.top}%`,
                  left: `${imgBounds.left}%`,
                  width: `${imgBounds.width}%`,
                  height: `${imgBounds.height}%`,
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})`,
                  transformOrigin: 'center center',
                  transition: isPanning ? 'none' : 'transform 0.15s ease-out',
                }}
              >
                {imgError ? (
                  <div style={{
                    width: '100%', height: '100%',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    background: '#0f172a', color: '#94a3b8', fontSize: 12, gap: 10,
                  }}>
                    <span>Image unavailable</span>
                  </div>
                ) : (
                  <img
                    src={currentFundusPath}
                    alt={`Retina Grade ${sev}`}
                    onLoad={(e) => {
                      if (e.target.naturalWidth && e.target.naturalHeight) {
                        setImgAspect(e.target.naturalWidth / e.target.naturalHeight);
                      }
                    }}
                    onError={() => setImgError(true)}
                    style={{
                      width: '100%', height: '100%',
                      objectFit: 'fill',
                      display: 'block',
                      filter: showRedFree ? 'sepia(1) saturate(0.3) hue-rotate(90deg) contrast(1.2)' : 'none',
                    }}
                  />
                )}

                {showHeatmap && currentHeatmapPath && !heatmapError && (
                  <img src={currentHeatmapPath} alt="Grad-CAM"
                    onError={() => setHeatmapError(true)}
                    style={{
                      position: 'absolute', inset: 0,
                      width: '100%', height: '100%',
                      objectFit: 'fill',
                      pointerEvents: 'none',
                      mixBlendMode: 'multiply',
                      opacity: 0.82,
                    }}
                  />
                )}

              {/* ── ETDRS 9-Zone Macular Concentric Grid & Distance Caliper Vectors ── */}
              {showEtdrsGrid && (
                <svg
                  viewBox="0 0 100 100"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    zIndex: 22,
                  }}
                >
                  <defs>
                    <filter id="etdrs-glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="0" stdDeviation="0.4" floodColor="#38bdf8" floodOpacity="0.7"/>
                    </filter>
                  </defs>

                  {/* 1. Concentric Circles centered at foveaAnchor (moves with draggable reticle) */}
                  {/* Outer Ring: 6.0mm diameter -> radius 20.0% */}
                  <circle
                    cx={foveaAnchor.x} cy={foveaAnchor.y} r="20.0"
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth="0.45"
                    strokeOpacity="0.85"
                  />

                  {/* Inner Ring: 3.0mm diameter -> radius 10.0% */}
                  <circle
                    cx={foveaAnchor.x} cy={foveaAnchor.y} r="10.0"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="0.4"
                    strokeDasharray="1.2 0.6"
                    strokeOpacity="0.9"
                  />

                  {/* Central Subfield (CSF): 1.0mm diameter -> radius 3.333% */}
                  <circle
                    cx={foveaAnchor.x} cy={foveaAnchor.y} r="3.333"
                    fill={selectedEtdrsSector === 'CSF' ? 'rgba(56,189,248,0.28)' : 'rgba(56,189,248,0.08)'}
                    stroke="#38bdf8"
                    strokeWidth="0.38"
                    strokeDasharray="0.8 0.4"
                  />

                  {/* 2. Quadrant Dividing Lines from CSF edge to outer ring at 45°, all offsets from foveaAnchor */}
                  <line x1={foveaAnchor.x+2.36} y1={foveaAnchor.y-2.36} x2={foveaAnchor.x+14.14} y2={foveaAnchor.y-14.14} stroke="#38bdf8" strokeWidth="0.3" strokeDasharray="1 0.5" strokeOpacity="0.8" />
                  <line x1={foveaAnchor.x-2.36} y1={foveaAnchor.y-2.36} x2={foveaAnchor.x-14.14} y2={foveaAnchor.y-14.14} stroke="#38bdf8" strokeWidth="0.3" strokeDasharray="1 0.5" strokeOpacity="0.8" />
                  <line x1={foveaAnchor.x-2.36} y1={foveaAnchor.y+2.36} x2={foveaAnchor.x-14.14} y2={foveaAnchor.y+14.14} stroke="#38bdf8" strokeWidth="0.3" strokeDasharray="1 0.5" strokeOpacity="0.8" />
                  <line x1={foveaAnchor.x+2.36} y1={foveaAnchor.y+2.36} x2={foveaAnchor.x+14.14} y2={foveaAnchor.y+14.14} stroke="#38bdf8" strokeWidth="0.3" strokeDasharray="1 0.5" strokeOpacity="0.8" />

                  {/* 3. Fovea Center Reticle — draggable crosshair at foveaAnchor position */}
                  <g
                    style={{ cursor: 'crosshair' }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setIsDraggingFovea(true);
                      const svg = e.currentTarget.closest('svg');
                      const rect = svg.getBoundingClientRect();
                      const moveHandler = (me) => {
                        const nx = Math.min(100, Math.max(0, ((me.clientX - rect.left) / rect.width) * 100));
                        const ny = Math.min(100, Math.max(0, ((me.clientY - rect.top) / rect.height) * 100));
                        setFoveaAnchor({ x: Math.round(nx * 10) / 10, y: Math.round(ny * 10) / 10 });
                      };
                      const upHandler = () => {
                        setIsDraggingFovea(false);
                        window.removeEventListener('mousemove', moveHandler);
                        window.removeEventListener('mouseup', upHandler);
                      };
                      window.addEventListener('mousemove', moveHandler);
                      window.addEventListener('mouseup', upHandler);
                    }}
                  >
                    <circle
                      cx={foveaAnchor.x} cy={foveaAnchor.y} r="1.2"
                      fill={isDraggingFovea ? '#f97316' : '#38bdf8'}
                      stroke="#ffffff" strokeWidth="0.3"
                    />
                    <line x1={foveaAnchor.x - 2.5} y1={foveaAnchor.y} x2={foveaAnchor.x + 2.5} y2={foveaAnchor.y} stroke="#ffffff" strokeWidth="0.25" />
                    <line x1={foveaAnchor.x} y1={foveaAnchor.y - 2.5} x2={foveaAnchor.x} y2={foveaAnchor.y + 2.5} stroke="#ffffff" strokeWidth="0.25" />
                    <text x={foveaAnchor.x} y={foveaAnchor.y - 2.8} textAnchor="middle" fill={isDraggingFovea ? '#f97316' : '#38bdf8'} fontSize="1.1" fontWeight="800" fontFamily={D.mono}>
                      {isDraggingFovea ? `(${foveaAnchor.x.toFixed(0)}%, ${foveaAnchor.y.toFixed(0)}%)` : 'FOVEA'}
                    </text>
                  </g>

                  {/* 4. Sector Labels — positioned relative to foveaAnchor */}
                  <text x={foveaAnchor.x} y={foveaAnchor.y + 1.2} textAnchor="middle" fill="#38bdf8" fontSize="1.1" fontWeight="800" fontFamily={D.mono}>CSF</text>

                  <text x={foveaAnchor.x} y={foveaAnchor.y - 5.8} textAnchor="middle" fill={selectedEtdrsSector === 'IS' ? '#ffffff' : '#7dd3fc'} fontSize="1.05" fontWeight="700" fontFamily={D.mono}>IS</text>
                  <text x={foveaAnchor.x} y={foveaAnchor.y + 6.8} textAnchor="middle" fill={selectedEtdrsSector === 'II' ? '#ffffff' : '#7dd3fc'} fontSize="1.05" fontWeight="700" fontFamily={D.mono}>II</text>
                  <text x={eye === 'od' ? foveaAnchor.x - 6.0 : foveaAnchor.x + 6.0} y={foveaAnchor.y + 0.4} textAnchor="middle" fill={selectedEtdrsSector === (eye === 'od' ? 'IT' : 'IN') ? '#ffffff' : '#7dd3fc'} fontSize="1.0" fontWeight="700" fontFamily={D.mono}>
                    {eye === 'od' ? 'IT' : 'IN'}
                  </text>
                  <text x={eye === 'od' ? foveaAnchor.x + 6.0 : foveaAnchor.x - 6.0} y={foveaAnchor.y + 0.4} textAnchor="middle" fill={selectedEtdrsSector === (eye === 'od' ? 'IN' : 'IT') ? '#ffffff' : '#7dd3fc'} fontSize="1.0" fontWeight="700" fontFamily={D.mono}>
                    {eye === 'od' ? 'IN' : 'IT'}
                  </text>

                  <text x={foveaAnchor.x} y={foveaAnchor.y - 15.2} textAnchor="middle" fill={selectedEtdrsSector === 'OS' ? '#ffffff' : '#bae6fd'} fontSize="1.1" fontWeight="700" fontFamily={D.mono}>OS</text>
                  <text x={foveaAnchor.x} y={foveaAnchor.y + 16.2} textAnchor="middle" fill={selectedEtdrsSector === 'OI' ? '#ffffff' : '#bae6fd'} fontSize="1.1" fontWeight="700" fontFamily={D.mono}>OI</text>
                  <text x={eye === 'od' ? foveaAnchor.x - 15.5 : foveaAnchor.x + 15.5} y={foveaAnchor.y + 0.4} textAnchor="middle" fill={selectedEtdrsSector === (eye === 'od' ? 'OT' : 'ON') ? '#ffffff' : '#bae6fd'} fontSize="1.0" fontWeight="700" fontFamily={D.mono}>
                    {eye === 'od' ? 'OT' : 'ON'}
                  </text>
                  <text x={eye === 'od' ? foveaAnchor.x + 15.5 : foveaAnchor.x - 15.5} y={foveaAnchor.y + 0.4} textAnchor="middle" fill={selectedEtdrsSector === (eye === 'od' ? 'ON' : 'OT') ? '#ffffff' : '#bae6fd'} fontSize="1.0" fontWeight="700" fontFamily={D.mono}>
                    {eye === 'od' ? 'ON' : 'OT'}
                  </text>

                  {/* 5. Threat Vectors / Caliper Lines from foveaAnchor to lesions */}
                  {activeLesions.filter(l => l.distUm <= 3000).map(l => {
                    const isCsf = l.distUm <= 500;
                    const isInner = l.distUm <= 1500;
                    const color = isCsf ? '#ef4444' : (isInner ? '#f97316' : '#38bdf8');
                    const midX = (foveaAnchor.x + l.x) / 2;
                    const midY = (foveaAnchor.y + l.y) / 2;

                    return (
                      <g key={`etdrs-threat-${l.id}`}>
                        <line
                          x1={foveaAnchor.x} y1={foveaAnchor.y} x2={l.x} y2={l.y}
                          stroke={color}
                          strokeWidth={isCsf ? "0.38" : "0.26"}
                          strokeDasharray="0.8 0.4"
                          strokeOpacity={isCsf ? "0.95" : "0.75"}
                        />
                        <circle
                          cx={l.x} cy={l.y} r={isCsf ? "2.0" : "1.5"}
                          fill="none"
                          stroke={color}
                          strokeWidth="0.25"
                          strokeDasharray="0.6 0.3"
                        />
                        {(isCsf || isInner || hoveredId === l.id) && (
                          <g>
                            <rect
                              x={midX - (isCsf ? 5.5 : 3.8)}
                              y={midY - 1.6}
                              width={isCsf ? 11 : 7.6}
                              height="3.2"
                              rx="0.8"
                              fill="#0f172a"
                              stroke={color}
                              strokeWidth="0.2"
                              opacity="0.9"
                            />
                            <text
                              x={midX}
                              y={midY + 0.6}
                              textAnchor="middle"
                              fill={color}
                              fontSize="1.3"
                              fontWeight="800"
                              fontFamily={D.mono}
                            >
                              {Math.round(l.distUm)}µm
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </svg>
              )}

              {/* Freehand laser spots */}
              {laserSpots.map((spot, sidx) => (
                <div key={`spot-${sidx}`} style={{
                  position: 'absolute', left: `${spot.x}%`, top: `${spot.y}%`,
                  width: 22, height: 22, borderRadius: '50%',
                  border: '1.5px solid #2dd4bf', background: 'rgba(45,212,191,0.25)',
                  boxShadow: '0 0 10px #14b8a6',
                  transform: 'translate(-50%,-50%)', pointerEvents: 'none', zIndex: 35,
                  animation: 'laser-pulse 1.2s infinite',
                }}>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', width: 4, height: 4, borderRadius: '50%', background: '#ffffff', transform: 'translate(-50%,-50%)' }} />
                </div>
              ))}

              {/* Empty state badge */}
              {showPins && lesions.length === 0 && (
                <div style={{
                  position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
                  background: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(6px)',
                  border: '1px solid #16a34a', borderRadius: 20,
                  padding: '6px 16px', fontSize: 11, fontWeight: 700,
                  color: '#4ade80', pointerEvents: 'none', zIndex: 15,
                }}>
                  ✓ No pathological lesions detected
                </div>
              )}

              {/* Pins */}
              {showPins && filteredLesions.map((lesion, idx) => {
                const lt    = lesion.lt;
                const isHov = hoveredId === lesion.id;
                const shouldPulse = isHov || idx < 20;
                const isTargeted = selectedLaserLesionIds.includes(lesion.id);

                return (
                  <div key={lesion.id}
                    style={{ position: 'absolute', left: `${lesion.x}%`, top: `${lesion.y}%`, zIndex: isTargeted ? 40 : (isHov ? 30 : 10) }}
                    onMouseEnter={() => setHoveredId(lesion.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (laserMode) {
                        setSelectedLaserLesionIds(prev =>
                          prev.includes(lesion.id) ? prev.filter(id => id !== lesion.id) : [...prev, lesion.id]
                        );
                      }
                    }}
                  >
                    {/* Laser Target Aiming Reticle */}
                    {isTargeted && (
                      <div style={{
                        position: 'absolute', width: 26, height: 26, borderRadius: '50%',
                        border: '1.5px dashed #2dd4bf',
                        boxShadow: '0 0 10px #14b8a6, inset 0 0 6px rgba(45,212,191,0.4)',
                        animation: 'laser-spin 4s linear infinite',
                        transform: 'translate(-50%,-50%)', pointerEvents: 'none',
                      }}>
                        <div style={{ position: 'absolute', top: -3, left: '50%', transform: 'translateX(-50%)', width: 1.5, height: 5, background: '#2dd4bf' }} />
                        <div style={{ position: 'absolute', bottom: -3, left: '50%', transform: 'translateX(-50%)', width: 1.5, height: 5, background: '#2dd4bf' }} />
                        <div style={{ position: 'absolute', left: -3, top: '50%', transform: 'translateY(-50%)', width: 5, height: 1.5, background: '#2dd4bf' }} />
                        <div style={{ position: 'absolute', right: -3, top: '50%', transform: 'translateY(-50%)', width: 5, height: 1.5, background: '#2dd4bf' }} />
                      </div>
                    )}

                    {shouldPulse && !isTargeted && (
                      <div style={{
                        position: 'absolute', width: 20, height: 20, borderRadius: '50%',
                        border: `1.5px solid ${lt.color}`,
                        animation: isHov ? `pin-pulse 1s infinite` : `pin-pulse 2s ${idx * 0.1}s infinite`,
                        transform: 'translate(-50%,-50%)', pointerEvents: 'none',
                      }} />
                    )}
                    <div style={{
                      width: isTargeted ? 16 : (isHov ? 16 : 9), height: isTargeted ? 16 : (isHov ? 16 : 9),
                      borderRadius: '50%',
                      background: isTargeted ? '#042f2e' : lt.color,
                      border: isTargeted ? '1.5px solid #2dd4bf' : `1.5px solid #ffffff`,
                      boxShadow: isTargeted ? '0 0 10px #14b8a6' : `0 0 ${isHov ? 10 : 3}px ${lt.color}`,
                      transform: 'translate(-50%,-50%)',
                      transition: 'all 0.12s',
                      cursor: laserMode ? 'crosshair' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {isTargeted ? (
                        <span style={{ fontSize: 8, fontWeight: 900, color: '#2dd4bf', fontFamily: D.mono }}>⚡</span>
                      ) : (
                        isHov && <span style={{ fontSize: 7, fontWeight: 900, color: '#fff', fontFamily: D.mono }}>{lesion.id}</span>
                      )}
                    </div>

                    {/* Tooltip */}
                    {isHov && (
                      <div style={{
                        position: 'absolute', bottom: '100%', left: '50%',
                        transform: 'translateX(-50%) translateY(-8px)',
                        background: '#ffffff',
                        border: `1.5px solid ${isTargeted ? '#14b8a6' : lt.color}`,
                        borderRadius: 8, padding: '8px 12px',
                        whiteSpace: 'nowrap', zIndex: 50, pointerEvents: 'none',
                        boxShadow: '0 4px 14px rgba(15,23,42,0.15)',
                        color: D.text,
                      }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: isTargeted ? '#0d9488' : lt.color, marginBottom: 2 }}>
                          #{lesion.id} {lt.label} {isTargeted && '⚡ [TARGETED]'}
                        </div>
                        <div style={{ fontSize: 10, color: D.sub }}>
                          {lesion.confidence != null && <>Conf: <strong style={{ color: D.text }}>{lesion.confidence}%</strong>&nbsp;&nbsp;</>}
                          {lesion.area_px != null && <>Area: <strong style={{ color: D.text }}>{lesion.area_px} px²</strong></>}
                        </div>
                        <div style={{ fontSize: 10, color: D.muted, marginTop: 1 }}>
                          Region: {getLesionRegion(lesion.x, lesion.y)}
                        </div>
                        {laserMode && (
                          <div style={{ fontSize: 9, color: '#0d9488', fontWeight: 700, marginTop: 3 }}>
                            {isTargeted ? 'Click to remove laser target' : 'Click to target with laser'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              </div>
            </div>

            {/* ── Doctor's Clinical Optical Zoom HUD Bar ── */}
            <div style={{
              position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(15,23,42,0.92)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.18)', borderRadius: 24,
              padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
              zIndex: 25, userSelect: 'none',
            }}>
              <span style={{ fontSize: 11, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>🔍</span>
                <span style={{ fontFamily: D.mono, fontWeight: 700, fontSize: 10, color: '#94a3b8' }}>ZOOM</span>
              </span>

              {/* Minus button */}
              <button
                onClick={() => setZoom(z => { const n = Math.max(100, z - 25); if (n === 100) setPan({x:0, y:0}); return n; })}
                disabled={zoom <= 100}
                title="Zoom Out (or scroll down)"
                style={{
                  all: 'unset', cursor: zoom <= 100 ? 'not-allowed' : 'pointer',
                  width: 22, height: 22, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)', color: zoom <= 100 ? '#64748b' : '#ffffff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 800, lineHeight: 1,
                  transition: 'all 0.1s',
                }}
              >−</button>

              {/* Current Zoom Readout */}
              <span style={{
                fontFamily: D.mono, fontSize: 11, fontWeight: 800,
                color: zoom > 100 ? '#38bdf8' : '#ffffff',
                minWidth: 40, textAlign: 'center',
              }}>
                {zoom}%
              </span>

              {/* Plus button */}
              <button
                onClick={() => setZoom(z => Math.min(300, z + 25))}
                disabled={zoom >= 300}
                title="Zoom In (or scroll up)"
                style={{
                  all: 'unset', cursor: zoom >= 300 ? 'not-allowed' : 'pointer',
                  width: 22, height: 22, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)', color: zoom >= 300 ? '#64748b' : '#ffffff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 800, lineHeight: 1,
                  transition: 'all 0.1s',
                }}
              >+</button>

              <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.2)' }} />

              {/* Quick Presets */}
              {[
                { label: '1x', val: 100 },
                { label: '1.5x', val: 150 },
                { label: '2x', val: 200 },
                { label: '2.5x', val: 250 },
              ].map(p => (
                <button
                  key={p.val}
                  onClick={() => {
                    setZoom(p.val);
                    if (p.val === 100) setPan({ x: 0, y: 0 });
                  }}
                  style={{
                    all: 'unset', cursor: 'pointer',
                    padding: '2px 7px', borderRadius: 12,
                    fontSize: 10, fontWeight: 700, fontFamily: D.mono,
                    background: zoom === p.val ? '#0284c7' : 'rgba(255,255,255,0.06)',
                    color: zoom === p.val ? '#ffffff' : '#cbd5e1',
                    border: `1px solid ${zoom === p.val ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`,
                    transition: 'all 0.12s',
                  }}
                >
                  {p.label}
                </button>
              ))}

              {/* Reset Button when Zoomed in */}
              {zoom > 100 && (
                <button
                  onClick={() => { setZoom(100); setPan({ x: 0, y: 0 }); }}
                  title="Reset Zoom to 1x and re-center"
                  style={{
                    all: 'unset', cursor: 'pointer',
                    padding: '2px 8px', borderRadius: 12,
                    fontSize: 10, fontWeight: 700, fontFamily: D.mono,
                    background: 'rgba(239,68,68,0.2)', color: '#fca5a5',
                    border: '1px solid rgba(239,68,68,0.4)',
                    marginLeft: 2,
                  }}
                >
                  ↺ Reset
                </button>
              )}

              {zoom > 100 && (
                <span style={{ fontSize: 9.5, color: '#94a3b8', marginLeft: 4, fontFamily: D.mono }}>
                  • Drag to Pan
                </span>
              )}
            </div>

            {/* Quadrant radar */}
            <div style={{
              position: 'absolute', bottom: 14, right: 14,
              background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(6px)',
              border: `1px solid rgba(255,255,255,0.12)`,
              borderRadius: 8, padding: '7px 11px',
              fontFamily: D.mono, fontSize: 10, zIndex: 20,
            }}>
              <div style={{ fontSize: 9, color: '#94a3b8', letterSpacing: '0.06em', marginBottom: 5, textAlign: 'center' }}>QUADRANTS</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 12px', textAlign: 'center' }}>
                {[['ST', quadCounts.ST], ['SN', quadCounts.SN], ['IT', quadCounts.IT], ['IN', quadCounts.IN]].map(([q, c]) => (
                  <div key={q}><span style={{ color: '#94a3b8' }}>{q}: </span><strong style={{ color: '#38bdf8' }}>{c}</strong></div>
                ))}
              </div>
            </div>
          </div>

          {/* Legend strip */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
            padding: '8px 18px',
            background: '#ffffff', borderTop: `1px solid ${D.border}`,
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: D.sub }}>Markers:</span>
            {LEGEND_TYPES.map(t => (
              <span key={t.type} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: D.text, fontWeight: 500 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.color, display: 'inline-block' }} />
                {t.label}
              </span>
            ))}
            {showHeatmap && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: D.sub, marginLeft: 6, paddingLeft: 10, borderLeft: `1px solid ${D.border}` }}>
                <span>Saliency:</span>
                <span style={{ fontSize: 10, color: '#64748b' }}>Cold (0)</span>
                <div style={{ width: 55, height: 8, borderRadius: 4, background: 'linear-gradient(to right, #0000ff, #00ffff, #00ff00, #ffff00, #ff0000)', boxShadow: 'inset 0 0 1px rgba(0,0,0,0.3)' }} />
                <span style={{ fontSize: 10, color: '#dc2626', fontWeight: 700 }}>Hot (1.0)</span>
              </div>
            )}
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 11, color: D.muted }}>512×512 Standard</span>
          </div>
        </div>

        {/* ════ RIGHT PANEL — Probability + Findings (INDEPENDENTLY SCROLLABLE) ════ */}
        <div style={{
          flex: 1, minWidth: 0, minHeight: 0, height: '100%',
          display: 'flex', flexDirection: 'column', background: '#ffffff', overflow: 'hidden',
        }}>

          {/* In-Silico Counterfactual Causal Report (When computed) */}
          {counterfactualResult && (
            <div style={{
              margin: '14px 22px 0',
              background: '#f0fdfa',
              border: '1px solid #14b8a6',
              borderRadius: 10,
              padding: '12px 16px',
              boxShadow: '0 4px 14px rgba(20,184,166,0.12)',
              animation: 'fade-up 0.25s ease both',
              flexShrink: 0,
            }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13 }}>⚡</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#0f766e', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    In-Silico Causal Counterfactual Report
                  </span>
                </div>
                <span style={{
                  background: '#ccfbf1', color: '#0f766e', border: '1px solid #5eead4',
                  fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                }}>
                  {counterfactualResult.causal_metrics?.causal_strength || 'Causal Grounding Confirmed'}
                </span>
              </div>

              {/* Big Grade Comparison */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 10,
                background: '#ffffff', border: '1px solid #ccfbf1', borderRadius: 8, padding: '9px 12px',
                marginBottom: 8,
              }}>
                <div>
                  <div style={{ fontSize: 9, color: D.muted, fontWeight: 700, textTransform: 'uppercase' }}>Baseline Scan</div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#c2410c' }}>
                    {counterfactualResult.original.label}
                  </div>
                  <div style={{ fontSize: 10, fontFamily: D.mono, color: D.sub }}>
                    Conf: {counterfactualResult.original.confidence}%
                  </div>
                </div>

                <div style={{ textAlign: 'center', color: '#0d9488', fontSize: 16, fontWeight: 900 }}>
                  ➔
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 9, color: '#0d9488', fontWeight: 700, textTransform: 'uppercase' }}>Post-Laser State</div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#047857' }}>
                    {counterfactualResult.counterfactual.label}
                  </div>
                  <div style={{ fontSize: 10, fontFamily: D.mono, color: '#0f766e' }}>
                    Conf: {counterfactualResult.counterfactual.confidence}%
                  </div>
                </div>
              </div>

              {/* Metric Badges */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                <div style={{
                  background: '#ffffff', border: '1px solid #99f6e4', borderRadius: 5, padding: '3px 8px',
                  display: 'flex', alignItems: 'center', gap: 5, fontSize: 10,
                }}>
                  <span style={{ color: D.muted }}>Probability Delta:</span>
                  <strong style={{ color: counterfactualResult.causal_metrics.probability_delta_pct <= 0 ? '#15803d' : '#b45309', fontFamily: D.mono }}>
                    {counterfactualResult.causal_metrics.probability_delta_pct > 0 ? `+${counterfactualResult.causal_metrics.probability_delta_pct}` : counterfactualResult.causal_metrics.probability_delta_pct}%
                  </strong>
                </div>
                <div style={{
                  background: '#ffffff', border: '1px solid #99f6e4', borderRadius: 5, padding: '3px 8px',
                  display: 'flex', alignItems: 'center', gap: 5, fontSize: 10,
                }}>
                  <span style={{ color: D.muted }}>Causal Score:</span>
                  <strong style={{ color: '#0d9488', fontFamily: D.mono }}>
                    {counterfactualResult.causal_metrics.causal_attribution_score}%
                  </strong>
                </div>
                <div style={{
                  background: '#ffffff', border: '1px solid #99f6e4', borderRadius: 5, padding: '3px 8px',
                  display: 'flex', alignItems: 'center', gap: 5, fontSize: 10,
                }}>
                  <span style={{ color: D.muted }}>Ablated Sites:</span>
                  <strong style={{ color: '#0f766e', fontFamily: D.mono }}>
                    {counterfactualResult.causal_metrics.ablated_count}
                  </strong>
                </div>
              </div>

              {/* Clinical Verdict */}
              <div style={{
                fontSize: 10.5, color: '#134e4a', lineHeight: 1.45,
                background: 'rgba(204,251,241,0.6)', borderLeft: '3px solid #0d9488',
                padding: '6px 10px', borderRadius: '0 6px 6px 0',
              }}>
                <strong>Diagnostic Insight:</strong> {counterfactualResult.causal_metrics.clinical_verdict}
              </div>
            </div>
          )}

          {/* ── ETDRS 9-Zone Macular & CSME Risk Report Card ── */}
          <div style={{
            margin: '14px 22px 0',
            background: '#ffffff',
            border: `1px solid ${etdrsProfile.csmeRisk === 'HIGH' ? '#fca5a5' : etdrsProfile.csmeRisk === 'MODERATE' ? '#fed7aa' : etdrsProfile.csmeRisk === 'BORDERLINE' ? '#fde68a' : '#bbf7d0'}`,
            borderRadius: 10,
            padding: '12px 16px',
            boxShadow: '0 2px 10px rgba(15,23,42,0.06)',
            animation: 'fade-up 0.25s ease both',
            flexShrink: 0,
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ fontSize: 14 }}>🎯</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: D.text, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    ETDRS 9-Zone Macular & CSME Profiler
                  </div>
                  <div style={{ fontSize: 9.5, color: D.muted }}>
                    Gold-Standard Clinical Protocol · Automated Macular Risk Stratification
                  </div>
                </div>
              </div>
              <span style={{
                background: etdrsProfile.badgeBg,
                color: etdrsProfile.badgeColor,
                border: `1px solid ${etdrsProfile.badgeColor}`,
                fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 5,
                display: 'inline-flex', alignItems: 'center', gap: 5,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: etdrsProfile.badgeColor }} />
                {etdrsProfile.csmeLabel}
              </span>
            </div>

            {/* 4 Metric Summary Tiles */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 7,
              marginBottom: 10,
            }}>
              <div style={{ background: '#f8fafc', border: `1px solid ${D.border}`, borderRadius: 6, padding: '5px 8px' }}>
                <div style={{ fontSize: 9, color: D.muted, fontWeight: 700, textTransform: 'uppercase' }}>Closest Exudate</div>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: etdrsProfile.closestExudateDist && etdrsProfile.closestExudateDist <= 500 ? '#dc2626' : etdrsProfile.closestExudateDist && etdrsProfile.closestExudateDist <= 1500 ? '#ea580c' : D.text, fontFamily: D.mono }}>
                  {etdrsProfile.closestExudateDist != null ? `${Math.round(etdrsProfile.closestExudateDist)} µm` : 'None in 6mm'}
                </div>
                <div style={{ fontSize: 8.5, color: D.sub }}>{etdrsProfile.closestExudateDist && etdrsProfile.closestExudateDist <= 500 ? '⚠️ In CSF (<500µm)' : '< 500µm threshold'}</div>
              </div>

              <div style={{ background: '#f8fafc', border: `1px solid ${D.border}`, borderRadius: 6, padding: '5px 8px' }}>
                <div style={{ fontSize: 9, color: D.muted, fontWeight: 700, textTransform: 'uppercase' }}>Central Subfield (1mm)</div>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: etdrsProfile.exudatesInCsf > 0 ? '#dc2626' : D.text, fontFamily: D.mono }}>
                  {etdrsProfile.exudatesInCsf} EX <span style={{ fontSize: 9.5, color: D.muted, fontWeight: 500 }}>({etdrsProfile.sectorCounts.CSF.total} tot)</span>
                </div>
                <div style={{ fontSize: 8.5, color: D.sub }}>Foveal center</div>
              </div>

              <div style={{ background: '#f8fafc', border: `1px solid ${D.border}`, borderRadius: 6, padding: '5px 8px' }}>
                <div style={{ fontSize: 9, color: D.muted, fontWeight: 700, textTransform: 'uppercase' }}>Inner Ring (3mm)</div>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: etdrsProfile.exudatesInInner > 0 ? '#ea580c' : D.text, fontFamily: D.mono }}>
                  {etdrsProfile.exudatesInInner} EX <span style={{ fontSize: 9.5, color: D.muted, fontWeight: 500 }}>({['IS','IN','II','IT'].reduce((s,k)=>s+etdrsProfile.sectorCounts[k].total, 0)} tot)</span>
                </div>
                <div style={{ fontSize: 8.5, color: D.sub }}>500–1500 µm radius</div>
              </div>

              <div style={{ background: '#f8fafc', border: `1px solid ${D.border}`, borderRadius: 6, padding: '5px 8px' }}>
                <div style={{ fontSize: 9, color: D.muted, fontWeight: 700, textTransform: 'uppercase' }}>Macular Total</div>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: D.text, fontFamily: D.mono }}>
                  {etdrsProfile.macularTotal} <span style={{ fontSize: 9.5, color: D.muted, fontWeight: 500 }}>lesions</span>
                </div>
                <div style={{ fontSize: 8.5, color: D.sub }}>Inside 6.0mm grid</div>
              </div>
            </div>

            {/* Interactive Anatomical Grid + Clinical Protocol Box */}
            <div style={{ display: 'grid', gridTemplateColumns: '145px 1fr', gap: 10, alignItems: 'stretch' }}>
              {/* 3x3 Anatomical Matrix */}
              <div>
                <div style={{ fontSize: 9, color: D.muted, fontWeight: 700, textTransform: 'uppercase', marginBottom: 3, display: 'flex', justifyContent: 'space-between' }}>
                  <span>9-Zone Grid ({eye.toUpperCase()})</span>
                  {selectedEtdrsSector && (
                    <span onClick={() => setSelectedEtdrsSector(null)} style={{ cursor: 'pointer', color: D.primary }}>Reset</span>
                  )}
                </div>
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3,
                  background: '#f1f5f9', padding: 4, borderRadius: 6, border: `1px solid ${D.border}`,
                }}>
                  {[
                    // Row 1: OS, IS, ON (or OT if OS)
                    { code: 'OS', label: 'OS' },
                    { code: 'IS', label: 'IS' },
                    { code: eye === 'od' ? 'ON' : 'OT', label: eye === 'od' ? 'ON' : 'OT' },
                    // Row 2: OT, CSF, IN (or ON/IT if OS)
                    { code: eye === 'od' ? 'OT' : 'ON', label: eye === 'od' ? 'OT' : 'ON' },
                    { code: 'CSF', label: 'CSF' },
                    { code: eye === 'od' ? 'IN' : 'IT', label: eye === 'od' ? 'IN' : 'IT' },
                    // Row 3: OI, II, Peripheral
                    { code: 'OI', label: 'OI' },
                    { code: 'II', label: 'II' },
                    { code: 'Peripheral', label: 'PERI' },
                  ].map(sec => {
                    const cnt = etdrsProfile.sectorCounts[sec.code]?.total || 0;
                    const exCnt = etdrsProfile.sectorCounts[sec.code]?.exudate || 0;
                    const isSel = selectedEtdrsSector === sec.code;
                    const hasThreat = exCnt > 0 && (sec.code === 'CSF' || sec.code.startsWith('I'));

                    return (
                      <button
                        key={sec.code}
                        onClick={() => setSelectedEtdrsSector(isSel ? null : sec.code)}
                        style={{
                          all: 'unset', cursor: 'pointer',
                          padding: '4px 2px', borderRadius: 4, textAlign: 'center',
                          background: isSel ? '#0284c7' : hasThreat ? '#fee2e2' : cnt > 0 ? '#ffffff' : 'rgba(255,255,255,0.6)',
                          border: `1px solid ${isSel ? '#0284c7' : hasThreat ? '#fca5a5' : cnt > 0 ? '#cbd5e1' : '#e2e8f0'}`,
                          color: isSel ? '#ffffff' : hasThreat ? '#b91c1c' : D.text,
                          transition: 'all 0.12s',
                        }}
                        title={`Sector ${sec.code}: ${cnt} lesions (${exCnt} exudates)`}
                      >
                        <div style={{ fontSize: 9.5, fontWeight: 800, fontFamily: D.mono }}>{sec.label}</div>
                        <div style={{ fontSize: 8.5, fontWeight: 600, color: isSel ? '#e0f2fe' : hasThreat ? '#dc2626' : D.muted }}>
                          {cnt}{exCnt > 0 ? ` (${exCnt}EX)` : ''}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Protocol & Triage Box */}
              <div style={{
                background: '#f8fafc', border: `1px solid ${D.border}`,
                borderRadius: 6, padding: '8px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontSize: 10.5, color: D.text, lineHeight: 1.45 }}>
                    <strong>Protocol:</strong> {etdrsProfile.protocol}
                  </div>
                  {counterfactualResult && (
                    <div style={{
                      marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 4,
                      background: '#ccfbf1', color: '#0f766e', border: '1px solid #5eead4',
                      padding: '2px 6px', borderRadius: 4, fontSize: 9.5, fontWeight: 700,
                    }}>
                      ⚡ In-Silico Laser Recalibration Active
                    </div>
                  )}
                </div>

                <div style={{
                  marginTop: 6, paddingTop: 5, borderTop: `1px solid ${D.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10,
                }}>
                  <span style={{ color: D.muted, fontWeight: 600 }}>Triage Urgency:</span>
                  <strong style={{ color: etdrsProfile.badgeColor }}>{etdrsProfile.triage}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Probability distribution */}
          <div style={{ padding: '14px 22px 12px', borderBottom: `1px solid ${D.border}`, flexShrink: 0, background: '#f8fafc' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: D.text, letterSpacing: '0.02em' }}>
                ICDR ORDINAL SEVERITY PROBABILITIES
              </span>
              <span style={{ fontSize: 10, fontWeight: 600, color: D.primary, background: '#e0f2fe', padding: '2px 8px', borderRadius: 4, border: '1px solid #bae6fd' }}>
                Calibrated Softmax
              </span>
            </div>
            {GRADE_LABELS.map(g => {
              const prob   = probs[g.key] || 0;
              const isPred = g.key === sev;
              const cfProb = counterfactualResult ? Math.round((counterfactualResult.counterfactual.probs[g.key] || 0) * 100) : null;
              const isCfPred = counterfactualResult?.counterfactual?.severity === g.key;

              return (
                <div key={g.key} style={{ marginBottom: counterfactualResult ? 8 : 7 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                      background: isPred ? g.color : '#cbd5e1',
                    }} />
                    <span style={{ fontSize: 12, minWidth: 160, color: (isPred || isCfPred) ? D.text : D.sub, fontWeight: (isPred || isCfPred) ? 700 : 500 }}>
                      {g.name}
                    </span>
                    <div style={{ flex: 1, height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${prob}%`,
                        background: isPred ? g.color : '#94a3b8',
                        borderRadius: 3,
                        animation: 'bar-grow 0.6s ease both',
                      }} />
                    </div>
                    <span style={{ fontFamily: D.mono, fontSize: 11, minWidth: 36, textAlign: 'right', color: isPred ? g.color : D.muted, fontWeight: isPred ? 800 : 500 }}>
                      {prob}%
                    </span>
                  </div>

                  {/* Dual comparison bar when counterfactual result is present */}
                  {counterfactualResult && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 18, marginTop: 2 }}>
                      <span style={{ fontSize: 10, color: '#0d9488', minWidth: 152, fontWeight: 700, fontFamily: D.mono }}>
                        ↳ Laser Post-Test
                      </span>
                      <div style={{ flex: 1, height: 5, background: '#ccfbf1', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${cfProb}%`,
                          background: isCfPred ? '#0d9488' : '#5eead4',
                          borderRadius: 3,
                          transition: 'width 0.4s ease',
                        }} />
                      </div>
                      <span style={{ fontFamily: D.mono, fontSize: 10, minWidth: 36, textAlign: 'right', color: isCfPred ? '#0d9488' : '#64748b', fontWeight: isCfPred ? 800 : 500 }}>
                        {cfProb}%
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Indexed findings (Constrained Flex Child) */}
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 22px 8px', borderBottom: `1px solid ${D.border}`, flexShrink: 0, flexWrap: 'wrap', gap: 8,
              background: '#ffffff',
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: D.text }}>
                INDEXED PATHOLOGICAL FINDINGS ({filteredLesions.length}{filteredLesions.length !== lesions.length ? ` of ${lesions.length}` : ''})
              </span>
              
              {/* Category Filter Pills */}
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {[
                  { key: 'all', label: `All (${typeCounts.all})` },
                  ...(typeCounts.microaneurysm > 0 ? [{ key: 'microaneurysm', label: `MA (${typeCounts.microaneurysm})` }] : []),
                  ...(typeCounts.hemorrhage > 0 ? [{ key: 'hemorrhage', label: `HE (${typeCounts.hemorrhage})` }] : []),
                  ...(typeCounts.hardExudate > 0 ? [{ key: 'hardExudate', label: `EX (${typeCounts.hardExudate})` }] : []),
                ].map(pill => (
                  <button
                    key={pill.key}
                    onClick={() => setFilterType(pill.key)}
                    style={{
                      all: 'unset', cursor: 'pointer',
                      padding: '3px 9px', borderRadius: 6,
                      fontSize: 11, fontWeight: 600,
                      background: filterType === pill.key ? '#0284c7' : '#f1f5f9',
                      border: `1px solid ${filterType === pill.key ? '#0284c7' : '#e2e8f0'}`,
                      color: filterType === pill.key ? '#ffffff' : D.sub,
                      transition: 'all 0.12s',
                    }}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional lesion summary strip */}
            {lesionSummary && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '7px 22px',
                background: '#f8fafc', borderBottom: `1px solid ${D.border}`,
                fontSize: 11, color: D.sub, flexWrap: 'wrap', flexShrink: 0,
              }}>
                {lesionSummary.microaneurysm_count != null && (
                  <span>Microaneurysms: <strong style={{ color: '#dc2626' }}>{lesionSummary.microaneurysm_count}</strong></span>
                )}
                {lesionSummary.hemorrhage_count != null && (
                  <span>Hemorrhages: <strong style={{ color: '#ea580c' }}>{lesionSummary.hemorrhage_count}</strong></span>
                )}
                {(lesionSummary.exudate_count != null || lesionSummary.hard_exudate_count != null) && (
                  <span>Hard Exudates: <strong style={{ color: '#0284c7' }}>{lesionSummary.exudate_count ?? lesionSummary.hard_exudate_count}</strong></span>
                )}
                {lesionSummary.total_lesion_area_px != null && (
                  <span>Total Area: <strong style={{ color: D.text }}>{lesionSummary.total_lesion_area_px} px²</strong></span>
                )}
              </div>
            )}

            {/* Column headers */}
            <div style={{
              display: 'grid', gridTemplateColumns: '32px 140px 1fr 75px 55px',
              padding: '7px 22px', borderBottom: `1px solid ${D.border}`, flexShrink: 0,
              background: '#f1f5f9', fontSize: 10, fontWeight: 700, color: D.muted, letterSpacing: '0.04em', textTransform: 'uppercase',
            }}>
              <span>#</span>
              <span>Finding</span>
              <span>Region</span>
              <span>Area</span>
              <span style={{ textAlign: 'right' }}>Conf</span>
            </div>

            {/* Dedicated Scrollable Rows Container (Independent Scrolling) */}
            <div style={{
              flex: 1, minHeight: 0, overflowY: 'auto', padding: '2px 0',
              scrollbarWidth: 'thin',
            }}>
              {filteredLesions.length === 0 && (
                <div style={{ padding: '36px 20px', textAlign: 'center', fontSize: 13, color: D.muted }}>
                  {lesions.length === 0 ? '✓ No pathological lesions detected — healthy retina' : 'No lesions matching selected filter'}
                </div>
              )}
              {filteredLesions.map(lesion => {
                const lt    = lesion.lt;
                const region = getLesionRegion(lesion.x, lesion.y);
                const isHov  = hoveredId === lesion.id;
                return (
                  <div key={lesion.id}
                    onMouseEnter={() => setHoveredId(lesion.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={{
                      display: 'grid', gridTemplateColumns: '32px 140px 1fr 75px 55px',
                      padding: '8px 22px', alignItems: 'center',
                      background: isHov ? '#f0f9ff' : '#ffffff',
                      borderLeft: isHov ? `3px solid ${D.primary}` : '3px solid transparent',
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'all 0.12s', cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontFamily: D.mono, fontSize: 11, color: D.muted }}>#{lesion.id}</span>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '2px 8px', borderRadius: 4,
                      background: lt.color === '#ef4444' || lt.color === '#dc2626' ? '#fee2e2' : lt.color === '#f97316' || lt.color === '#ea580c' ? '#ffedd5' : '#e0f2fe',
                      border: `1px solid ${lt.color === '#ef4444' || lt.color === '#dc2626' ? '#fecaca' : lt.color === '#f97316' || lt.color === '#ea580c' ? '#fed7aa' : '#bae6fd'}`,
                      fontSize: 11, fontWeight: 700,
                      color: lt.color === '#ef4444' || lt.color === '#dc2626' ? '#b91c1c' : lt.color === '#f97316' || lt.color === '#ea580c' ? '#c2410c' : '#0284c7',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {lt.symbol} {lt.label}
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 12, color: D.text, fontWeight: 500 }}>{region}</span>
                        {lesion.etdrsSector && (
                          <span style={{
                            fontFamily: D.mono, fontSize: 9.5, fontWeight: 700,
                            padding: '1px 5px', borderRadius: 3,
                            background: lesion.etdrsSector === 'CSF' ? '#fee2e2' : lesion.etdrsSector.startsWith('I') ? '#ffedd5' : '#f1f5f9',
                            color: lesion.etdrsSector === 'CSF' ? '#dc2626' : lesion.etdrsSector.startsWith('I') ? '#c2410c' : D.sub,
                            border: `1px solid ${lesion.etdrsSector === 'CSF' ? '#fca5a5' : lesion.etdrsSector.startsWith('I') ? '#fed7aa' : '#e2e8f0'}`,
                          }}>
                            {lesion.etdrsSector}
                          </span>
                        )}
                      </div>
                      {lesion.distUm != null && (
                        <div style={{ fontSize: 9.5, color: lesion.isCsmeThreat ? '#dc2626' : D.muted, fontFamily: D.mono }}>
                          {Math.round(lesion.distUm)} µm {lesion.isCsmeThreat ? '⚠️ CSME Threat' : ''}
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: D.muted }}>
                      {lesion.area_px != null ? `${lesion.area_px} px²` : '—'}
                    </span>
                    <span style={{
                      fontFamily: D.mono, fontSize: 11, fontWeight: 700, textAlign: 'right',
                      color: lesion.confidence == null ? D.sub : lesion.confidence >= 90 ? '#15803d' : lesion.confidence >= 80 ? D.primary : '#b45309',
                    }}>
                      {lesion.confidence != null ? `${lesion.confidence}%` : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}

function ToolBtn({ active, onClick, label, accent, icon }) {
  return (
    <button onClick={onClick} style={{
      all: 'unset', cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '5px 12px', borderRadius: 6,
      background: active ? '#f0f9ff' : '#ffffff',
      border: `1px solid ${active ? '#0284c7' : '#cbd5e1'}`,
      fontSize: 12, fontWeight: 600,
      color: active ? '#0284c7' : '#475569',
      transition: 'all 0.12s',
      boxShadow: active ? '0 1px 2px rgba(2,132,199,0.1)' : 'none',
    }}>
      {icon && <span style={{ fontSize: 11 }}>{icon}</span>}
      {accent && (
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          background: active ? '#0284c7' : '#94a3b8',
        }} />
      )}
      {label}
    </button>
  );
}
