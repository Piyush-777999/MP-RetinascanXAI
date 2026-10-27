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

// Helper to convert uploaded File into a lightweight persistent base64 data URL
function fileToThumbnail(file, maxWidth = 512) {
  return new Promise((resolve) => {
    if (!file) return resolve('');
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const scale = Math.min(1, maxWidth / Math.max(img.width, img.height));
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        } catch (err) {
          resolve(e.target.result);
        }
      };
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

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

  // ── Scanned patients queue persisted to localStorage ─────────────────────
  const [scannedPatients, setScannedPatients] = useState(() => {
    try {
      const saved = localStorage.getItem('retinascan_scanned_patients');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.warn('Could not read scanned patients from localStorage', e);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('retinascan_scanned_patients', JSON.stringify(scannedPatients));
    } catch (e) {
      console.warn('LocalStorage save failed (quota exceeded?)', e);
    }
  }, [scannedPatients]);

  function clearScannedPatients() {
    setScannedPatients([]);
    try {
      localStorage.removeItem('retinascan_scanned_patients');
    } catch (e) {}
  }

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
    if (!p) return;
    setPatient(p);
    const sev = p?.severity ?? 2;
    setSeverity(sev);
    const eye = (p?.selectedEye || p?.eye || 'od').toLowerCase();
    setSelectedEye(eye);

    // If it's a scanned patient with a local image URL or base64 thumbnail:
    if (p.isScanned || p.imageUrl || p.thumbnailUrl) {
      setUploadedImageUrl(p.imageUrl || p.thumbnailUrl || '');
      setHeatmapUrl(p.heatmap_url || p.heatmapUrl || '');
    } else {
      // Demo preset: use bundled asset paths
      setHeatmapUrl(`/images/heatmap_${sev}_${eye}.png`);
      setUploadedImageUrl('');
    }

    setAllProbs(p?.all_probs || null);
    setLesions(p?.lesions || []);
    setLesionSummary(p?.lesion_summary || p?.lesionSummary || null);
    setApiResponse(p?.apiResponse || null);
    setUploadError(null);
  }

  const handleUpload = async (file, formMeta = {}) => {
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
    const thumbPromise = fileToThumbnail(file);

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

      const thumbUrl = await thumbPromise;

      // ONLY ON SUCCESS: Commit the new patient & retinal scan into active state
      setApiResponse(data);
      const activeImg = thumbUrl || localUrl;
      setUploadedImageUrl(activeImg);
      const realSev = typeof data.severity === 'number' ? data.severity : 2;
      setSeverity(realSev);
      setHeatmapUrl(data.heatmap_url || '');

      const realProbs = Array.isArray(data.all_probs) ? data.all_probs : null;
      const realLesions = Array.isArray(data.lesions) ? data.lesions : [];
      const realSummary = data.lesion_summary || null;

      setAllProbs(realProbs);
      setLesions(realLesions);
      setLesionSummary(realSummary);

      const assignedId      = formMeta?.patId || formMeta?.id || `#DR-${Math.floor(10000 + Math.random() * 90000)}`;
      const assignedName    = formMeta?.name && formMeta.name.trim() !== '' ? formMeta.name : file.name.replace(/\.[^/.]+$/, '');
      const assignedAge     = formMeta?.age ? parseInt(formMeta.age, 10) : 55;
      const assignedGender  = formMeta?.gender ? (formMeta.gender.startsWith('F') ? 'F' : 'M') : 'M';
      const assignedVillage = formMeta?.village || 'PHC Live Intake';
      const assignedEye     = (formMeta?.eye || selectedEye || 'od').toLowerCase();
      setSelectedEye(assignedEye);

      const newScannedPatient = {
        id: assignedId,
        name: assignedName,
        fullName: assignedName,
        age: assignedAge,
        gender: assignedGender,
        village: assignedVillage,
        diabetesDuration: formMeta?.diabetesDuration || '10',
        hba1c: formMeta?.hba1c || '8.5',
        severity: realSev,
        label: data.label || LEVEL_LABELS[realSev] || `Grade ${realSev}`,
        confidence: data.confidence != null ? data.confidence : null,
        action: data.action || '',
        mode: data.mode || 'real',
        imageUrl: activeImg,
        thumbnailUrl: activeImg,
        serverImageUrl: data.image_url || '',
        heatmap_url: data.heatmap_url || '',
        all_probs: realProbs,
        lesions: realLesions,
        lesion_summary: realSummary,
        etdrs_profile: data.etdrs_profile || null,
        eye: assignedEye,
        selectedEye: assignedEye,
        isScanned: true,
        scannedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      };

      setPatient(newScannedPatient);
      // Prepend to accumulating queue and limit to 25 records
      setScannedPatients(prev => [newScannedPatient, ...prev.filter(p => p.id !== assignedId)].slice(0, 25));
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
  const SEV_COLORS = ['#7D8960','#A8A050','#B8863B','#A6552E','#7A2E22'];
  const sevColor = SEV_COLORS[patient?.severity ?? 2] || SEV_COLORS[2];
  const SHORT_LABELS = ['G0 · No DR','G1 · Mild','G2 · Moderate','G3 · Severe','G4 · Prolif.'];

  return (
    <div style={{ minHeight: '100vh', background: '#F4F4E9', display: 'flex', flexDirection: 'column' }}>

      {/* Earthbound Biotech dark top bar */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: 48,
        background: '#25351A',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px',
        fontFamily: 'Inter, sans-serif',
      }}>
        {/* Logo */}
        <button onClick={() => navigate('home')} style={{
          all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <ellipse cx="10" cy="10" rx="8.5" ry="5.5" stroke="#E3EBC9" strokeWidth="1.5"/>
            <circle cx="10" cy="10" r="2.8" stroke="#E3EBC9" strokeWidth="1.5"/>
            <circle cx="10" cy="10" r="1.1" fill="#E3EBC9"/>
          </svg>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#F4F4E9', letterSpacing: '-0.01em' }}>RetinaScan XAI</span>
        </button>

        {/* Nav tabs */}
        <div style={{ display: 'flex', gap: 2 }}>
          {[
            { key: 'upload',   label: t.navIntake },
            { key: 'results',  label: t.navResults },
            { key: 'queue',    label: t.navQueue },
            { key: 'canvas',   label: t.navCanvas },
            { key: 'referral', label: t.navReferral },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => navigate(key)} style={{
              all: 'unset', cursor: 'pointer',
              padding: '6px 11px', borderRadius: 4,
              fontSize: 11.5, fontWeight: screen === key ? 700 : 400,
              color: screen === key ? '#E3EBC9' : 'rgba(244,244,233,0.55)',
              background: screen === key ? 'rgba(227,235,201,0.14)' : 'transparent',
              transition: 'all 0.12s ease',
            }}>{label}</button>
          ))}
        </div>

        {/* Right: Language + Patient chip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <LanguageSwitcher
            currentLang={appLang}
            onChangeLang={code => {
              setAppLang(code);
              localStorage.setItem('retinascan_lang', code);
            }}
          />

          {patient?.name && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderLeft: '1px solid rgba(255,255,255,0.10)', paddingLeft: 12 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#F4F4E9', fontWeight: 600, fontSize: 11.5 }}>{patient.fullName || patient.name}</div>
                <div style={{ color: 'rgba(244,244,233,0.5)', fontSize: 9.5, letterSpacing: '0.03em' }}>{patient.id}</div>
              </div>
              {patient.severity != null && (
                <span style={{
                  padding: '2px 8px', borderRadius: 4,
                  background: 'rgba(227,235,201,0.12)',
                  border: `1px solid ${sevColor}55`,
                  color: sevColor,
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.02em',
                  whiteSpace: 'nowrap',
                }}>
                  {SHORT_LABELS[patient.severity] || `G${patient.severity}`}
                </span>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Screen content */}
      <div style={{ flex: 1, paddingTop: 48 }}>
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
            scannedPatients={scannedPatients}
            onSelectPatient={onSelectPatient}
            clearScannedPatients={clearScannedPatients}
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
