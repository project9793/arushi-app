import type { TranscriptLine } from '../core/types';

export function TranscriptFeed({ lines }: { lines: TranscriptLine[] }) {
  if (lines.length === 0) {
    return (
      <p className="text-center text-xs text-violet-200/30">
        Spoken conversation only — this is just a log, not a chat box.
      </p>
    );
  }

  return (
    <div className="flex max-h-40 flex-col gap-2 overflow-y-auto px-1">
      {lines.slice(-8).map((line) => (
        <div
          key={line.id}
          className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
            line.role === 'user'
              ? 'self-end bg-white/10 text-violet-50'
              : 'self-start bg-violet-500/15 text-violet-100'
          }`}
        >
          <span className="mr-1.5 font-semibold text-violet-300/70">{line.role === 'user' ? 'You' : 'Arushi'}</span>
          {line.text}
        </div>
      ))}
    </div>
  );
}
