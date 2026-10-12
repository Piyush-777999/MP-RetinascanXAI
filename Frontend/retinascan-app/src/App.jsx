import React, { useState, useEffect } from 'react';
import Home         from './components/Home.jsx';
import Upload       from './components/Upload.jsx';
import QualityCheck from './components/QualityCheck.jsx';
import Processing   from './components/Processing.jsx';
import Results      from './components/Results.jsx';
import Queue        from './components/Queue.jsx';
import Canvas       from './components/Canvas.jsx';
import Referral     from './components/Referral.jsx';
import Admin        from './components/Admin.jsx';
import LanguageSwitcher from './components/LanguageSwitcher.jsx';
import { getT }       from './translations.js';
import { demoPresets } from './data.js';
import { API_BASE_URL } from './apiConfig.js';

// All valid screen names
const SCREENS = ['home','upload','qualitycheck','processing','results','queue','canvas','referral','admin'];

const LEVEL_LABELS = [
  'No Apparent DR',
  'Mild NPDR',
  'Moderate NPDR',
  'Severe NPDR',
  'Proliferative DR',
];

export default function App() {
  const [screen,           setScreen]           = useState('home');
  const [patient,          setPatient]          = useState(demoPresets[2]);
  const [selectedEye,      setSelectedEye]      = useState('od');
  const [heatmapUrl,       setHeatmapUrl]       = useState('');
  const [severity,         setSeverity]         = useState(2);
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [allProbs,         setAllProbs]         = useState(null);
  const [lesions,          setLesions]          = useState(demoPresets[2].lesions || []);
  const [lesionSummary,    setLesionSummary]    = useState(demoPresets[2].lesionSummary || null);
  const [apiResponse,      setApiResponse]      = useState(null);
  const [uploadError,      setUploadError]      = useState(null);
  const [appLang,          setAppLang]          = useState(() => localStorage.getItem('retinascan_lang') || 'hi');

  const t = getT(appLang);

  // ── Ctrl+Shift+R → demo reset ──────────────────────────────────────────────
  useEffect(() => {
    function handleReset(e) {
      if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        setScreen('home');
        setPatient(demoPresets[2]);
        setSelectedEye('od');
        setHeatmapUrl('');
        setSeverity(2);
        setUploadedImageUrl('');
        setAllProbs(null);
        setLesions([]);
        setLesionSummary(null);
        setApiResponse(null);
      }
    }
    window.addEventListener('keydown', handleReset);
    return () => window.removeEventListener('keydown', handleReset);
  }, []);

  function navigate(to) {
    if (SCREENS.includes(to)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setScreen(to);
    }
  }

  function onSelectPatient(p) {
    setPatient(p);
    const sev = p?.severity ?? 2;
    setSeverity(sev);
    setSelectedEye('od');
    setHeatmapUrl(`/images/heatmap_${sev}_od.png`);
    setUploadedImageUrl('');
    setAllProbs(null);
    setLesions(p?.lesions || []);
    setLesionSummary(p?.lesionSummary || null);
    setApiResponse(null);
    // Clear any stale upload-rejection banner when a verified preset is selected
    setUploadError(null);
  }

  const LEVEL_LABELS = [
    'No Apparent DR', 'Mild NPDR', 'Moderate NPDR', 'Severe NPDR', 'Proliferative DR',
  ];

  const handleUpload = async (file) => {
    setUploadError(null);

    // Keep snapshot of current valid state to restore if validation fails
    const prevPatient          = patient;
    const prevUploadedImageUrl = uploadedImageUrl;
    const prevSeverity         = severity;
    const prevHeatmapUrl       = heatmapUrl;
    const prevAllProbs         = allProbs;
    const prevLesions          = lesions;
    const prevLesionSummary    = lesionSummary;
    const prevApiResponse      = apiResponse;

    const localUrl = URL.createObjectURL(file);

    // Do NOT commit unverified file to global state yet; only set screen to qualitycheck
    setScreen('qualitycheck');

    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server returned status HTTP ${response.status}`);
      }

      const data = await response.json();

      // Handle explicit OOD validation rejection from backend
      if (data.mode === 'error') {
        try { URL.revokeObjectURL(localUrl); } catch (e) {}
        setUploadError(data.error || 'Scan validation failed: Not an ocular fundus scan.');
        // Revert cleanly to last valid patient state
        setUploadedImageUrl(prevUploadedImageUrl);
        setPatient(prevPatient);
        setSeverity(prevSeverity);
        setHeatmapUrl(prevHeatmapUrl);
        setAllProbs(prevAllProbs);
        setLesions(prevLesions);
        setLesionSummary(prevLesionSummary);
        setApiResponse(prevApiResponse);
        setScreen('upload');
        return;
      }

      // ONLY ON SUCCESS: Commit the new patient & retinal scan into active state
      setApiResponse(data);
      setUploadedImageUrl(localUrl);
      const realSev = typeof data.severity === 'number' ? data.severity : 2;
      setSeverity(realSev);
      setHeatmapUrl(data.heatmap_url || '');

      const realProbs = Array.isArray(data.all_probs) ? data.all_probs : null;
      const realLesions = Array.isArray(data.lesions) ? data.lesions : [];
      const realSummary = data.lesion_summary || null;

      setAllProbs(realProbs);
      setLesions(realLesions);
      setLesionSummary(realSummary);

      setPatient({
        id: `#DR-${Math.floor(10000 + Math.random() * 90000)}`,
        name: file.name,
        fullName: file.name.replace(/\.[^/.]+$/, ''),
        age: 55,
        gender: 'M',
        village: 'Live Scan Intake',
        severity: realSev,
        label: data.label || LEVEL_LABELS[realSev] || `Grade ${realSev}`,
        confidence: data.confidence != null ? data.confidence : null,
        action: data.action || '',
        mode: data.mode || 'real',
        imageUrl: localUrl,
        serverImageUrl: data.image_url || '',
        heatmap_url: data.heatmap_url || '',
        all_probs: realProbs,
        lesions: realLesions,
        lesion_summary: realSummary,
        etdrs_profile: data.etdrs_profile || null,
      });
    } catch (err) {
      console.error('Backend upload request failed:', err);
      try { URL.revokeObjectURL(localUrl); } catch (e) {}
      const msg = err.message?.includes('HTTP')
        ? `Server error: ${err.message}`
        : 'Scan validation failed: Unable to process file as an ocular fundus scan. Please ensure the image is a valid retinal photograph.';
      setUploadError(msg);
      // Revert cleanly to last valid patient state
      setUploadedImageUrl(prevUploadedImageUrl);
      setPatient(prevPatient);
      setSeverity(prevSeverity);
      setHeatmapUrl(prevHeatmapUrl);
      setAllProbs(prevAllProbs);
      setLesions(prevLesions);
      setLesionSummary(prevLesionSummary);
      setApiResponse(prevApiResponse);
      setScreen('upload');
    }
  };

  // ── Screens that own their entire viewport ───────────────────────────────
  if (screen === 'home')         return <Home navigate={navigate} />;
  if (screen === 'qualitycheck') return <QualityCheck navigate={navigate} patient={patient} />;
  if (screen === 'processing')   return <Processing navigate={navigate} patient={patient} />;
  if (screen === 'admin')        return <Admin navigate={navigate} />;

  // ── Screened with minimal top chrome ────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>

      {/* Hospital clinical nav bar for inner screens */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: 56,
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 28px',
      }}>
        {/* Logo */}
        <button onClick={() => navigate('home')} style={{
          all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #0284c7, #0369a1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(2,132,199,0.25)',
          }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <ellipse cx="9" cy="9" rx="7.5" ry="5" stroke="#ffffff" strokeWidth="1.6"/>
              <circle cx="9" cy="9" r="2.5" stroke="#ffffff" strokeWidth="1.6"/>
              <circle cx="9" cy="9" r="1" fill="#ffffff"/>
            </svg>
          </div>
          <div>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em' }}>RetinaScan XAI</span>
            <span style={{ display: 'block', fontSize: 10, fontWeight: 600, color: '#0284c7', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Clinical Workstation</span>
          </div>
        </button>

        {/* Nav steps */}
        <div style={{ display: 'flex', gap: 6, background: '#f1f5f9', padding: '3px 4px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
          {[
            { key: 'upload',   label: t.navIntake },
            { key: 'results',  label: t.navResults },
            { key: 'queue',    label: t.navQueue },
            { key: 'canvas',   label: t.navCanvas },
            { key: 'referral', label: t.navReferral },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => navigate(key)} style={{
              all: 'unset', cursor: 'pointer',
              padding: '6px 14px', borderRadius: 7,
              fontSize: 12, fontWeight: 600,
              color: screen === key ? '#0284c7' : '#475569',
              background: screen === key ? '#ffffff' : 'transparent',
              border: screen === key ? '1px solid #cbd5e1' : '1px solid transparent',
              boxShadow: screen === key ? '0 1px 3px rgba(15,23,42,0.06)' : 'none',
              transition: 'all 0.15s ease',
            }}>{label}</button>
          ))}
        </div>

        {/* Right Corner: Always-Present Language Switcher & Patient Quick-Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <LanguageSwitcher
            currentLang={appLang}
            onChangeLang={code => {
              setAppLang(code);
              localStorage.setItem('retinascan_lang', code);
            }}
          />

          {patient?.name && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, borderLeft: '1px solid #e2e8f0', paddingLeft: 12 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#0f172a', fontWeight: 600 }}>{patient.fullName || patient.name}</div>
                <div style={{ color: '#64748b', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{patient.id}</div>
              </div>
              {patient.severity != null && (
                <span style={{
                  padding: '4px 11px', borderRadius: 20,
                  background: ['#dcfce7','#fef3c7','#ffedd5','#fee2e2','#fef2f2'][patient.severity] || '#f1f5f9',
                  border: `1px solid ${['#bbf7d0','#fde68a','#fed7aa','#fecaca','#fca5a5'][patient.severity] || '#e2e8f0'}`,
                  color: ['#15803d','#b45309','#c2410c','#b91c1c','#991b1b'][patient.severity] || '#475569',
                  fontSize: 11, fontWeight: 700,
                }}>
                  Level {patient.severity}
                </span>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Screen content */}
      <div style={{ flex: 1, paddingTop: 56 }}>
        {screen === 'upload' && (
          <Upload
            navigate={navigate}
            onSelectPatient={onSelectPatient}
            handleUpload={handleUpload}
            uploadError={uploadError}
            clearUploadError={() => setUploadError(null)}
          />
        )}
        {screen === 'results' && (
          <Results
            navigate={navigate}
            patient={patient}
            severity={severity}
            selectedEye={selectedEye}
            setSelectedEye={setSelectedEye}
            heatmapUrl={heatmapUrl}
            uploadedImageUrl={uploadedImageUrl}
            allProbs={allProbs}
            lesions={lesions}
            lesionSummary={lesionSummary}
            etdrsProfile={patient?.etdrs_profile || apiResponse?.etdrs_profile}
            onQueue={() => navigate('queue')}
            currentAppLang={appLang}
            uploadError={uploadError}
            clearUploadError={() => setUploadError(null)}
            apiResponse={apiResponse}
          />
        )}
        {screen === 'queue' && (
          <Queue
            navigate={navigate}
            patient={patient}
            severity={severity}
            selectedEye={selectedEye}
          />
        )}
        {screen === 'canvas' && (
          <Canvas
            navigate={navigate}
            patient={patient}
            severity={severity}
            selectedEye={selectedEye}
            setSelectedEye={setSelectedEye}
            heatmapUrl={heatmapUrl}
            uploadedImageUrl={uploadedImageUrl}
            allProbs={allProbs}
            lesions={lesions}
            lesionSummary={lesionSummary}
            onRefer={() => navigate('referral')}
            onBack={() => navigate('queue')}
          />
        )}
        {screen === 'referral' && (
          <Referral
            navigate={navigate}
            patient={patient}
            severity={severity}
            selectedEye={selectedEye}
            currentAppLang={appLang}
          />
        )}
      </div>
    </div>
  );
}
