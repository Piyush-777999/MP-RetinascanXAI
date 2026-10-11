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
  const [lesions,          setLesions]          = useState(demoPresets[2].lesions || []);
  const [lesionSummary,    setLesionSummary]    = useState(demoPresets[2].lesionSummary || null);
  const [,                 setApiResponse]      = useState(null);
  const [uploadError,      setUploadError]      = useState(null);

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
  }

  const LEVEL_LABELS = [
    'No Apparent DR', 'Mild NPDR', 'Moderate NPDR', 'Severe NPDR', 'Proliferative DR',
  ];

  const handleUpload = async (file) => {
    setUploadError(null);
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
        setUploadError(data.error || 'Scan validation failed: Not an ocular fundus scan.');
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
      setUploadError('Backend connection error: Unable to reach the API server on http://localhost:8000.');
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
            { key: 'upload',   label: 'Patient Intake' },
            { key: 'results',  label: 'Diagnostic Results' },
            { key: 'queue',    label: 'Triage Queue' },
            { key: 'canvas',   label: 'PACS Canvas' },
            { key: 'referral', label: 'Referral Slip' },
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

        {/* Right: patient quick-info if set */}
        {patient?.name && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12 }}>
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
