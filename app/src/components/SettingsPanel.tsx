import { useState } from 'react';
import {
  DEFAULT_SETTINGS,
  GROK_VOICES,
  PERSONA_PRESETS,
  PROVIDERS,
  SARVAM_LANGUAGES,
  SARVAM_VOICES,
  VOICES,
  loadSettings,
  resetSettings,
  saveSettings,
  type AppSettings,
  type LanguageMode,
  type PersonaPreset,
  type ProviderId,
  type ReplyLength,
} from '../core/settings';
import { getStoredApiKey, maskApiKey, setStoredApiKey } from '../core/apiKeyStore';

const FIELD =
  'w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-violet-50 placeholder:text-violet-200/25 focus:border-violet-400/60 focus:outline-none';
const LABEL = 'mb-1 block text-[11px] font-semibold uppercase tracking-wide text-violet-200/60';

/**
 * Everything the user can change: provider, model, keys, who the assistant is,
 * how it behaves, what it sounds like, and whether it may search the web.
 */
export function SettingsPanel({ onSaved }: { onSaved?: (settings: AppSettings) => void }) {
  const [draft, setDraft] = useState<AppSettings>(() => loadSettings());
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [geminiKey, setGeminiKey] = useState<string>(() => getStoredApiKey() ?? '');

  const patch = (changes: Partial<AppSettings>) => setDraft((current) => ({ ...current, ...changes }));

  const save = () => {
    saveSettings(draft);
    if (draft.provider === 'gemini') setStoredApiKey(geminiKey);
    setSavedAt(Date.now());
    onSaved?.(draft);
  };

  const reset = () => {
    const fresh = resetSettings();
    setDraft(fresh);
    setSavedAt(Date.now());
    onSaved?.(fresh);
  };

  const providerHint = PROVIDERS.find((provider) => provider.id === draft.provider)?.hint ?? '';

  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4 text-left">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-200/60">Assistant settings</p>
        <span className={`text-[11px] ${savedAt ? 'text-emerald-300/90' : 'text-violet-200/40'}`}>
          {savedAt ? 'saved · tap the mic to apply' : 'not saved'}
        </span>
      </div>

      <div className="mt-3">
        <label className={LABEL} htmlFor="provider">
          AI provider
        </label>
        <select
          id="provider"
          className={FIELD}
          value={draft.provider}
          onChange={(event) => patch({ provider: event.target.value as ProviderId })}
        >
          {PROVIDERS.map((provider) => (
            <option key={provider.id} value={provider.id}>
              {provider.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-[11px] leading-relaxed text-violet-200/40">{providerHint}</p>
      </div>

      {draft.provider === 'gemini' ? (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={LABEL} htmlFor="gemini-key">
              Gemini API key
            </label>
            <input
              id="gemini-key"
              type="password"
              className={FIELD}
              value={geminiKey}
              placeholder="AIza… or AQ.…"
              onChange={(event) => setGeminiKey(event.target.value)}
            />
            <p className="mt-1 text-[11px] text-violet-200/40">
              {geminiKey ? `currently saved: ${maskApiKey(geminiKey)}` : 'no key saved yet'}
            </p>
          </div>
          <div>
            <label className={LABEL} htmlFor="model">
              Model name
            </label>
            <input
              id="model"
              className={FIELD}
              value={draft.modelOverride}
              placeholder="gemini-3.8-live"
              onChange={(event) => patch({ modelOverride: event.target.value })}
            />
            <p className="mt-1 text-[11px] text-violet-200/40">leave empty to use the default</p>
          </div>
        </div>
      ) : null}

      {draft.provider === 'grok' ? (
        <div className="mt-3">
          <label className={LABEL} htmlFor="xai-key">
            xAI API key
          </label>
          <input
            id="xai-key"
            type="password"
            className={FIELD}
            value={draft.xaiApiKey}
            placeholder="xai-..."
            onChange={(event) => patch({ xaiApiKey: event.target.value })}
          />
        </div>
      ) : null}

      {draft.provider === 'sarvam' ? (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={LABEL} htmlFor="sarvam-key">
              Sarvam API key
            </label>
            <input
              id="sarvam-key"
              type="password"
              className={FIELD}
              value={draft.sarvamApiKey}
              placeholder="sk_..."
              onChange={(event) => patch({ sarvamApiKey: event.target.value })}
            />
          </div>
          <div>
            <label className={LABEL} htmlFor="sarvam-language">
              Sarvam language
            </label>
            <select
              id="sarvam-language"
              className={FIELD}
              value={draft.sarvamLanguage}
              onChange={(event) => patch({ sarvamLanguage: event.target.value })}
            >
              {SARVAM_LANGUAGES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : null}

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={LABEL} htmlFor="assistant-name">
            Assistant name
          </label>
          <input
            id="assistant-name"
            className={FIELD}
            value={draft.assistantName}
            placeholder="Arushi"
            onChange={(event) => patch({ assistantName: event.target.value })}
          />
        </div>
        <div>
          <label className={LABEL} htmlFor="user-name">
            Your name
          </label>
          <input
            id="user-name"
            className={FIELD}
            value={draft.userName}
            placeholder="Siya"
            onChange={(event) => patch({ userName: event.target.value })}
          />
        </div>

        <div>
          <label className={LABEL} htmlFor="persona">
            Character
          </label>
          <select
            id="persona"
            className={FIELD}
            value={draft.preset}
            onChange={(event) => patch({ preset: event.target.value as PersonaPreset })}
          >
            {Object.entries(PERSONA_PRESETS).map(([key, preset]) => (
              <option key={key} value={key}>
                {preset.label}
              </option>
            ))}
            <option value="custom">Custom (write your own)</option>
          </select>
        </div>

        <div>
          <label className={LABEL} htmlFor="voice">
            Voice
          </label>
          {draft.provider === 'gemini' ? (
            <select id="voice" className={FIELD} value={draft.voice} onChange={(event) => patch({ voice: event.target.value })}>
              {VOICES.map((voice) => (
                <option key={voice} value={voice}>
                  {voice}
                </option>
              ))}
            </select>
          ) : null}
          {draft.provider === 'grok' ? (
            <select
              id="voice"
              className={FIELD}
              value={draft.grokVoice}
              onChange={(event) => patch({ grokVoice: event.target.value })}
            >
              {GROK_VOICES.map((voice) => (
                <option key={voice} value={voice}>
                  {voice}
                </option>
              ))}
            </select>
          ) : null}
          {draft.provider === 'sarvam' ? (
            <select
              id="voice"
              className={FIELD}
              value={draft.sarvamVoice}
              onChange={(event) => patch({ sarvamVoice: event.target.value })}
            >
              {SARVAM_VOICES.map((voice) => (
                <option key={voice} value={voice}>
                  {voice}
                </option>
              ))}
            </select>
          ) : null}
        </div>

        <div>
          <label className={LABEL} htmlFor="language">
            Language
          </label>
          <select
            id="language"
            className={FIELD}
            value={draft.language}
            onChange={(event) => patch({ language: event.target.value as LanguageMode })}
          >
            <option value="auto">Auto — match the user</option>
            <option value="hindi">Always Hindi</option>
            <option value="english">Always English</option>
            <option value="hinglish">Always Hinglish</option>
          </select>
        </div>

        <div>
          <label className={LABEL} htmlFor="length">
            Reply length
          </label>
          <select
            id="length"
            className={FIELD}
            value={draft.replyLength}
            onChange={(event) => patch({ replyLength: event.target.value as ReplyLength })}
          >
            <option value="short">Short (1-3 sentences)</option>
            <option value="balanced">Balanced</option>
            <option value="detailed">Detailed</option>
          </select>
        </div>
      </div>

      {draft.preset === 'custom' ? (
        <div className="mt-3">
          <label className={LABEL} htmlFor="custom-persona">
            Write the character
          </label>
          <textarea
            id="custom-persona"
            className={`${FIELD} h-24 resize-y`}
            value={draft.customPersona}
            placeholder="Example: You are a calm Marathi-speaking teacher who loves cricket."
            onChange={(event) => patch({ customPersona: event.target.value })}
          />
        </div>
      ) : null}

      <div className="mt-3">
        <label className={LABEL} htmlFor="extra">
          Extra instructions (optional)
        </label>
        <textarea
          id="extra"
          className={`${FIELD} h-20 resize-y`}
          value={draft.extraInstructions}
          placeholder="Example: always call me bhai; never talk about politics."
          onChange={(event) => patch({ extraInstructions: event.target.value })}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-violet-100/80">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={draft.webSearch}
            onChange={(event) => patch({ webSearch: event.target.checked })}
          />
          Web search (current news, prices, scores)
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={draft.allowDeviceActions}
            onChange={(event) => patch({ allowDeviceActions: event.target.checked })}
          />
          Allow device actions (Gemini only)
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={draft.greetOnStart}
            onChange={(event) => patch({ greetOnStart: event.target.checked })}
          />
          Greet me when it starts
        </label>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={save}
          className="rounded-lg bg-violet-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-violet-400"
        >
          Save settings
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-lg border border-white/10 px-4 py-2 text-xs text-violet-100/80 transition hover:bg-white/10"
        >
          Reset to {DEFAULT_SETTINGS.assistantName}
        </button>
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-violet-200/40">
        Keys and settings are saved on this device only. Settings apply the next time you tap the mic.
      </p>
    </div>
  );
}
