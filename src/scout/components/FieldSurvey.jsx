import React, { useMemo, useRef, useState } from 'react';
import {
  MapPin, CheckCircle2, Loader2, Camera, Upload, Image as ImageIcon, Bug,
  Thermometer, Droplets, Waves, CloudRain, ArrowRight, ArrowLeft,
  AlertTriangle, ShieldCheck, XCircle, HelpCircle, ScanLine, TrendingUp,
  ClipboardCheck, PartyPopper, Wifi, WifiOff, X, Plus,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { Card, CardHeader } from '../../components/ui/Card.jsx';
import { useScout } from '../ScoutContext.jsx';
import { RiskChip } from './Chips.jsx';
import { SYMPTOM_OPTIONS } from '../mockData.js';
import { simulateLeafAnalysis, simulateTrapScan, computeFieldRisk, computeDataQuality } from '../utils/aiSim.js';

const STEPS = ['Check-in', 'Observation', 'Evidence', 'Smart Trap', 'Conditions', 'Risk', 'Review'];

function StepDots({ step }) {
  return (
    <div className="flex items-center gap-1.5">
      {STEPS.map((s, i) => (
        <div key={s} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-gov-blue' : i < step ? 'w-1.5 bg-gov-blue/50' : 'w-1.5 bg-gray-200'}`} />
      ))}
    </div>
  );
}

export default function FieldSurvey({ missionId, onExit, onComplete }) {
  const { missions, traps, isOnline, submitReport, addVisitPhotos, removeVisitPhoto, visits } = useScout();
  const mission = missions.find((m) => m.id === missionId) || missions[0];
  const trap = mission.trapId ? traps[mission.trapId] : null;
  const fileInputRef = useRef(null);

  const [step, setStep] = useState(0);

  // Step data
  const [checkedIn, setCheckedIn] = useState(false);
  const [crop, setCrop] = useState(mission.crop);
  const [variety, setVariety] = useState(mission.crop === 'Grapes' ? 'Thompson Seedless' : '');
  const [growthStage, setGrowthStage] = useState(mission.cropStage);
  const [area, setArea] = useState('2.5');
  const [condition, setCondition] = useState('Moderate stress');
  const [symptoms, setSymptoms] = useState(['White powdery patches']);

  const [photo, setPhoto] = useState(null);
  // Local evidence photos for this visit (dataUrl previews)
  const [evidencePhotos, setEvidencePhotos] = useState([]);

  const [aiResult, setAiResult] = useState(null);
  const [aiVerification, setAiVerification] = useState(null);

  const [trapScanned, setTrapScanned] = useState(false);
  const [trapResult, setTrapResult] = useState(null);
  const [trapVerification, setTrapVerification] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);

  const toggleSymptom = (s) => {
    setSymptoms((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  // Real file picker: reads selected files as dataURLs and adds them to local state
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remaining = 5 - evidencePhotos.length;
    const toAdd = files.slice(0, remaining);
    toAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const newPhoto = {
          id: `PHOTO-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: ev.target.result,
          description: '',
          capturedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        };
        setEvidencePhotos((prev) => [...prev, newPhoto].slice(0, 5));
        // Mark that at least one photo was added (for AI + data quality)
        setPhoto({ name: file.name, capturedAt: new Date() });
        // Reset AI when a new photo is added
        setAiResult(null);
        setAiVerification(null);
      };
      reader.readAsDataURL(file);
    });
    // Reset input so same file can be re-selected if removed
    e.target.value = '';
  };

  const removeEvidencePhoto = (id) => {
    setEvidencePhotos((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      if (updated.length === 0) {
        setPhoto(null);
        setAiResult(null);
        setAiVerification(null);
      }
      return updated;
    });
  };

  const handlePhoto = () => {
    // Legacy fallback — triggers the file picker
    fileInputRef.current?.click();
  };

  const runAiAnalysis = () => {
    setAiResult('loading');
    setTimeout(() => setAiResult(simulateLeafAnalysis()), 900);
  };

  const runTrapScan = () => {
    setTrapScanned('loading');
    setTimeout(() => {
      setTrapResult(simulateTrapScan(trap?.previousTotal ?? 18));
      setTrapScanned(true);
    }, 1000);
  };

  const risk = useMemo(() => {
    return computeFieldRisk({
      trapChangePct: trapResult?.changePct ?? 0,
      humidity: mission.reason.humidity,
      hasSymptoms: symptoms.length > 0 && !symptoms.includes('No visible symptoms'),
      nearbyReports: mission.reason.nearbyReports,
    });
  }, [trapResult, mission, symptoms]);

  const dataQuality = useMemo(() => computeDataQuality({
    gps: checkedIn,
    timestamp: checkedIn,
    requiredFieldsComplete: !!crop && !!growthStage && symptoms.length > 0,
    photoQualityGood: !!photo,
    trapVerified: trap ? trapVerification !== null : true,
  }), [checkedIn, crop, growthStage, symptoms, photo, trap, trapVerification]);

  const handleSubmit = () => {
    setSubmitting(true);
    // Merge local evidence photos into context before submitting
    if (evidencePhotos.length > 0) {
      addVisitPhotos(mission.id, evidencePhotos);
    }
    setTimeout(() => {
      const report = submitReport(mission, {
        finding: aiResult && aiResult !== 'loading' ? aiResult.primary.label : 'Field observation',
        risk: risk.level,
        dataQuality: dataQuality.score,
        aiConfidence: aiResult && aiResult !== 'loading' ? aiResult.primary.confidence : null,
        trapCount: trapResult?.total ?? null,
        trend: trapResult ? `+${trapResult.changePct}%` : null,
        photos: evidencePhotos.length || (photo ? 1 : 0),
        symptoms,
        condition,
        timeline: [
          { time: 'now', icon: 'pin', label: 'Field check-in' },
          { time: 'now', icon: 'camera', label: 'Leaf image captured' },
          { time: 'now', icon: 'ai', label: 'AI analysis completed' },
          { time: 'now', icon: 'grad', label: 'Scout confirmed symptoms' },
          ...(trap ? [{ time: 'now', icon: 'trap', label: 'Smart trap scanned' }] : []),
          { time: 'now', icon: 'chart', label: 'Risk recalculated' },
          { time: 'now', icon: 'cloud', label: 'Report uploaded' },
          { time: 'now', icon: 'gov', label: 'Awaiting officer verification' },
        ],
      });
      setSubmitting(false);
      setSubmitted(report);
    }, 1100);
  };

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
            <div className="flex justify-between"><dt className="text-gov-textSec">Status</dt><dd className="font-bold text-purple-700">Awaiting Officer Review</dd></div>
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
      <div className="flex items-center justify-between">
        <button onClick={onExit} className="flex items-center gap-1.5 text-sm font-semibold text-gov-textSec hover:text-gov-navy">
          <ArrowLeft size={16} /> Exit
        </button>
        <span className="text-xs font-bold text-gov-textSec">{STEPS[step]} · {step + 1}/{STEPS.length}</span>
      </div>
      <StepDots step={step} />

      {/* STEP 0: Check-in */}
      {step === 0 && (
        <Card>
          <CardHeader icon={MapPin} title="Field Check-in" subtitle={mission.fieldName} />
          {!checkedIn ? (
            <div className="text-center py-6">
              <button
                onClick={() => setCheckedIn(true)}
                className="bg-gov-blue hover:bg-gov-navy text-white font-bold py-3 px-6 rounded-lg inline-flex items-center gap-2"
              >
                <MapPin size={16} /> Detect My Location
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm font-bold text-green-800 flex items-center gap-1.5"><CheckCircle2 size={15} /> Location detected</p>
                <div className="grid grid-cols-2 gap-y-1.5 text-xs text-green-800 mt-2">
                  <span>Accuracy</span><span className="font-semibold text-right">8 m</span>
                  <span>Distance from field</span><span className="font-semibold text-right">42 m</span>
                  <span>Zone status</span><span className="font-semibold text-right">Within assigned field zone ✓</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-gov-bg border border-gov-border rounded-lg p-3">
                  <p className="text-gov-textSec font-semibold">Timestamp</p>
                  <p className="font-bold text-gov-navy mt-0.5">16 Sep 2026 • 10:42 AM</p>
                </div>
                <div className="bg-gov-bg border border-gov-border rounded-lg p-3">
                  <p className="text-gov-textSec font-semibold flex items-center gap-1">
                    {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />} Connectivity
                  </p>
                  <p className="font-bold text-gov-navy mt-0.5">Offline capable</p>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* STEP 1: Observation */}
      {step === 1 && (
        <Card>
          <CardHeader title="Crop Information" />
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Field label="Crop"><input className="input" value={crop} onChange={(e) => setCrop(e.target.value)} /></Field>
            <Field label="Variety"><input className="input" value={variety} onChange={(e) => setVariety(e.target.value)} /></Field>
            <Field label="Growth Stage"><input className="input" value={growthStage} onChange={(e) => setGrowthStage(e.target.value)} /></Field>
            <Field label="Field area (acres)"><input className="input" value={area} onChange={(e) => setArea(e.target.value)} /></Field>
          </div>

          <h4 className="text-sm font-bold text-gov-navy mb-2">Overall Crop Condition</h4>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {['Healthy', 'Mild stress', 'Moderate stress', 'Severe stress'].map((c) => (
              <button
                key={c}
                onClick={() => setCondition(c)}
                className={`text-left text-sm font-medium px-3 py-2 rounded-lg border ${
                  condition === c ? 'bg-gov-blue/10 border-gov-blue text-gov-blue font-bold' : 'border-gov-border text-gov-text'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <h4 className="text-sm font-bold text-gov-navy mb-2">Symptoms Observed</h4>
          <div className="flex flex-wrap gap-2">
            {SYMPTOM_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => toggleSymptom(s)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${
                  symptoms.includes(s) ? 'bg-gov-blue text-white border-gov-blue' : 'bg-white text-gov-text border-gov-border'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* STEP 2: Evidence + AI */}
      {step === 2 && (
        <Card>
          <CardHeader icon={Camera} title="Capture Field Evidence" />

          {/* Hidden real file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />

          {evidencePhotos.length === 0 ? (
            // No photos yet — show picker buttons
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gov-border rounded-xl py-8 flex flex-col items-center gap-2 text-gov-blue hover:border-gov-blue"
              >
                <Camera size={26} /> <span className="text-xs font-bold">Take / Add Photo</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gov-border rounded-xl py-8 flex flex-col items-center gap-2 text-gov-blue hover:border-gov-blue"
              >
                <Upload size={26} /> <span className="text-xs font-bold">Upload from Device</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Photo grid with remove buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {evidencePhotos.map((p, i) => (
                  <div key={p.id} className="relative rounded-xl overflow-hidden border border-gov-border aspect-square bg-gray-50">
                    <img src={p.dataUrl} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
                    {/* Remove button */}
                    <button
                      onClick={() => removeEvidencePhoto(p.id)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                      title="Remove photo"
                    >
                      <X size={12} />
                    </button>
                    <span className="absolute bottom-1 left-1 text-[9px] bg-black/50 text-white px-1.5 py-0.5 rounded">
                      {p.capturedAt}
                    </span>
                  </div>
                ))}

                {/* Add more button (up to 5 photos) */}
                {evidencePhotos.length < 5 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-gov-border flex flex-col items-center justify-center gap-1 text-gov-blue hover:border-gov-blue"
                  >
                    <Plus size={20} />
                    <span className="text-[10px] font-bold">Add Photo</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center">
                  <p className="text-gov-textSec font-semibold">Photos</p>
                  <p className="font-bold text-green-700">{evidencePhotos.length} / 5 ✓</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center">
                  <p className="text-gov-textSec font-semibold">GPS attached</p>
                  <p className="font-bold text-green-700">Yes ✓</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center">
                  <p className="text-gov-textSec font-semibold">Timestamp</p>
                  <p className="font-bold text-green-700">{evidencePhotos[0]?.capturedAt} ✓</p>
                </div>
              </div>

              {!aiResult && (
                <button onClick={runAiAnalysis} className="w-full bg-gov-blue hover:bg-gov-navy text-white font-bold py-2.5 rounded-lg">
                  Analyze with AI
                </button>
              )}

              {aiResult === 'loading' && (
                <div className="flex items-center justify-center gap-2 py-4 text-gov-blue text-sm font-semibold">
                  <Loader2 size={16} className="animate-spin" /> Running on-device analysis…
                </div>
              )}

              {aiResult && aiResult !== 'loading' && (
                <div className="border border-gov-border rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold text-gov-textSec uppercase tracking-wide">AI Preliminary Result</p>
                  <div>
                    <p className="text-base font-bold text-gov-navy">Possible {aiResult.primary.label}</p>
                    <p className="text-sm text-gov-textSec">Confidence: {aiResult.primary.confidence}%</p>
                  </div>
                  <div className="text-xs text-gov-textSec space-y-0.5">
                    {aiResult.alternatives.map((a) => (
                      <p key={a.label}>{a.label} — {a.confidence}%</p>
                    ))}
                  </div>
                  <p className="text-[11px] bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-3 py-2">
                    AI result is advisory and requires field verification.
                  </p>

                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <VerifyBtn active={aiVerification === 'confirm'} onClick={() => setAiVerification('confirm')} icon={ShieldCheck} label="Confirm" color="green" />
                    <VerifyBtn active={aiVerification === 'incorrect'} onClick={() => setAiVerification('incorrect')} icon={XCircle} label="Incorrect" color="red" />
                    <VerifyBtn active={aiVerification === 'uncertain'} onClick={() => setAiVerification('uncertain')} icon={HelpCircle} label="Uncertain" color="amber" />
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* STEP 3: Smart Trap */}
      {step === 3 && (
        <Card>
          {trap ? (
            <>
              <CardHeader icon={ScanLine} title="Scan Smart Trap" subtitle={trap.id} />
              <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                <Info label="Location" value={trap.location} />
                <Info label="Crop" value={trap.crop} />
                <Info label="Trap type" value={trap.type} />
                <Info label="Last scan" value={trap.lastScan} />
                <Info label="Battery" value={`${trap.battery}%`} />
                <Info label="Connectivity" value={`Last synced ${trap.lastSynced}`} />
              </div>

              {!trapResult && (
                <button
                  onClick={runTrapScan}
                  disabled={trapScanned === 'loading'}
                  className="w-full bg-gov-blue hover:bg-gov-navy text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2"
                >
                  {trapScanned === 'loading' ? <><Loader2 size={16} className="animate-spin" /> Scanning trap…</> : 'Scan Trap'}
                </button>
              )}

              {trapResult && (
                <div className="space-y-4">
                  <div className="border border-gov-border rounded-xl p-4">
                    <p className="text-xs font-bold text-gov-textSec uppercase tracking-wide mb-2">AI Trap Analysis</p>
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
                    <div className="bg-gov-bg rounded-lg p-2 border border-gov-border">
                      <p className="text-gov-textSec">Previous</p>
                      <p className="font-bold text-gov-navy">{trapResult.previousTotal}</p>
                    </div>
                    <div className="bg-gov-bg rounded-lg p-2 border border-gov-border">
                      <p className="text-gov-textSec">Current</p>
                      <p className="font-bold text-gov-navy">{trapResult.total}</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-2 border border-red-200">
                      <p className="text-red-700">Change</p>
                      <p className="font-bold text-red-700">+{trapResult.changePct}%</p>
                    </div>
                  </div>

                  <div className="h-32">
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

                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex gap-2">
                    <TrendingUp size={16} className="text-orange-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-orange-800">
                      Rapid increase detected. Population increased by {trapResult.changePct}% since the previous inspection. Risk: <span className="font-bold">HIGH</span>.
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-gov-textSec mb-2">Does this look correct?</p>
                    <div className="grid grid-cols-3 gap-2">
                      <VerifyBtn active={trapVerification === 'correct'} onClick={() => setTrapVerification('correct')} icon={ShieldCheck} label="Looks correct" color="green" />
                      <VerifyBtn active={trapVerification === 'incorrect'} onClick={() => setTrapVerification('incorrect')} icon={XCircle} label="Incorrect count" color="red" />
                      <VerifyBtn active={trapVerification === 'unsure'} onClick={() => setTrapVerification('unsure')} icon={HelpCircle} label="Not sure" color="amber" />
                    </div>
                    {trapVerification && (
                      <p className="text-[11px] text-gov-textSec mt-2">Your verification becomes part of the field record.</p>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-6 text-sm text-gov-textSec">
              No smart trap assigned to this mission. Continue to field conditions.
            </div>
          )}
        </Card>
      )}

      {/* STEP 4: Conditions */}
      {step === 4 && (
        <Card>
          <CardHeader icon={Thermometer} title="Field Conditions" subtitle="Nearby Geo-Farm sensor · last synced 14 min ago" />
          <div className="grid grid-cols-2 gap-3">
            <Reading icon={Thermometer} label="Temperature" value="28.4°C" />
            <Reading icon={Droplets} label="Humidity" value={`${mission.reason.humidity}%`} />
            <Reading icon={Waves} label="Soil Moisture" value="62%" />
            <Reading icon={Waves} label="Leaf Wetness" value={mission.reason.leafWetness} />
            <Reading icon={CloudRain} label="Rainfall (24h)" value="4.2 mm" />
          </div>
        </Card>
      )}

      {/* STEP 5: Risk */}
      {step === 5 && (
        <Card>
          <CardHeader title="Field Risk" subtitle="Combining evidence collected so far" />
          <div className="text-center py-4">
            <RiskChip level={risk.level} />
            <p className="text-4xl font-bold text-gov-navy mt-2">{risk.score}<span className="text-lg text-gov-textSec">/100</span></p>
          </div>
          <p className="text-xs font-bold text-gov-textSec uppercase tracking-wide mb-2">Contributing signals</p>
          <div className="space-y-1.5 mb-4">
            {risk.signals.map((s) => (
              <div key={s.text} className="flex items-center gap-2 text-sm text-gov-text bg-gov-bg border border-gov-border rounded-lg px-3 py-2">
                <AlertTriangle size={14} className="text-orange-600 shrink-0" /> {s.text}
              </div>
            ))}
            {risk.signals.length === 0 && <p className="text-sm text-gov-textSec">No elevated risk signals detected.</p>}
          </div>
          <div className="bg-gov-bg border border-gov-border rounded-lg p-3">
            <p className="text-xs font-bold text-gov-navy mb-1">Reason for {risk.level.toLowerCase()} risk</p>
            <p className="text-xs text-gov-textSec">
              {trapResult ? `${mission.trapId} trap count has increased rapidly` : 'Field indicators'} and nearby field observations show early symptoms consistent with the officer&rsquo;s early-warning flag.
            </p>
          </div>
        </Card>
      )}

      {/* STEP 6: Review */}
      {step === 6 && (
        <Card>
          <CardHeader icon={ClipboardCheck} title="Review Your Report" />
          <dl className="space-y-2 text-sm mb-4">
            <Row label="Mission" value={mission.id} />
            <Row label="Field" value={mission.location} />
            <Row label="Crop" value={crop} />
            <Row label="Observed condition" value={condition} />
            <Row label="Possible issue" value={aiResult && aiResult !== 'loading' ? aiResult.primary.label : 'Not analyzed'} />
            <Row label="AI confidence" value={aiResult && aiResult !== 'loading' ? `${aiResult.primary.confidence}%` : '—'} />
            {trapResult && <Row label="Trap count" value={trapResult.total} />}
            {trapResult && <Row label="Pest trend" value={`+${trapResult.changePct}%`} />}
            <Row label="Field risk" value={<RiskChip level={risk.level} size="sm" />} />
            <Row label="Photos" value={evidencePhotos.length || (photo ? 1 : 0)} />
            <Row label="GPS" value="Verified ✓" />
            <Row label="Timestamp" value="Verified ✓" />
            <Row label="Scout" value={mission.assignedBy ? 'Aarav Patil' : 'Aarav Patil'} />
          </dl>

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

          <p className="text-xs text-gov-textSec mb-4">This report will be sent to the assigned Agriculture Officer for verification.</p>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-gov-blue hover:bg-gov-navy disabled:opacity-70 text-white font-bold py-3.5 rounded-lg flex items-center justify-center gap-2"
          >
            {submitting ? <><Loader2 size={17} className="animate-spin" /> Submitting…</> : <><PartyPopper size={16} /> SUBMIT FIELD REPORT</>}
          </button>
        </Card>
      )}

      {/* Nav buttons */}
      <div className="flex gap-3 sticky bottom-16 lg:bottom-2">
        {step > 0 && (
          <button onClick={() => setStep((s) => s - 1)} className="flex-1 bg-white border border-gov-border text-gov-navy font-bold py-3 rounded-lg">
            Back
          </button>
        )}
        {step < STEPS.length - 1 && (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={step === 0 && !checkedIn}
            className="flex-1 bg-gov-blue hover:bg-gov-navy disabled:opacity-50 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
          >
            Continue <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

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
    <div className="flex items-center justify-between">
      <dt className="text-gov-textSec">{label}</dt>
      <dd className="font-semibold text-gov-navy">{value}</dd>
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
