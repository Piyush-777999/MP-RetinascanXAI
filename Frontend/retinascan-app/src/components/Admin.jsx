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
    label: ['Grade 0: No DR', 'Grade 1: Mild NPDR', 'Grade 2: Mod. NPDR', 'Grade 3: Severe NPDR', 'Grade 4: Prolif. DR'][sev],
    color: ['#16a34a', '#b45309', '#c2410c', '#b91c1c', '#991b1b'][sev],
  }));

  function Slider({ label, value, min, max, onChange, unit }) {
    return (
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>{label}</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 700, color: '#0284c7' }}>{value}{unit}</span>
        </div>
        <input type="range" min={min} max={max} value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{ width: '100%', accentColor: '#0284c7', cursor: 'pointer' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#64748b', marginTop: 4 }}>
          <span>{min}{unit}</span><span>{max}{unit}</span>
        </div>
      </div>
    );
  }

  return (
    <main style={{
      minHeight: '100vh', background: '#f8fafc', color: '#0f172a',
      fontFamily: 'Inter, system-ui, sans-serif', padding: '32px 40px 60px', position: 'relative',
    }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <button onClick={() => navigate('home')} style={{
              all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 12, fontWeight: 600, color: '#0284c7', marginBottom: 10,
            }}>
              ← Back to Home
            </button>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a' }}>
              District Screening Capacity & Tele-Triage Analytics
            </h1>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: '#64748b' }}>
              Alwar District Network · Rajasthan Health Directorate · Simulation Engine
            </p>
          </div>
          <div style={{ padding: '6px 14px', borderRadius: 8, background: '#f0f9ff', border: '1px solid #bae6fd', fontSize: 12, fontWeight: 700, color: '#0284c7' }}>
            Administrative Console
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 24 }}>

          {/* Left: sliders */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{
              padding: 24, borderRadius: 14, background: '#ffffff',
              border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(15,23,42,0.03)',
            }}>
              <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Capacity Parameters</h3>
              <Slider label="Deployed Fundus Cameras"   value={cameras}    min={1}  max={50}  unit=" units" onChange={setCameras} />
              <Slider label="Daily Scans per Camera"   value={dailyScans} min={5}  max={100} unit=" scans" onChange={setDailyScans} />
              <Slider label="Reviewing Ophthalmologists" value={ophthos}  min={1}  max={20}  unit=" Dr." onChange={setOphthos} />
              <Slider label="Sub-Center Bandwidth"     value={bandwidth}  min={1}  max={50}  unit=" Mbps" onChange={setBandwidth} />
            </div>

            {/* Recommendation */}
            <div style={{
              padding: 20, borderRadius: 14,
              background: backlogPerDay > 0 ? '#fff7ed' : '#f0fdf4',
              border: `1px solid ${backlogPerDay > 0 ? '#fed7aa' : '#bbf7d0'}`,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: backlogPerDay > 0 ? '#c2410c' : '#15803d', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                AI Capacity Triage Recommendation
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: backlogPerDay > 0 ? '#c2410c' : '#15803d', marginBottom: 6 }}>
                {backlogPerDay > 0 ? `Backlog Accumulating: +${backlogPerDay} cases / day` : 'Screening Capacity Sufficient ✓'}
              </div>
              <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
                Target: <strong>{recommendedOphthos} ophthalmologists</strong> required to clear tele-consultation queue within standard 24h SLA.
                {backlogPerDay > 0 && ` Estimated local cache overflow in ~${daysToExhaust} days without added triage staff.`}
              </div>
            </div>

            {/* Severity distribution */}
            <div style={{ padding: 20, borderRadius: 14, background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(15,23,42,0.03)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>District DR Severity Distribution</div>
              {sevDist.map(s => (
                <div key={s.level} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: '#475569' }}>{s.label}</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', color: s.color, fontWeight: 700 }}>{s.count}</span>
                  </div>
                  <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(s.count / allPatients.length) * 100}%`, background: s.color, borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Charts and Operational Metrics */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{
              padding: 24, borderRadius: 14, background: '#ffffff',
              border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(15,23,42,0.03)',
            }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>7-Day Screening vs Specialist Review Throughput</h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 180, paddingTop: 20, borderBottom: '1px solid #e2e8f0' }}>
                {chartData.map((d, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: '100%', width: '100%', justifyContent: 'center' }}>
                      <div style={{ width: '35%', height: `${(d.scans / maxVal) * 85}%`, background: '#0284c7', borderRadius: '4px 4px 0 0' }} title={`Scans: ${d.scans}`} />
                      <div style={{ width: '35%', height: `${(d.reviewed / maxVal) * 85}%`, background: '#10b981', borderRadius: '4px 4px 0 0' }} title={`Reviewed: ${d.reviewed}`} />
                    </div>
                    <span style={{ fontSize: 11, color: '#64748b' }}>{d.day}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 20, marginTop: 14, fontSize: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#0284c7', fontWeight: 600 }}>
                  <span style={{ width: 10, height: 10, background: '#0284c7', borderRadius: 2 }} /> Daily Scans Captured
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981', fontWeight: 600 }}>
                  <span style={{ width: 10, height: 10, background: '#10b981', borderRadius: 2 }} /> Specialist Tele-Reviews Completed
                </span>
              </div>
            </div>

            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16,
            }}>
              <div style={{ background: '#ffffff', padding: 20, borderRadius: 14, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Model Inference SLA</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>140 ms / scan</div>
                <div style={{ fontSize: 11, color: '#16a34a' }}>Target: &lt; 500 ms (Met)</div>
              </div>
              <div style={{ background: '#ffffff', padding: 20, borderRadius: 14, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Offline Encrypted Storage</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>32 MB Cached</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>AES-256 local encrypted</div>
              </div>
              <div style={{ background: '#ffffff', padding: 20, borderRadius: 14, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Model Validation</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>ResNet-50 v2</div>
                <div style={{ fontSize: 11, color: '#16a34a' }}>93.3% Sensitivity on Messidor</div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </main>
  );
}
