import { useState } from 'react';
import { ArushiOrb } from './components/ArushiOrb';
import { DiagnosticsPanel } from './components/DiagnosticsPanel';
import { ErrorBanner } from './components/ErrorBanner';
import { PowerButton } from './components/PowerButton';
import { SettingsPanel } from './components/SettingsPanel';
import { StatusPill } from './components/StatusPill';
import { TranscriptFeed } from './components/TranscriptFeed';
import { useArushi } from './hooks/useArushi';
import { loadSettings } from './core/settings';

export default function App() {
  const { snapshot, toggle, runSpeakerTest, clearTranscript } = useArushi();
  const [dismissedError, setDismissedError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState(() => loadSettings());

  const showError = snapshot.error && snapshot.error !== dismissedError;
  const title = settings.assistantName.trim() || 'Arushi';

  return (
    <div className="flex min-h-full flex-col items-center px-5 py-6">
      <header className="flex w-full max-w-md items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-sm font-bold text-white shadow-lg shadow-violet-900/50">
            {title.charAt(0).toUpperCase()}
          </span>
          <div className="leading-tight">
            <h1 className="text-base font-semibold tracking-tight">{title}</h1>
            <p className="text-[11px] text-violet-200/50">voice assistant</p>
          </div>
        </div>
        <span className="glass rounded-full px-3 py-1 text-[11px] font-medium text-violet-100/80">
          {snapshot.native ? 'Android · native actions' : 'Browser · limited actions'}
        </span>
      </header>

      <main className="flex w-full max-w-md flex-1 flex-col items-center justify-center gap-7 py-8">
        <ArushiOrb state={snapshot.state} micLevel={snapshot.micLevel} />

        <StatusPill state={snapshot.state} />

        <PowerButton
          state={snapshot.state}
          onPress={() => {
            void toggle();
          }}
        />

        {showError ? (
          <ErrorBanner message={snapshot.error ?? ''} onDismiss={() => setDismissedError(snapshot.error)} />
        ) : null}

        <div className="w-full">
          <TranscriptFeed lines={snapshot.transcript} />
        </div>
      </main>

      <footer className="w-full max-w-md space-y-3 pb-2">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setShowSettings((value) => !value)}
            className="glass rounded-full px-4 py-2 text-xs font-medium text-violet-100 transition hover:bg-white/10"
            aria-expanded={showSettings}
          >
            {showSettings ? 'Hide settings' : 'Settings'}
          </button>
        </div>

        {showSettings ? <SettingsPanel onSaved={setSettings} /> : null}

        <DiagnosticsPanel
          snapshot={snapshot}
          onSpeakerTest={() => {
            void runSpeakerTest();
          }}
          onClearTranscript={clearTranscript}
        />
        <p className="text-center text-[11px] leading-relaxed text-violet-200/35">
          {snapshot.native
            ? 'Native bridge detected: apps, dialer and contacts are available.'
            : 'Browser mode: links and the dialer work, contacts and installed-app control need the Android build.'}
        </p>
      </footer>
    </div>
  );
}
