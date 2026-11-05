import React, { useState } from 'react';
import { allPatients } from '../data.js';

// ── Operational statistics ──────────────────────────────────────────────────
const screeningsToday = allPatients.length;
const pendingReview   = allPatients.filter(p => p.severity >= 2).length;
const normalCases     = allPatients.filter(p => p.severity < 2).length;
const urgentCases     = allPatients.filter(p => p.severity >= 3).length;

// ── Analytics data ──────────────────────────────────────────────────────────
const gradeCount   = [0, 1, 2, 3, 4].map(g => allPatients.filter(p => p.severity === g).length);
const referralRate = screeningsToday > 0 ? Math.round((pendingReview / screeningsToday) * 100) : 0;
const weekTrend    = [8, 10, 7, 11, 9, 14, screeningsToday];
const weekDays     = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'];
const lesionData   = [
  { label: 'Microaneurysms', val: 50, color: '#ea580c' },
  { label: 'Hemorrhages',    val: 16, color: '#dc2626' },
  { label: 'Exudates',       val: 17, color: '#eab308' },
];
const GRADE_COLORS = ['#22c55e', '#eab308', '#f59e0b', '#ea580c', '#dc2626'];
const GRADE_NAMES  = ['Grade 0 – No DR', 'Grade 1 – Mild', 'Grade 2 – Moderate', 'Grade 3 – Severe', 'Grade 4 – PDR'];

