import React, { useState } from 'react';
import { allPatients } from '../data.js';

// ── Operational statistics ──────────────────────────────────────────────────
const screeningsToday = allPatients.length;
const pendingReview   = allPatients.filter(p => p.severity >= 2).length;
const normalCases     = allPatients.filter(p => p.severity < 2).length;
const urgentCases     = allPatients.filter(p => p.severity >= 3).length;

export default function Home({ navigate }) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const dateStr = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <main style={{
      minHeight: '100vh',
      background: '#f8fafc',
      color: '#0f172a',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      paddingBottom: 60,
    }}>
      {/* Top Clinical Header Bar */}
      <header style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(15,23,42,0.03)',
      }}>
        <div style={{
          maxWidth: 1240, margin: '0 auto', padding: '16px 32px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: 'linear-gradient(135deg, #0284c7, #0369a1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(2,132,199,0.25)',
              color: '#ffffff',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' }}>
                RetinaScan AI
              </div>
              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>
                Clinical Screening Workstation • Rural Tele-Ophthalmology Edition
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{timeStr}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{dateStr}</div>
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#f0fdf4', border: '1px solid #bbf7d0',
              padding: '6px 12px', borderRadius: 20,
              fontSize: 12, fontWeight: 600, color: '#16a34a',
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a' }} />
              AI Model Active (ResNet-50 v2)
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '36px 32px 0' }}>
        
        {/* Welcome Banner */}
        <div style={{
          background: '#ffffff',
          borderRadius: 16,
          border: '1px solid #e2e8f0',
          padding: '28px 32px',
          boxShadow: '0 1px 4px rgba(15,23,42,0.04)',
          marginBottom: 32,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24,
        }}>
          <div style={{ maxWidth: 680 }}>
            <span style={{
              display: 'inline-block', padding: '4px 10px', borderRadius: 6,
              background: '#e0f2fe', color: '#0369a1', fontSize: 11, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10,
            }}>
              National Health Mission • DR Screening Protocol
            </span>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
              Diabetic Retinopathy Automated Evaluation & Triage
            </h1>
            <p style={{ fontSize: 14, color: '#475569', margin: 0, lineHeight: 1.6 }}>
              Instant ICDR grading (Levels 0–4), microaneurysm & hemorrhage segmentation, Grad-CAM visual explainability, and automated referral routing designed for primary care clinics.
            </p>
          </div>

          <button
            onClick={() => navigate('upload')}
            style={{
              all: 'unset', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '14px 28px', borderRadius: 10,
              background: '#0284c7', color: '#ffffff',
              fontSize: 14, fontWeight: 700,
              boxShadow: '0 4px 12px rgba(2,132,199,0.25)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#0369a1'}
            onMouseLeave={e => e.currentTarget.style.background = '#0284c7'}
          >
            <span>Start New Patient Scan</span>
            <span style={{ fontSize: 16 }}>→</span>
          </button>
        </div>

        {/* Clinical Statistics Summary */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18, marginBottom: 36,
        }}>
          {[
            { label: 'Total Screenings Today', val: screeningsToday, sub: 'Registered in triage queue', color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' },
            { label: 'Referrals Required (Grade ≥ 2)', val: pendingReview, sub: 'Needs ophthalmologist triage', color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
            { label: 'Urgent / Proliferative (Grade 3–4)', val: urgentCases, sub: 'Emergency laser / surgery review', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
            { label: 'Normal / Mild (Routine)', val: normalCases, sub: 'Annual recall protocol', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
          ].map(s => (
            <div key={s.label} style={{
              background: '#ffffff', borderRadius: 14, padding: '20px',
              border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(15,23,42,0.03)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>{s.label}</span>
                <span style={{
                  padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                  background: s.bg, color: s.color, border: `1px solid ${s.border}`,
                }}>Today</span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color, letterSpacing: '-0.02em', marginBottom: 4 }}>
                {s.val}
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Section Title */}
        <div style={{ marginBottom: 18 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Workstation Modules
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            Select an action to continue your clinical workflow
          </p>
        </div>

        {/* 3 Main Action Modules */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
          
          {/* Card 1: New Intake */}
          <div
            onClick={() => navigate('upload')}
            style={{
              background: '#ffffff', borderRadius: 16, padding: '28px',
              border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(15,23,42,0.04)',
              cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', flexDirection: 'column',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(2,132,199,0.12)';
              e.currentTarget.style.borderColor = '#0284c7';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 4px rgba(15,23,42,0.04)';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
          >
            <div style={{
              width: 52, height: 52, borderRadius: 12, background: '#f0f9ff', color: '#0284c7',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18,
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v8M8 12h8" />
              </svg>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
              Primary Intake
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>
              Patient Intake & Fundus Upload
            </h3>
            <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, margin: '0 0 20px' }}>
              Upload new fundus scans from camera or choose verified patient demo presets with pre-configured bilateral eyes.
            </p>
            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#0284c7' }}>
              <span>Open Intake Station</span>
              <span>→</span>
            </div>
          </div>

          {/* Card 2: Queue */}
          <div
            onClick={() => navigate('queue')}
            style={{
              background: '#ffffff', borderRadius: 16, padding: '28px',
              border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(15,23,42,0.04)',
              cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', flexDirection: 'column',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(15,23,42,0.08)';
              e.currentTarget.style.borderColor = '#cbd5e1';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 4px rgba(15,23,42,0.04)';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
          >
            <div style={{
              width: 52, height: 52, borderRadius: 12, background: '#f8fafc', color: '#475569',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18,
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
              </svg>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
              Review Worklist
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>
              Clinical Triage Queue
            </h3>
            <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, margin: '0 0 20px' }}>
              Review screened patients, check tele-ophthalmology triage queues, and prepare printed medical referral slips.
            </p>
            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#475569' }}>
              <span>View Triage Worklist ({screeningsToday})</span>
              <span>→</span>
            </div>
          </div>

          {/* Card 3: Canvas */}
          <div
            onClick={() => navigate('canvas')}
            style={{
              background: '#ffffff', borderRadius: 16, padding: '28px',
              border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(15,23,42,0.04)',
              cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', flexDirection: 'column',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(15,23,42,0.08)';
              e.currentTarget.style.borderColor = '#cbd5e1';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 4px rgba(15,23,42,0.04)';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
          >
            <div style={{
              width: 52, height: 52, borderRadius: 12, background: '#f8fafc', color: '#475569',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18,
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
              Diagnostic Imaging
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>
              PACS Diagnostic Canvas
            </h3>
            <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, margin: '0 0 20px' }}>
              Examine full-resolution ocular scans with pan & zoom, Red-Free vascular contrast, Grad-CAM overlays, and quadrant analysis.
            </p>
            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#475569' }}>
              <span>Launch Canvas</span>
              <span>→</span>
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
