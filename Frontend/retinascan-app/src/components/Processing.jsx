import React, { useState, useEffect } from 'react';

const D = {
  bg:    '#0a0f14', panel: '#111820', border: '#1e2d3d',
  teal:  '#00d4aa', text: '#e8f4f8', sub: '#7a9ab0', muted: '#3a5068',
  mono:  'JetBrains Mono, "Courier New", monospace',
};

const STEPS = [
  { key: 'dicom',   label: 'Loading DICOM packet',             sub: 'Ben Graham normalization · 512×512',        ms: 900  },
  { key: 'infer',   label: 'Running DeepRetina-v4 inference',  sub: 'ResNet-50 · APTOS 2019 fine-tune',          ms: 1200 },
  { key: 'gradcam', label: 'Generating Grad-CAM++ heatmap',    sub: 'Layer4 · Eigen-CAM weighted overlay',       ms: 700  },
];

const KEYFRAMES = `
  @keyframes spin-conic {
    to { transform: rotate(360deg); }
  }
  @keyframes ring-pulse {
    0%, 100% { opacity: 0.3; transform: scale(1); }
    50%       { opacity: 0.6; transform: scale(1.04); }
  }
  @keyframes proc-fade-up {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes step-pop {
    0%   { opacity: 0; transform: translateX(-8px); }
    100% { opacity: 1; transform: translateX(0); }
  }
  @keyframes dot-blink {
    0%, 80%, 100% { opacity: 0.3; }
    40%           { opacity: 1; }
  }
`;

