import React, { useState, useEffect } from 'react';

const D = {
  bg:    '#0a0f14', panel: '#111820', border: '#1e2d3d',
  teal:  '#00d4aa', text: '#e8f4f8', sub: '#7a9ab0', muted: '#3a5068',
  mono:  'JetBrains Mono, "Courier New", monospace',
};

const CHECKS = [
  { key: 'focus',  label: 'Focus Quality',    sub: 'Tenengrad Sharpness Variance', duration: 800, score: 94 },
  { key: 'illum',  label: 'Illumination',      sub: 'Ben Graham Normalization',     duration: 900, score: 88 },
  { key: 'fov',    label: 'Field of View',     sub: '45° Posterior Pole Coverage',  duration: 700, score: 97 },
];

const TOTAL_MS = CHECKS.reduce((s, c) => s + c.duration, 0) + 400; // + 400ms hold

const KEYFRAMES = `
  @keyframes bar-fill {
    from { width: 0; }
  }
  @keyframes check-pop {
    0%   { transform: scale(0); opacity: 0; }
    60%  { transform: scale(1.3); }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes iqa-fade-up {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

export default function QualityCheck({ navigate }) {
  // progress[key] = 0..100
  const [progress, setProgress]  = useState({ focus: 0, illum: 0, fov: 0 });
  const [done,     setDone]      = useState({ focus: false, illum: false, fov: false });
  const [allDone,  setAllDone]   = useState(false);

  useEffect(() => {
    const id = 'iqa-keyframes';
    if (!document.getElementById(id)) {
      const s = document.createElement('style'); s.id = id; s.textContent = KEYFRAMES;
      document.head.appendChild(s);
    }

    let offset = 0;
    const timers = [];

    CHECKS.forEach(({ key, duration }, idx) => {
      const start = offset;
      offset += duration;

      // Animate bar from 0 → 100 over `duration`ms using rAF
      timers.push(setTimeout(() => {
        const t0 = performance.now();
        function tick(now) {
          const elapsed = now - t0;
          const pct = Math.min(100, Math.round((elapsed / duration) * 100));
          setProgress(p => ({ ...p, [key]: pct }));
          if (pct < 100) {
            requestAnimationFrame(tick);
          } else {
            setDone(d => ({ ...d, [key]: true }));
          }
        }
        requestAnimationFrame(tick);
      }, start));
    });

    // Auto-advance after all checks complete
    timers.push(setTimeout(() => {
      setAllDone(true);
      setTimeout(() => navigate('processing'), 700);
    }, TOTAL_MS));

    return () => timers.forEach(t => clearTimeout(t));
  }, [navigate]);

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
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: allDone ? '#22c55e' : '#f59e0b', boxShadow: `0 0 6px ${allDone ? '#22c55e' : '#f59e0b'}`, transition: 'all 0.3s' }} />
        <span style={{ fontFamily: D.mono, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: D.text }}>
          IMAGE QUALITY ASSESSMENT · IQA v2.1
        </span>
        <span style={{ fontFamily: D.mono, fontSize: 10, color: D.muted }}>
          {allDone ? 'All checks passed — advancing to inference…' : 'Running automated quality checks…'}
        </span>
      </div>

      {/* Center content */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'iqa-fade-up 0.3s ease both',
      }}>
        <div style={{ width: 560 }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            {/* Pulsing circle */}
            <div style={{ position: 'relative', width: 96, height: 96, margin: '0 auto 24px' }}>
              <div style={{
                width: 96, height: 96, borderRadius: '50%',
                border: `2px solid ${allDone ? '#22c55e' : D.teal}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'border-color 0.5s',
              }}>
                {allDone ? (
                  <span style={{ fontSize: 36, animation: 'check-pop 0.4s ease both' }}>✓</span>
                ) : (
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <circle cx="20" cy="20" r="16" stroke={D.teal} strokeWidth="2" strokeOpacity="0.3"/>
                    <ellipse cx="20" cy="20" rx="8" ry="8" stroke={D.teal} strokeWidth="2"/>
                    <circle cx="20" cy="20" r="3" fill={D.teal}/>
                  </svg>
                )}
              </div>
              {!allDone && (
                <div style={{
                  position: 'absolute', inset: -8,
                  borderRadius: '50%',
                  border: `2px solid ${D.teal}`,
                  opacity: 0.25,
                  animation: 'pin-pulse 1.5s infinite',
                }} />
              )}
            </div>

            <h2 style={{ margin: '0 0 6px', fontFamily: 'Manrope, sans-serif', fontSize: 22, fontWeight: 800, color: D.text }}>
              {allDone ? 'Quality Assessment Complete' : 'Analysing Fundus Image…'}
            </h2>
            <p style={{ margin: 0, fontFamily: D.mono, fontSize: 12, color: D.muted }}>
              Remidio NM-FOP 10 · 512×512 Standard · Ben Graham Normalization
            </p>
          </div>

          {/* Check rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {CHECKS.map(({ key, label, sub, score }, idx) => {
              const pct   = progress[key];
              const isDone = done[key];
              const isActive = !isDone && pct > 0;
              return (
                <div key={key} style={{
                  padding: '18px 20px', borderRadius: 12,
                  background: isDone ? 'rgba(0,212,170,0.05)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isDone ? 'rgba(0,212,170,0.25)' : D.border}`,
                  transition: 'all 0.3s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {/* Status icon */}
                        <span style={{
                          width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: isDone ? 'rgba(0,212,170,0.2)' : isActive ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)',
                          border: `1.5px solid ${isDone ? D.teal : isActive ? '#f59e0b' : D.border}`,
                          fontSize: 11,
                          animation: isDone ? 'check-pop 0.4s ease both' : 'none',
                        }}>
                          {isDone ? '✓' : isActive ? '⟳' : '○'}
                        </span>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: isDone ? D.text : D.sub }}>{label}</div>
                          <div style={{ fontFamily: D.mono, fontSize: 10, color: D.muted, marginTop: 2 }}>{sub}</div>
                        </div>
                      </div>
                    </div>

                    {/* Score */}
                    {isDone && (
                      <div style={{ textAlign: 'right', animation: 'iqa-fade-up 0.3s ease both' }}>
                        <div style={{ fontFamily: D.mono, fontSize: 22, fontWeight: 800, color: D.teal, lineHeight: 1 }}>{score}</div>
                        <div style={{ fontFamily: D.mono, fontSize: 10, color: D.muted, marginTop: 2 }}>{score < 80 ? '⚠ Fair' : '/ 100'}</div>
                      </div>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: isDone ? D.teal : 'linear-gradient(90deg, #00d4aa, #22d3ee)',
                      borderRadius: 2,
                      boxShadow: isDone ? `0 0 8px ${D.teal}60` : 'none',
                      transition: isDone ? 'box-shadow 0.3s, background 0.3s' : 'none',
                    }} />
                  </div>

                  {isActive && (
                    <div style={{ fontFamily: D.mono, fontSize: 10, color: '#f59e0b', marginTop: 6 }}>
                      Processing… {pct}%
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{
            marginTop: 28, textAlign: 'center',
            fontFamily: D.mono, fontSize: 11, color: D.muted, lineHeight: 1.8,
          }}>
            Image Quality Assessment · IQA v2.1 ·{' '}
            <span style={{ color: allDone ? '#22c55e' : D.muted }}>
              {allDone ? 'All checks passed ✓' : 'Running…'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
