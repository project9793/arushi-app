interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="glass w-full rounded-2xl border-rose-400/30 bg-rose-500/10 px-4 py-3 text-left text-xs leading-relaxed text-rose-100"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="whitespace-pre-wrap">{message}</p>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-full px-2 text-rose-200/70 transition hover:text-rose-100"
          aria-label="Dismiss error"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
