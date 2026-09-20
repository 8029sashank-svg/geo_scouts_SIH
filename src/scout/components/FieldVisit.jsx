import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, ArrowRight, MapPin, CheckCircle2, ClipboardList, Camera, Upload, X, Package,
  Loader2, Bug, Thermometer, Droplets, Waves, CloudRain, ShieldCheck, XCircle,
  HelpCircle, ScanLine, ClipboardCheck, PartyPopper, Wifi, WifiOff, Pencil,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { Card, CardHeader } from '../../components/ui/Card.jsx';
import { useScout } from '../ScoutContext.jsx';
import { RiskChip } from './Chips.jsx';
import { SYMPTOM_OPTIONS, NEARBY_CASES, NEARBY_CASE_DETAILS } from '../mockData.js';
import { simulateLeafAnalysis, simulateTrapScan, computeFieldRisk, computeDataQuality } from '../utils/aiSim.js';

/**
 * Geo-Farm — unified Field Visit workflow.
 *
 * One coherent process (this used to be two separate, overlapping flows:
 * FieldVisit.jsx and FieldSurvey.jsx). Every entry point — Mission Detail's
 * "Start Field Visit" and My Assignments' "Start Field Visit" — now opens
 * this same component.
 *
 * Steps: Check-in -> Crop & Field -> Observation -> Evidence -> Smart Trap
 * & Conditions -> Severity & Spread -> AI Preliminary Assessment ->
 * Scout Verification -> Review & Submit.
 *
 * Everything here is mock/simulated: no real GPS, no real AI, no real
 * upload. That is stated plainly in the UI rather than implied.
 */

const STEPS = [
  'Check-in',
  'Crop & Field',
  'Observation',
  'Evidence',
  'Smart Trap',
  'Severity',
  'AI Assessment',
  'Verification',
  'Outcome',
  'Review',
];

const VISIT_OUTCOME_OPTIONS = [
  { value: 'issue_verified',      label: 'Issue Verified',         hint: 'Problem confirmed in the field.' },
  { value: 'no_issue_found',      label: 'No Issue Found',         hint: 'Field visited; no significant problem observed.' },
  { value: 'inconclusive',        label: 'Symptoms Inconclusive',  hint: 'Symptoms present but uncertain.' },
  { value: 'farmer_unavailable',  label: 'Farmer Unavailable',     hint: 'Could not meet the farmer at the time of visit.' },
  { value: 'field_inaccessible',  label: 'Field Inaccessible',     hint: 'Could not reach the field.' },
  { value: 'revisit_required',    label: 'Revisit Required',       hint: 'More information needed; will revisit.' },
];

const EVIDENCE_CATEGORIES = [
  { key: 'field', label: 'Whole field / crop view', placeholder: 'Wide view of the affected block' },
  { key: 'plant', label: 'Affected plant / crop', placeholder: 'e.g. Affected section near eastern boundary' },
  { key: 'symptom', label: 'Close-up of suspected symptom', placeholder: 'e.g. White powder-like patches on upper leaf surface' },
  { key: 'damage', label: 'Damage / pest / fruit evidence', placeholder: 'e.g. Visible insect damage on fruit' },
  { key: 'trap', label: 'Trap / sample evidence', placeholder: 'Trap or sample close-up (if applicable)' },
];

const AFFECTED_AREA_OPTIONS = ['Less than 5%', '5–20%', '20–50%', 'More than 50%'];
const SPREAD_OPTIONS = ['Isolated plants', 'Scattered patches', 'Widespread', 'Field-wide'];

const MAX_PHOTOS = 8;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const DEFAULT_REASON = { humidity: 65, leafWetness: 'Moderate', nearbyReports: 0 };

