import React, { useState } from 'react';
import {
  ArrowLeft, MapPin, Clock, Leaf, Bot, Phone, MessageCircle,
  CheckCircle2, Image as ImageIcon, ImageOff,
} from 'lucide-react';
import { PriorityChip } from './Chips.jsx';
import AgriImage from './AgriImage.jsx';
import { NEARBY_CASES, NEARBY_CASE_DETAILS, MISSION_STATUS } from '../mockData.js';
import { useScout } from '../ScoutContext.jsx';

/**
 * Farmer case detail — premium layout (presentation only).
 * Props, assignment derivation, chat-note behavior and navigation
 * are unchanged from the working version. Mock data only.
 */
export default function CaseDetail({ caseId, assigned = false, onBack, onAccept }) {
  const [showChatNote, setShowChatNote] = useState(false);
  const { missions } = useScout();
  const caseItem = NEARBY_CASES.find((c) => c.id === caseId);
  const detail = NEARBY_CASE_DETAILS[caseId];
  // A submitted report completes the shared mission — no second source.
  const mission = missions.find((m) => m.id === caseId);
  const completed =
    !!mission &&
    (mission.status === MISSION_STATUS.COMPLETED ||
      mission.status === MISSION_STATUS.UNDER_REVIEW ||
      mission.status === MISSION_STATUS.VERIFIED);

  if (!caseItem) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-gray-500">
          <ArrowLeft size={16} /> Back
        </button>
        <p className="text-sm text-gray-500">Case not found.</p>
      </div>
    );
  }

  const mainImage = caseItem.image || detail?.image || null;
  const symptomImages = detail?.symptomImages || null;
  const variety = caseItem.crop === 'Grapes' ? `${caseItem.crop} · Thompson Seedless` : caseItem.crop;

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-[#0C3B2E]">
        <ArrowLeft size={16} /> Back to Cases
      </button>

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <PriorityChip level={caseItem.priority} />
          {completed ? (
            <span className="text-[11px] font-bold text-white bg-green-600 rounded px-2 py-0.5">
              Completed
            </span>
          ) : (
            assigned && (
              <span className="text-[11px] font-bold text-green-800 bg-green-50 border border-green-200 rounded px-2 py-0.5">
                Assigned
              </span>
            )
          )}
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1.5">
          {detail?.problem || caseItem.issue}
        </h1>
        <p className="text-[13px] text-gray-500 mt-0.5">{variety}</p>
      </div>

      <div className="grid md:grid-cols-5 gap-4">
        <AgriImage
          src={mainImage}
          alt={`${detail?.problem || caseItem.issue} — main field photo`}
          label="Field image not available"
          className="w-full h-56 md:h-full md:min-h-[16rem] rounded-2xl border border-[#e4eae4] md:col-span-3"
        />

        <div className="bg-white border border-[#e4eae4] rounded-2xl shadow-[0_1px_3px_rgba(12,59,46,0.06)] p-4 md:col-span-2">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-3">Case Overview</h3>
          <dl className="space-y-2.5 text-sm">
            <InfoRow label="Farmer" value={caseItem.farmer} />
            <InfoRow label="Location" value={caseItem.village} />
            <InfoRow label="Distance" value={`${caseItem.distanceKm} km`} />
            <InfoRow label="Reported" value={caseItem.reportedAt} icon />
          </dl>
        </div>
      </div>

      <div className="bg-white border border-[#e4eae4] rounded-2xl shadow-[0_1px_3px_rgba(12,59,46,0.06)] p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-8 h-8 rounded-lg bg-[#0C3B2E]/10 text-[#0C3B2E] flex items-center justify-center shrink-0">
            <Bot size={17} />
          </span>
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-500">AI Field Assessment</h3>
            <p className="text-[11px] text-gray-400">Simulated demo analysis</p>
          </div>
          {detail && (
            <span className="ml-auto text-center shrink-0">
              <span className="block text-2xl font-bold text-[#0C3B2E] leading-none">{detail.aiConfidence}%</span>
              <span className="block text-[10px] font-bold text-gray-500 mt-0.5">Confidence</span>
            </span>
          )}
        </div>
        <p className="text-base font-bold text-gray-900">{detail?.aiDiagnosis || '—'}</p>
        <div className="flex items-center gap-2 mt-1.5 text-xs">
          <span className="text-gray-500 font-semibold">Risk</span>
          <PriorityChip level={caseItem.priority} size="sm" />
        </div>
        <div className="mt-3">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
            <Leaf size={12} /> Detected symptoms
          </p>
          <ul className="space-y-1.5">
            {(detail?.symptoms || []).map((s) => (
              <li key={s} className="flex items-center gap-2 text-[13px] text-gray-700">
                <CheckCircle2 size={14} className="text-green-600 shrink-0" /> {s}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-[11px] text-gray-400 mt-3 bg-[#f5f7f5] border border-[#e4eae4] rounded-xl px-3 py-2">
          AI-assisted assessment — field verification required. Not a production model.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white border border-[#e4eae4] rounded-2xl shadow-[0_1px_3px_rgba(12,59,46,0.06)] p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-8 h-8 rounded-lg bg-[#0C3B2E]/10 text-[#0C3B2E] flex items-center justify-center shrink-0">
              <Phone size={16} />
            </span>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Farmer Information</h3>
          </div>
          <dl className="space-y-2 text-sm">
            <InfoRow label="Farmer" value={caseItem.farmer} />
            <InfoRow label="Location" value={caseItem.village} />
            <InfoRow label="Contact" value={detail?.farmerPhone || '—'} />
          </dl>
          <p className="text-[11px] text-gray-400 mt-2">Masked demo number. Real contact arrives in a later phase.</p>
        </div>

        <div className="bg-white border border-[#e4eae4] rounded-2xl shadow-[0_1px_3px_rgba(12,59,46,0.06)] p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-8 h-8 rounded-lg bg-[#0C3B2E]/10 text-[#0C3B2E] flex items-center justify-center shrink-0">
              <ImageIcon size={16} />
            </span>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Field Evidence</h3>
          </div>
          {symptomImages && symptomImages.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {symptomImages.map((src, i) => (
                <AgriImage
                  key={i}
                  src={src}
                  alt={`Symptom photo ${i + 1}`}
                  label={`Photo ${i + 1} N/A`}
                  className="aspect-square w-full rounded-xl"
                />
              ))}
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-3 gap-2">
                {(detail?.photoLabels || ['Photo 1']).map((label) => (
                  <div
                    key={label}
                    className="aspect-square rounded-xl bg-gray-50 border border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 p-2 text-center"
                  >
                    <ImageOff size={16} className="text-gray-300" />
                    <span className="text-[10px] text-gray-400 font-medium leading-tight">{label}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-gray-400 mt-2 flex items-center gap-1">
                <MapPin size={11} /> Agricultural photos will be added here once available.
              </p>
            </div>
          )}
        </div>
      </div>

      {completed ? (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm font-semibold rounded-2xl px-4 py-3 flex items-center gap-2">
          <CheckCircle2 size={16} /> Field report submitted. This case is completed.
        </div>
      ) : (
        assigned && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm font-semibold rounded-2xl px-4 py-3 flex items-center gap-2">
            <CheckCircle2 size={16} /> Field visit accepted. This case now shows “Assigned”.
          </div>
        )
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-1">
        <button
          onClick={() => onAccept(caseItem.id)}
          disabled={assigned || completed}
          className="bg-[#0C3B2E] hover:bg-[#12503d] disabled:bg-green-600 disabled:opacity-90 text-white font-bold py-3.5 rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          {completed ? (<><CheckCircle2 size={16} /> Report Submitted</>) : assigned ? (<><CheckCircle2 size={16} /> Assigned ✓</>) : 'Accept Field Visit'}
        </button>
        <button
          onClick={() => setShowChatNote((v) => !v)}
          className="bg-white border border-[#0C3B2E]/30 text-[#0C3B2E] font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-[#0C3B2E]/5"
        >
          <MessageCircle size={16} /> Chat with Farmer
        </button>
      </div>

      {showChatNote && (
        <div className="bg-[#f5f7f5] border border-[#e4eae4] rounded-2xl px-4 py-3 text-xs text-gray-500">
          Chat feature coming in the next phase. The existing “Chat with Farmers” page is unchanged.
        </div>
      )}

      <p className="text-[11px] text-gray-400 flex items-center gap-1">
        <Clock size={12} /> Reported {caseItem.reportedAt} • {caseItem.distanceKm} km away
      </p>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-semibold text-gray-900 text-right">{value}</dd>
    </div>
  );
}
