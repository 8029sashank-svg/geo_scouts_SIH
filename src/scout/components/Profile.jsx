import React from 'react';
import { BadgeCheck, School, LogOut, IndianRupee, Wallet, MapPin } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card.jsx';
import { useScout } from '../ScoutContext.jsx';

export default function Profile({ onLogout }) {
  const { scout, sessionCompletions } = useScout();

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
        <CardHeader icon={IndianRupee} title="Field Visit Reimbursement" subtitle="Demo visualization of stipend tracking" />
        <div className="space-y-3">
          <div className="border border-gov-border rounded-lg p-3 text-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold text-gov-navy">GF-1042 — Dindori</p>
                <p className="text-xs text-gov-textSec mt-0.5">Powdery Mildew field visit</p>
              </div>
              <span className="font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded text-xs border border-green-200">
                Approved
              </span>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
              <span className="text-xs text-gov-textSec">Stipend Amount</span>
              <span className="font-bold text-gov-navy">₹150</span>
            </div>
          </div>
          
          <div className="border border-gov-border rounded-lg p-3 text-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold text-gov-navy">GF-1038 — Niphad</p>
                <p className="text-xs text-gov-textSec mt-0.5">Fruit Fly Trap Inspection</p>
              </div>
              <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded text-xs border border-purple-200">
                Under Review
              </span>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
              <span className="text-xs text-gov-textSec">Stipend Amount</span>
              <span className="font-bold text-gov-navy">₹150</span>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader icon={Wallet} title="Payment Details" subtitle="Synthetic demo values only" />
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3">
          <p className="text-xs text-orange-800 font-medium">
            This is an MVP visualization. Real financial data is NOT verified or stored.
          </p>
        </div>
        <dl className="space-y-2 text-sm">
          <Row label="UPI ID" value="aarav-demo@upi" />
          <Row label="Bank Account" value="••••4821" />
          <Row label="IFSC Code" value="DEMO0001234" />
          <Row label="Status" value={<span className="text-orange-600 font-bold">Demo / Not Verified</span>} />
        </dl>
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
