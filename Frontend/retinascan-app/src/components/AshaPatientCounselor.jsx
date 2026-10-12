import React, { useState, useEffect } from 'react';
import { LANGUAGES, getCounselorContent } from '../counselorData.js';

/* ── Crisp, Professional Vector SVG Icons (21st.dev / Lucide Style) ────────── */
function IconCalendar({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconEye({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconDroplet({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  );
}

function IconUtensils({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2" />
      <path d="M15 11v11" />
      <path d="M5 2v20" />
      <path d="M2 4h6" />
    </svg>
  );
}

function IconCheck({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconX({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconPrinter({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  );
}

function IconStethoscope({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 3h3v5.5a4 4 0 0 0 8 0V3h3" />
      <path d="M12 12.5V17a3 3 0 0 0 6 0v-2.5" />
      <circle cx="18" cy="14" r="2" />
    </svg>
  );
}

function IconMessageCircle({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

export default function AshaPatientCounselor({
  patient,
  severity = 2,
  csmeRisk = 'HIGH',
  onPrintSlip,
  onSwitchToDoctor,
  currentAppLang = 'hi',
}) {
  const [selectedLang, setSelectedLang] = useState(currentAppLang || 'hi');
  const [showEnglishText, setShowEnglishText] = useState(false);

  const patientName = patient?.fullName || patient?.name || 'Smt. Geeta Sharma';
  const content = getCounselorContent(selectedLang, patientName, severity, csmeRisk);

  // Sync with global language prop if it changes
  useEffect(() => {
    if (currentAppLang) {
      setSelectedLang(currentAppLang);
    }
  }, [currentAppLang]);

  const isHighCsme = csmeRisk === 'HIGH';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#f8fafc',
      color: '#0f172a',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      overflowY: 'auto',
      padding: '20px 28px 40px',
    }}>
      {/* ── Sub-Navigation & Header Bar ── */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: '14px 20px',
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: '#ecfdf5', border: '1px solid #a7f3d0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#047857',
          }}>
            <IconStethoscope size={20} color="#047857" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em' }}>
                ASHA & Patient Counseling Hub
              </h2>
              <span style={{
                background: '#f1f5f9', color: '#475569',
                fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
                border: '1px solid #e2e8f0',
              }}>
                मरीज़ व आशा परामर्श
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 1 }}>
              National Health Mission • Primary Eye Care Tele-Screening
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={onSwitchToDoctor}
            style={{
              all: 'unset', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 8,
              background: '#f8fafc', border: '1px solid #cbd5e1',
              color: '#334155', fontSize: 12, fontWeight: 600,
              transition: 'all 0.15s ease',
            }}
          >
            <IconStethoscope size={14} color="#64748b" />
            <span>Doctor Workstation (विशेषज्ञ)</span>
          </button>

          <button
            onClick={onPrintSlip}
            style={{
              all: 'unset', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '7px 16px', borderRadius: 8,
              background: '#0284c7', color: '#ffffff',
              fontSize: 12, fontWeight: 600,
              boxShadow: '0 1px 3px rgba(2,132,199,0.25)',
              transition: 'all 0.15s ease',
            }}
          >
            <IconPrinter size={15} color="#ffffff" />
            <span>Print Patient Handout Slip</span>
          </button>
        </div>
      </div>

      {/* ── Patient Identity & Triage Card ── */}
      <div style={{
        background: '#ffffff',
        border: `1px solid ${isHighCsme ? '#fecaca' : '#bbf7d0'}`,
        borderLeft: `4px solid ${isHighCsme ? '#dc2626' : '#16a34a'}`,
        borderRadius: 12,
        padding: '14px 20px',
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 14,
        boxShadow: '0 1px 3px rgba(15,23,42,0.03)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Avatar Initials */}
          <div style={{
            width: 42, height: 42, borderRadius: 10,
            background: '#f1f5f9', border: '1px solid #cbd5e1',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, color: '#334155',
          }}>
            {patientName.split(' ').map(n => n[0]).slice(0, 2).join('') || 'PT'}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                {selectedLang === 'mr' || selectedLang === 'hi' ? 'श्रीमती गीता शर्मा' : patientName}
              </span>
              <span style={{ fontSize: 12, color: '#64748b' }}>
                ({patient?.age || 58}Y / {patient?.gender === 'M' ? 'Male' : 'Female'} • {patient?.village || 'Gram Fatehpur'})
              </span>
              <span style={{
                fontSize: 11, fontWeight: 600,
                padding: '2px 8px', borderRadius: 4,
                background: isHighCsme ? '#fee2e2' : '#dcfce7',
                color: isHighCsme ? '#991b1b' : '#166534',
                border: `1px solid ${isHighCsme ? '#fca5a5' : '#86efac'}`,
              }}>
                {isHighCsme ? 'Priority Clinical Referral' : 'Routine Screening'}
              </span>
            </div>

            <div style={{ fontSize: 12.5, color: '#334155', marginTop: 2 }}>
              {isHighCsme
                ? 'जांच निष्कर्ष: मध्यम डायबिटिक रेटिनोपैथी व आँख के केंद्र में सूजन (Center-Involved CSME)'
                : 'जांच निष्कर्ष: सामान्य डायबिटिक रेटिनोपैथी — नियमित परहेज़ आवश्यक'}
            </div>
          </div>
        </div>

        {/* Minimalist Stat Pill */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 8,
          padding: '6px 14px',
          textAlign: 'right',
        }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Hospital Target Window
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: isHighCsme ? '#dc2626' : '#16a34a', marginTop: 1 }}>
            {content.urgencyDays}
          </div>
        </div>
      </div>

      {/* ── Main Two-Column Layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 16, flex: 1 }}>

        {/* ════ LEFT COLUMN: Patient Counseling Script & Guidance ════ */}
        <div style={{
          background: '#ffffff',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          padding: '20px 22px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 1px 3px rgba(15,23,42,0.03)',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <IconMessageCircle size={16} color="#0284c7" />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Patient Counseling Guide (परामर्श मार्गदर्शिका)
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                Standardized clinical dialogue and instructions in the patient's language
              </div>
            </div>

            {/* Language indicator */}
            <span style={{
              background: '#f0f9ff', border: '1px solid #bae6fd',
              color: '#0369a1', fontSize: 11, fontWeight: 700,
              padding: '3px 10px', borderRadius: 6,
            }}>
              {content.langName}
            </span>
          </div>

          {/* Clean Segmented Language Selector */}
          <div style={{
            display: 'flex',
            gap: 4,
            padding: '3px',
            background: '#f1f5f9',
            borderRadius: 8,
            marginBottom: 16,
          }}>
            {LANGUAGES.map(lang => {
              const isSel = selectedLang === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => setSelectedLang(lang.code)}
                  style={{
                    all: 'unset',
                    cursor: 'pointer',
                    flex: 1,
                    textAlign: 'center',
                    padding: '6px 8px',
                    borderRadius: 6,
                    fontSize: 11.5,
                    fontWeight: isSel ? 700 : 500,
                    background: isSel ? '#ffffff' : 'transparent',
                    color: isSel ? '#0f172a' : '#64748b',
                    boxShadow: isSel ? '0 1px 2px rgba(15,23,42,0.06)' : 'none',
                    transition: 'all 0.12s ease',
                  }}
                >
                  <span>{lang.nativeName}</span>
                </button>
              );
            })}
          </div>

          {/* Vernacular Counseling Script Card */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            padding: '16px 18px',
            borderLeft: '4px solid #0284c7',
            marginBottom: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Clinical Dialogue for ASHA Worker to Speak
              </span>
              <button
                onClick={() => setShowEnglishText(!showEnglishText)}
                style={{
                  all: 'unset', cursor: 'pointer',
                  fontSize: 11, color: '#64748b', fontWeight: 600,
                  textDecoration: 'underline',
                }}
              >
                {showEnglishText ? 'Hide English' : 'Show English Translation'}
              </button>
            </div>

            <div style={{
              fontSize: 14,
              lineHeight: 1.7,
              color: '#1e293b',
              fontWeight: 500,
              fontFamily: selectedLang === 'hi' || selectedLang === 'mr' ? '"Noto Sans Devanagari", sans-serif' : 'inherit',
            }}>
              "{content.spokenText}"
            </div>

            {showEnglishText && (
              <div style={{
                marginTop: 12,
                paddingTop: 10,
                borderTop: '1px dashed #cbd5e1',
                fontSize: 12,
                lineHeight: 1.55,
                color: '#475569',
                fontStyle: 'italic',
              }}>
                <strong>English Summary:</strong> {content.englishTranslation}
              </div>
            )}
          </div>

          {/* Key Directives for Patient Care */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10,
            marginBottom: 16,
          }}>
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#991b1b', textTransform: 'uppercase' }}>1. Referral Time</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#b91c1c', marginTop: 2 }}>{content.urgencyDays}</div>
              <div style={{ fontSize: 10.5, color: '#7f1d1d', marginTop: 2 }}>Hospital Specialist Visit</div>
            </div>

            <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#0369a1', textTransform: 'uppercase' }}>2. Retinal Threat</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#0284c7', marginTop: 2 }}>CSME Center</div>
              <div style={{ fontSize: 10.5, color: '#075985', marginTop: 2 }}>Anti-VEGF / Laser Eval</div>
            </div>

            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#92400e', textTransform: 'uppercase' }}>3. Blood Sugar</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#d97706', marginTop: 2 }}>&lt; 130 mg/dL</div>
              <div style={{ fontSize: 10.5, color: '#78350f', marginTop: 2 }}>Strict Fasting Target</div>
            </div>
          </div>

          {/* ASHA Protocol Checklist */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            padding: '12px 14px',
            marginTop: 'auto',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              ASHA Field Protocol Checklist
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', fontSize: 11, color: '#475569' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <IconCheck size={13} color="#16a34a" />
                <span>Screening results explained to patient</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <IconCheck size={13} color="#16a34a" />
                <span>Urgency timeline ({content.urgencyDays}) conveyed</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <IconCheck size={13} color="#16a34a" />
                <span>Glycemic target & diet explained</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <IconCheck size={13} color="#16a34a" />
                <span>Printed referral slip handed over</span>
              </div>
            </div>
          </div>
        </div>

        {/* ════ RIGHT COLUMN: 4 Universal Zero-Literacy Visual Pictocards ════ */}
        <div style={{
          background: '#ffffff',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          padding: '20px 20px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 1px 3px rgba(15,23,42,0.03)',
        }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Zero-Literacy Visual Guide (सचित्र मार्गदर्शिका)
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>
              Universal illustrated visual cues for patients and caregivers
            </div>
          </div>

          {/* 4 Clean Minimalist Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flex: 1 }}>

            {/* Pictocard 1: Hospital Countdown Calendar */}
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 10,
              padding: '14px 12px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <IconCalendar size={22} color="#dc2626" />
                  <span style={{ fontSize: 10, fontWeight: 700, background: '#fee2e2', color: '#991b1b', padding: '2px 6px', borderRadius: 4 }}>
                    Urgent
                  </span>
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#991b1b', letterSpacing: '-0.02em' }}>
                  {content.urgencyDays}
                </div>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#0f172a', marginTop: 3 }}>
                  जिला अस्पताल जाएं
                </div>
              </div>
              <div style={{ fontSize: 10, color: '#b91c1c', borderTop: '1px solid #fecaca', paddingTop: 6, marginTop: 6 }}>
                District Hospital Eye Clinic
              </div>
            </div>

            {/* Pictocard 2: Laser / Drops Treatment */}
            <div style={{
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: 10,
              padding: '14px 12px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <IconEye size={22} color="#0284c7" />
                  <span style={{ fontSize: 10, fontWeight: 700, background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: 4 }}>
                    Care
                  </span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0369a1' }}>
                  आई ड्रॉप्स व लेज़र
                </div>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#0f172a', marginTop: 3 }}>
                  रोशनी की सुरक्षा
                </div>
              </div>
              <div style={{ fontSize: 10, color: '#0284c7', borderTop: '1px solid #bae6fd', paddingTop: 6, marginTop: 6 }}>
                Protect Retinal Vision
              </div>
            </div>

            {/* Pictocard 3: Sugar Control Target */}
            <div style={{
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: 10,
              padding: '14px 12px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <IconDroplet size={22} color="#d97706" />
                  <span style={{ fontSize: 10, fontWeight: 700, background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: 4 }}>
                    Target
                  </span>
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#92400e', letterSpacing: '-0.02em' }}>
                  &lt; 130 mg/dL
                </div>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#0f172a', marginTop: 3 }}>
                  खाली पेट शूगर
                </div>
              </div>
              <div style={{ fontSize: 10, color: '#b45309', borderTop: '1px solid #fde68a', paddingTop: 6, marginTop: 6 }}>
                Fasting Glucose Goal
              </div>
            </div>

            {/* Pictocard 4: Diet Dos & Don'ts */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              padding: '12px 10px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <IconUtensils size={18} color="#475569" />
                  <span style={{ fontSize: 10, fontWeight: 700, background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: 4 }}>
                    Diet
                  </span>
                </div>
                <div style={{
                  background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 5,
                  padding: '3px 6px', marginBottom: 5, fontSize: 9.5, color: '#166534', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  <IconCheck size={11} color="#16a34a" />
                  <span>पालक, दालें, करेला, पानी</span>
                </div>
                <div style={{
                  background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 5,
                  padding: '3px 6px', fontSize: 9.5, color: '#991b1b', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  <IconX size={11} color="#dc2626" />
                  <span>मिठाई, मीठी चाय, समोसा</span>
                </div>
              </div>
              <div style={{ fontSize: 9.5, color: '#64748b', borderTop: '1px solid #e2e8f0', paddingTop: 4, marginTop: 4, textAlign: 'center' }}>
                Strict Nutrition Control
              </div>
            </div>

          </div>

          {/* Action CTA */}
          <div style={{ marginTop: 14 }}>
            <button
              onClick={onPrintSlip}
              style={{
                all: 'unset',
                cursor: 'pointer',
                width: '100%',
                boxSizing: 'border-box',
                padding: '9px 14px',
                borderRadius: 8,
                background: '#0f172a',
                color: '#ffffff',
                fontSize: 12,
                fontWeight: 600,
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
                boxShadow: '0 1px 2px rgba(15,23,42,0.1)',
                transition: 'all 0.15s ease',
              }}
            >
              <IconPrinter size={15} color="#ffffff" />
              <span>Print Patient Takeaway Handout</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
