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
import { demoPresets } from './data.js';

// All valid screen names
const SCREENS = ['home','upload','qualitycheck','processing','results','queue','canvas','referral','admin'];

export default function App() {
  const [screen,           setScreen]           = useState('home');
  const [patient,          setPatient]          = useState(demoPresets[2]);
  const [selectedEye,      setSelectedEye]      = useState('od');
  const [heatmapUrl,       setHeatmapUrl]       = useState('');
  const [severity,         setSeverity]         = useState(2);
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [allProbs,         setAllProbs]         = useState(null);
  const [lesions,          setLesions]          = useState([]);
  const [lesionSummary,    setLesionSummary]    = useState(null);
  const [,                 setApiResponse]      = useState(null);

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
    setHeatmapUrl(`/images/heatmap_${sev}_od.jpg`);
    setUploadedImageUrl('');
    setAllProbs(null);
    setLesions([]);
    setLesionSummary(null);
    setApiResponse(null);
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
      fullName: file.name.replace(/\.[^/.]+$/, ''),
      severity: 2,
      label: 'Analysing...',
      confidence: null,
      age: 55,
      gender: 'M',
      village: 'Live Scan Intake',
    };
    setPatient(tempPatient);
    setSelectedEye('od');
    setHeatmapUrl('');
    setAllProbs(null);
    setLesions([]);
    setLesionSummary(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server returned status HTTP ${response.status}`);
      }

      const data = await response.json();
      setApiResponse(data);

      // Handle explicit OOD validation rejection from backend
      if (data.mode === 'error') {
        alert(`Image Validation Failed:\n${data.error || 'Invalid or non-fundus scan detected.'}\n\nPlease upload a valid retinal fundus scan.`);
        setScreen('upload');
        return;
      }

      // Normal successful response handling
      const realSev = typeof data.severity === 'number' ? data.severity : 2;
      setSeverity(realSev);
      setHeatmapUrl(data.heatmap_url || '');

      // Consume real data, safely defaulting if missing (P2 still implementing)
      const realProbs = Array.isArray(data.all_probs) ? data.all_probs : null;
      const realLesions = Array.isArray(data.lesions) ? data.lesions : [];
      const realSummary = data.lesion_summary || null;

      setAllProbs(realProbs);
      setLesions(realLesions);
      setLesionSummary(realSummary);

      setPatient({
        ...tempPatient,
        severity: realSev,
        label: data.label || LEVEL_LABELS[realSev] || `Grade ${realSev}`,
        confidence: data.confidence != null ? data.confidence : null,
        action: data.action || '',
        mode: data.mode || 'real',
        heatmap_url: data.heatmap_url || '',
        all_probs: realProbs,
        lesions: realLesions,
        lesion_summary: realSummary,
      });
    } catch (err) {
      console.error('Backend upload request failed:', err);
      alert('Backend connection error: Unable to reach the API server on http://localhost:8000.\nPlease verify the backend server is running and try again.');
      setScreen('upload');
    }
  };

  // ── Screens that own their entire viewport ───────────────────────────────
  if (screen === 'home')         return <Home navigate={navigate} />;
  if (screen === 'qualitycheck') return <QualityCheck navigate={navigate} />;
  if (screen === 'processing')   return <Processing navigate={navigate} patient={patient} />;
  if (screen === 'admin')        return <Admin navigate={navigate} />;

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
        {screen === 'upload' && (
          <Upload
            navigate={navigate}
            onSelectPatient={onSelectPatient}
            handleUpload={handleUpload}
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
            onQueue={() => navigate('queue')}
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
          />
        )}
      </div>
    </div>
  );
}
