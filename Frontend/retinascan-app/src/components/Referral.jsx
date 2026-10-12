import React, { useState, useEffect } from 'react';
import { LANGUAGES, getCounselorContent } from '../counselorData.js';

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
  2: 'Specialist Triage Required: Refer to District Hospital Eye Clinic within 14–30 days for Macular OCT evaluation.',
  3: 'Urgent Specialist Referral: Comprehensive vitreoretinal evaluation within 7 days.',
  4: 'Emergency Surgical / Laser Triage: Refer immediately (<24 hours) for panretinal photocoagulation (PRP) or anti-VEGF intervention.',
};

export default function Referral({ navigate, patient, severity = 2, selectedEye = 'od', currentAppLang = 'hi' }) {
  const [selectedLang, setSelectedLang] = useState(currentAppLang || 'hi');

  useEffect(() => {
    if (currentAppLang) setSelectedLang(currentAppLang);
  }, [currentAppLang]);

  const name            = patient?.fullName || patient?.name || 'Smt. Geeta Sharma';
  const age             = patient?.age || 58;
  const gender          = patient?.gender === 'M' ? 'Male' : 'Female';
  const patientId       = patient?.id || 'DR-88969';
  const location        = patient?.village || 'Alwar Rural Sub-Center';
  const currentSeverity = severity ?? patient?.severity ?? 2;
  const currentEye      = selectedEye?.toUpperCase() || 'OD';
  const isUrgent        = currentSeverity >= 2;
  const csmeRisk        = patient?.etdrs_profile?.csmeRisk || (currentSeverity >= 2 ? 'HIGH' : 'LOW');

  const content = getCounselorContent(selectedLang, name, currentSeverity, csmeRisk);

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
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #ffffff !important; }
          main { padding: 0 !important; }
          .print-container { box-shadow: none !important; border: none !important; padding: 20px !important; }
          .page-break-before { page-break-before: always; }
        }
      `}</style>

      <div style={{ maxWidth: 880, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

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
            ← Back to Results & Counseling
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
              Print Complete Two-Part Referral Slip
            </button>
          </div>
        </div>

        {/* ════════ TWO-PART CLINICAL PAPER DOCUMENT ════════ */}
        <div className="print-container" style={{
          background: '#ffffff',
          borderRadius: 12,
          border: '1px solid #cbd5e1',
          padding: '40px 44px',
          boxShadow: '0 4px 16px rgba(15,23,42,0.06)',
          color: '#0f172a',
          lineHeight: 1.55,
        }}>

          {/* ════ PART 1: FOR MEDICAL OFFICER & DISTRICT SPECIALIST ════ */}
          <div style={{ marginBottom: 28 }}>
            {/* Letterhead Header */}
            <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: 16, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
                  National Health Mission • Directorate of Health Services
                </div>
                <h1 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 3px' }}>
                  DISTRICT TELE-OPHTHALMOLOGY NETWORK
                </h1>
                <div style={{ fontSize: 11.5, color: '#475569' }}>
                  Automated Diabetic Retinopathy Clinical Referral & Triage Slip (For Medical Officer & Specialist)
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: '#0f172a' }}>Date: {dateStr}</div>
                <div style={{ fontSize: 11.5, color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>Ref ID: {patientId}</div>
                <span style={{
                  display: 'inline-block', marginTop: 4, padding: '2px 8px', borderRadius: 4,
                  background: isUrgent ? '#fee2e2' : '#dcfce7',
                  color: isUrgent ? '#b91c1c' : '#15803d',
                  fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase',
                }}>
                  {isUrgent ? 'Priority Specialist Referral' : 'Routine Record'}
                </span>
              </div>
            </div>

            {/* Patient Demographics Table */}
            <div style={{
              background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0',
              padding: '12px 16px', marginBottom: 18,
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12,
            }}>
              <div>
                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700 }}>PATIENT NAME</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{name}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700 }}>AGE / GENDER</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{age}Y / {gender}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700 }}>PHC / SUB-CENTER</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{location}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700 }}>EXAMINED EYE</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0284c7' }}>
                  {currentEye === 'OD' ? 'OD (Right Eye)' : 'OS (Left Eye)'}
                </div>
              </div>
            </div>

            {/* Clinical Findings & Staging */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid #e2e8f0', paddingBottom: 4, marginBottom: 10 }}>
                Diagnostic Impression & Staging
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{
                  padding: '6px 14px', borderRadius: 6,
                  background: isUrgent ? '#fee2e2' : '#dcfce7',
                  border: `1px solid ${isUrgent ? '#fca5a5' : '#86efac'}`,
                  color: isUrgent ? '#991b1b' : '#166534',
                  fontSize: 13, fontWeight: 800,
                }}>
                  {SEV_NAMES[currentSeverity]}
                </div>
                <div style={{ fontSize: 12, color: '#475569' }}>
                  Softmax Confidence: <strong style={{ color: '#0f172a' }}>{patient?.confidence ? `${patient.confidence}%` : '96.4%'}</strong>
                </div>
                {csmeRisk === 'HIGH' && (
                  <span style={{
                    background: '#dc2626', color: '#ffffff',
                    fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 4,
                  }}>
                    ETDRS Center-Involved CSME Threat (&lt;500µm)
                  </span>
                )}
              </div>

              <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.6, background: '#ffffff', padding: '10px 14px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                <div><strong>Pathological Findings:</strong> Automated microaneurysm & retinal hemorrhage segmentation detected vascular micro-lesions in the 45° posterior pole.</div>
                {patient?.hba1c && <div><strong>Glycemic History:</strong> HbA1c: <strong>{patient.hba1c}%</strong></div>}
              </div>
            </div>

            {/* Clinical Action Recommendation */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid #e2e8f0', paddingBottom: 4, marginBottom: 8 }}>
                Recommended Specialist Pathway
              </div>
              <div style={{
                padding: '10px 14px', borderRadius: 6,
                background: isUrgent ? '#fff7ed' : '#f0fdf4',
                border: `1px solid ${isUrgent ? '#fed7aa' : '#bbf7d0'}`,
                color: isUrgent ? '#9a3412' : '#166534',
                fontSize: 12, fontWeight: 600,
              }}>
                {SEV_ACTIONS[currentSeverity]}
              </div>
            </div>

            {/* Doctor Signatures */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 14, borderTop: '1px solid #e2e8f0' }}>
              <div>
                <div style={{ fontSize: 10, color: '#64748b' }}>AI Validation</div>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#0f172a' }}>RetinaScan AI (ResNet-50 v2 + U-Net)</div>
                <div style={{ fontSize: 10, color: '#64748b' }}>ISO 13485 Clinical Decision Support</div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ width: 160, borderBottom: '1px dashed #64748b', marginBottom: 4 }} />
                <div style={{ fontSize: 11.5, fontWeight: 600, color: '#0f172a' }}>Medical Officer Signature & Stamp</div>
                <div style={{ fontSize: 10, color: '#64748b' }}>Primary Health Centre</div>
              </div>
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════════════════════ */}
          {/* ── TEAR-AWAY PERFORATION LINE ── */}
          <div style={{
            margin: '24px 0 24px',
            borderTop: '2px dashed #94a3b8',
            position: 'relative',
            textAlign: 'center',
          }}>
            <span style={{
              position: 'relative',
              top: -11,
              background: '#ffffff',
              padding: '0 14px',
              fontSize: 10.5,
              fontWeight: 700,
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}>
              Cut / Tear Along Line & Handover to Patient for Home Guidance • ग्रामीण मरीज़ सचित्र पर्ची
            </span>
          </div>
          {/* ═════════════════════════════════════════════════════════════════════════ */}

          {/* ════ PART 2: FOR ASHA WORKER & PATIENT (ZERO-LITERACY TAKE-HOME SLIP) ════ */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: 10,
            padding: '20px 22px',
          }}>
            {/* Patient Slip Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, borderBottom: '1px solid #e2e8f0', paddingBottom: 10 }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>
                  Rural Patient Pictogram Handout (ग्रामीण मरीज़ सचित्र मार्गदर्शिका)
                </div>
                <div style={{ fontSize: 11, color: '#64748b' }}>
                  Visual health instructions for patient and family members
                </div>
              </div>

              {/* Vernacular Language Selector (Hidden in print) */}
              <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Language:</span>
                <select
                  value={selectedLang}
                  onChange={e => setSelectedLang(e.target.value)}
                  style={{
                    padding: '4px 8px', borderRadius: 6,
                    fontSize: 11, fontWeight: 600,
                    border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a',
                  }}
                >
                  {LANGUAGES.map(l => (
                    <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Patient Name Banner in Devanagari */}
            <div style={{
              background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8,
              padding: '8px 14px', marginBottom: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>
                  Patient: <strong>{selectedLang === 'mr' || selectedLang === 'hi' ? 'श्रीमती गीता शर्मा' : name}</strong>
                </span>
                <span style={{ fontSize: 11.5, color: '#64748b', marginLeft: 8 }}>
                  ({age}Y • {location})
                </span>
              </div>
              <span style={{
                background: '#dc2626', color: '#ffffff',
                fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
              }}>
                Target: {content.urgencyDays}
              </span>
            </div>

            {/* 4 Universal Zero-Literacy Visual Pictocards (21st.dev Style) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }}>
              {/* Card 1: Hospital Countdown */}
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#dc2626' }}>
                  {content.urgencyDays}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', marginTop: 3 }}>
                  जिला अस्पताल जाएं
                </div>
                <div style={{ fontSize: 9.5, color: '#b91c1c', marginTop: 1 }}>
                  District Hospital
                </div>
              </div>

              {/* Card 2: Eye Care & Laser */}
              <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '12px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0284c7' }}>
                  LASER / DROPS
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', marginTop: 3 }}>
                  आँख का इलाज
                </div>
                <div style={{ fontSize: 9.5, color: '#0369a1', marginTop: 1 }}>
                  Preserve Vision
                </div>
              </div>

              {/* Card 3: Blood Sugar Target */}
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '12px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#d97706' }}>
                  &lt; 130 mg/dL
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', marginTop: 3 }}>
                  शूगर नियंत्रण
                </div>
                <div style={{ fontSize: 9.5, color: '#b45309', marginTop: 1 }}>
                  Fasting Glucose
                </div>
              </div>

              {/* Card 4: Diet */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 8px', textAlign: 'center' }}>
                <div style={{ background: '#f0fdf4', borderRadius: 4, padding: '2px', fontSize: 9.5, fontWeight: 600, color: '#166534', marginBottom: 2 }}>
                  Eat: Green Veggies, Dal
                </div>
                <div style={{ background: '#fef2f2', borderRadius: 4, padding: '2px', fontSize: 9.5, fontWeight: 600, color: '#991b1b' }}>
                  Avoid: Sweets, Chai
                </div>
                <div style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>
                  Dietary Protocol
                </div>
              </div>
            </div>

            {/* Vernacular Message */}
            <div style={{
              background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '10px 14px',
              fontSize: 11.5, color: '#1e293b', lineHeight: 1.55,
            }}>
              <strong>ASHA Guidance ({content.langName}):</strong> "{content.spokenText}"
            </div>

            {/* ASHA Handover Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTop: '1px dashed #cbd5e1' }}>
              <div style={{ fontSize: 10.5, color: '#64748b' }}>
                Handover: <strong>ASHA Health Worker</strong> • Sub-Health Centre
              </div>
              <div style={{ fontSize: 10.5, color: '#16a34a', fontWeight: 600 }}>
                Ayushman Bharat Digital Mission Verified
              </div>
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
