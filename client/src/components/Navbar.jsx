import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, ShieldAlert, Zap, LogOut, User, Sparkles } from 'lucide-react';

export default function Navbar({ onOpenPlanModal }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#0a0e17]/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-400 p-0.5 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
              <ShieldAlert className="h-5 w-5 text-cyan-400" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1">
              Breach<span className="text-cyan-400">Alert</span>
            </span>
            <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
              Security Monitoring
            </span>
          </div>
        </Link>

        {/* Right Section: Auth / Navigation */}
        <div className="flex items-center gap-3 sm:gap-4">
          {user ? (
            <>
              {/* Plan Badge */}
              <button
                onClick={onOpenPlanModal}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  user.plan === 'FAMILY'
                    ? 'bg-gradient-to-r from-cyan-950 to-blue-950 border-cyan-500/40 text-cyan-300 hover:border-cyan-400 shadow-md shadow-cyan-500/10'
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                <span>{user.plan === 'FAMILY' ? 'Family Plan' : 'Free Tier'}</span>
                <span className="hidden sm:inline-block text-[10px] text-slate-400">| Change</span>
              </button>

              {/* User Dropdown / Profile pill */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-medium text-slate-200">{user.name}</span>
                  <span className="text-[11px] text-slate-400 truncate max-w-[140px]">{user.email}</span>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-cyan-400 font-bold border border-slate-700">
                  {user.name ? user.name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
                </div>

                <button
                  onClick={handleLogout}
                  title="Log out"
                  className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm font-medium text-slate-300 hover:text-white px-3 py-2 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="flex items-center gap-1.5 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-slate-950 font-semibold text-sm px-4 py-2 rounded-lg shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02]"
              >
                <Zap className="h-4 w-4" />
                <span>Get Started</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
