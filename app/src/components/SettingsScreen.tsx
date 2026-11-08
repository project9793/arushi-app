import { useState } from 'react';
import type { ArushiSnapshot } from '../core/types';
import { DiagnosticsPanel } from './DiagnosticsPanel';
import { SettingsPanel } from './SettingsPanel';
import { getAvatarUrl, setAvatarUrl } from '../core/uiPrefs';

interface SettingsScreenProps {
  snapshot: ArushiSnapshot;
  onSpeakerTest: () => void;
  onClearTranscript: () => void;
}

export function SettingsScreen({ snapshot, onSpeakerTest, onClearTranscript }: SettingsScreenProps) {
  const [avatar, setAvatar] = useState<string>(() => getAvatarUrl());
  const [savedAvatar, setSavedAvatar] = useState(false);

  return (
    <div className="flex min-h-full flex-col px-4 pb-32 pt-3">
      <header>
        <h1 className="text-lg font-semibold tracking-tight">Settings</h1>
        <p className="text-[11px] text-violet-200/45">everything is stored on this device only</p>
      </header>

      <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-200/60">Home avatar</p>
        <input
          className="mt-2 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-violet-50 placeholder:text-violet-200/25 focus:border-violet-400/60 focus:outline-none"
          placeholder="https://… image URL for the home screen portrait"
          value={avatar}
          onChange={(event) => {
            setAvatar(event.target.value);
            setSavedAvatar(false);
          }}
        />
        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setAvatarUrl(avatar);
              setSavedAvatar(true);
            }}
            className="rounded-lg bg-violet-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-violet-400"
          >
            Save avatar
          </button>
          {savedAvatar ? <span className="text-[11px] text-emerald-300/90">saved</span> : null}
        </div>
      </div>

      <SettingsPanel />

      <div className="mt-4">
        <DiagnosticsPanel snapshot={snapshot} onSpeakerTest={onSpeakerTest} onClearTranscript={onClearTranscript} />
      </div>
    </div>
  );
}
