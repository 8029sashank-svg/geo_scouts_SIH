import React from 'react';
import { BadgeCheck, School, MapPin, LogOut, Star } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card.jsx';
import { useScout } from '../ScoutContext.jsx';
import { CERTIFICATES, MISSION_STATUS } from '../mockData.js';

export default function Profile({ onLogout }) {
  const { scout, missions, totalPoints, sessionCompletions } = useScout();
  // Mock mapping: verified reports stand in for assisted cases.
  const casesAssisted = scout.stats.reportsVerified + sessionCompletions;
  const earnedCerts = CERTIFICATES.filter((c) => c.status === 'Earned').length;
  // Same derived rule as the Dashboard: share of assigned missions done.
  const completedCount = missions.filter(
    (m) => m.status === MISSION_STATUS.COMPLETED || m.status === MISSION_STATUS.UNDER_REVIEW
  ).length;
  const participationPct = missions.length === 0 ? 0 : Math.round((completedCount / missions.length) * 100);

  return (
    <div className="space-y-4 max-w-xl mx-auto">
      <div className="bg-white border border-gov-border rounded-xl shadow-card p-5 text-center">
        <div className="w-16 h-16 rounded-full bg-gov-navy text-white flex items-center justify-center text-lg font-bold mx-auto">
          {scout.name.split(' ').map((n) => n[0]).join('')}
        </div>
        <h1 className="text-lg font-bold text-gov-navy mt-3">{scout.name}</h1>
        <div className="inline-flex items-center gap-1 mt-1 text-xs font-bold text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-1">
          <BadgeCheck size={13} /> VERIFIED FIELD SCOUT
        </div>
      </div>

      <Card>
        <CardHeader icon={School} title="Scout Details" />
        <dl className="space-y-2 text-sm">
          <Row label="Scout ID" value={scout.scoutId} />
          <Row label="College" value={scout.college} />
          <Row label="Department" value={scout.department} />
          <Row label="Year" value={scout.year} />
          <Row label="Assigned District" value={scout.district} />
          <Row label="Email" value={scout.email} />
        </dl>
      </Card>

      <Card>
        <CardHeader icon={MapPin} title="Field Performance" subtitle="Verified field data quality" />
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Missions Completed" value={scout.stats.missionsCompleted + sessionCompletions} />
          <Stat label="Reports Submitted" value={scout.stats.reportsSubmitted + sessionCompletions} />
          <Stat label="Reports Verified" value={scout.stats.reportsVerified} />
          <Stat label="Verification Rate" value={`${scout.stats.verificationRate}%`} />
        </div>
        <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-green-800">Field Data Quality</span>
            <span className="text-lg font-bold text-green-700">{scout.stats.dataQuality}%</span>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader icon={Star} title="Student Progress" subtitle="Points, cases & participation (mock)" />
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Points" value={totalPoints} />
          <Stat label="Cases Assisted" value={casesAssisted} />
          <Stat label="Certificates" value={earnedCerts} />
          <Stat label="Participation" value={`${participationPct}%`} />
        </div>
      </Card>

      <button
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 text-sm font-bold text-red-600 border border-red-200 bg-red-50 rounded-lg py-3"
      >
        <LogOut size={15} /> Log out
      </button>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-gov-textSec">{label}</dt>
      <dd className="font-semibold text-gov-navy text-right">{value}</dd>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-gov-bg border border-gov-border rounded-lg p-3">
      <p className="text-2xl font-bold text-gov-navy">{value}</p>
      <p className="text-[11px] font-semibold text-gov-textSec">{label}</p>
    </div>
  );
}
