import React, { useState } from 'react';
import { X, Check, Sparkles, Shield, Mail, Zap, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function PlanSelectorModal({ isOpen, onClose }) {
  const { user, updatePlan } = useAuth();
  const [loading, setLoading] = useState(false);

  if (!isOpen || !user) return null;

  const handleSelectPlan = async (targetPlan) => {
    if (user.plan === targetPlan) return;
    setLoading(true);
    try {
      await updatePlan(targetPlan);
      onClose();
    } catch (err) {
      console.error('Plan upgrade error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-3xl p-6 sm:p-8 rounded-3xl border border-slate-700 shadow-2xl relative">
        
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="text-center max-w-md mx-auto mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-3">
            <Sparkles className="h-3.5 w-3.5" /> Select Subscription Plan
          </div>
          <h2 className="text-2xl font-black text-white">Protect All Your Accounts</h2>
          <p className="text-xs text-slate-400 mt-1">Choose the breach monitoring plan that fits your personal or family needs.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* FREE TIER CARD */}
          <div
            className={`p-6 rounded-2xl border flex flex-col justify-between transition-all ${
              user.plan === 'FREE'
                ? 'bg-slate-900/90 border-cyan-500/50 ring-2 ring-cyan-500/20'
                : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Basic Protection</span>
                <span className="text-xs font-mono font-bold text-slate-300 bg-slate-800 px-2.5 py-1 rounded-md">FREE</span>
              </div>
              <h3 className="text-xl font-extrabold text-white mb-2">Free Tier</h3>
              <p className="text-xs text-slate-400 mb-6">Essential monitoring for a single primary email address.</p>

              <ul className="space-y-3 text-xs text-slate-300 mb-6">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span><strong>1</strong> Monitored Email Address</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span>Manual HIBP Database Scans</span>
                </li>
                <li className="flex items-center gap-2 text-slate-500">
                  <X className="h-4 w-4 text-slate-600 shrink-0" />
                  <span className="line-through">Automated Nightly Scans</span>
                </li>
                <li className="flex items-center gap-2 text-slate-500">
                  <X className="h-4 w-4 text-slate-600 shrink-0" />
                  <span className="line-through">Instant Breach Email Alerts</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleSelectPlan('FREE')}
              disabled={loading || user.plan === 'FREE'}
              className={`w-full py-3 rounded-xl font-bold text-xs transition-all ${
                user.plan === 'FREE'
                  ? 'bg-slate-800 text-slate-400 cursor-default'
                  : 'bg-slate-800 hover:bg-slate-700 text-white'
              }`}
            >
              {user.plan === 'FREE' ? 'Current Active Plan' : 'Downgrade to Free'}
            </button>
          </div>

          {/* FAMILY TIER CARD */}
          <div
            className={`p-6 rounded-2xl border flex flex-col justify-between relative overflow-hidden transition-all ${
              user.plan === 'FAMILY'
                ? 'bg-gradient-to-b from-cyan-950/60 to-slate-900/90 border-cyan-400 ring-2 ring-cyan-400/40 shadow-xl shadow-cyan-500/10'
                : 'bg-slate-900/80 border-cyan-500/30 hover:border-cyan-400'
            }`}
          >
            <div className="absolute top-0 right-0 bg-gradient-to-l from-cyan-500 to-sky-600 text-slate-950 font-black text-[10px] uppercase px-3 py-1 rounded-bl-xl tracking-wider">
              RECOMMENDED
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Complete Coverage</span>
                <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-500/40 px-2.5 py-1 rounded-md">$9.99 / mo</span>
              </div>
              <h3 className="text-xl font-extrabold text-white mb-2 flex items-center gap-2">
                Family Plan <Sparkles className="h-4 w-4 text-cyan-400" />
              </h3>
              <p className="text-xs text-slate-300 mb-6">Continuous automated threat intelligence for up to 5 family email accounts.</p>

              <ul className="space-y-3 text-xs text-slate-200 mb-6">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span>Up to <strong>5</strong> Monitored Email Addresses</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span>Automated <strong>Nightly Cron Scans</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span>Instant <strong>Email Breach Warning Alerts</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span>Priority HIBP API Queue</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleSelectPlan('FAMILY')}
              disabled={loading || user.plan === 'FAMILY'}
              className={`w-full py-3 rounded-xl font-bold text-xs transition-all shadow-lg ${
                user.plan === 'FAMILY'
                  ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 cursor-default'
                  : 'bg-gradient-to-r from-sky-500 to-cyan-400 hover:from-sky-400 hover:to-cyan-300 text-slate-950 shadow-cyan-500/20'
              }`}
            >
              {user.plan === 'FAMILY' ? 'Current Active Plan' : loading ? 'Updating Plan...' : 'Upgrade to Family Plan'}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
