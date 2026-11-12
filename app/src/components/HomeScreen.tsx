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
    <div className="flex min-h-full flex-col items-center px-4 pb-4 pt-3">
      <div className="card w-full max-w-md overflow-hidden p-4">
        <div className="relative flex h-[210px] w-full items-center justify-center overflow-hidden rounded-[18px] bg-[radial-gradient(circle_at_50%_40%,#ede7fb,#f7f4fe_70%)]">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="absolute inset-0 h-full w-full object-cover object-top" />
          ) : null}

          <button
            type="button"
            onClick={onMicPress}
            aria-label={busy ? 'Stop listening' : 'Start talking'}
            className={`relative z-10 grid h-[124px] w-[124px] place-items-center rounded-full transition ${
              busy
                ? 'bg-gradient-to-br from-rose-500 to-pink-600 shadow-[0_18px_40px_-16px_rgba(219,39,119,0.85)]'
                : 'bg-gradient-to-br from-violet-500 to-violet-700 shadow-[0_18px_40px_-16px_rgba(109,40,217,0.8)]'
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
              <svg viewBox="0 0 24 24" className="h-12 w-12 fill-white">
                <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Z" />
                <path d="M6.5 11a5.5 5.5 0 0 0 11 0h1.5a7 7 0 0 1-6.25 6.95V21h-1.5v-3.05A7 7 0 0 1 5 11z" />
              </svg>
            )}
          </button>
        </div>

        <h2 className="mt-3 text-center text-[26px] font-bold tracking-tight text-[#1f1235]">{STATUS_LABEL[snapshot.state]}</h2>
        <p className="mt-1 text-center text-[13px] leading-relaxed text-[#6b5b8a]">
          {snapshot.state === 'listening'
            ? 'Speak in Hindi, English or Hinglish'
            : snapshot.state === 'error'
              ? snapshot.error ?? 'Something went wrong'
              : 'Your voice assistant is ready'}
        </p>

        {!avatarUrl ? (
          <p className="mt-2 text-center text-[11px] text-[#9385ae]">
            Add an avatar image in Settings to show a portrait here.
          </p>
        ) : null}

        <div className="mt-3 flex items-center justify-center gap-1.5">
          <span className="h-3 w-1 rounded bg-[#8b5cf6]" />
          <span className="h-2 w-1 rounded bg-[#c4b5fd]" />
          <span className="h-3 w-1 rounded bg-[#8b5cf6]" />
          <span className="h-2 w-1 rounded bg-[#c4b5fd]" />
          <span className="h-3 w-1 rounded bg-[#8b5cf6]" />
          <span className="h-2 w-1 rounded bg-[#c4b5fd]" />
        </div>
      </div>

      <form
        className="card-strong mt-3 flex w-full max-w-md items-center gap-2 px-3 py-2"
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
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#ede7fb] text-[#7c3aed]">
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
            <path d="M12 2l1.9 5.6L19.5 9l-4.3 3.6L16.6 19 12 15.8 7.4 19l1.4-6.4L4.5 9l5.6-1.4z" />
          </svg>
        </span>
        <input
          name="ask"
          className="min-w-0 flex-1 bg-transparent text-sm text-[#1f1235] placeholder:text-[#9385ae] focus:outline-none"
          placeholder="Ask me anything…"
          autoComplete="off"
        />
        <button
          type="submit"
          aria-label="Send"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 text-white transition active:scale-95"
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
            className="card flex flex-col items-center gap-1.5 px-2 py-3 text-center transition active:scale-[0.98]"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#ede7fb] text-[#7c3aed]">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9">
                <path d={action.icon} />
              </svg>
            </span>
            <span className="text-xs font-bold text-[#1f1235]">{action.title}</span>
            <span className="text-[10px] leading-tight text-[#9385ae]">{action.subtitle}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
