import React from 'react';
import { ArrowLeft, UserPlus, IdCard, ShieldCheck, BadgeCheck } from 'lucide-react';

const STEPS = [
  { icon: UserPlus, title: 'Register with institutional details', desc: 'Sign up using your college email and department information.' },
  { icon: IdCard, title: 'Submit your Student ID', desc: 'Provide your official agriculture-college student ID for cross-check.' },
  { icon: ShieldCheck, title: 'Agriculture department verifies your account', desc: 'The regional Agriculture Officer reviews and confirms your enrolment.' },
  { icon: BadgeCheck, title: 'Account becomes a Verified Field Scout', desc: 'You can now receive and accept field missions in your assigned district.' },
];

export default function VerifyInfo({ onBack }) {
  return (
    <div className="min-h-screen bg-gov-bg flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-md">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-gov-textSec hover:text-gov-navy mb-6">
          <ArrowLeft size={16} /> Back to login
        </button>

        <h1 className="text-xl font-bold text-gov-navy mb-1">Become a Verified Field Scout</h1>
        <p className="text-sm text-gov-textSec mb-6">
          Field missions are only assigned to verified agriculture students. Here&rsquo;s how verification works.
        </p>

        <div className="space-y-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="bg-white border border-gov-border rounded-xl p-4 flex gap-3 shadow-card">
              <div className="w-9 h-9 rounded-full bg-gov-bg border border-gov-border flex items-center justify-center shrink-0 text-xs font-bold text-gov-blue">
                {i + 1}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <s.icon size={15} className="text-gov-blue shrink-0" />
                  <h3 className="text-sm font-bold text-gov-navy">{s.title}</h3>
                </div>
                <p className="text-xs text-gov-textSec">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 bg-gov-bg border border-gov-border rounded-xl p-4 text-xs text-gov-textSec">
          This is a frontend demo — verification requests are not submitted to a live backend yet.
          For this walkthrough, use <span className="font-semibold text-gov-navy">Continue as Demo Field Scout</span> on the login screen.
        </div>

        <button
          onClick={onBack}
          className="w-full mt-6 bg-gov-blue hover:bg-gov-navy text-white font-bold py-3 rounded-lg transition-colors"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}
