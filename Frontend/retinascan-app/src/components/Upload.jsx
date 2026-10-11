import React, { useState } from 'react';
import { demoPresets } from '../data.js';

const D = {
  bg:      '#f8fafc',
  card:    '#ffffff',
  border:  '#e2e8f0',
  primary: '#0284c7',
  text:    '#0f172a',
  sub:     '#475569',
  muted:   '#64748b',
  mono:    'JetBrains Mono, "Courier New", monospace',
};

const SEVERITY_CONFIG = [
  { label: 'Grade 0: Healthy',    color: '#15803d', bg: '#dcfce7', border: '#bbf7d0' },
  { label: 'Grade 1: Mild NPDR',  color: '#b45309', bg: '#fef3c7', border: '#fde68a' },
  { label: 'Grade 2: Moderate',   color: '#c2410c', bg: '#ffedd5', border: '#fed7aa' },
  { label: 'Grade 3: Severe NPDR',color: '#b91c1c', bg: '#fee2e2', border: '#fecaca' },
  { label: 'Grade 4: Prolif. DR', color: '#991b1b', bg: '#fef2f2', border: '#fca5a5' },
];

function genId() {
  return `PHC-MNW-${String(Math.floor(1000 + Math.random() * 9000))}`;
}

function Field({ label, value, onChange, type = 'text', readOnly = false, unit, options }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: D.sub, letterSpacing: '0.02em' }}>
        {label}
      </label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {options ? (
          <select value={value} onChange={e => onChange(e.target.value)} style={{
            width: '100%', padding: '9px 12px',
            background: '#ffffff',
            border: `1px solid ${D.border}`, borderRadius: 8,
            color: D.text, fontSize: 13, outline: 'none',
          }}>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <input
            type={type} value={value}
            onChange={e => onChange && onChange(e.target.value)}
            readOnly={readOnly}
            style={{
              width: '100%', padding: '9px 12px',
              background: readOnly ? '#f1f5f9' : '#ffffff',
              border: `1px solid ${D.border}`,
              borderRadius: 8, color: D.text,
              fontSize: 13, outline: 'none', boxSizing: 'border-box',
            }}
            onFocus={e => { if (!readOnly) e.target.style.borderColor = '#0284c7'; }}
            onBlur={e => { e.target.style.borderColor = D.border; }}
          />
        )}
        {unit && (
          <span style={{
            position: 'absolute', right: 12,
            fontSize: 11, color: D.muted, fontWeight: 500,
          }}>{unit}</span>
        )}
      </div>
    </div>
  );
}

