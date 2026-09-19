import React from 'react';
import { Trophy, Medal } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card.jsx';
import { LEADERBOARD } from '../mockData.js';
import { useScout } from '../ScoutContext.jsx';

/**
 * Phase 1 — Student Leaderboard (mock UI only).
 * Phase 5: the student's own row reads shared totalPoints and ranks
 * are recomputed, so completions move the student live. No redesign.
 */
export default function Leaderboard() {
  const { totalPoints, sessionCompletions } = useScout();
  const rows = LEADERBOARD.map((s) =>
    s.you ? { ...s, points: totalPoints, visits: s.visits + sessionCompletions, casesAssisted: s.casesAssisted + sessionCompletions } : s
  )
    .sort((a, b) => b.points - a.points)
    .map((s, i) => ({ ...s, rank: i + 1 }));
  return (
    <div className="space-y-4 max-w-xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-gov-navy">Leaderboard</h1>
        <p className="text-sm text-gov-textSec mt-0.5">Nashik division • Spring 2026 • mock points</p>
      </div>

      <Card>
        <CardHeader icon={Trophy} title="Top Students" subtitle="Points for verified field visits" />
        <div className="space-y-2">
          {rows.map((s) => (
            <div
              key={s.name}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${
                s.you ? 'border-gov-blue bg-gov-blue/5' : 'border-gov-border bg-white'
              }`}
            >
              <span className="w-7 h-7 rounded-full bg-gov-bg border border-gov-border flex items-center justify-center text-xs font-bold text-gov-navy shrink-0">
                {s.rank <= 3 ? <Medal size={14} className="text-gov-blue" /> : s.rank}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gov-navy truncate">
                  {s.name} {s.you && <span className="text-[10px] bg-gov-blue text-white rounded px-1.5 py-0.5 ml-1">YOU</span>}
                </p>
                <p className="text-xs text-gov-textSec truncate">{s.college} • {s.visits} visits • {s.casesAssisted} cases</p>
              </div>
              <p className="text-sm font-bold text-gov-navy shrink-0">{s.points} pts</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-xs text-green-800">
        Earn 50 pts per completed visit, +30 pts on officer verification. Top 3 each month receive college credit bonus.
      </div>
    </div>
  );
}
