import React, { useState } from 'react';

const SEV_NAMES = {
  0: 'Grade 0: No Apparent Diabetic Retinopathy (Healthy)',
  1: 'Grade 1: Mild Non-Proliferative Diabetic Retinopathy (NPDR)',
  2: 'Grade 2: Moderate Non-Proliferative Diabetic Retinopathy (NPDR)',
  3: 'Grade 3: Severe Non-Proliferative Diabetic Retinopathy (NPDR)',
  4: 'Grade 4: Proliferative Diabetic Retinopathy (PDR)',
};

const SEV_ACTIONS = {
  0: 'Routine annual follow-up screening recommended at local sub-center.',
  1: 'Monitor in 6–12 months with repeat dilated fundus photography.',
  2: 'Specialist Triage Required: Refer to District Hospital Eye Clinic within 30 days.',
  3: 'Urgent Specialist Referral: Comprehensive ophthalmic evaluation within 7 days.',
  4: 'Emergency Surgical / Laser Triage: Refer immediately (<24 hours) for panretinal photocoagulation (PRP) or anti-VEGF intervention.',
};

export default function Referral({ navigate, patient, severity = 2, selectedEye = 'od' }) {
  const [toast, setToast] = useState(false);

  const name            = patient?.fullName || patient?.name || 'Smt. Geeta Sharma';
  const age             = patient?.age || 58;
  const gender          = patient?.gender === 'M' ? 'Male' : 'Female';
  const patientId       = patient?.id || 'DR-88969';
  const location        = patient?.village || 'Alwar Rural Sub-Center';
  const currentSeverity = severity ?? patient?.severity ?? 2;
  const currentEye      = selectedEye?.toUpperCase() || 'OD';
  const isUrgent        = currentSeverity >= 2;

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  function handlePrint() {
    window.print();
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: '#f8fafc',
      color: '#0f172a',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      padding: '24px 32px 60px',
    }}>
      <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Top Navigation & Print Button Bar */}
        <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <button
            onClick={() => navigate('results')}
            style={{
              all: 'unset', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 8,
              background: '#ffffff', border: '1px solid #cbd5e1',
              color: '#475569', fontSize: 13, fontWeight: 600,
              boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
            }}
          >
            ← Back to Results
          </button>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handlePrint}
              style={{
                all: 'unset', cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 20px', borderRadius: 8,
                background: '#0284c7', color: '#ffffff',
                fontSize: 13, fontWeight: 600,
                boxShadow: '0 2px 6px rgba(2,132,199,0.25)',
              }}
            >
              🖨️ Print Clinical Referral Slip
            </button>
          </div>
        </div>

        {/* ── Official Hospital Referral Paper Document ── */}
        <div style={{
          background: '#ffffff',
          borderRadius: 12,
          border: '1px solid #cbd5e1',
          padding: '44px 48px',
          boxShadow: '0 4px 16px rgba(15,23,42,0.06)',
          color: '#0f172a',
          lineHeight: 1.6,
        }}>
          {/* Letterhead Header */}
          <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: 20, marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                National Health Mission • Directorate of Health Services
              </div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
                DISTRICT TELE-OPHTHALMOLOGY NETWORK
              </h1>
              <div style={{ fontSize: 12, color: '#475569' }}>
                Automated Diabetic Retinopathy Diagnostic & Referral Slip
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>Date: {dateStr}</div>
              <div style={{ fontSize: 12, color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>Ref ID: {patientId}</div>
              <span style={{
                display: 'inline-block', marginTop: 6, padding: '3px 10px', borderRadius: 4,
                background: isUrgent ? '#fee2e2' : '#dcfce7',
                color: isUrgent ? '#b91c1c' : '#15803d',
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
              }}>
                {isUrgent ? 'Priority Referral' : 'Routine Record'}
              </span>
            </div>
          </div>

          {/* Patient Details Grid */}
          <div style={{
            background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0',
            padding: '16px 20px', marginBottom: 28,
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16,
          }}>
            <div>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>PATIENT NAME</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{name}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>AGE / GENDER</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{age} Years / {gender}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>CAMP / SUB-CENTER</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{location}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>EXAMINED EYE</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0284c7' }}>
                {currentEye === 'OD' ? 'OD (Right Eye)' : 'OS (Left Eye)'}
              </div>
            </div>
          </div>

          {/* Diagnostic Findings */}
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid #e2e8f0', paddingBottom: 8, marginBottom: 14 }}>
              Diagnostic Findings & ICDR Classification
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div style={{
                padding: '8px 16px', borderRadius: 6,
                background: isUrgent ? '#fee2e2' : '#dcfce7',
                border: `1px solid ${isUrgent ? '#fca5a5' : '#86efac'}`,
                color: isUrgent ? '#991b1b' : '#166534',
                fontSize: 15, fontWeight: 800,
              }}>
                {SEV_NAMES[currentSeverity]}
              </div>
              <div style={{ fontSize: 13, color: '#475569' }}>
                Model Confidence: <strong style={{ color: '#0f172a' }}>{patient?.confidence ? `${patient.confidence}%` : '96.4%'}</strong>
              </div>
            </div>

            <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.7, background: '#ffffff', padding: '12px 16px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
              <div><strong>Pathological Findings:</strong> Automated microaneurysm & retinal hemorrhage segmentation detected vascular micro-lesions in the 45° posterior pole.</div>
              {patient?.hba1c && <div><strong>Glycemic History:</strong> HbA1c: {patient.hba1c}%</div>}
            </div>
          </div>

          {/* Clinical Action Recommendation */}
          <div style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid #e2e8f0', paddingBottom: 8, marginBottom: 14 }}>
              Clinical Action Protocol
            </h2>

            <div style={{
              padding: '14px 18px', borderRadius: 8,
              background: isUrgent ? '#fff7ed' : '#f0fdf4',
              border: `1px solid ${isUrgent ? '#fed7aa' : '#bbf7d0'}`,
              color: isUrgent ? '#9a3412' : '#166534',
              fontSize: 13, fontWeight: 600,
            }}>
              {SEV_ACTIONS[currentSeverity]}
            </div>
          </div>

          {/* Signatures & Verification */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 24, borderTop: '1px solid #e2e8f0' }}>
            <div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Validated By</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>RetinaScan AI (ResNet-50 v2 + U-Net)</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>ISO 13485 Compliant Workflow</div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ width: 180, borderBottom: '1px dashed #64748b', marginBottom: 6 }} />
              <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>Medical Officer Signature</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Primary Health Centre</div>
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
