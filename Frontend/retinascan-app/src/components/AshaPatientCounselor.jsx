import React, { useState, useEffect } from 'react';
import { LANGUAGES, getCounselorContent } from '../counselorData.js';

/* ── Earthbound Biotech Color Tokens ──────────────────────────────────────── */
const EB = {
  forest:    '#25351A',
  forestHover: '#334724',
  olive:     '#4C3D12',
  ivory:     '#F4F4E9',
  cardBg:    '#FFFFFF',
  sage:      '#7D8960',
  sageLight: '#E8EBDD',
  celery:    '#E3EBC9',
  celeryDark:'#4D6038',
  border:    '#D6DAC8',
  ink:       '#171812',
  inkMuted:  '#5C6450',
  inkLight:  '#858575',
  urgentBg:  '#FBE8E8',
  urgentText:'#881337',
  urgentBorder:'#F4AAAA',
  routineBg: '#EAF0E2',
  routineText:'#1B381B',
  routineBorder:'#B8CEAA',
};

/* ── Minimalist Clean Icons ──────────────────────────────────────────────── */
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

function IconVolume({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
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
  const [isSpeaking, setIsSpeaking] = useState(false);

  const patientName = patient?.fullName || patient?.name || 'Smt. Geeta Sharma';
  const content = getCounselorContent(selectedLang, patientName, severity, csmeRisk);

  useEffect(() => {
    if (currentAppLang) {
      setSelectedLang(currentAppLang);
    }
  }, [currentAppLang]);

  // Clean speech synthesis
  const handleToggleSpeak = () => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(content.spokenText);
    const langObj = LANGUAGES.find(l => l.code === selectedLang);
    if (langObj?.bcp47) utterance.lang = langObj.bcp47;
    utterance.rate = 0.9;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

  const isHighCsme = csmeRisk === 'HIGH';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: EB.ivory,
      color: EB.ink,
      fontFamily: 'Inter, system-ui, sans-serif',
      overflowY: 'auto',
      padding: '16px 22px 32px',
    }}>

      {/* ── Top Bar: Clean Action Bar (Decluttered) ── */}
      <div style={{
        background: EB.cardBg,
        border: `1px solid ${EB.border}`,
        borderRadius: 8,
        padding: '10px 18px',
        marginBottom: 14,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 10,
        boxShadow: '0 1px 3px rgba(37,53,26,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 6,
            background: EB.forest,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#FFFFFF',
          }}>
            <IconStethoscope size={16} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: EB.forest, letterSpacing: '-0.01em' }}>
                ASHA Patient Counseling
              </h2>
              <span style={{
                background: EB.sageLight, color: EB.forest,
                fontSize: 10.5, fontWeight: 600, padding: '1px 7px', borderRadius: 4,
                border: `1px solid ${EB.border}`,
              }}>
                मरीज़ व आशा परामर्श
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={onSwitchToDoctor}
            style={{
              all: 'unset', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 6,
              background: '#FFFFFF', border: `1px solid ${EB.border}`,
              color: EB.forest, fontSize: 11.5, fontWeight: 600,
              transition: 'background 0.12s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = EB.sageLight}
            onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}
          >
            <IconStethoscope size={13} color={EB.forest} />
            <span>Doctor Workstation</span>
          </button>

          <button
            onClick={onPrintSlip}
            style={{
              all: 'unset', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 6,
              background: EB.forest, color: '#FFFFFF',
              fontSize: 11.5, fontWeight: 700,
              boxShadow: '0 1px 3px rgba(37,53,26,0.2)',
              transition: 'background 0.12s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = EB.forestHover}
            onMouseLeave={e => e.currentTarget.style.background = EB.forest}
          >
            <IconPrinter size={14} color="#FFFFFF" />
            <span>Print Patient Slip</span>
          </button>
        </div>
      </div>

      {/* ── Patient Identity & Triage Status Strip (Decluttered) ── */}
      <div style={{
        background: EB.cardBg,
        border: `1px solid ${EB.border}`,
        borderRadius: 8,
        padding: '12px 18px',
        marginBottom: 14,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        boxShadow: '0 1px 3px rgba(37,53,26,0.03)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 6,
            background: EB.celery, border: `1px solid ${EB.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 800, color: EB.forest,
          }}>
            {patientName.split(' ').map(n => n[0]).slice(0, 2).join('') || 'PT'}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: EB.ink }}>
                {selectedLang === 'mr' || selectedLang === 'hi' ? 'श्रीमती गीता शर्मा' : patientName}
              </span>
              <span style={{ fontSize: 11.5, color: EB.inkMuted }}>
                {patient?.age || 58}Y / {patient?.gender === 'M' ? 'Male' : 'Female'} • {patient?.village || 'Gram Mandawar'}
              </span>
              <span style={{
                fontSize: 10.5, fontWeight: 700,
                padding: '2px 8px', borderRadius: 4,
                background: isHighCsme ? EB.urgentBg : EB.routineBg,
                color: isHighCsme ? EB.urgentText : EB.routineText,
                border: `1px solid ${isHighCsme ? EB.urgentBorder : EB.routineBorder}`,
              }}>
                {isHighCsme ? '● URGENT REFERRAL (CSME)' : '○ ROUTINE MONITORING'}
              </span>
            </div>

            <div style={{ fontSize: 12, color: EB.inkMuted, marginTop: 2 }}>
              {isHighCsme
                ? 'मध्यम डायबिटिक रेटिनोपैथी व मैक्युलर सूजन — विशेषज्ञ जांच आवश्यक'
                : 'स्थिर रेटिना — नियमित 1 वर्ष में जांच आवश्यक'}
            </div>
          </div>
        </div>

        {/* Big High-Contrast Urgency Window */}
        <div style={{
          background: isHighCsme ? '#FDF2F2' : '#F5F7EF',
          border: `1px solid ${isHighCsme ? '#FCA5A5' : EB.border}`,
          borderRadius: 6,
          padding: '6px 14px',
          textAlign: 'right',
        }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: isHighCsme ? EB.urgentText : EB.inkMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Hospital Timeline
          </div>
          <div style={{ fontSize: 15, fontWeight: 900, color: isHighCsme ? EB.urgentText : EB.forest, marginTop: 1 }}>
            {content.urgencyDays}
          </div>
        </div>
      </div>

      {/* ── Main Two-Column Layout (Decluttered: Spoken Dialogue vs Visual Pictocards) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 14, flex: 1, minHeight: 0 }}>

        {/* ════ LEFT COLUMN: Focused Spoken Dialogue ════ */}
        <div style={{
          background: EB.cardBg,
          borderRadius: 8,
          border: `1px solid ${EB.border}`,
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 1px 3px rgba(37,53,26,0.03)',
        }}>
          {/* Header & Language selector */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: EB.forest, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Words to Speak to Patient (परामर्श संवाद)
            </span>

            {/* Language Pills */}
            <div style={{
              display: 'flex',
              gap: 3,
              padding: '2px',
              background: EB.sageLight,
              borderRadius: 6,
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
                      padding: '3px 8px',
                      borderRadius: 4,
                      fontSize: 10.5,
                      fontWeight: isSel ? 700 : 500,
                      background: isSel ? EB.forest : 'transparent',
                      color: isSel ? '#FFFFFF' : EB.forest,
                      transition: 'all 0.12s',
                    }}
                  >
                    <span>{lang.nativeName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vernacular Counseling Script Box (Spacious, Clear, Actionable) */}
          <div style={{
            background: '#FAF9F2',
            border: `1px solid ${EB.border}`,
            borderLeft: `4px solid ${EB.sage}`,
            borderRadius: 6,
            padding: '14px 16px',
            marginBottom: 12,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: EB.sage, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {content.langName} Script
                </span>
                <button
                  onClick={handleToggleSpeak}
                  style={{
                    all: 'unset', cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '2px 8px', borderRadius: 4,
                    background: isSpeaking ? EB.urgentBg : EB.celery,
                    color: isSpeaking ? EB.urgentText : EB.forest,
                    fontSize: 10.5, fontWeight: 700,
                  }}
                  title="Speak vernacular dialogue aloud"
                >
                  <IconVolume size={13} color={isSpeaking ? EB.urgentText : EB.forest} />
                  <span>{isSpeaking ? 'Stop' : 'Listen / सुनिए'}</span>
                </button>
              </div>

              <div style={{
                fontSize: 14,
                lineHeight: 1.65,
                color: EB.ink,
                fontWeight: 500,
              }}>
                "{content.spokenText}"
              </div>
            </div>

            {/* Collapsible English helper */}
            <div style={{ marginTop: 10, paddingTop: 8, borderTop: `1px dashed ${EB.border}` }}>
              <button
                onClick={() => setShowEnglishText(!showEnglishText)}
                style={{
                  all: 'unset', cursor: 'pointer',
                  fontSize: 10.5, color: EB.sage, fontWeight: 600,
                  textDecoration: 'underline',
                }}
              >
                {showEnglishText ? '▲ Hide English translation' : '▼ Show English translation'}
              </button>

              {showEnglishText && (
                <div style={{
                  marginTop: 6,
                  fontSize: 11,
                  lineHeight: 1.5,
                  color: EB.inkMuted,
                  fontStyle: 'italic',
                }}>
                  {content.englishTranslation}
                </div>
              )}
            </div>
          </div>

          {/* Compact 3-Point Takeaway Summary (Clean & Decluttered) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
            marginBottom: 10,
          }}>
            <div style={{ background: '#FAF9F2', border: `1px solid ${EB.border}`, borderRadius: 6, padding: '8px 10px' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: EB.inkMuted, textTransform: 'uppercase' }}>1. Timeline</div>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: EB.forest, marginTop: 1 }}>{content.urgencyDays}</div>
              <div style={{ fontSize: 10, color: EB.inkMuted }}>District Eye Clinic</div>
            </div>

            <div style={{ background: '#FAF9F2', border: `1px solid ${EB.border}`, borderRadius: 6, padding: '8px 10px' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: EB.inkMuted, textTransform: 'uppercase' }}>2. Glucose</div>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: EB.forest, marginTop: 1 }}>&lt; 130 mg/dL</div>
              <div style={{ fontSize: 10, color: EB.inkMuted }}>Fasting Sugar Goal</div>
            </div>

            <div style={{ background: '#FAF9F2', border: `1px solid ${EB.border}`, borderRadius: 6, padding: '8px 10px' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: EB.inkMuted, textTransform: 'uppercase' }}>3. Diet</div>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: EB.forest, marginTop: 1 }}>No Sweets</div>
              <div style={{ fontSize: 10, color: EB.inkMuted }}>Avoid Sugary Tea</div>
            </div>
          </div>

          {/* Compact Verification Strip */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: EB.sageLight, border: `1px solid ${EB.border}`, borderRadius: 6,
            padding: '6px 12px', fontSize: 10.5, color: EB.forest,
          }}>
            <span style={{ fontWeight: 700 }}>ASHA Verification:</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <IconCheck size={12} color={EB.forest} /> Result Explained
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <IconCheck size={12} color={EB.forest} /> Referral Handed Over
            </span>
          </div>
        </div>

        {/* ════ RIGHT COLUMN: Authentic Clinical Patient Medical Advice Slip ════ */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 8,
          border: `1px solid ${EB.border}`,
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 2px 10px rgba(37,53,26,0.06)',
          position: 'relative',
        }}>
          {/* Official Letterhead */}
          <div style={{ borderBottom: `2px solid ${EB.forest}`, paddingBottom: 10, marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 800, color: EB.sage, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                  National Health Mission · NPCB&VI Rural Eye Care
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 900, color: EB.forest, letterSpacing: '-0.01em' }}>
                  PATIENT EYE CARE ADVICE SLIP
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: EB.ink }}>
                  रोगी नेत्र स्वास्थ्य एवं परामर्श पर्ची
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: EB.ink }}>
                  {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
                <div style={{ fontSize: 9.5, color: EB.inkMuted, fontFamily: 'monospace', marginTop: 1 }}>
                  REF: {patient?.id || 'DR-88219'}
                </div>
                <span style={{
                  display: 'inline-block', marginTop: 4, padding: '2px 6px', borderRadius: 4,
                  background: isHighCsme ? EB.urgentBg : EB.routineBg,
                  color: isHighCsme ? EB.urgentText : EB.routineText,
                  border: `1px solid ${isHighCsme ? EB.urgentBorder : EB.routineBorder}`,
                  fontSize: 9, fontWeight: 800, textTransform: 'uppercase',
                }}>
                  {isHighCsme ? '● Urgent Referral' : '○ Routine Recall'}
                </span>
              </div>
            </div>

            {/* Patient Demographics Strip */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginTop: 8, paddingTop: 6, borderTop: `1px dashed ${EB.border}`,
              fontSize: 10.5, color: EB.inkMuted,
            }}>
              <span><strong>मरीज (Patient):</strong> {patientName} ({patient?.age || 58} Y / {patient?.gender === 'M' ? 'Male' : 'Female'})</span>
              <span><strong>केंद्र (Center):</strong> {patient?.village || 'Sub-Center Mandawar'}</span>
            </div>
          </div>

          {/* Rx Prescription Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 900, color: EB.forest, fontFamily: 'serif' }}>℞</span>
            <span style={{ fontSize: 10.5, fontWeight: 800, color: EB.forest, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Clinical Directives & Home Care (परामर्श निर्देश)
            </span>
          </div>

          {/* 4 Clinical Advice Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, flex: 1 }}>

            {/* Section 1: Hospital Consultation Timeline */}
            <div style={{
              background: '#FAF9F2',
              border: `1px solid ${isHighCsme ? '#FCA5A5' : EB.border}`,
              borderLeft: `4px solid ${isHighCsme ? EB.urgentText : EB.forest}`,
              borderRadius: 5,
              padding: '8px 10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 5,
                  background: isHighCsme ? EB.urgentBg : EB.celery,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <IconCalendar size={17} color={isHighCsme ? EB.urgentText : EB.forest} />
                </div>
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 800, color: EB.ink }}>
                    जिला अस्पताल नेत्र विभाग जाएं (Hospital Visit)
                  </div>
                  <div style={{ fontSize: 10, color: EB.inkMuted }}>
                    Macular OCT व नेत्र विशेषज्ञ जांच आवश्यक
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <span style={{
                  fontSize: 13, fontWeight: 900,
                  color: isHighCsme ? EB.urgentText : EB.forest,
                  background: isHighCsme ? '#FEE2E2' : '#E8EBDD',
                  padding: '3px 8px', borderRadius: 4, display: 'inline-block',
                }}>
                  {content.urgencyDays}
                </span>
              </div>
            </div>

            {/* Section 2: Retinal Vision Protection */}
            <div style={{
              background: '#FAF9F2',
              border: `1px solid ${EB.border}`,
              borderLeft: `4px solid ${EB.sage}`,
              borderRadius: 5,
              padding: '8px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: 9,
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: 5,
                background: EB.sageLight,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <IconEye size={17} color={EB.forest} />
              </div>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: EB.ink }}>
                  आई ड्रॉप्स व रोशनी की सुरक्षा (Ocular Care Protocol)
                </div>
                <div style={{ fontSize: 10, color: EB.inkMuted }}>
                  डॉक्टर द्वारा दी गई ड्रॉप्स समय पर डालें, तेज धूप में चश्मा लगाएं, आंखें कतई न मलें
                </div>
              </div>
            </div>

            {/* Section 3: Glycemic Control Target */}
            <div style={{
              background: '#FAF9F2',
              border: `1px solid ${EB.border}`,
              borderLeft: `4px solid #C2410C`,
              borderRadius: 5,
              padding: '8px 10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 5,
                  background: '#FFEDD5',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <IconDroplet size={17} color="#C2410C" />
                </div>
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 800, color: EB.ink }}>
                    मधुमेह नियंत्रण लक्ष्य (Fasting Blood Sugar)
                  </div>
                  <div style={{ fontSize: 10, color: EB.inkMuted }}>
                    दवा व इंसुलिन का नियमित सेवन करें, हर 15 दिन में शूगर जांचें
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <span style={{
                  fontSize: 13, fontWeight: 900, color: '#9A3412',
                  background: '#FFEDD5', padding: '3px 8px', borderRadius: 4, display: 'inline-block',
                }}>
                  &lt; 130 mg/dL
                </span>
              </div>
            </div>

            {/* Section 4: Dietary Guidelines */}
            <div style={{
              background: '#FAF9F2',
              border: `1px solid ${EB.border}`,
              borderLeft: `4px solid #274E13`,
              borderRadius: 5,
              padding: '8px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: 9,
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: 5,
                background: '#EAF0E2',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <IconUtensils size={17} color="#274E13" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: EB.ink, marginBottom: 2 }}>
                  खान-पान नियम (Dietary Do's &amp; Don'ts)
                </div>
                <div style={{ display: 'flex', gap: 8, fontSize: 9.5 }}>
                  <span style={{ color: '#274E13', fontWeight: 700 }}>✓ हरी सब्जियां, जामुन, करेला, दालें</span>
                  <span style={{ color: '#A02511', fontWeight: 700 }}>✕ मीठी चाय, मिठाई, तली चीजें बंद</span>
                </div>
              </div>
            </div>

          </div>

          {/* Verification & Helpline Footer */}
          <div style={{
            marginTop: 9, paddingTop: 8, borderTop: `1px solid ${EB.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontSize: 9.5, color: EB.inkMuted,
          }}>
            <div>
              <strong>हेल्पलाइन:</strong> 104 (स्वास्थ्य सेवा) / 108 (एम्बुलेंस)
            </div>
            <div style={{ textAlign: 'right', fontStyle: 'italic' }}>
              हस्ताक्षर आशा कार्यकर्ता (ASHA Verification)
            </div>
          </div>

          {/* Action CTA */}
          <div style={{ marginTop: 9 }}>
            <button
              onClick={onPrintSlip}
              style={{
                all: 'unset',
                cursor: 'pointer',
                width: '100%',
                boxSizing: 'border-box',
                padding: '9px 12px',
                borderRadius: 6,
                background: EB.forest,
                color: '#FFFFFF',
                fontSize: 12,
                fontWeight: 700,
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                boxShadow: '0 1px 3px rgba(37,53,26,0.2)',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = EB.forestHover}
              onMouseLeave={e => e.currentTarget.style.background = EB.forest}
            >
              <IconPrinter size={14} color="#FFFFFF" />
              <span>Print Medical Advice Slip (परामर्श पर्ची प्रिंट करें)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
