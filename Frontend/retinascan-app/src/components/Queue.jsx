import React, { useState } from 'react';

const G = { BG: '#030c14', CARD: 'rgba(255,255,255,0.04)', BORDER: 'rgba(255,255,255,0.08)', TEAL: '#00d4aa', TEXT: '#f0f6ff', SUB: '#8fa3bb', MUTED: '#4d6278' };

const SEV_COLORS = {
  0: { color: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.25)',  dot: '#34d399', label: 'Level 0 — No DR' },
  1: { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.25)',  dot: '#fbbf24', label: 'Level 1 — Mild NPDR' },
  2: { color: '#fb923c', bg: 'rgba(251,146,60,0.1)',  border: 'rgba(251,146,60,0.25)',  dot: '#fb923c', label: 'Level 2 — Moderate NPDR' },
  3: { color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)', dot: '#f87171', label: 'Level 3 — Severe NPDR' },
  4: { color: '#c084fc', bg: 'rgba(192,132,252,0.1)', border: 'rgba(192,132,252,0.25)', dot: '#c084fc', label: 'Level 4 — Proliferative DR' },
};

export default function Queue({ navigate, patient, severity = 2, selectedEye = 'od' }) {
  const [activeTab, setActiveTab] = useState('all');

  const name = patient?.fullName || patient?.name || 'Smt. Geeta Sharma';
  const currentSeverity = severity ?? patient?.severity ?? 2;
  const currentEye = selectedEye?.toUpperCase() || 'OD';
  const sc = SEV_COLORS[currentSeverity] || SEV_COLORS[2];

  const tabs = [
    { key: 'all',       label: 'All Actionable (3)' },
    { key: 'specialist', label: 'Needs Specialist (1)' },
    { key: 'staging',   label: 'Sync Buffer (2)' },
  ];

  const secondaryRows = [
    { init: 'RK', name: 'Ram Kishore',   id: '#DR-88220', age: '64Y / M', loc: 'Kishangarh Sub-Center', hw: 'Tablet Rig #02', sev: 0, conf: '98.7%', status: 'Archived',  statusColor: G.MUTED },
    { init: 'FD', name: 'Fatima Dawood', id: '#DR-88221', age: '49Y / F', loc: 'Behror Mobile Camp',   hw: 'Handheld Unit Delta', sev: 1, conf: '89.1%', status: 'Scheduled', statusColor: '#fbbf24' },
  ];

  const metrics = [
    { icon: 'speed',       label: 'Mean On-Device Time',    val: '140 ms / eye' },
    { icon: 'cloud_sync',  label: 'Local Encrypted Buffer', val: '32 MB Cached' },
    { icon: 'schedule',    label: 'Tele-Review SLA Target', val: '< 30 Minutes', hi: true },
    { icon: 'verified',    label: 'Validated Engine',       val: 'ResNet-50 XAI' },
  ];

  return (
    <main style={{ minHeight: '100vh', paddingTop: 80, paddingBottom: 60, background: G.BG, color: G.TEXT, fontFamily: 'Inter, sans-serif', position: 'relative' }}>
      <div className="dot-grid" style={{ position: 'absolute', inset: 0, opacity: 0.4, pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px', display: 'flex', flexDirection: 'column', gap: 24, position: 'relative', zIndex: 1 }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <button onClick={() => navigate('results')} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10,
            background: G.CARD, border: `1px solid ${G.BORDER}`, color: G.SUB, fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>arrow_back</span>
            Back to Results
          </button>
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { icon: 'satellite_alt', text: 'CAMP_CLUSTER: RAJ-ALWAR-04' },
              { text: 'AUTO-SYNC: 15s' },
            ].map((b, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: G.CARD, border: `1px solid ${G.BORDER}`, fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: G.MUTED }}>
                {b.icon && <span className="material-symbols-outlined" style={{ fontSize: 14, color: G.TEAL }}>{b.icon}</span>}
                {b.text}
              </span>
            ))}
          </div>
        </div>

        {/* Header + tabs */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: G.TEAL, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'JetBrains Mono, monospace' }}>Tele-Ophthalmology Triage Pipeline</span>
              <span style={{ padding: '2px 8px', borderRadius: 10, background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)', fontSize: 10, fontWeight: 700, color: G.TEAL }}>Tier 1 Priority</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h1 style={{ margin: 0, fontFamily: 'Manrope, sans-serif', fontSize: 28, fontWeight: 800, color: G.TEXT, letterSpacing: '-0.01em' }}>Review Queue</h1>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.3)', fontSize: 12, fontWeight: 600, color: '#fb923c' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fb923c', animation: 'pulse 1.5s infinite' }} />
                1 Pending Specialist Sign-Off
              </span>
            </div>
          </div>

          {/* Tab pills */}
          <div style={{ display: 'flex', gap: 3, background: 'rgba(255,255,255,0.04)', border: `1px solid ${G.BORDER}`, borderRadius: 12, padding: 4 }}>
            {tabs.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
                padding: '7px 14px', borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
                background: activeTab === t.key ? 'rgba(0,212,170,0.12)' : 'transparent',
                color: activeTab === t.key ? G.TEAL : G.MUTED,
                boxShadow: activeTab === t.key ? 'inset 0 0 0 1px rgba(0,212,170,0.25)' : 'none',
                transition: 'all 0.15s',
              }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ background: G.CARD, border: `1px solid ${G.BORDER}`, borderRadius: 18, overflow: 'hidden', backdropFilter: 'blur(20px)' }}>
          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 2fr 1fr', gap: 16, padding: '14px 24px', background: 'rgba(255,255,255,0.03)', borderBottom: `1px solid ${G.BORDER}`, fontSize: 10, fontWeight: 600, color: G.MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'JetBrains Mono, monospace' }}>
            <div>Patient Demographics</div>
            <div>Screening Center & Hardware</div>
            <div>AI ICDR Grade</div>
            <div style={{ textAlign: 'right' }}>Action</div>
          </div>

          {/* PRIMARY ROW */}
          <div style={{ borderBottom: `1px solid ${G.BORDER}`, background: 'rgba(0,212,170,0.04)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 2fr 1fr', gap: 16, padding: '20px 24px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span className="material-symbols-outlined" style={{ color: G.TEAL, fontSize: 22 }}>person</span>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: G.TEXT }}>{name}</span>
                    <span style={{ padding: '1px 6px', borderRadius: 5, background: 'rgba(0,212,170,0.15)', border: '1px solid rgba(0,212,170,0.3)', fontSize: 9, fontWeight: 700, color: G.TEAL, fontFamily: 'JetBrains Mono, monospace' }}>ACTIVE</span>
                  </div>
                  <div style={{ fontSize: 11, color: G.MUTED, fontFamily: 'JetBrains Mono, monospace', marginTop: 2 }}>{patient?.id || '#DR-88219'} · {patient?.age || 58}Y / {patient?.gender || 'F'}</div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: G.TEXT }}>{patient?.village || 'PHC Mandawar Center'}</div>
                <div style={{ fontSize: 11, color: G.MUTED, marginTop: 2 }}>Alwar District · Unit Delta</div>
                <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: G.MUTED, marginTop: 2 }}>Forus 3nethra · Macula 45°</div>
              </div>

              <div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 10, background: sc.bg, border: `1px solid ${sc.border}`, fontSize: 12, fontWeight: 700, color: sc.color }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot }} />
                  {sc.label}
                </span>
                <div style={{ fontSize: 11, color: G.MUTED, fontFamily: 'JetBrains Mono, monospace', marginTop: 6 }}>Conf: {patient?.confidence ?? 96.4}% · {currentEye} Active</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => navigate('canvas')} className="btn-teal" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, fontSize: 12 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>folder_open</span>
                  Open Case
                </button>
              </div>
            </div>

            {/* Telemetry snippet */}
            <div style={{ padding: '10px 24px', borderTop: `1px solid ${G.BORDER}`, background: 'rgba(0,212,170,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-outlined" style={{ color: G.TEAL, fontSize: 17 }}>psychology</span>
                <span style={{ fontSize: 12, color: G.MUTED }}><strong style={{ color: G.TEXT }}>AI Telemetry:</strong> Microvascular remodeling detected. Immediate tele-ophthalmology verification recommended.</span>
              </div>
              <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#fb923c', fontWeight: 700 }}>Priority: Within 48 Hours</span>
            </div>
          </div>

          {/* Secondary rows */}
          {secondaryRows.map((row, i) => {
            const rs = SEV_COLORS[row.sev];
            return (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 2fr 1fr', gap: 16, padding: '18px 24px', alignItems: 'center', borderBottom: i === 0 ? `1px solid ${G.BORDER}` : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: G.CARD, border: `1px solid ${G.BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: G.MUTED, fontFamily: 'JetBrains Mono, monospace', flexShrink: 0 }}>{row.init}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: G.TEXT }}>{row.name}</div>
                    <div style={{ fontSize: 11, color: G.MUTED, fontFamily: 'JetBrains Mono, monospace', marginTop: 2 }}>{row.id} · {row.age}</div>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: G.TEXT }}>{row.loc}</div>
                  <div style={{ fontSize: 11, color: G.MUTED, marginTop: 2 }}>{row.hw}</div>
                </div>
                <div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 8, background: rs.bg, border: `1px solid ${rs.border}`, fontSize: 11, fontWeight: 600, color: rs.color }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: rs.dot }} />
                    {rs.label}
                  </span>
                  <div style={{ fontSize: 11, color: G.MUTED, fontFamily: 'JetBrains Mono, monospace', marginTop: 4 }}>Conf: {row.conf}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <span style={{ padding: '5px 12px', borderRadius: 8, background: G.CARD, border: `1px solid ${G.BORDER}`, fontSize: 11, fontWeight: 600, color: row.statusColor }}>{row.status}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Metric tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {metrics.map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderRadius: 14, background: G.CARD, border: `1px solid ${G.BORDER}`, backdropFilter: 'blur(16px)' }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ color: G.TEAL, fontSize: 20 }}>{item.icon}</span>
              </div>
              <div>
                <div style={{ fontSize: 11, color: G.MUTED, marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: item.hi ? G.TEAL : G.TEXT }}>{item.val}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
