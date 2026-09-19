import React, { useState } from 'react';
import { ScanLine, Bug, Loader2, TrendingUp, ShieldCheck, XCircle, HelpCircle } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { Card, CardHeader } from '../../components/ui/Card.jsx';
import { useScout } from '../ScoutContext.jsx';
import { simulateTrapScan } from '../utils/aiSim.js';

export default function TrapScan() {
  const { traps } = useScout();
  const trapList = Object.values(traps);
  const [selectedId, setSelectedId] = useState(trapList[0]?.id);
  const trap = traps[selectedId];

  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [verification, setVerification] = useState(null);

  const handleSelect = (id) => {
    setSelectedId(id);
    setResult(null);
    setVerification(null);
  };

  const runScan = () => {
    setScanning(true);
    setTimeout(() => {
      setResult(simulateTrapScan(trap.previousTotal));
      setScanning(false);
    }, 1000);
  };

  return (
    <div className="space-y-4 max-w-xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-gov-navy">Scan Smart Trap</h1>
        <p className="text-sm text-gov-textSec mt-0.5">Inspect a low-cost smart sticky trap in the field</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {trapList.map((t) => (
          <button
            key={t.id}
            onClick={() => handleSelect(t.id)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border ${
              selectedId === t.id ? 'bg-gov-blue text-white border-gov-blue' : 'bg-white text-gov-textSec border-gov-border'
            }`}
          >
            {t.id}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader icon={ScanLine} title={trap.id} subtitle={trap.location} />
        <div className="grid grid-cols-2 gap-3 text-xs mb-4">
          <Info label="Crop" value={trap.crop} />
          <Info label="Trap type" value={trap.type} />
          <Info label="Last scan" value={trap.lastScan} />
          <Info label="Battery" value={`${trap.battery}%`} />
          <Info label="Connectivity" value="Offline capable" className="col-span-2" />
          <Info label="Last synced" value={trap.lastSynced} className="col-span-2" />
        </div>

        {!result && (
          <button
            onClick={runScan}
            disabled={scanning}
            className="w-full bg-gov-blue hover:bg-gov-navy disabled:opacity-70 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
          >
            {scanning ? <><Loader2 size={16} className="animate-spin" /> Scanning trap…</> : 'Scan Trap'}
          </button>
        )}

        {result && (
          <div className="space-y-4">
            <div className="border border-gov-border rounded-xl p-4">
              <p className="text-xs font-bold text-gov-textSec uppercase tracking-wide mb-2">AI Trap Analysis</p>
              <div className="space-y-1.5 text-sm">
                {Object.entries(result.counts).map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-gov-text flex items-center gap-1.5"><Bug size={13} className="text-gov-textSec" /> {k}</span>
                    <span className="font-bold text-gov-navy">{v}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 border-t border-gray-100 font-bold">
                  <span className="text-gov-navy">Total</span>
                  <span className="text-gov-navy">{result.total}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-gov-bg rounded-lg p-2 border border-gov-border">
                <p className="text-gov-textSec">Previous</p>
                <p className="font-bold text-gov-navy">{result.previousTotal}</p>
              </div>
              <div className="bg-gov-bg rounded-lg p-2 border border-gov-border">
                <p className="text-gov-textSec">Current</p>
                <p className="font-bold text-gov-navy">{result.total}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-2 border border-red-200">
                <p className="text-red-700">Change</p>
                <p className="font-bold text-red-700">+{result.changePct}%</p>
              </div>
            </div>

            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[...trap.history, { day: 'Now', count: result.total }]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" width={24} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#e65100" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex gap-2">
              <TrendingUp size={16} className="text-orange-600 shrink-0 mt-0.5" />
              <p className="text-xs text-orange-800">
                Population increased by {result.changePct}% since the previous inspection. Risk: <span className="font-bold">HIGH</span>.
              </p>
            </div>

            <div>
              <p className="text-xs font-bold text-gov-textSec mb-2">Does this look correct?</p>
              <div className="grid grid-cols-3 gap-2">
                <VerifyBtn active={verification === 'correct'} onClick={() => setVerification('correct')} icon={ShieldCheck} label="Looks correct" color="green" />
                <VerifyBtn active={verification === 'incorrect'} onClick={() => setVerification('incorrect')} icon={XCircle} label="Incorrect count" color="red" />
                <VerifyBtn active={verification === 'unsure'} onClick={() => setVerification('unsure')} icon={HelpCircle} label="Not sure" color="amber" />
              </div>
              {verification && <p className="text-[11px] text-gov-textSec mt-2">Your verification becomes part of the field record.</p>}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function Info({ label, value, className = '' }) {
  return (
    <div className={`bg-gov-bg border border-gov-border rounded-lg p-2.5 ${className}`}>
      <p className="text-gov-textSec">{label}</p>
      <p className="font-bold text-gov-navy mt-0.5">{value}</p>
    </div>
  );
}

function VerifyBtn({ active, onClick, icon: Icon, label, color }) {
  const colorMap = {
    green: active ? 'bg-green-600 text-white border-green-600' : 'border-gov-border text-green-700',
    red: active ? 'bg-red-600 text-white border-red-600' : 'border-gov-border text-red-600',
    amber: active ? 'bg-amber-500 text-white border-amber-500' : 'border-gov-border text-amber-600',
  };
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 py-2.5 rounded-lg border text-[11px] font-bold ${colorMap[color]}`}>
      <Icon size={16} /> {label}
    </button>
  );
}
