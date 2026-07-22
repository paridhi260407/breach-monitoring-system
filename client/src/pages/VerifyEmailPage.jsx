import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, RefreshCw, ArrowRight } from 'lucide-react';
import api from '../services/api';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const emailParam = searchParams.get('email');

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');
  const [verifiedEmail, setVerifiedEmail] = useState(emailParam || '');
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    const doVerify = async () => {
      if (!token) {
        setLoading(false);
        setSuccess(false);
        setMessage('Missing verification token in URL.');
        return;
      }

      try {
        let url = `/emails/verify?token=${token}`;
        if (emailParam) {
          url += `&email=${encodeURIComponent(emailParam)}`;
        }
        const response = await api.get(url);
        if (response.data.success) {
          setSuccess(true);
          setMessage(response.data.message || 'Email verified successfully!');
          if (response.data.email) {
            setVerifiedEmail(response.data.email);
          }
        }
      } catch (err) {
        setSuccess(false);
        setMessage(err?.response?.data?.error || 'Verification failed. The link may have expired or is invalid.');
      } finally {
        setLoading(false);
      }
    };

    doVerify();
  }, [token, emailParam]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="glass-panel w-full max-w-md p-8 rounded-3xl border border-slate-800 text-center shadow-2xl">
        
        {loading ? (
          <div>
            <RefreshCw className="h-12 w-12 text-cyan-400 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white">Verifying Email Address...</h2>
            <p className="text-xs text-slate-400 mt-2">Communicating with BreachAlert Security Services.</p>
          </div>
        ) : success ? (
          <div>
            <div className="h-16 w-16 bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-black text-white">Verification Complete!</h2>
            <p className="text-xs text-emerald-300 mt-2 font-medium">{message}</p>
            {verifiedEmail && (
              <p className="text-xs text-slate-400 mt-1 mb-6">
                Automated threat monitoring is now active for <strong className="text-slate-200">{verifiedEmail}</strong>.
              </p>
            )}
            
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 mt-4 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 hover:from-sky-400 hover:to-cyan-300 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div>
            <div className="h-16 w-16 bg-red-950/80 border border-red-500/40 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-white">Verification Failed</h2>
            <p className="text-xs text-red-300 mt-2">{message}</p>

            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 mt-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
            >
              Go to Dashboard & Request New Link
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
