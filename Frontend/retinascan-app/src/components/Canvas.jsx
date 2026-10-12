import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  lesionTypes,
  normalizeLesionType,
  getLesionRegion,
} from '../data.js';
import { getFullImageUrl } from '../apiConfig.js';

/* ── Design tokens (Hospital Clinical Light Theme) ────────────────────────── */
const D = {
  bg:      '#f8fafc',
  panel:   '#ffffff',
  card:    '#ffffff',
  border:  '#e2e8f0',
  teal:    '#0284c7',
  dim:     '#cbd5e1',
  text:    '#0f172a',
  sub:     '#475569',
  muted:   '#64748b',
  mono:    'JetBrains Mono, "Courier New", monospace',
};

/* ── Grade config ──────────────────────────────────────────────────────────── */
const GRADE_LABELS = [
  { key: 0, name: 'Grade 0: No DR',           color: '#22c55e' },
  { key: 1, name: 'Grade 1: Mild NPDR',        color: '#84cc16' },
  { key: 2, name: 'Grade 2: Moderate NPDR',    color: '#f59e0b' },
  { key: 3, name: 'Grade 3: Severe NPDR',      color: '#ea580c' },
  { key: 4, name: 'Grade 4: Proliferative DR', color: '#dc2626' },
];

/* ── Lesion legend types ───────────────────────────────────────────────────── */
const LEGEND_TYPES = [
  { type: 'neovascular',   label: 'Neovascularization', color: '#ec4899' },
  { type: 'hemorrhage',    label: 'Hemorrhage',          color: '#ef4444' },
  { type: 'hardExudate',   label: 'Hard Exudate',        color: '#00d4aa' },
  { type: 'microaneurysm', label: 'Microaneurysm',       color: '#eab308' },
  { type: 'cottonWool',    label: 'Cotton Wool Spot',    color: '#a855f7' },
];

/* ── Quadrant label ────────────────────────────────────────────────────────── */
function getQuadrant(x, y) {
  const horiz = x < 50 ? 'T' : 'N';  // Temporal / Nasal
  const vert  = y < 50 ? 'S' : 'I';  // Superior / Inferior
  return vert + horiz; // ST SN IT IN
}

/* ── Parse lesion coordinates and normalize attributes ─────────────────────── */
function parseLesion(lesion, idx) {
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
      // Standard 512x512 coordinate space
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
  };
}

