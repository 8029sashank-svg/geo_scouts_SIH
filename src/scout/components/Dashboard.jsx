import React from 'react';
import {
  MapPin, ArrowRight, Wifi, WifiOff, CheckCircle2, ChevronRight,
  BookOpen, ClipboardCheck, Bell, Navigation2, AlertTriangle,
  ClipboardList, Play, RotateCcw,
} from 'lucide-react';
import { useScout } from '../ScoutContext.jsx';
import { PriorityChip, MissionStatusChip, distanceBand } from './Chips.jsx';
import AgriImage from './AgriImage.jsx';
import { MISSION_STATUS } from '../mockData.js';
import { NEARBY_CASES } from '../mockData.js';
import { isWithinOperatingRadius } from '../config.js';

/**
 * Student Dashboard — "What do I need to do today?"
 *
 * Visual hierarchy:
 *  1. Active / high-priority mission card (dominant)
 *  2. My assignments summary
 *  3. Nearby cases
 *  4. Report / sync status
 *  5. Recent activity + quick actions
 *
 * Removed from this view (data / functions unchanged elsewhere):
 *  - Case Risk Distribution pie chart (recharts)
 *  - Student Progress / leaderboard section
 *  - Weather & Field Conditions panel (static mock)
 *  - AI Field Insights panel (static mock)
 *  - DashboardFieldMap (accessible via Farm Map route)
 *
 * Props contract unchanged: { onNavigate, onOpenMission }.
 */
