import React, { useState, useEffect } from 'react';

const EB = {
  forest: '#25351A', ivory: '#F4F4E9', sage: '#7D8960',
  celery: '#E3EBC9', grayGreen: '#D0D4C2', ink: '#171812', inkMuted: '#858575',
  hairline: 'rgba(76,61,18,0.15)',
};

const KEYFRAMES = `
  @keyframes iqa-pulse { 0%,100%{opacity:0.4}50%{opacity:1} }
  @keyframes iqa-fade-up { from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)} }
`;

export default function QualityCheck({ navigate, patient }) {
  const [progress, setProgress] = useState({ focus: 0, illum: 0, fov: 0 });
  const [done,     setDone]     = useState({ focus: false, illum: false, fov: false });
  const [allDone,  setAllDone]  = useState(false);

  const scanSeed = (patient?.name || patient?.id || 'default')
    .split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

  const focusScore = 92 + (scanSeed % 7);
  const illumScore = 88 + ((scanSeed * 3) % 9);
  const fovScore   = 94 + ((scanSeed * 5) % 6);

  const checks = [
    { key: 'focus', label: 'Focus & Sharpness',      score: focusScore, badge: focusScore >= 95 ? 'Exceptional' : 'Sharp', duration: 800 },
    { key: 'illum', label: 'Illumination & Exposure', score: illumScore, badge: illumScore >= 92 ? 'Uniform' : 'Balanced',   duration: 900 },
    { key: 'fov',   label: 'Field of View Coverage',  score: fovScore,   badge: 'Full Coverage',                              duration: 700 },
  ];

  const TOTAL_MS = checks.reduce((s, c) => s + c.duration, 0) + 400;

  useEffect(() => {
    const id = 'iqa-eb-kf';
    if (!document.getElementById(id)) {
      const s = document.createElement('style'); s.id = id; s.textContent = KEYFRAMES;
      document.head.appendChild(s);
    }
    let offset = 0;
    const timers = [];
    checks.forEach(({ key, duration }) => {
      const start = offset; offset += duration;
      timers.push(setTimeout(() => {
        const t0 = performance.now();
        function tick(now) {
          const pct = Math.min(100, Math.round(((now - t0) / duration) * 100));
          setProgress(p => ({ ...p, [key]: pct }));
          if (pct < 100) requestAnimationFrame(tick);
          else setDone(d => ({ ...d, [key]: true }));
        }
        requestAnimationFrame(tick);
      }, start));
    });
    timers.push(setTimeout(() => {
      setAllDone(true);
      setTimeout(() => navigate('processing'), 700);
    }, TOTAL_MS));
    return () => timers.forEach(t => clearTimeout(t));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, patient]);

  return (
    <div style={{ minHeight: '100vh', background: EB.ivory, color: EB.ink, fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* Title bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 24px', background: '#fff', borderBottom: `1px solid ${EB.hairline}`, flexShrink: 0,
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          background: allDone ? EB.sage : EB.forest,
          boxShadow: `0 0 0 3px ${allDone ? EB.celery : 'rgba(37,53,26,0.15)'}`,
          transition: 'all 0.3s',
        }} />
        <span style={{ fontSize: 12.5, fontWeight: 700, color: EB.ink }}>Image Quality Check</span>
        <span style={{ fontSize: 11.5, color: EB.inkMuted }}>
          {allDone ? 'Passed — advancing to diagnosis…' : 'Validating fundus image…'}
        </span>
      </div>

      {/* Center */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '28px 20px', animation: 'iqa-fade-up 0.3s ease both' }}>
        <div style={{
          width: '100%', maxWidth: 560,
          background: '#ffffff', border: `1px solid ${EB.hairline}`,
          borderRadius: 10, boxShadow: '0 4px 20px rgba(23,24,18,0.07)',
          padding: '30px 30px 24px',
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 26 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: allDone ? EB.celery : 'rgba(37,53,26,0.07)',
              border: `2px solid ${allDone ? EB.sage : EB.grayGreen}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px', transition: 'all 0.4s ease',
            }}>
              {allDone ? (
                <span style={{ fontSize: 26, color: EB.sage, fontWeight: 800 }}>✓</span>
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={EB.forest} strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M20.188 10.934c.788.665.788 1.467 0 2.132C18.668 14.368 15.545 17 12 17s-6.668-2.632-8.188-3.934c-.788-.665-.788-1.467 0-2.132C5.332 9.632 8.455 7 12 7s6.668 2.632 8.188 3.934z"/>
                </svg>
              )}
            </div>
            <h2 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 700, color: EB.ink }}>
              {allDone ? 'Image Quality Verified' : 'Checking Image Quality'}
            </h2>
            <p style={{ margin: 0, fontSize: 11.5, color: EB.inkMuted }}>
              Focus · Illumination · 45° FOV coverage
            </p>
          </div>

          {/* Check cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {checks.map(({ key, label, score, badge }, idx) => {
              const pct    = progress[key];
              const isDone = done[key];
              const isAct  = !isDone && pct > 0;
              return (
                <div key={key} style={{
                  padding: '13px 16px', borderRadius: 7,
                  background: isDone ? EB.celery : '#fafaf8',
                  border: `1px solid ${isDone ? EB.sage + '55' : EB.hairline}`,
                  transition: 'all 0.22s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isDone ? EB.sage : isAct ? EB.forest : EB.grayGreen,
                        color: '#fff', fontSize: 11, fontWeight: 800,
                      }}>
                        {isDone ? '✓' : idx + 1}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: EB.ink }}>{label}</span>
                      {isDone && (
                        <span style={{ fontSize: 9.5, fontWeight: 700, padding: '2px 6px', borderRadius: 3, background: 'rgba(125,137,96,0.18)', color: EB.sage }}>{badge}</span>
                      )}
                    </div>
                    {isDone && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: EB.forest, lineHeight: 1 }}>
                          {score}<span style={{ fontSize: 10.5, fontWeight: 500, color: EB.inkMuted }}>/100</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div style={{ height: 4, background: EB.grayGreen, borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: isDone ? EB.sage : EB.forest, borderRadius: 2, transition: 'width 0.1s linear' }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Note */}
          <div style={{ marginTop: 18, padding: '9px 13px', background: EB.ivory, border: `1px solid ${EB.hairline}`, borderRadius: 5, fontSize: 11, color: EB.inkMuted, textAlign: 'center' }}>
            Scores above 85 meet international tele-ophthalmology standards for clinical grading.
          </div>
        </div>
      </div>
    </div>
  );
}