/* ── Inline CSS animation styles ───────────────────────────────────────────── */
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
`;

/* ── Main component ────────────────────────────────────────────────────────── */
export default function Canvas({
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
  onRefer,
  onBack,
}) {
  const [showHeatmap,  setShowHeatmap]  = useState(true);
  const [showPins,     setShowPins]     = useState(true);
  const [showRedFree,  setShowRedFree]  = useState(false);
  const [zoom,         setZoom]         = useState(100);
  const [hoveredId,    setHoveredId]    = useState(null);
  const [notes,        setNotes]        = useState('');
  const [imgError,     setImgError]     = useState(false);
  const [heatmapError, setHeatmapError] = useState(false);
  const listRef = useRef(null);

  const sev      = severity ?? patient?.severity ?? 2;
  const eye      = selectedEye || 'od';
  const studyId  = patient?.id?.replace('#', '') || 'STUDY-' + (patient?.id || 'DR88219');

  const rawLesions = propLesions || patient?.lesions || [];
  const lesions = useMemo(() => {
    if (!Array.isArray(rawLesions)) return [];
    return rawLesions.map((l, idx) => parseLesion(l, idx));
  }, [rawLesions]);

  const probs = useMemo(() => {
    const raw = allProbs || patient?.all_probs;
    if (Array.isArray(raw) && raw.length === 5) {
      return raw.map(p => p <= 1 ? Math.round(p * 100) : Math.round(p));
    }
    const base = [0, 0, 0, 0, 0];
    base[sev] = patient?.confidence ? Math.round(patient.confidence) : 95;
    return base;
  }, [allProbs, patient?.all_probs, sev, patient?.confidence]);

  const [imgAspect, setImgAspect] = useState(1);
  const handleImageLoad = (e) => {
    if (e.target.naturalWidth && e.target.naturalHeight) {
      setImgAspect(e.target.naturalWidth / e.target.naturalHeight);
    }
  };

  const imgBounds = useMemo(() => {
    if (imgAspect >= 1) {
      const heightPct = 100 / imgAspect;
      const topPct = (100 - heightPct) / 2;
      return {
        width: '100%',
        height: `${heightPct}%`,
        left: '0%',
        top: `${topPct}%`,
      };
    } else {
      const widthPct = 100 * imgAspect;
      const leftPct = (100 - widthPct) / 2;
      return {
        width: `${widthPct}%`,
        height: '100%',
        left: `${leftPct}%`,
        top: '0%',
      };
    }
  }, [imgAspect]);

  const fundusPath = uploadedImageUrl || patient?.imageUrl || `/images/img_${sev}_${eye}.jpg`;
  const defaultPresetHeatmap = `/images/heatmap_${sev}_${eye}.png`;
  const heatmapPath = uploadedImageUrl
    ? (heatmapUrl ? getFullImageUrl(heatmapUrl) : '')
    : defaultPresetHeatmap;

  // Quadrant counts
  const quadCounts = { ST: 0, SN: 0, IT: 0, IN: 0 };
  lesions.forEach(l => {
    const q = getQuadrant(l.x, l.y);
    if (quadCounts[q] !== undefined) quadCounts[q]++;
  });

  // Present lesion types (for legend)
  const presentTypes = LEGEND_TYPES.filter(t => lesions.some(l => l.type === t.type));

  const handleBack  = () => { if (onBack)  onBack();  else if (navigate) navigate('queue');    };
  const handleRefer = () => { if (onRefer) onRefer(); else if (navigate) navigate('referral'); };

  // Scroll findings table to highlighted row
  useEffect(() => {
    if (hoveredId && listRef.current) {
      const el = listRef.current.querySelector(`[data-id="${hoveredId}"]`);
      if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [hoveredId]);

  // Inject keyframe animations once
  useEffect(() => {
    const id = 'canvas-keyframes';
    if (!document.getElementById(id)) {
      const s = document.createElement('style');
      s.id = id;
      s.textContent = KEYFRAMES;
      document.head.appendChild(s);
    }
  }, []);

  return (
    <div style={{
      height: 'calc(100vh - 56px)',
      maxHeight: 'calc(100vh - 56px)',
      minHeight: 'calc(100vh - 56px)',
      background: D.bg,
      color: D.text,
      fontFamily: 'Inter, system-ui, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      fontSize: 13,
    }}>

      {/* ── Workstation title bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '8px 20px',
        background: D.panel,
        borderBottom: `1px solid ${D.border}`,
        flexShrink: 0,
      }}>
        {/* Green status dot + title */}
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          background: '#22c55e', boxShadow: '0 0 6px #22c55e', flexShrink: 0,
        }} />
        <span style={{ fontFamily: D.mono, fontSize: 11, fontWeight: 700, color: D.text, letterSpacing: '0.08em' }}>
          DIAGNOSTIC RETINAL SALIENCY WORKSTATION
        </span>

        {/* Study chip */}
        <span style={{
          padding: '3px 10px', borderRadius: 5,
          background: 'rgba(255,255,255,0.06)', border: `1px solid ${D.border}`,
          fontFamily: D.mono, fontSize: 10, color: D.sub,
        }}>
          {studyId} · Eye: <strong style={{ color: D.teal }}>{eye.toUpperCase()} ({eye === 'od' ? 'Right' : 'Left'})</strong>
        </span>

        {/* Eye selector */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', border: `1px solid ${D.border}`, borderRadius: 6, padding: 2, gap: 2 }}>
          {['od', 'os'].map(e => (
            <button key={e} onClick={() => setSelectedEye(e)} style={{
              all: 'unset', cursor: 'pointer',
              padding: '3px 10px', borderRadius: 4,
              fontFamily: D.mono, fontSize: 10, fontWeight: 700,
              background: eye === e ? 'rgba(0,212,170,0.15)' : 'transparent',
              color: eye === e ? D.teal : D.muted,
              border: eye === e ? '1px solid rgba(0,212,170,0.3)' : '1px solid transparent',
            }}>
              {e.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Back + Refer */}
        <button onClick={handleBack} style={{
          all: 'unset', cursor: 'pointer',
          padding: '5px 12px', borderRadius: 6,
          background: 'rgba(255,255,255,0.04)', border: `1px solid ${D.border}`,
          fontFamily: D.mono, fontSize: 10, color: D.sub,
        }}>← Queue</button>

        <button onClick={handleRefer} style={{
          all: 'unset', cursor: 'pointer',
          padding: '5px 14px', borderRadius: 6,
          background: 'rgba(0,212,170,0.15)', border: '1px solid rgba(0,212,170,0.4)',
          fontFamily: D.mono, fontSize: 10, color: D.teal, fontWeight: 700,
        }}>Issue Referral →</button>
      </div>

      {/* ── Two-panel body ── */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>

        {/* ════════════════════════════════════════════
            LEFT PANEL — PACS Viewport (STAYS FIXED ON LEFT)
        ════════════════════════════════════════════ */}
        <div style={{
          flex: '0 0 60%',
          maxWidth: '60%',
          height: '100%',
          maxHeight: '100%',
          minHeight: 0,
          display: 'flex', flexDirection: 'column',
          borderRight: `1px solid ${D.border}`,
          background: '#08111a',
          position: 'sticky',
          top: 0,
          alignSelf: 'flex-start',
          overflow: 'hidden',
          zIndex: 5,
        }}>

          {/* Toolbar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 16px',
            background: D.panel,
            borderBottom: `1px solid ${D.border}`,
            flexShrink: 0, flexWrap: 'wrap',
          }}>
            {/* Red-Free filter button */}
            <ToolBtn
              active={showRedFree}
              onClick={() => setShowRedFree(v => !v)}
              label="Red-Free (540nm)"
            />

            <div style={{ width: 1, height: 20, background: D.border }} />

            {/* Grad-CAM toggle */}
            <ToolBtn
              active={showHeatmap}
              onClick={() => setShowHeatmap(v => !v)}
              label="Grad-CAM++"
              accent
            />

            <div style={{ width: 1, height: 20, background: D.border }} />

            {/* Pins toggle + count */}
            <ToolBtn
              active={showPins}
              onClick={() => setShowPins(v => !v)}
              label={`Pins (${lesions.length})`}
              icon="⊕"
            />

            <div style={{ flex: 1 }} />

            {/* Zoom control */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button onClick={() => setZoom(z => Math.max(50, z - 25))} style={iconBtnStyle}>−</button>
              <span style={{ fontFamily: D.mono, fontSize: 10, color: D.teal, minWidth: 40, textAlign: 'center' }}>{zoom}%</span>
              <button onClick={() => setZoom(z => Math.min(200, z + 25))} style={iconBtnStyle}>+</button>
            </div>

            {/* Reset */}
            <button onClick={() => { setZoom(100); setShowHeatmap(true); setShowPins(true); setShowRedFree(false); }}
              style={iconBtnStyle} title="Reset view">↺</button>
          </div>

          {/* Viewport */}
          <div style={{
            flex: 1, position: 'relative', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#060d13',
            cursor: 'crosshair',
          }}>

            {/* Patient info — top left */}
            <div style={{
              position: 'absolute', top: 14, left: 14, zIndex: 10,
              background: 'rgba(6,13,19,0.85)', backdropFilter: 'blur(6px)',
              border: `1px solid ${D.border}`,
              borderRadius: 6, padding: '8px 12px',
              fontFamily: D.mono, fontSize: 10, lineHeight: 1.8, color: D.sub,
            }}>
              <div><span style={{ color: D.muted }}>PATIENT: </span><strong style={{ color: D.text }}>{studyId}</strong></div>
              <div><span style={{ color: D.muted }}>STUDY: </span>CFP 45° RETINAL SCAN</div>
              <div><span style={{ color: D.muted }}>EYE: </span><strong style={{ color: D.teal }}>{eye.toUpperCase()} ({eye === 'od' ? 'RIGHT' : 'LEFT'})</strong></div>
              <div><span style={{ color: D.muted }}>FOV: </span>45 DEGREE POSTERIOR POLE</div>
            </div>

            {/* Technical info — top right */}
            <div style={{
              position: 'absolute', top: 14, right: 14, zIndex: 10,
              background: 'rgba(6,13,19,0.85)', backdropFilter: 'blur(6px)',
              border: `1px solid ${D.border}`,
              borderRadius: 6, padding: '8px 12px',
              fontFamily: D.mono, fontSize: 10, lineHeight: 1.8, color: D.sub,
              textAlign: 'right',
            }}>
              <div><span style={{ color: D.muted }}>ZOOM: </span><strong style={{ color: D.text }}>{zoom}%</strong></div>
              <div><span style={{ color: D.muted }}>RED-FREE: </span><strong style={{ color: showRedFree ? D.teal : D.sub }}>{showRedFree ? 'ON' : 'OFF'}</strong></div>
              <div><span style={{ color: D.muted }}>SALIENCY: </span><strong style={{ color: showHeatmap ? D.teal : D.sub }}>{showHeatmap ? 'Grad-CAM++' : 'OFF'}</strong></div>
              <div><span style={{ color: D.muted }}>RESOLUTION: </span>512 × 512 px</div>
            </div>

            {/* ── Circular fundus image with pins ── */}
            <div style={{
              position: 'relative',
              width: `${Math.min(540, 540 * zoom / 100)}px`,
              height: `${Math.min(540, 540 * zoom / 100)}px`,
              borderRadius: '50%',
              overflow: 'hidden',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 0 60px rgba(0,0,0,0.8)',
              background: '#04080d',
              flexShrink: 0,
            }}>
              {/* Calibrated letterbox frame locked to fundus aspect ratio */}
              <div style={{
                position: 'absolute',
                ...imgBounds,
                overflow: 'visible',
              }}>
                {/* Fundus base */}
                {imgError ? (
                  <div style={{
                    width: '100%', height: '100%',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    background: '#111820', color: D.muted, fontFamily: D.mono, fontSize: 12, gap: 10,
                  }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#3a5068" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <span>Image unavailable</span>
                  </div>
                ) : (
                  <img
                    src={fundusPath}
                    alt={`Fundus ${eye.toUpperCase()} Sev${sev}`}
                    onLoad={handleImageLoad}
                    onError={() => setImgError(true)}
                    style={{
                      width: '100%', height: '100%', objectFit: 'contain',
                      display: 'block',
                      filter: [
                        showRedFree ? 'sepia(1) saturate(0.3) hue-rotate(90deg) contrast(1.2)' : '',
                      ].filter(Boolean).join(' ') || 'none',
                    }}
                  />
                )}

                {/* Grad-CAM heatmap overlay */}
                {showHeatmap && heatmapPath && !heatmapError && (
                  <img
                    src={heatmapPath}
                    alt="Grad-CAM"
                    onError={() => setHeatmapError(true)}
                    style={{
                      position: 'absolute', inset: 0,
                      width: '100%', height: '100%', objectFit: 'contain',
                      pointerEvents: 'none',
                    }}
                  />
                )}

              {/* Empty state overlay on canvas */}
              {showPins && lesions.length === 0 && (
                <div style={{
                  position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
                  background: 'rgba(6,13,19,0.88)', backdropFilter: 'blur(6px)',
                  border: '1px solid rgba(34,197,94,0.3)', borderRadius: 20,
                  padding: '6px 16px', fontFamily: D.mono, fontSize: 11,
                  color: '#22c55e', pointerEvents: 'none', zIndex: 15,
                }}>
                  ✓ No lesions detected — healthy retina
                </div>
              )}

              {/* Lesion pins */}
              {showPins && lesions.map((lesion, idx) => {
                const lt = lesion.lt;
                const isHov = hoveredId === lesion.id;
                return (
                  <div
                    key={lesion.id}
                    style={{
                      position: 'absolute',
                      left: `${lesion.x}%`,
                      top:  `${lesion.y}%`,
                      zIndex: isHov ? 30 : 10,
                      pointerEvents: 'auto',
                    }}
                    onMouseEnter={() => setHoveredId(lesion.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    {/* Pulse ring */}
                    <div style={{
                      position: 'absolute',
                      width: 22, height: 22,
                      borderRadius: '50%',
                      border: `1.5px solid ${lt.color}`,
                      animation: `pin-pulse 2s ${idx * 0.15}s infinite`,
                      transform: 'translate(-50%, -50%)',
                      pointerEvents: 'none',
                    }} />

                    {/* Pin dot */}
                    <div style={{
                      width: isHov ? 18 : 12,
                      height: isHov ? 18 : 12,
                      borderRadius: '50%',
                      background: lt.color,
                      border: `2px solid rgba(255,255,255,0.85)`,
                      boxShadow: `0 0 ${isHov ? 12 : 6}px ${lt.color}90`,
                      transform: 'translate(-50%, -50%)',
                      transition: 'all 0.15s cubic-bezier(0.4,0,0.2,1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      animation: `pin-in 0.3s ${idx * 0.05}s both`,
                      cursor: 'crosshair',
                    }}>
                      {isHov && (
                        <span style={{ fontSize: 7, fontWeight: 900, color: '#fff', lineHeight: 1, fontFamily: D.mono }}>
                          {lesion.id}
                        </span>
                      )}
                    </div>

                    {/* Hover tooltip */}
                    {isHov && (
                      <div style={{
                        position: 'absolute',
                        bottom: '100%', left: '50%',
                        transform: 'translateX(-50%) translateY(-10px)',
                        background: 'rgba(6,13,19,0.96)',
                        border: `1px solid ${lt.color}60`,
                        borderRadius: 7,
                        padding: '7px 11px',
                        whiteSpace: 'nowrap',
                        zIndex: 50,
                        pointerEvents: 'none',
                        boxShadow: `0 4px 20px rgba(0,0,0,0.7), 0 0 0 1px ${lt.color}30`,
                      }}>
                        <div style={{ fontFamily: D.mono, fontSize: 11, fontWeight: 700, color: lt.color, marginBottom: 3 }}>
                          #{lesion.id < 10 ? '0' + lesion.id : lesion.id} {lt.label.toUpperCase()}
                        </div>
                        <div style={{ fontFamily: D.mono, fontSize: 10, color: D.sub }}>
                          {lesion.confidence != null && <>Conf: <strong style={{ color: D.text }}>{lesion.confidence}%</strong>&nbsp;&nbsp;</>}
                          {lesion.area_px != null && <>Area: <strong style={{ color: D.text }}>{lesion.area_px} px²</strong></>}
                        </div>
                        <div style={{ fontFamily: D.mono, fontSize: 10, color: D.muted, marginTop: 2 }}>
                          {lesion.bbox ? `[${lesion.bbox.join(', ')}]` : `[${(lesion.x / 100).toFixed(2)}, ${(lesion.y / 100).toFixed(2)}]`}
                        </div>
                        {/* Tooltip arrow */}
                        <div style={{
                          position: 'absolute', bottom: -5, left: '50%',
                          width: 8, height: 8, background: 'rgba(6,13,19,0.96)',
                          borderRight: `1px solid ${lt.color}60`,
                          borderBottom: `1px solid ${lt.color}60`,
                          transform: 'translateX(-50%) rotate(45deg)',
                        }} />
                      </div>
                    )}
                  </div>
                );
              })}
              </div>
            </div>

            {/* ── Quadrant Radar — bottom right inset ── */}
            <div style={{
              position: 'absolute', bottom: 16, right: 16,
              background: 'rgba(6,13,19,0.88)', backdropFilter: 'blur(8px)',
              border: `1px solid ${D.border}`,
              borderRadius: 8, padding: '10px 14px',
              fontFamily: D.mono, fontSize: 11,
              zIndex: 20,
            }}>
              <div style={{ fontSize: 9, color: D.muted, letterSpacing: '0.1em', marginBottom: 8, textAlign: 'center' }}>⊕ QUADRANT RADAR</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 20px', textAlign: 'center' }}>
                {[
                  { q: 'ST', label: 'ST' },
                  { q: 'SN', label: 'SN' },
                  { q: 'IT', label: 'IT' },
                  { q: 'IN', label: 'IN' },
                ].map(({ q, label }) => (
                  <div key={q}>
                    <span style={{ color: D.muted }}>{label}: </span>
                    <strong style={{ color: D.teal }}>{quadCounts[q]}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Legend strip ── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 20,
            padding: '10px 16px',
            background: D.panel, borderTop: `1px solid ${D.border}`,
            flexShrink: 0, flexWrap: 'wrap',
          }}>
            <span style={{ fontFamily: D.mono, fontSize: 9, color: D.muted, letterSpacing: '0.08em' }}>
              Pathological Markers:
            </span>
            {presentTypes.map(t => (
              <span key={t.type} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: D.sub }}>
                <span style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: t.color, display: 'inline-block',
                  boxShadow: `0 0 5px ${t.color}`,
                }} />
                {t.label}
              </span>
            ))}
            <div style={{ flex: 1 }} />
            <span style={{ fontFamily: D.mono, fontSize: 9, color: D.muted }}>
              Ben Graham Normalization · 512×512 Standard
            </span>
          </div>
        </div>

        {/* ════════════════════════════════════════════
            RIGHT PANEL — Metrics & Findings
        ════════════════════════════════════════════ */}
        <div style={{
          flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column',
          background: D.bg, overflow: 'hidden', height: '100%',
        }}>

          {/* ── ICDR Probability Distribution ── */}
          <div style={{
            padding: '18px 20px 16px',
            borderBottom: `1px solid ${D.border}`,
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontFamily: D.mono, fontSize: 11, fontWeight: 700, color: D.text, letterSpacing: '0.06em' }}>
                ICDR ORDINAL PROBABILITY DISTRIBUTION
              </span>
              <span style={{ fontFamily: D.mono, fontSize: 9, color: D.teal, border: `1px solid ${D.border}`, padding: '2px 8px', borderRadius: 4 }}>
                Calibrated Softmax
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {GRADE_LABELS.map(g => {
                const prob    = probs[g.key] || 0;
                const isPred  = g.key === sev;
                return (
                  <div key={g.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* Active indicator */}
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                      background: isPred ? g.color : 'transparent',
                      border: isPred ? `2px solid ${g.color}` : '2px solid transparent',
                      boxShadow: isPred ? `0 0 6px ${g.color}` : 'none',
                    }} />
                    {/* Label */}
                    <span style={{
                      fontFamily: D.mono, fontSize: 11, minWidth: 168,
                      color: isPred ? D.text : D.sub,
                      fontWeight: isPred ? 700 : 400,
                    }}>
                      {g.name}
                    </span>
                    {/* Bar */}
                    <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${prob}%`,
                        background: isPred ? g.color : '#e2e8f0',
                        borderRadius: 3,
                        transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                      }} />
                    </div>
                    {/* Percent */}
                    <span style={{
                      fontFamily: D.mono, fontSize: 11, minWidth: 32, textAlign: 'right',
                      color: isPred ? g.color : D.sub,
                      fontWeight: isPred ? 700 : 400,
                    }}>
                      {prob}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Indexed findings table ── */}
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Table header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 20px 10px',
              borderBottom: `1px solid ${D.border}`,
              flexShrink: 0,
            }}>
              <span style={{ fontFamily: D.mono, fontSize: 11, fontWeight: 700, color: D.text, letterSpacing: '0.06em' }}>
                INDEXED PATHOLOGICAL FINDINGS ({lesions.length})
              </span>
              <span style={{ fontFamily: D.mono, fontSize: 9, color: D.teal }}>
                Morphological Segmentor
              </span>
            </div>

            {/* Optional lesion summary strip */}
            {lesionSummary && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '7px 20px',
                background: 'rgba(255,255,255,0.02)', borderBottom: `1px solid ${D.border}`,
                fontSize: 10, fontFamily: D.mono, color: D.sub, flexWrap: 'wrap',
              }}>
                {lesionSummary.microaneurysm_count != null && (
                  <span>MA: <strong style={{ color: '#ef4444' }}>{lesionSummary.microaneurysm_count}</strong></span>
                )}
                {lesionSummary.hemorrhage_count != null && (
                  <span>HE: <strong style={{ color: '#f97316' }}>{lesionSummary.hemorrhage_count}</strong></span>
                )}
                {(lesionSummary.exudate_count != null || lesionSummary.hard_exudate_count != null) && (
                  <span>EX: <strong style={{ color: '#eab308' }}>{lesionSummary.exudate_count ?? lesionSummary.hard_exudate_count}</strong></span>
                )}
                {lesionSummary.total_lesion_area_px != null && (
                  <span>Total Area: <strong style={{ color: D.teal }}>{lesionSummary.total_lesion_area_px} px²</strong></span>
                )}
              </div>
            )}

            {/* Column headers */}
            <div style={{
              display: 'grid', gridTemplateColumns: '28px 90px 1fr 75px 50px',
              padding: '6px 20px',
              borderBottom: `1px solid ${D.border}`,
              flexShrink: 0,
            }}>
              {['#', 'Finding', 'Region', 'Area', 'Conf'].map(h => (
                <span key={h} style={{ fontFamily: D.mono, fontSize: 9, color: D.muted, letterSpacing: '0.07em', textTransform: 'uppercase' }}>{h}</span>
              ))}
            </div>

            {/* Scrollable rows */}
            <div
              ref={listRef}
              style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}
            >
              {lesions.length === 0 && (
                <div style={{ padding: '32px 20px', textAlign: 'center', fontFamily: D.mono, fontSize: 12, color: D.sub }}>
                  ✓ No lesions detected — healthy retina
                </div>
              )}
              {lesions.map((lesion) => {
                const lt     = lesion.lt;
                const region = getLesionRegion(lesion.x, lesion.y);
                const isHov  = hoveredId === lesion.id;
                return (
                  <div
                    key={lesion.id}
                    data-id={lesion.id}
                    onMouseEnter={() => setHoveredId(lesion.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '28px 90px 1fr 75px 50px',
                      padding: '8px 20px',
                      alignItems: 'center',
                      background: isHov ? '#f0f9ff' : 'transparent',
                      borderLeft: isHov ? `2px solid ${D.teal}` : '2px solid transparent',
                      transition: 'all 0.12s',
                      cursor: 'pointer',
                      borderBottom: `1px solid #f1f5f9`,
                    }}
                  >
                    {/* # */}
                    <span style={{ fontFamily: D.mono, fontSize: 11, color: D.muted }}>#{lesion.id}</span>

                    {/* Type badge */}
                    <span style={{
                      padding: '2px 8px', borderRadius: 4,
                      background: `${lt.color}15`,
                      border: `1px solid ${lt.color}40`,
                      fontFamily: D.mono, fontSize: 10, fontWeight: 700,
                      color: lt.color,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {lt.symbol} {lt.label}
                    </span>

                    {/* Region */}
                    <span style={{ fontFamily: D.mono, fontSize: 11, color: D.sub }}>{region}</span>

                    {/* Area */}
                    <span style={{ fontFamily: D.mono, fontSize: 10, color: D.muted }}>
                      {lesion.area_px != null ? `${lesion.area_px} px²` : '—'}
                    </span>

                    {/* Confidence */}
                    <span style={{
                      fontFamily: D.mono, fontSize: 11, fontWeight: 700,
                      color: lesion.confidence == null ? D.sub : lesion.confidence >= 90 ? '#16a34a' : lesion.confidence >= 80 ? D.teal : '#d97706',
                    }}>
                      {lesion.confidence != null ? `${lesion.confidence}%` : '—'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* ── Bottom action bar ── */}
            <div style={{
              padding: '12px 20px',
              borderTop: `1px solid ${D.border}`,
              display: 'flex', gap: 10,
              flexShrink: 0,
              background: D.panel,
            }}>
              {/* Notes textarea */}
              <textarea
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Clinical notes — Dr. Arvind Mehta…"
                style={{
                  flex: 1, background: '#ffffff',
                  border: `1px solid ${D.border}`, borderRadius: 6,
                  color: D.text, fontFamily: D.mono, fontSize: 11,
                  padding: '8px 10px', resize: 'none', outline: 'none',
                  lineHeight: 1.5,
                }}
                onFocus={e => { e.target.style.borderColor = '#0284c7'; }}
                onBlur={e =>  { e.target.style.borderColor = D.border; }}
              />
              <button onClick={handleRefer} style={{
                all: 'unset', cursor: 'pointer',
                padding: '0 20px', borderRadius: 7,
                background: '#0284c7', color: '#ffffff',
                boxShadow: '0 2px 6px rgba(2,132,199,0.25)',
                fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 6,
                whiteSpace: 'nowrap',
              }}>
                Confirm Grade →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Small helper components ─────────────────────────────────────────────── */
function ToolBtn({ active, onClick, label, accent, icon }) {
  return (
    <button onClick={onClick} style={{
      all: 'unset', cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 5,
      padding: '4px 10px', borderRadius: 5,
      background: active ? '#f0f9ff' : 'transparent',
      border: `1px solid ${active ? '#bae6fd' : '#e2e8f0'}`,
      fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 600,
      color: active ? '#0284c7' : '#475569',
      transition: 'all 0.12s',
    }}>
      {icon && <span style={{ fontSize: 10 }}>{icon}</span>}
      {accent && (
        <span style={{
          width: 12, height: 12, borderRadius: 3,
          background: active ? '#0284c7' : 'transparent',
          border: `1.5px solid ${active ? '#0284c7' : '#94a3b8'}`,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          {active && <span style={{ fontSize: 8, color: '#ffffff', fontWeight: 900 }}>✓</span>}
        </span>
      )}
      {label}
    </button>
  );
}

const iconBtnStyle = {
  all: 'unset', cursor: 'pointer',
  width: 24, height: 24, borderRadius: 4,
  background: '#ffffff', border: '1px solid #cbd5e1',
  fontFamily: 'JetBrains Mono, monospace', fontSize: 14,
  color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center',
  lineHeight: 1, transition: 'background 0.1s',
};
