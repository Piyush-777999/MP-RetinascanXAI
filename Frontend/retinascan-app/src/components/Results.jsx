import React, { useState, useEffect } from 'react';
import {
  lesionsBySeverity,
  lesionTypes,
  getProbabilityDistribution,
  getLesionRegion,
  severityColors,
} from '../data.js';

/* ── Design tokens ─────────────────────────────────────────────────────────── */
const D = {
  bg:    '#0a0f14',
  panel: '#111820',
  border:'#1e2d3d',
  teal:  '#00d4aa',
  text:  '#e8f4f8',
  sub:   '#7a9ab0',
  muted: '#3a5068',
  mono:  'JetBrains Mono, "Courier New", monospace',
};

const GRADE_LABELS = [
  { key: 0, name: 'Grade 0: No DR',           color: '#22c55e', shortName: 'No DR' },
  { key: 1, name: 'Grade 1: Mild NPDR',        color: '#84cc16', shortName: 'Mild NPDR' },
  { key: 2, name: 'Grade 2: Moderate NPDR',    color: '#f59e0b', shortName: 'Moderate NPDR' },
  { key: 3, name: 'Grade 3: Severe NPDR',      color: '#ea580c', shortName: 'Severe NPDR' },
  { key: 4, name: 'Grade 4: Proliferative DR', color: '#dc2626', shortName: 'Proliferative DR' },
];

const SEVERITY_ACTIONS = [
  'Routine annual re-screening',
  'Monitor every 6–12 months',
  'Specialist triage required — refer within 1 month',
  'Urgent referral — within 1 week',
  'Emergency — refer within 24 hours',
];

