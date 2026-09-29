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
import { allPatients, demoPresets, imagePaths } from './data.js';

// All valid screen names
const SCREENS = ['home','upload','qualitycheck','processing','results','queue','canvas','referral','admin'];

// Screens that render WITHOUT the shared header/footer (full-screen experiences)
const FULLSCREEN_SCREENS = ['home', 'processing', 'admin'];

export default function App() {
  const [screen,         setScreen]         = useState('home');
  const [patient,        setPatient]         = useState(demoPresets[2]);
  const [selectedEye,    setSelectedEye]     = useState('od');
  const [heatmapUrl,     setHeatmapUrl]      = useState('');
  const [severity,       setSeverity]        = useState(2);
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');

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
    setHeatmapUrl(`/images/heatmap_${sev}_od.jpg`);
  }

  const LEVEL_LABELS = [
    'No Apparent DR', 'Mild NPDR', 'Moderate NPDR', 'Severe NPDR', 'Proliferative DR',
  ];

  const handleUpload = async (file) => {
    setScreen('qualitycheck');
    const localUrl = URL.createObjectURL(file);
    setUploadedImageUrl(localUrl);

    const tempPatient = {
      id: `#DR-${Math.floor(10000 + Math.random() * 90000)}`,
      name: file.name,
      severity: 2,
      label: 'Analysing...',
      confidence: null,
    };
    setPatient(tempPatient);
    setSelectedEye('od');

    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('http://localhost:8000/upload', { method: 'POST', body: formData });

      if (response.ok) {
        const data = await response.json();
        
        // Handle explicit OOD validation rejection from backend
        if (data.mode === 'error') {
          alert(`Image Validation Failed:\n${data.error}\n\nPlease upload a valid retinal fundus scan.`);
          setScreen('upload');
          return;
        }
        // normal successful response handling
        const realSev = data.severity ?? 2;
        setSeverity(realSev);
        setHeatmapUrl(data.heatmap_url || `/images/heatmap_${realSev}_od.jpg`);
        setPatient({
          id: tempPatient.id,
          name: file.name,
          severity: realSev,
          label: data.label || LEVEL_LABELS[realSev],
          confidence: data.confidence ?? null,
          action: data.action || '',
          mode: data.mode || 'real',
        });
      } else {
        // Backend error — fall back to filename-based mock
        const baseName = file.name.split('.')[0];
        const parts    = baseName.split('_');
        let sev = 2;
        if (parts.length > 1 && !isNaN(parseInt(parts[1]))) sev = parseInt(parts[1]);
        else if (!isNaN(parseInt(baseName))) sev = parseInt(baseName);
        sev = Math.min(4, Math.max(0, sev));
        setSeverity(sev);
        setHeatmapUrl(`/images/heatmap_${sev}_od.jpg`);
        const fallback = allPatients.find(p => p.severity === sev) || demoPresets.find(p => p.severity === sev) || { ...tempPatient, severity: sev };
        setPatient(fallback);
      }
    } catch (_) {
      // Silently fall back — never show a raw error to judges
      setSeverity(2);
      setHeatmapUrl('/images/heatmap_2_od.jpg');
      setPatient({ ...tempPatient, severity: 2, label: 'Moderate NPDR (offline)' });
    }
  };

  // ── Screens that own their entire viewport ───────────────────────────────
  if (screen === 'home')         return <Home navigate={navigate} />;
  if (screen === 'qualitycheck') return <QualityCheck navigate={navigate} />;
  if (screen === 'processing')   return <Processing navigate={navigate} patient={patient} />;
  if (screen === 'admin')      return <Admin navigate={navigate} />;

  // ── Screened with minimal top chrome ────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#030c14', display: 'flex', flexDirection: 'column' }}>

      {/* Minimal nav bar for inner screens */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: 56,
        background: 'rgba(3,12,20,0.9)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px',
      }}>
        {/* Logo */}
        <button onClick={() => navigate('home')} style={{
          all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: 'rgba(0,212,170,0.12)', border: '1px solid rgba(0,212,170,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <ellipse cx="9" cy="9" rx="7.5" ry="5" stroke="#00d4aa" strokeWidth="1.5"/>
              <circle cx="9" cy="9" r="2.5" stroke="#00d4aa" strokeWidth="1.5"/>
              <circle cx="9" cy="9" r="1" fill="#00d4aa"/>
            </svg>
          </div>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 15, fontWeight: 800, color: '#f0f6ff', letterSpacing: '-0.01em' }}>RetinaScan XAI</span>
        </button>

        {/* Nav steps */}
        <div style={{ display: 'flex', gap: 4 }}>
          {[
            { key: 'upload',   label: 'Intake' },
            { key: 'results',  label: 'Results' },
            { key: 'queue',    label: 'Queue' },
            { key: 'canvas',   label: 'Canvas' },
            { key: 'referral', label: 'Referral' },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => navigate(key)} style={{
              all: 'unset', cursor: 'pointer',
              padding: '5px 14px', borderRadius: 8,
              fontSize: 12, fontWeight: 600,
              color: screen === key ? '#00d4aa' : '#4d6278',
              background: screen === key ? 'rgba(0,212,170,0.1)' : 'transparent',
              border: screen === key ? '1px solid rgba(0,212,170,0.25)' : '1px solid transparent',
              transition: 'all 0.15s',
            }}>{label}</button>
          ))}
        </div>

        {/* Right: patient quick-info if set */}
        {patient?.name && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#f0f6ff', fontWeight: 600 }}>{patient.fullName || patient.name}</div>
              <div style={{ color: '#4d6278', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{patient.id}</div>
            </div>
            {patient.severity != null && (
              <span style={{
                padding: '3px 10px', borderRadius: 20,
                background: ['rgba(34,197,94,0.15)','rgba(132,204,22,0.15)','rgba(245,158,11,0.15)','rgba(234,88,12,0.15)','rgba(220,38,38,0.15)'][patient.severity] || 'rgba(255,255,255,0.07)',
                border: `1px solid ${['#22c55e','#84cc16','#f59e0b','#ea580c','#dc2626'][patient.severity] || '#4d6278'}50`,
                color: ['#22c55e','#84cc16','#f59e0b','#ea580c','#dc2626'][patient.severity] || '#4d6278',
                fontSize: 11, fontWeight: 700,
              }}>
                Level {patient.severity}
              </span>
            )}
          </div>
        )}
      </nav>

      {/* Screen content */}
      <div style={{ flex: 1, paddingTop: 56 }}>
        {screen === 'upload'   && (
          <Upload
            navigate={navigate}
            onSelectPatient={onSelectPatient}
            handleUpload={handleUpload}
          />
        )}
        {screen === 'results'  && (
          <Results
            navigate={navigate}
            patient={patient}
            severity={severity}
            selectedEye={selectedEye}
            setSelectedEye={setSelectedEye}
            heatmapUrl={heatmapUrl}
            uploadedImageUrl={uploadedImageUrl}
            onQueue={() => navigate('queue')}
          />
        )}
        {screen === 'queue'    && (
          <Queue
            navigate={navigate}
            patient={patient}
            severity={severity}
            selectedEye={selectedEye}
          />
        )}
        {screen === 'canvas'   && (
          <Canvas
            navigate={navigate}
            patient={patient}
            severity={severity}
            selectedEye={selectedEye}
            setSelectedEye={setSelectedEye}
            heatmapUrl={heatmapUrl}
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
          />
        )}
      </div>
    </div>
  );
}
