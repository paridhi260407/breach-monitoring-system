import React from 'react';
import { Calendar, Database, ShieldAlert, Globe, ChevronRight } from 'lucide-react';

export default function BreachCard({ breach, onClick }) {
  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-950/80 border-red-500/50 text-red-300 shadow-sm shadow-red-500/20';
      case 'HIGH':
        return 'bg-amber-950/80 border-amber-500/50 text-amber-300';
      case 'MEDIUM':
        return 'bg-yellow-950/80 border-yellow-500/50 text-yellow-300';
      default:
        return 'bg-slate-900 border-slate-700 text-slate-300';
    }
  };

  return (
    <div
      onClick={() => onClick(breach)}
      className="glass-card p-5 rounded-2xl cursor-pointer flex flex-col justify-between group hover:-translate-y-1 transition-all duration-200"
    >
      <div>
        {/* Header: Logo / Title / Severity */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            {breach.logoPath ? (
              <img
                src={breach.logoPath}
                alt={breach.title}
                className="h-10 w-10 object-contain rounded-lg bg-slate-900 p-1 border border-slate-800 shrink-0"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 font-bold shrink-0">
                <ShieldAlert className="h-5 w-5" />
              </div>
            )}

            <div>
              <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-1">
                {breach.title || breach.breachName}
              </h3>
              {breach.domain && (
                <span className="flex items-center gap-1 text-xs text-slate-400 font-mono">
                  <Globe className="h-3 w-3" /> {breach.domain}
                </span>
              )}
            </div>
          </div>

          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md border uppercase tracking-wider ${getSeverityBadge(breach.severity)}`}>
            {breach.severity}
          </span>
        </div>

        {/* Description snippet */}
        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-4">
          {breach.description.replace(/<[^>]*>?/gm, '')}
        </p>
      </div>

      <div>
        {/* Leaked Data Badges */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {(breach.dataClasses || []).slice(0, 3).map((dataclass, idx) => (
            <span
              key={idx}
              className="text-[11px] font-mono bg-slate-900 border border-slate-800 text-cyan-300 px-2 py-0.5 rounded-md"
            >
              {dataclass}
            </span>
          ))}
          {(breach.dataClasses || []).length > 3 && (
            <span className="text-[11px] font-mono bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-md">
              +{(breach.dataClasses || []).length - 3} more
            </span>
          )}
        </div>

        {/* Footer info: Breach Date & Details Link */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs text-slate-400">
          <span className="flex items-center gap-1 font-mono text-[11px]">
            <Calendar className="h-3.5 w-3.5 text-slate-500" />
            {breach.breachDate ? new Date(breach.breachDate).toLocaleDateString() : 'Unknown Date'}
          </span>
          <span className="flex items-center gap-0.5 text-cyan-400 group-hover:translate-x-0.5 transition-transform font-semibold text-[11px]">
            View Details <ChevronRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </div>
  );
}
