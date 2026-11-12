import type { ArushiSnapshot } from '../core/types';
import { ArushiOrb } from './ArushiOrb';

interface TalkScreenProps {
  snapshot: ArushiSnapshot;
  onStop: () => void;
}

const LABEL: Record<ArushiSnapshot['state'], { title: string; hint: string }> = {
  idle: { title: 'Tap the mic to start', hint: 'Your assistant is off.' },
  connecting: { title: 'Connecting…', hint: 'Waking up the voice session.' },
  listening: { title: 'Listening', hint: 'Go ahead — Hindi, English, Hinglish, whatever feels natural.' },
  speaking: { title: 'Speaking', hint: 'Talk over her any time — she will stop.' },
  error: { title: 'Something went wrong', hint: 'The message below says what happened.' },
};

/** Live conversation, inside a bordered card with a clear way back home. */
export function TalkScreen({ snapshot, onStop }: TalkScreenProps) {
  const { title, hint } = LABEL[snapshot.state];
  const recent = snapshot.transcript.slice(-6);

  return (
    <div className="px-4 pb-4 pt-3">
      <div className="mx-auto max-w-md">
        <div className="mb-3 flex items-center justify-between gap-2">
          <button type="button" onClick={onStop} className="chip-gold">
            ← Back to Home
          </button>
          <span className="chip">{snapshot.model ?? 'voice'}</span>
        </div>

        <div className="card flex flex-col items-center px-4 py-6">
          <ArushiOrb state={snapshot.state} micLevel={snapshot.micLevel} />

          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#f3bd57]/45 bg-[#f3bd57]/15 px-4 py-1.5 text-sm font-bold text-[#ffe6ab]">
            <span
              className={`h-2 w-2 rounded-full ${
                snapshot.state === 'listening'
                  ? 'bg-emerald-400'
                  : snapshot.state === 'speaking'
                    ? 'bg-pink-400'
                    : snapshot.state === 'error'
                      ? 'bg-rose-400'
                      : 'bg-amber-300'
              } ${snapshot.state === 'listening' || snapshot.state === 'speaking' ? 'animate-pulse' : ''}`}
            />
            {title}
          </div>

          <p className="mt-3 max-w-sm text-center text-sm leading-relaxed text-[#ffe9d2]/80">{hint}</p>

          {snapshot.state === 'error' && snapshot.error ? (
            <p className="mt-3 max-w-sm rounded-xl border border-rose-400/45 bg-rose-500/20 px-3 py-2 text-center text-xs leading-relaxed text-rose-50">
              {snapshot.error}
            </p>
          ) : null}

          <button
            type="button"
            onClick={onStop}
            aria-label="Stop the conversation"
            className="mt-6 grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-rose-500 to-pink-600 shadow-[0_16px_40px_-10px_rgba(240,97,154,0.9)] transition active:scale-95"
          >
            <svg viewBox="0 0 24 24" className="h-7 w-7 fill-white">
              <rect x="6" y="6" width="12" height="12" rx="2.5" />
            </svg>
          </button>
        </div>

        <div className="card mt-3 max-h-52 overflow-y-auto p-3">
          {recent.length === 0 ? (
            <p className="py-4 text-center text-xs text-[#ffe9d2]/60">The conversation will appear here as you speak.</p>
          ) : (
            <div className="space-y-2">
              {recent.map((line) => (
                <div
                  key={line.id}
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    line.role === 'user'
                      ? 'ml-auto border border-[#f3bd57]/40 bg-[#f3bd57]/20 text-[#fff8ee]'
                      : 'mr-auto border border-[#ffd9a8]/25 bg-[#ffd9a8]/12 text-[#fff4e2]'
                  }`}
                >
                  <span className="mr-1.5 text-[10px] font-bold uppercase tracking-wide text-[#ffe6ab]/75">
                    {line.role === 'user' ? 'You' : 'Assistant'}
                  </span>
                  {line.text}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
