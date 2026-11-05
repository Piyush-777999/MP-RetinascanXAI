import React, { useState } from 'react';
import { demoPresets } from '../data.js';

const EB = {
  forest:    '#25351A',
  olive:     '#4C3D12',
  ivory:     '#F4F4E9',
  sage:      '#7D8960',
  celery:    '#E3EBC9',
  grayGreen: '#D0D4C2',
  ink:       '#171812',
  inkMuted:  '#858575',
  hairline:  'rgba(76,61,18,0.15)',
};

const SEV_COLORS = [
  { color: '#7D8960', bg: 'rgba(125,137,96,0.12)', border: 'rgba(125,137,96,0.30)', label: 'G0 · No DR' },
  { color: '#A8A050', bg: 'rgba(168,160,80,0.12)', border: 'rgba(168,160,80,0.30)', label: 'G1 · Mild NPDR' },
  { color: '#B8863B', bg: 'rgba(184,134,59,0.12)', border: 'rgba(184,134,59,0.30)', label: 'G2 · Moderate' },
  { color: '#A6552E', bg: 'rgba(166,85,46,0.12)',  border: 'rgba(166,85,46,0.30)',  label: 'G3 · Severe NPDR' },
  { color: '#7A2E22', bg: 'rgba(122,46,34,0.12)',  border: 'rgba(122,46,34,0.30)',  label: 'G4 · Prolif. DR' },
];

function genId() { return `PHC-MNW-${String(Math.floor(1000 + Math.random() * 9000))}`; }

function Field({ label, value, onChange, type = 'text', readOnly = false, unit, options }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 10, fontWeight: 700, color: EB.inkMuted, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {options ? (
          <select value={value} onChange={e => onChange(e.target.value)} style={{
            width: '100%', padding: '8px 10px',
            background: '#ffffff', border: `1px solid ${EB.hairline}`,
            borderRadius: 5, color: EB.ink, fontSize: 12.5, outline: 'none',
          }}>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <input
            type={type} value={value}
            onChange={e => onChange && onChange(e.target.value)}
            readOnly={readOnly}
            style={{
              width: '100%', padding: '8px 10px',
              background: readOnly ? EB.ivory : '#ffffff',
              border: `1px solid ${EB.hairline}`,
              borderRadius: 5, color: EB.ink,
              fontSize: 12.5, outline: 'none', boxSizing: 'border-box',
            }}
            onFocus={e => { if (!readOnly) e.target.style.borderColor = EB.sage; }}
            onBlur={e => { e.target.style.borderColor = EB.hairline; }}
          />
        )}
        {unit && <span style={{ position: 'absolute', right: 10, fontSize: 10.5, color: EB.inkMuted, fontWeight: 600 }}>{unit}</span>}
      </div>
    </div>
  );
}

