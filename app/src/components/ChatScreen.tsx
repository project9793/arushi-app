import type { ArushiSnapshot } from '../core/types';

interface ChatScreenProps {
  snapshot: ArushiSnapshot;
  onSendText: (text: string) => void;
  onClear: () => void;
}

/** Chat fills the space it is given; only the message list scrolls. */
export function ChatScreen({ snapshot, onSendText, onClear }: ChatScreenProps) {
  return (
    <div className="flex h-full flex-col px-4 pb-3 pt-3">
      <header className="flex shrink-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-bold tracking-tight">Chat</h1>
          <p className="truncate text-[11px] text-white/55">{snapshot.model ?? 'not connected'}</p>
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
            Nothing here yet. Tap the mic on Home, or type below.
          </p>
        ) : (
          snapshot.transcript.map((line) => (
            <div
              key={line.id}
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
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

      <form
        className="card-strong mt-3 flex shrink-0 items-center gap-2 px-3 py-2"
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
          className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-white/45 focus:outline-none"
          placeholder="Type a message…"
          autoComplete="off"
        />
        <button
          type="submit"
          aria-label="Send"
          className="btn-primary grid h-9 w-9 shrink-0 place-items-center rounded-xl transition active:scale-95"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
            <path d="M3 11.5 21 3l-8.5 18-2.2-7.3z" />
          </svg>
        </button>
      </form>
    </div>
  );
}