export default function Processing({ navigate, patient }) {
  const [activeStep, setActiveStep] = useState(0);
  const [doneSteps,  setDoneSteps]  = useState([]);
  const [progress,   setProgress]   = useState(0); // 0..100

  const patName = patient?.fullName || patient?.name || 'Loading patient…';

  useEffect(() => {
    const id = 'proc-kf';
    if (!document.getElementById(id)) {
      const s = document.createElement('style'); s.id = id; s.textContent = KEYFRAMES;
      document.head.appendChild(s);
    }

    let stepIdx = 0;
    let elapsed = 0;
    const totalMs = STEPS.reduce((s, st) => s + st.ms, 0);
    const timers = [];

    function advanceStep(i) {
      if (i >= STEPS.length) return;
      setActiveStep(i);
      timers.push(setTimeout(() => {
        setDoneSteps(d => [...d, i]);
        elapsed += STEPS[i].ms;
        setProgress(Math.round((elapsed / totalMs) * 100));
        advanceStep(i + 1);
      }, STEPS[i].ms));
    }

    advanceStep(0);

    // Auto-navigate
    const totalDelay = totalMs + 500;
    timers.push(setTimeout(() => {
      setProgress(100);
      setTimeout(() => navigate('results'), 400);
    }, totalDelay));

    return () => timers.forEach(t => clearTimeout(t));
  }, [navigate]);

  const pct = Math.round(((doneSteps.length) / STEPS.length) * 100);
  const currentStep = STEPS[Math.min(activeStep, STEPS.length - 1)];

  return (
    <div style={{
      minHeight: '100vh', background: D.bg, color: D.text,
      fontFamily: 'Inter, system-ui, sans-serif',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Title bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '8px 20px', background: D.panel, borderBottom: `1px solid ${D.border}`,
        flexShrink: 0,
      }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 6px #f59e0b', animation: 'ring-pulse 1.2s infinite' }} />
        <span style={{ fontFamily: D.mono, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: D.text }}>
          DEEPRETINA-v4 · INFERENCE PIPELINE
        </span>
        <span style={{ fontFamily: D.mono, fontSize: 10, color: D.muted }}>
          Patient: <strong style={{ color: D.sub }}>{patName}</strong>
        </span>
        <div style={{ flex: 1 }} />
        <span style={{ fontFamily: D.mono, fontSize: 10, color: D.muted }}>
          Remidio FOP NM · Offline · Buffer 32MB
        </span>
      </div>

      {/* Center content */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'proc-fade-up 0.3s ease both',
      }}>
        <div style={{ width: 520, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40 }}>

          {/* Pulsating ring + conic sweep */}
          <div style={{ position: 'relative', width: 140, height: 140 }}>
            {/* Outer glow ring */}
            <div style={{
              position: 'absolute', inset: -12, borderRadius: '50%',
              border: '2px solid rgba(0,212,170,0.15)',
              animation: 'ring-pulse 2s infinite',
            }} />
            {/* Conic-gradient spinning ring */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: `conic-gradient(${D.teal} 0%, #f97316 ${pct}%, transparent ${pct}%)`,
              animation: 'spin-conic 2s linear infinite',
              opacity: 0.9,
            }} />
            {/* Inner white mask */}
            <div style={{
              position: 'absolute', inset: 10, borderRadius: '50%',
              background: D.bg,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ fontFamily: D.mono, fontSize: 26, fontWeight: 800, color: D.teal, lineHeight: 1 }}>
                {pct}%
              </div>
              <div style={{ fontFamily: D.mono, fontSize: 9, color: D.muted, marginTop: 4, letterSpacing: '0.08em' }}>
                INFERENCE
              </div>
            </div>
          </div>

          {/* Checklist steps */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {STEPS.map((step, idx) => {
              const isDone   = doneSteps.includes(idx);
              const isActive = activeStep === idx && !isDone;
              return (
                <div key={step.key} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 18px', borderRadius: 10,
                  background: isDone  ? 'rgba(0,212,170,0.06)'
                            : isActive ? 'rgba(255,255,255,0.05)'
                            : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isDone ? 'rgba(0,212,170,0.2)' : isActive ? 'rgba(255,255,255,0.1)' : D.border}`,
                  transition: 'all 0.25s',
                  animation: isActive ? 'step-pop 0.2s ease both' : 'none',
                }}>
                  {/* Status icon */}
                  <span style={{
                    width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13,
                    background: isDone  ? 'rgba(0,212,170,0.2)'
                              : isActive ? 'rgba(245,158,11,0.15)'
                              : 'rgba(255,255,255,0.04)',
                    border: `1.5px solid ${isDone ? D.teal : isActive ? '#f59e0b' : D.border}`,
                    color: isDone ? D.teal : isActive ? '#f59e0b' : D.muted,
                  }}>
                    {isDone ? '✓' : isActive ? '⟳' : '○'}
                  </span>

                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: 13, fontWeight: isDone || isActive ? 700 : 400,
                      color: isDone ? D.text : isActive ? D.text : D.sub,
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                      {step.label}
                      {isActive && (
                        <span style={{ display: 'flex', gap: 3 }}>
                          {[0, 1, 2].map(i => (
                            <span key={i} style={{
                              width: 4, height: 4, borderRadius: '50%', background: '#f59e0b',
                              animation: `dot-blink 1.2s ${i * 0.2}s infinite`,
                              display: 'inline-block',
                            }} />
                          ))}
                        </span>
                      )}
                    </div>
                    <div style={{ fontFamily: D.mono, fontSize: 10, color: D.muted, marginTop: 3 }}>{step.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom progress bar */}
          <div style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontFamily: D.mono, fontSize: 10, color: D.muted }}>Inference pipeline</span>
              <span style={{ fontFamily: D.mono, fontSize: 10, color: D.teal, fontWeight: 700 }}>{pct}% complete</span>
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${pct}%`,
                background: `linear-gradient(90deg, ${D.teal}, #22d3ee)`,
                borderRadius: 2,
                transition: 'width 0.5s ease',
                boxShadow: `0 0 8px ${D.teal}60`,
              }} />
            </div>
            <div style={{ fontFamily: D.mono, fontSize: 10, color: D.muted, marginTop: 8, textAlign: 'center' }}>
              ResNet-50 · APTOS 2019 · Grad-CAM++ XAI · FHIR R4 Ready
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
