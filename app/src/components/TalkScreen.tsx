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

/** Live conversation, inside a white card with a clear way back home. */
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

          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#e6dcf8] bg-[#f3eefe] px-4 py-1.5 text-sm font-bold text-[#6d28d9]">
            <span
              className={`h-2 w-2 rounded-full ${
                snapshot.state === 'listening'
                  ? 'bg-emerald-500'
                  : snapshot.state === 'speaking'
                    ? 'bg-violet-500'
                    : snapshot.state === 'error'
                      ? 'bg-rose-500'
                      : 'bg-amber-400'
              } ${snapshot.state === 'listening' || snapshot.state === 'speaking' ? 'animate-pulse' : ''}`}
            />
            {title}
          </div>

          <p className="mt-3 max-w-sm text-center text-sm leading-relaxed text-[#6b5b8a]">{hint}</p>

          {snapshot.state === 'error' && snapshot.error ? (
            <p className="mt-3 max-w-sm rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-center text-xs leading-relaxed text-rose-700">
              {snapshot.error}
            </p>
          ) : null}

          <button
            type="button"
            onClick={onStop}
            aria-label="Stop the conversation"
            className="mt-6 grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-rose-500 to-pink-600 shadow-[0_18px_36px_-14px_rgba(219,39,119,0.8)] transition active:scale-95"
          >
            <svg viewBox="0 0 24 24" className="h-7 w-7 fill-white">
              <rect x="6" y="6" width="12" height="12" rx="2.5" />
            </svg>
          </button>
        </div>

        <div className="card mt-3 max-h-52 overflow-y-auto p-3">
          {recent.length === 0 ? (
            <p className="py-4 text-center text-xs text-[#9385ae]">The conversation will appear here as you speak.</p>
          ) : (
            <div className="space-y-2">
              {recent.map((line) => (
                <div
                  key={line.id}
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    line.role === 'user' ? 'bubble-out ml-auto' : 'bubble-in mr-auto'
                  }`}
                >
                  <span
                    className="mr-1.5 text-[10px] font-bold uppercase tracking-wide"
                    style={{ color: line.role === 'user' ? 'rgba(255,255,255,0.78)' : '#9385ae' }}
                  >
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
