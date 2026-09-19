import React, { useEffect, useState } from 'react';
import { CheckCircle2, Package, ClipboardList, Flag } from 'lucide-react';

const BEFORE_ITEMS = [
  'Smartphone with GeoFarm app',
  'Power bank / Solar charger',
  'Hand lens / magnifying glass',
  'Sample collection bags / vials',
  'Gloves',
  'Soil pH testing kit',
  'Soil moisture testing kit',
  'Notebook / Pen',
  'Printed pest & disease booklet',
  'Water bottle',
  'Hat / Cap',
];

const DURING_ITEMS = [
  'GPS tracking active',
  'Farmer / field check-in completed',
  'Field location recorded',
  'Crop identified',
  'Photos captured',
  'Pest symptoms observed',
  'Disease symptoms observed',
  'Soil pH checked',
  'Soil moisture checked',
  'Sample collected if required',
  'Notes recorded',
];

const AFTER_ITEMS = [
  'Photos reviewed',
  'Diagnosis completed',
  'Field notes completed',
  'Samples recorded',
  'Report reviewed',
  'Report submitted',
  'Visit ended',
];

function usePersisted(key, initial) {
  const [val, setVal] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (_e) { /* ignore */ }
  }, [key, val]);
  return [val, setVal];
}

export default function FieldKitChecklist({ visitId, autoDuring = {}, autoAfter = {}, onReady }) {
  const [tab, setTab] = useState('before');
  const [before, setBefore] = usePersisted(`geofarm_kit_before_${visitId || 'global'}`, {});
  const [during, setDuring] = usePersisted(`geofarm_kit_during_${visitId || 'global'}`, {});
  const [after, setAfter] = usePersisted(`geofarm_kit_after_${visitId || 'global'}`, {});

  // Auto-check from visit progress
  useEffect(() => {
    setDuring((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const [k, v] of Object.entries(autoDuring)) {
        if (v && !next[k]) {
          next[k] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [autoDuring, setDuring]);

  useEffect(() => {
    setAfter((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const [k, v] of Object.entries(autoAfter)) {
        if (v && !next[k]) {
          next[k] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [autoAfter, setAfter]);

  const toggle = (setter, key) => setter((p) => ({ ...p, [key]: !p[key] }));

  const beforeCount = BEFORE_ITEMS.filter((i) => before[i]).length;
  const duringCount = DURING_ITEMS.filter((i) => during[i]).length;
  const afterCount = AFTER_ITEMS.filter((i) => after[i]).length;

  const renderList = (items, state, setter) =>
    items.map((item) => (
      <button
        key={item}
        onClick={() => toggle(setter, item)}
        className="w-full flex items-center gap-3 text-left p-3 rounded-xl border bg-white hover:border-[#0C3B2E]/30 transition-colors"
      >
        <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${state[item] ? 'bg-[#0C3B2E] border-[#0C3B2E] text-white' : 'border-gray-300 text-transparent'}`}>
          <CheckCircle2 size={14} />
        </span>
        <span className={`text-sm ${state[item] ? 'text-gray-500 line-through' : 'text-gray-800 font-medium'}`}>{item}</span>
      </button>
    ));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 bg-white border border-[#e4eae4] rounded-full p-1 w-fit">
        {[
          { id: 'before', label: 'Before Visit', icon: Package },
          { id: 'during', label: 'During Visit', icon: ClipboardList },
          { id: 'after', label: 'After Visit', icon: Flag },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${tab === t.id ? 'bg-[#0C3B2E] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <t.icon size={13} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'before' && (
        <div className="space-y-3">
          <div className="bg-white border border-[#e4eae4] rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Field Kit</h3>
              <span className="text-xs font-bold text-[#0C3B2E]">{beforeCount} / {BEFORE_ITEMS.length} ready</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-2">
              <div className="h-full bg-[#0C3B2E] rounded-full" style={{ width: `${Math.round((beforeCount / BEFORE_ITEMS.length) * 100)}%` }} />
            </div>
          </div>
          <div className="space-y-2">{renderList(BEFORE_ITEMS, before, setBefore)}</div>
          <div className="bg-white border border-[#e4eae4] rounded-2xl p-4">
            {beforeCount < BEFORE_ITEMS.length ? (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-3">{BEFORE_ITEMS.length - beforeCount} items are still unchecked.</p>
            ) : (
              <p className="text-xs font-bold text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2 mb-3">✓ Ready for field visit</p>
            )}
            <button
              onClick={() => onReady?.(beforeCount === BEFORE_ITEMS.length ? 'ready' : 'anyway')}
              className="w-full bg-[#0C3B2E] hover:bg-[#12503d] text-white font-bold py-3 rounded-xl"
            >
              {beforeCount === BEFORE_ITEMS.length ? "I'm Ready — Start Field Visit" : 'Start Anyway'}
            </button>
          </div>
        </div>
      )}

      {tab === 'during' && (
        <div className="space-y-2">
          <div className="bg-white border border-[#e4eae4] rounded-2xl p-3 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">Progress</span>
            <span className="text-xs font-bold text-[#0C3B2E]">{duringCount} / {DURING_ITEMS.length}</span>
          </div>
          {renderList(DURING_ITEMS, during, setDuring)}
        </div>
      )}

      {tab === 'after' && (
        <div className="space-y-2">
          <div className="bg-white border border-[#e4eae4] rounded-2xl p-3 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">Progress</span>
            <span className="text-xs font-bold text-[#0C3B2E]">{afterCount} / {AFTER_ITEMS.length}</span>
          </div>
          {renderList(AFTER_ITEMS, after, setAfter)}
        </div>
      )}
    </div>
  );
}

export { BEFORE_ITEMS, DURING_ITEMS, AFTER_ITEMS };