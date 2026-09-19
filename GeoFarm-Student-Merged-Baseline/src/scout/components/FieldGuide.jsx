import React, { useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, Leaf, Search } from 'lucide-react';
import AgriImage from './AgriImage.jsx';
import { FIELD_GUIDE_SECTIONS, DISEASE_GUIDE, KNOWLEDGE_CATEGORIES, KNOWLEDGE_LIBRARY } from '../mockData.js';

/**
 * Knowledge Library — premium agricultural reference center (presentation only).
 * All content, search and filter logic preserved. No new facts invented.
 */
export default function FieldGuide() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [selectedId, setSelectedId] = useState(null);

  const articles = useMemo(() => {
    const q = query.trim().toLowerCase();
    return KNOWLEDGE_LIBRARY.filter((a) => {
      if (category !== 'All' && a.category !== category) return false;
      if (!q) return true;
      return [a.title, a.crop, a.category, a.identification, a.treatment]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q));
    });
  }, [query, category]);

  const selected = KNOWLEDGE_LIBRARY.find((a) => a.id === selectedId);

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#0C3B2E]">Knowledge Library</h1>
        <p className="text-[13px] text-gray-500 mt-0.5">Field-ready crop, pest and disease references</p>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search diseases, pests, crops…"
          className="w-full pl-9 pr-3 py-2.5 text-sm border border-[#e4eae4] rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-[#0C3B2E]/20 focus:border-[#0C3B2E]/30 placeholder:text-gray-400"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {KNOWLEDGE_CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors ${
              category === c ? 'bg-[#0C3B2E] text-white border-[#0C3B2E]' : 'bg-white text-gray-500 border-[#e4eae4]'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {selected ? (
          <div className="bg-white border border-[#e4eae4] rounded-2xl shadow-[0_1px_3px_rgba(12,59,46,0.06)] overflow-hidden">
            <div className="p-4">
              <button onClick={() => setSelectedId(null)} className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#0C3B2E] mb-3">
                <ArrowLeft size={14} /> Back to guides
              </button>
              <AgriImage
                src={selected.image}
                alt={`${selected.title} — reference photo`}
                label="Reference image not available"
                className="w-full h-56 rounded-2xl mb-4"
              />
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-bold text-gray-900">{selected.title}</h3>
                <span className="text-[10px] font-bold uppercase tracking-wide text-[#0C3B2E] bg-[#0C3B2E]/10 rounded-full px-2 py-0.5 shrink-0">
                  {selected.category}
                </span>
              </div>
              <p className="text-[11px] font-semibold text-gray-500 mt-0.5">Grapes · {selected.crop}</p>
              <div className="mt-4 space-y-3 text-[13px]">
                <div className="bg-[#f5f7f5] border border-[#e4eae4] rounded-xl p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Field Quick Reference</p>
                  <dl className="mt-2 space-y-1.5 text-xs">
                    <div className="flex justify-between"><dt className="text-gray-500">Symptoms</dt><dd className="font-semibold text-gray-900 text-right max-w-[60%]">{selected.symptoms.slice(0, 3).join(', ')}</dd></div>
                    <div className="flex justify-between"><dt className="text-gray-500">Affected Crop</dt><dd className="font-semibold text-gray-900">{selected.crop}</dd></div>
                    {selected.prevention && <div className="flex justify-between"><dt className="text-gray-500">Prevention</dt><dd className="font-semibold text-gray-900 text-right max-w-[60%] truncate">{selected.prevention.slice(0, 60)}…</dd></div>}
                  </dl>
                </div>
                <p className="text-gray-700"><span className="font-bold text-gray-900">Symptoms:</span> {selected.symptoms.join(', ')}</p>
                <p className="text-gray-700"><span className="font-bold text-gray-900">Identification:</span> {selected.identification}</p>
                <p className="text-gray-700"><span className="font-bold text-gray-900">Treatment:</span> {selected.treatment}</p>
                {selected.prevention && (
                  <p className="text-gray-700"><span className="font-bold text-gray-900">Prevention:</span> {selected.prevention}</p>
                )}
                <p className="text-gray-500 bg-[#f5f7f5] border border-[#e4eae4] rounded-xl px-3 py-2.5">
                  <span className="font-bold text-gray-900">Field notes:</span> {selected.fieldNotes}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {articles.map((a) => (
              <div key={a.id} className="bg-white border border-[#e4eae4] rounded-2xl shadow-[0_1px_3px_rgba(12,59,46,0.06)] overflow-hidden flex flex-col">
                <AgriImage
                  src={a.image}
                  alt={`${a.title} — reference photo`}
                  label="Reference image not available"
                  className="w-full h-36"
                />
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-gray-900 truncate">{a.title}</h3>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-[#0C3B2E] bg-[#0C3B2E]/10 rounded-full px-1.5 py-0.5 shrink-0">
                      {a.category}
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold text-gray-500 mt-0.5">{a.crop} · {a.category}</p>
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2">{a.symptoms.join(', ')}</p>
                  <button
                    onClick={() => setSelectedId(a.id)}
                    className="mt-3 w-full text-xs font-bold text-[#0C3B2E] border border-[#0C3B2E]/30 rounded-xl py-2 hover:bg-[#0C3B2E]/5"
                  >
                    View Guide →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {!selected && articles.length === 0 && (
          <div className="bg-white border border-[#e4eae4] rounded-2xl py-12 px-6 text-center">
            <p className="text-sm font-bold text-gray-800">No articles match your search</p>
            <p className="text-xs text-gray-500 mt-1">Try another category or keyword.</p>
          </div>
        )}
      </div>

      <p className="text-[11px] text-gray-500 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
        Educational reference only — this prototype does not provide professional agricultural advice.
        Confirm with your college mentor or agriculture officer before acting in the field.
      </p>

      {FIELD_GUIDE_SECTIONS.map((section) => (
        <div key={section.title} className="bg-white border border-[#e4eae4] rounded-2xl p-4 shadow-[0_1px_3px_rgba(12,59,46,0.06)]">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-8 h-8 rounded-xl bg-[#0C3B2E]/10 text-[#0C3B2E] flex items-center justify-center shrink-0">
              <BookOpen size={16} />
            </span>
            <h3 className="text-sm font-bold text-gray-900">{section.title}</h3>
          </div>
          <ol className="space-y-1.5">
            {section.steps.map((s, i) => (
              <li key={s} className="flex gap-2.5 text-sm text-gray-700">
                <span className="text-[#0C3B2E] font-bold shrink-0">{i + 1}.</span> {s}
              </li>
            ))}
          </ol>
        </div>
      ))}

      <div className="bg-white border border-[#e4eae4] rounded-2xl p-4 shadow-[0_1px_3px_rgba(12,59,46,0.06)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-8 h-8 rounded-xl bg-[#0C3B2E]/10 text-[#0C3B2E] flex items-center justify-center shrink-0">
            <Leaf size={16} />
          </span>
          <h3 className="text-sm font-bold text-gray-900">Disease Observation Guide</h3>
        </div>
        <div className="space-y-3">
          {DISEASE_GUIDE.map((d) => (
            <div key={d.name} className="border border-[#e4eae4] rounded-2xl p-3 bg-[#f5f7f5]">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-gray-900">{d.name}</h4>
                <span className="text-[11px] font-semibold text-gray-500">{d.crop}</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">{d.symptoms}</p>
              <p className="text-xs text-gray-500 mt-1"><span className="font-semibold text-gray-900">Action:</span> {d.action}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
