import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full bg-white border-t border-slate-100">
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span className="font-semibold text-slate-600">RetinaScan XAI</span>
          <span>·</span>
          <span>DR Inference v2.4.1</span>
          <span>·</span>
          <span className="font-mono">140ms edge latency</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px] text-[#0B5563]">verified_user</span>
            HIPAA · Offline-First
          </span>
          <span>SIH 2026 · MathWorks Track · Prototype only</span>
        </div>
      </div>
    </footer>
  );
}
