import React from 'react';
import { AlertCircle, MailCheck } from 'lucide-react';

export default function EmailVerificationNotice({ unverifiedCount }) {
  if (unverifiedCount === 0) return null;

  return (
    <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-900 border border-amber-500/40 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-amber-950 border border-amber-500/40 text-amber-400 shrink-0">
          <AlertCircle className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-amber-300">
            Action Required: {unverifiedCount} Unverified Monitored Email(s)
          </h4>
          <p className="text-xs text-slate-300 mt-0.5">
            Automated breach scanning is paused until you click the verification link sent to your inbox.
          </p>
        </div>
      </div>
      <div className="hidden sm:flex items-center gap-1 text-xs text-amber-400 font-mono">
        <MailCheck className="h-4 w-4" /> Check Inbox
      </div>
    </div>
  );
}
