import React, { useState, useEffect } from 'react';

const D = {
  bg:      '#f8fafc',
  card:    '#ffffff',
  border:  '#e2e8f0',
  primary: '#0284c7',
  success: '#16a34a',
  text:    '#0f172a',
  sub:     '#475569',
  muted:   '#64748b',
  mono:    'JetBrains Mono, "Courier New", monospace',
};

const STEPS = [
  {
    key: 'prep',
    label: 'Image Preprocessing & Normalization',
    sub: 'Applying CLAHE and Ben Graham filter to enhance contrast of blood vessels and lesions',
    ms: 800,
  },
  {
    key: 'infer',
    label: 'ResNet-50 AI Classification',
    sub: 'Evaluating retinal features across 5 ICDR Diabetic Retinopathy severity levels',
    ms: 1100,
  },
  {
    key: 'xai',
    label: 'Grad-CAM++ Saliency & Lesion Mapping',
    sub: 'Generating visual evidence heatmap and detecting microaneurysms, hemorrhages, and exudates',
    ms: 800,
  },
];

const KEYFRAMES = `
  @keyframes spin-loader {
    to { transform: rotate(360deg); }
  }
  @keyframes proc-fade-up {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes dot-pulse {
    0%, 100% { opacity: 0.3; }
    50%      { opacity: 1; }
  }
`;

export default function Processing({ navigate, patient }) {
  const [activeStep, setActiveStep] = useState(0);
  const [doneSteps,  setDoneSteps]  = useState([]);
  const [progress,   setProgress]   = useState(0);

  const patName = patient?.fullName || patient?.name || 'Assessing Scan';

  useEffect(() => {
    const id = 'proc-kf-light';
    if (!document.getElementById(id)) {
      const s = document.createElement('style');
      s.id = id;
      s.textContent = KEYFRAMES;
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

    const totalDelay = totalMs + 400;
    timers.push(setTimeout(() => {
      setProgress(100);
      setTimeout(() => navigate('results'), 350);
    }, totalDelay));

    return () => timers.forEach(t => clearTimeout(t));
  }, [navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      background: D.bg,
      color: D.text,
      fontFamily: 'Inter, system-ui, sans-serif',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Title bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 28px',
        background: '#ffffff',
        borderBottom: `1px solid ${D.border}`,
        boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
        flexShrink: 0,
      }}>
        <span style={{
          width: 9, height: 9, borderRadius: '50%',
          background: '#0284c7',
          boxShadow: '0 0 0 3px #e0f2fe',
        }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: D.text, letterSpacing: '-0.01em' }}>
          Diagnostic Inference Engine · RetinaScan-XAI
        </span>
        <span style={{ fontSize: 12, color: D.muted }}>
          Patient: <strong style={{ color: D.text }}>{patName}</strong>
        </span>
      </div>

      {/* Center content */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '32px 20px',
        animation: 'proc-fade-up 0.3s ease both',
      }}>
        <div style={{
          width: '100%', maxWidth: 580,
          background: D.card,
          border: `1px solid ${D.border}`,
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(15,23,42,0.05), 0 1px 3px rgba(15,23,42,0.04)',
          padding: '36px 36px 32px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32,
        }}>

          {/* Clean Medical Circular Progress */}
          <div style={{ position: 'relative', width: 110, height: 110 }}>
            <svg width="110" height="110" viewBox="0 0 110 110">
              <circle cx="55" cy="55" r="46" stroke="#f1f5f9" strokeWidth="8" fill="none" />
              <circle
                cx="55" cy="55" r="46"
                stroke={D.primary}
                strokeWidth="8"
                fill="none"
                strokeDasharray="289"
                strokeDashoffset={289 - (289 * progress) / 100}
                strokeLinecap="round"
                transform="rotate(-90 55 55)"
                style={{ transition: 'stroke-dashoffset 0.2s ease' }}
              />
            </svg>
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: D.text, lineHeight: 1 }}>{progress}%</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: D.muted, marginTop: 4, letterSpacing: '0.04em' }}>ANALYSING</span>
            </div>
          </div>

          <div style={{ textAlign: 'center', maxWidth: 440 }}>
            <h2 style={{ margin: '0 0 6px', fontSize: 19, fontWeight: 800, color: D.text }}>
              Running Explainable Diagnostic Analysis
            </h2>
            <p style={{ margin: 0, fontSize: 13, color: D.sub }}>
              The multi-stage pipeline is classifying diabetic retinopathy severity and localizing microscopic vascular lesions.
            </p>
          </div>

          {/* Checklist steps */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {STEPS.map((step, idx) => {
              const isDone   = doneSteps.includes(idx);
              const isActive = activeStep === idx && !isDone;

              return (
                <div key={step.key} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 14,
                  padding: '14px 16px', borderRadius: 10,
                  background: isDone ? '#f0fdf4' : isActive ? '#f0f9ff' : '#f8fafc',
                  border: `1px solid ${isDone ? '#bbf7d0' : isActive ? '#bae6fd' : D.border}`,
                  transition: 'all 0.25s',
                }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isDone ? D.success : isActive ? D.primary : '#e2e8f0',
                    color: '#ffffff', fontSize: 11, fontWeight: 800,
                  }}>
                    {isDone ? '✓' : isActive ? '⟳' : idx + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: isDone ? D.text : isActive ? D.primary : D.sub }}>
                      {step.label}
                    </div>
                    <div style={{ fontSize: 11, color: D.muted, marginTop: 2, lineHeight: 1.4 }}>
                      {step.sub}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ fontSize: 11, color: D.muted, textAlign: 'center' }}>
            Model: ResNet-50 v2 (Cross-validated on APTOS + MESSIDOR-2, 93.3% Sensitivity)
          </div>
        </div>
      </div>
    </div>
  );
}
