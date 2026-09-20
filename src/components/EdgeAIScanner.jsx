import React, { useState, useRef, useCallback, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import { Upload, Camera, Loader2, CheckCircle2, AlertOctagon, Info, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext.jsx';
import { useAlertQueue, ALERT_SOURCE, RISK_LEVEL } from '../contexts/AlertQueueContext.jsx';

const DISEASE_PROFILES = [
  { key: 'HEALTHY', labelKey: 'healthyLabel', maxStress: 0.12, riskLevel: RISK_LEVEL.LOW, advisoryTKey: 'healthyAdvisory' },
  { key: 'NUTRIENT_DEFICIENCY', labelKey: 'nutrientLabel', maxStress: 0.3, riskLevel: RISK_LEVEL.MODERATE, advisoryTKey: 'nutrientAdvisory' },
  { key: 'POWDERY_MILDEW', labelKey: 'powderyScanLabel', maxStress: 0.5, riskLevel: RISK_LEVEL.HIGH, advisoryTKey: 'powderyScanAdvisory' },
  { key: 'LEAF_RUST', labelKey: 'rustLabel', maxStress: 0.72, riskLevel: RISK_LEVEL.SEVERE, advisoryTKey: 'rustAdvisory' },
  { key: 'BACTERIAL_BLIGHT', labelKey: 'blightLabel', maxStress: 1.01, riskLevel: RISK_LEVEL.CRITICAL, advisoryTKey: 'blightAdvisory' },
];

function classifyStress(stressIndex) {
  return DISEASE_PROFILES.find((p) => stressIndex <= p.maxStress) ?? DISEASE_PROFILES[DISEASE_PROFILES.length - 1];
}

function analyzeCanopyColorSignature(sourceEl, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(sourceEl, 0, 0, width, height);
  const { data } = ctx.getImageData(0, 0, width, height);

  let greenPixels = 0, yellowPixels = 0, brownPixels = 0, totalSampled = 0;

  for (let i = 0; i < data.length; i += 16) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    totalSampled += 1;
    if (g > r * 1.05 && g > b * 1.15 && g > 60) greenPixels += 1;
    else if (r > 150 && g > 130 && b < 110) yellowPixels += 1;
    else if (r > 70 && r < 160 && g < 110 && b < 90) brownPixels += 1;
  }

  const greenRatio = greenPixels / Math.max(1, totalSampled);
  const yellowRatio = yellowPixels / Math.max(1, totalSampled);
  const brownRatio = brownPixels / Math.max(1, totalSampled);
  const stressIndex = Number(((yellowRatio * 1.4 + brownRatio * 2.0) / Math.max(0.05, greenRatio + yellowRatio + brownRatio)).toFixed(3));

  return { greenRatio, yellowRatio, brownRatio, stressIndex };
}

export default function EdgeAIScanner({ onNavigate }) {
  const { t, isMarathi } = useLanguage();
  const { addAlert } = useAlertQueue();

  const [mode, setMode] = useState('upload');
  const [modelStatus, setModelStatus] = useState('loading');
  const [imageSrc, setImageSrc] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [alertSubmitted, setAlertSubmitted] = useState(false);

  const modelRef = useRef(null);
  const imgRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await tf.ready();
        const loadedModel = await mobilenet.load({ version: 2, alpha: 1.0 });
        if (!cancelled) {
          modelRef.current = loadedModel;
          setModelStatus('ready');
        }
      } catch (err) {
        if (!cancelled) setModelStatus('error');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    return () => streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      setCameraActive(false);
      if (err?.name === 'NotAllowedError') setCameraError('Camera permission denied.');
      else if (err?.name === 'NotFoundError') setCameraError('No camera device found.');
      else if (!window.isSecureContext) setCameraError('Camera requires HTTPS.');
      else setCameraError('Unable to access camera.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    if (mode === 'camera') startCamera();
    else { stopCamera(); setCameraError(null); }
    return () => stopCamera();
  }, [mode, startCamera, stopCamera]);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setResult({ error: true, message: t('scanFailed') });
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageSrc(ev.target.result);
      setResult(null);
      setAlertSubmitted(false);
    };
    reader.onerror = () => setResult({ error: true, message: t('scanFailed') });
    reader.readAsDataURL(file);
  };

  const runScan = useCallback(async () => {
    if (modelStatus !== 'ready') return;
    setScanning(true);
    setResult(null);
    setAlertSubmitted(false);

    try {
      let sourceEl = (mode === 'camera' && videoRef.current && cameraActive) ? videoRef.current : imgRef.current;
      if (!sourceEl) { setScanning(false); return; }

      const isReady = mode === 'camera' ? sourceEl.readyState >= 2 && sourceEl.videoWidth > 0 : sourceEl.complete && sourceEl.naturalWidth > 0;
      if (!isReady) {
        setResult({ error: true, message: t('scanFailed') });
        setScanning(false);
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 150));
      const predictions = await modelRef.current.classify(sourceEl, 3);
      const colorSignature = analyzeCanopyColorSignature(sourceEl, 160, 160);
      const profile = classifyStress(colorSignature.stressIndex);

      const topPredictionConfidence = predictions[0]?.probability ?? 0.5;
      const bandWidth = profile.maxStress - (DISEASE_PROFILES[DISEASE_PROFILES.indexOf(profile) - 1]?.maxStress ?? 0);
      const bandCertainty = bandWidth > 0 ? Math.max(0, Math.min(1, (Math.abs(colorSignature.stressIndex - (profile.maxStress - bandWidth / 2)) / (bandWidth / 2)) * -1 + 1)) : 0.6;
      const confidence = Number(Math.min(0.98, Math.max(0.42, topPredictionConfidence * 0.35 + bandCertainty * 0.65)).toFixed(2));

      setResult({ profile, confidence, colorSignature, timestamp: Date.now() });
    } catch (err) {
      setResult({ error: true, message: t('scanFailed') });
    } finally {
      setScanning(false);
    }
  }, [modelStatus, mode, cameraActive, t]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white border border-gov-border rounded-md shadow-card overflow-hidden">
        {/* Header */}
        <div className="bg-gov-bg border-b border-gov-border px-6 py-4">
          <h2 className={`text-xl font-bold text-gov-navy ${isMarathi ? 'font-devanagari' : ''}`}>
            {t('diseaseDetectTitle')}
          </h2>
          <p className="text-sm text-gov-textSec mt-1">
            {t('diseaseDetectSub')}
          </p>
        </div>

        <div className="p-6">
          {modelStatus === 'loading' && (
            <div className="flex items-center justify-center gap-2 text-gov-blue py-10">
              <Loader2 size={24} className="animate-spin" /> 
              <span className="font-medium">{t('loadingModel')}</span>
            </div>
          )}

          {modelStatus === 'error' && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded flex items-center justify-center gap-2">
              <AlertOctagon size={20} /> {t('modelLoadError')}
            </div>
          )}

          {modelStatus === 'ready' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left side: Upload Area */}
              <div className="space-y-4">
                <div className="flex bg-gov-bg rounded border border-gov-border p-1 w-full max-w-[240px]">
                  <button 
                    onClick={() => setMode('upload')}
                    className={`flex-1 py-1.5 text-sm font-medium rounded transition-colors ${mode === 'upload' ? 'bg-white shadow-sm text-gov-navy' : 'text-gov-textSec'}`}
                  >
                    {t('selectPhoto')}
                  </button>
                  <button 
                    onClick={() => setMode('camera')}
                    className={`flex-1 py-1.5 text-sm font-medium rounded transition-colors ${mode === 'camera' ? 'bg-white shadow-sm text-gov-navy' : 'text-gov-textSec'}`}
                  >
                    {t('useCamera')}
                  </button>
                </div>

                <div className="aspect-square bg-gray-50 border-2 border-dashed border-gov-border rounded-lg flex flex-col items-center justify-center relative overflow-hidden group">
                  {mode === 'upload' ? (
                    imageSrc ? (
                      <img ref={imgRef} src={imageSrc} alt="Crop" className="w-full h-full object-cover" crossOrigin="anonymous" />
                    ) : (
                      <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center text-gov-blue hover:text-gov-navy transition-colors">
                        <Upload size={48} className="mb-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                        <span className="font-semibold">{t('uploadHere')}</span>
                        <span className="text-xs text-gov-textSec mt-1">JPG / PNG</span>
                      </button>
                    )
                  ) : cameraError ? (
                    <div className="text-center p-4 text-red-600">
                      <AlertOctagon size={24} className="mx-auto mb-2" />
                      <p className="text-sm">{cameraError}</p>
                    </div>
                  ) : (
                    <video ref={videoRef} muted playsInline className="w-full h-full object-cover" />
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                </div>

                <button
                  onClick={runScan}
                  disabled={scanning || (mode === 'upload' && !imageSrc) || (mode === 'camera' && !cameraActive)}
                  className="w-full bg-gov-blue hover:bg-gov-navy disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded transition-colors flex items-center justify-center gap-2"
                >
                  {scanning ? <><Loader2 size={18} className="animate-spin" /> {t('scanning')}</> : t('analyzeDisease')}
                </button>
              </div>

              {/* Right side: Results Area */}
              <div>
                {result && !result.error ? (
                  <div className="border border-gov-border rounded-md shadow-sm overflow-hidden">
                    <div className="bg-gov-bg px-4 py-3 border-b border-gov-border flex items-center gap-2">
                      <Info size={18} className="text-gov-blue" />
                      <h3 className="font-bold text-gov-navy">{t('resultTitle')}</h3>
                    </div>
                    
                    <div className="p-4 space-y-4">
                      {/* High Risk Alert */}
                      {(result.profile.riskLevel === RISK_LEVEL.SEVERE || result.profile.riskLevel === RISK_LEVEL.CRITICAL) && (
                        <div className="bg-orange-50 border-l-4 border-orange-600 p-4 rounded-r flex gap-3">
                          <AlertTriangle className="text-orange-600 shrink-0 mt-0.5" size={20} />
                          <div>
                            <p className="font-bold text-orange-900 text-sm mb-1">{t('importantNotice')}</p>
                            <p className="text-sm text-orange-800">{t('highRiskWarning')}</p>
                            <button 
                              onClick={() => onNavigate && onNavigate('officerBooking')}
                              className="mt-3 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold py-1.5 px-3 rounded"
                            >
                              {t('contactOfficer')}
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                        <div className="text-gov-textSec font-medium">{t('possibleDisease')}</div>
                        <div className="font-bold text-gov-navy">{t(result.profile.labelKey)}</div>
                        
                        <div className="text-gov-textSec font-medium">{t('confidence')}</div>
                        <div className="font-semibold">{Math.round(result.confidence * 100)}%</div>
                        
                        <div className="text-gov-textSec font-medium">{t('severity')}</div>
                        <div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${
                            result.profile.riskLevel === RISK_LEVEL.LOW ? 'bg-green-700' :
                            result.profile.riskLevel === RISK_LEVEL.MODERATE ? 'bg-yellow-600' :
                            result.profile.riskLevel === RISK_LEVEL.HIGH ? 'bg-orange-600' :
                            'bg-red-700'
                          }`}>
                            {result.profile.riskLevel}
                          </span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gov-border">
                        <h4 className="font-bold text-gov-navy mb-2">{t('recommendedManagement')}</h4>
                        <p className="text-sm text-gov-text leading-relaxed">
                          {t(result.profile.advisoryTKey)}
                        </p>
                      </div>

                      <div className="bg-gray-50 border border-gray-200 p-3 rounded text-xs text-gray-500 italic mt-4">
                        <span className="font-bold">नोंद: </span>
                        हा {t('disclaimerPossible')} आहे. {t('disclaimerConsult')}
                      </div>
                    </div>
                  </div>
                ) : result?.error ? (
                  <div className="bg-red-50 text-red-600 p-4 rounded text-center text-sm border border-red-200">
                    {result.message}
                  </div>
                ) : (
                  <div className="h-full border-2 border-dashed border-gov-border rounded-lg flex flex-col items-center justify-center text-gov-textSec p-8 text-center bg-gov-bg/50">
                    <Info size={32} className="mb-2 opacity-50" />
                    <p className="text-sm font-medium">फोटो अपलोड करून विश्लेषण सुरू करा.</p>
                    <p className="text-xs mt-1">निकाल येथे प्रदर्शित होईल.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