const LEGEND_TYPES = [
  { type: 'neovascular',   label: 'Neovascularization', color: '#ec4899' },
  { type: 'hemorrhage',    label: 'Hemorrhage',          color: '#ef4444' },
  { type: 'hardExudate',   label: 'Hard Exudate',        color: '#00d4aa' },
  { type: 'microaneurysm', label: 'Microaneurysm',       color: '#eab308' },
  { type: 'cottonWool',    label: 'Cotton Wool Spot',    color: '#a855f7' },
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
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

function getQuadrant(x, y) {
  return (y < 50 ? 'S' : 'I') + (x < 50 ? 'T' : 'N');
}

export default function Results({
  navigate,
  patient,
  severity = 2,
  selectedEye = 'od',
  setSelectedEye = () => {},
  heatmapUrl = '',
  uploadedImageUrl = '',
  onQueue,
}) {
  const [showHeatmap,  setShowHeatmap]  = useState(true);
  const [showPins,     setShowPins]     = useState(true);
  const [showRedFree,  setShowRedFree]  = useState(false);
  const [hoveredId,    setHoveredId]    = useState(null);
  const [bilateral,    setBilateral]    = useState(false);

  const sev       = severity ?? patient?.severity ?? 2;
  const eye       = selectedEye || 'od';
  const lesions   = lesionsBySeverity[sev] || [];
  const probs     = getProbabilityDistribution(sev);
  const gradeInfo = GRADE_LABELS[sev] || GRADE_LABELS[2];
  const conf      = patient?.confidence ?? (91 + sev * 1.4).toFixed(1);

  // Prefer real uploaded image; fall back to demo
  const fundusPath  = uploadedImageUrl || `/images/img_${sev}_${eye}.jpg`;
  const heatmapPath = heatmapUrl
    ? `http://localhost:8000${heatmapUrl}`
    : `/images/heatmap_${sev}_${eye}.jpg`;

  const presentTypes = LEGEND_TYPES.filter(t => lesions.some(l => l.type === t.type));

  const quadCounts = { ST: 0, SN: 0, IT: 0, IN: 0 };
  lesions.forEach(l => { const q = getQuadrant(l.x, l.y); if (quadCounts[q] !== undefined) quadCounts[q]++; });

  const studyId  = patient?.id?.replace('#', '') || 'STUDY-DR88219';
  const patName  = patient?.fullName || patient?.name || 'Smt. Geeta Sharma';

  const handleQueueClick = () => { if (onQueue) onQueue(); else if (navigate) navigate('queue'); };

  // Inject keyframes
  useEffect(() => {
    const id = 'results-keyframes';
    if (!document.getElementById(id)) {
      const s = document.createElement('style');
      s.id = id; s.textContent = KEYFRAMES;
      document.head.appendChild(s);
    }
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: D.bg,
      color: D.text,
      fontFamily: 'Inter, system-ui, sans-serif',
      display: 'flex', flexDirection: 'column',
      animation: 'fade-up 0.3s ease both',
    }}>

      {/* ── Title bar (like workstation header) ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '8px 20px',
        background: D.panel, borderBottom: `1px solid ${D.border}`,
        flexShrink: 0, flexWrap: 'wrap',
      }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e', flexShrink: 0 }} />
        <span style={{ fontFamily: D.mono, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: D.text }}>
          DIAGNOSTIC RESULTS · ICDR ANALYSIS
        </span>
        <span style={{ padding: '3px 10px', borderRadius: 5, background: 'rgba(255,255,255,0.05)', border: `1px solid ${D.border}`, fontFamily: D.mono, fontSize: 10, color: D.sub }}>
          {studyId} · Eye: <strong style={{ color: D.teal }}>{eye.toUpperCase()}</strong>
        </span>

        <div style={{ flex: 1 }} />

        {/* Eye toggle */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', border: `1px solid ${D.border}`, borderRadius: 6, padding: 2, gap: 2 }}>
          {['od', 'os'].map(e => (
            <button key={e} onClick={() => setSelectedEye(e)} style={{
              all: 'unset', cursor: 'pointer',
              padding: '4px 12px', borderRadius: 4,
              fontFamily: D.mono, fontSize: 11, fontWeight: 700,
              background: eye === e ? 'rgba(0,212,170,0.15)' : 'transparent',
              color: eye === e ? D.teal : D.muted,
              border: eye === e ? '1px solid rgba(0,212,170,0.3)' : '1px solid transparent',
            }}>
              {e.toUpperCase()}
            </button>
          ))}
        </div>

        <button onClick={() => setBilateral(v => !v)} style={{
          all: 'unset', cursor: 'pointer',
          padding: '4px 12px', borderRadius: 5,
          background: bilateral ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${bilateral ? 'rgba(168,85,247,0.4)' : D.border}`,
          fontFamily: D.mono, fontSize: 10,
          color: bilateral ? '#a855f7' : D.muted,
        }}>⊞ Bilateral</button>

        <button onClick={() => navigate?.('upload')} style={{
          all: 'unset', cursor: 'pointer',
          padding: '5px 12px', borderRadius: 6,
          background: 'rgba(255,255,255,0.04)', border: `1px solid ${D.border}`,
          fontFamily: D.mono, fontSize: 10, color: D.sub,
        }}>← New Scan</button>
      </div>

      {/* ── Patient header strip ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 32,
        padding: '12px 20px',
        background: 'rgba(0,212,170,0.04)',
        borderBottom: `1px solid rgba(0,212,170,0.15)`,
        flexShrink: 0, flexWrap: 'wrap',
      }}>
        {/* Grade badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '6px 16px', borderRadius: 8,
          background: `${gradeInfo.color}18`, border: `1px solid ${gradeInfo.color}50`,
        }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: gradeInfo.color, boxShadow: `0 0 8px ${gradeInfo.color}` }} />
          <div>
            <div style={{ fontFamily: D.mono, fontSize: 13, fontWeight: 800, color: gradeInfo.color }}>{gradeInfo.shortName}</div>
            <div style={{ fontFamily: D.mono, fontSize: 9, color: D.muted }}>ICDR LEVEL {sev}</div>
          </div>
        </div>

        {/* Patient name */}
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: D.text }}>{patName}</div>
          <div style={{ fontFamily: D.mono, fontSize: 10, color: D.muted, marginTop: 2 }}>
            {patient?.age}Y / {patient?.gender === 'M' ? 'Male' : 'Female'} · {patient?.village || 'PHC Mandawar'}
          </div>
        </div>

        {/* Confidence */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: D.mono, fontSize: 22, fontWeight: 800, color: D.teal }}>{conf}%</div>
          <div style={{ fontFamily: D.mono, fontSize: 9, color: D.muted }}>MODEL CONFIDENCE</div>
        </div>

        {/* Lesion count */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: D.mono, fontSize: 22, fontWeight: 800, color: '#f59e0b' }}>{lesions.length}</div>
          <div style={{ fontFamily: D.mono, fontSize: 9, color: D.muted }}>LESIONS DETECTED</div>
        </div>

        {/* HbA1c if available */}
        {patient?.hba1c && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: D.mono, fontSize: 22, fontWeight: 800, color: patient.hba1c > 9 ? '#ea580c' : '#84cc16' }}>{patient.hba1c}%</div>
            <div style={{ fontFamily: D.mono, fontSize: 9, color: D.muted }}>HbA1c</div>
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* Action recommendation */}
        <div style={{
          padding: '8px 16px', borderRadius: 8,
          background: sev >= 3 ? 'rgba(220,38,38,0.12)' : sev >= 2 ? 'rgba(234,88,12,0.1)' : 'rgba(34,197,94,0.08)',
          border: `1px solid ${sev >= 3 ? 'rgba(220,38,38,0.3)' : sev >= 2 ? 'rgba(234,88,12,0.25)' : 'rgba(34,197,94,0.2)'}`,
          fontFamily: D.mono, fontSize: 11, fontWeight: 700,
          color: sev >= 3 ? '#dc2626' : sev >= 2 ? '#ea580c' : '#22c55e',
          maxWidth: 260,
        }}>
          ⚡ {SEVERITY_ACTIONS[sev]}
        </div>

        {/* Queue CTA */}
        <button onClick={handleQueueClick} style={{
          all: 'unset', cursor: 'pointer',
          padding: '10px 22px', borderRadius: 8,
          background: 'rgba(0,212,170,0.18)', border: '1px solid rgba(0,212,170,0.4)',
          fontFamily: D.mono, fontSize: 12, fontWeight: 700, color: D.teal,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          Send to Review Queue →
        </button>
      </div>

      {/* ── Main two-panel body ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ════ LEFT PANEL — Fundus viewport ════ */}
        <div style={{
          flex: '0 0 60%', display: 'flex', flexDirection: 'column',
          borderRight: `1px solid ${D.border}`,
          background: '#07111a',
        }}>
          {/* Toolbar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 16px',
            background: D.panel, borderBottom: `1px solid ${D.border}`,
            flexShrink: 0, flexWrap: 'wrap',
          }}>
            <ToolBtn active={showRedFree}  onClick={() => setShowRedFree(v => !v)}  label="Red-Free (540nm)" />
            <div style={{ width: 1, height: 20, background: D.border }} />
            <ToolBtn active={showHeatmap}  onClick={() => setShowHeatmap(v => !v)}  label="Grad-CAM++" accent />
            <div style={{ width: 1, height: 20, background: D.border }} />
            <ToolBtn active={showPins}     onClick={() => setShowPins(v => !v)}     label={`Pins (${lesions.length})`} icon="⊕" />
            <div style={{ flex: 1 }} />
            <span style={{ fontFamily: D.mono, fontSize: 9, color: D.muted }}>ZOOM: 100% · FOV 45°</span>
          </div>

          {/* Image area */}
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#050d14', position: 'relative', overflow: 'hidden',
          }}>
            {/* Patient overlay — top left */}
            <div style={{
              position: 'absolute', top: 14, left: 14, zIndex: 10,
              background: 'rgba(5,13,20,0.87)', backdropFilter: 'blur(6px)',
              border: `1px solid ${D.border}`, borderRadius: 6, padding: '8px 12px',
              fontFamily: D.mono, fontSize: 10, lineHeight: 1.85, color: D.sub,
            }}>
              <div><span style={{ color: D.muted }}>PATIENT: </span><strong style={{ color: D.text }}>{studyId}</strong></div>
              <div><span style={{ color: D.muted }}>STUDY: </span>CFP 45° RETINAL SCAN</div>
              <div><span style={{ color: D.muted }}>EYE: </span><strong style={{ color: D.teal }}>{eye.toUpperCase()} ({eye === 'od' ? 'RIGHT' : 'LEFT'})</strong></div>
              <div><span style={{ color: D.muted }}>FOV: </span>45 DEGREE POSTERIOR POLE</div>
            </div>

            {/* Tech overlay — top right */}
            <div style={{
              position: 'absolute', top: 14, right: 14, zIndex: 10,
              background: 'rgba(5,13,20,0.87)', backdropFilter: 'blur(6px)',
              border: `1px solid ${D.border}`, borderRadius: 6, padding: '8px 12px',
              fontFamily: D.mono, fontSize: 10, lineHeight: 1.85, color: D.sub, textAlign: 'right',
            }}>
              <div><span style={{ color: D.muted }}>ZOOM: </span><strong style={{ color: D.text }}>100%</strong></div>
              <div><span style={{ color: D.muted }}>RED-FREE: </span><strong style={{ color: showRedFree ? D.teal : D.muted }}>{showRedFree ? 'ON' : 'OFF'}</strong></div>
              <div><span style={{ color: D.muted }}>SALIENCY: </span><strong style={{ color: showHeatmap ? D.teal : D.muted }}>{showHeatmap ? 'Grad-CAM++' : 'OFF'}</strong></div>
              <div><span style={{ color: D.muted }}>RESOLUTION: </span>512 × 512 px</div>
            </div>

            {/* ── Circular fundus with lesion pins ── */}
            <div style={{
              position: 'relative',
              width: 500, height: 500,
              borderRadius: '50%',
              overflow: 'hidden',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 0 80px rgba(0,0,0,0.9)',
              flexShrink: 0,
            }}>
              <img
                src={fundusPath}
                alt={`Retina Grade ${sev}`}
                onError={e => { e.target.src = '/images/img_2_od.jpg'; }}
                style={{
                  width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                  filter: showRedFree ? 'sepia(1) saturate(0.3) hue-rotate(90deg) contrast(1.2)' : 'none',
                }}
              />

              {showHeatmap && (
                <img src={heatmapPath} alt="Grad-CAM"
                  onError={e => { e.target.style.display = 'none'; }}
                  style={{
                    position: 'absolute', inset: 0,
                    width: '100%', height: '100%', objectFit: 'cover',
                    mixBlendMode: 'screen', opacity: 0.72, pointerEvents: 'none',
                  }}
                />
              )}

              {/* Pins */}
              {showPins && lesions.map((lesion, idx) => {
                const lt    = lesionTypes[lesion.type] || lesionTypes.microaneurysm;
                const isHov = hoveredId === lesion.id;
                return (
                  <div key={lesion.id}
                    style={{ position: 'absolute', left: `${lesion.x}%`, top: `${lesion.y}%`, zIndex: isHov ? 30 : 10 }}
                    onMouseEnter={() => setHoveredId(lesion.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    {/* Pulse ring */}
                    <div style={{
                      position: 'absolute', width: 22, height: 22, borderRadius: '50%',
                      border: `1.5px solid ${lt.color}`,
                      animation: `pin-pulse 2s ${idx * 0.15}s infinite`,
                      transform: 'translate(-50%,-50%)', pointerEvents: 'none',
                    }} />
                    {/* Dot */}
                    <div style={{
                      width: isHov ? 18 : 11, height: isHov ? 18 : 11,
                      borderRadius: '50%',
                      background: lt.color,
                      border: `2px solid rgba(255,255,255,0.9)`,
                      boxShadow: `0 0 ${isHov ? 14 : 5}px ${lt.color}`,
                      transform: 'translate(-50%,-50%)',
                      transition: 'all 0.15s',
                      animation: `pin-in 0.3s ${idx * 0.04}s both`,
                      cursor: 'crosshair',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {isHov && <span style={{ fontSize: 6, fontWeight: 900, color: '#fff', fontFamily: D.mono }}>{lesion.id}</span>}
                    </div>
                    {/* Tooltip */}
                    {isHov && (
                      <div style={{
                        position: 'absolute', bottom: '100%', left: '50%',
                        transform: 'translateX(-50%) translateY(-8px)',
                        background: 'rgba(5,13,20,0.96)',
                        border: `1px solid ${lt.color}60`,
                        borderRadius: 7, padding: '7px 12px',
                        whiteSpace: 'nowrap', zIndex: 50, pointerEvents: 'none',
                        boxShadow: `0 4px 20px rgba(0,0,0,0.7)`,
                      }}>
                        <div style={{ fontFamily: D.mono, fontSize: 11, fontWeight: 700, color: lt.color, marginBottom: 3 }}>
                          #{lesion.id < 10 ? '0' + lesion.id : lesion.id} {lt.label.toUpperCase()}
                        </div>
                        <div style={{ fontFamily: D.mono, fontSize: 10, color: D.sub }}>
                          Conf: <strong style={{ color: D.text }}>{lesion.confidence}%</strong>
                          &nbsp;&nbsp;Dim: <strong style={{ color: D.sub }}>{(lesion.confidence * 0.056).toFixed(1)}%</strong>
                        </div>
                        <div style={{ fontFamily: D.mono, fontSize: 10, color: D.muted, marginTop: 2 }}>
                          [{(lesion.x / 100).toFixed(2)}, {(lesion.y / 100).toFixed(2)}]
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quadrant radar */}
            <div style={{
              position: 'absolute', bottom: 16, right: 16,
              background: 'rgba(5,13,20,0.9)', backdropFilter: 'blur(6px)',
              border: `1px solid ${D.border}`,
              borderRadius: 8, padding: '10px 14px',
              fontFamily: D.mono, fontSize: 11, zIndex: 20,
            }}>
              <div style={{ fontSize: 9, color: D.muted, letterSpacing: '0.1em', marginBottom: 8, textAlign: 'center' }}>⊕ QUADRANT RADAR</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 18px', textAlign: 'center' }}>
                {[['ST', quadCounts.ST], ['SN', quadCounts.SN], ['IT', quadCounts.IT], ['IN', quadCounts.IN]].map(([q, c]) => (
                  <div key={q}><span style={{ color: D.muted }}>{q}: </span><strong style={{ color: D.teal }}>{c}</strong></div>
                ))}
              </div>
            </div>
          </div>

          {/* Legend strip */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap',
            padding: '10px 16px',
            background: D.panel, borderTop: `1px solid ${D.border}`,
            flexShrink: 0,
          }}>
            <span style={{ fontFamily: D.mono, fontSize: 9, color: D.muted, letterSpacing: '0.07em' }}>Pathological Markers:</span>
            {presentTypes.map(t => (
              <span key={t.type} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: D.sub }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: t.color, boxShadow: `0 0 5px ${t.color}`, display: 'inline-block' }} />
                {t.label}
              </span>
            ))}
            <div style={{ flex: 1 }} />
            <span style={{ fontFamily: D.mono, fontSize: 9, color: D.muted }}>Ben Graham Normalization · 512×512 Standard</span>
          </div>
        </div>

        {/* ════ RIGHT PANEL — Probability + Findings ════ */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: D.bg, overflow: 'hidden' }}>

          {/* Probability distribution */}
          <div style={{ padding: '18px 20px 16px', borderBottom: `1px solid ${D.border}`, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontFamily: D.mono, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: D.text }}>
                ICDR ORDINAL PROBABILITY DISTRIBUTION
              </span>
              <span style={{ fontFamily: D.mono, fontSize: 9, color: D.teal, border: `1px solid ${D.border}`, padding: '2px 8px', borderRadius: 4 }}>
                Calibrated Softmax
              </span>
            </div>
            {GRADE_LABELS.map(g => {
              const prob   = probs[g.key] || 0;
              const isPred = g.key === sev;
              return (
                <div key={g.key} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 11 }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background: isPred ? g.color : 'transparent',
                    border: `2px solid ${isPred ? g.color : 'transparent'}`,
                    boxShadow: isPred ? `0 0 6px ${g.color}` : 'none',
                  }} />
                  <span style={{ fontFamily: D.mono, fontSize: 11, minWidth: 170, color: isPred ? D.text : D.sub, fontWeight: isPred ? 700 : 400 }}>
                    {g.name}
                  </span>
                  <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${prob}%`,
                      background: isPred ? g.color : 'rgba(255,255,255,0.14)',
                      borderRadius: 3,
                      boxShadow: isPred ? `0 0 8px ${g.color}60` : 'none',
                      animation: 'bar-grow 0.9s cubic-bezier(0.4,0,0.2,1) both',
                    }} />
                  </div>
                  <span style={{ fontFamily: D.mono, fontSize: 11, minWidth: 34, textAlign: 'right', color: isPred ? g.color : D.sub, fontWeight: isPred ? 700 : 400 }}>
                    {prob}%
                  </span>
                </div>
              );
            })}
          </div>

          {/* Indexed findings */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '13px 20px 9px', borderBottom: `1px solid ${D.border}`, flexShrink: 0,
            }}>
              <span style={{ fontFamily: D.mono, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: D.text }}>
                INDEXED PATHOLOGICAL FINDINGS ({lesions.length})
              </span>
              <span style={{ fontFamily: D.mono, fontSize: 9, color: D.teal }}>U-Net Segmentor (IDRiD)</span>
            </div>

            {/* Column headers */}
            <div style={{
              display: 'grid', gridTemplateColumns: '28px 80px 1fr 90px 44px',
              padding: '5px 20px', borderBottom: `1px solid ${D.border}`, flexShrink: 0,
            }}>
              {['#', 'Finding', 'Region', 'Coords', 'Conf'].map(h => (
                <span key={h} style={{ fontFamily: D.mono, fontSize: 9, color: D.muted, letterSpacing: '0.07em', textTransform: 'uppercase' }}>{h}</span>
              ))}
            </div>

            {/* Rows */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
              {lesions.length === 0 && (
                <div style={{ padding: '32px 20px', textAlign: 'center', fontFamily: D.mono, fontSize: 12, color: D.muted }}>
                  ✓ No lesions detected — Healthy fundus (Grade 0)
                </div>
              )}
              {lesions.map(lesion => {
                const lt    = lesionTypes[lesion.type] || lesionTypes.microaneurysm;
                const region = getLesionRegion(lesion.x, lesion.y);
                const isHov  = hoveredId === lesion.id;
                return (
                  <div key={lesion.id}
                    onMouseEnter={() => setHoveredId(lesion.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={{
                      display: 'grid', gridTemplateColumns: '28px 80px 1fr 90px 44px',
                      padding: '8px 20px', alignItems: 'center',
                      background: isHov ? 'rgba(0,212,170,0.07)' : 'transparent',
                      borderLeft: isHov ? `2px solid ${D.teal}` : '2px solid transparent',
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      transition: 'all 0.12s', cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontFamily: D.mono, fontSize: 11, color: D.muted }}>#{lesion.id}</span>
                    <span style={{
                      padding: '2px 8px', borderRadius: 4,
                      background: `${lt.color}20`, border: `1px solid ${lt.color}50`,
                      fontFamily: D.mono, fontSize: 10, fontWeight: 700, color: lt.color,
                      whiteSpace: 'nowrap',
                    }}>
                      {lt.symbol}
                    </span>
                    <span style={{ fontFamily: D.mono, fontSize: 11, color: D.sub }}>{region}</span>
                    <span style={{ fontFamily: D.mono, fontSize: 10, color: D.muted }}>
                      [{(lesion.x / 100).toFixed(2)}, {(lesion.y / 100).toFixed(2)}]
                    </span>
                    <span style={{
                      fontFamily: D.mono, fontSize: 11, fontWeight: 700,
                      color: lesion.confidence >= 90 ? '#22c55e' : lesion.confidence >= 80 ? D.teal : '#f59e0b',
                    }}>{lesion.confidence}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* helper */
function ToolBtn({ active, onClick, label, accent, icon }) {
  return (
    <button onClick={onClick} style={{
      all: 'unset', cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 5,
      padding: '4px 10px', borderRadius: 5,
      background: active ? (accent ? 'rgba(0,212,170,0.15)' : 'rgba(255,255,255,0.08)') : 'transparent',
      border: `1px solid ${active ? (accent ? 'rgba(0,212,170,0.4)' : 'rgba(255,255,255,0.15)') : 'transparent'}`,
      fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
      color: active ? (accent ? '#00d4aa' : '#e8f4f8') : '#3a5068',
      transition: 'all 0.12s',
    }}>
      {icon && <span style={{ fontSize: 10 }}>{icon}</span>}
      {accent && (
        <span style={{
          width: 12, height: 12, borderRadius: 3,
          background: active ? '#00d4aa' : 'transparent',
          border: `1.5px solid ${active ? '#00d4aa' : '#3a5068'}`,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          {active && <span style={{ fontSize: 8, color: '#06111a', fontWeight: 900 }}>✓</span>}
        </span>
      )}
      {label}
    </button>
  );
}
