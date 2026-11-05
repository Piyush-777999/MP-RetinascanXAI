import React from 'react';
import { allPatients } from '../data.js';

// ── Operational statistics ──────────────────────────────────────────────────
const screeningsToday = allPatients.length;
const pendingReview   = allPatients.filter(p => p.severity >= 2).length;
const normalCases     = allPatients.filter(p => p.severity < 2).length;
const urgentCases     = allPatients.filter(p => p.severity >= 3).length;

// ── Earthy Botanical Theme Tokens ───────────────────────────────────────────
const EB = {
  forest:    '#25351A',
  olive:     '#4C3D12',
  ivory:     '#F4F4E9',
  sage:      '#7D8960',
  celery:    '#E3EBC9',
  grayGreen: '#D0D4C2',
  ink:       '#171812',
  inkMuted:  '#858575',
  hairline:  '1px solid rgba(76,61,18,0.14)',
};

// ── Analytics Data & Aggregations ───────────────────────────────────────────
const gradeCount   = [0, 1, 2, 3, 4].map(g => allPatients.filter(p => p.severity === g).length);
const referralRate = screeningsToday > 0 ? Math.round((pendingReview / screeningsToday) * 100) : 0;
const weekTrend    = [8, 10, 7, 11, 9, 14, screeningsToday];
const weekDays     = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'];
const lesionData   = [
  { label: 'Microaneurysms', val: 50, color: '#D97706', desc: 'Earliest vascular dilation' },
  { label: 'Hemorrhages',    val: 16, color: '#DC2626', desc: 'Ruptured capillary leakage' },
  { label: 'Hard Exudates',  val: 17, color: '#7D8960', desc: 'Lipid foveal deposits' },
];
const GRADE_COLORS = ['#22c55e', '#84cc16', '#f59e0b', '#ea580c', '#dc2626'];
const GRADE_NAMES  = [
  'Grade 0 · No DR',
  'Grade 1 · Mild NPDR',
  'Grade 2 · Moderate NPDR',
  'Grade 3 · Severe NPDR',
  'Grade 4 · Proliferative DR'
];

// ── Chart 1: Donut (DR Grade Distribution) ──────────────────────────────────
function DonutChart() {
  const r = 74, cx = 96, cy = 96;
  const C = 2 * Math.PI * r;
  let prevSum = 0;
  const segs = gradeCount.map((val, i) => {
    const dash = screeningsToday > 0 ? (val / screeningsToday) * C : 0;
    const seg  = { val, dash, offset: -prevSum, color: GRADE_COLORS[i], label: GRADE_NAMES[i], grade: i };
    prevSum += dash;
    return seg;
  }).filter(s => s.val > 0);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap', minHeight: 200 }}>
      {/* SVG Donut */}
      <svg viewBox="0 0 192 192" style={{ width: 175, height: 175, flexShrink: 0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E6EAD8" strokeWidth={24} />
        <g transform={`rotate(-90, ${cx}, ${cy})`}>
          {segs.map((s, i) => (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={s.color} strokeWidth={24}
              strokeDasharray={`${s.dash} ${C - s.dash}`}
              strokeDashoffset={s.offset}
            />
          ))}
        </g>
        <circle cx={cx} cy={cy} r={50} fill="#ffffff" />
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="26" fontWeight="900" fill={EB.ink}>{screeningsToday}</text>
        <text x={cx} y={cy + 15} textAnchor="middle" fontSize="11" fontWeight="600" fill={EB.inkMuted} letterSpacing="0.04em">PATIENTS</text>
      </svg>

      {/* Legend & Breakdown Bars */}
      <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 9 }}>
        {GRADE_NAMES.map((name, i) => {
          const cnt = gradeCount[i];
          const pct = screeningsToday > 0 ? Math.round((cnt / screeningsToday) * 100) : 0;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: GRADE_COLORS[i], flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: cnt > 0 ? EB.ink : EB.inkMuted }}>
                  {name}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 50, height: 6, background: '#EAEFE0', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: GRADE_COLORS[i], borderRadius: 3 }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: cnt > 0 ? EB.ink : EB.inkMuted, minWidth: 42, textAlign: 'right' }}>
                  {cnt} <span style={{ fontSize: 10.5, fontWeight: 500, color: EB.inkMuted }}>({pct}%)</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Chart 2: Line (7-Day Screening Trend) ───────────────────────────────────
