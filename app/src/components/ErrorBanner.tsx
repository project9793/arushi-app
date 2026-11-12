interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

/**
 * The raw server text for a quota failure is a paragraph long and repeats
 * itself. Detect the common cases and show one plain sentence, keeping the
 * original text available underneath in small print.
 */
function summarise(message: string): { headline: string; detail: string | null } {
  const lower = message.toLowerCase();

  if (lower.includes('quota') || lower.includes('billing') || lower.includes('code 1011')) {
    return {
      headline:
        'Aaj ka free quota khatam ho gaya. Kal reset hone par phir chalega — ya Google Cloud me billing on karo, ya doosre project ki nayi key daalo.',
      detail: null,
    };
  }

  if (lower.includes('api key not valid') || lower.includes('api_key_invalid')) {
    return { headline: 'API key galat hai. Settings me key dobara daalo.', detail: null };
  }

  if (lower.includes('did not finish setup') || lower.includes('before setup completed')) {
    return {
      headline: 'Gemini se connection nahi bana. Settings me doosra model try karo.',
      detail: message.slice(0, 240),
    };
  }

  if (lower.includes('microphone') || lower.includes('permission')) {
    return { headline: 'Microphone ki permission chahiye.', detail: null };
  }

  return { headline: message.slice(0, 220), detail: null };
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  const { headline, detail } = summarise(message);

  return (
    <div
      role="alert"
      className="w-full max-w-md rounded-2xl border border-rose-400/40 bg-rose-500/15 px-4 py-3 text-left"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-semibold leading-relaxed text-rose-50">{headline}</p>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="shrink-0 rounded-full border border-white/20 px-2 py-0.5 text-[11px] font-bold text-rose-100"
        >
          ✕
        </button>
      </div>

      {detail ? (
        <p className="mt-2 max-h-20 overflow-y-auto break-words text-[11px] leading-relaxed text-rose-100/70">
          {detail}
        </p>
      ) : null}
    </div>
  );
}
