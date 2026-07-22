import React from 'react';
import { Mail, AlertTriangle, ShieldCheck, Clock, ArrowUpRight } from 'lucide-react';

export default function StatCards({ stats, onOpenAddModal }) {
  const {
    totalMonitored = 0,
    verifiedCount = 0,
    compromisedEmails = 0,
    totalBreaches = 0,
    criticalBreaches = 0,
    lastScanTime,
    userPlan = 'FREE',
  } = stats || {};

  const planLimit = userPlan === 'FAMILY' ? 5 : 1;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      
      {/* 1. Monitored Emails */}
      <div className="glass-card p-5 rounded-2xl relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Monitored Addresses
          </span>
          <div className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-500/20 text-cyan-400 group-hover:scale-110 transition-transform">
            <Mail className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white tracking-tight">{totalMonitored}</span>
          <span className="text-xs text-slate-400 font-mono">/ {planLimit} Limit ({verifiedCount} Verified)</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-slate-400">Tier: <strong className="text-cyan-400">{userPlan}</strong></span>
          <button
            onClick={onOpenAddModal}
            className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-0.5 hover:underline"
          >
            + Add <ArrowUpRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* 2. Total Breaches Found */}
      <div className="glass-card p-5 rounded-2xl relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Data Breaches Found
          </span>
          <div className="p-2 rounded-xl bg-amber-950/60 border border-amber-500/20 text-amber-400 group-hover:scale-110 transition-transform">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white tracking-tight">{totalBreaches}</span>
          <span className="text-xs text-slate-400">across {compromisedEmails} account(s)</span>
        </div>
        <div className="mt-2 text-xs text-slate-400">
          Status: {totalBreaches > 0 ? <span className="text-amber-400 font-semibold">Attentions Needed</span> : <span className="text-emerald-400 font-semibold">No Known Threats</span>}
        </div>
      </div>

      {/* 3. Critical Risk Count */}
      <div className="glass-card p-5 rounded-2xl relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Critical Severity Risks
          </span>
          <div className="p-2 rounded-xl bg-red-950/60 border border-red-500/20 text-red-400 group-hover:scale-110 transition-transform">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className={`text-3xl font-extrabold tracking-tight ${criticalBreaches > 0 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
            {criticalBreaches}
          </span>
          <span className="text-xs text-slate-400">Leaked Passwords/Financial</span>
        </div>
        <div className="mt-2 text-xs text-slate-400">
          {criticalBreaches > 0 ? <span className="text-red-400 font-medium">Password rotation recommended</span> : <span className="text-emerald-400">No passwords exposed</span>}
        </div>
      </div>

      {/* 4. Last Scan Time */}
      <div className="glass-card p-5 rounded-2xl relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            System Scan Status
          </span>
          <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
            <Clock className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 font-mono text-sm font-semibold text-slate-200 truncate">
          {lastScanTime ? new Date(lastScanTime).toLocaleString() : 'Never Scanned'}
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
          <span>{userPlan === 'FAMILY' ? 'Nightly Cron Scans Active' : 'Manual Scan Mode'}</span>
        </div>
      </div>

    </div>
  );
}
