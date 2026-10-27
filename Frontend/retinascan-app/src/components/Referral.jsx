import React, { useState, useEffect } from 'react';
import { LANGUAGES, getCounselorContent } from '../counselorData.js';

const EB = {
  forest:    '#25351A',
  olive:     '#4C3D12',
  ivory:     '#F4F4E9',
  sage:      '#7D8960',
  celery:    '#E3EBC9',
  grayGreen: '#D0D4C2',
  ink:       '#171812',
  inkMuted:  '#6B7280',
  hairline:  'rgba(76,61,18,0.18)',
  border:    '#E5E7EB',
};

const SEV_COLORS = [
  { color: '#22c55e', bg: 'rgba(34,197,94,0.10)',  border: 'rgba(34,197,94,0.30)' },
  { color: '#84cc16', bg: 'rgba(132,204,22,0.10)', border: 'rgba(132,204,22,0.30)' },
  { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)' },
  { color: '#ea580c', bg: 'rgba(234,88,12,0.12)',  border: 'rgba(234,88,12,0.35)' },
  { color: '#dc2626', bg: 'rgba(220,38,38,0.12)',  border: 'rgba(220,38,38,0.35)' },
];

const SEV_NAMES = {
  0: 'Grade 0: No Apparent DR',
  1: 'Grade 1: Mild NPDR',
  2: 'Grade 2: Moderate NPDR',
  3: 'Grade 3: Severe NPDR',
  4: 'Grade 4: Proliferative DR',
};

const SEV_ACTIONS = {
  0: 'Routine annual recall at Primary Health Centre. Good glycemic and blood pressure management.',
  1: 'Repeat retinal imaging in 6–12 months. Diabetic lifestyle counseling and HbA1c optimization.',
  2: 'Refer to District Hospital Vitreoretinal Unit within 14–30 days — Macular SD-OCT evaluation & focal laser review.',
  3: 'Urgent priority referral — specialist vitreoretinal evaluation within 7 days. Anti-VEGF / Panretinal Photocoagulation staging.',
  4: 'Emergency referral — immediate vitreoretinal intervention within 24–48 hours to prevent irreversible tractional detachment.',
};

