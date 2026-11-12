import { useState } from 'react';
import type { ArushiSnapshot } from '../core/types';

interface ChatScreenProps {
  snapshot: ArushiSnapshot;
  onSendText: (text: string) => void;
  onClear: () => void;
  onMic: () => void;
  listening: boolean;
}

/** Chat: type or speak, messages stay inside the card and never clip. */
export function ChatScreen({ snapshot, onSendText, onClear, onMic, listening }: ChatScreenProps) {
  const [draft, setDraft] = useState('');

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    onSendText(text);
    setDraft('');
  };

  return (
    <div className="flex h-full flex-col px-4 pb-3 pt-3">
      <header className="flex shrink-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-bold tracking-tight">Chat</h1>
          <p className="truncate text-[11px] text-white/55">
            {listening ? 'Listening — speak your question' : snapshot.model ?? 'tap the mic to start'}
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="shrink-0 rounded-full border border-[#22d3ee]/45 bg-[#22d3ee]/15 px-3 py-1.5 text-[11px] font-bold text-[#a5f3fc] transition active:scale-95"
        >
          Clear
        </button>
      </header>

      <div className="card mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {snapshot.transcript.length === 0 ? (
          <p className="mt-10 px-4 text-center text-xs text-white/55">
            Nothing here yet. Type below, or tap the mic and just speak.
          </p>
        ) : (
          snapshot.transcript.map((line) => (
            <div
              key={line.id}
              className={`max-w-[88%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                line.role === 'user' ? 'bubble-out ml-auto' : 'bubble-in mr-auto'
              }`}
            >
              <span
                className="mr-1.5 text-[10px] font-bold uppercase tracking-wide"
                style={{ color: line.role === 'user' ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.55)' }}
              >
                {line.role === 'user' ? 'You' : 'Assistant'}
              </span>
              {line.text}
            </div>
          ))
        )}
      </div>

      <div className="card-strong mt-3 flex shrink-0 items-center gap-2 px-2.5 py-2">
        <button
          type="button"
          onClick={onMic}
          aria-label={listening ? 'Stop listening' : 'Ask by voice'}
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition active:scale-95 ${
            listening
              ? 'bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-[0_0_18px_rgba(244,63,94,0.7)]'
              : 'bg-[#22d3ee]/20 text-[#a5f3fc]'
          }`}
        >
          {listening ? (
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
              <rect x="6" y="6" width="12" height="12" rx="2.5" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
              <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Z" />
              <path d="M6.5 11a5.5 5.5 0 0 0 11 0h1.5a7 7 0 0 1-6.25 6.95V21h-1.5v-3.05A7 7 0 0 1 5 11z" />
            </svg>
          )}
        </button>

        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              send();
            }
          }}
          className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-white/45 focus:outline-none"
          placeholder="Type a message…"
          autoComplete="off"
        />

        <button
          type="button"
          onClick={send}
          aria-label="Send"
          className="btn-primary grid h-10 w-10 shrink-0 place-items-center rounded-xl transition active:scale-95"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
            <path d="M3 11.5 21 3l-8.5 18-2.2-7.3z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
