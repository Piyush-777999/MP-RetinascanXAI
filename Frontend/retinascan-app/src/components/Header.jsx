import React from 'react';

export default function Header({ screen, navigate }) {
  const links = [
    { key: 'home',     label: 'Home',     icon: 'home' },
    { key: 'upload',   label: 'Upload',   icon: 'upload_file' },
    { key: 'results',  label: 'Results',  icon: 'analytics' },
    { key: 'queue',    label: 'Queue',    icon: 'list_alt' },
    { key: 'canvas',   label: 'Canvas',   icon: 'draw' },
    { key: 'referral', label: 'Referral', icon: 'outbox' },
  ];

  return (
    <header style={{
      position: 'fixed', top: 0, width: '100%', zIndex: 50,
      background: 'rgba(3, 12, 20, 0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
    }}>
      <div style={{ maxWidth: 1600, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Logo */}
        <div
          onClick={() => navigate('home')}
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
        >
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg, #00d4aa, #0096b4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 16px rgba(0,212,170,0.4)',
            flexShrink: 0,
          }}>
            <span className="material-symbols-outlined" style={{ color: '#020c12', fontSize: 18, fontVariationSettings: "'FILL' 1" }}>visibility</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#f0f6ff', letterSpacing: '-0.01em', fontFamily: 'Manrope, sans-serif' }}>RetinaScan XAI</span>
            <span style={{ fontSize: 10, color: '#00d4aa', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>Clinical · SIH 2026</span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {links.map(link => {
            const active = screen === link.key;
            return (
              <button
                key={link.key}
                onClick={() => navigate(link.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 12px',
                  borderRadius: 8,
                  fontSize: 12.5, fontWeight: 500, letterSpacing: '0.01em',
                  cursor: 'pointer', border: 'none',
                  background: active ? 'rgba(0,212,170,0.12)' : 'transparent',
                  color: active ? '#00d4aa' : 'rgba(255,255,255,0.5)',
                  boxShadow: active ? 'inset 0 0 0 1px rgba(0,212,170,0.3)' : 'none',
                  transition: 'all 0.15s',
                  fontFamily: 'Inter, sans-serif',
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.color = '#f0f6ff'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.background = 'transparent'; } }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{link.icon}</span>
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '5px 12px', borderRadius: 20,
            background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block', animation: 'pulse 2s infinite' }}></span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#34d399', fontFamily: 'JetBrains Mono, monospace' }}>Model Active</span>
          </div>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, #00d4aa22, #22d3ee22)',
            border: '1px solid rgba(0,212,170,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#00d4aa', fontFamily: 'JetBrains Mono, monospace' }}>DR</span>
          </div>
        </div>
      </div>
    </header>
  );
}
