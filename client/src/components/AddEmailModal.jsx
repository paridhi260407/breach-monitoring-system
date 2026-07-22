import React, { useState } from 'react';
import { X, Mail, ShieldAlert, Sparkles } from 'lucide-react';
import api from '../services/api';

export default function AddEmailModal({ isOpen, onClose, onSuccess, onOpenPlanModal }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [limitReached, setLimitReached] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLimitReached(false);
    setLoading(true);

    try {
      const response = await api.post('/emails', { email });
      if (response.data.success) {
        setEmail('');
        onSuccess();
        onClose();
      }
    } catch (err) {
      if (err.response?.data?.code === 'PLAN_LIMIT_REACHED') {
        setLimitReached(true);
      }
      setError(err.response?.data?.error || 'Failed to add monitored email address.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-slate-700 shadow-2xl relative">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
            <Mail className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Add Email to Monitor</h3>
            <p className="text-xs text-slate-400">We will dispatch a verification link before scanning.</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-xs flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
            {limitReached && (
              <button
                onClick={() => {
                  onClose();
                  onOpenPlanModal();
                }}
                className="mt-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-sky-600 to-cyan-500 text-slate-950 font-bold text-xs py-1.5 px-3 rounded-lg hover:brightness-110"
              >
                <Sparkles className="h-3.5 w-3.5" /> Upgrade to Family Plan (5 Emails)
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Target Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. alex@example.com"
              className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
            >
              {loading ? 'Adding...' : 'Send Verification Email'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