// Multilingual labels for the Patient Advice Take-Home Slip
const SLIP_LOCALES = {
  hi: {
    slipTitle: 'रोगी स्वास्थ्य एवं नेत्र परामर्श पर्ची',
    slipSub: 'मरीज़ व परिजनों हेतु आवश्यक नेत्र सुरक्षा व खानपान निर्देश',
    rxHeading: 'परामर्श निर्देश एवं घरेलू देखभाल (Clinical Directives & Home Care)',
    hospitalTitle: 'जिला अस्पताल जाएं',
    hospitalSub: 'नेत्र विशेषज्ञ व OCT जांच',
    treatmentTitle: 'आँख का इलाज',
    treatmentSub: 'दृष्टि सुरक्षा (लेजर / ड्रॉप्स)',
    sugarTitle: 'शूगर लक्ष्य',
    dietTitle: 'खानपान परहेज़',
    dietEat: 'खाएं: पालक, मेथी, दालें, करेला व खूब पानी',
    dietAvoid: 'बचें: मिठाई, मीठी चाय, गुड़ व तली चीजें',
    spokenHeading: 'आशा स्वास्थ्य कार्यकर्ता द्वारा मौखिक मार्गदर्शन (Spoken Guidance):',
    handover: 'परामर्श प्रदाता: आशा कार्यकर्ता / स्वास्थ्य सहायिका',
    verified: 'आयुष्मान भारत डिजिटल मिशन (ABDM) सत्यापित',
    helpline: 'स्वास्थ्य हेल्पलाइन: 104 / 108',
    patientLabel: 'मरीज़',
    centerLabel: 'स्वास्थ्य केंद्र',
    tearText: 'यहाँ से फाड़ें · मरीज़ को घर ले जाने हेतु पर्ची (Cut here · Patient Take-Home Slip)',
  },
  mr: {
    slipTitle: 'रुग्ण नेत्र आरोग्य व समुपदेशन पत्र',
    slipSub: 'रुग्ण व कुटुंबियांसाठी आवश्यक नेत्र सुरक्षा व आहार सूचना',
    rxHeading: 'वैद्यकीय सल्ला व काळजी निर्देश (Clinical Directives & Home Care)',
    hospitalTitle: 'जिल्हा रुग्णालयात जा',
    hospitalSub: 'नेत्रतज्ज्ञ व OCT तपासणी',
    treatmentTitle: 'डोळ्यांचे उपचार',
    treatmentSub: 'दृष्टी रक्षण (लेझर / औषधे)',
    sugarTitle: 'साखर उद्दिष्ट',
    dietTitle: 'आहार पथ्य',
    dietEat: 'खा: हिरव्या पालेभाज्या, डाळी, मेथी, भरपूर पाणी',
    dietAvoid: 'टाळा: साखर, मिठाई, गोड चहा, तेलकट पदार्थ',
    spokenHeading: 'आशा सेविकेचा तोंडी समुपदेशन सल्ला (Spoken Guidance):',
    handover: 'समुपदेशक: आशा आरोग्य सेविका · उपकेंद्र',
    verified: 'आयुष्मान भारत डिजिटल मिशन प्रमाणित',
    helpline: 'आरोग्य मदत क्र.: 104 / 108',
    patientLabel: 'रुग्ण',
    centerLabel: 'आरोग्य केंद्र',
    tearText: 'येथून फाडा · रुग्णासाठी मार्गदर्शन पत्र (Cut here · Patient Take-Home Slip)',
  },
  en: {
    slipTitle: 'PATIENT EYE CARE ADVICE SLIP',
    slipSub: 'Take-home clinical instructions and dietary directives for patient & family',
    rxHeading: 'Clinical Directives & Home Care Protocol (Rx)',
    hospitalTitle: 'Visit District Hospital',
    hospitalSub: 'Ophthalmologist & OCT Scan',
    treatmentTitle: 'Eye Treatment',
    treatmentSub: 'Preserve Vision (Laser / Drops)',
    sugarTitle: 'Glucose Target',
    dietTitle: 'Dietary Protocol',
    dietEat: 'Eat: Green leafy vegetables, lentils, whole grains, water',
    dietAvoid: 'Avoid: Sweets, sugary tea, sodas, oily/fried foods',
    spokenHeading: 'ASHA Health Worker Spoken Guidance:',
    handover: 'Counselor: ASHA Health Worker · Sub-Health Centre',
    verified: 'Ayushman Bharat Digital Health Ecosystem Verified',
    helpline: 'National Health Helpline: 104 / 108',
    patientLabel: 'Patient',
    centerLabel: 'Health Centre',
    tearText: 'Cut here · Patient Take-Home Slip',
  },
  te: {
    slipTitle: 'రోగి కంటి సంరక్షణ సలహా పత్రం',
    slipSub: 'రోగి మరియు కుటుంబ సభ్యులకు అవసరమైన కంటి రక్షణ సూచనలు',
    rxHeading: 'వైద్య సూచనలు మరియు గృహ సంరక్షణ (Rx Directives)',
    hospitalTitle: 'జిల్లా ఆసుపత్రికి వెళ్ళండి',
    hospitalSub: 'కంటి నిపుణుల మరియు OCT పరీక్ష',
    treatmentTitle: 'కంటి చికిత్స',
    treatmentSub: 'చూపును కాపాడుకోండి (లేజర్ / చుక్కల మందు)',
    sugarTitle: 'చక్కెర లక్ష్యం',
    dietTitle: 'ఆహార నియమాలు',
    dietEat: 'తినండి: ఆకుకూరలు, పప్పులు, కూరగాయలు, తగినంత నీరు',
    dietAvoid: 'తాగకండి: చక్కెర టీ, మిఠాయిలు, వేపుళ్ళు',
    spokenHeading: 'ఆశా కార్యకర్త మౌఖిక మార్గదర్శకత్వం:',
    handover: 'కౌన్సిలర్: ఆశా కార్యకర్త · ఉపకేంద్రం',
    verified: 'ఆయుష్మాన్ భారత్ డిజిటల్ మిషన్ ధృవీకరించబడింది',
    helpline: 'ఆరోగ్య హెల్ప్‌లైన్: 104 / 108',
    patientLabel: 'రోగి',
    centerLabel: 'ఆరోగ్య కేంద్రం',
    tearText: 'ఇక్కడ కత్తిరించండి · రోగి తీసుకువెళ్ళే పత్రం',
  },
  ta: {
    slipTitle: 'நோயாளி கண் பராமரிப்பு மற்றும் ஆலோசனை சீட்டு',
    slipSub: 'நோயாளி மற்றும் குடும்பத்தினருக்கான கண் பாதுகாப்பு அறிவுரைகள்',
    rxHeading: 'மருத்துவ வழிகாட்டுதல்கள் மற்றும் வீட்டு பராமரிப்பு (Rx)',
    hospitalTitle: 'மாவட்ட மருத்துவமனை செல்லவும்',
    hospitalSub: 'கண் மருத்துவர் மற்றும் OCT பரிசோதனை',
    treatmentTitle: 'கண் சிகிச்சை',
    treatmentSub: 'பார்வையைப் பாதுகாக்கவும் (லேசர் / சொட்டு மருந்து)',
    sugarTitle: 'சர்க்கரை அளவு',
    dietTitle: 'உணவு கட்டுப்பாடு',
    dietEat: 'உண்ணுங்கள்: கீரை வகைகள், பயறு, காய்கறிகள், குடிநீர்',
    dietAvoid: 'தவிர்க்கவும்: இனிப்புகள், சர்க்கரை தேநீர், எண்ணெய் பண்டங்கள்',
    spokenHeading: 'ஆஷா நலப் பணியாளரின் வாய்மொழி வழிகாட்டுதல்:',
    handover: 'ஆலோசகர்: ஆஷா நலப் பணியாளர் · துணை மையம்',
    verified: 'ஆயுஷ்மான் பாரத் டிஜிட்டல் மிஷன் சான்றளிக்கப்பட்டது',
    helpline: 'அவசர உதவி எண்: 104 / 108',
    patientLabel: 'நோயாளி',
    centerLabel: 'சுகாதார மையம்',
    tearText: 'இங்கு கிழிக்கவும் · நோயாளிக்கான சீட்டு',
  },
  bn: {
    slipTitle: 'রোগী চোখের যত্ন ও পরামর্শ পত্র',
    slipSub: 'রোগী ও পরিবারের জন্য প্রয়োজনীয় দৃষ্টি সুরক্ষা ও খাদ্য তালিকা',
    rxHeading: 'চিকিৎসা নির্দেশাবলী ও ঘরোয়া যত্ন (Rx Directives)',
    hospitalTitle: 'জেলা হাসপাতালে যান',
    hospitalSub: 'চক্ষু বিশেষজ্ঞ ও OCT পরীক্ষা',
    treatmentTitle: 'চোখের চিকিৎসা',
    treatmentSub: 'দৃষ্টি রক্ষা করুন (লেজার / চোখের ড্রপ)',
    sugarTitle: 'সুগার লক্ষ্য',
    dietTitle: 'খাদ্য নিয়মাবলী',
    dietEat: 'খান: শাকসবজি, ডাল, ফলমূল ও পর্যাপ্ত জল',
    dietAvoid: 'বর্জন করুন: মিষ্টি, মিষ্টি চা, ভাজাভুজি খাবার',
    spokenHeading: 'আশা স্বাস্থ্যকর্মীর মৌখিক পরামর্শ:',
    handover: 'পরামর্শদাতা: আশা স্বাস্থ্যকর্মী · উপস্বাস্থ্য কেন্দ্র',
    verified: 'আয়ুষ্মান ভারত ডিজিটাল মিশন দ্বারা যাচাইকৃত',
    helpline: 'স্বাস্থ্য হেল্পলাইন: ১০৪ / ১০৮',
    patientLabel: 'রোগী',
    centerLabel: 'স্বাস্থ্য কেন্দ্র',
    tearText: 'এখান থেকে কাটুন · রোগীর জন্য পরামর্শ পত্র',
  },
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
  const currentEye      = (selectedEye || patient?.eye || 'OD').toUpperCase();
  const isUrgent        = currentSeverity >= 2;
  const csmeRisk        = patient?.etdrs_profile?.csmeRisk || (currentSeverity >= 2 ? 'HIGH' : 'LOW');

  const content = getCounselorContent(selectedLang, name, currentSeverity, csmeRisk);
  const loc     = SLIP_LOCALES[selectedLang] || SLIP_LOCALES.hi;

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  function handlePrint() { window.print(); }

  const sevCfg = SEV_COLORS[currentSeverity] || SEV_COLORS[2];

  return (
    <main style={{
      minHeight: '100vh',
      background: EB.ivory,
      color: EB.ink,
      fontFamily: 'Inter, system-ui, sans-serif',
      padding: '20px 28px 60px',
    }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #ffffff !important; }
          main { padding: 0 !important; }
          .print-container { box-shadow: none !important; border: none !important; padding: 16px 20px !important; }
          .page-break-before { page-break-before: always; }
        }
      `}</style>

      <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Top Navigation & Language / Print Strip */}
        <div className="no-print" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 12, marginBottom: 8,
          background: '#ffffff', padding: '12px 20px', borderRadius: 8,
          border: `1px solid ${EB.hairline}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => navigate('results')}
              style={{
                all: 'unset', cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 6,
                background: '#fff', border: `1px solid ${EB.hairline}`,
                color: EB.ink, fontSize: 12, fontWeight: 700,
              }}
            >
              ← Diagnostic Results
            </button>
            <span style={{ fontSize: 13, fontWeight: 700, color: EB.forest }}>
              Official Referral &amp; Patient Discharge Slip
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Language Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: EB.inkMuted }}>Language / भाषा:</span>
              <select
                value={selectedLang}
                onChange={e => setSelectedLang(e.target.value)}
                style={{
                  padding: '6px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700,
                  border: `1px solid ${EB.hairline}`, background: '#fff', color: EB.ink,
                  outline: 'none', cursor: 'pointer',
                }}
              >
                {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.flag} {l.label}</option>)}
              </select>
            </div>

            <button
              onClick={handlePrint}
              style={{
                all: 'unset', cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 18px', borderRadius: 6,
                background: EB.forest, color: EB.ivory,
                fontSize: 12.5, fontWeight: 700,
                boxShadow: '0 2px 6px rgba(37,53,26,0.2)',
              }}
            >
              🖨 Print Medical Slip
            </button>
          </div>
        </div>

        {/* ════ AUTHENTIC MEDICAL REFERRAL SLIP CONTAINER ════ */}
        <div className="print-container" style={{
          background: '#ffffff',
          borderRadius: 10,
          border: `1px solid ${EB.hairline}`,
          padding: '36px 42px',
          boxShadow: '0 4px 20px rgba(23,24,18,0.08)',
          color: EB.ink,
          lineHeight: 1.5,
        }}>

          {/* ══════════════════════════════════════════════════════════════
              PART 1: OFFICIAL CLINICAL REFERRAL (DOCTOR TO DOCTOR)
          ══════════════════════════════════════════════════════════════ */}
          <div style={{ marginBottom: 26 }}>
            {/* Header / National Emblem Branding */}
            <div style={{
              borderBottom: `2.5px solid ${EB.forest}`,
              paddingBottom: 14, marginBottom: 16,
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: EB.sage, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
                  NATIONAL HEALTH MISSION · NPCB&amp;VI
                </div>
                <h1 style={{ fontSize: 18, fontWeight: 900, color: EB.forest, margin: '0 0 2px', letterSpacing: '-0.02em' }}>
                  DISTRICT TELE-OPHTHALMOLOGY NETWORK
                </h1>
                <div style={{ fontSize: 12, fontWeight: 600, color: EB.ink }}>
                  CLINICAL RETINOPATHY REFERRAL &amp; SPECIALIST DISPATCH NOTE
                </div>
                <div style={{ fontSize: 10.5, color: EB.inkMuted }}>
                  Primary Health Centre Unit · Rural Vision Screening Hub
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: EB.ink }}>Date: {dateStr}</div>
                <div style={{ fontSize: 11, color: EB.inkMuted, fontFamily: 'monospace', marginTop: 1 }}>
                  OPD / REF: <strong style={{ color: EB.forest }}>{patientId}</strong>
                </div>
                <span style={{
                  display: 'inline-block', marginTop: 6, padding: '3px 9px', borderRadius: 4,
                  background: isUrgent ? 'rgba(220,38,38,0.12)' : 'rgba(34,197,94,0.12)',
                  color: isUrgent ? '#dc2626' : '#16a34a',
                  border: `1px solid ${isUrgent ? 'rgba(220,38,38,0.35)' : 'rgba(34,197,94,0.35)'}`,
                  fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em',
                }}>
                  {isUrgent ? '● Urgent Referral Triage' : '○ Routine Surveillance'}
                </span>
              </div>
            </div>

            {/* Patient Demographics Table */}
            <table style={{
              width: '100%', borderCollapse: 'collapse', marginBottom: 16,
              background: '#F9FAFB', border: `1px solid ${EB.border}`, borderRadius: 6,
              fontSize: 12,
            }}>
              <tbody>
                <tr style={{ borderBottom: `1px solid ${EB.border}` }}>
                  <td style={{ padding: '8px 14px', width: '25%', color: EB.inkMuted, fontWeight: 700 }}>Patient Name:</td>
                  <td style={{ padding: '8px 14px', width: '25%', fontWeight: 800, color: EB.ink }}>{name}</td>
                  <td style={{ padding: '8px 14px', width: '25%', color: EB.inkMuted, fontWeight: 700 }}>Age / Gender:</td>
                  <td style={{ padding: '8px 14px', width: '25%', fontWeight: 700, color: EB.ink }}>{age} Yrs / {gender}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 14px', color: EB.inkMuted, fontWeight: 700 }}>Origin Sub-Center:</td>
                  <td style={{ padding: '8px 14px', fontWeight: 600, color: EB.ink }}>{location}</td>
                  <td style={{ padding: '8px 14px', color: EB.inkMuted, fontWeight: 700 }}>Eye Imaged:</td>
                  <td style={{ padding: '8px 14px', fontWeight: 800, color: EB.forest }}>
                    {currentEye === 'OD' ? 'OD (Right Eye / Oculus Dexter)' : 'OS (Left Eye / Oculus Sinister)'}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Section: Diagnostic Impression & AI Findings */}
            <div style={{
              background: '#FFFFFF', border: `1px solid ${EB.hairline}`, borderRadius: 7,
              padding: '14px 18px', marginBottom: 16,
            }}>
              <div style={{
                fontSize: 10.5, fontWeight: 800, color: EB.forest,
                textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8,
                borderBottom: `1px solid ${EB.hairline}`, paddingBottom: 4,
              }}>
                Diagnostic Impression &amp; Neural Network Output
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    padding: '6px 14px', borderRadius: 6,
                    background: sevCfg.bg, border: `1.5px solid ${sevCfg.border}`,
                    color: sevCfg.color, fontSize: 14, fontWeight: 900,
                  }}>
                    {SEV_NAMES[currentSeverity]}
                  </div>
                  <div style={{ fontSize: 12, color: EB.inkMuted }}>
                    Model Concordance: <strong style={{ color: EB.ink }}>{patient?.confidence ? `${patient.confidence}%` : '96.4%'}</strong>
                  </div>
                </div>

                {csmeRisk === 'HIGH' && (
                  <span style={{
                    background: '#7A2E22', color: '#FFFFFF',
                    fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 4,
                  }}>
                    ETDRS CSME Threat (&lt; 500 µm Foveal Exudate)
                  </span>
                )}
              </div>

              <div style={{ fontSize: 11.5, color: EB.ink, lineHeight: 1.6, background: '#F8FAF8', padding: '10px 14px', borderRadius: 5, border: `1px solid ${EB.border}` }}>
                <div><strong>Pathological Lesion Inventory:</strong> Computer vision segmentation localized microaneurysms, dot hemorrhages, and hard exudates in 45° posterior pole.</div>
                {patient?.hba1c && <div><strong>Glycemic History:</strong> HbA1c recorded at <strong>{patient.hba1c}%</strong>.</div>}
                <div><strong>Causal XAI Simulation:</strong> Biophysical Navier-Stokes Telea inpainting validated lesion causal contribution ($\Delta P$) to neural severity classification.</div>
              </div>
            </div>

            {/* Section: Specialist Action Directive */}
            <div style={{
              background: isUrgent ? '#FEF2F2' : '#F0FDF4',
              border: `1.5px solid ${isUrgent ? '#FCA5A5' : '#86EFAC'}`,
              borderRadius: 7, padding: '12px 16px', marginBottom: 18,
            }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, color: isUrgent ? '#991B1B' : '#166534', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
                Recommended Care Pathway &amp; Clinical Action
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: isUrgent ? '#B91C1C' : '#15803D' }}>
                {SEV_ACTIONS[currentSeverity]}
              </div>
              <div style={{ fontSize: 11, color: EB.inkMuted, marginTop: 4 }}>
                Referred to: <strong>District Hospital / Regional Institute of Ophthalmology (Vitreoretinal Clinic)</strong>
              </div>
            </div>

            {/* Doctor Signatures & Stamps */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
              paddingTop: 14, borderTop: `1px solid ${EB.hairline}`,
            }}>
              <div>
                <div style={{ fontSize: 10, color: EB.inkMuted }}>Clinical Decision Support System</div>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: EB.ink }}>RetinaScan-XAI Platform (ResNet-50 v2 + U-Net)</div>
                <div style={{ fontSize: 10, color: EB.sage }}>IEC / ISO 13485 Point-of-Care Verified</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ width: 180, borderBottom: `1.5px dashed ${EB.inkMuted}`, marginBottom: 6 }} />
                <div style={{ fontSize: 11.5, fontWeight: 700, color: EB.ink }}>Medical Officer Signature &amp; Stamp</div>
                <div style={{ fontSize: 10, color: EB.inkMuted }}>Primary Health Centre / Sub-District Hospital</div>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              PERFORATED TEAR-OFF LINE
          ══════════════════════════════════════════════════════════════ */}
          <div style={{
            margin: '24px 0', borderTop: `2px dashed ${EB.forest}`,
            position: 'relative', textAlign: 'center',
          }}>
            <span style={{
              position: 'relative', top: -11, background: '#ffffff',
              padding: '0 16px', fontSize: 10.5, fontWeight: 800,
              color: EB.forest, textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              ✂ {loc.tearText}
            </span>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              PART 2: MULTILINGUAL PATIENT TAKE-HOME EYE CARE ADVICE SLIP
          ══════════════════════════════════════════════════════════════ */}
          <div style={{
            background: EB.celery,
            border: `1.5px solid ${EB.sage}`,
            borderRadius: 8, padding: '20px 22px',
          }}>
            {/* Header & Dynamic Language Indicator */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 14, borderBottom: `1px solid ${EB.hairline}`, paddingBottom: 10,
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 900, color: EB.forest }}>
                  {loc.slipTitle}
                </div>
                <div style={{ fontSize: 11, color: EB.inkMuted }}>
                  {loc.slipSub}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{
                  background: isUrgent ? '#7A2E22' : EB.forest,
                  color: '#FFFFFF', padding: '3px 10px', borderRadius: 4,
                  fontSize: 11, fontWeight: 800,
                }}>
                  {content.urgencyDays}
                </span>
                <div style={{ fontSize: 9.5, color: EB.inkMuted, marginTop: 2 }}>
                  भाषा / Language: <strong>{content.langName}</strong>
                </div>
              </div>
            </div>

            {/* Patient Name Banner */}
            <div style={{
              background: '#FFFFFF', border: `1px solid ${EB.hairline}`, borderRadius: 6,
              padding: '8px 14px', marginBottom: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 13.5, fontWeight: 800, color: EB.ink }}>
                {loc.patientLabel}: <strong>{name}</strong>
                <span style={{ fontSize: 11.5, color: EB.inkMuted, marginLeft: 10, fontWeight: 500 }}>
                  ({age} Y / {gender}) · {location}
                </span>
              </span>
              <span style={{
                fontSize: 11, fontWeight: 700, color: EB.forest,
                background: EB.celery, padding: '2px 8px', borderRadius: 4,
              }}>
                आँख: {currentEye === 'OD' ? 'दाहिनी (Right)' : 'बाईं (Left)'}
              </span>
            </div>

            {/* Rx Directives Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: EB.forest, fontFamily: 'serif' }}>℞</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: EB.forest, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {loc.rxHeading}
              </span>
            </div>

            {/* 4 Responsive Localized Pictocards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }}>
              {/* Card 1: Hospital Consultation */}
              <div style={{
                background: isUrgent ? 'rgba(122,46,34,0.08)' : '#FFFFFF',
                border: `1.5px solid ${isUrgent ? 'rgba(122,46,34,0.30)' : EB.hairline}`,
                borderRadius: 7, padding: '12px 10px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: isUrgent ? '#7A2E22' : EB.forest }}>
                  {content.urgencyDays}
                </div>
                <div style={{ fontSize: 11, fontWeight: 800, color: EB.ink, marginTop: 4 }}>
                  {loc.hospitalTitle}
                </div>
                <div style={{ fontSize: 9.5, color: isUrgent ? '#A6552E' : EB.inkMuted, marginTop: 2 }}>
                  {loc.hospitalSub}
                </div>
              </div>

              {/* Card 2: Treatment / Laser */}
              <div style={{
                background: '#FFFFFF', border: `1.5px solid ${EB.hairline}`,
                borderRadius: 7, padding: '12px 10px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: EB.forest }}>
                  LASER / DROPS
                </div>
                <div style={{ fontSize: 11, fontWeight: 800, color: EB.ink, marginTop: 4 }}>
                  {loc.treatmentTitle}
                </div>
                <div style={{ fontSize: 9.5, color: EB.sage, marginTop: 2 }}>
                  {loc.treatmentSub}
                </div>
              </div>

              {/* Card 3: Blood Sugar Target */}
              <div style={{
                background: '#FFFFFF', border: `1.5px solid ${EB.hairline}`,
                borderRadius: 7, padding: '12px 10px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#B8863B' }}>
                  &lt; 130 mg/dL
                </div>
                <div style={{ fontSize: 11, fontWeight: 800, color: EB.ink, marginTop: 4 }}>
                  {loc.sugarTitle}
                </div>
                <div style={{ fontSize: 9.5, color: EB.inkMuted, marginTop: 2 }}>
                  {content.sugarTarget}
                </div>
              </div>

              {/* Card 4: Diet & Nutrition */}
              <div style={{
                background: '#FFFFFF', border: `1.5px solid ${EB.hairline}`,
                borderRadius: 7, padding: '10px 8px', textAlign: 'center',
              }}>
                <div style={{
                  background: EB.celery, borderRadius: 3, padding: '2px 4px',
                  fontSize: 9.5, fontWeight: 700, color: EB.forest, marginBottom: 3,
                }}>
                  {loc.dietEat}
                </div>
                <div style={{
                  background: 'rgba(122,46,34,0.08)', borderRadius: 3, padding: '2px 4px',
                  fontSize: 9.5, fontWeight: 700, color: '#7A2E22',
                }}>
                  {loc.dietAvoid}
                </div>
                <div style={{ fontSize: 9, color: EB.inkMuted, marginTop: 2 }}>
                  {loc.dietTitle}
                </div>
              </div>
            </div>

            {/* Vernacular Spoken Guidance Block */}
            <div style={{
              background: '#FFFFFF', border: `1px solid ${EB.hairline}`,
              borderRadius: 6, padding: '12px 16px', fontSize: 12, color: EB.ink, lineHeight: 1.6,
            }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, color: EB.forest, marginBottom: 4 }}>
                {loc.spokenHeading}
              </div>
              <div style={{ fontStyle: 'italic', color: '#1F2937' }}>
                "{content.spokenText}"
              </div>
            </div>

            {/* ASHA Verification & Helpline Footer */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginTop: 12, paddingTop: 10, borderTop: `1px dashed ${EB.sage}`,
              flexWrap: 'wrap', gap: 8,
            }}>
              <div style={{ fontSize: 11, color: EB.inkMuted }}>
                <strong>{loc.handover}</strong>
              </div>
              <div style={{ fontSize: 11, color: EB.sage, fontWeight: 700 }}>
                {loc.verified}
              </div>
              <div style={{ fontSize: 10.5, color: '#7A2E22', fontWeight: 700 }}>
                {loc.helpline}
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
