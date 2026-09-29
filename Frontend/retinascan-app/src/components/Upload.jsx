import React, { useState } from 'react';
import { demoPresets, severityColors } from '../data.js';

const D = {
  bg:    '#0a0f14', panel: '#111820', border: '#1e2d3d',
  teal:  '#00d4aa', text: '#e8f4f8', sub: '#7a9ab0', muted: '#3a5068',
  mono:  'JetBrains Mono, "Courier New", monospace',
};

const SEVERITY_LABELS = ['No DR', 'Mild NPDR', 'Moderate NPDR', 'Severe NPDR', 'Prolif. DR'];
const SEVERITY_COLORS = ['#22c55e', '#84cc16', '#f59e0b', '#ea580c', '#dc2626'];

/* Auto-generate PHC ID */
function genId() {
  return `PHC-MNW-${String(Math.floor(1000 + Math.random() * 9000))}`;
}

function Field({ label, value, onChange, type = 'text', readOnly = false, unit, options }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontFamily: D.mono, fontSize: 10, color: D.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {label}
      </label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {options ? (
          <select value={value} onChange={e => onChange(e.target.value)} style={{
            width: '100%', padding: '9px 12px',
            background: readOnly ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${D.border}`, borderRadius: 7,
            color: D.text, fontFamily: D.mono, fontSize: 12, outline: 'none',
            appearance: 'none',
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
              background: readOnly ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${readOnly ? D.border : '#2a4055'}`,
              borderRadius: 7, color: readOnly ? D.sub : D.text,
              fontFamily: D.mono, fontSize: 12, outline: 'none', boxSizing: 'border-box',
            }}
            onFocus={e => { if (!readOnly) e.target.style.borderColor = 'rgba(0,212,170,0.5)'; }}
            onBlur={e => { e.target.style.borderColor = readOnly ? D.border : '#2a4055'; }}
          />
        )}
        {unit && (
          <span style={{
            position: 'absolute', right: 10,
            fontFamily: D.mono, fontSize: 10, color: D.muted,
          }}>{unit}</span>
        )}
      </div>
    </div>
  );
}

