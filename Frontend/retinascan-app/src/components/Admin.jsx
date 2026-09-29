import React, { useState } from 'react';
import { allPatients } from '../data.js';

// Admin capacity analytics screen
export default function Admin({ navigate }) {
  const [cameras, setCameras]        = useState(20);
  const [dailyScans, setDailyScans]  = useState(40);
  const [ophthos, setOphthos]        = useState(3);
  const [bandwidth, setBandwidth]    = useState(5);

  const backlogPerDay = Math.max(0, dailyScans - ophthos * 40);
  const daysToExhaust = backlogPerDay > 0 ? Math.ceil(200 / backlogPerDay) : '∞';
  const recommendedOphthos = Math.ceil(dailyScans / 40);

  // Build sparkline data (last 7 days sim)
  const chartData = Array.from({ length: 7 }, (_, i) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    scans: Math.round(dailyScans * (0.7 + Math.sin(i) * 0.2)),
    reviewed: Math.round(ophthos * 35 * (0.8 + Math.cos(i) * 0.15)),
  }));
  const maxVal = Math.max(...chartData.map(d => d.scans));

  // District stats
  const sevDist = [0, 1, 2, 3, 4].map(sev => ({
    level: sev,
    count: allPatients.filter(p => p.severity === sev).length,
    label: ['No DR', 'Mild NPDR', 'Mod. NPDR', 'Severe NPDR', 'Prolif. DR'][sev],
    color: ['#22c55e', '#84cc16', '#f59e0b', '#ea580c', '#dc2626'][sev],
  }));

  function Slider({ label, value, min, max, onChange, unit }) {
    return (
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: '#8fa3bb' }}>{label}</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 700, color: '#00d4aa' }}>{value}{unit}</span>
        </div>
        <input type="range" min={min} max={max} value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{ width: '100%', accentColor: '#00d4aa', cursor: 'pointer' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#4d6278', marginTop: 4 }}>
          <span>{min}{unit}</span><span>{max}{unit}</span>
        </div>
      </div>
    );
  }

  return (
    <main style={{
      minHeight: '100vh', background: '#030c14', color: '#f0f6ff',
      fontFamily: 'Inter, sans-serif', paddingTop: 80, paddingBottom: 60, position: 'relative',
    }}>
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }} />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 40px', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36 }}>
          <div>
            <button onClick={() => navigate('home')} style={{
              all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 12, fontWeight: 600, color: '#8fa3bb', marginBottom: 10,
            }}>
              ← Back to Home
            </button>
            <h1 style={{ margin: 0, fontFamily: 'Manrope, sans-serif', fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', color: '#f0f6ff' }}>
              District Capacity Analytics
            </h1>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: '#4d6278' }}>
              Alwar District · Rajasthan · Model last recalculated on {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.25)', fontSize: 12, fontWeight: 600, color: '#a855f7' }}>
            Admin Panel
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24 }}>

          {/* Left: sliders */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              padding: 24, borderRadius: 16,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <h3 style={{ margin: '0 0 20px', fontSize: 14, fontWeight: 700, color: '#f0f6ff' }}>Capacity Parameters</h3>
              <Slider label="Deployed Cameras"         value={cameras}    min={1}  max={50}  unit=" units" onChange={setCameras} />
              <Slider label="Daily Scans per Camera"   value={dailyScans} min={5}  max={100} unit=" scans" onChange={setDailyScans} />
              <Slider label="Reviewing Ophthalmologists" value={ophthos}  min={1}  max={20}  unit=" Dr." onChange={setOphthos} />
              <Slider label="Network Bandwidth"        value={bandwidth}  min={1}  max={50}  unit=" Mbps" onChange={setBandwidth} />
            </div>

            {/* Recommendation */}
            <div style={{
              padding: 20, borderRadius: 14,
              background: backlogPerDay > 0 ? 'rgba(234,88,12,0.08)' : 'rgba(34,197,94,0.08)',
              border: `1px solid ${backlogPerDay > 0 ? 'rgba(234,88,12,0.3)' : 'rgba(34,197,94,0.25)'}`,
            }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#4d6278', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontFamily: 'JetBrains Mono, monospace' }}>AI Recommendation</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: backlogPerDay > 0 ? '#ea580c' : '#22c55e', marginBottom: 6 }}>
                {backlogPerDay > 0
                  ? `Backlog building: +${backlogPerDay}/day`
                  : `Capacity sufficient ✓`}
              </div>
              <div style={{ fontSize: 12, color: '#8fa3bb', lineHeight: 1.6 }}>
                Recommended: <strong style={{ color: '#00d4aa' }}>{recommendedOphthos} ophthalmologists</strong> to clear backlog within target SLA.
                {backlogPerDay > 0 && ` Backlog exhausts capacity in ~${daysToExhaust} days.`}
              </div>
            </div>

            {/* Severity distribution */}
            <div style={{ padding: 20, borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f6ff', marginBottom: 14 }}>Case Severity Distribution</div>
              {sevDist.map(s => (
                <div key={s.level} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                    <span style={{ color: '#8fa3bb' }}>{s.label}</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', color: s.color, fontWeight: 700 }}>{s.count}</span>
                  </div>
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(s.count / allPatients.length) * 100}%`, background: s.color, borderRadius: 2 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: chart + KPI tiles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* KPI tiles */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { label: 'Total Cameras',       value: cameras,          unit: '',      color: '#00d4aa' },
                { label: 'Daily Capacity',       value: cameras * dailyScans, unit: ' scans', color: '#22d3ee' },
                { label: 'Daily Backlog',        value: backlogPerDay,    unit: '/day',  color: backlogPerDay > 0 ? '#ea580c' : '#22c55e' },
                { label: 'Coverage PHCs',        value: Math.min(cameras * 2, 24), unit: '',  color: '#a855f7' },
              ].map(k => (
                <div key={k.label} style={{ padding: '16px 20px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: 10, color: '#4d6278', marginBottom: 8, fontFamily: 'JetBrains Mono, monospace' }}>{k.label}</div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 26, fontWeight: 800, color: k.color }}>{k.value}<span style={{ fontSize: 13, fontWeight: 400 }}>{k.unit}</span></div>
                </div>
              ))}
            </div>

            {/* SVG Bar Chart */}
            <div style={{ padding: 24, borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#f0f6ff' }}>Weekly Throughput</h3>
                <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#4d6278' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: '#00d4aa', display: 'inline-block' }} /> Scans</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: '#22d3ee60', display: 'inline-block' }} /> Reviewed</span>
                </div>
              </div>

              <svg width="100%" height="200" viewBox={`0 0 ${chartData.length * 100} 200`} preserveAspectRatio="none">
                {chartData.map((d, i) => {
                  const barH = (d.scans / maxVal) * 160;
                  const revH = (d.reviewed / maxVal) * 160;
                  const x = i * 100 + 15;
                  return (
                    <g key={i}>
                      <rect x={x} y={195 - barH} width={30} height={barH} fill="#00d4aa" fillOpacity="0.7" rx="4"/>
                      <rect x={x + 35} y={195 - revH} width={30} height={revH} fill="#22d3ee" fillOpacity="0.35" rx="4"/>
                      <text x={x + 30} y="210" textAnchor="middle" fill="#4d6278" fontSize="11" fontFamily="JetBrains Mono, monospace">{d.day}</text>
                    </g>
                  );
                })}
                {/* Horizontal guide lines */}
                {[0.25, 0.5, 0.75, 1].map(f => (
                  <line key={f} x1="0" y1={195 - f * 160} x2={chartData.length * 100} y2={195 - f * 160}
                    stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 4"/>
                ))}
              </svg>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