export default function Upload({ navigate, onSelectPatient, handleUpload, uploadError, clearUploadError }) {
  const [selectedPatient, setSelectedPatient] = useState(demoPresets[2]);
  const [patId] = useState(genId());
  const [form, setForm] = useState({
    name: demoPresets[2].fullName || demoPresets[2].name,
    age: String(demoPresets[2].age),
    gender: 'Female',
    diabetesDuration: String(demoPresets[2].diabetesDuration || '12'),
    hba1c: String(demoPresets[2].hba1c || '9.1'),
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
      minHeight: 'calc(100vh - 56px)', background: D.bg, color: D.text,
      fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', flexDirection: 'column',
    }}>

      {/* Title bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '10px 28px', background: '#ffffff', borderBottom: `1px solid ${D.border}`,
        flexShrink: 0,
      }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', boxShadow: '0 0 0 3px #dcfce7' }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: D.text }}>
          Point-of-Care Retinal Intake · Primary Health Center
        </span>
        <span style={{ padding: '2px 9px', borderRadius: 6, background: '#f1f5f9', border: `1px solid ${D.border}`, fontSize: 11, color: D.sub }}>
          PHC Mandawar · Tele-ophthalmology Unit
        </span>
        <div style={{ flex: 1 }} />
        <button onClick={() => navigate('home')} style={{
          all: 'unset', cursor: 'pointer', padding: '6px 14px', borderRadius: 7,
          background: '#ffffff', border: `1px solid #cbd5e1`,
          fontSize: 12, fontWeight: 600, color: D.sub,
        }}>← Back to Home</button>
      </div>

      {/* Validation Error Banner */}
      {uploadError && (
        <div style={{
          margin: '16px 28px 0',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 10,
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 14,
          boxShadow: '0 2px 8px rgba(220,38,38,0.06)',
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: '#fee2e2', color: '#dc2626',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 800, flexShrink: 0,
          }}>
            !
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#991b1b', marginBottom: 2 }}>
              Scan Validation Error — Re-upload Required
            </div>
            <div style={{ fontSize: 12, color: '#b91c1c', lineHeight: 1.5 }}>
              {uploadError}
            </div>
          </div>
          {clearUploadError && (
            <button
              onClick={clearUploadError}
              style={{
                all: 'unset', cursor: 'pointer',
                color: '#991b1b', fontWeight: 700, fontSize: 16, padding: '0 4px',
              }}
              title="Dismiss"
            >
              ✕
            </button>
          )}
        </div>
      )}

      <div style={{ display: 'flex', flex: 1, padding: '20px 28px', gap: 24, overflow: 'auto' }}>

        {/* ════ LEFT: Intake form ════ */}
        <div style={{
          flex: '0 0 420px', padding: '24px',
          background: '#ffffff', borderRadius: 14,
          border: `1px solid ${D.border}`,
          boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
          display: 'flex', flexDirection: 'column', gap: 18,
        }}>
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 800, color: D.text }}>
              Patient Information
            </h2>
            <p style={{ margin: 0, fontSize: 12, color: D.muted }}>
              Select a demo case from the right or upload a patient fundus scan
            </p>
          </div>

          {/* Auto ID */}
          <div style={{ padding: '10px 14px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#0369a1', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Patient Reference ID
            </div>
            <div style={{ fontFamily: D.mono, fontSize: 15, fontWeight: 800, color: '#0284c7', marginTop: 2 }}>
              {selectedPatient?.id || patId}
            </div>
          </div>

          {/* Form fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Field label="Full Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Age" value={form.age} onChange={v => setForm(f => ({ ...f, age: v }))} type="number" unit="yrs" />
              <Field label="Gender" value={form.gender} onChange={v => setForm(f => ({ ...f, gender: v }))} options={['Female', 'Male', 'Other']} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Diabetes Duration" value={form.diabetesDuration} onChange={v => setForm(f => ({ ...f, diabetesDuration: v }))} type="number" unit="yrs" />
              <Field label="HbA1c Level" value={form.hba1c} onChange={v => setForm(f => ({ ...f, hba1c: v }))} type="number" unit="%" />
            </div>
          </div>

          {/* Eye selector */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: D.sub, marginBottom: 8 }}>
              Screening Eye
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { key: 'od', label: 'OD (Right Eye)' },
                { key: 'os', label: 'OS (Left Eye)' },
              ].map(e => (
                <button key={e.key} onClick={() => setForm(f => ({ ...f, eye: e.key }))} style={{
                  all: 'unset', cursor: 'pointer', flex: 1,
                  padding: '9px 10px', borderRadius: 8, textAlign: 'center',
                  background: form.eye === e.key ? '#f0f9ff' : '#ffffff',
                  border: `1.5px solid ${form.eye === e.key ? '#0284c7' : '#cbd5e1'}`,
                  color: form.eye === e.key ? '#0284c7' : D.sub,
                  fontWeight: 700, fontSize: 12,
                  transition: 'all 0.15s ease',
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
              padding: '13px 20px', borderRadius: 9, textAlign: 'center',
              background: canStart ? '#0284c7' : '#e2e8f0',
              color: canStart ? '#ffffff' : '#94a3b8',
              fontSize: 13, fontWeight: 700,
              boxShadow: canStart ? '0 2px 8px rgba(2,132,199,0.25)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            {canStart ? '▶ Start Quality Check & Assessment' : 'Select a patient or upload a scan'}
          </button>
        </div>

        {/* ════ RIGHT: Demo patient selector & Dropzone ════ */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 800, color: D.text }}>
              Pre-Loaded Clinical Presets
            </h2>
            <p style={{ margin: 0, fontSize: 12, color: D.muted }}>
              Click any patient to test the grading pipeline with validated retinal scans
            </p>
          </div>

          {/* Patient preset cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
            {demoPresets.map(p => {
              const cfg = SEVERITY_CONFIG[p.severity] || SEVERITY_CONFIG[0];
              const isSelected = selectedPatient?.id === p.id;
              return (
                <button key={p.id} onClick={() => selectPreset(p)} style={{
                  all: 'unset', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 16px', borderRadius: 12,
                  background: isSelected ? '#f0f9ff' : '#ffffff',
                  border: `1.5px solid ${isSelected ? '#0284c7' : '#e2e8f0'}`,
                  boxShadow: isSelected ? '0 2px 10px rgba(2,132,199,0.12)' : '0 1px 3px rgba(15,23,42,0.03)',
                  transition: 'all 0.15s',
                }}>
                  {/* Retina thumbnail */}
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
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
                    <div style={{ fontSize: 14, fontWeight: 700, color: D.text }}>
                      {p.fullName || p.name}
                    </div>
                    <div style={{ fontSize: 11, color: D.muted, marginTop: 1 }}>
                      {p.age}Y · {p.gender === 'F' ? 'Female' : 'Male'} · {p.village}
                    </div>
                    <div style={{
                      display: 'inline-block', marginTop: 6,
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 12,
                      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                    }}>
                      {cfg.label}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Upload Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => {
              e.preventDefault(); setDragOver(false);
              const file = e.dataTransfer.files[0];
              if (file && handleUpload) handleUpload(file);
            }}
            style={{
              padding: '24px 20px', borderRadius: 12, textAlign: 'center',
              border: `2px dashed ${dragOver ? '#0284c7' : '#cbd5e1'}`,
              background: dragOver ? '#f0f9ff' : '#ffffff',
              boxShadow: '0 1px 3px rgba(15,23,42,0.03)',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#f0f9ff', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: D.text, marginBottom: 4 }}>
              Drop New Fundus Image to Run Live AI Model
            </div>
            <div style={{ fontSize: 11, color: D.muted, marginBottom: 12 }}>
              Supports standard JPEG, PNG, TIFF retinal photographs from any fundus camera
            </div>
            <label style={{
              display: 'inline-block',
              padding: '8px 20px', borderRadius: 8,
              background: '#0284c7', color: '#ffffff',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(2,132,199,0.2)',
            }}>
              Browse Image File
              <input type="file" accept=".jpg,.jpeg,.png,.tiff,.dcm" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files[0]; if (f && handleUpload) handleUpload(f); }} />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