function LineChart() {
  const W = 460, H = 180, pL = 36, pR = 20, pT = 24, pB = 34;
  const plotW = W - pL - pR, plotH = H - pT - pB;
  const max   = Math.max(...weekTrend) + 4;
  const pts   = weekTrend.map((v, i) => ({
    x: pL + (i / (weekTrend.length - 1)) * plotW,
    y: pT + plotH - (v / max) * plotH,
    val: v,
    day: weekDays[i],
  }));
  const poly = pts.map(p => `${p.x},${p.y}`).join(' ');
  const area = `M${pts[0].x},${pT + plotH} ` + pts.map(p => `L${p.x},${p.y}`).join(' ') + ` L${pts[pts.length - 1].x},${pT + plotH} Z`;

  const yTicks = [0, 5, 10, 15];

  return (
    <div style={{ width: '100%', minHeight: 200, display: 'flex', alignItems: 'center' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', maxHeight: 210 }}>
        <defs>
          <linearGradient id="ebAreaGradLarge" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={EB.celery} stopOpacity="0.9" />
            <stop offset="100%" stopColor={EB.celery} stopOpacity="0.08" />
          </linearGradient>
        </defs>

        {/* Horizontal gridlines and Y-axis labels */}
        {yTicks.map(tick => {
          const y = pT + plotH - (tick / max) * plotH;
          return (
            <g key={tick}>
              <line x1={pL} x2={W - pR} y1={y} y2={y} stroke="rgba(76,61,18,0.10)" strokeDasharray="3 3" strokeWidth="1" />
              <text x={pL - 8} y={y + 4} textAnchor="end" fontSize="10" fontWeight="600" fill={EB.inkMuted}>{tick}</text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={area} fill="url(#ebAreaGradLarge)" />

        {/* Polyline */}
        <polyline points={poly} fill="none" stroke={EB.forest} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points & labels */}
        {pts.map((p, i) => {
          const isToday = i === pts.length - 1;
          return (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={isToday ? 6 : 4}
                fill={isToday ? EB.forest : '#ffffff'} stroke={EB.forest} strokeWidth={isToday ? 2.5 : 2} />
              {/* Badge value above point */}
              <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize={isToday ? "11.5" : "10"} fontWeight={isToday ? "800" : "700"} fill={isToday ? EB.forest : EB.ink}>
                {p.val}
              </text>
              {/* Day label below */}
              <text x={p.x} y={H - 8} textAnchor="middle" fontSize="10.5" fontWeight={isToday ? "800" : "600"} fill={isToday ? EB.forest : EB.inkMuted}>
                {p.day}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Chart 3: Gauge (Referral Rate Speedometer) ───────────────────────────────
function GaugeChart() {
  const cx = 160, cy = 135, r = 90;
  const circumference = 2 * Math.PI * r;
  const gaugeFrac = 240 / 360;
  const gaugeLen  = circumference * gaugeFrac;
  const gap       = circumference - gaugeLen;

  const valFrac = Math.min(Math.max(referralRate / 100, 0), 1);
  const valLen  = gaugeLen * valFrac;
  const rotateAngle = 150;

  const col = referralRate >= 60 ? '#dc2626' : referralRate >= 35 ? '#ea580c' : EB.forest;
  const statusText = referralRate >= 60 ? 'Critical Triage Quota' : referralRate >= 35 ? 'Moderate Specialty Quota' : 'Normal Screening Quota';

  const toRad = d => d * Math.PI / 180;
  const needAngle = rotateAngle + valFrac * 240;
  const needLen = r * 0.72;
  const needX = cx + needLen * Math.cos(toRad(needAngle));
  const needY = cy + needLen * Math.sin(toRad(needAngle));

  const ticks = [0, 25, 50, 75, 100].map(pct => {
    const a = toRad(rotateAngle + (pct / 100) * 240);
    return {
      pct,
      x1: (cx + (r - 9) * Math.cos(a)).toFixed(1),
      y1: (cy + (r - 9) * Math.sin(a)).toFixed(1),
      x2: (cx + (r + 9) * Math.cos(a)).toFixed(1),
      y2: (cy + (r + 9) * Math.sin(a)).toFixed(1),
      lx: (cx + (r + 22) * Math.cos(a)).toFixed(1),
      ly: (cy + (r + 22) * Math.sin(a)).toFixed(1),
    };
  });

  return (
    <div style={{ width: '100%', minHeight: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <svg viewBox="0 0 320 185" style={{ width: '100%', maxWidth: 330, height: 'auto' }}>
        {/* Background track: 240° arc */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="#E6EAD8"
          strokeWidth="16"
          strokeDasharray={`${gaugeLen.toFixed(2)} ${gap.toFixed(2)}`}
          strokeDashoffset="0"
          strokeLinecap="round"
          transform={`rotate(${rotateAngle} ${cx} ${cy})`}
        />
        {/* Value arc */}
        {referralRate > 0 && (
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={col}
            strokeWidth="16"
            strokeDasharray={`${valLen.toFixed(2)} ${(circumference - valLen).toFixed(2)}`}
            strokeDashoffset="0"
            strokeLinecap="round"
            transform={`rotate(${rotateAngle} ${cx} ${cy})`}
          />
        )}
        {/* Ticks */}
        {ticks.map(t => (
          <line key={t.pct}
            x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            stroke="rgba(76,61,18,0.24)" strokeWidth="2"
          />
        ))}
        {/* Needle */}
        <line x1={cx} y1={cy} x2={needX.toFixed(1)} y2={needY.toFixed(1)}
          stroke={EB.forest} strokeWidth="3.5" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={8} fill={EB.forest} />
        <circle cx={cx} cy={cy} r={3} fill="#ffffff" />

        {/* Readout */}
        <text x={cx} y={cy + 34} textAnchor="middle" fontSize="28" fontWeight="900" fill={col}>{referralRate}%</text>
        <text x={cx} y={cy + 48} textAnchor="middle" fontSize="10.5" fontWeight="600" fill={EB.inkMuted}>Referral Rate (Grade ≥ 2)</text>

        {/* Arc boundary labels */}
        {ticks.map(t => (
          <text key={t.pct} x={t.lx} y={t.ly} textAnchor="middle" fontSize="9.5" fontWeight="600" fill={EB.inkMuted}>{t.pct}%</text>
        ))}
      </svg>
      {/* Dynamic Status Pill */}
      <div style={{
        marginTop: 6,
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '5px 12px', borderRadius: 20,
        background: referralRate >= 60 ? '#fef2f2' : referralRate >= 35 ? '#fffbeb' : EB.celery,
        border: `1px solid ${referralRate >= 60 ? '#fecaca' : referralRate >= 35 ? '#fde68a' : EB.grayGreen}`,
        fontSize: 11, fontWeight: 700, color: col,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: col, flexShrink: 0 }} />
        {statusText}
      </div>
    </div>
  );
}

// ── Chart 4: Bar (Lesion Type Breakdown) ────────────────────────────────────
function BarChart() {
  const W = 460, H = 180, pL = 40, pR = 24, pT = 24, pB = 34;
  const plotW = W - pL - pR, plotH = H - pT - pB;
  const max   = Math.max(...lesionData.map(d => d.val)) + 10;
  const gap   = plotW / lesionData.length;
  const barW  = gap * 0.44;

  const yTicks = [0, 20, 40, 60];

  return (
    <div style={{ width: '100%', minHeight: 200, display: 'flex', alignItems: 'center' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', maxHeight: 210 }}>
        {/* Gridlines */}
        {yTicks.map(tick => {
          const y = pT + plotH - (tick / max) * plotH;
          return (
            <g key={tick}>
              <line x1={pL} x2={W - pR} y1={y} y2={y} stroke="rgba(76,61,18,0.10)" strokeDasharray="3 3" strokeWidth="1" />
              <text x={pL - 8} y={y + 4} textAnchor="end" fontSize="10" fontWeight="600" fill={EB.inkMuted}>{tick}</text>
            </g>
          );
        })}

        {/* Bars */}
        {lesionData.map((d, i) => {
          const bH = (d.val / max) * plotH;
          const x  = pL + gap * i + (gap - barW) / 2;
          const y  = pT + plotH - bH;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={bH} rx={6} fill={d.color} opacity={0.9} />
              <text x={x + barW / 2} y={y - 8} textAnchor="middle" fontSize="13" fontWeight="900" fill={d.color}>
                {d.val}
              </text>
              <text x={x + barW / 2} y={H - 10} textAnchor="middle" fontSize="11" fontWeight="700" fill={EB.ink}>
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Modules Configuration ───────────────────────────────────────────────────
const MODULES = [
  {
    key: 'upload',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/>
      </svg>
    ),
    tag: 'Intake',
    title: 'Patient Intake',
    desc: 'Upload fundus scan · automated image quality check',
    action: 'Open →',
  },
  {
    key: 'queue',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
      </svg>
    ),
    tag: 'Triage',
    title: 'Patient Queue',
    desc: `${screeningsToday} patients · sorted by clinical urgency`,
    action: 'View →',
  },
  {
    key: 'canvas',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/>
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
      </svg>
    ),
    tag: 'Imaging',
    title: 'Diagnostic Canvas',
    desc: 'Grad-CAM++ heatmap · pan & zoom · Red-Free filter',
    action: 'Launch →',
  },
  {
    key: 'referral',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>
      </svg>
    ),
    tag: 'Reports',
    title: 'Referral Letters',
    desc: 'Print-ready · multilingual patient counseling portal',
    action: 'Open →',
  },
];

const STATS = [
  { label: 'Today',    val: screeningsToday, sub: 'screenings' },
  { label: 'Referral', val: pendingReview,   sub: 'grade ≥ 2' },
  { label: 'Urgent',   val: urgentCases,     sub: 'grade 3–4' },
  { label: 'Routine',  val: normalCases,     sub: 'grade 0–1' },
];

export default function Home({ navigate }) {
  const now     = new Date();
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const dateStr = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <main style={{ minHeight: '100vh', background: EB.ivory, fontFamily: 'Inter, system-ui, sans-serif', color: EB.ink }}>

      {/* ── Top Bar ────────────────────────────────────────────────────── */}
      <header style={{ background: EB.forest, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '13px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <ellipse cx="11" cy="11" rx="9.5" ry="6.2" stroke="#E3EBC9" strokeWidth="1.5"/>
              <circle cx="11" cy="11" r="3" stroke="#E3EBC9" strokeWidth="1.5"/>
              <circle cx="11" cy="11" r="1.2" fill="#E3EBC9"/>
            </svg>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#F4F4E9', letterSpacing: '-0.02em' }}>RetinaScan XAI</div>
              <div style={{ fontSize: 10, color: 'rgba(244,244,233,0.5)', fontWeight: 500 }}>DR Screening Workstation</div>
            </div>
          </div>
          {/* Date/time + status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#F4F4E9' }}>{timeStr}</div>
              <div style={{ fontSize: 10, color: 'rgba(244,244,233,0.5)' }}>{dateStr}</div>
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(125,137,96,0.22)', border: '1px solid rgba(125,137,96,0.40)',
              padding: '5px 10px', borderRadius: 5, fontSize: 10.5, fontWeight: 700, color: '#E3EBC9',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#7D8960', flexShrink: 0 }}/>
              ResNet-50 · Active
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero Strip ─────────────────────────────────────────────────── */}
      <div style={{ background: EB.celery, borderBottom: EB.hairline, padding: '22px 28px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: EB.sage, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
              Point-of-Care Edition
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: EB.ink, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
              DR Screening &amp; Triage Dashboard
            </h1>
            <p style={{ fontSize: 13, color: EB.inkMuted, margin: 0 }}>
              ICDR grades 0–4 · ETDRS foveal profiling · multilingual counseling
            </p>
          </div>
          <button
            onClick={() => navigate('upload')}
            style={{
              all: 'unset', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '11px 24px', borderRadius: 6,
              background: EB.forest, color: EB.ivory,
              fontSize: 13.5, fontWeight: 700,
              transition: 'opacity 0.14s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            New Patient Scan →
          </button>
        </div>
      </div>

      {/* ── Main Content ───────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '28px 28px 60px' }}>

        {/* Stats Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 32 }}>
          {STATS.map((s, i) => (
            <div key={i} style={{
              background: '#ffffff', border: EB.hairline, borderRadius: 8,
              padding: '16px 20px',
              boxShadow: '0 1px 4px rgba(23,24,18,0.05)',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: EB.inkMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 30, fontWeight: 900, color: EB.ink, letterSpacing: '-0.03em', lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 11.5, color: EB.inkMuted, marginTop: 4 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Visual Analytics Section (2x2 Grid) ────────────────────────── */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 800, color: EB.forest, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                Visual Analytics
              </h2>
              <div style={{ fontSize: 12, color: EB.inkMuted, marginTop: 3 }}>
                Today's screening cohort at a glance · ICDR grade distribution, 7-day trend &amp; referral metrics
              </div>
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: EB.celery, border: EB.hairline,
              padding: '5px 12px', borderRadius: 6,
              fontSize: 11, fontWeight: 700, color: EB.forest,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: EB.forest, flexShrink: 0 }} />
              Live Clinical Feed
            </div>
          </div>

          {/* 2x2 Larger Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 520px), 1fr))',
            gap: 20,
          }}>

            {/* Chart 1: DR Grade Distribution (Donut) */}
            <div style={{
              background: '#ffffff', border: EB.hairline, borderRadius: 8,
              padding: '24px 26px', boxShadow: '0 1px 4px rgba(23,24,18,0.05)',
              display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: EB.forest }} />
                    <span style={{ fontSize: 15, fontWeight: 800, color: EB.ink }}>DR Grade Distribution</span>
                  </div>
                  <div style={{ fontSize: 12, color: EB.inkMuted, paddingLeft: 16 }}>Cohorts classified by ICDR standard grading</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: EB.sage, background: EB.ivory, border: EB.hairline, padding: '3px 8px', borderRadius: 4 }}>
                  N = {screeningsToday}
                </span>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <DonutChart />
              </div>
            </div>

            {/* Chart 2: Screenings Over Time (Line) */}
            <div style={{
              background: '#ffffff', border: EB.hairline, borderRadius: 8,
              padding: '24px 26px', boxShadow: '0 1px 4px rgba(23,24,18,0.05)',
              display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: EB.forest }} />
                    <span style={{ fontSize: 15, fontWeight: 800, color: EB.ink }}>Screenings Over Time</span>
                  </div>
                  <div style={{ fontSize: 12, color: EB.inkMuted, paddingLeft: 16 }}>7-day screening volume trajectory</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: EB.forest, background: EB.celery, border: EB.hairline, padding: '3px 8px', borderRadius: 4 }}>
                  Weekly Total: {weekTrend.reduce((a, b) => a + b, 0)}
                </span>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <LineChart />
              </div>
            </div>

            {/* Chart 3: Referral Rate (Gauge) */}
            <div style={{
              background: '#ffffff', border: EB.hairline, borderRadius: 8,
              padding: '24px 26px', boxShadow: '0 1px 4px rgba(23,24,18,0.05)',
              display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ea580c' }} />
                    <span style={{ fontSize: 15, fontWeight: 800, color: EB.ink }}>Referral Speedometer</span>
                  </div>
                  <div style={{ fontSize: 12, color: EB.inkMuted, paddingLeft: 16 }}>Quota of patients requiring ophthalmologist consult</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: EB.inkMuted, background: EB.ivory, border: EB.hairline, padding: '3px 8px', borderRadius: 4 }}>
                  Threshold: 35%
                </span>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <GaugeChart />
              </div>
            </div>

            {/* Chart 4: Lesion Type Breakdown (Bar) */}
            <div style={{
              background: '#ffffff', border: EB.hairline, borderRadius: 8,
              padding: '24px 26px', boxShadow: '0 1px 4px rgba(23,24,18,0.05)',
              display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ea580c' }} />
                    <span style={{ fontSize: 15, fontWeight: 800, color: EB.ink }}>Microvascular Lesion Profile</span>
                  </div>
                  <div style={{ fontSize: 12, color: EB.inkMuted, paddingLeft: 16 }}>Automated segmentation count across today's queue</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: EB.sage, background: EB.ivory, border: EB.hairline, padding: '3px 8px', borderRadius: 4 }}>
                  Total: {lesionData.reduce((a, b) => a + b.val, 0)}
                </span>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <BarChart />
              </div>
            </div>

          </div>
        </div>

        {/* Section Header: Modules */}
        <div style={{ marginBottom: 14 }}>
          <h2 style={{ fontSize: 14, fontWeight: 800, color: EB.forest, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
            Clinical Modules
          </h2>
        </div>

        {/* Module Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 14 }}>
          {MODULES.map(mod => (
            <div
              key={mod.key}
              onClick={() => navigate(mod.key)}
              style={{
                background: '#ffffff', border: EB.hairline, borderRadius: 8,
                padding: '22px', cursor: 'pointer',
                display: 'flex', flexDirection: 'column',
                transition: 'box-shadow 0.14s ease, border-color 0.14s ease',
                boxShadow: '0 1px 4px rgba(23,24,18,0.05)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = '0 6px 18px rgba(37,53,26,0.12)';
                e.currentTarget.style.borderColor = 'rgba(76,61,18,0.30)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = '0 1px 4px rgba(23,24,18,0.05)';
                e.currentTarget.style.borderColor = 'rgba(76,61,18,0.14)';
              }}
            >
              <div style={{
                width: 42, height: 42, borderRadius: 8,
                background: EB.celery, color: EB.forest,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 14,
              }}>
                {mod.icon}
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: EB.sage, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{mod.tag}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: EB.ink, marginBottom: 6 }}>{mod.title}</div>
              <div style={{ fontSize: 12, color: EB.inkMuted, lineHeight: 1.5, marginBottom: 16 }}>{mod.desc}</div>
              <div style={{ marginTop: 'auto', fontSize: 12.5, fontWeight: 700, color: EB.forest }}>{mod.action}</div>
            </div>
          ))}
        </div>

        {/* Footer Tip */}
        <div style={{ marginTop: 32, padding: '14px 18px', background: EB.celery, borderRadius: 8, border: EB.hairline, fontSize: 12, color: EB.inkMuted }}>
          <strong style={{ color: EB.ink }}>Tip:</strong> Press <kbd style={{ fontFamily: 'monospace', background: '#fff', border: EB.hairline, padding: '2px 6px', borderRadius: 4 }}>Ctrl+Shift+R</kbd> to reset the demo session.
        </div>
      </div>
    </main>
  );
}
