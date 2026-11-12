import { useEffect, useRef, useState } from 'react';
import { arushiController } from './core/arushiController';
import { useArushi } from './hooks/useArushi';
import { BottomNav } from './components/BottomNav';
import { HomeScreen } from './components/HomeScreen';
import { ChatScreen } from './components/ChatScreen';
import { HistoryScreen } from './components/HistoryScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { TalkScreen } from './components/TalkScreen';
import { ErrorBanner } from './components/ErrorBanner';
import { getAvatarUrl, getLastTab, saveHistoryEntry, setLastTab, type TabId } from './core/uiPrefs';
import { loadSettings } from './core/settings';

type View = 'tabs' | 'talk';

export default function App() {
  const { snapshot, toggle, stop, runSpeakerTest, clearTranscript } = useArushi();
  const [tab, setTab] = useState<TabId>(() => getLastTab());
  const [view, setView] = useState<View>('tabs');
  const [dismissedError, setDismissedError] = useState<string | null>(null);
  const [avatarUrl, setAvatar] = useState<string>(() => getAvatarUrl());
  const previousState = useRef(snapshot.state);

  const go = (next: TabId) => {
    setView('tabs');
    setTab(next);
    setLastTab(next);
  };

  const openTalk = () => {
    setView('talk');
    const live =
      snapshot.state === 'listening' || snapshot.state === 'speaking' || snapshot.state === 'connecting';
    if (!live) void toggle();
  };

  const closeTalk = () => {
    stop();
    setView('tabs');
  };

  useEffect(() => {
    setAvatar(getAvatarUrl());
  }, [tab]);

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
        lines: snapshot.transcript.map((line) => ({ role: line.role, text: line.text })),
      });
    }
    previousState.current = snapshot.state;
  }, [snapshot.state, snapshot.transcript]);

  if (view === 'talk') {
    return (
      <div className="min-h-full">
        <TalkScreen snapshot={snapshot} onStop={closeTalk} />
      </div>
    );
  }

  const showError = snapshot.error && snapshot.error !== dismissedError && tab !== 'settings';

  return (
    <div className="min-h-full pb-32">
      {showError ? (
        <div className="px-4 pt-3">
          <ErrorBanner message={snapshot.error ?? ''} onDismiss={() => setDismissedError(snapshot.error)} />
        </div>
      ) : null}

      {tab === 'home' ? (
        <HomeScreen
          snapshot={snapshot}
          avatarUrl={avatarUrl}
          onMicPress={openTalk}
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

      <BottomNav active={tab} onSelect={go} listening={snapshot.state === 'listening'} onCentrePress={openTalk} />
    </div>
  );
}
