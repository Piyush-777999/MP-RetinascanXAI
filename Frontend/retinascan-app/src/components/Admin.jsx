import React, { useState } from 'react';
import { allPatients } from '../data.js';

const EB = {
  forest: '#25351A', olive: '#4C3D12', ivory: '#F4F4E9', sage: '#7D8960',
  celery: '#E3EBC9', grayGreen: '#D0D4C2', ink: '#171812', inkMuted: '#858575',
  hairline: 'rgba(76,61,18,0.15)',
};

const SEV_COLORS = ['#7D8960','#A8A050','#B8863B','#A6552E','#7A2E22'];

export default function Admin({ navigate }) {
  const [cameras,    setCameras]    = useState(20);
  const [dailyScans, setDailyScans] = useState(40);
  const [ophthos,    setOphthos]    = useState(3);
  const [bandwidth,  setBandwidth]  = useState(5);

  const backlogPerDay      = Math.max(0, dailyScans - ophthos * 40);
  const daysToExhaust      = backlogPerDay > 0 ? Math.ceil(200 / backlogPerDay) : '∞';
  const recommendedOphthos = Math.ceil(dailyScans / 40);

  const chartData = Array.from({ length: 7 }, (_, i) => ({
    day: ['Mo','Tu','We','Th','Fr','Sa','Su'][i],
    scans:    Math.round(dailyScans * (0.7 + Math.sin(i) * 0.2)),
    reviewed: Math.round(ophthos * 35 * (0.8 + Math.cos(i) * 0.15)),
  }));
  const maxVal = Math.max(...chartData.map(d => d.scans));

  const sevDist = [0,1,2,3,4].map(sev => ({
    level: sev,
    count: allPatients.filter(p => p.severity === sev).length,
    label: ['G0 · No DR','G1 · Mild','G2 · Moderate','G3 · Severe','G4 · Prolif.'][sev],
    color: SEV_COLORS[sev],
  }));

  function Slider({ label, value, min, max, onChange, unit }) {
    return (
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: EB.inkMuted, fontWeight: 500 }}>{label}</span>
          <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: EB.forest }}>{value}{unit}</span>
        </div>
        <input type="range" min={min} max={max} value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{ width: '100%', accentColor: EB.forest, cursor: 'pointer' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: EB.inkMuted, marginTop: 3 }}>
          <span>{min}{unit}</span><span>{max}{unit}</span>
        </div>
      </div>
    );
  }

  return (
    <main style={{ minHeight: '100vh', background: EB.ivory, color: EB.ink, fontFamily: 'Inter, system-ui, sans-serif', padding: '26px 32px 60px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <button onClick={() => navigate('home')} style={{
              all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 11.5, fontWeight: 600, color: EB.sage, marginBottom: 8,
            }}>← Home</button>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: EB.ink }}>Capacity Analytics</h1>
            <p style={{ margin: '3px 0 0', fontSize: 11.5, color: EB.inkMuted }}>Alwar District · Rajasthan · Simulation</p>
          </div>
          <div style={{ padding: '5px 12px', borderRadius: 5, background: EB.celery, border: `1px solid ${EB.hairline}`, fontSize: 11.5, fontWeight: 700, color: EB.forest }}>
            Admin Console
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20 }}>

          {/* ── Left: Sliders ──────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ padding: '20px', borderRadius: 8, background: '#fff', border: `1px solid ${EB.hairline}`, boxShadow: '0 1px 4px rgba(23,24,18,0.04)' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 700, color: EB.ink }}>Parameters</h3>
              <Slider label="Deployed Cameras"       value={cameras}    min={1}  max={50}  unit=" units" onChange={setCameras}    />
              <Slider label="Daily Scans per Camera" value={dailyScans} min={5}  max={100} unit=" scans" onChange={setDailyScans} />
              <Slider label="Reviewing Ophthalmologists" value={ophthos} min={1}  max={20}  unit=" Dr."  onChange={setOphthos}    />
              <Slider label="Bandwidth"              value={bandwidth}  min={1}  max={50}  unit=" Mbps" onChange={setBandwidth}   />
            </div>

            {/* Recommendation */}
            <div style={{
              padding: '16px 18px', borderRadius: 8,
              background: backlogPerDay > 0 ? 'rgba(166,85,46,0.07)' : 'rgba(125,137,96,0.10)',
              border: `1px solid ${backlogPerDay > 0 ? 'rgba(166,85,46,0.30)' : 'rgba(125,137,96,0.30)'}`,
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: backlogPerDay > 0 ? '#A6552E' : EB.sage, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>
                Capacity Recommendation
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: backlogPerDay > 0 ? '#A6552E' : EB.forest, marginBottom: 6 }}>
                {backlogPerDay > 0 ? `+${backlogPerDay} cases / day backlog` : 'Capacity Sufficient ✓'}
              </div>
              <div style={{ fontSize: 11.5, color: EB.inkMuted, lineHeight: 1.6 }}>
                Need <strong style={{ color: EB.ink }}>{recommendedOphthos} ophthalmologists</strong> for 24h SLA.
                {backlogPerDay > 0 && ` Cache overflow in ~${daysToExhaust} days.`}
              </div>
            </div>

            {/* Severity distribution */}
            <div style={{ padding: '18px', borderRadius: 8, background: '#fff', border: `1px solid ${EB.hairline}` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: EB.ink, marginBottom: 12 }}>District DR Distribution</div>
              {sevDist.map(s => (
                <div key={s.level} style={{ marginBottom: 9 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 3 }}>
                    <span style={{ color: EB.inkMuted }}>{s.label}</span>
                    <span style={{ fontFamily: 'monospace', color: s.color, fontWeight: 700 }}>{s.count}</span>
                  </div>
                  <div style={{ height: 5, background: EB.grayGreen, borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(s.count / allPatients.length) * 100}%`, background: s.color, borderRadius: 2 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: Chart + metrics ─────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ padding: '20px', borderRadius: 8, background: '#fff', border: `1px solid ${EB.hairline}`, boxShadow: '0 1px 4px rgba(23,24,18,0.04)' }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 700, color: EB.ink }}>7-Day Screening Throughput</h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 160, paddingTop: 16, borderBottom: `1px solid ${EB.hairline}` }}>
                {chartData.map((d, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: 6 }}>
                    <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: '100%', width: '100%', justifyContent: 'center' }}>
                      <div style={{ width: '38%', height: `${(d.scans / maxVal) * 85}%`, background: EB.forest, borderRadius: '3px 3px 0 0', opacity: 0.85 }} title={`Scans: ${d.scans}`} />
                      <div style={{ width: '38%', height: `${(d.reviewed / maxVal) * 85}%`, background: EB.sage, borderRadius: '3px 3px 0 0' }} title={`Reviewed: ${d.reviewed}`} />
                    </div>
                    <span style={{ fontSize: 10, color: EB.inkMuted }}>{d.day}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 18, marginTop: 12, fontSize: 11.5 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: EB.forest, fontWeight: 600 }}>
                  <span style={{ width: 10, height: 10, background: EB.forest, borderRadius: 2 }} /> Daily Scans
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: EB.sage, fontWeight: 600 }}>
                  <span style={{ width: 10, height: 10, background: EB.sage, borderRadius: 2 }} /> Specialist Reviews
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { label: 'Model Inference', val: '140 ms/scan', sub: '< 500 ms target · Met', ok: true },
                { label: 'Local Storage', val: '32 MB cached', sub: 'AES-256 encrypted', ok: null },
                { label: 'Model', val: 'ResNet-50', sub: '93.3% sensitivity · MESSIDOR', ok: true },
              ].map((m, i) => (
                <div key={i} style={{ background: '#fff', padding: '16px', borderRadius: 8, border: `1px solid ${EB.hairline}` }}>
                  <div style={{ fontSize: 10.5, color: EB.inkMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>{m.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: EB.ink, marginBottom: 4 }}>{m.val}</div>
                  <div style={{ fontSize: 10.5, color: m.ok ? EB.sage : EB.inkMuted }}>{m.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
