import React, { useState } from 'react';
import { Mail, CheckCircle2, AlertCircle, RefreshCw, Trash2, Send, ShieldAlert } from 'lucide-react';
import api from '../services/api';

export default function MonitoredEmailList({ emails, onRefresh, onOpenAddModal }) {
  const [scanningId, setScanningId] = useState(null);
  const [resendingId, setResendingId] = useState(null);
  const [message, setMessage] = useState(null);

  const handleScan = async (emailId) => {
    setScanningId(emailId);
    setMessage(null);
    try {
      const response = await api.post('/breaches/scan', { emailId });
      if (response.data.success) {
        setMessage({ type: 'success', text: response.data.message });
        onRefresh();
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err?.response?.data?.error || 'Failed to complete breach scan.',
      });
    } finally {
      setScanningId(null);
    }
  };

  const handleResendVerification = async (emailId) => {
    setResendingId(emailId);
    setMessage(null);
    try {
      const response = await api.post('/emails/resend-verification', { emailId });
      if (response.data.success) {
        setMessage({
          type: 'success',
          text: 'Verification link generated.',
          verifyUrl: response.data.verificationUrl,
          previewUrl: response.data.previewUrl,
        });
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err?.response?.data?.error || 'Failed to resend verification email.',
      });
    } finally {
      setResendingId(null);
    }
  };

  const handleDelete = async (emailId, emailStr) => {
    if (!window.confirm(`Are you sure you want to remove ${emailStr} from monitoring?`)) return;
    try {
      const response = await api.delete(`/emails/${emailId}`);
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Monitored email address deleted.' });
        onRefresh();
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err?.response?.data?.error || 'Failed to delete email address.',
      });
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Mail className="h-5 w-5 text-cyan-400" />
            Monitored Email Addresses
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Addresses configured for continuous HIBP database scanning & security alerts.
          </p>
        </div>
        <button
          onClick={onOpenAddModal}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-slate-950 font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02] cursor-pointer"
        >
          <span>+ Add Email Address</span>
        </button>
      </div>

      {message && (
        <div
          className={`mt-4 p-3 rounded-xl text-xs font-medium border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-red-950/40 border-red-500/40 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span>{message.text}</span>
            {message.verifyUrl && (
              <a
                href={message.verifyUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-emerald-500 text-slate-950 font-bold px-2.5 py-1 rounded-md hover:bg-emerald-400 text-[11px] underline"
              >
                ⚡ Click Here to Verify Now (Dev Link)
              </a>
            )}
            {message.previewUrl && (
              <a
                href={message.previewUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold px-2.5 py-1 rounded-md hover:bg-cyan-900 text-[11px]"
              >
                📩 View Ethereal Email Inbox
              </a>
            )}
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-white self-end sm:self-center">
            ✕
          </button>
        </div>
      )}

      {emails.length === 0 ? (
        <div className="py-10 text-center">
          <ShieldAlert className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-300">No email addresses currently monitored.</p>
          <p className="text-xs text-slate-500 mt-1 mb-4">Add your primary email address to check for leaked credentials.</p>
          <button
            onClick={onOpenAddModal}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 px-4 py-2 rounded-lg bg-cyan-950/30 hover:bg-cyan-950/60"
          >
            Add Your First Email
          </button>
        </div>
      ) : (
        <div className="mt-4 divide-y divide-slate-800/60">
          {emails.map((item) => (
            <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              
              {/* Email details */}
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center text-slate-300 font-mono text-xs">
                  {item.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-200">{item.email}</span>
                    {item.isVerified ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="h-3 w-3" /> Verified
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-full">
                        <AlertCircle className="h-3 w-3" /> Pending Verification
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    <span>
                      Breaches: <strong className="text-slate-200">{item._count?.breaches || 0}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Last Scan:{' '}
                      {item.lastScannedAt ? new Date(item.lastScannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {!item.isVerified && (
                  <button
                    onClick={() => handleResendVerification(item.id)}
                    disabled={resendingId === item.id}
                    className="flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300 bg-amber-950/30 hover:bg-amber-950/60 border border-amber-500/30 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>{resendingId === item.id ? 'Sending...' : 'Resend Email'}</span>
                  </button>
                )}

                <button
                  onClick={() => handleScan(item.id)}
                  disabled={!item.isVerified || scanningId === item.id}
                  title={!item.isVerified ? 'Verify email to scan' : 'Trigger manual HIBP breach scan'}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-lg border transition-all ${
                    !item.isVerified
                      ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                      : 'bg-cyan-950/60 hover:bg-cyan-900/60 border-cyan-500/40 text-cyan-300 hover:text-white shadow-sm'
                  }`}
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${scanningId === item.id ? 'animate-spin text-cyan-400' : ''}`} />
                  <span>{scanningId === item.id ? 'Scanning HIBP...' : 'Scan Now'}</span>
                </button>

                <button
                  onClick={() => handleDelete(item.id, item.email)}
                  title="Remove from monitoring"
                  className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
