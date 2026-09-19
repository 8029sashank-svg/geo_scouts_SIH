import React, { useState } from 'react';
import { Sprout, Mail, Lock, IdCard, Loader2, ShieldCheck, ArrowRight } from 'lucide-react';
import { SCOUT_PROFILE } from '../mockData.js';

export default function Login({ onLogin, onShowVerify }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    // Frontend demo only — authentication is simulated. Any credentials
    // resembling the demo scout account are accepted.
    setTimeout(() => {
      setLoading(false);
      onLogin();
    }, 700);
  };

  const fillDemo = () => {
    setEmail(SCOUT_PROFILE.email);
    setStudentId(SCOUT_PROFILE.studentId);
    setPassword('••••••••');
  };

  return (
    <div className="min-h-screen bg-gov-bg flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          {/* Brand mark */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gov-blue flex items-center justify-center shadow-md mb-4">
              <Sprout size={30} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gov-navy">Geo-Farm Field Operations</h1>
            <p className="text-sm text-gov-textSec mt-1">Verified Agriculture Field Scout Portal</p>
          </div>

          <div className="bg-white border border-gov-border rounded-xl shadow-card p-6">
            <h2 className="text-base font-bold text-gov-navy mb-4">Field Scout Login</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gov-textSec uppercase tracking-wide mb-1.5">
                  College / Institutional Email
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gov-textSec" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="aarav.patil@mpkv.ac.in"
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-gov-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gov-blue/30 focus:border-gov-blue"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gov-textSec uppercase tracking-wide mb-1.5">
                  Student ID
                </label>
                <div className="relative">
                  <IdCard size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gov-textSec" />
                  <input
                    type="text"
                    required
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="AG2024-248"
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-gov-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gov-blue/30 focus:border-gov-blue"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gov-textSec uppercase tracking-wide mb-1.5">
                  Password / OTP
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gov-textSec" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-gov-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gov-blue/30 focus:border-gov-blue"
                  />
                </div>
              </div>

              {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gov-blue hover:bg-gov-navy disabled:opacity-70 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Signing in…
                  </>
                ) : (
                  <>
                    Sign In <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <button
              onClick={fillDemo}
              type="button"
              className="w-full mt-3 text-xs text-gov-textSec hover:text-gov-blue underline underline-offset-2"
            >
              Fill demo credentials
            </button>

            <div className="mt-5 pt-5 border-t border-gray-100 text-center">
              <button
                onClick={onShowVerify}
                className="text-sm font-semibold text-gov-blue hover:text-gov-navy"
              >
                New Field Scout? Request Verification
              </button>
            </div>
          </div>

          <button
            onClick={onLogin}
            className="w-full mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-gov-textSec hover:text-gov-navy border border-dashed border-gov-border rounded-lg py-2.5 bg-white/50"
          >
            <ShieldCheck size={15} /> Continue as Demo Field Scout
          </button>

          <p className="text-center text-[11px] text-gov-textSec mt-6">
            Farmers do not need an account — alerts reach them via WhatsApp, SMS &amp; IVR.
          </p>
        </div>
      </div>
    </div>
  );
}
