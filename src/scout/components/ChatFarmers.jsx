import React, { useState } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card.jsx';
import { CHAT_THREADS } from '../mockData.js';

function seedFor(t) {
  const opener =
    t.id === 'CH-1'
      ? 'Namaste! White powder on grape leaves is spreading.'
      : t.id === 'CH-2'
        ? 'Namaste! Trap catch is rising in Block C4.'
        : 'Namaste! Thanks for visiting my field yesterday.';
  const seed = [{ from: 'farmer', text: opener, time: t.id === 'CH-3' ? 'Yesterday' : '9:42 AM' }];
  if (t.id !== 'CH-3') {
    seed.push({ from: 'student', text: 'Namaste! I will check it during my field visit today.', time: '9:50 AM' });
  }
  if (t.lastMessage && t.lastMessage !== opener) {
    seed.push({ from: 'farmer', text: t.lastMessage, time: t.time });
  }
  return seed;
}

/**
 * Master phase — Chat with Farmers (local mock messaging).
 * Threads link to farmer cases; sent messages stay in local state with
 * a canned farmer reply. No backend or real-time messaging.
 */
export default function ChatFarmers() {
  const [activeId, setActiveId] = useState(CHAT_THREADS[0]?.id);
  const [messagesByThread, setMessagesByThread] = useState(() =>
    Object.fromEntries(CHAT_THREADS.map((t) => [t.id, seedFor(t)]))
  );
  const [draft, setDraft] = useState('');
  const [readIds, setReadIds] = useState({});

  const active = CHAT_THREADS.find((c) => c.id === activeId) || CHAT_THREADS[0];
  const messages = messagesByThread[active.id] || [];

  const openThread = (id) => {
    setActiveId(id);
    setReadIds((prev) => ({ ...prev, [id]: true }));
  };

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setMessagesByThread((prev) => ({
      ...prev,
      [active.id]: [...(prev[active.id] || []), { from: 'student', text, time: 'Just now' }],
    }));
    setDraft('');
    setTimeout(() => {
      setMessagesByThread((prev) => ({
        ...prev,
        [active.id]: [
          ...(prev[active.id] || []),
          { from: 'farmer', text: 'Thanks for the update! I will wait for your field visit.', time: 'Just now' },
        ],
      }));
    }, 1200);
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-gov-navy">Chat with Farmers</h1>
        <p className="text-sm text-gov-textSec mt-0.5">Mock conversations linked to farmer cases • local only</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card padded={false} className="overflow-hidden sm:col-span-1">
          <div className="divide-y divide-gray-100">
            {CHAT_THREADS.map((t) => {
              const last = messagesByThread[t.id]?.slice(-1)[0];
              return (
                <button
                  key={t.id}
                  onClick={() => openThread(t.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-gov-bg ${t.id === activeId ? 'bg-gov-blue/5 border-l-2 border-gov-blue' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-gov-navy truncate">{t.farmer}</p>
                    {t.unread > 0 && !readIds[t.id] && (
                      <span className="bg-gov-blue text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
                        {t.unread}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-semibold text-gov-blue truncate mt-0.5">{t.caseLabel}</p>
                  <p className="text-xs text-gov-textSec truncate mt-0.5">{last?.text || t.lastMessage}</p>
                  <p className="text-[11px] text-gov-textSec mt-0.5">{t.village} • {t.time}</p>
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="sm:col-span-2 flex flex-col">
          <CardHeader icon={MessageCircle} title={active.farmer} subtitle={`${active.village} • Case: ${active.caseLabel || 'General'}`} />
          <div className="space-y-2 text-sm">
            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.from === 'student'
                    ? 'bg-gov-blue text-white rounded-lg px-3 py-2 max-w-[85%] ml-auto'
                    : 'bg-gov-bg border border-gov-border rounded-lg px-3 py-2 max-w-[85%]'
                }
              >
                <p className={m.from === 'student' ? '' : 'text-gov-text'}>{m.text}</p>
                <p className={`text-[10px] mt-1 ${m.from === 'student' ? 'text-white/70' : 'text-gov-textSec'}`}>{m.time}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-4">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') send();
              }}
              placeholder="Type a reply… (mock, stays on this device)"
              className="input"
            />
            <button onClick={send} className="bg-gov-blue hover:bg-gov-navy text-white rounded-lg p-2.5 shrink-0" title="Send (mock)">
              <Send size={16} />
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
