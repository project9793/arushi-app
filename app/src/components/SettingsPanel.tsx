import { useState } from 'react';
import {
  DEFAULT_SETTINGS,
  PERSONA_PRESETS,
  VOICES,
  loadSettings,
  resetSettings,
  saveSettings,
  type AppSettings,
  type LanguageMode,
  type PersonaPreset,
  type ReplyLength,
} from '../core/settings';

const FIELD =
  'w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-violet-50 placeholder:text-violet-200/25 focus:border-violet-400/60 focus:outline-none';
const LABEL = 'mb-1 block text-[11px] font-semibold uppercase tracking-wide text-violet-200/60';

/**
 * Everything the user can change: who the assistant is, how it behaves, what
 * it sounds like and what language it speaks. Saved in this browser only.
 */
export function SettingsPanel({ onSaved }: { onSaved?: (settings: AppSettings) => void }) {
  const [draft, setDraft] = useState<AppSettings>(() => loadSettings());
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const patch = (changes: Partial<AppSettings>) => setDraft((current) => ({ ...current, ...changes }));

  const save = () => {
    saveSettings(draft);
    setSavedAt(Date.now());
    onSaved?.(draft);
  };

  const reset = () => {
    const fresh = resetSettings();
    setDraft(fresh);
    setSavedAt(Date.now());
    onSaved?.(fresh);
  };

  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4 text-left">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-200/60">Assistant settings</p>
        <span className={`text-[11px] ${savedAt ? 'text-emerald-300/90' : 'text-violet-200/40'}`}>
          {savedAt ? 'saved · tap the mic to apply' : 'not saved'}
        </span>
      </div>

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
          <select
            id="voice"
            className={FIELD}
            value={draft.voice}
            onChange={(event) => patch({ voice: event.target.value })}
          >
            {VOICES.map((voice) => (
              <option key={voice} value={voice}>
                {voice}
              </option>
            ))}
          </select>
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
            placeholder="Example: You are a calm Marathi-speaking teacher who loves cricket and explains things with village examples."
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
          placeholder="Example: always call me bhai; never talk about politics; keep answers under 20 words."
          onChange={(event) => patch({ extraInstructions: event.target.value })}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-violet-100/80">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={draft.allowDeviceActions}
            onChange={(event) => patch({ allowDeviceActions: event.target.checked })}
          />
          Allow device actions
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
        Saved in this browser only. Settings apply the next time you tap the mic.
      </p>
    </div>
  );
}
