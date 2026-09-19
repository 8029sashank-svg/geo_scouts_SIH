import React from 'react';
import {
  MapPin, ArrowRight, Wifi, WifiOff, CheckCircle2, ChevronRight, Star,
  BookOpen, MessageCircle, ClipboardCheck, Bell, Sun, Droplets, CloudRain,
  Wind, Sparkles,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useScout } from '../ScoutContext.jsx';
import { PriorityChip, distanceBand } from './Chips.jsx';
import AgriImage from './AgriImage.jsx';
import { MISSION_STATUS } from '../mockData.js';
import { NEARBY_CASES, STUDENT_PROGRESS, LEADERBOARD, CERTIFICATES } from '../mockData.js';
import DashboardFieldMap from './DashboardFieldMap.jsx';

/**
 * Premium Agricultural Operations dashboard (presentation only).
 * All data comes from existing shared state/mockData — no new sources.
 * Props contract unchanged: { onNavigate, onOpenMission }.
 */
export default function Dashboard({ onNavigate, onOpenMission }) {
  const { scout, missions, reports, isOnline, syncQueue, totalPoints, notifications } = useScout();

  const pending = missions.filter((m) => m.status === MISSION_STATUS.PENDING).length;
  const inProgress = missions.filter((m) => m.status === MISSION_STATUS.IN_PROGRESS).length;
  const completedToday = missions.filter(
    (m) => m.status === MISSION_STATUS.COMPLETED || m.status === MISSION_STATUS.UNDER_REVIEW
  ).length;
  const weeklyGoal = STUDENT_PROGRESS.visitsGoal;

  const missionIds = new Set(missions.map((m) => m.id));
  const openCase = (caseItem) => {
    if (missionIds.has(caseItem.id)) onOpenMission(caseItem.id);
    else onNavigate('nearby');
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const highCases = NEARBY_CASES.filter((c) => (c.risk || c.priority) === 'HIGH');
  const topCase = highCases[0] || NEARBY_CASES[0];
  const insights = [
    `${highCases.length} high-risk case${highCases.length === 1 ? '' : 's'} in your region`,
    `${topCase.issue} conditions elevated near ${topCase.village.split(',')[0]}`,
    'Recommended: inspect your assigned field today',
  ];

  const riskData = [
    { name: 'High', value: NEARBY_CASES.filter((c) => (c.risk || c.priority) === 'HIGH').length, color: '#e65100' },
    { name: 'Medium', value: NEARBY_CASES.filter((c) => (c.risk || c.priority) === 'MEDIUM').length, color: '#f9a825' },
    { name: 'Low', value: NEARBY_CASES.filter((c) => (c.risk || c.priority) === 'LOW').length, color: '#2e7d32' },
  ].filter((d) => d.value > 0);

  const myRank = LEADERBOARD.find((l) => l.you);
  const earnedCerts = CERTIFICATES.filter((c) => c.status === 'Earned').length;

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

  const quickActions = [
    { label: 'View Nearby Cases', icon: MapPin, target: 'nearby' },
    { label: 'Start Field Visit', icon: ClipboardCheck, target: 'assignments' },
    { label: 'Open Knowledge', icon: BookOpen, target: 'library' },
    { label: 'Chat with Farmer', icon: MessageCircle, target: 'chat' },
  ];

  return (
    <div className="space-y-4">
      {/* Welcome */}
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0C3B2E]">{greeting}, {scout.name.split(' ')[0]} 👋</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-[13px] text-gray-500">
            <span className="flex items-center gap-1"><MapPin size={13} /> {scout.registeredLocation || `${scout.district}, Maharashtra`}</span>
            <span className="text-gray-300">•</span>
            {isOnline ? (
              <span className="flex items-center gap-1 text-green-700 font-semibold"><Wifi size={13} /> Online</span>
            ) : (
              <span className="flex items-center gap-1 text-orange-600 font-semibold">
                <WifiOff size={13} /> Offline — {syncQueue.length} waiting
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-bold text-[#0C3B2E] bg-white border border-[#e4eae4] rounded-full px-3 py-1.5">
            <Star size={13} className="text-amber-500" /> {totalPoints} pts
          </span>
          {myRank && (
            <span className="text-xs font-bold text-white bg-[#0C3B2E] rounded-full px-3 py-1.5">Rank #{myRank.rank}</span>
          )}
        </div>
      </div>

      {/* ROW 1: cases | map hero | weather + AI */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <Panel className="xl:col-span-3 p-4">
          <PanelHead
            title={`Active Cases · ${NEARBY_CASES.length}`}
            action={<LinkBtn label="View all" onClick={() => onNavigate('nearby')} />}
          />
          <div className="space-y-2">
            {NEARBY_CASES.map((c) => (
              <button
                key={c.id}
                onClick={() => openCase(c)}
                className="w-full flex items-center gap-2.5 text-left bg-[#f5f7f5] border border-[#e4eae4] rounded-xl p-2.5 hover:border-[#0C3B2E]/40 transition-colors"
              >
                <AgriImage
                  src={c.image}
                  alt={`${c.issue} — field photo`}
                  label="No image"
                  className="w-14 h-14 rounded-xl shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-gray-900 truncate">{c.issue}</p>
                  <p className="text-[11px] text-gray-500 truncate">{c.farmer} • {c.village}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <PriorityChip level={c.priority} size="sm" />
                    <span className="text-[11px] text-gray-500">{c.distanceKm} km · {distanceBand(c.distanceKm)}</span>
                  </div>
                </div>
                <ArrowRight size={14} className="text-gray-400 shrink-0" />
              </button>
            ))}
          </div>
        </Panel>

        <Panel className="xl:col-span-6 overflow-hidden">
          <div className="px-4 pt-4 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#0C3B2E]">Field Overview Map</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Nearby cases, field visits & your location <span className="ml-1 text-[10px] bg-amber-50 border border-amber-200 text-amber-700 rounded-full px-1.5 py-0.5">Demo locations</span></p>
            </div>
            <LinkBtn label="Open map" onClick={() => onNavigate('map')} />
          </div>
          <div className="px-4 pb-4">
            <DashboardFieldMap
              missions={missions}
              onOpenCase={(c) => openCase(c)}
              onOpenAssignment={() => onNavigate('assignments')}
              onOpenFullMap={() => onNavigate('map')}
            />
          </div>
        </Panel>

        <div className="xl:col-span-3 space-y-4">
          <Panel className="p-4">
            <PanelHead title="Weather & Field Conditions" />
            <div className="flex items-center gap-2">
              <Sun size={26} className="text-amber-500 shrink-0" />
              <div>
                <p className="text-2xl font-bold text-gray-900 leading-none">28°C</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Sunny · mock data</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3 text-center">
              <MiniStat icon={Droplets} label="Humidity" value="52%" />
              <MiniStat icon={CloudRain} label="Rain" value="0 mm" />
              <MiniStat icon={Wind} label="Wind" value="8 km/h" />
            </div>
          </Panel>

          <Panel className="p-4">
            <PanelHead title="AI Field Insights" icon={Sparkles} />
            <ul className="space-y-2">
              {insights.map((line) => (
                <li key={line} className="flex gap-2 text-xs text-gray-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0C3B2E] shrink-0 mt-1" /> {line}
                </li>
              ))}
            </ul>
            <p className="text-[10px] text-gray-400 mt-2">Derived from current case data · demo analysis</p>
            <button
              onClick={() => onNavigate('nearby')}
              className="mt-3 w-full text-xs font-bold text-[#0C3B2E] border border-[#0C3B2E]/30 rounded-xl py-2 hover:bg-[#0C3B2E]/5"
            >
              View Details
            </button>
          </Panel>
        </div>
      </div>

      {/* ROW 2: distribution | progress | activity | quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4">
        <Panel className="xl:col-span-3 p-4">
          <PanelHead title="Case Risk Distribution" />
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={riskData} dataKey="value" nameKey="name" innerRadius={42} outerRadius={62} paddingAngle={3} strokeWidth={0}>
                  {riskData.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-4 mt-1 text-[11px] text-gray-500">
            {riskData.map((d) => (
              <span key={d.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                {d.name} · <b className="text-gray-800">{d.value}</b>
              </span>
            ))}
          </div>
        </Panel>

        <Panel className="xl:col-span-3 p-4">
          <PanelHead title="Student Progress" action={<LinkBtn label="Leaderboard" onClick={() => onNavigate('leaderboard')} />} />
          <div className="grid grid-cols-2 gap-2">
            <Metric label="Completed" value={completedToday} />
            <Metric label="Reports" value={reports.length} />
            <Metric label="Points" value={totalPoints} />
            <Metric label="Rank" value={myRank ? `#${myRank.rank}` : '—'} />
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 mb-1">
              <span>Weekly goal</span>
              <span>{completedToday}/{weeklyGoal}</span>
            </div>
            <div className="h-2 bg-[#eef3ee] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0C3B2E] rounded-full"
                style={{ width: `${Math.min(100, Math.round((completedToday / weeklyGoal) * 100))}%` }}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3 text-center">
            <button onClick={() => onNavigate('assignments')} className="bg-[#f5f7f5] border border-[#e4eae4] rounded-xl py-2 hover:border-[#0C3B2E]/40">
              <p className="text-base font-bold text-gray-900">{pending}</p>
              <p className="text-[10px] font-semibold text-gray-500">Pending</p>
            </button>
            <button onClick={() => onNavigate('assignments')} className="bg-[#f5f7f5] border border-[#e4eae4] rounded-xl py-2 hover:border-[#0C3B2E]/40">
              <p className="text-base font-bold text-gray-900">{inProgress}</p>
              <p className="text-[10px] font-semibold text-gray-500">Active</p>
            </button>
            <button onClick={() => onNavigate('certificates')} className="bg-[#f5f7f5] border border-[#e4eae4] rounded-xl py-2 hover:border-[#0C3B2E]/40">
              <p className="text-base font-bold text-gray-900">{earnedCerts}</p>
              <p className="text-[10px] font-semibold text-gray-500">Certificates</p>
            </button>
          </div>
        </Panel>

        <Panel className="xl:col-span-3 p-4">
          <PanelHead title="Recent Activity" action={<LinkBtn label="Reports" onClick={() => onNavigate('visits')} />} />
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
            {activity.length === 0 && <p className="text-xs text-gray-500">No recent activity.</p>}
          </div>
        </Panel>

        <Panel className="xl:col-span-3 p-4">
          <PanelHead title="Quick Actions" />
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((q) => (
              <button
                key={q.label}
                onClick={() => onNavigate(q.target)}
                className="flex flex-col items-center gap-1.5 bg-[#f5f7f5] border border-[#e4eae4] rounded-xl py-4 hover:border-[#0C3B2E]/40 hover:bg-[#0C3B2E]/5 transition-colors"
              >
                <q.icon size={20} className="text-[#0C3B2E]" />
                <span className="text-[11px] font-bold text-gray-700 text-center leading-tight px-1">{q.label}</span>
              </button>
            ))}
          </div>
        </Panel>
      </div>

      {/* Sync status (kept) */}
      <div className={`rounded-2xl border px-4 py-3 flex items-center gap-2 text-[13px] font-semibold ${
        syncQueue.length === 0 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-orange-50 border-orange-200 text-orange-700'
      }`}>
        <CheckCircle2 size={16} />
        {syncQueue.length === 0 ? 'All reports synced' : `${syncQueue.length} item(s) waiting to sync`}
      </div>
    </div>
  );
}

function Panel({ className = '', children }) {
  return (
    <div className={`bg-white border border-[#e4eae4] rounded-2xl shadow-[0_1px_3px_rgba(12,59,46,0.06)] ${className}`}>
      {children}
    </div>
  );
}

function PanelHead({ title, subtitle, action, icon: Icon }) {
  return (
    <div className="flex items-start justify-between gap-2 mb-3">
      <div className="min-w-0">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
          {Icon && <Icon size={13} className="text-[#0C3B2E]" />} {title}
        </h3>
        {subtitle && <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

function LinkBtn({ label, onClick }) {
  return (
    <button onClick={onClick} className="text-[11px] font-bold text-[#0C3B2E] flex items-center gap-0.5 hover:underline">
      {label} <ChevronRight size={13} />
    </button>
  );
}

// eslint-disable-next-line no-unused-vars
function LegendDot({ color, label }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="w-2.5 h-2.5 rounded-full border border-white shadow" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function MiniStat({ icon: Icon, label, value }) {
  return (
    <div className="bg-[#f5f7f5] border border-[#e4eae4] rounded-xl py-2 px-1">
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide flex items-center justify-center gap-1">
        <Icon size={11} /> {label}
      </p>
      <p className="text-sm font-bold text-gray-900 mt-0.5">{value}</p>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="bg-[#f5f7f5] border border-[#e4eae4] rounded-xl py-2.5 px-2 text-center">
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-[10px] font-semibold text-gray-500">{label}</p>
    </div>
  );
}