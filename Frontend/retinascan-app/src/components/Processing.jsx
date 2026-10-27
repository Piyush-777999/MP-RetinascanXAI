import React, { useState, useEffect } from 'react';

const EB = {
  forest: '#25351A', ivory: '#F4F4E9', sage: '#7D8960',
  celery: '#E3EBC9', grayGreen: '#D0D4C2', ink: '#171812', inkMuted: '#858575',
  hairline: 'rgba(76,61,18,0.15)',
};

const STEPS = [
  { key: 'prep',  label: 'Preprocessing',          sub: 'CLAHE contrast enhancement · Ben Graham filter', ms: 800 },
  { key: 'infer', label: 'ResNet-50 Classification', sub: 'ICDR grades 0–4 · confidence scoring',           ms: 1100 },
  { key: 'xai',   label: 'Grad-CAM++ + Lesion Map', sub: 'Heatmap · microaneurysms · hemorrhages · exudates', ms: 800 },
];

const KEYFRAMES = `
  @keyframes proc-spin { to { transform: rotate(360deg); } }
  @keyframes proc-fade-up { from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)} }
`;

export default function Processing({ navigate, patient }) {
  const [activeStep, setActiveStep] = useState(0);
  const [doneSteps,  setDoneSteps]  = useState([]);
  const [progress,   setProgress]   = useState(0);

  const patName = patient?.fullName || patient?.name || 'Assessing Scan';

  useEffect(() => {
    const id = 'proc-eb-kf';
    if (!document.getElementById(id)) {
      const s = document.createElement('style'); s.id = id; s.textContent = KEYFRAMES;
      document.head.appendChild(s);
    }
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
    timers.push(setTimeout(() => {
      setProgress(100);
      setTimeout(() => navigate('results'), 350);
    }, totalMs + 400));
    return () => timers.forEach(t => clearTimeout(t));
  }, [navigate]);

  return (
    <div style={{ minHeight: '100vh', background: EB.ivory, color: EB.ink, fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* Title bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 24px', background: '#fff', borderBottom: `1px solid ${EB.hairline}`, flexShrink: 0,
      }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: EB.forest, boxShadow: `0 0 0 3px ${EB.celery}` }} />
        <span style={{ fontSize: 12.5, fontWeight: 700, color: EB.ink }}>AI Diagnostic Engine</span>
        <span style={{ fontSize: 11.5, color: EB.inkMuted }}>Patient: <strong style={{ color: EB.ink }}>{patName}</strong></span>
      </div>

      {/* Center */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '28px 20px', animation: 'proc-fade-up 0.3s ease both' }}>
        <div style={{
          width: '100%', maxWidth: 520,
          background: '#fff', border: `1px solid ${EB.hairline}`,
          borderRadius: 10, boxShadow: '0 4px 20px rgba(23,24,18,0.07)',
          padding: '30px 30px 26px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26,
        }}>

          {/* Circular progress */}
          <div style={{ position: 'relative', width: 96, height: 96 }}>
            <svg width="96" height="96" viewBox="0 0 96 96">
              <circle cx="48" cy="48" r="40" stroke={EB.grayGreen} strokeWidth="7" fill="none"/>
              <circle
                cx="48" cy="48" r="40"
                stroke={EB.forest}
                strokeWidth="7" fill="none"
                strokeDasharray="251"
                strokeDashoffset={251 - (251 * progress) / 100}
                strokeLinecap="round"
                transform="rotate(-90 48 48)"
                style={{ transition: 'stroke-dashoffset 0.2s ease' }}
              />
            </svg>
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: EB.ink, lineHeight: 1 }}>{progress}%</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: EB.inkMuted, letterSpacing: '0.06em', marginTop: 3 }}>ANALYSING</span>
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <h2 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: EB.ink }}>Running AI Analysis</h2>
            <p style={{ margin: 0, fontSize: 11.5, color: EB.inkMuted }}>Classification · Grad-CAM++ · lesion detection</p>
          </div>

          {/* Steps */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {STEPS.map((step, idx) => {
              const isDone = doneSteps.includes(idx);
              const isAct  = activeStep === idx && !isDone;
              return (
                <div key={step.key} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '11px 14px', borderRadius: 7,
                  background: isDone ? EB.celery : isAct ? 'rgba(37,53,26,0.04)' : '#fafaf8',
                  border: `1px solid ${isDone ? EB.sage + '55' : EB.hairline}`,
                  transition: 'all 0.22s',
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isDone ? EB.sage : isAct ? EB.forest : EB.grayGreen,
                    color: '#fff', fontSize: 10, fontWeight: 800,
                    animation: isAct ? 'proc-spin 1.2s linear infinite' : 'none',
                  }}>
                    {isDone ? '✓' : idx + 1}
                  </div>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: EB.ink }}>{step.label}</div>
                    <div style={{ fontSize: 11, color: EB.inkMuted, marginTop: 2 }}>{step.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ fontSize: 10.5, color: EB.inkMuted }}>ResNet-50 · APTOS + MESSIDOR-2 · 93.3% sensitivity</div>
        </div>
      </div>
    </div>
  );
}