function readAsPhoto(file, category) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({
        id: `EV-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        category,
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl: reader.result,
        description: '',
        capturedAt: new Date().toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }),
      });
    reader.readAsDataURL(file);
  });
}

function StepDots({ step }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
      {STEPS.map((s, i) => (
        <div key={s} className={`h-1.5 rounded-full transition-all shrink-0 ${i === step ? 'w-5 bg-gov-blue' : i < step ? 'w-1.5 bg-gov-blue/50' : 'w-1.5 bg-gray-200'}`} />
      ))}
    </div>
  );
}

export default function FieldVisit({ visitId, onBack, onComplete }) {
  const { scout, missions, traps, isOnline, submitReport, addVisitPhotos, farmerAvailabilities, updateFarmerAvailability } = useScout();

  const mission = missions.find((m) => m.id === visitId);
  const nearbyCase = NEARBY_CASES.find((c) => c.id === visitId);
  const caseDetail = NEARBY_CASE_DETAILS[visitId];

  const [step, setStep] = useState(0);

  // Step 0 — check-in
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkinAt, setCheckinAt] = useState(null);
  const [kitPacked, setKitPacked] = useState({});
  const [showKit, setShowKit] = useState(false);

  // Step 8 — field visit outcome
  const [visitOutcome, setVisitOutcome] = useState(null);
  const [outcomeNote, setOutcomeNote] = useState('');

  // Step 1 — crop & field
  const [crop, setCrop] = useState(mission?.crop || nearbyCase?.crop || '');
  const [variety, setVariety] = useState(mission?.crop === 'Grapes' ? 'Thompson Seedless' : '');
  const [growthStage, setGrowthStage] = useState(mission?.cropStage || '');
  const [area, setArea] = useState('2.5');

  // Step 2 — observation
  const [condition, setCondition] = useState('Moderate stress');
  const [symptoms, setSymptoms] = useState([]);
  const [fieldNotes, setFieldNotes] = useState('');

  // Step 3 — evidence
  const [evidencePhotos, setEvidencePhotos] = useState([]);
  const fileInputRef = useRef(null);
  const [pendingCategory, setPendingCategory] = useState(null);

  // Step 4 — trap
  const [trapScanning, setTrapScanning] = useState(false);
  const [trapResult, setTrapResult] = useState(null);
  const [trapVerification, setTrapVerification] = useState(null);

  // Step 5 — severity
  const [affectedArea, setAffectedArea] = useState(null);
  const [spread, setSpread] = useState(null);

  // Step 6 — AI
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  // Step 7 — scout verification (kept separate from the AI result)
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [verificationNote, setVerificationNote] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);

  const caseTitle = caseDetail?.problem || mission?.title || nearbyCase?.issue || visitId;
  const farmer = nearbyCase?.farmer || null;
  const location = mission?.location || nearbyCase?.village || '—';
  const fieldName = mission?.fieldName || location;
  const trap = mission?.trapId ? traps[mission.trapId] : null;
  const reason = mission?.reason || DEFAULT_REASON;
  const distanceKm = mission?.distanceKm ?? nearbyCase?.distanceKm ?? null;

  const symptomOptions = useMemo(() => {
    const caseSymptoms = caseDetail?.symptoms || [];
    return [...new Set([...caseSymptoms, ...SYMPTOM_OPTIONS])];
  }, [caseDetail]);

  const toggleSymptom = (s) => {
    setSymptoms((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const handleCheckIn = () => {
    setCheckedIn(true);
    setCheckinAt(new Date().toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }));
  };

  const openPickerFor = (categoryKey) => {
    setPendingCategory(categoryKey);
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []).filter((f) => ACCEPTED_TYPES.includes(f.type));
    e.target.value = '';
    if (!files.length || !pendingCategory) return;
    const remaining = MAX_PHOTOS - evidencePhotos.length;
    const toAdd = files.slice(0, Math.max(0, remaining));
    const objs = await Promise.all(toAdd.map((f) => readAsPhoto(f, pendingCategory)));
    setEvidencePhotos((prev) => [...prev, ...objs]);
    setPendingCategory(null);
  };

  const removeEvidencePhoto = (id) => {
    setEvidencePhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const updateEvidenceDescription = (id, description) => {
    setEvidencePhotos((prev) => prev.map((p) => (p.id === id ? { ...p, description } : p)));
  };

  const runTrapScan = () => {
    setTrapScanning(true);
    setTimeout(() => {
      setTrapResult(simulateTrapScan(trap?.previousTotal ?? 18));
      setTrapScanning(false);
    }, 1000);
  };

  const runAiAssessment = () => {
    setAiLoading(true);
    setTimeout(() => {
      setAiResult(simulateLeafAnalysis());
      setAiLoading(false);
    }, 900);
  };

  const risk = useMemo(() => computeFieldRisk({
    trapChangePct: trapResult?.changePct ?? 0,
    humidity: reason.humidity,
    hasSymptoms: symptoms.length > 0 && !symptoms.includes('No visible symptoms'),
    nearbyReports: reason.nearbyReports,
  }), [trapResult, reason, symptoms]);

  const dataQuality = useMemo(() => computeDataQuality({
    gps: checkedIn,
    timestamp: checkedIn,
    requiredFieldsComplete: !!crop && !!growthStage && symptoms.length > 0,
    photoQualityGood: evidencePhotos.length > 0,
    trapVerified: trap ? trapVerification !== null : true,
    severityRecorded: !!affectedArea && !!spread,
  }), [checkedIn, crop, growthStage, symptoms, evidencePhotos, trap, trapVerification, affectedArea, spread]);

  const canSubmit = checkedIn && symptoms.length > 0 && evidencePhotos.length > 0 && !!affectedArea && !!spread && !!verificationStatus && !!visitOutcome;

  const missingItems = useMemo(() => {
    const missing = [];
    if (!checkedIn) missing.push('Check-in (Step 1)');
    if (symptoms.length === 0) missing.push('at least one symptom (Step 3)');
    if (evidencePhotos.length === 0) missing.push('at least one evidence photo (Step 4)');
    if (!affectedArea || !spread) missing.push('affected area & spread (Step 6)');
    if (!verificationStatus) missing.push('Scout Verification (Step 8)');
    if (!visitOutcome) missing.push('Field Visit Outcome (Step 9)');
    return missing;
  }, [checkedIn, symptoms, evidencePhotos, affectedArea, spread, verificationStatus, visitOutcome]);

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitting(true);
    if (evidencePhotos.length > 0) addVisitPhotos(visitId, evidencePhotos);
    const missionLike = mission || { id: visitId, location, crop, coords: null };
    const outcomeLabel = VISIT_OUTCOME_OPTIONS.find((o) => o.value === visitOutcome)?.label || visitOutcome;
    setTimeout(() => {
      const report = submitReport(missionLike, {
        finding: aiResult ? aiResult.primary.label : 'Field observation',
        risk: risk.level,
        dataQuality: dataQuality.score,
        aiAssessment: aiResult ? { diagnosis: aiResult.primary.label, confidence: aiResult.primary.confidence, alternatives: aiResult.alternatives } : null,
        scoutVerification: verificationStatus ? { status: verificationStatus, note: verificationNote } : null,
        visitOutcome,
        outcomeLabel,
        outcomeNote: outcomeNote.trim() || null,
        severity: (affectedArea || spread) ? { affectedArea, spread } : null,
        trapCount: trapResult?.total ?? null,
        trend: trapResult ? `+${trapResult.changePct}%` : null,
        photos: evidencePhotos.length,
        evidence: evidencePhotos,
        symptoms,
        condition,
        fieldNotes,
        variety,
        growthStage,
        area,
        timeline: [
          { time: 'now', icon: 'pin', label: 'Field check-in' },
          { time: 'now', icon: 'camera', label: `${evidencePhotos.length} evidence photo(s) captured` },
          ...(trap ? [{ time: 'now', icon: 'trap', label: 'Smart trap scanned' }] : []),
          ...(aiResult ? [{ time: 'now', icon: 'ai', label: 'AI preliminary assessment completed' }] : []),
          { time: 'now', icon: 'grad', label: 'Scout verification recorded' },
          { time: 'now', icon: 'outcome', label: `Field Visit Outcome: ${outcomeLabel}` },
          { time: 'now', icon: 'chart', label: 'Risk recalculated' },
          { time: 'now', icon: 'cloud', label: 'Report uploaded' },
          { time: 'now', icon: 'gov', label: 'Awaiting officer verification' },
        ],
      });
      setSubmitting(false);
      setSubmitted(report);
    }, 1100);
  };

  const goToStep = (i) => setStep(i);

  if (!mission && !nearbyCase) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-gov-textSec">
          <ArrowLeft size={16} /> Back
        </button>
        <p className="text-sm text-gov-textSec">Visit not found.</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-md mx-auto text-center py-10 space-y-5">
        <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto">
          <CheckCircle2 size={34} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gov-navy">Field Report Submitted</h1>
          <p className="text-sm text-gov-textSec mt-1">This report has been sent to the assigned Agriculture Officer for verification.</p>
        </div>
        <Card className="text-left">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-gov-textSec">Report ID</dt><dd className="font-bold text-gov-navy">{submitted.id}</dd></div>
            <div className="flex justify-between"><dt className="text-gov-textSec">Status</dt><dd className="font-bold text-purple-700">{submitted.status}</dd></div>
            <div className="flex justify-between"><dt className="text-gov-textSec">Field risk</dt><dd><RiskChip level={risk.level} size="sm" /></dd></div>
          </dl>
        </Card>
        <button onClick={() => onComplete(submitted)} className="w-full bg-gov-blue hover:bg-gov-navy text-white font-bold py-3 rounded-lg">
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-4 pb-4">
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleFileSelect} />

      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-gov-textSec hover:text-gov-navy">
          <ArrowLeft size={16} /> Exit
        </button>
        <span className="text-xs font-bold text-gov-textSec">{STEPS[step]} · {step + 1}/{STEPS.length}</span>
      </div>
      <StepDots step={step} />

      {/* STEP 0: Check-in */}
      {step === 0 && (
        <Card>
          <CardHeader icon={ClipboardList} title="Field Visit" subtitle={caseTitle} />
          <dl className="grid grid-cols-2 gap-y-2.5 text-sm mb-4">
            <dt className="text-gov-textSec">Mission / Case</dt>
            <dd className="font-semibold text-gov-navy text-right">{visitId}</dd>
            {farmer && (<><dt className="text-gov-textSec">Farmer</dt><dd className="font-semibold text-gov-navy text-right">{farmer}</dd></>)}
            <dt className="text-gov-textSec">Crop</dt>
            <dd className="font-semibold text-gov-navy text-right">{crop || '—'}</dd>
            <dt className="text-gov-textSec">Field / Location</dt>
            <dd className="font-semibold text-gov-navy text-right">{fieldName}</dd>
            <dt className="text-gov-textSec">Student</dt>
            <dd className="font-semibold text-gov-navy text-right">{scout.name}</dd>
            <dt className="text-gov-textSec">Date</dt>
            <dd className="font-semibold text-gov-navy text-right">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</dd>
          </dl>

          <div className="border-t border-gray-100 pt-3 pb-2">
            <label className="block text-xs font-bold text-gov-textSec uppercase tracking-wide mb-1.5">
              Farmer Availability
            </label>
            <select 
              value={farmerAvailabilities[mission?.id] || ''}
              onChange={(e) => updateFarmerAvailability(mission?.id, e.target.value)}
              className="w-full bg-white border border-gov-border rounded-lg p-2.5 text-sm focus:outline-none focus:border-gov-blue text-gov-navy font-semibold"
            >
              <option value="" disabled>Select availability...</option>
              <option value="Available">Available</option>
              <option value="Unavailable">Unavailable</option>
              <option value="Not Contacted">Not Contacted</option>
              <option value="Unable to Reach">Unable to Reach</option>
            </select>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-bold text-gov-textSec uppercase tracking-wide mb-2">Farm / Location Check-in</p>
            {!checkedIn ? (
              <div className="space-y-3">
                {distanceKm != null && (
                  <p className="text-xs text-gov-textSec">Assigned field is approximately <span className="font-semibold text-gov-navy">{distanceKm} km</span> away.</p>
                )}
                <button
                  onClick={handleCheckIn}
                  className="w-full bg-gov-blue hover:bg-gov-navy text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <MapPin size={16} /> Check In at Farm
                </button>
                <p className="text-[11px] text-gov-textSec text-center">Simulated check-in — this demo does not use real GPS.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm font-bold text-green-800 flex items-center gap-1.5"><CheckCircle2 size={15} /> Location verified (simulated)</p>
                  <div className="grid grid-cols-2 gap-y-1.5 text-xs text-green-800 mt-2">
                    <span>Checked in</span><span className="font-semibold text-right">{checkinAt}</span>
                    <span>Assigned field</span><span className="font-semibold text-right">{fieldName}</span>
                    {distanceKm != null && (<><span>Distance to field</span><span className="font-semibold text-right">{distanceKm} km</span></>)}
                    <span>Connectivity</span>
                    <span className="font-semibold text-right flex items-center justify-end gap-1">{isOnline ? <Wifi size={12} /> : <WifiOff size={12} />} {isOnline ? 'Online' : 'Offline capable'}</span>
                  </div>
                </div>
                <p className="text-[11px] text-gov-textSec text-center">Simulated check-in — this demo does not use real GPS.</p>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowKit((v) => !v)}
            className="w-full mt-4 flex items-center justify-between text-xs font-bold text-gov-textSec border-t border-gray-100 pt-3"
          >
            <span className="flex items-center gap-1.5"><Package size={13} /> Field Kit Checklist (optional)</span>
            <span>{Object.values(kitPacked).filter(Boolean).length}/{KIT_ITEMS.length} packed</span>
          </button>
          {showKit && (
            <div className="space-y-1.5 mt-2">
              {KIT_ITEMS.map((item) => (
                <button
                  key={item}
                  onClick={() => setKitPacked((prev) => ({ ...prev, [item]: !prev[item] }))}
                  className="w-full flex items-center gap-2.5 text-left text-sm border border-gov-border rounded-lg px-3 py-2 hover:border-gov-blue"
                >
                  <span className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${kitPacked[item] ? 'bg-gov-blue border-gov-blue text-white' : 'bg-white border-gov-border text-transparent'}`}>
                    <CheckCircle2 size={14} />
                  </span>
                  <span className={kitPacked[item] ? 'text-gov-textSec line-through' : 'text-gov-navy font-medium'}>{item}</span>
                </button>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* STEP 1: Crop & Field details */}
      {step === 1 && (
        <Card>
          <CardHeader title="Crop & Field Details" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Crop"><input className="input" value={crop} onChange={(e) => setCrop(e.target.value)} /></Field>
            <Field label="Variety"><input className="input" value={variety} onChange={(e) => setVariety(e.target.value)} /></Field>
            <Field label="Growth Stage"><input className="input" value={growthStage} onChange={(e) => setGrowthStage(e.target.value)} /></Field>
            <Field label="Field area (acres)"><input className="input" value={area} onChange={(e) => setArea(e.target.value)} /></Field>
          </div>
        </Card>
      )}

      {/* STEP 2: Observation & symptoms */}
      {step === 2 && (
        <Card>
          <CardHeader title="Field Observation & Symptoms" subtitle="What did you observe? This is a field observation, not a confirmed diagnosis." />
          <h4 className="text-sm font-bold text-gov-navy mb-2">Crop Condition</h4>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {['Healthy', 'Mild stress', 'Moderate stress', 'Severe stress'].map((c) => (
              <button
                key={c}
                onClick={() => setCondition(c)}
                className={`text-left text-sm font-medium px-3 py-2 rounded-lg border ${condition === c ? 'bg-gov-blue/10 border-gov-blue text-gov-blue font-bold' : 'border-gov-border text-gov-text'}`}
              >
                {c}
              </button>
            ))}
          </div>

          <h4 className="text-sm font-bold text-gov-navy mb-2">Symptoms Observed</h4>
          <div className="flex flex-wrap gap-2 mb-4">
            {symptomOptions.map((s) => (
              <button
                key={s}
                onClick={() => toggleSymptom(s)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${symptoms.includes(s) ? 'bg-gov-blue text-white border-gov-blue' : 'bg-white text-gov-text border-gov-border'}`}
              >
                {s}
              </button>
            ))}
          </div>

          <label className="block text-xs font-bold text-gov-textSec uppercase tracking-wide mb-1.5">Field Notes</label>
          <textarea
            value={fieldNotes}
            onChange={(e) => setFieldNotes(e.target.value)}
            rows={4}
            placeholder="Describe what you observed in the field."
            className="w-full px-3 py-2.5 text-sm border border-gov-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gov-blue/30 focus:border-gov-blue"
          />
        </Card>
      )}

      {/* STEP 3: Evidence */}
      {step === 3 && (
        <Card>
          <CardHeader icon={Camera} title="Evidence Collection" subtitle={`${evidencePhotos.length} / ${MAX_PHOTOS} photos • prototype storage only — saved on this device and, once synced, to the local demo server. No cloud image storage.`} />
          <div className="space-y-4">
            {EVIDENCE_CATEGORIES.map((cat) => {
              const photosInCat = evidencePhotos.filter((p) => p.category === cat.key);
              return (
                <div key={cat.key} className="border border-gov-border rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold text-gov-navy">{cat.label}</p>
                    <button
                      onClick={() => openPickerFor(cat.key)}
                      disabled={evidencePhotos.length >= MAX_PHOTOS}
                      className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-gov-blue text-white hover:bg-gov-navy disabled:opacity-40"
                    >
                      <Upload size={12} /> Add
                    </button>
                  </div>
                  {photosInCat.length === 0 ? (
                    <p className="text-xs text-gov-textSec">No photo added yet.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {photosInCat.map((p, i) => (
                        <div key={p.id} className="border border-gov-border rounded-lg overflow-hidden bg-white">
                          <div className="relative">
                            <img src={p.dataUrl} alt={`${cat.label} ${i + 1}`} className="aspect-square w-full object-cover" />
                            <button
                              onClick={() => removeEvidencePhoto(p.id)}
                              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-600"
                            >
                              <X size={12} />
                            </button>
                          </div>
                          <input
                            value={p.description}
                            onChange={(e) => updateEvidenceDescription(p.id, e.target.value)}
                            placeholder={cat.placeholder}
                            className="w-full text-[11px] border-0 border-t border-gov-border px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gov-blue/30"
                          />
                          <p className="text-[9px] text-green-700 font-semibold px-2 pb-1.5">✓ {p.capturedAt}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* STEP 4: Smart Trap & Field Conditions */}
      {step === 4 && (
        <Card>
          <CardHeader icon={ScanLine} title="Smart Trap & Field Conditions" subtitle="Automatically available readings" />
          {trap ? (
            <div className="mb-5">
              <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                <Info label="Trap ID" value={trap.id} />
                <Info label="Trap type" value={trap.type} />
                <Info label="Last scan" value={trap.lastScan} />
                <Info label="Battery" value={`${trap.battery}%`} />
              </div>

              {!trapResult && (
                <button
                  onClick={runTrapScan}
                  disabled={trapScanning}
                  className="w-full bg-gov-blue hover:bg-gov-navy text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2"
                >
                  {trapScanning ? <><Loader2 size={16} className="animate-spin" /> Scanning trap…</> : 'Scan Trap'}
                </button>
              )}

              {trapResult && (
                <div className="space-y-3">
                  <div className="border border-gov-border rounded-xl p-4">
                    <p className="text-xs font-bold text-gov-textSec uppercase tracking-wide mb-2">Pest Count</p>
                    <div className="space-y-1.5 text-sm">
                      {Object.entries(trapResult.counts).map(([k, v]) => (
                        <div key={k} className="flex justify-between">
                          <span className="text-gov-text flex items-center gap-1.5"><Bug size={13} className="text-gov-textSec" /> {k}</span>
                          <span className="font-bold text-gov-navy">{v}</span>
                        </div>
                      ))}
                      <div className="flex justify-between pt-2 border-t border-gray-100 font-bold">
                        <span className="text-gov-navy">Total</span>
                        <span className="text-gov-navy">{trapResult.total}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-gov-bg rounded-lg p-2 border border-gov-border"><p className="text-gov-textSec">Previous</p><p className="font-bold text-gov-navy">{trapResult.previousTotal}</p></div>
                    <div className="bg-gov-bg rounded-lg p-2 border border-gov-border"><p className="text-gov-textSec">Current</p><p className="font-bold text-gov-navy">{trapResult.total}</p></div>
                    <div className="bg-red-50 rounded-lg p-2 border border-red-200"><p className="text-red-700">Change</p><p className="font-bold text-red-700">+{trapResult.changePct}%</p></div>
                  </div>

                  <div className="h-28">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[...trap.history, { day: 'Now', count: trapResult.total }]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                        <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" width={24} />
                        <Tooltip />
                        <Line type="monotone" dataKey="count" stroke="#e65100" strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-gov-textSec mb-2">Does this trap count look correct?</p>
                    <div className="grid grid-cols-3 gap-2">
                      <VerifyBtn active={trapVerification === 'correct'} onClick={() => setTrapVerification('correct')} icon={ShieldCheck} label="Looks correct" color="green" />
                      <VerifyBtn active={trapVerification === 'incorrect'} onClick={() => setTrapVerification('incorrect')} icon={XCircle} label="Incorrect count" color="red" />
                      <VerifyBtn active={trapVerification === 'unsure'} onClick={() => setTrapVerification('unsure')} icon={HelpCircle} label="Not sure" color="amber" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gov-textSec mb-5">No smart trap assigned to this visit.</p>
          )}

          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-bold text-gov-textSec uppercase tracking-wide mb-2">Field Conditions (sensor / mock reading)</p>
            <div className="grid grid-cols-2 gap-3">
              <Reading icon={Thermometer} label="Temperature" value="28.4°C" />
              <Reading icon={Droplets} label="Humidity" value={`${reason.humidity}%`} />
              <Reading icon={Waves} label="Soil Moisture" value="62%" />
              <Reading icon={Waves} label="Leaf Wetness" value={reason.leafWetness} />
              <Reading icon={CloudRain} label="Rainfall (24h)" value="4.2 mm" />
            </div>
          </div>
        </Card>
      )}

      {/* STEP 5: Severity & Spread */}
      {step === 5 && (
        <Card>
          <CardHeader title="Severity & Spread" subtitle="Your field-scout estimate of how widespread this looks" />
          <h4 className="text-sm font-bold text-gov-navy mb-2">Affected Area</h4>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {AFFECTED_AREA_OPTIONS.map((a) => (
              <button
                key={a}
                onClick={() => setAffectedArea(a)}
                className={`text-left text-sm font-medium px-3 py-2 rounded-lg border ${affectedArea === a ? 'bg-gov-blue/10 border-gov-blue text-gov-blue font-bold' : 'border-gov-border text-gov-text'}`}
              >
                {a}
              </button>
            ))}
          </div>
          <h4 className="text-sm font-bold text-gov-navy mb-2">Spread / Distribution</h4>
          <div className="grid grid-cols-2 gap-2">
            {SPREAD_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setSpread(s)}
                className={`text-left text-sm font-medium px-3 py-2 rounded-lg border ${spread === s ? 'bg-gov-blue/10 border-gov-blue text-gov-blue font-bold' : 'border-gov-border text-gov-text'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* STEP 6: AI Preliminary Assessment */}
      {step === 6 && (
        <Card>
          <CardHeader title="AI Preliminary Assessment" />
          {evidencePhotos.length === 0 && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
              Add at least one evidence photo in Step 4 for a more meaningful assessment.
            </p>
          )}
          {!aiResult && !aiLoading && (
            <button onClick={runAiAssessment} className="w-full bg-gov-blue hover:bg-gov-navy text-white font-bold py-2.5 rounded-lg">
              Run AI Preliminary Assessment
            </button>
          )}
          {aiLoading && (
            <div className="flex items-center justify-center gap-2 py-4 text-gov-blue text-sm font-semibold">
              <Loader2 size={16} className="animate-spin" /> Running on-device analysis…
            </div>
          )}
          {aiResult && (
            <div className="border border-gov-border rounded-xl p-4 space-y-3">
              <p className="text-xs font-bold text-gov-textSec uppercase tracking-wide">Possible issue</p>
              <div>
                <p className="text-base font-bold text-gov-navy">{aiResult.primary.label}</p>
                <p className="text-sm text-gov-textSec">Confidence: {aiResult.primary.confidence}%</p>
              </div>
              <div className="text-xs text-gov-textSec space-y-0.5">
                {aiResult.alternatives.map((a) => (<p key={a.label}>{a.label} — {a.confidence}%</p>))}
              </div>
              <p className="text-[11px] bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-3 py-2">
                This is a preliminary assessment only — it requires field verification and Agriculture Officer review, not a confirmed diagnosis.
              </p>
            </div>
          )}
        </Card>
      )}

      {/* STEP 7: Scout Verification */}
      {step === 7 && (
        <Card>
          <CardHeader title="Scout Verification" subtitle="Record your own ground-truth assessment, separate from the AI result" />
          {aiResult ? (
            <p className="text-xs text-gov-textSec mb-3">AI suggested <span className="font-semibold text-gov-navy">{aiResult.primary.label}</span> ({aiResult.primary.confidence}%). Does your field observation support that?</p>
          ) : (
            <p className="text-xs text-gov-textSec mb-3">No AI assessment was run. You can still record your own field verification.</p>
          )}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <VerifyBtn active={verificationStatus === 'consistent'} onClick={() => setVerificationStatus('consistent')} icon={ShieldCheck} label="Looks consistent" color="green" />
            <VerifyBtn active={verificationStatus === 'incorrect'} onClick={() => setVerificationStatus('incorrect')} icon={XCircle} label="Looks incorrect" color="red" />
            <VerifyBtn active={verificationStatus === 'unsure'} onClick={() => setVerificationStatus('unsure')} icon={HelpCircle} label="Not sure" color="amber" />
          </div>
          <label className="block text-xs font-bold text-gov-textSec uppercase tracking-wide mb-1.5">Verification note (optional)</label>
          <textarea
            value={verificationNote}
            onChange={(e) => setVerificationNote(e.target.value)}
            rows={3}
            placeholder="e.g. Observed symptoms are consistent with the AI result."
            className="w-full px-3 py-2.5 text-sm border border-gov-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gov-blue/30 focus:border-gov-blue"
          />
        </Card>
      )}

      {/* STEP 8 → now step 9 after inserting Outcome */}

      {/* STEP 8: Field Visit Outcome */}
      {step === 8 && (
        <Card>
          <CardHeader icon={ClipboardCheck} title="Field Visit Outcome" subtitle="Record what happened during the physical visit — separate from the AI assessment" />
          <div className="space-y-2 mb-4">
            {VISIT_OUTCOME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setVisitOutcome(opt.value)}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                  visitOutcome === opt.value
                    ? 'bg-gov-blue/10 border-gov-blue'
                    : 'border-gov-border hover:border-gov-blue/50 bg-white'
                }`}
              >
                <p className={`text-sm font-bold ${visitOutcome === opt.value ? 'text-gov-blue' : 'text-gov-navy'}`}>{opt.label}</p>
                <p className="text-xs text-gov-textSec mt-0.5">{opt.hint}</p>
              </button>
            ))}
          </div>
          <label className="block text-xs font-bold text-gov-textSec uppercase tracking-wide mb-1.5">Outcome Notes (optional)</label>
          <textarea
            value={outcomeNote}
            onChange={(e) => setOutcomeNote(e.target.value)}
            rows={3}
            placeholder="Briefly describe what happened during the visit."
            className="w-full px-3 py-2.5 text-sm border border-gov-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gov-blue/30 focus:border-gov-blue"
          />
        </Card>
      )}

      {/* STEP 9: Review */}
      {step === 9 && (
        <Card>
          <CardHeader icon={ClipboardCheck} title="Review Field Report" subtitle="This is what the Agriculture Officer will see" />

          <ReviewSection title="Field Visit" onEdit={() => goToStep(0)}>
            <Row label="Mission / Case" value={visitId} />
            <Row label="Student" value={scout.name} />
            <Row label="Check-in" value={checkinAt || '—'} />
            <Row label="Location" value={fieldName} />
          </ReviewSection>

          <ReviewSection title="Crop" onEdit={() => goToStep(1)}>
            <Row label="Crop" value={crop || '—'} />
            <Row label="Variety" value={variety || '—'} />
            <Row label="Growth stage" value={growthStage || '—'} />
            <Row label="Area" value={area ? `${area} acres` : '—'} />
          </ReviewSection>

          <ReviewSection title="Field Observation" onEdit={() => goToStep(2)}>
            <Row label="Crop condition" value={condition} />
            <Row label="Symptoms" value={symptoms.length ? symptoms.join(', ') : '—'} />
            {fieldNotes && <Row label="Notes" value={fieldNotes} />}
          </ReviewSection>

          <ReviewSection title="Severity" onEdit={() => goToStep(5)}>
            <Row label="Affected area" value={affectedArea || '—'} />
            <Row label="Spread" value={spread || '—'} />
          </ReviewSection>

          <ReviewSection title="AI Preliminary Assessment" onEdit={() => goToStep(6)}>
            <Row label="Result" value={aiResult ? aiResult.primary.label : 'Not run'} />
            <Row label="Confidence" value={aiResult ? `${aiResult.primary.confidence}%` : '—'} />
          </ReviewSection>

          <ReviewSection title="Scout Verification" onEdit={() => goToStep(7)}>
            <Row label="Status" value={verificationStatus ? VERIFY_LABELS[verificationStatus] : '—'} />
            {verificationNote && <Row label="Note" value={verificationNote} />}
          </ReviewSection>

          <ReviewSection title="Field Visit Outcome" onEdit={() => goToStep(8)}>
            <Row label="Outcome" value={visitOutcome ? (VISIT_OUTCOME_OPTIONS.find((o) => o.value === visitOutcome)?.label || visitOutcome) : '—'} />
            {outcomeNote.trim() && <Row label="Notes" value={outcomeNote.trim()} />}
          </ReviewSection>

          <ReviewSection title="Smart Trap / Conditions" onEdit={() => goToStep(4)}>
            <Row label="Trap count" value={trapResult ? trapResult.total : trap ? 'Not scanned' : 'No trap'} />
            {trapResult && <Row label="Trend" value={`+${trapResult.changePct}%`} />}
            <Row label="Humidity" value={`${reason.humidity}%`} />
          </ReviewSection>

          <ReviewSection title="Evidence" onEdit={() => goToStep(3)}>
            <Row label="Photos" value={evidencePhotos.length} />
            <Row label="Categories" value={[...new Set(evidencePhotos.map((p) => EVIDENCE_CATEGORIES.find((c) => c.key === p.category)?.label))].join(', ') || '—'} />
          </ReviewSection>

          <ReviewSection title="Risk" onEdit={() => goToStep(4)}>
            <div className="flex items-center justify-between">
              <dt className="text-gov-textSec">Field risk</dt>
              <dd><RiskChip level={risk.level} size="sm" /></dd>
            </div>
          </ReviewSection>

          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-green-800">Data Quality</span>
              <span className="text-lg font-bold text-green-700">{dataQuality.score}%</span>
            </div>
            <div className="mt-2 space-y-1">
              {dataQuality.checks.map((c) => (
                <p key={c.label} className={`text-[11px] flex items-center gap-1.5 ${c.pass ? 'text-green-700' : 'text-gray-400'}`}>
                  {c.pass ? <CheckCircle2 size={12} /> : <XCircle size={12} />} {c.label}
                </p>
              ))}
            </div>
          </div>

          {!canSubmit && (
            <p className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
              Complete before submitting: {missingItems.join(', ')}.
            </p>
          )}

          <p className="text-xs text-gov-textSec mb-4">This report will be sent to the assigned Agriculture Officer for verification.</p>

          <button
            onClick={handleSubmit}
            disabled={submitting || !canSubmit}
            className="w-full bg-gov-blue hover:bg-gov-navy disabled:opacity-50 text-white font-bold py-3.5 rounded-lg flex items-center justify-center gap-2"
          >
            {submitting ? <><Loader2 size={17} className="animate-spin" /> Submitting…</> : <><PartyPopper size={16} /> SUBMIT FIELD REPORT</>}
          </button>
        </Card>
      )}

      {/* Nav buttons */}
      {step < STEPS.length - 1 && (
        <div className="flex gap-3 sticky bottom-16 lg:bottom-2">
          {step > 0 && (
            <button onClick={() => setStep((s) => s - 1)} className="flex-1 bg-white border border-gov-border text-gov-navy font-bold py-3 rounded-lg">
              Back
            </button>
          )}
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={(step === 0 && !checkedIn) || (step === 8 && !visitOutcome)}
            className="flex-1 bg-gov-blue hover:bg-gov-navy disabled:opacity-50 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
          >
            Continue <ArrowRight size={16} />
          </button>
        </div>
      )}
      {step === STEPS.length - 1 && (
        <button onClick={() => setStep((s) => s - 1)} className="w-full bg-white border border-gov-border text-gov-navy font-bold py-3 rounded-lg">
          Back
        </button>
      )}
    </div>
  );
}

const VERIFY_LABELS = { consistent: 'Looks consistent', incorrect: 'Looks incorrect', unsure: 'Not sure' };

const KIT_ITEMS = [
  'Smartphone / app',
  'Power bank / solar charger',
  'Hand lens / magnifying glass',
  'Sample bags / vials',
  'Gloves',
  'Soil pH / moisture kit',
  'Pest & disease reference booklet',
];

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-bold text-gov-textSec uppercase tracking-wide mb-1">{label}</span>
      {children}
    </label>
  );
}

function Info({ label, value }) {
  return (
    <div className="bg-gov-bg border border-gov-border rounded-lg p-2.5">
      <p className="text-gov-textSec">{label}</p>
      <p className="font-bold text-gov-navy mt-0.5">{value}</p>
    </div>
  );
}

function Reading({ icon: Icon, label, value }) {
  return (
    <div className="bg-gov-bg border border-gov-border rounded-lg p-3">
      <div className="flex items-center gap-1.5 text-gov-textSec text-xs font-semibold"><Icon size={13} /> {label}</div>
      <p className="text-lg font-bold text-gov-navy mt-0.5">{value}</p>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-gov-textSec shrink-0">{label}</dt>
      <dd className="font-semibold text-gov-navy text-right">{value}</dd>
    </div>
  );
}

function ReviewSection({ title, onEdit, children }) {
  return (
    <div className="mb-4 pb-4 border-b border-gray-100 last:border-b-0 last:pb-0 last:mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xs font-bold text-gov-textSec uppercase tracking-wide">{title}</p>
        <button onClick={onEdit} className="flex items-center gap-1 text-[11px] font-bold text-gov-blue">
          <Pencil size={11} /> Edit
        </button>
      </div>
      <dl className="space-y-1.5 text-sm">{children}</dl>
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