export default function Upload({ navigate, onSelectPatient, handleUpload, uploadError, clearUploadError }) {
  // Guard against demoPresets having fewer entries than expected
  const defaultPreset = demoPresets[2] ?? demoPresets[1] ?? demoPresets[0] ?? {};
  const [selectedPatient, setSelectedPatient] = useState(defaultPreset);
  const [patId] = useState(genId());
  const [form, setForm] = useState({
    name: defaultPreset.fullName || defaultPreset.name || '',
    age: String(defaultPreset.age || ''),
    gender: 'Female',
    diabetesDuration: String(defaultPreset.diabetesDuration || '12'),
    hba1c: String(defaultPreset.hba1c || '9.1'),
    eye: 'od',
  });
  const [dragOver, setDragOver] = useState(false);

  function selectPreset(p) {
    setSelectedPatient(p);
    setForm({
      name: p.fullName || p.name,
      age: String(p.age),
      gender: p.gender === 'M' ? 'Male' : 'Female',
      diabetesDuration: String(p.diabetesDuration || ''),
      hba1c: String(p.hba1c || ''),
      eye: 'od',
    });
    if (onSelectPatient) onSelectPatient({ ...p, selectedEye: 'od' });
  }

  function handleStart() {
    if (!selectedPatient) return;
    if (onSelectPatient) onSelectPatient({ ...selectedPatient, selectedEye: form.eye });
    navigate('qualitycheck');
  }

  const canStart = !!selectedPatient;

  return (
    <div style={{
      minHeight: 'calc(100vh - 48px)', background: EB.ivory, color: EB.ink,
      fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', flexDirection: 'column',
    }}>

      {/* Title bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '9px 24px', background: '#fff', borderBottom: `1px solid ${EB.hairline}`,
        flexShrink: 0,
      }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: EB.sage, boxShadow: `0 0 0 3px ${EB.celery}` }} />
        <span style={{ fontSize: 12.5, fontWeight: 700, color: EB.ink }}>Patient Intake</span>
        <span style={{ padding: '2px 8px', borderRadius: 4, background: EB.celery, border: `1px solid ${EB.hairline}`, fontSize: 11, color: EB.inkMuted }}>
          PHC Mandawar · Tele-ophthalmology Unit
        </span>
        <div style={{ flex: 1 }} />
        <button onClick={() => navigate('home')} style={{
          all: 'unset', cursor: 'pointer', padding: '5px 12px', borderRadius: 5,
          background: EB.ivory, border: `1px solid ${EB.hairline}`,
          fontSize: 11.5, fontWeight: 600, color: EB.inkMuted,
        }}>← Home</button>
      </div>

      {/* Error banner */}
      {uploadError && (
        <div style={{
          margin: '14px 24px 0',
          background: 'rgba(122,46,34,0.07)', border: '1px solid rgba(122,46,34,0.30)',
          borderRadius: 7, padding: '12px 16px',
          display: 'flex', alignItems: 'flex-start', gap: 12,
        }}>
          <span style={{ color: '#7A2E22', fontWeight: 900, fontSize: 16, lineHeight: 1 }}>!</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#7A2E22', marginBottom: 2 }}>Scan Validation Failed</div>
            <div style={{ fontSize: 11.5, color: '#A6552E', lineHeight: 1.5 }}>{uploadError}</div>
          </div>
          {clearUploadError && (
            <button onClick={clearUploadError} style={{ all: 'unset', cursor: 'pointer', color: '#7A2E22', fontWeight: 700, fontSize: 15 }}>✕</button>
          )}
        </div>
      )}

      <div style={{ display: 'flex', flex: 1, padding: '18px 24px', gap: 20, overflow: 'auto' }}>

        {/* ── LEFT: Intake form ─────────────────────────────────────── */}
        <div style={{
          flex: '0 0 380px', padding: '20px',
          background: '#ffffff', borderRadius: 8,
          border: `1px solid ${EB.hairline}`,
          boxShadow: '0 1px 4px rgba(23,24,18,0.06)',
          display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          <div>
            <h2 style={{ margin: '0 0 3px', fontSize: 14.5, fontWeight: 700, color: EB.ink }}>Patient Record</h2>
            <p style={{ margin: 0, fontSize: 11, color: EB.inkMuted }}>Select demo preset or upload scan</p>
          </div>

          {/* Patient ID */}
          <div style={{ padding: '9px 12px', background: EB.celery, border: `1px solid ${EB.hairline}`, borderRadius: 5 }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: EB.sage, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Reference ID</div>
            <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 800, color: EB.forest, marginTop: 2 }}>
              {selectedPatient?.id || patId}
            </div>
          </div>

          {/* Form fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Field label="Full Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Field label="Age" value={form.age} onChange={v => setForm(f => ({ ...f, age: v }))} type="number" unit="yrs" />
              <Field label="Gender" value={form.gender} onChange={v => setForm(f => ({ ...f, gender: v }))} options={['Female', 'Male', 'Other']} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Field label="Diabetes Duration" value={form.diabetesDuration} onChange={v => setForm(f => ({ ...f, diabetesDuration: v }))} type="number" unit="yrs" />
              <Field label="HbA1c" value={form.hba1c} onChange={v => setForm(f => ({ ...f, hba1c: v }))} type="number" unit="%" />
            </div>
          </div>

          {/* Eye selector */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: EB.inkMuted, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 7 }}>Eye</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[{ key: 'od', label: 'OD · Right' }, { key: 'os', label: 'OS · Left' }].map(e => (
                <button key={e.key} onClick={() => setForm(f => ({ ...f, eye: e.key }))} style={{
                  all: 'unset', cursor: 'pointer', flex: 1,
                  padding: '8px 10px', borderRadius: 5, textAlign: 'center',
                  background: form.eye === e.key ? EB.celery : '#ffffff',
                  border: `1.5px solid ${form.eye === e.key ? EB.sage : EB.hairline}`,
                  color: form.eye === e.key ? EB.forest : EB.inkMuted,
                  fontWeight: 700, fontSize: 12,
                  transition: 'all 0.13s ease',
                }}>
                  {e.label}
                </button>
              ))}
            </div>
          </div>

          {/* Start button */}
          <button
            onClick={handleStart}
            disabled={!canStart}
            style={{
              all: 'unset', cursor: canStart ? 'pointer' : 'not-allowed',
              padding: '11px 18px', borderRadius: 6, textAlign: 'center',
              background: canStart ? EB.forest : EB.grayGreen,
              color: canStart ? EB.ivory : EB.inkMuted,
              fontSize: 12.5, fontWeight: 700,
              boxShadow: canStart ? '0 2px 8px rgba(37,53,26,0.22)' : 'none',
              transition: 'all 0.14s',
            }}
          >
            {canStart ? '▶  Start Quality Check' : 'Select a patient or upload'}
          </button>
        </div>

        {/* ── RIGHT: Demo presets + Dropzone ─────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <h2 style={{ margin: '0 0 3px', fontSize: 14.5, fontWeight: 700, color: EB.ink }}>Clinical Presets</h2>
            <p style={{ margin: 0, fontSize: 11, color: EB.inkMuted }}>Validated demo cases — all severity grades</p>
          </div>

          {/* Preset cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
            {demoPresets.map(p => {
              const cfg = SEV_COLORS[p.severity] || SEV_COLORS[0];
              const isSelected = selectedPatient?.id === p.id;
              return (
                <button key={p.id} onClick={() => selectPreset(p)} style={{
                  all: 'unset', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', borderRadius: 7,
                  background: isSelected ? EB.celery : '#ffffff',
                  border: `1.5px solid ${isSelected ? EB.sage : EB.hairline}`,
                  boxShadow: isSelected ? `0 2px 10px rgba(125,137,96,0.18)` : '0 1px 3px rgba(23,24,18,0.04)',
                  transition: 'all 0.13s',
                }}>
                  {/* Retina thumb */}
                  <div style={{
                    width: 46, height: 46, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                    border: `2px solid ${cfg.color}`,
                  }}>
                    <img
                      src={`/images/img_${p.severity}_od.jpg`}
                      alt={p.fullName}
                      onError={e => { e.target.src = '/images/img_2_od.jpg'; }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: EB.ink }}>{p.fullName || p.name}</div>
                    <div style={{ fontSize: 10.5, color: EB.inkMuted, marginTop: 1 }}>{p.age}Y · {p.gender === 'F' || p.gender === 'Female' ? 'F' : 'M'} · {p.village}</div>
                    <div style={{
                      display: 'inline-block', marginTop: 5,
                      fontSize: 9.5, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                    }}>
                      {cfg.label}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Dropzone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => {
              e.preventDefault(); setDragOver(false);
              const file = e.dataTransfer.files[0];
              if (file && handleUpload) handleUpload(file, { ...form, patId });
            }}
            style={{
              padding: '20px 16px', borderRadius: 7, textAlign: 'center',
              border: `2px dashed ${dragOver ? EB.sage : EB.grayGreen}`,
              background: dragOver ? EB.celery : '#ffffff',
              transition: 'all 0.14s',
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: EB.celery, color: EB.forest,
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: EB.ink, marginBottom: 3 }}>Drop Fundus Image</div>
            <div style={{ fontSize: 11, color: EB.inkMuted, marginBottom: 10 }}>JPEG · PNG · TIFF — runs live AI model</div>
            <label style={{
              display: 'inline-block',
              padding: '7px 18px', borderRadius: 5,
              background: EB.forest, color: EB.ivory,
              fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
            }}>
              Browse File
              <input type="file" accept=".jpg,.jpeg,.png,.tiff,.dcm" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files[0]; if (f && handleUpload) handleUpload(f, { ...form, patId }); }} />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
