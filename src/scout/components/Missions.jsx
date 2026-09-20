import React, { useState } from 'react';
import { MapPin, Navigation2, ClipboardList, CheckCircle2 } from 'lucide-react';
import { useScout } from '../ScoutContext.jsx';
import { MISSION_STATUS, NEARBY_CASES, STUDENT_PROGRESS } from '../mockData.js';
import { isWithinOperatingRadius } from '../config.js';
import { PriorityChip, MissionStatusChip } from './Chips.jsx';
import AgriImage from './AgriImage.jsx';

const FILTERS = ['All', 'Pending', 'Accepted', 'In Progress', 'Completed'];

// Done bucket mirrors the 'Completed' filter below: submitted assignments
// can never restart a field visit — they link to their report instead.
const DONE_STATUSES = [MISSION_STATUS.COMPLETED, MISSION_STATUS.UNDER_REVIEW, MISSION_STATUS.VERIFIED];

/**
 * My Assignments — premium layout (presentation only).
 * Filter/status/report-link logic unchanged; counts derive from the
 * same shared missions array. Case images resolved via NEARBY_CASES.
 */
export default function Missions({ onOpenMission, onStartVisit, onOpenReport }) {
  const { missions, reports } = useScout();
  const [filter, setFilter] = useState('All');

  const assignedCount = missions.filter((m) => m.status === MISSION_STATUS.ACCEPTED).length;
  const activeCount = missions.filter(
    (m) => m.status === MISSION_STATUS.IN_PROGRESS || m.status === MISSION_STATUS.EN_ROUTE
  ).length;
  const completedCount = missions.filter((m) => DONE_STATUSES.includes(m.status)).length;
  const weeklyGoal = STUDENT_PROGRESS.visitsGoal;

  const filtered = missions.filter((m) => {
    if (filter === 'All') return true;
    if (filter === 'Completed') return DONE_STATUSES.includes(m.status);
    return m.status === filter;
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#0C3B2E]">My Assignments</h1>
        <p className="text-[13px] text-gray-500 mt-0.5">Field visits assigned to you</p>
      </div>

      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        <div className="bg-white border border-[#e4eae4] rounded-2xl py-3 px-2 text-center shadow-[0_1px_3px_rgba(12,59,46,0.06)]">
          <p className="text-xl font-bold text-gray-900">{assignedCount}</p>
          <p className="text-[10px] font-semibold text-gray-500">Assigned</p>
        </div>
        <div className="bg-white border border-[#e4eae4] rounded-2xl py-3 px-2 text-center shadow-[0_1px_3px_rgba(12,59,46,0.06)]">
          <p className="text-xl font-bold text-gray-900">{activeCount}</p>
          <p className="text-[10px] font-semibold text-gray-500">In Progress</p>
        </div>
        <div className="bg-white border border-[#e4eae4] rounded-2xl py-3 px-2 text-center shadow-[0_1px_3px_rgba(12,59,46,0.06)]">
          <p className="text-xl font-bold text-gray-900">{completedCount}</p>
          <p className="text-[10px] font-semibold text-gray-500">Completed</p>
        </div>
        <div className="bg-white border border-[#e4eae4] rounded-2xl py-3 px-2 text-center shadow-[0_1px_3px_rgba(12,59,46,0.06)]">
          <p className="text-xl font-bold text-gray-900">{completedCount}/{weeklyGoal}</p>
          <p className="text-[10px] font-semibold text-gray-500">This Week</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors ${
              filter === f ? 'bg-[#0C3B2E] text-white border-[#0C3B2E]' : 'bg-white text-gray-500 border-[#e4eae4]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((m) => {
          const done = DONE_STATUSES.includes(m.status);
          const report = done ? reports.find((r) => r.missionId === m.id) : null;
          const linkedCase = NEARBY_CASES.find((c) => c.id === m.id);
          const imgSrc = linkedCase?.image || null;
          return (
          <div
            key={m.id}
            className="w-full bg-white border border-[#e4eae4] rounded-2xl p-4 shadow-[0_1px_3px_rgba(12,59,46,0.06)]"
          >
            <button
              onClick={() => onOpenMission(m.id)}
              className="w-full text-left"
            >
              <div className="flex items-center gap-3">
                <AgriImage
                  src={imgSrc}
                  alt={`${m.title} — field photo`}
                  label="No image"
                  className="w-20 h-20 rounded-xl shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-gray-400">Mission #{m.id}</p>
                  <h3 className="text-sm font-bold text-gray-900 mt-0.5 truncate">{m.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{m.crop}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {linkedCase ? `${linkedCase.farmer} · ${m.location}` : m.location}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <PriorityChip level={m.priority} size="sm" />
                  <MissionStatusChip status={m.status} size="sm" />
                </div>
              </div>

              <div className="flex items-center gap-1 text-xs font-semibold text-gray-500 mt-2.5">
                <Navigation2 size={12} /> {m.distanceKm} km away
                {!isWithinOperatingRadius(m.distanceKm) && (
                  <span className="text-red-600 font-bold">• Outside operating radius</span>
                )}
              </div>
            </button>
            {done && onOpenReport && (
              <button
                onClick={() => (report ? onOpenReport(report.id) : onOpenMission(m.id))}
                className="mt-3 w-full bg-white border border-[#0C3B2E]/30 text-[#0C3B2E] hover:bg-[#0C3B2E]/5 text-sm font-bold py-2.5 rounded-xl transition-colors"
              >
                View Report
              </button>
            )}
            {!done && onStartVisit && m.status === MISSION_STATUS.ACCEPTED && (
              isWithinOperatingRadius(m.distanceKm) ? (
                <button
                  onClick={() => onStartVisit(m.id)}
                  className="mt-3 w-full bg-[#0C3B2E] hover:bg-[#12503d] text-white text-sm font-bold py-2.5 rounded-xl transition-colors"
                >
                  Start Field Visit
                </button>
              ) : (
                <div className="mt-3 w-full bg-red-50 border border-red-200 text-red-700 text-xs font-semibold py-2.5 rounded-xl text-center">
                  This field is outside your assigned operating radius.
                </div>
              )
            )}
            {!done && onStartVisit && m.status === MISSION_STATUS.IN_PROGRESS && (
              <button
                onClick={() => onStartVisit(m.id)}
                className="mt-3 w-full bg-[#0C3B2E] hover:bg-[#12503d] text-white text-sm font-bold py-2.5 rounded-xl transition-colors"
              >
                Continue Field Visit
              </button>
            )}
          </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="bg-white border border-[#e4eae4] rounded-2xl py-12 px-6 text-center">
            <ClipboardList size={28} className="mx-auto text-gray-300" />
            <p className="text-sm font-bold text-gray-800 mt-3">No assignments in this filter</p>
            <p className="text-xs text-gray-500 mt-1">Try another filter or check back later.</p>
          </div>
        )}
      </div>
    </div>
  );
}