import React, { useState } from 'react';
import { Users, CalendarDays, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card.jsx';
import { CLUSTER_VISITS } from '../mockData.js';
import { useScout } from '../ScoutContext.jsx';

/**
 * Master phase — Cluster / group farm visits (mock only).
 * Join state is local mock state; joining also drops a notification
 * into the existing notification feed. No calendar/backend integration.
 */
export default function ClusterVisits({ onNavigate }) {
  const { addNotification } = useScout();
  const [joinedIds, setJoinedIds] = useState({});

  const toggleJoin = (visit) => {
    const joined = !!joinedIds[visit.id];
    setJoinedIds((prev) => {
      const next = { ...prev };
      if (joined) delete next[visit.id];
      else next[visit.id] = true;
      return next;
    });
    if (!joined) {
      addNotification({
        level: 'info',
        title: 'Cluster visit joined',
        body: `You joined ${visit.name} on ${visit.date}.`,
      });
    }
  };

  return (
    <div className="space-y-4 max-w-xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-gov-navy">Cluster Visits</h1>
        <p className="text-sm text-gov-textSec mt-0.5">Upcoming group farm visits • mock schedule</p>
      </div>

      {CLUSTER_VISITS.map((v) => {
        const joined = !!joinedIds[v.id];
        const count = v.participants + (joined ? 1 : 0);
        const full = count >= v.maxParticipants;
        return (
          <Card key={v.id}>
            <CardHeader icon={Users} title={v.name} subtitle={`${v.village} • Demo location`} />
            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
              <div className="bg-gov-bg border border-gov-border rounded-lg p-2.5">
                <p className="text-[11px] font-bold text-gov-textSec uppercase tracking-wide flex items-center gap-1">
                  <CalendarDays size={12} /> Date
                </p>
                <p className="font-bold text-gov-navy mt-0.5">{v.date} • {v.time}</p>
              </div>
              <div className="bg-gov-bg border border-gov-border rounded-lg p-2.5">
                <p className="text-[11px] font-bold text-gov-textSec uppercase tracking-wide">Organizer</p>
                <p className="font-bold text-gov-navy mt-0.5">{v.organizer}</p>
              </div>
            </div>
            <p className="text-xs text-gov-textSec">Focus: <span className="font-semibold text-gov-navy">{v.focus}</span></p>
            <p className="text-xs text-gov-textSec mt-1">Farmers: <span className="font-semibold text-gov-navy">{v.farmers.join(', ')}</span></p>
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs font-bold text-gov-textSec mb-1">
                <span>Participants</span>
                <span>{count} / {v.maxParticipants}</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gov-blue rounded-full" style={{ width: `${Math.round((count / v.maxParticipants) * 100)}%` }} />
              </div>
            </div>
            {joined && (
              <p className="mt-3 text-xs font-bold text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex items-center gap-1.5">
                <CheckCircle2 size={13} /> You joined this visit
              </p>
            )}
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button
                onClick={() => toggleJoin(v)}
                disabled={!joined && full}
                className={`font-bold py-2.5 rounded-lg text-sm transition-colors ${
                  joined
                    ? 'bg-white border border-gov-border text-gov-textSec'
                    : 'bg-gov-blue hover:bg-gov-navy text-white disabled:opacity-40'
                }`}
              >
                {joined ? 'Leave Visit' : full ? 'Visit Full' : 'Join Visit'}
              </button>
              <button
                onClick={() => onNavigate('nearby')}
                className="font-bold py-2.5 rounded-lg text-sm bg-white border border-gov-blue text-gov-blue hover:bg-gov-blue/5 flex items-center justify-center gap-1"
              >
                View Farmers <ArrowRight size={14} />
              </button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
