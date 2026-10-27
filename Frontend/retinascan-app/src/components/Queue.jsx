import React, { useState } from 'react';
import { demoPresets } from '../data.js';

const EB = {
  forest: '#25351A', olive: '#4C3D12', ivory: '#F4F4E9', sage: '#7D8960',
  celery: '#E3EBC9', grayGreen: '#D0D4C2', ink: '#171812', inkMuted: '#858575',
  hairline: 'rgba(76,61,18,0.15)',
};

const SEV = [
  { color: '#7D8960', bg: 'rgba(125,137,96,0.12)', border: 'rgba(125,137,96,0.30)', label: 'G0 · No DR',       action: 'Annual recall' },
  { color: '#A8A050', bg: 'rgba(168,160,80,0.12)', border: 'rgba(168,160,80,0.30)', label: 'G1 · Mild',        action: '6–12 month review' },
  { color: '#B8863B', bg: 'rgba(184,134,59,0.12)', border: 'rgba(184,134,59,0.30)', label: 'G2 · Moderate',    action: 'Specialist triage' },
  { color: '#A6552E', bg: 'rgba(166,85,46,0.12)',  border: 'rgba(166,85,46,0.30)',  label: 'G3 · Severe',      action: 'Urgent referral' },
  { color: '#7A2E22', bg: 'rgba(122,46,34,0.12)',  border: 'rgba(122,46,34,0.30)',  label: 'G4 · Prolif.',     action: 'Emergency review' },
];