// ── Chart: Donut (DR Grade Distribution) ───────────────────────────────────
function DonutChart() {
  const r = 60, cx = 90, cy = 90;
  const C = 2 * Math.PI * r;
  let prevSum = 0;
  const segs = gradeCount.map((val, i) => {
    const dash = screeningsToday > 0 ? (val / screeningsToday) * C : 0;
    const seg  = { val, dash, offset: -prevSum, color: GRADE_COLORS[i], label: GRADE_NAMES[i] };
    prevSum += dash;
    return seg;
  }).filter(s => s.val > 0);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
      <svg viewBox="0 0 180 180" style={{ width: 148, height: 148, flexShrink: 0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={26} />
        <g transform={`rotate(-90, ${cx}, ${cy})`}>
          {segs.map((s, i) => (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={s.color} strokeWidth={24}
              strokeDasharray={`${s.dash} ${C - s.dash}`}
              strokeDashoffset={s.offset}
            />
          ))}
        </g>
        <circle cx={cx} cy={cy} r={43} fill="white" />
        <text x={cx} y={cy - 5} textAnchor="middle" fontSize="22" fontWeight="800" fill="#0f172a">{screeningsToday}</text>
        <text x={cx} y={cy + 13} textAnchor="middle" fontSize="10" fill="#64748b">Total</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {gradeCount.map((cnt, i) => cnt > 0 && (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: GRADE_COLORS[i], flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#475569' }}>
              Grade {i}&nbsp;<span style={{ fontWeight: 700, color: '#0f172a' }}>({cnt})</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Chart: Line (Screenings Over Time) ─────────────────────────────────────
function LineChart() {
  const W = 300, H = 100, pL = 28, pR = 12, pT = 14, pB = 24;
  const plotW = W - pL - pR, plotH = H - pT - pB;
  const max   = Math.max(...weekTrend) + 3;
  const pts   = weekTrend.map((v, i) => ({
    x: pL + (i / (weekTrend.length - 1)) * plotW,
    y: pT + plotH - (v / max) * plotH,
  }));
  const poly = pts.map(p => `${p.x},${p.y}`).join(' ');
  const area = `M${pts[0].x},${pT + plotH} ` + pts.map(p => `L${p.x},${p.y}`).join(' ') + ` L${pts[pts.length - 1].x},${pT + plotH} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 110 }}>
      {[0, 0.5, 1].map(t => (
        <line key={t} x1={pL} x2={W - pR} y1={pT + plotH * (1 - t)} y2={pT + plotH * (1 - t)} stroke="#f1f5f9" strokeWidth="1" />
      ))}
      <path d={area} fill="#bfdbfe" opacity="0.45" />
      <polyline points={poly} fill="none" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={i === pts.length - 1 ? 5 : 3.5}
          fill={i === pts.length - 1 ? '#0284c7' : '#fff'} stroke="#0284c7" strokeWidth="2" />
      ))}
      {[0, pts.length - 1].map(i => (
        <text key={i} x={pts[i].x} y={pts[i].y - 7} textAnchor="middle" fontSize="10" fontWeight="700" fill="#0284c7">{weekTrend[i]}</text>
      ))}
      {[0, 3, weekDays.length - 1].map(i => (
        <text key={i} x={pts[i].x} y={H - 5} textAnchor="middle" fontSize="9" fill="#94a3b8">{weekDays[i]}</text>
      ))}
    </svg>
  );
}

// ── Chart: Gauge (Referral Rate) — Speedometer ──────────────────────────────
function GaugeChart() {
  // Use strokeDasharray technique on a circle for a clean speedometer
  // The gauge spans 240° (from 150° to 30°, clockwise)
  // cx=110, cy=100, r=72 — viewBox 220x160
  const cx = 110, cy = 100, r = 72;
  const circumference = 2 * Math.PI * r;        // full circle
  const gaugeFrac = 240 / 360;                  // 240° / 360°
  const gaugeLen  = circumference * gaugeFrac;  // arc length for 240°
  const gap       = circumference - gaugeLen;   // remaining 120°

  // Value dash = fraction of gaugeLen
  const valFrac = referralRate / 100;
  const valLen  = gaugeLen * valFrac;

  // Rotation: circle starts at 3 o'clock (0°). We want gauge to start at 150°.
  // So rotate the whole circle by 150°.
  const rotateAngle = 150;

  const col = referralRate >= 60 ? '#dc2626' : referralRate >= 35 ? '#ea580c' : '#16a34a';

  // Needle: angle in standard math from center
  const toRad = d => d * Math.PI / 180;
  const needAngle = rotateAngle + valFrac * 240;
  const needLen = r * 0.72;
  const needX = cx + needLen * Math.cos(toRad(needAngle));
  const needY = cy + needLen * Math.sin(toRad(needAngle));

  // Tick marks at 0,25,50,75,100%
  const ticks = [0, 25, 50, 75, 100].map(pct => {
    const a = toRad(rotateAngle + (pct / 100) * 240);
    return {
      pct,
      x1: (cx + (r - 8) * Math.cos(a)).toFixed(1),
      y1: (cy + (r - 8) * Math.sin(a)).toFixed(1),
      x2: (cx + (r + 8) * Math.cos(a)).toFixed(1),
      y2: (cy + (r + 8) * Math.sin(a)).toFixed(1),
      lx: (cx + (r + 20) * Math.cos(a)).toFixed(1),
      ly: (cy + (r + 20) * Math.sin(a)).toFixed(1),
    };
  });

  return (
    <svg viewBox="0 0 220 160" style={{ width: '100%', height: 150 }}>
      {/* Background track: 240° grey arc via strokeDasharray */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke="#e2e8f0"
        strokeWidth="14"
        strokeDasharray={`${gaugeLen.toFixed(2)} ${gap.toFixed(2)}`}
        strokeDashoffset="0"
        strokeLinecap="round"
        transform={`rotate(${rotateAngle} ${cx} ${cy})`}
      />
      {/* Value arc: colored portion */}
      {referralRate > 0 && (
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={col}
          strokeWidth="14"
          strokeDasharray={`${valLen.toFixed(2)} ${(circumference - valLen).toFixed(2)}`}
          strokeDashoffset="0"
          strokeLinecap="round"
          transform={`rotate(${rotateAngle} ${cx} ${cy})`}
        />
      )}
      {/* Tick marks */}
      {ticks.map(t => (
        <line key={t.pct}
          x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
          stroke="#94a3b8" strokeWidth="2"
        />
      ))}
      {/* Needle */}
      <line x1={cx} y1={cy} x2={needX.toFixed(1)} y2={needY.toFixed(1)}
        stroke="#1e293b" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={7} fill="#1e293b" />
      <circle cx={cx} cy={cy} r={3} fill="white" />
      {/* Percentage label */}
      <text x={cx} y={cy + 36} textAnchor="middle" fontSize="22" fontWeight="800" fill={col}>{referralRate}%</text>
      <text x={cx} y={cy + 50} textAnchor="middle" fontSize="9" fill="#94a3b8">Referral Rate</text>
      {/* 0% / 100% labels at start/end of arc */}
      <text x={ticks[0].lx} y={ticks[0].ly} textAnchor="middle" fontSize="9" fill="#94a3b8">0%</text>
      <text x={ticks[4].lx} y={ticks[4].ly} textAnchor="middle" fontSize="9" fill="#94a3b8">100%</text>
    </svg>
  );
}

// ── Chart: Bar (Lesion Type Breakdown) ─────────────────────────────────────
function BarChart() {
  const W = 300, H = 110, pL = 32, pR = 10, pT = 14, pB = 32;
  const plotW = W - pL - pR, plotH = H - pT - pB;
  const max   = Math.max(...lesionData.map(d => d.val));
  const gap   = plotW / lesionData.length;
  const barW  = gap * 0.52;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 120 }}>
      {[0, 0.5, 1].map(t => (
        <line key={t} x1={pL} x2={W - pR} y1={pT + plotH * (1 - t)} y2={pT + plotH * (1 - t)} stroke="#f1f5f9" strokeWidth="1" />
      ))}
      {lesionData.map((d, i) => {
        const bH = (d.val / max) * plotH;
        const x  = pL + gap * i + (gap - barW) / 2;
        const y  = pT + plotH - bH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={bH} rx={5} fill={d.color} opacity={0.82} />
            <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize="11" fontWeight="700" fill={d.color}>{d.val}</text>
            <text x={x + barW / 2} y={H - 10} textAnchor="middle" fontSize={d.label.length > 10 ? 7.5 : 9} fill="#64748b">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Main Home Component ─────────────────────────────────────────────────────
export default function Home({ navigate }) {
  const now     = new Date();
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
              Diabetic Retinopathy Automated Evaluation &amp; Triage
            </h1>
            <p style={{ fontSize: 14, color: '#475569', margin: 0, lineHeight: 1.6 }}>
              Instant ICDR grading (Levels 0–4), microaneurysm &amp; hemorrhage segmentation, Grad-CAM visual explainability, and automated referral routing designed for primary care clinics.
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
            { label: 'Total Screenings Today',          val: screeningsToday, sub: 'Registered in triage queue',          color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' },
            { label: 'Referrals Required (Grade ≥ 2)',  val: pendingReview,   sub: 'Needs ophthalmologist triage',         color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
            { label: 'Urgent / Proliferative (Grade 3–4)', val: urgentCases,  sub: 'Emergency laser / surgery review',     color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
            { label: 'Normal / Mild (Routine)',          val: normalCases,    sub: 'Annual recall protocol',               color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
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

        {/* ── Visual Analytics Section ───────────────────────────────────────── */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Visual Analytics
              </h2>
              <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
                Today's screening data at a glance
              </p>
            </div>
            <div style={{
              marginLeft: 'auto',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#f0f9ff', border: '1px solid #bae6fd',
              padding: '5px 12px', borderRadius: 20,
              fontSize: 11, fontWeight: 600, color: '#0284c7',
            }}>
              Live · Today
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>

            {/* Chart 1: DR Grade Distribution (Donut) */}
            <div style={{
              background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0',
              padding: '22px 24px', boxShadow: '0 1px 4px rgba(15,23,42,0.04)',
            }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0284c7' }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>DR Grade Distribution</span>
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', paddingLeft: 16 }}>Breakdown of today's patients by ICDR grade</div>
              </div>
              <DonutChart />
            </div>

            {/* Chart 2: Screenings Over Time (Line) */}
            <div style={{
              background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0',
              padding: '22px 24px', boxShadow: '0 1px 4px rgba(15,23,42,0.04)',
            }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0284c7' }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Screenings Over Time</span>
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', paddingLeft: 16 }}>7-day screening volume trend</div>
              </div>
              <LineChart />
            </div>

            {/* Chart 3: Referral Rate (Gauge) */}
            <div style={{
              background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0',
              padding: '22px 24px', boxShadow: '0 1px 4px rgba(15,23,42,0.04)',
            }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ea580c' }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Referral Rate</span>
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', paddingLeft: 16 }}>% of patients needing specialist review (Grade ≥ 2)</div>
              </div>
              <GaugeChart />
            </div>

            {/* Chart 4: Lesion Type Breakdown (Bar) */}
            <div style={{
              background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0',
              padding: '22px 24px', boxShadow: '0 1px 4px rgba(15,23,42,0.04)',
            }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ea580c' }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Lesion Type Breakdown</span>
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', paddingLeft: 16 }}>Total detected lesions across today's queue</div>
              </div>
              <BarChart />
            </div>

          </div>
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
              Patient Intake &amp; Fundus Upload
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
              Examine full-resolution ocular scans with pan &amp; zoom, Red-Free vascular contrast, Grad-CAM overlays, and quadrant analysis.
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