export default function Upload({ navigate, onSelectPatient, handleUpload }) {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patId] = useState(genId());
  const [form, setForm] = useState({
    name: '', age: '', gender: 'Female', diabetesDuration: '', hba1c: '', eye: 'od',
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
      minHeight: '100vh', background: D.bg, color: D.text,
      fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', flexDirection: 'column',
    }}>

      {/* Title bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '8px 20px', background: D.panel, borderBottom: `1px solid ${D.border}`,
        flexShrink: 0,
      }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
        <span style={{ fontFamily: D.mono, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: D.text }}>
          POINT-OF-CARE ACQUISITION · PATIENT INTAKE
        </span>
        <span style={{ padding: '3px 10px', borderRadius: 5, background: 'rgba(255,255,255,0.05)', border: `1px solid ${D.border}`, fontFamily: D.mono, fontSize: 10, color: D.sub }}>
          PHC Mandawar · Alwar District, Rajasthan
        </span>
        <div style={{ flex: 1 }} />
        <button onClick={() => navigate('home')} style={{
          all: 'unset', cursor: 'pointer', padding: '5px 12px', borderRadius: 6,
          background: 'rgba(255,255,255,0.04)', border: `1px solid ${D.border}`,
          fontFamily: D.mono, fontSize: 10, color: D.sub,
        }}>← Home</button>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'auto' }}>

        {/* ════ LEFT: Intake form ════ */}
        <div style={{
          flex: '0 0 420px', padding: '28px 28px',
          borderRight: `1px solid ${D.border}`,
          display: 'flex', flexDirection: 'column', gap: 20,
        }}>
          <div>
            <h2 style={{ margin: '0 0 4px', fontFamily: 'Manrope, sans-serif', fontSize: 18, fontWeight: 800, color: D.text, letterSpacing: '-0.01em' }}>
              Patient Registration
            </h2>
            <p style={{ margin: 0, fontFamily: D.mono, fontSize: 11, color: D.muted }}>Select a demo patient, then verify or edit fields</p>
          </div>

          {/* Auto ID */}
          <div style={{ padding: '10px 14px', background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 8 }}>
            <div style={{ fontFamily: D.mono, fontSize: 9, color: D.teal, letterSpacing: '0.1em', marginBottom: 4 }}>AUTO-GENERATED PATIENT ID</div>
            <div style={{ fontFamily: D.mono, fontSize: 16, fontWeight: 800, color: D.teal }}>{selectedPatient?.id || patId}</div>
          </div>

          {/* Form fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Patient Full Name"    value={form.name}             onChange={v => setForm(f => ({ ...f, name: v }))} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Age (years)"        value={form.age}              onChange={v => setForm(f => ({ ...f, age: v }))}              type="number" />
              <Field label="Gender"             value={form.gender}           onChange={v => setForm(f => ({ ...f, gender: v }))}            options={['Female', 'Male', 'Other']} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Diabetes Duration"  value={form.diabetesDuration} onChange={v => setForm(f => ({ ...f, diabetesDuration: v }))} type="number" unit="yrs" />
              <Field label="HbA1c"              value={form.hba1c}            onChange={v => setForm(f => ({ ...f, hba1c: v }))}            type="number" unit="%" />
            </div>
          </div>

          {/* Eye selector */}
          <div>
            <div style={{ fontFamily: D.mono, fontSize: 10, color: D.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
              Select Eye for Screening
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { key: 'od', label: 'OD', sub: 'Right Eye (Oculus Dexter)' },
                { key: 'os', label: 'OS', sub: 'Left Eye (Oculus Sinister)' },
                { key: 'both', label: 'BOTH', sub: 'Bilateral Screening' },
              ].map(e => (
                <button key={e.key} onClick={() => setForm(f => ({ ...f, eye: e.key }))} style={{
                  all: 'unset', cursor: 'pointer', flex: 1,
                  padding: '10px 8px', borderRadius: 8, textAlign: 'center',
                  background: form.eye === e.key ? 'rgba(0,212,170,0.12)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${form.eye === e.key ? 'rgba(0,212,170,0.4)' : D.border}`,
                }}>
                  <div style={{ fontFamily: D.mono, fontSize: 14, fontWeight: 800, color: form.eye === e.key ? D.teal : D.sub }}>{e.label}</div>
                  <div style={{ fontFamily: D.mono, fontSize: 9, color: D.muted, marginTop: 3 }}>{e.sub}</div>
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
              padding: '14px 20px', borderRadius: 10, textAlign: 'center',
              background: canStart ? 'rgba(0,212,170,0.2)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${canStart ? 'rgba(0,212,170,0.5)' : D.border}`,
              fontFamily: D.mono, fontSize: 13, fontWeight: 700,
              color: canStart ? D.teal : D.muted,
              transition: 'all 0.15s',
            }}
          >
            {canStart ? '▶ Start Image Quality Assessment' : '← Select a patient to begin'}
          </button>

          {canStart && (
            <div style={{ fontFamily: D.mono, fontSize: 10, color: D.muted, textAlign: 'center' }}>
              IQA → DeepRetina-v4 inference → Grad-CAM++ XAI
            </div>
          )}
        </div>

        {/* ════ RIGHT: Demo patient selector ════ */}
        <div style={{ flex: 1, padding: '28px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <h2 style={{ margin: '0 0 4px', fontFamily: 'Manrope, sans-serif', fontSize: 18, fontWeight: 800, color: D.text, letterSpacing: '-0.01em' }}>
              Demo Patients
            </h2>
            <p style={{ margin: 0, fontFamily: D.mono, fontSize: 11, color: D.muted }}>Click any patient to auto-fill the intake form</p>
          </div>

          {/* Patient preset cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {demoPresets.map(p => {
              const sCol = SEVERITY_COLORS[p.severity] || '#22c55e';
              const isSelected = selectedPatient?.id === p.id;
              return (
                <button key={p.id} onClick={() => selectPreset(p)} style={{
                  all: 'unset', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '16px 18px', borderRadius: 12,
                  background: isSelected ? `${sCol}12` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isSelected ? sCol + '60' : D.border}`,
                  borderLeft: `4px solid ${sCol}`,
                  transition: 'all 0.15s',
                }}>
                  {/* Retina thumbnail */}
                  <div style={{
                    width: 60, height: 60, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                    border: `2px solid ${sCol}50`,
                    boxShadow: isSelected ? `0 0 12px ${sCol}40` : 'none',
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
                    <div style={{ fontSize: 14, fontWeight: 700, color: D.text, marginBottom: 3 }}>
                      {p.fullName || p.name}
                    </div>
                    <div style={{ fontFamily: D.mono, fontSize: 10, color: D.sub, marginBottom: 6 }}>
                      {p.age}Y · {p.gender === 'F' ? 'Female' : 'Male'} · {p.village}
                    </div>
                    <div style={{ fontFamily: D.mono, fontSize: 10, color: D.muted }}>
                      {p.findings}
                    </div>
                  </div>

                  {/* Grade badge */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '4px 10px', borderRadius: 6,
                      background: `${sCol}18`, border: `1px solid ${sCol}40`,
                      fontFamily: D.mono, fontSize: 11, fontWeight: 700, color: sCol,
                      marginBottom: 5,
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: sCol }} />
                      Level {p.severity}
                    </div>
                    <div style={{ fontFamily: D.mono, fontSize: 10, color: D.muted }}>{p.confidence}% conf.</div>
                  </div>

                  {isSelected && (
                    <span style={{ fontFamily: D.mono, fontSize: 10, fontWeight: 700, color: D.teal }}>✓ SELECTED</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Drop zone */}
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
              border: `2px dashed ${dragOver ? D.teal : D.border}`,
              background: dragOver ? 'rgba(0,212,170,0.06)' : 'rgba(255,255,255,0.02)',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ fontFamily: D.mono, fontSize: 11, color: D.muted, marginBottom: 6 }}>
              Or drop a real fundus image here to run live inference
            </div>
            <div style={{ fontFamily: D.mono, fontSize: 10, color: D.muted }}>
              JPG · PNG · TIFF · DICOM supported
            </div>
            <label style={{
              display: 'inline-block', marginTop: 12,
              padding: '7px 18px', borderRadius: 7,
              background: 'rgba(255,255,255,0.05)', border: `1px solid ${D.border}`,
              fontFamily: D.mono, fontSize: 11, color: D.sub, cursor: 'pointer',
            }}>
              Browse File
              <input type="file" accept=".jpg,.jpeg,.png,.tiff,.dcm" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files[0]; if (f && handleUpload) handleUpload(f); }} />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
