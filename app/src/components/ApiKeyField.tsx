import { useState } from 'react';
import { clearStoredApiKey, getStoredApiKey, maskApiKey, setStoredApiKey } from '../core/apiKeyStore';

/**
 * Paste-your-own-key field. Nothing is sent anywhere: the key goes into this
 * browser's localStorage and is used only for the Gemini connection.
 *
 * This is what lets a public static deployment work without a key in the bundle.
 */
export function ApiKeyField() {
  const existing = getStoredApiKey();
  const [value, setValue] = useState('');
  const [saved, setSaved] = useState<string | null>(existing);

  const save = () => {
    setStoredApiKey(value);
    setSaved(getStoredApiKey());
    setValue('');
  };

  const remove = () => {
    clearStoredApiKey();
    setSaved(null);
    setValue('');
  };

  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-black/25 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-200/60">Gemini API key</p>
        <span className={`text-[11px] ${saved ? 'text-emerald-300/90' : 'text-amber-300/90'}`}>
          {saved ? `saved · ${maskApiKey(saved)}` : 'not set'}
        </span>
      </div>

      <div className="mt-2 flex gap-2">
        <input
          type="password"
          inputMode="text"
          autoComplete="off"
          spellCheck={false}
          placeholder="AIza…"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-violet-50 placeholder:text-violet-200/25 focus:border-violet-400/60 focus:outline-none"
          aria-label="Gemini API key"
        />
        <button
          type="button"
          onClick={save}
          disabled={!value.trim()}
          className="rounded-lg bg-violet-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Save
        </button>
        {saved ? (
          <button
            type="button"
            onClick={remove}
            className="rounded-lg border border-white/10 px-3 py-2 text-xs text-violet-100/80 transition hover:bg-white/10"
          >
            Clear
          </button>
        ) : null}
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-violet-200/40">
        Stored in this browser only (localStorage). Never sent anywhere except Google's Gemini API.
      </p>
    </div>
  );
}
