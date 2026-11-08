import type { ArushiSnapshot } from '../core/types';

interface HomeScreenProps {
  snapshot: ArushiSnapshot;
  avatarUrl: string;
  onMicPress: () => void;
  onSendText: (text: string) => void;
  onOpenChat: () => void;
}

const STATUS_LABEL: Record<ArushiSnapshot['state'], string> = {
  idle: 'Tap to Talk',
  connecting: 'Connecting…',
  listening: 'Listening…',
  speaking: 'Speaking…',
  error: 'Tap to retry',
};

const ACTIONS = [
  { id: 'chat', title: 'Chat', subtitle: 'Get instant answers', icon: 'M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H9l-5 4V5a1 1 0 0 1 1-1z' },
  { id: 'image', title: 'Create Image', subtitle: 'Photos into sketches', icon: 'M4 5h16v14H4zM8 13l3-3 4 4 2-2 3 3' },
  { id: 'write', title: 'Write', subtitle: 'Notes, code, content', icon: 'M6 3h9l4 4v14H6zM14 3v5h5' },
];

export function HomeScreen({ snapshot, avatarUrl, onMicPress, onSendText, onOpenChat }: HomeScreenProps) {
  const busy = snapshot.state === 'connecting' || snapshot.state === 'listening' || snapshot.state === 'speaking';

  return (
    <div className="flex min-h-full flex-col items-center px-4 pb-32 pt-2">
      <div className="relative w-full max-w-md overflow-hidden rounded-[28px] bg-gradient-to-b from-violet-900/60 via-[#1a1030] to-[#0b0618]">
        <div className="relative h-[300px] w-full">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-full w-full object-cover object-top opacity-95" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_50%_35%,rgba(168,85,247,0.35),transparent_60%)]">
              <p className="max-w-[16rem] text-center text-[11px] leading-relaxed text-violet-200/50">
                Add an avatar image in Settings to show a portrait here.
              </p>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0b0618] to-transparent" />

          <button
            type="button"
            onClick={onMicPress}
            aria-label={busy ? 'Stop listening' : 'Start talking'}
            className={`absolute left-1/2 top-1/2 grid h-[120px] w-[120px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-[3px] transition ${
              busy
                ? 'border-rose-300 bg-gradient-to-br from-rose-600/90 to-fuchsia-700/90 shadow-[0_0_60px_rgba(244,63,94,0.7)]'
                : 'border-violet-300/80 bg-gradient-to-br from-[#1b1233]/95 to-[#241640]/95 shadow-[0_0_60px_rgba(139,92,246,0.55)]'
            }`}
          >
            {snapshot.state === 'speaking' ? (
              <div className="flex items-end gap-1">
                <span className="h-4 w-1 animate-pulse rounded bg-white" />
                <span className="h-7 w-1 animate-pulse rounded bg-white" />
                <span className="h-5 w-1 animate-pulse rounded bg-white" />
                <span className="h-8 w-1 animate-pulse rounded bg-white" />
              </div>
            ) : (
              <svg viewBox="0 0 24 24" className="h-11 w-11 fill-white/90">
                <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Z" />
                <path d="M6.5 11a5.5 5.5 0 0 0 11 0h1.5a7 7 0 0 1-6.25 6.95V21h-1.5v-3.05A7 7 0 0 1 5 11z" />
              </svg>
            )}
          </button>
        </div>

        <h2 className="mt-1 text-center text-2xl font-semibold tracking-tight text-white">{STATUS_LABEL[snapshot.state]}</h2>
        <p className="mt-1 text-center text-xs text-violet-200/50">
          {snapshot.state === 'listening'
            ? 'Speak in Hindi, English or Hinglish'
            : snapshot.state === 'error'
              ? snapshot.error ?? 'Something went wrong'
              : 'Your voice assistant is ready'}
        </p>

        <div className="mt-3 flex items-center justify-center gap-1.5">
          <span className="h-3 w-1 rounded bg-violet-400/70" />
          <span className="h-2 w-1 rounded bg-violet-400/40" />
          <span className="h-3 w-1 rounded bg-violet-400/70" />
          <span className="h-2 w-1 rounded bg-violet-400/40" />
          <span className="h-3 w-1 rounded bg-violet-400/70" />
          <span className="h-2 w-1 rounded bg-violet-400/40" />
        </div>
      </div>

      <form
        className="mt-4 flex w-full max-w-md items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2"
        onSubmit={(event) => {
          event.preventDefault();
          const input = new FormData(event.currentTarget).get('ask');
          const text = typeof input === 'string' ? input.trim() : '';
          if (text) {
            onSendText(text);
            event.currentTarget.reset();
          }
        }}
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-600/30 text-violet-200">
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
            <path d="M12 2l1.9 5.6L19.5 9l-4.3 3.6L16.6 19 12 15.8 7.4 19l1.4-6.4L4.5 9l5.6-1.4z" />
          </svg>
        </span>
        <input
          name="ask"
          className="min-w-0 flex-1 bg-transparent text-sm text-violet-50 placeholder:text-violet-200/40 focus:outline-none"
          placeholder="Ask me anything…"
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

      <div className="mt-3 grid w-full max-w-md grid-cols-3 gap-2">
        {ACTIONS.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={onOpenChat}
            className="flex flex-col items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.04] px-2 py-3 text-center transition hover:bg-white/[0.08]"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-600/25 text-violet-200">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d={action.icon} />
              </svg>
            </span>
            <span className="text-xs font-semibold text-violet-50">{action.title}</span>
            <span className="text-[10px] leading-tight text-violet-200/45">{action.subtitle}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
