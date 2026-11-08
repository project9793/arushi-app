import { useEffect, useRef, useState } from 'react';
import { arushiController } from './core/arushiController';
import { useArushi } from './hooks/useArushi';
import { BottomNav } from './components/BottomNav';
import { HomeScreen } from './components/HomeScreen';
import { ChatScreen } from './components/ChatScreen';
import { HistoryScreen } from './components/HistoryScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { ErrorBanner } from './components/ErrorBanner';
import { getAvatarUrl, getLastTab, saveHistoryEntry, setLastTab, type TabId } from './core/uiPrefs';
import { loadSettings } from './core/settings';

export default function App() {
  const { snapshot, toggle, runSpeakerTest, clearTranscript } = useArushi();
  const [tab, setTab] = useState<TabId>(() => getLastTab());
  const [dismissedError, setDismissedError] = useState<string | null>(null);
  const [avatarUrl, setAvatar] = useState<string>(() => getAvatarUrl());
  const previousState = useRef(snapshot.state);

  const go = (next: TabId) => {
    setTab(next);
    setLastTab(next);
  };

  // Refresh the avatar when the user comes back from settings.
  useEffect(() => {
    setAvatar(getAvatarUrl());
  }, [tab]);

  // Save the session to history when a live conversation ends.
  useEffect(() => {
    const wasLive = previousState.current === 'listening' || previousState.current === 'speaking';
    if (wasLive && snapshot.state === 'idle' && snapshot.transcript.length > 0) {
      const settings = loadSettings();
      const firstUserLine = snapshot.transcript.find((line) => line.role === 'user');
      saveHistoryEntry({
        id: `session-${Date.now()}`,
        at: Date.now(),
        provider: settings.provider,
        preview: (firstUserLine ?? snapshot.transcript[0]).text.slice(0, 120),
        turns: snapshot.transcript.length,
      });
    }
    previousState.current = snapshot.state;
  }, [snapshot.state, snapshot.transcript]);

  const busy = snapshot.state === 'listening' || snapshot.state === 'speaking';
  const showError = snapshot.error && snapshot.error !== dismissedError && tab !== 'settings';

  return (
    <div className="min-h-full pb-24">
      {showError ? (
        <div className="px-4 pt-3">
          <ErrorBanner message={snapshot.error ?? ''} onDismiss={() => setDismissedError(snapshot.error)} />
        </div>
      ) : null}

      {tab === 'home' ? (
        <HomeScreen
          snapshot={snapshot}
          avatarUrl={avatarUrl}
          onMicPress={() => {
            void toggle();
          }}
          onSendText={(text) => arushiController.sendText(text)}
          onOpenChat={() => go('chat')}
        />
      ) : null}

      {tab === 'chat' ? (
        <ChatScreen
          snapshot={snapshot}
          onSendText={(text) => arushiController.sendText(text)}
          onClear={clearTranscript}
        />
      ) : null}

      {tab === 'history' ? <HistoryScreen /> : null}

      {tab === 'settings' ? (
        <SettingsScreen
          snapshot={snapshot}
          onSpeakerTest={() => {
            void runSpeakerTest();
          }}
          onClearTranscript={clearTranscript}
        />
      ) : null}

      <BottomNav
        active={tab}
        onSelect={go}
        listening={busy}
        onCentrePress={() => {
          void toggle();
        }}
      />
    </div>
  );
}