export default function Queue({
  navigate,
  patient,
  severity = 2,
  selectedEye = 'od',
  scannedPatients = [],
  onSelectPatient,
  clearScannedPatients,
}) {
  const [activeTab, setActiveTab] = useState('all');

  const scannedList = (scannedPatients || []).map(p => {
    const isCurr = p.id === patient?.id || (p.id && p.id.replace('#', '') === patient?.id?.replace('#', ''));
    return {
      id: p.id ? p.id.replace('#', '') : 'DR-SCAN',
      rawId: p.id,
      name: p.fullName || p.name || 'Scanned Patient',
      age: p.age || 55,
      gender: p.gender || 'M',
      location: p.village || 'PHC Live Intake',
      sev: p.severity ?? 2,
      conf: p.confidence != null ? `${p.confidence}%` : '96.4%',
      eye: (p.eye || p.selectedEye || selectedEye || 'OD').toUpperCase(),
      status: (p.severity ?? 2) >= 2 ? 'Referral' : 'Routine',
      isCurrent: isCurr,
      isScanned: true,
      scannedAt: p.scannedAt || 'Today',
      rawPatient: p,
    };
  });

  const presetList = demoPresets
    .filter(p => !scannedList.some(s => s.id === p.id.replace('#', '')))
    .map(p => {
      const isCurr = p.id === patient?.id || p.id.replace('#', '') === patient?.id?.replace('#', '');
      return {
        id: p.id.replace('#', ''),
        rawId: p.id,
        name: p.fullName || p.name,
        age: p.age,
        gender: p.gender,
        location: p.village,
        sev: p.severity,
        conf: `${p.confidence}%`,
        eye: 'OD',
        status: p.severity >= 2 ? 'Referral' : 'Routine',
        isCurrent: isCurr,
        isScanned: false,
        rawPatient: p,
      };
    });

  // Ensure current active patient is in the list even if not in scannedList or presetList
  let queuePatients = [...scannedList, ...presetList];
  const hasCurrent = queuePatients.some(p => p.isCurrent);
  if (!hasCurrent && patient) {
    const curr = {
      id: patient?.id ? patient.id.replace('#', '') : 'DR-ACTIVE',
      rawId: patient?.id,
      name: patient?.fullName || patient?.name || 'Active Patient',
      age: patient?.age || 55,
      gender: patient?.gender || 'M',
      location: patient?.village || 'PHC Live Intake',
      sev: severity ?? patient?.severity ?? 2,
      conf: patient?.confidence != null ? `${patient.confidence}%` : '96.4%',
      eye: (selectedEye || patient?.eye || 'OD').toUpperCase(),
      status: (severity ?? patient?.severity ?? 2) >= 2 ? 'Referral' : 'Routine',
      isCurrent: true,
      isScanned: !!patient?.isScanned,
      rawPatient: patient,
    };
    queuePatients.unshift(curr);
  }

  const filtered = queuePatients.filter(p => {
    if (activeTab === 'referral') return p.sev >= 2;
    if (activeTab === 'routine')  return p.sev < 2;
    return true;
  });

  return (
    <main style={{ minHeight: '100vh', background: EB.ivory, color: EB.ink, fontFamily: 'Inter, system-ui, sans-serif', padding: '22px 28px 60px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => navigate('results')} style={{
              all: 'unset', cursor: 'pointer',
              padding: '5px 11px', borderRadius: 5,
              background: '#fff', border: `1px solid ${EB.hairline}`,
              color: EB.inkMuted, fontSize: 11.5, fontWeight: 600,
            }}>← Results</button>
            <h1 style={{ fontSize: 17, fontWeight: 700, color: EB.ink, margin: 0 }}>Triage Queue</h1>
            {scannedList.length > 0 && (
              <span style={{
                fontSize: 11, background: EB.celery, color: EB.forest,
                padding: '2px 8px', borderRadius: 4, border: `1px solid ${EB.sage}44`, fontWeight: 600,
              }}>
                {scannedList.length} stored locally
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {scannedList.length > 0 && clearScannedPatients && (
              <button
                onClick={() => {
                  if (window.confirm('Clear all locally saved scan records?')) {
                    clearScannedPatients();
                  }
                }}
                style={{
                  all: 'unset', cursor: 'pointer',
                  padding: '7px 12px', borderRadius: 5,
                  background: '#fff', border: '1px solid rgba(122,46,34,0.3)',
                  color: '#7A2E22', fontSize: 11.5, fontWeight: 600,
                }}
              >
                🗑 Clear History
              </button>
            )}
            <button onClick={() => navigate('referral')} style={{
              all: 'unset', cursor: 'pointer',
              padding: '8px 16px', borderRadius: 5,
              background: EB.forest, color: EB.ivory,
              fontSize: 12, fontWeight: 700,
            }}>📄 Referral Slip</button>
          </div>
        </div>

        {/* Stats strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {[
            { label: 'Total', val: queuePatients.length,                          sub: 'in worklist' },
            { label: 'Referral', val: queuePatients.filter(p => p.sev >= 2).length, sub: 'grade ≥ 2' },
            { label: 'Saved Scans', val: scannedList.length,                       sub: 'offline local' },
            { label: 'SLA Target', val: '< 30 min',                               sub: 'triage SLA' },
          ].map((m, i) => (
            <div key={i} style={{ background: '#fff', border: `1px solid ${EB.hairline}`, borderRadius: 6, padding: '12px 16px', boxShadow: '0 1px 3px rgba(23,24,18,0.04)' }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, color: EB.inkMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>{m.label}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: EB.ink, lineHeight: 1 }}>{m.val}</div>
              <div style={{ fontSize: 11, color: EB.inkMuted, marginTop: 3 }}>{m.sub}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6, borderBottom: `1px solid ${EB.hairline}`, paddingBottom: 10 }}>
          {[
            { key: 'all',      label: `All (${queuePatients.length})` },
            { key: 'referral', label: `Referral (${queuePatients.filter(p => p.sev >= 2).length})` },
            { key: 'routine',  label: `Routine (${queuePatients.filter(p => p.sev < 2).length})` },
          ].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
              all: 'unset', cursor: 'pointer',
              padding: '6px 14px', borderRadius: 5,
              fontSize: 12, fontWeight: 600,
              color: activeTab === t.key ? EB.forest : EB.inkMuted,
              background: activeTab === t.key ? EB.celery : 'transparent',
              border: `1px solid ${activeTab === t.key ? EB.sage + '66' : 'transparent'}`,
              transition: 'all 0.13s ease',
            }}>{t.label}</button>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: '#fff', border: `1px solid ${EB.hairline}`, borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 4px rgba(23,24,18,0.04)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead>
              <tr style={{ background: EB.ivory, borderBottom: `1px solid ${EB.hairline}`, color: EB.inkMuted, fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '11px 18px', textAlign: 'left' }}>Patient</th>
                <th style={{ padding: '11px 14px', textAlign: 'left' }}>Demographics</th>
                <th style={{ padding: '11px 14px', textAlign: 'left' }}>Location</th>
                <th style={{ padding: '11px 14px', textAlign: 'left' }}>Grade</th>
                <th style={{ padding: '11px 14px', textAlign: 'left' }}>Conf.</th>
                <th style={{ padding: '11px 14px', textAlign: 'left' }}>Protocol</th>
                <th style={{ padding: '11px 18px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, idx) => {
                const cfg = SEV[p.sev] || SEV[2];
                return (
                  <tr key={`${p.id}-${idx}`} style={{
                    borderBottom: idx < filtered.length - 1 ? `1px solid ${EB.hairline}` : 'none',
                    background: p.isCurrent ? EB.celery + '66' : 'transparent',
                  }}>
                    <td style={{ padding: '13px 18px' }}>
                      <div style={{ fontWeight: 700, color: EB.ink, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{p.name}</span>
                        {p.isScanned && (
                          <span style={{
                            fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3,
                            background: EB.celery, color: EB.forest, border: `1px solid ${EB.sage}55`,
                          }}>
                            Local Scan
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 10, color: EB.inkMuted, fontFamily: 'monospace', marginTop: 1 }}>
                        {p.id}{p.isCurrent && <span style={{ color: EB.sage, fontWeight: 700 }}> · Active</span>}
                      </div>
                    </td>
                    <td style={{ padding: '13px 14px', color: EB.inkMuted }}>{p.age}Y · {p.gender === 'M' ? 'M' : 'F'} · {p.eye}</td>
                    <td style={{ padding: '13px 14px', color: EB.inkMuted }}>{p.location}</td>
                    <td style={{ padding: '13px 14px' }}>
                      <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: 4, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontSize: 10.5, fontWeight: 700 }}>
                        {cfg.label}
                      </span>
                    </td>
                    <td style={{ padding: '13px 14px', fontWeight: 700, color: EB.ink }}>{p.conf}</td>
                    <td style={{ padding: '13px 14px', color: EB.inkMuted, fontSize: 11.5 }}>{cfg.action}</td>
                    <td style={{ padding: '13px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          onClick={() => {
                            if (onSelectPatient) onSelectPatient(p.rawPatient || p);
                            navigate('results');
                          }}
                          style={{
                            all: 'unset', cursor: 'pointer',
                            padding: '5px 11px', borderRadius: 5,
                            background: '#fff', border: `1px solid ${EB.hairline}`,
                            color: EB.forest, fontSize: 11.5, fontWeight: 700,
                            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                          }}
                        >
                          Results
                        </button>
                        <button
                          onClick={() => {
                            if (onSelectPatient) onSelectPatient(p.rawPatient || p);
                            navigate('referral');
                          }}
                          style={{
                            all: 'unset', cursor: 'pointer',
                            padding: '5px 11px', borderRadius: 5,
                            background: EB.ivory, border: `1px solid ${EB.hairline}`,
                            color: EB.inkMuted, fontSize: 11.5, fontWeight: 600,
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
