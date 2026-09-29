import React, { useState } from 'react';

const G = { BG: '#030c14', CARD: 'rgba(255,255,255,0.04)', BORDER: 'rgba(255,255,255,0.08)', TEAL: '#00d4aa', TEXT: '#f0f6ff', SUB: '#8fa3bb', MUTED: '#4d6278' };

const SEV_NAMES = {
  0: 'No Apparent Diabetic Retinopathy (Healthy)',
  1: 'Mild Non-Proliferative Diabetic Retinopathy (NPDR)',
  2: 'Moderate Non-Proliferative Diabetic Retinopathy (NPDR)',
  3: 'Severe Non-Proliferative Diabetic Retinopathy (NPDR)',
  4: 'Proliferative Diabetic Retinopathy (PDR)',
};

function GlassCard({ children, style = {} }) {
  return (
    <div style={{ background: G.CARD, border: `1px solid ${G.BORDER}`, borderRadius: 16, backdropFilter: 'blur(20px)', ...style }}>
      {children}
    </div>
  );
}

function InfoRow({ label, value, mono = false, highlight = false }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: G.MUTED, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: mono ? 700 : 600, color: highlight ? G.TEAL : G.TEXT, fontFamily: mono ? 'JetBrains Mono, monospace' : 'Inter, sans-serif' }}>{value}</div>
    </div>
  );
}

