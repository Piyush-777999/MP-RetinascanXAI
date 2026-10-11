import React, { useState } from 'react';

const SEV_CONFIG = {
  0: { label: 'Grade 0: No DR',        color: '#15803d', bg: '#dcfce7', border: '#bbf7d0', action: 'Annual screening recall' },
  1: { label: 'Grade 1: Mild NPDR',     color: '#b45309', bg: '#fef3c7', border: '#fde68a', action: 'Review in 6–12 months' },
  2: { label: 'Grade 2: Moderate NPDR', color: '#c2410c', bg: '#ffedd5', border: '#fed7aa', action: 'Specialist triage required' },
  3: { label: 'Grade 3: Severe NPDR',   color: '#b91c1c', bg: '#fee2e2', border: '#fecaca', action: 'Urgent specialist referral' },
  4: { label: 'Grade 4: Proliferative', color: '#991b1b', bg: '#fef2f2', border: '#fca5a5', action: 'Emergency laser / surgery review' },
};

export default function Queue({ navigate, patient, severity = 2, selectedEye = 'od' }) {
  const [activeTab, setActiveTab] = useState('all');

  const currentPatient = {
    id: patient?.id || 'DR-88969',
    name: patient?.fullName || patient?.name || 'Smt. Geeta Sharma',
    age: patient?.age || 58,
    gender: patient?.gender || 'F',
    location: patient?.village || 'Alwar Mobile Camp',
    sev: severity ?? patient?.severity ?? 2,
    conf: patient?.confidence ? `${patient.confidence}%` : '96.4%',
    eye: (selectedEye || 'OD').toUpperCase(),
    status: (severity ?? patient?.severity ?? 2) >= 2 ? 'Needs Referral' : 'Routine Complete',
    isCurrent: true,
  };

  const queuePatients = [
    currentPatient,
    { id: 'DR-88220', name: 'Ram Kishore', age: 64, gender: 'M', location: 'Kishangarh Sub-Center', sev: 0, conf: '98.7%', eye: 'OU', status: 'Routine Complete' },
    { id: 'DR-88221', name: 'Fatima Dawood', age: 49, gender: 'F', location: 'Behror Primary Center', sev: 1, conf: '89.1%', eye: 'OD', status: 'Scheduled Review' },
    { id: 'DR-88225', name: 'Harish Chandra', age: 61, gender: 'M', location: 'Thanagazi Camp', sev: 3, conf: '94.8%', eye: 'OS', status: 'Needs Referral' },
  ];

  const filteredPatients = queuePatients.filter(p => {
    if (activeTab === 'referral') return p.sev >= 2;
    if (activeTab === 'routine') return p.sev < 2;
    return true;
  });

  return (
    <main style={{
      minHeight: '100vh',
      background: '#f8fafc',
      color: '#0f172a',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      padding: '28px 32px 60px',
    }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Top Header & Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <button
                onClick={() => navigate('results')}
                style={{
                  all: 'unset', cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 8,
                  background: '#ffffff', border: '1px solid #cbd5e1',
                  color: '#475569', fontSize: 12, fontWeight: 600,
                  boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
                }}
              >
                ← Back to Results
              </button>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Clinical Triage Worklist
              </h1>
            </div>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
              Primary care tele-ophthalmology screening review & referral management
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => navigate('referral')}
              style={{
                all: 'unset', cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 18px', borderRadius: 8,
                background: '#0284c7', color: '#ffffff',
                fontSize: 13, fontWeight: 600,
                boxShadow: '0 2px 6px rgba(2,132,199,0.2)',
              }}
            >
              📄 Print Referral Slip
            </button>
          </div>
        </div>

        {/* Clinical Operations Banner */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16,
        }}>
          {[
            { label: 'Screened Today', val: queuePatients.length, desc: 'Registered patients' },
            { label: 'Requires Specialist', val: queuePatients.filter(p => p.sev >= 2).length, desc: 'Grade 2, 3, or 4 cases', alert: true },
            { label: 'Inference Speed', val: '140 ms', desc: 'ResNet-50 v2 inference' },
            { label: 'Tele-Triage SLA', val: '< 30 Mins', desc: 'Surgical/laser triage goal' },
          ].map(m => (
            <div key={m.label} style={{
              background: '#ffffff', borderRadius: 12, padding: '16px 20px',
              border: `1px solid ${m.alert ? '#fed7aa' : '#e2e8f0'}`,
              boxShadow: '0 1px 3px rgba(15,23,42,0.03)',
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: m.alert ? '#c2410c' : '#64748b', marginBottom: 4 }}>
                {m.label}
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: m.alert ? '#ea580c' : '#0f172a', marginBottom: 2 }}>
                {m.val}
              </div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{m.desc}</div>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div style={{
          display: 'flex', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 12,
        }}>
          {[
            { key: 'all', label: `All Screened Patients (${queuePatients.length})` },
            { key: 'referral', label: `Needs Specialist Referral (${queuePatients.filter(p => p.sev >= 2).length})` },
            { key: 'routine', label: `Routine / Mild (${queuePatients.filter(p => p.sev < 2).length})` },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                all: 'unset', cursor: 'pointer',
                padding: '8px 16px', borderRadius: 8,
                fontSize: 13, fontWeight: 600,
                color: activeTab === t.key ? '#0284c7' : '#64748b',
                background: activeTab === t.key ? '#f0f9ff' : 'transparent',
                border: activeTab === t.key ? '1px solid #bae6fd' : '1px solid transparent',
                transition: 'all 0.15s ease',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Patients Table Card */}
        <div style={{
          background: '#ffffff', borderRadius: 14, border: '1px solid #e2e8f0',
          boxShadow: '0 1px 4px rgba(15,23,42,0.03)', overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '14px 20px' }}>Patient & ID</th>
                <th style={{ padding: '14px 16px' }}>Demographics</th>
                <th style={{ padding: '14px 16px' }}>Clinic / Camp</th>
                <th style={{ padding: '14px 16px' }}>ICDR Grade</th>
                <th style={{ padding: '14px 16px' }}>AI Confidence</th>
                <th style={{ padding: '14px 16px' }}>Action Protocol</th>
                <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((p, idx) => {
                const conf = SEV_CONFIG[p.sev] || SEV_CONFIG[2];
                return (
                  <tr key={p.id} style={{
                    borderBottom: idx < filteredPatients.length - 1 ? '1px solid #f1f5f9' : 'none',
                    background: p.isCurrent ? '#f0f9ff' : 'transparent',
                    transition: 'background 0.15s',
                  }}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>
                        {p.id} {p.isCurrent && <span style={{ color: '#0284c7', fontWeight: 600 }}>• Active Scan</span>}
                      </div>
                    </td>
                    <td style={{ padding: '16px 16px', color: '#475569' }}>
                      {p.age}Y • {p.gender === 'M' ? 'Male' : 'Female'}
                    </td>
                    <td style={{ padding: '16px 16px', color: '#475569' }}>
                      {p.location}
                    </td>
                    <td style={{ padding: '16px 16px' }}>
                      <span style={{
                        display: 'inline-block', padding: '4px 10px', borderRadius: 6,
                        background: conf.bg, color: conf.color, border: `1px solid ${conf.border}`,
                        fontSize: 11, fontWeight: 700,
                      }}>
                        {conf.label}
                      </span>
                    </td>
                    <td style={{ padding: '16px 16px', fontWeight: 700, color: '#0f172a' }}>
                      {p.conf}
                    </td>
                    <td style={{ padding: '16px 16px', color: '#475569', fontSize: 12 }}>
                      {conf.action}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 8 }}>
                        <button
                          onClick={() => navigate('results')}
                          style={{
                            all: 'unset', cursor: 'pointer',
                            padding: '6px 12px', borderRadius: 6,
                            background: '#ffffff', border: '1px solid #cbd5e1',
                            color: '#0284c7', fontSize: 12, fontWeight: 600,
                          }}
                        >
                          View Results
                        </button>
                        <button
                          onClick={() => navigate('referral')}
                          style={{
                            all: 'unset', cursor: 'pointer',
                            padding: '6px 12px', borderRadius: 6,
                            background: '#f8fafc', border: '1px solid #cbd5e1',
                            color: '#475569', fontSize: 12, fontWeight: 600,
                          }}
                        >
                          Slip
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>
    </main>
  );
}
