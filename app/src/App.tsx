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
  const pendingSend = useRef<string | null>(null);

  const live =
    snapshot.state === 'listening' || snapshot.state === 'speaking' || snapshot.state === 'connecting';

  const go = (next: TabId) => {
    setView('tabs');
    setTab(next);
    setLastTab(next);
  };

  const openTalk = () => {
    setView('talk');
    if (!live) void toggle();
  };

  const closeTalk = () => {
    stop();
    setView('tabs');
  };

  /** Mic from inside Chat: start listening but stay on the chat screen. */
  const listenHere = () => {
    if (live) stop();
    else void toggle();
  };

  /**
   * A typed message has to go through the live session. If it is not running
   * yet, start it and keep the text until the session is ready, instead of
   * dropping it silently — that is why typing used to look broken.
   */
  const sendText = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (live) {
      arushiController.sendText(trimmed);
      return;
    }

    pendingSend.current = trimmed;
    void toggle();
  };

  useEffect(() => {
    if (snapshot.state === 'listening' && pendingSend.current) {
      const text = pendingSend.current;
      pendingSend.current = null;
      arushiController.sendText(text);
    }
    if (snapshot.state === 'error') pendingSend.current = null;
  }, [snapshot.state]);

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
      <div className="flex h-[100dvh] flex-col overflow-hidden">
        <main className="min-h-0 flex-1 overflow-y-auto pb-6">
          <TalkScreen snapshot={snapshot} onStop={closeTalk} />
        </main>
      </div>
    );
  }

  const showError = snapshot.error && snapshot.error !== dismissedError && tab !== 'settings';

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden">
      <main className="min-h-0 flex-1 overflow-y-auto pb-10">
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
            onSendText={sendText}
            onOpenChat={() => go('chat')}
          />
        ) : null}

        {tab === 'chat' ? (
          <ChatScreen
            snapshot={snapshot}
            onSendText={sendText}
            onClear={clearTranscript}
            onMic={listenHere}
            listening={snapshot.state === 'listening' || snapshot.state === 'speaking'}
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
      </main>

      <BottomNav active={tab} onSelect={go} listening={live} onCentrePress={openTalk} />
    </div>
  );
}
