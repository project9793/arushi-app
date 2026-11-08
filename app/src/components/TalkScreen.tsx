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
  error: { title: 'Something went wrong', hint: 'Check the message below, then tap to try again.' },
};

/**
 * The live conversation screen: opened by tapping the mic on Home.
 * Everything said here is saved to History when the session ends.
 */
export function TalkScreen({ snapshot, onStop }: TalkScreenProps) {
  const { title, hint } = LABEL[snapshot.state];
  const recent = snapshot.transcript.slice(-6);

  return (
    <div className="flex min-h-full flex-col items-center px-4 pb-8 pt-6">
      <div className="flex w-full max-w-md items-center justify-between">
        <button
          type="button"
          onClick={onStop}
          className="rounded-full border border-white/10 px-3 py-1.5 text-[11px] text-violet-100/80 transition hover:bg-white/10"
        >
          ← Home
        </button>
        <span className="glass rounded-full px-3 py-1 text-[11px] font-medium text-violet-100/80">
          {snapshot.model ?? 'voice'}
        </span>
      </div>

      <div className="mt-6">
        <ArushiOrb state={snapshot.state} micLevel={snapshot.micLevel} />
      </div>

      <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium">
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
        <span>{title}</span>
      </div>

      <p className="mt-3 max-w-sm text-center text-sm leading-relaxed text-violet-200/60">{hint}</p>

      {snapshot.state === 'error' && snapshot.error ? (
        <p className="mt-3 max-w-sm rounded-xl bg-rose-500/10 px-3 py-2 text-center text-[11px] leading-relaxed text-rose-200">
          {snapshot.error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={onStop}
        aria-label="Stop the conversation"
        className="mt-8 grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-rose-500 to-fuchsia-600 shadow-[0_16px_40px_-10px_rgba(244,63,94,0.85)] transition active:scale-95"
      >
        <svg viewBox="0 0 24 24" className="h-7 w-7 fill-white">
          <rect x="6" y="6" width="12" height="12" rx="2.5" />
        </svg>
      </button>

      <div className="mt-8 w-full max-w-md space-y-2">
        {recent.length === 0 ? (
          <p className="text-center text-xs text-violet-200/35">The conversation will appear here as you speak.</p>
        ) : (
          recent.map((line) => (
            <div
              key={line.id}
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                line.role === 'user' ? 'ml-auto bg-violet-600/30 text-violet-50' : 'mr-auto bg-white/[0.06] text-violet-100'
              }`}
            >
              <span className="mr-1.5 text-[10px] font-semibold uppercase tracking-wide text-violet-300/60">
                {line.role === 'user' ? 'You' : 'Assistant'}
              </span>
              {line.text}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