export default function Dashboard({ onNavigate, onOpenMission }) {
  const { scout, missions, reports, isOnline, syncQueue, notifications } = useScout();

  // ── Derived state ─────────────────────────────────────────────
  const pending    = missions.filter((m) => m.status === MISSION_STATUS.PENDING).length;
  const accepted   = missions.filter((m) => m.status === MISSION_STATUS.ACCEPTED).length;
  const inProgress = missions.filter((m) => m.status === MISSION_STATUS.IN_PROGRESS).length;
  const completed  = missions.filter(
    (m) => m.status === MISSION_STATUS.COMPLETED || m.status === MISSION_STATUS.UNDER_REVIEW,
  ).length;

  // Active mission: prefer IN_PROGRESS, then highest-priority ACCEPTED/PENDING
  const activeMission =
    missions.find((m) => m.status === MISSION_STATUS.IN_PROGRESS) ||
    missions
      .filter((m) => m.status === MISSION_STATUS.ACCEPTED || m.status === MISSION_STATUS.PENDING)
      .sort((a, b) => {
        const rank = { HIGH: 0, MEDIUM: 1, LOW: 2 };
        return (rank[a.priority] ?? 3) - (rank[b.priority] ?? 3);
      })[0] ||
    null;

  const activeMissionCase = activeMission
    ? NEARBY_CASES.find((c) => c.id === activeMission.id)
    : null;

  // Nearby cases — up to 4, sorted by distance
  const nearbySorted = [...NEARBY_CASES].sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 4);

  // Recent activity feed
  const activity = [
    ...reports.slice(0, 2).map((r) => ({
      icon: CheckCircle2,
      color: 'text-green-700 bg-green-50',
      title: `${r.finding} reported`,
      sub: `${r.field} • ${r.submittedAt}`,
    })),
    ...notifications.slice(0, 3).map((n) => ({
      icon: Bell,
      color: 'text-[#0C3B2E] bg-[#0C3B2E]/10',
      title: n.title,
      sub: n.time,
    })),
  ].slice(0, 5);

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-5">

      {/* ── Welcome ── */}
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0C3B2E]">
            {greeting}, {scout.name.split(' ')[0]} 👋
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-[13px] text-gray-500">
            <span className="flex items-center gap-1">
              <MapPin size={13} /> {scout.registeredLocation || `${scout.district}, Maharashtra`}
            </span>
            <span className="text-gray-300">•</span>
            {isOnline ? (
              <span className="flex items-center gap-1 text-green-700 font-semibold">
                <Wifi size={13} /> Online
              </span>
            ) : (
              <span className="flex items-center gap-1 text-orange-600 font-semibold">
                <WifiOff size={13} /> Offline — {syncQueue.length} waiting
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── 1. ACTIVE / HIGH-PRIORITY MISSION (dominant) ── */}
      {activeMission ? (
        <ActiveMissionCard
          mission={activeMission}
          linkedCase={activeMissionCase}
          onOpenMission={onOpenMission}
          onNavigate={onNavigate}
        />
      ) : (
        <div className="bg-white border border-[#e4eae4] rounded-2xl p-5 text-center shadow-sm">
          <CheckCircle2 size={26} className="mx-auto text-green-600 mb-2" />
          <p className="text-sm font-bold text-gray-900">All caught up!</p>
          <p className="text-xs text-gray-500 mt-1">
            No active missions right now. Check Nearby Cases for new work.
          </p>
          <button
            onClick={() => onNavigate('nearby')}
            className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#0C3B2E] border border-[#0C3B2E]/30 rounded-full px-4 py-1.5 hover:bg-[#0C3B2E]/5"
          >
            Browse Cases <ArrowRight size={12} />
          </button>
        </div>
      )}

      {/* ── 2. MY ASSIGNMENTS SUMMARY ── */}
      <div className="bg-white border border-[#e4eae4] rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
            <ClipboardList size={13} className="text-[#0C3B2E]" /> My Assignments
          </h3>
          <LinkBtn label="View all" onClick={() => onNavigate('assignments')} />
        </div>
        <div className="grid grid-cols-4 gap-2">
          <StatTile value={pending}    label="Pending"     onClick={() => onNavigate('assignments')} />
          <StatTile value={accepted}   label="Accepted"    onClick={() => onNavigate('assignments')} />
          <StatTile value={inProgress} label="In Progress" onClick={() => onNavigate('assignments')} highlight />
          <StatTile value={completed}  label="Done"        onClick={() => onNavigate('assignments')} />
        </div>
      </div>

      {/* ── 3. NEARBY CASES ── */}
      <div className="bg-white border border-[#e4eae4] rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
            <MapPin size={13} className="text-[#0C3B2E]" /> Nearby Cases · {NEARBY_CASES.length}
          </h3>
          <LinkBtn label="View all" onClick={() => onNavigate('nearby')} />
        </div>
        <div className="space-y-2">
          {nearbySorted.map((c) => (
            <button
              key={c.id}
              onClick={() => onNavigate('nearby')}
              className="w-full flex items-center gap-2.5 text-left bg-[#f5f7f5] border border-[#e4eae4] rounded-xl p-2.5 hover:border-[#0C3B2E]/40 transition-colors"
            >
              <AgriImage
                src={c.image}
                alt={`${c.issue} — field photo`}
                label="No image"
                className="w-12 h-12 rounded-xl shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-gray-900 truncate">{c.issue}</p>
                <p className="text-[11px] text-gray-500 truncate">{c.farmer} • {c.village}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <PriorityChip level={c.priority} size="sm" />
                  <span className="text-[11px] text-gray-500">
                    {c.distanceKm} km · {distanceBand(c.distanceKm)}
                  </span>
                </div>
              </div>
              <ArrowRight size={14} className="text-gray-400 shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* ── 4. REPORT / SYNC STATUS ── */}
      <div className={`rounded-2xl border px-4 py-3 flex items-center gap-2 text-[13px] font-semibold ${
        syncQueue.length === 0
          ? 'bg-green-50 border-green-200 text-green-700'
          : 'bg-orange-50 border-orange-200 text-orange-700'
      }`}>
        <CheckCircle2 size={16} />
        {syncQueue.length === 0
          ? `All reports synced · ${reports.length} submitted`
          : `${syncQueue.length} item(s) waiting to sync`}
        {reports.length > 0 && (
          <button
            onClick={() => onNavigate('visits')}
            className="ml-auto text-[11px] font-bold underline"
          >
            View Reports
          </button>
        )}
      </div>

      {/* ── 5. RECENT ACTIVITY + QUICK ACTIONS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activity.length > 0 && (
          <div className="bg-white border border-[#e4eae4] rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <Bell size={13} className="text-[#0C3B2E]" /> Recent Activity
              </h3>
              <LinkBtn label="Reports" onClick={() => onNavigate('visits')} />
            </div>
            <div className="space-y-3">
              {activity.map((a, i) => (
                <div key={`${a.title}-${i}`} className="flex gap-2.5">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${a.color}`}>
                    <a.icon size={14} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">{a.title}</p>
                    <p className="text-[11px] text-gray-500 truncate">{a.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white border border-[#e4eae4] rounded-2xl p-4 shadow-sm">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-3">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 gap-2">
            <QuickAction label="View Nearby Cases"  icon={MapPin}         onClick={() => onNavigate('nearby')} />
            <QuickAction label="Start Field Visit"  icon={ClipboardCheck} onClick={() => onNavigate('assignments')} />
            <QuickAction label="Knowledge Library"  icon={BookOpen}       onClick={() => onNavigate('library')} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Active Mission Card ───────────────────────────────────────────────────────
function ActiveMissionCard({ mission, linkedCase, onOpenMission, onNavigate }) {
  const isInProgress = mission.status === MISSION_STATUS.IN_PROGRESS;
  const canVisit =
    mission.status === MISSION_STATUS.ACCEPTED || mission.status === MISSION_STATUS.IN_PROGRESS;
  const inRadius = isWithinOperatingRadius(mission.distanceKm);

  const [hasDraft, setHasDraft] = React.useState(false);
  React.useEffect(() => {
    setHasDraft(!!localStorage.getItem(`geofarm_draft_${mission.id}`));
  }, [mission.id]);

  const priorityBorder = {
    HIGH:   'border-red-300 bg-red-50/60',
    MEDIUM: 'border-amber-300 bg-amber-50/60',
    LOW:    'border-green-300 bg-green-50/60',
  }[mission.priority] || 'border-[#e4eae4] bg-white';

  const priorityBadge = {
    HIGH:   'bg-red-600 text-white',
    MEDIUM: 'bg-amber-500 text-white',
    LOW:    'bg-green-600 text-white',
  }[mission.priority] || 'bg-gray-400 text-white';

  return (
    <div className={`rounded-2xl border-2 shadow-md overflow-hidden ${priorityBorder}`}>
      {/* Header bar */}
      <div className="bg-[#0C3B2E] px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isInProgress ? (
            <span className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              IN PROGRESS
            </span>
          ) : hasDraft ? (
            <span className="flex items-center gap-1.5 text-xs font-bold text-blue-300">
              <ClipboardList size={12} />
              DRAFT SAVED
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-bold text-green-300">
              <AlertTriangle size={12} />
              ACTIVE MISSION
            </span>
          )}
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${priorityBadge}`}>
          {mission.priority} PRIORITY
        </span>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {linkedCase?.image && (
            <AgriImage
              src={linkedCase.image}
              alt={`${mission.title} — field photo`}
              label="No image"
              className="w-20 h-20 rounded-xl shrink-0"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold text-gray-500">Mission {mission.id}</p>
            <h2 className="text-base font-bold text-[#0C3B2E] mt-0.5 leading-snug">
              {mission.title}
            </h2>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[12px] text-gray-600">
              <span>
                <span className="font-semibold text-gray-800">Crop:</span> {mission.crop}
              </span>
              {linkedCase?.issue && (
                <span>
                  <span className="font-semibold text-gray-800">Issue:</span> {linkedCase.issue}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[12px] text-gray-600">
              <span className="flex items-center gap-1">
                <MapPin size={11} className="text-gray-400" /> {mission.location}
              </span>
              <span className="flex items-center gap-1">
                <Navigation2 size={11} className="text-gray-400" />
                {mission.distanceKm} km · {distanceBand(mission.distanceKm)}
              </span>
            </div>
          </div>
          <MissionStatusChip status={mission.status} size="sm" />
        </div>

        {/* CTA */}
        <div className="mt-4 flex gap-2">
          {canVisit && inRadius && (
            <button
              onClick={() => onOpenMission(mission.id)}
              className="flex-1 flex items-center justify-center gap-2 bg-[#0C3B2E] hover:bg-[#12503d] text-white text-sm font-bold py-3 rounded-xl transition-colors"
            >
              {isInProgress ? <RotateCcw size={15} /> : <Play size={15} />}
              {isInProgress ? 'Continue Field Visit' : 'Start Field Visit'}
            </button>
          )}
          {canVisit && !inRadius && (
            <div className="flex-1 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold py-3 rounded-xl text-center">
              Outside operating radius
            </div>
          )}
          <button
            onClick={() => onOpenMission(mission.id)}
            className="px-4 py-3 bg-white border border-[#e4eae4] text-[#0C3B2E] text-sm font-bold rounded-xl hover:border-[#0C3B2E]/50 transition-colors"
          >
            Details
          </button>
        </div>

        {!canVisit && (
          <button
            onClick={() => onNavigate('assignments')}
            className="mt-2 w-full text-xs font-bold text-[#0C3B2E] border border-[#0C3B2E]/20 rounded-xl py-2 hover:bg-[#0C3B2E]/5"
          >
            View All Assignments
          </button>
        )}
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function StatTile({ value, label, onClick, highlight }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl py-3 px-2 text-center border transition-colors hover:border-[#0C3B2E]/40 ${
        highlight
          ? 'bg-[#0C3B2E] border-[#0C3B2E] text-white'
          : 'bg-[#f5f7f5] border-[#e4eae4]'
      }`}
    >
      <p className={`text-xl font-bold ${highlight ? 'text-white' : 'text-gray-900'}`}>{value}</p>
      <p className={`text-[10px] font-semibold ${highlight ? 'text-green-200' : 'text-gray-500'}`}>
        {label}
      </p>
    </button>
  );
}

function QuickAction({ label, icon: Icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 bg-[#f5f7f5] border border-[#e4eae4] rounded-xl px-3 py-3 hover:border-[#0C3B2E]/40 hover:bg-[#0C3B2E]/5 transition-colors text-left"
    >
      <Icon size={18} className="text-[#0C3B2E] shrink-0" />
      <span className="text-[12px] font-bold text-gray-700">{label}</span>
    </button>
  );
}

function LinkBtn({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-[11px] font-bold text-[#0C3B2E] flex items-center gap-0.5 hover:underline"
    >
      {label} <ChevronRight size={13} />
    </button>
  );
}