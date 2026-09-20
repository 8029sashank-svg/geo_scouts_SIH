/* eslint-disable no-unused-vars */
import React, { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, CircleMarker as CM, Circle } from 'react-leaflet';
import { Map as MapIcon, MapPin, ArrowRight, Layers, Box, LocateFixed } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card.jsx';
import { useScout } from '../ScoutContext.jsx';
import { CLUSTER_VISITS, MISSION_STATUS, NEARBY_CASES } from '../mockData.js';
import { PriorityChip, MissionStatusChip } from './Chips.jsx';
import Maharashtra3DMap from './Maharashtra3DMap.jsx';
import { MOCK_DISTRICT_INTELLIGENCE, getDistrictIntelligence } from '../data/districtIntelligence.js';
import { FARMER_ESTIMATES } from '../mockData.js';
import AgriImage from './AgriImage.jsx';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { useLiveLocationShared } from '../contexts/livelocationcontext.jsx';
import { STUDENT_OPERATING_RADIUS_KM, isWithinOperatingRadius } from '../config.js';

const CENTER = [19.98, 74.0];

const PRIORITY_COLOR = {
  HIGH: '#e65100',
  MEDIUM: '#f9a825',
  LOW: '#2e7d32',
};

const STATUS_COLOR = {
  Completed: '#2e7d32',
  Assigned: '#0284c7',
};

const OUT_OF_RADIUS_COLOR = '#9ca3af';

const CLUSTER_COLOR = '#0d9488';

// Marker color: completed stays green regardless of radius (already
// visited); an active/pending mission outside the operating radius is
// shown muted so it visually reads as unreachable before opening it.
function markerColor(m) {
  if (
    m.status === MISSION_STATUS.COMPLETED ||
    m.status === MISSION_STATUS.UNDER_REVIEW ||
    m.status === MISSION_STATUS.VERIFIED
  ) {
    return STATUS_COLOR.Completed;
  }
  if (!isWithinOperatingRadius(m.distanceKm)) {
    return OUT_OF_RADIUS_COLOR;
  }
  if (
    m.status === MISSION_STATUS.ACCEPTED ||
    m.status === MISSION_STATUS.EN_ROUTE ||
    m.status === MISSION_STATUS.IN_PROGRESS
  ) {
    return STATUS_COLOR.Assigned;
  }
  return PRIORITY_COLOR[m.priority] || PRIORITY_COLOR.LOW;
}

const SCOUT_LOCATION = [20.03, 73.79];

