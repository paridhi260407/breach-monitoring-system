import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import StatCards from '../components/StatCards';
import MonitoredEmailList from '../components/MonitoredEmailList';
import BreachCard from '../components/BreachCard';
import BreachDetailModal from '../components/BreachDetailModal';
import AddEmailModal from '../components/AddEmailModal';
import PlanSelectorModal from '../components/PlanSelectorModal';
import EmailVerificationNotice from '../components/EmailVerificationNotice';
import { ShieldAlert, Search, Filter, RefreshCw, ShieldCheck } from 'lucide-react';
import api from '../services/api';

export default function DashboardPage() {
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [emails, setEmails] = useState([]);
  const [breaches, setBreaches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');

  // Modals state
  const [selectedBreach, setSelectedBreach] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, emailsRes, breachesRes] = await Promise.all([
        api.get('/breaches/stats'),
        api.get('/emails'),
        api.get(`/breaches/history?severity=${severityFilter !== 'ALL' ? severityFilter : ''}&search=${encodeURIComponent(search)}`),
      ]);

      if (statsRes.data.success) setStats(statsRes.data.stats);
      if (emailsRes.data.success) setEmails(emailsRes.data.emails);
      if (breachesRes.data.success) setBreaches(breachesRes.data.breaches);
    } catch (err) {
      console.error('[Dashboard Error]:', err?.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [severityFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDashboardData();
  };

  const unverifiedCount = emails.filter((e) => !e.isVerified).length;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Welcome Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            Security Control Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time identity monitoring & active data breach intelligence for{' '}
            <strong className="text-cyan-400 font-semibold">{user?.email}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-all shadow-sm cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* Verification Notice Banner */}
      <EmailVerificationNotice unverifiedCount={unverifiedCount} />

      {/* Stat Cards */}
      <StatCards stats={stats} onOpenAddModal={() => setIsAddModalOpen(true)} />

      {/* Monitored Emails Management */}
      <MonitoredEmailList
        emails={emails}
        onRefresh={fetchDashboardData}
        onOpenAddModal={() => setIsAddModalOpen(true)}
      />

      {/* Breach Intelligence History Section */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl">
        
        {/* Section Header & Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-400" />
              Exposed Data Breach Records
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Historical and recently discovered data dumps containing your credentials.
            </p>
          </div>

          {/* Search & Severity Filter controls */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="w-full sm:w-64 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search breach domain..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-400 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition-all"
              />
            </form>

            {/* Severity Filter Buttons */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 w-full sm:w-auto overflow-x-auto">
              {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all ${
                    severityFilter === sev
                      ? 'bg-cyan-950 border border-cyan-500/40 text-cyan-300 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Breach Grid */}
        {loading && breaches.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs font-mono flex items-center justify-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin text-cyan-400" /> Loading breach database...
          </div>
        ) : breaches.length === 0 ? (
          <div className="py-16 text-center">
            <div className="h-12 w-12 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white">No Compromised Records Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              None of your verified email addresses have been identified in public data breaches matching your filter criteria.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {breaches.map((breach) => (
              <BreachCard
                key={breach.id}
                breach={breach}
                onClick={(b) => setSelectedBreach(b)}
              />
            ))}
          </div>
        )}

      </div>

      {/* Modals */}
      <BreachDetailModal
        breach={selectedBreach}
        onClose={() => setSelectedBreach(null)}
      />

      <AddEmailModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchDashboardData}
        onOpenPlanModal={() => setIsPlanModalOpen(true)}
      />

      <PlanSelectorModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
      />

    </div>
  );
}
