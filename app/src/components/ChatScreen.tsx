import type { ArushiSnapshot } from '../core/types';

interface ChatScreenProps {
  snapshot: ArushiSnapshot;
  onSendText: (text: string) => void;
  onClear: () => void;
}

/**
 * Chat stays inside a fixed-height box with its own scroll, so a long
 * conversation never stretches the page or pushes the bottom bar away.
 */
export function ChatScreen({ snapshot, onSendText, onClear }: ChatScreenProps) {
  return (
    <div className="flex h-[calc(100dvh-8.5rem)] flex-col px-4 pt-3">
      <header className="flex shrink-0 items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Chat</h1>
          <p className="text-[11px] text-violet-200/45">{snapshot.model ?? 'not connected'}</p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="rounded-full border border-white/10 px-3 py-1.5 text-[11px] text-violet-100/80 transition hover:bg-white/10"
        >
          Clear
        </button>
      </header>

      <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-3">
        {snapshot.transcript.length === 0 ? (
          <p className="mt-8 text-center text-xs text-violet-200/35">
            Nothing here yet. Tap the mic on Home, or type below.
          </p>
        ) : (
          snapshot.transcript.map((line) => (
            <div
              key={line.id}
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                line.role === 'user'
                  ? 'ml-auto bg-violet-600/30 text-violet-50'
                  : 'mr-auto bg-white/[0.06] text-violet-100'
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

      <form
        className="mt-3 flex shrink-0 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2"
        onSubmit={(event) => {
          event.preventDefault();
          const input = new FormData(event.currentTarget).get('message');
          const text = typeof input === 'string' ? input.trim() : '';
          if (text) {
            onSendText(text);
            event.currentTarget.reset();
          }
        }}
      >
        <input
          name="message"
          className="min-w-0 flex-1 bg-transparent text-sm text-violet-50 placeholder:text-violet-200/40 focus:outline-none"
          placeholder="Type a message…"
          autoComplete="off"
        />
        <button
          type="submit"
          aria-label="Send"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-500 text-white transition hover:bg-violet-400"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
            <path d="M3 11.5 21 3l-8.5 18-2.2-7.3z" />
          </svg>
        </button>
      </form>
    </div>
  );
}
