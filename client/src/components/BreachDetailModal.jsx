import React from 'react';
import { X, ShieldAlert, Calendar, Database, CheckSquare, ExternalLink, Lock } from 'lucide-react';

export default function BreachDetailModal({ breach, onClose }) {
  if (!breach) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-3xl border border-slate-700 shadow-2xl relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-4 mb-6">
          {breach.logoPath ? (
            <img
              src={breach.logoPath}
              alt={breach.title}
              className="h-14 w-14 object-contain rounded-2xl bg-slate-900 p-2 border border-slate-800 shrink-0"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <div className="h-14 w-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 font-bold shrink-0">
              <ShieldAlert className="h-7 w-7" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-white">{breach.title || breach.breachName}</h2>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full border uppercase ${
                  breach.severity === 'CRITICAL'
                    ? 'bg-red-950 border-red-500/50 text-red-300'
                    : breach.severity === 'HIGH'
                    ? 'bg-amber-950 border-amber-500/50 text-amber-300'
                    : 'bg-yellow-950 border-yellow-500/50 text-yellow-300'
                }`}
              >
                {breach.severity} SEVERITY
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono text-slate-400 mt-1.5 flex-wrap">
              {breach.domain && (
                <span className="flex items-center gap-1 text-cyan-400">
                  <ExternalLink className="h-3.5 w-3.5" /> {breach.domain}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Breach Date:{' '}
                {breach.breachDate ? new Date(breach.breachDate).toLocaleDateString() : 'Unknown'}
              </span>
            </div>
          </div>
        </div>

        {/* Monitored Account Info */}
        <div className="mb-6 p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400">Exposed Monitored Email:</span>
          <span className="font-semibold text-cyan-300 font-mono">{breach.monitoredEmail}</span>
        </div>

        {/* Description */}
        <div className="mb-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Breach Incident Overview</h4>
          <div
            className="text-sm text-slate-300 leading-relaxed bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl"
            dangerouslySetInnerHTML={{ __html: breach.description }}
          />
        </div>

        {/* Leaked Data Types */}
        <div className="mb-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <Database className="h-4 w-4 text-cyan-400" /> Compromised Data Types
          </h4>
          <div className="flex flex-wrap gap-2">
            {(breach.dataClasses || []).map((item, idx) => (
              <span
                key={idx}
                className="text-xs font-mono bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 px-3 py-1 rounded-lg"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Actionable Security Checklist */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-red-950/30 via-slate-900 to-slate-900 border border-red-500/30">
          <h4 className="text-sm font-bold text-red-300 mb-3 flex items-center gap-2">
            <Lock className="h-4 w-4 text-red-400" /> Actionable Security Checklist & Mitigation Steps
          </h4>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <CheckSquare className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <span>
                <strong>Reset Password Immediately:</strong> If you still have an account at <em>{breach.title}</em>, change your password now.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckSquare className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <span>
                <strong>Check Reused Passwords:</strong> Change passwords on any other websites (banking, social media, work) where you reused this credentials combination.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckSquare className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                <strong>Enable Two-Factor Authentication (2FA):</strong> Enforce 2FA via an authenticator app (Google Authenticator, Authy, YubiKey).
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckSquare className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                <strong>Stay Alert for Phishing Emails:</strong> Attackers frequently leverage compromised personal data for customized phishing scams.
              </span>
            </li>
          </ul>
        </div>

      </div>
    </div>
  );
}
