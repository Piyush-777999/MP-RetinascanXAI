import React, { useState, useRef, useEffect } from 'react';
import { APP_LANGUAGES } from '../translations.js';

export default function LanguageSwitcher({ currentLang = 'hi', onChangeLang }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const activeLangObj = APP_LANGUAGES.find(l => l.code === currentLang) || APP_LANGUAGES[0];

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* 21st.dev / shadcn-style Minimalist Language Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          all: 'unset',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '6px 12px',
          borderRadius: 8,
          background: '#ffffff',
          border: '1px solid #cbd5e1',
          color: '#1e293b',
          fontSize: 12,
          fontWeight: 600,
          boxShadow: '0 1px 2px rgba(15,23,42,0.05)',
          transition: 'all 0.15s ease',
        }}
        title="Change application language / भाषा बदलें"
      >
        {/* Crisp vector Globe SVG */}
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>

        <span>{activeLangObj.label}</span>
        <span style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', fontFamily: 'monospace' }}>
          ({activeLangObj.code})
        </span>

        {/* Minimal Chevron SVG */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#64748b"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s ease',
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          right: 0,
          width: 190,
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 10,
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.08)',
          padding: '6px',
          zIndex: 9999,
          animation: 'fade-up 0.15s ease both',
        }}>
          <div style={{
            padding: '5px 8px 6px',
            fontSize: 10,
            fontWeight: 700,
            color: '#94a3b8',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            borderBottom: '1px solid #f1f5f9',
            marginBottom: 4,
          }}>
            Select Language • भाषा चुनें
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {APP_LANGUAGES.map(lang => {
              const isSelected = lang.code === currentLang;
              return (
                <button
                  key={lang.code}
                  onClick={() => {
                    onChangeLang(lang.code);
                    setIsOpen(false);
                  }}
                  style={{
                    all: 'unset',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 6,
                    fontSize: 12.5,
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? '#0284c7' : '#334155',
                    background: isSelected ? '#f0f9ff' : 'transparent',
                    transition: 'all 0.1s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13 }}>{lang.flag}</span>
                    <span>{lang.label}</span>
                    <span style={{ fontSize: 10.5, color: '#94a3b8' }}>({lang.englishLabel})</span>
                  </div>

                  {isSelected && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
