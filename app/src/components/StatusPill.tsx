import type { AssistantState } from '../core/types';

const LABELS: Record<AssistantState, { title: string; hint: string; dot: string }> = {
  idle: {
    title: 'Tap to talk',
    hint: 'Arushi is off. Press the button and just start speaking.',
    dot: 'bg-violet-400',
  },
  connecting: {
    title: 'Connecting…',
    hint: 'Waking up the voice session. One second.',
    dot: 'bg-amber-300',
  },
  listening: {
    title: 'Listening',
    hint: 'Go ahead — Hindi, English, Hinglish, whatever feels natural.',
    dot: 'bg-emerald-400',
  },
  speaking: {
    title: 'Arushi is speaking',
    hint: 'Talk over her any time — she will stop.',
    dot: 'bg-pink-400',
  },
  error: {
    title: 'Something went wrong',
    hint: 'Check the details below, then tap to try again.',
    dot: 'bg-rose-400',
  },
};

export function StatusPill({ state }: { state: AssistantState }) {
  const { title, hint, dot } = LABELS[state];

  return (
    <div className="text-center">
      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium tracking-wide">
        <span className={`h-2 w-2 rounded-full ${dot} ${state === 'listening' || state === 'speaking' ? 'animate-pulse' : ''}`} />
        <span>{title}</span>
      </div>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-violet-200/60">{hint}</p>
    </div>
  );
}