export default function FieldMap({ onOpenMission, onNavigate }) {
  const { missions, traps, visits } = useScout();
  const trapList = Object.values(traps);
  const [mode, setMode] = useState('3d');
  const liveVisit = Object.entries(visits).find(([, v]) => v.lastLat != null && (v.status === 'In Progress' || v.status === 'Checked In'));
  const [intelligence, setIntelligence] = useState(MOCK_DISTRICT_INTELLIGENCE);
  const [satellite, setSatellite] = useState({});
  const [query, setQuery] = useState('');

  // Student location: reuses the shared live-location context (already
  // used by the 3D map) rather than a second geolocation system. Falls
  // back to a labeled demo position until the student opts in.
  const liveLoc = useLiveLocationShared();
  const studentIsLive = liveLoc.hasLocation;
  const studentCoords = studentIsLive ? [liveLoc.coords.latitude, liveLoc.coords.longitude] : SCOUT_LOCATION;

  useEffect(() => {
    getDistrictIntelligence().then(setIntelligence).catch(() => {});
    fetch('http://localhost:8000/satellite/districts', { signal: AbortSignal.timeout(2500) })
      .then((r) => r.json())
      .then((arr) => {
        const m = {};
        for (const d of arr) m[d.district] = d;
        setSatellite(m);
      })
      .catch(() => {});
  }, []);

  const stats = useMemo(() => {
    const vals = Object.values(intelligence);
    return {
      high: vals.filter((v) => v.riskLevel === 'HIGH').length,
      medium: vals.filter((v) => v.riskLevel === 'MEDIUM').length,
      low: vals.filter((v) => v.riskLevel === 'LOW').length,
    };
  }, [intelligence]);

  const topHigh = useMemo(() => {
    return Object.values(intelligence)
      .filter((v) => v.riskLevel === 'HIGH')
      .sort((a, b) => b.overallRisk - a.overallRisk)
      .slice(0, 5);
  }, [intelligence]);

  const riskDist = useMemo(() => [
    { name: 'High', value: stats.high, color: '#dc2626' },
    { name: 'Medium', value: stats.medium, color: '#f59e0b' },
    { name: 'Low', value: stats.low, color: '#065f46' },
  ], [stats]);

  const cropCounts = useMemo(() => {
    const counts = {};
    Object.values(intelligence).forEach((v) => {
      counts[v.crop] = (counts[v.crop] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, value]) => ({ name, value }));
  }, [intelligence]);

  const quickStats = useMemo(() => {
    const vals = Object.values(intelligence);
    if (!vals.length) return null;
    const sorted = [...vals].sort((a, b) => b.overallRisk - a.overallRisk);
    const satVals = Object.values(satellite).filter((s) => s.ndvi?.mean != null);
    const avgNdvi = satVals.length ? (satVals.reduce((a, b) => a + (b.ndvi.mean ?? b.ndviMean ?? 0), 0) / satVals.length).toFixed(2) : '—';
    const avgNdwi = satVals.length ? (satVals.reduce((a, b) => a + (b.ndwi.mean ?? b.ndwiMean ?? 0), 0) / satVals.length).toFixed(2) : '—';
    return {
      highest: sorted[0],
      lowest: sorted[sorted.length - 1],
      avgNdvi,
      avgNdwi,
    };
  }, [intelligence, satellite]);

  const featured = ['Nashik', 'Pune', 'Solapur', 'Ahmednagar'].map((name) => {
    const intel = intelligence[name];
    const sat = satellite[name];
    return { name, intel, sat };
  }).filter((x) => x.intel);

  const totalFarmers = useMemo(() => Object.values(FARMER_ESTIMATES || {}).reduce((a, b) => a + b, 0), []);
  // Fallback if farmer estimates not yet loaded — show unavailable honestly
  const farmerTotalLabel = totalFarmers > 0 ? `${(totalFarmers / 1000000).toFixed(1)}M` : null;
  const dataSourceLabel = (() => {
    const sample = intelligence['Nashik'];
    if (sample?.dataSource === 'REAL_OFFICIAL') return 'Real • Official';
    if (sample?.dataSource === 'DEMO_SYNTHETIC') return 'Demo • ML Prototype';
    return 'Demo • Prototype';
  })();

  return (
    <div className="space-y-4">
      {/* Page Header — simple, map-first */}
      <div className="bg-white border border-[#e4eae4] rounded-2xl p-5 shadow-[0_1px_3px_rgba(12,59,46,0.06)]">
        <h1 className="text-xl sm:text-2xl font-bold text-[#0C3B2E]">Farm Map</h1>
        <p className="text-[13px] text-gray-500 mt-1">Explore Maharashtra&apos;s agriculture — farmers, key crops and district risk.</p>
      </div>

      {/* Top Summary Cards — honest, no fabrication */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-[#e4eae4] rounded-2xl p-4 text-center shadow-[0_1px_3px_rgba(12,59,46,0.06)]">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Total Farmers</p>
          {farmerTotalLabel ? (
            <>
              <p className="text-xl font-bold text-gray-900 mt-1">{farmerTotalLabel}</p>
              <p className="text-[10px] text-amber-700 font-semibold">Prototype estimate</p>
            </>
          ) : (
            <p className="text-xs font-semibold text-gray-500 mt-1">Farmer data unavailable</p>
          )}
          <p className="text-[11px] text-gray-400">Maharashtra</p>
        </div>
        <div className="bg-white border border-[#e4eae4] rounded-2xl p-4 text-center shadow-[0_1px_3px_rgba(12,59,46,0.06)]">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Districts</p>
          <p className="text-xl font-bold text-gray-900 mt-1">34</p>
          <p className="text-[11px] text-gray-400">Maharashtra</p>
        </div>
        <div className="bg-white border border-[#e4eae4] rounded-2xl p-4 text-center shadow-[0_1px_3px_rgba(12,59,46,0.06)]">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Major Crops</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{cropCounts.length}</p>
          <p className="text-[11px] text-gray-400">Top categories</p>
        </div>
      </div>

      {/* Map mode toggle */}
      <div className="flex items-center gap-1 bg-white border border-[#e4eae4] rounded-full p-1 w-fit shadow-sm">
        <button
          onClick={() => setMode('2d')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${mode === '2d' ? 'bg-[#0C3B2E] text-white' : 'text-gray-500 hover:bg-[#f5f7f5]'}`}
        >
          <Layers size={13} /> 2D Field Map
        </button>
        <button
          onClick={() => setMode('3d')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${mode === '3d' ? 'bg-[#0C3B2E] text-white' : 'text-gray-500 hover:bg-[#f5f7f5]'}`}
        >
          <Box size={13} /> 3D Maharashtra
        </button>
      </div>

      {mode === '3d' ? (
        <ErrorBoundary fallback={
          <div className="bg-white border border-red-200 rounded-2xl p-6 text-center">
            <p className="text-sm font-bold text-red-700">3D map unavailable on this device</p>
            <button onClick={() => setMode('2d')} className="mt-3 text-xs font-bold bg-[#0C3B2E] text-white rounded-full px-4 py-2">Switch to 2D Map</button>
          </div>
        }>
          <Maharashtra3DMap onNavigate={onNavigate} />
        </ErrorBoundary>
      ) : (
        <>
          <div className="flex items-center justify-between px-1">
            <p className="text-[11px] text-gov-textSec">
              {studentIsLive ? 'Using your device location.' : 'Using a demo location for this prototype — no real GPS.'}
            </p>
            {!studentIsLive && (
              <button
                onClick={liveLoc.requestLocation}
                className="flex items-center gap-1 text-[11px] font-bold text-gov-blue"
              >
                <LocateFixed size={12} /> {liveLoc.status === 'requesting' ? 'Locating…' : 'Use my location'}
              </button>
            )}
          </div>
          <Card padded={false} className="overflow-hidden">
          <div className="h-[26rem]">
            <MapContainer center={CENTER} zoom={9} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={16}
              />
              <CircleMarker center={studentCoords} radius={8} pathOptions={{ color: '#fff', weight: 2, fillColor: '#174A7E', fillOpacity: 1 }}>
                <Popup>
                  <div className="text-xs font-semibold">📍 {studentIsLive ? 'Student Location (live)' : 'Student Location (demo)'}</div>
                </Popup>
              </CircleMarker>
              <Circle
                center={studentCoords}
                radius={STUDENT_OPERATING_RADIUS_KM * 1000}
                pathOptions={{ color: '#174A7E', weight: 1, fillColor: '#174A7E', fillOpacity: 0.05, dashArray: '4 5' }}
              />
              {liveVisit && (
                <>
                  <Circle center={[liveVisit[1].lastLat, liveVisit[1].lastLng]} radius={liveVisit[1].lastAccuracy || 30} pathOptions={{ color: '#0C3B2E', fillColor: '#0C3B2E', fillOpacity: 0.12, weight: 1 }} />
                  <CircleMarker center={[liveVisit[1].lastLat, liveVisit[1].lastLng]} radius={10} pathOptions={{ color: '#fff', weight: 2, fillColor: '#0C3B2E', fillOpacity: 1 }}>
                    <Popup><div className="text-xs font-bold">● LIVE — {liveVisit[0]}</div></Popup>
                  </CircleMarker>
                </>
              )}
              {missions.map((m) => {
                const withinRadius = isWithinOperatingRadius(m.distanceKm);
                const linkedCase = NEARBY_CASES.find((c) => c.id === m.id);
                return (
                  <CircleMarker
                    key={m.id}
                    center={m.coords}
                    radius={9}
                    pathOptions={{ color: '#fff', weight: 2, fillColor: markerColor(m), fillOpacity: 1 }}
                  >
                    <Popup>
                      <div className="min-w-[190px] text-xs">
                        <p className="font-bold text-gov-navy text-sm mb-1">{m.fieldName}</p>
                        <p className="mb-1">Mission: {m.id}</p>
                        {linkedCase && <p className="mb-1">Farmer: {linkedCase.farmer}</p>}
                        <p className="mb-1">Crop: {m.crop}</p>
                        <p className="mb-1">Issue: {m.title}</p>
                        <p className="mb-1">Village: {m.location}</p>
                        <p className={`mb-2 font-semibold ${withinRadius ? 'text-green-700' : 'text-red-600'}`}>
                          {m.distanceKm} km away — {withinRadius ? 'within operating radius' : 'outside operating radius'}
                        </p>
                        <button onClick={() => onOpenMission(m.id)} className="bg-gov-blue text-white text-[11px] font-bold px-2.5 py-1 rounded">Open Mission</button>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
              {CLUSTER_VISITS.map((c) => (
                <CircleMarker
                  key={c.id}
                  center={c.coords}
                  radius={8}
                  pathOptions={{ color: '#fff', weight: 2, fillColor: CLUSTER_COLOR, fillOpacity: 1, dashArray: '3 2' }}
                >
                  <Popup>
                    <div className="min-w-[180px] text-xs">
                      <p className="font-bold text-gov-navy text-sm mb-1">👥 {c.name}</p>
                      <p className="mb-1">{c.village} (demo location)</p>
                      <p className="mb-2">{c.date} • {c.time} • {c.organizer}</p>
                      {onNavigate && (<button onClick={() => onNavigate('clusters')} className="bg-gov-blue text-white text-[11px] font-bold px-2.5 py-1 rounded">View Cluster Visits</button>)}
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
              {trapList.map((t) => {
                // Position each trap at its assigned mission's real field
                // location (small fixed offset so it doesn't sit exactly
                // on top of the mission pin). No mission owns this trap
                // yet? Skip it rather than showing a made-up position.
                const parentMission = missions.find((m) => m.trapId === t.id);
                if (!parentMission) return null;
                const trapCenter = [parentMission.coords[0] + 0.006, parentMission.coords[1] + 0.006];
                return (
                  <CM key={t.id} center={trapCenter} radius={6} pathOptions={{ color: '#fff', weight: 2, fillColor: '#0284c7', fillOpacity: 1 }}>
                    <Popup>
                      <div className="text-xs min-w-[160px]">
                        <p className="font-bold text-gov-navy mb-1">🟦 {t.id}</p>
                        <p className="mb-1">{t.location}</p>
                        <p className="text-gray-500">Assigned to mission {parentMission.id}</p>
                      </div>
                    </Popup>
                  </CM>
                );
              })}
            </MapContainer>
          </div>
          </Card>
        </>
      )}

      {mode === '2d' && (
        <Card>
          <CardHeader icon={MapIcon} title="Legend" />
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Legend color="#e65100" label="High Risk" />
            <Legend color="#f9a825" label="Moderate Risk" />
            <Legend color="#2e7d32" label="Healthy / Low" />
            <Legend color="#0284c7" label="Assigned / In Progress" />
            <Legend color="#2e7d32" label="Completed Visit" />
            <Legend color="#9ca3af" label="Outside Operating Radius" />
            <Legend color="#0d9488" label="Cluster Visit" />
            <Legend color="#0284c7" label="Smart Trap" />
            <Legend color="#174A7E" label={studentIsLive ? 'Student Location (live)' : 'Student Location (demo)'} />
          </div>
          <p className="text-[11px] text-gov-textSec mt-3 pt-3 border-t border-gray-100">
            Dashed circle: {STUDENT_OPERATING_RADIUS_KM} km operating radius, shown for orientation only. Whether a
            mission is reachable is based on its recorded distance (below), not exact map geometry.
          </p>
        </Card>
      )}

      {/* Quick District Stats - compact */}
      {mode === '3d' && quickStats && (
        <div className="bg-white border border-[#e4eae4] rounded-2xl p-4 shadow-[0_1px_3px_rgba(12,59,46,0.06)]">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-3">Quick District Stats</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
              <p className="text-xs text-red-700 font-semibold">Highest Risk</p>
              <p className="text-sm font-bold text-red-700 mt-1">{quickStats.highest.district} {quickStats.highest.overallRisk}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
              <p className="text-xs text-green-700 font-semibold">Lowest Risk</p>
              <p className="text-sm font-bold text-green-700 mt-1">{quickStats.lowest.district} {quickStats.lowest.overallRisk}</p>
            </div>
            <div className="bg-[#f5f7f5] border border-[#e4eae4] rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 font-semibold">Avg. NDVI</p>
              <p className="text-sm font-bold text-gray-900 mt-1">{quickStats.avgNdvi}</p>
            </div>
            <div className="bg-[#f5f7f5] border border-[#e4eae4] rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 font-semibold">Avg. NDWI</p>
              <p className="text-sm font-bold text-gray-900 mt-1">{quickStats.avgNdwi}</p>
            </div>
          </div>
        </div>
      )}

      {/* District Cards - Nashik etc. */}
      {mode === '3d' && (
        <div>
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">Featured Districts</h3>
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {featured.map(({ name, intel, sat }) => (
              <div key={name} className="bg-white border border-[#e4eae4] rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(12,59,46,0.06)] hover:shadow-md transition-shadow">
                <div className="h-20 relative">
                  <AgriImage src={intel ? `/agriculture/${intel.crop === 'Grapes' ? 'grapes/vineyard.jpg' : intel.crop === 'Cotton' ? 'cotton/cotton-field.jpg' : 'fields/field.jpg'}` : null} alt={name} label="No image" className="w-full h-20" />
                  <span className={`absolute top-2 left-2 text-[10px] font-bold rounded-full px-1.5 py-0.5 ${intel?.riskLevel === 'HIGH' ? 'bg-red-600 text-white' : intel?.riskLevel === 'MEDIUM' ? 'bg-amber-500 text-white' : 'bg-green-600 text-white'}`}>{intel?.riskLevel}</span>
                </div>
                <div className="p-3">
                  <h4 className="text-sm font-bold text-gray-900">{name}</h4>
                  <p className="text-xs text-gray-500">{intel?.crop || '—'}</p>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-[11px]">
                    <div className="bg-[#f5f7f5] rounded-lg p-2 text-center">
                      <p className="text-gray-500">NDVI</p>
                      <p className="font-bold text-gray-900">{sat?.ndvi?.mean?.toFixed(2) ?? sat?.ndviMean?.toFixed(2) ?? '—'}</p>
                    </div>
                    <div className="bg-[#f5f7f5] rounded-lg p-2 text-center">
                      <p className="text-gray-500">NDWI</p>
                      <p className="font-bold text-gray-900">{sat?.ndwi?.mean?.toFixed(2) ?? sat?.ndwiMean?.toFixed(2) ?? '—'}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2">{sat?.isRealData ? 'Satellite-derived • Sentinel-2' : 'Demo • Prototype'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Below Map - 3 cards */}
      {mode === '3d' && (
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="bg-white border border-[#e4eae4] rounded-2xl p-4 shadow-[0_1px_3px_rgba(12,59,46,0.06)]">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-3">Top 5 Districts By Risk</h3>
            <div className="space-y-2">
              {topHigh.map((d, idx) => (
                <div key={d.district} className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-gray-500 w-4">{idx+1}</span>
                  <span className="font-bold text-gray-900 w-20 truncate">{d.district}</span>
                  <span className={`text-[10px] font-bold rounded px-1 ${d.riskLevel==='HIGH'?'bg-red-100 text-red-700':'bg-amber-100 text-amber-700'}`}>{d.riskLevel}</span>
                  <span className="ml-auto text-gray-600">{FARMER_ESTIMATES[d.district] ? `${(FARMER_ESTIMATES[d.district]/1000).toFixed(0)}K` : '—'} <span className="text-[10px] text-amber-700">farmers</span></span>
                </div>
              ))}
              {topHigh.length === 0 && <p className="text-xs text-gray-500">No high-risk districts in current data.</p>}
            </div>
          </div>
          <div className="bg-white border border-[#e4eae4] rounded-2xl p-4 shadow-[0_1px_3px_rgba(12,59,46,0.06)]">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-3">Farmer Distribution</h3>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={Object.entries(FARMER_ESTIMATES).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([name,value])=>({name: name.length>8?name.slice(0,8):name, value: Math.round(value/1000)}))} layout="vertical" margin={{ left: 50, right: 10, top: 5, bottom: 5 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={70} />
                  <Tooltip formatter={(v)=>[`${v}K farmers`,'Farmers']} />
                  <Bar dataKey="value" fill="#0C3B2E" radius={[0,6,6,0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-amber-700 text-center mt-1">Prototype estimate</p>
          </div>
          <div className="bg-white border border-[#e4eae4] rounded-2xl p-4 shadow-[0_1px_3px_rgba(12,59,46,0.06)]">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-3">Common Crops</h3>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cropCounts} layout="vertical" margin={{ left: 50, right: 10, top: 5, bottom: 5 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={70} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0C3B2E" radius={[0, 6, 6, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Assigned Fields - keep existing below analytics for 3D, always for 2D */}
      <Card>
        <CardHeader title="Assigned Fields" subtitle={`Operating radius: ${STUDENT_OPERATING_RADIUS_KM} km`} />
        <div className="space-y-2">
          {missions.map((m) => {
            const withinRadius = isWithinOperatingRadius(m.distanceKm);
            return (
              <button key={m.id} onClick={() => onOpenMission(m.id)} className="w-full flex items-center justify-between text-left bg-gov-bg border border-gov-border rounded-lg px-3 py-2.5 hover:border-gov-blue">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gov-navy truncate flex items-center gap-1"><MapPin size={12} /> {m.fieldName}</p>
                  <p className="text-xs text-gov-textSec">{m.crop} • {m.distanceKm} km away{!withinRadius && (
                    <span className="text-red-600 font-semibold"> • Outside radius</span>
                  )}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <PriorityChip level={m.priority} size="sm" />
                  <MissionStatusChip status={m.status} size="sm" />
                  <ArrowRight size={14} className="text-gov-textSec" />
                </div>
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function Legend({ color, label }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-3 h-3 rounded-full border border-white shadow" style={{ backgroundColor: color }} />
      <span className="text-gov-text">{label}</span>
    </div>
  );
}