export default function Referral({ navigate, patient, severity = 2, selectedEye = 'od' }) {
  const [toast, setToast] = useState(false);

  const name            = patient?.fullName || patient?.name || 'Smt. Geeta Sharma';
  const age             = patient?.age || 58;
  const gender          = patient?.gender === 'M' ? 'Male' : 'Female';
  const currentSeverity = severity ?? patient?.severity ?? 2;
  const currentEye      = selectedEye?.toUpperCase() || 'OD';
  const isPriority      = currentSeverity >= 2;

  function handleDownload() { setToast(true); setTimeout(() => setToast(false), 3500); }

  return (
    <main style={{ minHeight: '100vh', paddingTop: 80, paddingBottom: 60, background: G.BG, color: G.TEXT, fontFamily: 'Inter, sans-serif', position: 'relative' }}>
      <div className="orb" style={{ width: 500, height: 500, top: -100, right: -100, background: 'rgba(0,212,170,0.05)' }} />
      <div className="dot-grid" style={{ position: 'absolute', inset: 0, opacity: 0.4, pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 32px', display: 'flex', flexDirection: 'column', gap: 20, position: 'relative', zIndex: 1 }}>

        {/* Top actions */}
        <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <button onClick={() => navigate('canvas')} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10,
            background: G.CARD, border: `1px solid ${G.BORDER}`, color: G.SUB, fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>arrow_back</span>
            Back to Diagnostic Canvas
          </button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => window.print()} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10,
              background: G.CARD, border: `1px solid ${G.BORDER}`, color: G.SUB, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>print</span>
              Print Slip
            </button>
            <button onClick={handleDownload} className="btn-teal" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, fontSize: 12 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>download</span>
              Export PDF Bundle
            </button>
          </div>
        </div>

        {/* Referral document */}
        <GlassCard style={{ padding: '36px 40px', display: 'flex', flexDirection: 'column', gap: 28 }}>

          {/* Document header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20, paddingBottom: 24, borderBottom: `1px solid ${G.BORDER}` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ color: G.TEAL, fontSize: 28, fontVariationSettings: "'FILL' 1" }}>local_hospital</span>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 6, background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)', fontSize: 10, fontWeight: 700, color: G.TEAL, fontFamily: 'JetBrains Mono, monospace' }}>MoHFW · Tele-Ocular Core</span>
                  <span style={{ fontSize: 11, color: G.MUTED, fontFamily: 'JetBrains Mono, monospace' }}>DISPATCH #{patient?.id?.replace('#', '') || 'RS-2026-0841'}</span>
                </div>
                <h1 style={{ margin: '0 0 6px', fontFamily: 'Manrope, sans-serif', fontSize: 24, fontWeight: 800, color: G.TEXT, letterSpacing: '-0.01em' }}>Clinical Tele-Ophthalmology Referral</h1>
                <p style={{ margin: 0, fontSize: 13, color: G.MUTED }}>National Diabetic Retinopathy Point-of-Care Triage Protocol</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, background: isPriority ? 'rgba(251,146,60,0.1)' : 'rgba(0,212,170,0.08)', border: `1px solid ${isPriority ? 'rgba(251,146,60,0.3)' : 'rgba(0,212,170,0.2)'}`, fontSize: 11, fontWeight: 700, color: isPriority ? '#fb923c' : G.TEAL, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: isPriority ? '#fb923c' : G.TEAL }} />
                {isPriority ? 'Priority Triage' : 'Standard Triage'}
              </span>
              <span style={{ fontSize: 11, color: G.MUTED, fontFamily: 'JetBrains Mono, monospace' }}>Issued: Today, 14:32 IST</span>
            </div>
          </div>

          {/* Main two-column */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>

            {/* Left */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Patient ID */}
              <GlassCard style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${G.BORDER}` }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: G.MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'JetBrains Mono, monospace' }}>Patient Identification</span>
                  <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)', fontSize: 9, fontWeight: 700, color: G.TEAL, fontFamily: 'JetBrains Mono, monospace' }}>ABHA VERIFIED</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <InfoRow label="Full Name" value={name} />
                  <InfoRow label="Demographics" value={`${gender}, ${age} Years`} />
                  <div style={{ gridColumn: 'span 2' }}>
                    <InfoRow label="Ayushman Bharat Health Account (ABHA ID)" value="91-0421-8821-4409" mono highlight />
                  </div>
                </div>
              </GlassCard>

              {/* Clinical assessment */}
              <GlassCard style={{ padding: 20 }}>
                <div style={{ marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid ${G.BORDER}` }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: G.MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'JetBrains Mono, monospace' }}>Diagnostic Impression & Biomarkers</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* Grade box */}
                  <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(0,212,170,0.05)', border: '1px solid rgba(0,212,170,0.15)' }}>
                    <div style={{ fontSize: 9, fontWeight: 600, color: G.MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, fontFamily: 'JetBrains Mono, monospace' }}>Verified ICDR Grade</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: G.TEXT, marginBottom: 4 }}>{SEV_NAMES[currentSeverity] || SEV_NAMES[2]}</div>
                    <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: G.TEAL, fontWeight: 600 }}>ICDR Level {currentSeverity} · Bilateral ({currentEye} Primary Focus)</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {[
                      { label: 'Retinal Biomarkers', val: patient?.findings || 'Microaneurysms detected in nasal quadrant', color: G.TEXT },
                      { label: 'Macular Edema Status', val: currentSeverity >= 2 ? 'CSME Suspicious (>500µm)' : 'Negative', color: currentSeverity >= 2 ? '#fb923c' : '#34d399' },
                    ].map(item => (
                      <div key={item.label} style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: `1px solid ${G.BORDER}` }}>
                        <div style={{ fontSize: 10, color: G.MUTED, marginBottom: 5 }}>{item.label}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: item.color, lineHeight: 1.4 }}>{item.val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Right */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Routing */}
              <GlassCard style={{ padding: 20 }}>
                <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${G.BORDER}` }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: G.MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'JetBrains Mono, monospace' }}>Referral Target & Routing</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 10, color: G.MUTED, marginBottom: 4 }}>Designated Facility</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: G.TEXT }}>Dept. of Ophthalmology</div>
                    <div style={{ fontSize: 12, color: G.SUB }}>District Hospital Alwar, Rajasthan</div>
                    <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: G.MUTED, marginTop: 3 }}>PIN: 301001 · +91 144 233 4511</div>
                  </div>
                  <div style={{ padding: '14px', borderRadius: 12, background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.2)' }}>
                    <div style={{ fontSize: 9, fontWeight: 600, color: G.TEAL, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, fontFamily: 'JetBrains Mono, monospace' }}>Action Timeline</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: G.TEXT, marginBottom: 2 }}>Within 14 – 21 Days</div>
                    <div style={{ fontSize: 11, color: G.MUTED, fontFamily: 'JetBrains Mono, monospace' }}>Target Closes: 30-OCT-2026</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: G.MUTED, marginBottom: 6 }}>Tele-Consultant Reviewer</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="material-symbols-outlined" style={{ color: G.TEAL, fontSize: 18 }}>badge</span>
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: G.TEXT }}>Dr. Arvind Mehta, MS (Ophthal)</div>
                        <div style={{ fontSize: 10, color: G.MUTED, fontFamily: 'JetBrains Mono, monospace', marginTop: 2 }}>Tele-Consultant #602 · Node 04</div>
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* Crypto seal */}
              <GlassCard style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: G.MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, fontFamily: 'JetBrains Mono, monospace' }}>Cryptographic Seal</div>
                  <div style={{ fontSize: 11, color: G.SUB, fontFamily: 'JetBrains Mono, monospace' }}>SHA256: 8f9b...a104</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
                    <span className="material-symbols-outlined" style={{ color: '#34d399', fontSize: 14, fontVariationSettings: "'FILL' 1" }}>verified</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#34d399' }}>Encrypted Record</span>
                  </div>
                </div>
                {/* Mini QR */}
                <div style={{ width: 56, height: 56, background: '#f0f6ff', borderRadius: 8, padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="100%" height="100%" viewBox="0 0 100 100" fill="#030c14">
                    <rect x="5" y="5" width="28" height="28" /><rect x="10" y="10" width="18" height="18" fill="#f0f6ff"/><rect x="14" y="14" width="10" height="10" />
                    <rect x="67" y="5" width="28" height="28"/><rect x="72" y="10" width="18" height="18" fill="#f0f6ff"/><rect x="76" y="14" width="10" height="10"/>
                    <rect x="5" y="67" width="28" height="28"/><rect x="10" y="72" width="18" height="18" fill="#f0f6ff"/><rect x="14" y="76" width="10" height="10"/>
                    <circle cx="50" cy="50" r="8"/><rect x="40" y="15" width="8" height="20"/><rect x="75" y="45" width="12" height="12"/><rect x="50" y="75" width="15" height="10"/>
                  </svg>
                </div>
              </GlassCard>
            </div>
          </div>

          {/* Instructions strip */}
          <GlassCard style={{ padding: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: G.MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'JetBrains Mono, monospace', marginBottom: 14 }}>Instructions for Patient & Community Health Worker (ASHA)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {[
                { role: 'For Patient / Family:', text: 'Carry this slip, Aadhaar card, and current diabetes prescriptions to District Hospital Alwar (Counter 4 - Eye OPD).' },
                { role: 'For ASHA / Health Worker:', text: 'Confirm transport logistics within 7 days and record hospital seal in the e-Sanjeevani tablet buffer upon visit.' },
              ].map(item => (
                <div key={item.role}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: G.TEXT, marginBottom: 6 }}>{item.role}</div>
                  <p style={{ margin: 0, fontSize: 12, color: G.MUTED, lineHeight: 1.65 }}>{item.text}</p>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* FHIR footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, borderTop: `1px solid ${G.BORDER}`, fontSize: 10, color: G.MUTED, fontFamily: 'JetBrains Mono, monospace', flexWrap: 'wrap', gap: 6 }}>
            <span>HL7-FHIR R4 #90184 · SHA-256 Retinal Hash Verified</span>
            <span>Gateway Node: RJ-ALW-09</span>
          </div>
        </GlassCard>

        {/* Start over */}
        <div className="no-print" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate('home')} className="btn-teal" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 32px', borderRadius: 12, fontSize: 14 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>sync</span>
            Start Over / New Patient Screening
          </button>
          <span style={{ fontSize: 12, color: G.MUTED }}>Session saved and synchronized with local cache.</span>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 100,
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 20px', borderRadius: 12,
          background: 'rgba(0,212,170,0.15)', border: '1px solid rgba(0,212,170,0.35)',
          backdropFilter: 'blur(20px)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          fontSize: 13, fontWeight: 600, color: G.TEAL,
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          Clinical referral package generated successfully.
        </div>
      )}
    </main>
  );
}
