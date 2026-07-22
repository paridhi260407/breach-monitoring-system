import React from 'react';
import { Shield, Lock, Activity, Server } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-[#070a10] py-8 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-cyan-400" />
            <span className="font-semibold text-slate-300">BreachAlert</span>
            <span>&copy; {new Date().getFullYear()} Personal Data Breach Monitoring Service.</span>
          </div>

          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              HIBP Integration Active
            </span>
            <span className="flex items-center gap-1.5 text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2.5 py-1 rounded-full">
              <Server className="h-3 w-3" />
              Redis Cache Engine 24h
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-slate-500">
              <Lock className="h-3.5 w-3.5" /> 256-bit Encrypted
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
