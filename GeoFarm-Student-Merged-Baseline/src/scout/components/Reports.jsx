import React from 'react';
import { ChevronRight, Cloud, CloudUpload } from 'lucide-react';
import { useScout } from '../ScoutContext.jsx';
import { RiskChip, MissionStatusChip } from './Chips.jsx';

export default function Reports({ onOpenReport }) {
  const { reports } = useScout();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gov-navy">My Reports</h1>
        <p className="text-sm text-gov-textSec mt-0.5">Submitted field reports and their review status</p>
      </div>

      <div className="space-y-3">
        {reports.map((r) => (
          <button
            key={r.id}
            onClick={() => onOpenReport(r.id)}
            className="w-full text-left bg-white border border-gov-border rounded-xl p-4 shadow-card hover:border-gov-blue transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-gov-textSec">{r.id}</p>
                <h3 className="text-sm font-bold text-gov-navy mt-0.5">{r.finding}</h3>
                <p className="text-xs text-gov-textSec mt-0.5">{r.field} • {r.crop} • {r.submittedAt}</p>
              </div>
              <ChevronRight size={16} className="text-gov-textSec shrink-0 mt-1" />
            </div>
            <div className="flex items-center gap-2 mt-3">
              <RiskChip level={r.risk} size="sm" />
              <MissionStatusChip status={r.status} size="sm" />
              <span className="text-xs text-gov-textSec ml-auto flex items-center gap-3">
                {r.synced === false ? (
                  <span className="flex items-center gap-1 text-orange-600 font-semibold">
                    <CloudUpload size={12} /> Waiting to sync
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-green-700 font-semibold">
                    <Cloud size={12} /> Synced
                  </span>
                )}
                <span>Data quality {r.dataQuality}%</span>
              </span>
            </div>
          </button>
        ))}

        {reports.length === 0 && (
          <div className="text-center py-10 text-sm text-gov-textSec">No reports submitted yet.</div>
        )}
      </div>
    </div>
  );
}
