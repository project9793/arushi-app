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
    <div className="flex min-h-full flex-col px-4 pb-6 pt-3">
      <header>
        <h1 className="text-lg font-bold tracking-tight text-[#fff4e2]">Settings</h1>
        <p className="text-[11px] text-[#ffd9a8]/70">everything is stored on this device only</p>
      </header>

      <div className="card mt-4 p-4">
        <p className="label">Home avatar</p>
        <input
          className="field"
          placeholder="https://… image URL for the home screen portrait"
          value={avatar}
          onChange={(event) => {
            setAvatar(event.target.value);
            setSavedAvatar(false);
          }}
        />
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setAvatarUrl(avatar);
              setSavedAvatar(true);
            }}
            className="rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 px-4 py-2 text-xs font-bold text-[#2a0f22]"
          >
            Save avatar
          </button>
          {savedAvatar ? <span className="text-[11px] font-semibold text-emerald-300">saved</span> : null}
        </div>
      </div>

      <SettingsPanel />

      <div className="mt-4">
        <DiagnosticsPanel snapshot={snapshot} onSpeakerTest={onSpeakerTest} onClearTranscript={onClearTranscript} />
      </div>
    </div>
  );
}
