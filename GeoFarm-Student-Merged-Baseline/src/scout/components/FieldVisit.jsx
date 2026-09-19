import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft, MapPin, CheckCircle2, ClipboardList, Camera, NotebookPen, ArrowRight, Upload, X, Package, Crosshair, Satellite, Navigation,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card.jsx';
import { useScout } from '../ScoutContext.jsx';
import { MISSION_STATUS } from '../mockData.js';
import { NEARBY_CASES, NEARBY_CASE_DETAILS } from '../mockData.js';
import useLiveLocation from '../hooks/uselivelocation.js';
import { formatDistance, formatDuration } from '../utils/geo.js';
import FieldKitChecklist from './FieldKitChecklist.jsx';
import { MapContainer, TileLayer, Marker, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

const EXTRA_SYMPTOMS = ['Leaf spots', 'Pest damage', 'Other'];

const STATUS_STYLE = {
  'Not Started': 'bg-gray-100 text-gray-700 border-gray-300',
  'Checked In': 'bg-blue-50 text-blue-700 border-blue-200',
  'In Progress': 'bg-amber-50 text-amber-700 border-amber-300',
};

function Recenter({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.setView([coords.latitude, coords.longitude], 16, { animate: true });
  }, [coords, map]);
  return null;
}

export default function FieldVisit({ visitId, onBack }) {
  const { missions, visits, updateVisitStatus, patchVisit, updateMissionStatus } = useScout();
  const live = useLiveLocation();
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [notes, setNotes] = useState('');
  const [showEvidence, setShowEvidence] = useState(false);
  const [showKit, setShowKit] = useState(false);
  const [recenterKey, setRecenterKey] = useState(0);

  const mission = missions.find((m) => m.id === visitId);
  const nearby = NEARBY_CASES.find((c) => c.id === visitId);
  const detail = NEARBY_CASE_DETAILS[visitId];

  const visit = visits[visitId] || { status: 'Not Started', checkedInAt: null };
  const checkedIn = visit.status !== 'Not Started';
  const isActiveVisit = visit.status === 'In Progress' || visit.status === 'Checked In';

  // Persist live location to context for report
  useEffect(() => {
    if (live.coords) {
      patchVisit(visitId, {
        lastLat: live.coords.latitude,
        lastLng: live.coords.longitude,
        lastAccuracy: live.coords.accuracy,
        distanceM: live.distance,
        points: live.points,
        gpsStatus: live.status,
        visitStartTime: live.startTime,
      });
    }
  }, [live.coords, live.distance, live.points, live.startTime, live.status, patchVisit, visitId]);

  // Auto-check DURING items based on visit progress
  const autoDuring = {
    'GPS tracking active': live.isActive,
    'Farmer / field check-in completed': checkedIn,
    'Field location recorded': !!live.coords,
    'Crop identified': !!detail,
    'Photos captured': (visits[visitId]?.photos?.length || 0) > 0,
    'Pest symptoms observed': selectedSymptoms.some((s) => s.toLowerCase().includes('pest') || s.toLowerCase().includes('holes')),
    'Disease symptoms observed': selectedSymptoms.some((s) => s.toLowerCase().includes('powder') || s.toLowerCase().includes('curl')),
    'Notes recorded': notes.trim().length > 10,
  };

  const handleStartVisit = () => {
    updateVisitStatus(visitId, 'In Progress');
    updateMissionStatus(visitId, MISSION_STATUS.IN_PROGRESS);
    patchVisit(visitId, { visitStartTime: Date.now(), gpsStatus: 'requesting' });
    live.start();
  };

  const handleEndVisit = () => {
    live.stop();
    patchVisit(visitId, {
      visitEndTime: Date.now(),
      distanceM: live.distance,
      lastLat: live.coords?.latitude ?? null,
      lastLng: live.coords?.longitude ?? null,
      lastAccuracy: live.coords?.accuracy ?? null,
      gpsStatus: live.status,
      points: live.points,
    });
    updateVisitStatus(visitId, 'Completed');
  };

  if (!mission && !nearby) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-gray-500">
          <ArrowLeft size={16} /> Back
        </button>
        <p className="text-sm text-gray-500">Visit not found.</p>
      </div>
    );
  }

  const caseTitle = detail?.problem || mission?.title || nearby?.issue || visitId;
  const farmer = nearby?.farmer || '—';
  const location = mission?.location || nearby?.village || '—';
  const crop = mission?.crop || nearby?.crop || '—';
  const symptomOptions = [...(detail?.symptoms || []), ...EXTRA_SYMPTOMS.filter((s) => !(detail?.symptoms || []).includes(s))];

  const toggleSymptom = (s) => {
    if (visit.status === 'Checked In') updateVisitStatus(visitId, 'In Progress');
    setSelectedSymptoms((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const handleNotes = (e) => {
    if (visit.status === 'Checked In') updateVisitStatus(visitId, 'In Progress');
    setNotes(e.target.value);
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900">
        <ArrowLeft size={16} /> Back to My Assignments
      </button>

      {/* Field Visit Header — LIVE */}
      <div className="bg-white border border-[#e4eae4] rounded-2xl p-4 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Field Visit</p>
            <h1 className="text-lg font-bold text-gray-900 mt-0.5">{caseTitle}</h1>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1"><MapPin size={12} /> {location}</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 text-xs font-bold rounded-full px-2.5 py-1 ${live.isActive ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
            <span className={`w-2 h-2 rounded-full ${live.isActive ? 'bg-white animate-pulse' : 'bg-gray-400'}`} /> {live.isActive ? 'LIVE' : visit.status}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-3 text-center">
          <div className="bg-[#f5f7f5] border border-[#e4eae4] rounded-xl p-2">
            <p className="text-[10px] font-bold text-gray-500">GPS Accuracy</p>
            <p className="text-xs font-bold text-gray-900">{live.coords?.accuracy ? `±${Math.round(live.coords.accuracy)} m` : '—'}</p>
            {live.coords?.accuracy > 50 && <p className="text-[10px] text-amber-700">GPS accuracy is low</p>}
          </div>
          <div className="bg-[#f5f7f5] border border-[#e4eae4] rounded-xl p-2">
            <p className="text-[10px] font-bold text-gray-500">Visit Time</p>
            <p className="text-xs font-bold text-gray-900">{live.startTime ? formatDuration(live.elapsed) : '00:00:00'}</p>
          </div>
          <div className="bg-[#f5f7f5] border border-[#e4eae4] rounded-xl p-2">
            <p className="text-[10px] font-bold text-gray-500">Distance</p>
            <p className="text-xs font-bold text-gray-900">{live.distance > 0 ? formatDistance(live.distance) : 'Distance unavailable'}</p>
          </div>
        </div>

        {live.coords && (
          <div className="mt-2 text-xs text-gray-600 bg-[#f5f7f5] border border-[#e4eae4] rounded-xl p-2 flex flex-wrap gap-3">
            <span>Lat {live.coords.latitude.toFixed(5)}</span>
            <span>Lng {live.coords.longitude.toFixed(5)}</span>
            {live.coords.accuracy && <span>±{Math.round(live.coords.accuracy)}m</span>}
          </div>
        )}

        {live.status === 'denied' && (
          <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-xs font-bold text-amber-800">Location permission is required for live field tracking.</p>
            <div className="flex gap-2 mt-2">
              <button onClick={() => live.start()} className="flex-1 bg-[#0C3B2E] text-white text-xs font-bold py-2 rounded-xl">Try Again</button>
              <button onClick={() => patchVisit(visitId, { gpsStatus: 'unavailable' })} className="flex-1 bg-white border border-[#e4eae4] text-xs font-bold py-2 rounded-xl">Continue Without GPS</button>
            </div>
          </div>
        )}
        {live.status === 'unavailable' && (
          <p className="text-xs text-gray-500 mt-2">GPS unavailable · <span className="font-bold">GPS unavailable</span> — visit continues without live tracking.</p>
        )}
      </div>

      {/* Live Map */}
      {(live.isActive || live.coords) && (
        <div className="bg-white border border-[#e4eae4] rounded-2xl overflow-hidden shadow-sm">
          <div className="h-64">
            <MapContainer center={live.coords ? [live.coords.latitude, live.coords.longitude] : [20.03, 73.79]} zoom={16} style={{ height: '100%', width: '100%' }} zoomControl={false}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {live.coords && (
                <>
                  <Marker position={[live.coords.latitude, live.coords.longitude]} icon={L.divIcon({ html: '<div style="width:14px;height:14px;background:#0C3B2E;border:2px solid white;border-radius:9999px;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>', iconSize: [14, 14] })} />
                  <Circle center={[live.coords.latitude, live.coords.longitude]} radius={live.coords.accuracy || 20} pathOptions={{ color: '#0C3B2E', fillColor: '#0C3B2E', fillOpacity: 0.12, weight: 1 }} />
                  {live.points.length > 1 && <Polyline positions={live.points.map((p) => [p.latitude, p.longitude])} pathOptions={{ color: '#0C3B2E', weight: 3, opacity: 0.6 }} />}
                  <Recenter coords={live.coords} key={recenterKey} />
                </>
              )}
            </MapContainer>
          </div>
          <div className="p-2 flex justify-end">
            <button onClick={() => setRecenterKey((k) => k + 1)} className="flex items-center gap-1 text-xs font-bold bg-white border border-[#e4eae4] rounded-full px-3 py-1.5 shadow-sm hover:bg-[#f5f7f5]">
              <Crosshair size={12} /> Recenter
            </button>
          </div>
        </div>
      )}

      {/* Field Kit Quick Access */}
      <div className="bg-white border border-[#e4eae4] rounded-2xl p-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5"><Package size={16} className="text-[#0C3B2E]" /> Field Kit</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {(() => {
              try {
                const raw = localStorage.getItem(`geofarm_kit_before_${visitId}`);
                const obj = raw ? JSON.parse(raw) : {};
                const c = Object.values(obj).filter(Boolean).length;
                return c === 11 ? '✓ Ready for field visit' : `${c} / 11 ready`;
              } catch { return 'View Checklist'; }
            })()}
          </p>
        </div>
        <button onClick={() => setShowKit((v) => !v)} className="text-xs font-bold bg-[#0C3B2E] text-white rounded-full px-3 py-1.5">
          {showKit ? 'Hide' : 'View Checklist'}
        </button>
      </div>

      {showKit && (
        <FieldKitChecklist visitId={visitId} autoDuring={autoDuring} autoAfter={{ 'Visit ended': visit.status === 'Completed' }} onReady={(mode) => { if (mode === 'ready' || mode === 'anyway') handleStartVisit(); }} />
      )}

      {!isActiveVisit && !checkedIn ? (
        <button onClick={handleStartVisit} className="w-full bg-[#0C3B2E] hover:bg-[#12503d] text-white font-bold py-3 rounded-2xl shadow-sm">
          Start Field Visit
        </button>
      ) : null}

      <div className="bg-white border border-[#e4eae4] rounded-2xl p-4">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-[#0C3B2E]/10 text-[#0C3B2E] flex items-center justify-center"><ClipboardList size={16} /></span>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Visit Summary</h3>
            <p className="text-xs text-gray-500">{caseTitle} · {farmer}</p>
          </div>
          <span className={`ml-auto text-[11px] font-bold rounded-full px-2 py-1 border ${STATUS_STYLE[visit.status]}`}>{visit.status}</span>
        </div>
        <dl className="grid grid-cols-2 gap-2 text-sm mt-3 bg-[#f5f7f5] border border-[#e4eae4] rounded-xl p-3">
          <dt className="text-gray-500">Farmer</dt><dd className="font-semibold text-gray-900 text-right">{farmer}</dd>
          <dt className="text-gray-500">Location</dt><dd className="font-semibold text-gray-900 text-right">{location}</dd>
          <dt className="text-gray-500">Crop</dt><dd className="font-semibold text-gray-900 text-right">{crop}</dd>
        </dl>
      </div>

      {/* Farm Check-in — keep existing mock but show live status when available */}
      <div className="bg-white border border-[#e4eae4] rounded-2xl p-4">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5"><MapPin size={16} className="text-[#0C3B2E]" /> Farm Check-in</h3>
        {!checkedIn ? (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-gray-500">Tap to verify you are at the field. Live GPS will be used when available.</p>
            <button onClick={handleStartVisit} className="w-full bg-[#0C3B2E] text-white font-bold py-3 rounded-xl">Check In at Farm</button>
            <p className="text-[11px] text-center text-gray-400">Demo / Mock verification — no real GPS used if permission denied.</p>
          </div>
        ) : (
          <div className="mt-2 bg-green-50 border border-green-200 rounded-xl p-3">
            <p className="text-sm font-bold text-green-800 flex items-center gap-1.5"><CheckCircle2 size={14} /> Farm visit verified</p>
            {visit.checkedInAt && <p className="text-xs text-green-700">Checked in: {visit.checkedInAt}</p>}
            {live.coords && <p className="text-xs text-green-700">Live: {live.coords.latitude.toFixed(5)}, {live.coords.longitude.toFixed(5)} ±{Math.round(live.coords.accuracy)}m</p>}
          </div>
        )}
      </div>

      {checkedIn && (
        <div className="bg-white border border-[#e4eae4] rounded-2xl p-4">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5"><NotebookPen size={16} className="text-[#0C3B2E]" /> Field Observation</h3>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mt-3 mb-2">Symptoms observed</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {symptomOptions.map((s) => (
              <button key={s} onClick={() => toggleSymptom(s)} className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${selectedSymptoms.includes(s) ? 'bg-[#0C3B2E] text-white border-[#0C3B2E]' : 'bg-white border-[#e4eae4] text-gray-700'}`}>{s}</button>
            ))}
          </div>
          <textarea value={notes} onChange={handleNotes} rows={3} placeholder="Describe what you observed during the field visit..." className="w-full px-3 py-2.5 text-sm border border-[#e4eae4] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#0C3B2E]/20" />
          {!showEvidence ? (
            <button onClick={() => setShowEvidence(true)} className="mt-3 w-full bg-[#0C3B2E] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">Continue to Evidence <ArrowRight size={16} /></button>
          ) : (
            <EvidenceSection visitId={visitId} caseTitle={caseTitle} farmer={farmer} location={location} />
          )}
        </div>
      )}

      {isActiveVisit && (
        <button onClick={handleEndVisit} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-2xl">
          End Visit
        </button>
      )}

      <div className="bg-white border border-[#e4eae4] rounded-2xl p-4">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5"><Package size={16} className="text-[#0C3B2E]" /> Field Kit Checklist</h3>
        <p className="text-xs text-gray-500">Quick check before you finish</p>
        <div className="mt-3">
          <FieldKitChecklist visitId={visitId} autoDuring={autoDuring} autoAfter={{ 'Visit ended': visit.status === 'Completed' }} />
        </div>
      </div>
    </div>
  );
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_PHOTOS = 5;

function readAsPhoto(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name: file.name, type: file.type, size: file.size, dataUrl: reader.result, description: '', capturedAt: new Date().toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) });
    reader.readAsDataURL(file);
  });
}

function EvidenceSection({ visitId, caseTitle, farmer, location }) {
  const { visits, addVisitPhotos, updateVisitPhoto, removeVisitPhoto } = useScout();
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [warning, setWarning] = useState('');
  const fileRef = useRef(null);
  const photos = visits[visitId]?.photos || [];
  const full = photos.length >= MAX_PHOTOS;
  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []).filter((f) => ACCEPTED_TYPES.includes(f.type));
    e.target.value = '';
    if (!files.length) return;
    const picked = files.slice(0, Math.max(0, MAX_PHOTOS - photos.length));
    if (!picked.length) return;
    const objs = await Promise.all(picked.map(readAsPhoto));
    addVisitPhotos(visitId, objs);
    setWarning('');
  };
  const handleContinue = () => {
    if (photos.length === 0) setWarning('Add at least one field photo before continuing.');
    setShowAnalysis(true);
  };
  return (
    <div className="mt-4 border-t border-[#e4eae4] pt-4 space-y-4">
      <div>
        <h4 className="text-sm font-bold text-gray-900">Field Evidence</h4>
        <p className="text-xs text-gray-500 mt-0.5">Capture evidence from the field</p>
      </div>
      <dl className="grid grid-cols-2 gap-2 text-sm bg-[#f5f7f5] border border-[#e4eae4] rounded-xl p-3">
        <dt className="text-gray-500">Case</dt><dd className="font-semibold text-gray-900 text-right">{caseTitle}</dd>
        <dt className="text-gray-500">Farmer</dt><dd className="font-semibold text-gray-900 text-right">{farmer}</dd>
        <dt className="text-gray-500">Location</dt><dd className="font-semibold text-gray-900 text-right">{location}</dd>
      </dl>
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-gray-500">Evidence collected: {photos.length} / {MAX_PHOTOS}</p>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleFiles} />
        <button onClick={() => fileRef.current?.click()} disabled={full} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-[#0C3B2E] text-white hover:bg-[#12503d] disabled:opacity-40"><Upload size={14} /> Take / Upload Photo</button>
      </div>
      {photos.length === 0 ? (
        <div className="border-2 border-dashed border-[#e4eae4] rounded-2xl py-8 px-4 text-center">
          <p className="text-2xl">📷</p>
          <p className="text-sm font-bold text-gray-900 mt-2">No field evidence added yet.</p>
          <p className="text-xs text-gray-500 mt-1">Add photos showing symptoms, pests, leaves, stems or crop damage.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {photos.map((p, i) => (
            <div key={p.id} className="border border-[#e4eae4] rounded-xl overflow-hidden bg-white">
              <div className="relative">
                <img src={p.dataUrl} alt={`Field evidence ${i + 1}`} className="aspect-square w-full object-cover" />
                <button onClick={() => removeVisitPhoto(visitId, p.id)} title="Remove photo" className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"><X size={13} /></button>
                <span className="absolute bottom-1.5 left-1.5 text-[10px] font-bold bg-black/60 text-white px-1.5 py-0.5 rounded">Photo {i + 1}</span>
              </div>
              <div className="p-2 space-y-1.5">
                <input value={p.description} onChange={(e) => updateVisitPhoto(visitId, p.id, { description: e.target.value })} placeholder="White powder visible on leaf" className="w-full text-xs border border-[#e4eae4] rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0C3B2E]/20" />
                <p className="text-[10px] text-green-700 font-semibold">✓ Timestamp attached • {p.capturedAt}</p>
                <p className="text-[10px] text-gray-500">📍 Location metadata — Demo location attached</p>
              </div>
            </div>
          ))}
        </div>
      )}
      {warning && <p className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">{warning}</p>}
      {!showAnalysis ? (
        <button onClick={handleContinue} className="w-full bg-[#0C3B2E] hover:bg-[#12503d] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">Continue to Analysis <ArrowRight size={16} /></button>
      ) : (
        <div className="bg-[#f5f7f5] border border-dashed border-[#e4eae4] rounded-2xl p-5 text-center">
          <Camera size={24} className="mx-auto text-gray-500" />
          <p className="text-sm font-bold text-gray-900 mt-2">Analysis</p>
          <p className="text-xs text-gray-500 mt-1">Your {photos.length} photo(s) and descriptions are saved with this visit.</p>
        </div>
      )}
    </div>
  );
}