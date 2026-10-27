import React from 'react';
import { allPatients } from '../data.js';

const screeningsToday = allPatients.length;
const pendingReview   = allPatients.filter(p => p.severity >= 2).length;
const normalCases     = allPatients.filter(p => p.severity < 2).length;
const urgentCases     = allPatients.filter(p => p.severity >= 3).length;

const EB = {
  forest:    '#25351A',
  olive:     '#4C3D12',
  ivory:     '#F4F4E9',
  sage:      '#7D8960',
  celery:    '#E3EBC9',
  grayGreen: '#D0D4C2',
  ink:       '#171812',
  inkMuted:  '#858575',
  hairline:  '1px solid rgba(76,61,18,0.14)',
};

const MODULES = [
  {
    key: 'upload',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/>
      </svg>
    ),
    tag: 'Intake',
    title: 'Patient Intake',
    desc: 'Upload fundus scan · automated quality check',
    action: 'Open →',
  },
  {
    key: 'queue',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
      </svg>
    ),
    tag: 'Triage',
    title: 'Patient Queue',
    desc: `${screeningsToday} patients · sorted by urgency`,
    action: 'View →',
  },
  {
    key: 'canvas',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/>
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
      </svg>
    ),
    tag: 'Imaging',
    title: 'Diagnostic Canvas',
    desc: 'Grad-CAM++ heatmap · pan & zoom · Red-Free',
    action: 'Launch →',
  },
  {
    key: 'referral',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>
      </svg>
    ),
    tag: 'Reports',
    title: 'Referral Letters',
    desc: 'Print-ready · multilingual patient counseling',
    action: 'Open →',
  },
];

const STATS = [
  { label: 'Today',    val: screeningsToday, sub: 'screenings' },
  { label: 'Referral', val: pendingReview,   sub: 'grade ≥ 2' },
  { label: 'Urgent',   val: urgentCases,     sub: 'grade 3–4' },
  { label: 'Routine',  val: normalCases,     sub: 'grade 0–1' },
];

export default function Home({ navigate }) {
  const now     = new Date();
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const dateStr = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <main style={{ minHeight: '100vh', background: EB.ivory, fontFamily: 'Inter, system-ui, sans-serif', color: EB.ink }}>

      {/* ── Top bar ────────────────────────────────────────────────────── */}
      <header style={{ background: EB.forest, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '13px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <ellipse cx="11" cy="11" rx="9.5" ry="6.2" stroke="#E3EBC9" strokeWidth="1.5"/>
              <circle cx="11" cy="11" r="3" stroke="#E3EBC9" strokeWidth="1.5"/>
              <circle cx="11" cy="11" r="1.2" fill="#E3EBC9"/>
            </svg>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#F4F4E9', letterSpacing: '-0.02em' }}>RetinaScan XAI</div>
              <div style={{ fontSize: 10, color: 'rgba(244,244,233,0.5)', fontWeight: 500 }}>DR Screening Workstation</div>
            </div>
          </div>
          {/* Date/time + status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#F4F4E9' }}>{timeStr}</div>
              <div style={{ fontSize: 10, color: 'rgba(244,244,233,0.5)' }}>{dateStr}</div>
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(125,137,96,0.22)', border: '1px solid rgba(125,137,96,0.40)',
              padding: '5px 10px', borderRadius: 5, fontSize: 10.5, fontWeight: 700, color: '#E3EBC9',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#7D8960', flexShrink: 0 }}/>
              ResNet-50 · Active
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero strip ─────────────────────────────────────────────────── */}
      <div style={{ background: EB.celery, borderBottom: EB.hairline, padding: '20px 28px' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: EB.sage, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
              Point-of-Care Edition
            </div>
            <h1 style={{ fontSize: 21, fontWeight: 800, color: EB.ink, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
              DR Screening &amp; Triage Dashboard
            </h1>
            <p style={{ fontSize: 12.5, color: EB.inkMuted, margin: 0 }}>
              ICDR grades 0–4 · ETDRS foveal profiling · multilingual counseling
            </p>
          </div>
          <button
            onClick={() => navigate('upload')}
            style={{
              all: 'unset', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 22px', borderRadius: 6,
              background: EB.forest, color: EB.ivory,
              fontSize: 13, fontWeight: 700,
              transition: 'opacity 0.14s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            New Patient Scan →
          </button>
        </div>
      </div>

      {/* ── Main content ───────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '28px 28px 60px' }}>

        {/* Stats strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
          {STATS.map((s, i) => (
            <div key={i} style={{
              background: '#ffffff', border: EB.hairline, borderRadius: 6,
              padding: '14px 18px',
              boxShadow: '0 1px 4px rgba(23,24,18,0.05)',
            }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, color: EB.inkMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: EB.ink, letterSpacing: '-0.03em', lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 11, color: EB.inkMuted, marginTop: 4 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Section header */}
        <div style={{ marginBottom: 14 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: EB.inkMuted, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Modules</h2>
        </div>

        {/* Module cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          {MODULES.map(mod => (
            <div
              key={mod.key}
              onClick={() => navigate(mod.key)}
              style={{
                background: '#ffffff', border: EB.hairline, borderRadius: 7,
                padding: '20px', cursor: 'pointer',
                display: 'flex', flexDirection: 'column',
                transition: 'box-shadow 0.14s ease, border-color 0.14s ease',
                boxShadow: '0 1px 4px rgba(23,24,18,0.05)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(37,53,26,0.10)';
                e.currentTarget.style.borderColor = 'rgba(76,61,18,0.30)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = '0 1px 4px rgba(23,24,18,0.05)';
                e.currentTarget.style.borderColor = 'rgba(76,61,18,0.14)';
              }}
            >
              <div style={{
                width: 38, height: 38, borderRadius: 7,
                background: EB.celery, color: EB.forest,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 12,
              }}>
                {mod.icon}
              </div>
              <div style={{ fontSize: 9.5, fontWeight: 700, color: EB.sage, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{mod.tag}</div>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: EB.ink, marginBottom: 5 }}>{mod.title}</div>
              <div style={{ fontSize: 11.5, color: EB.inkMuted, lineHeight: 1.5, marginBottom: 14 }}>{mod.desc}</div>
              <div style={{ marginTop: 'auto', fontSize: 12, fontWeight: 700, color: EB.forest }}>{mod.action}</div>
            </div>
          ))}
        </div>

        {/* Footer tip */}
        <div style={{ marginTop: 32, padding: '12px 16px', background: EB.celery, borderRadius: 6, border: EB.hairline, fontSize: 11.5, color: EB.inkMuted }}>
          <strong style={{ color: EB.ink }}>Tip:</strong> Press <kbd style={{ fontFamily: 'monospace', background: '#fff', border: EB.hairline, padding: '1px 5px', borderRadius: 3 }}>Ctrl+Shift+R</kbd> to reset the demo session.
        </div>
      </div>
    </main>
  );
}
