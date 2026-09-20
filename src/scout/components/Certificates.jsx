import React from 'react';
import { Award, GraduationCap } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card.jsx';
import { CERTIFICATES } from '../mockData.js';
import { useScout } from '../ScoutContext.jsx';

/**
 * Phase 1 — Certificates / college credit (mock UI only).
 */
export default function Certificates() {
  const { scout } = useScout();

  return (
    <div className="space-y-4 max-w-xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-gov-navy">Certificates</h1>
        <p className="text-sm text-gov-textSec mt-0.5">College credit &amp; community-service tracking (mock)</p>
      </div>

      <Card>
        <CardHeader icon={GraduationCap} title="Credit Summary" subtitle={scout.college} />
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-gov-bg border border-gov-border rounded-lg p-3">
            <p className="text-xl font-bold text-gov-navy">{scout.credits || 12}</p>
            <p className="text-[11px] font-semibold text-gov-textSec">Credits</p>
          </div>
          <div className="bg-gov-bg border border-gov-border rounded-lg p-3">
            <p className="text-xl font-bold text-gov-navy">{scout.communityHours || 48}h</p>
            <p className="text-[11px] font-semibold text-gov-textSec">Service</p>
          </div>
          <div className="bg-gov-bg border border-gov-border rounded-lg p-3">
            <p className="text-xl font-bold text-gov-navy">#{scout.rank || 3}</p>
            <p className="text-[11px] font-semibold text-gov-textSec">Rank</p>
          </div>
        </div>
      </Card>

      {CERTIFICATES.map((c) => (
        <Card key={c.id}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-gov-blue/10 text-gov-blue flex items-center justify-center shrink-0">
              <Award size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-gov-navy">{c.title}</h3>
              <p className="text-xs text-gov-textSec">{c.student} • {c.issuer} • {c.date}</p>
              <p className="text-xs text-gov-text mt-1">{c.achievement}</p>
              <p className="text-[11px] text-gov-textSec mt-1">Certificate ID: <span className="font-bold">{c.id}</span> • {c.credits} credits</p>
              {c.status === 'In Progress' ? (
                <div className="mt-2">
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gov-blue rounded-full" style={{ width: `${c.progressPct || 50}%` }} />
                  </div>
                  <p className="text-[11px] text-gov-textSec mt-1">In progress — {c.progressPct || 50}%</p>
                </div>
              ) : (
                <span className="inline-block mt-2 text-[11px] font-bold text-green-700 bg-green-50 border border-green-200 rounded px-2 py-0.5">
                  Earned
                </span>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
