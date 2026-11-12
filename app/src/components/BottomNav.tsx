import type { TabId } from '../core/uiPrefs';

interface BottomNavProps {
  active: TabId;
  onSelect: (tab: TabId) => void;
  onCentrePress: () => void;
  listening: boolean;
}

const TABS: Array<{ id: TabId; label: string; icon: string }> = [
  { id: 'home', label: 'Home', icon: 'M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z' },
  { id: 'chat', label: 'Chat', icon: 'M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H9l-5 4V5a1 1 0 0 1 1-1z' },
  { id: 'history', label: 'History', icon: 'M12 8v5l4 2M3.05 11a9 9 0 1 1 .5 4' },
  { id: 'settings', label: 'Settings', icon: 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z' },
];

/** Cream pill navigation with warm brown labels — no blue, no grey. */
export function BottomNav({ active, onSelect, onCentrePress, listening }: BottomNavProps) {
  const activeClass = 'text-[#b45309]';
  const idleClass = 'text-[#8a6a45]';

  return (
    <nav className="shrink-0 px-3 pb-2 pt-1">
      <div className="relative mx-auto flex max-w-md items-end justify-between rounded-[26px] border border-[#e6cfa8] bg-[#fdf3e2] px-3 py-2 shadow-[0_14px_30px_-14px_rgba(20,4,12,0.85)]">
        <button
          type="button"
          onClick={() => onSelect('home')}
          className={`flex flex-1 flex-col items-center gap-0.5 py-1 ${active === 'home' ? activeClass : idleClass}`}
          aria-current={active === 'home' ? 'page' : undefined}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
            <path d={TABS[0].icon} />
          </svg>
          <span className="text-[10px] font-semibold">Home</span>
        </button>

        <button
          type="button"
          onClick={() => onSelect('chat')}
          className={`flex flex-1 flex-col items-center gap-0.5 py-1 ${active === 'chat' ? activeClass : idleClass}`}
          aria-current={active === 'chat' ? 'page' : undefined}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
            <path d={TABS[1].icon} />
          </svg>
          <span className="text-[10px] font-semibold">Chat</span>
        </button>

        <div className="w-14" aria-hidden="true" />

        <button
          type="button"
          onClick={() => onSelect('history')}
          className={`flex flex-1 flex-col items-center gap-0.5 py-1 ${active === 'history' ? activeClass : idleClass}`}
          aria-current={active === 'history' ? 'page' : undefined}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d={TABS[2].icon} />
          </svg>
          <span className="text-[10px] font-semibold">History</span>
        </button>

        <button
          type="button"
          onClick={() => onSelect('settings')}
          className={`flex flex-1 flex-col items-center gap-0.5 py-1 ${active === 'settings' ? activeClass : idleClass}`}
          aria-current={active === 'settings' ? 'page' : undefined}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d={TABS[3].icon} />
          </svg>
          <span className="text-[10px] font-semibold">Settings</span>
        </button>

        <button
          type="button"
          onClick={onCentrePress}
          aria-label={listening ? 'Stop listening' : 'Start listening'}
          className={`absolute left-1/2 top-0 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-[3px] shadow-[0_12px_28px_-8px_rgba(180,83,9,0.85)] transition ${
            listening
              ? 'border-rose-200 bg-gradient-to-br from-rose-500 to-pink-600'
              : 'border-amber-200 bg-gradient-to-br from-amber-400 to-orange-500'
          }`}
        >
          {listening ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white">
              <rect x="6" y="6" width="12" height="12" rx="2.5" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white">
              <path d="M12 3a1 1 0 0 1 1 1v7a1 1 0 1 1-2 0V4a1 1 0 0 1 1-1Z" />
              <path d="M7.05 6.34a1 1 0 0 1-.27 1.39 6 6 0 1 0 10.44 0 1 1 0 1 1 1.12-1.66 8 8 0 1 1-13.92 0 1 1 0 0 1 1.63.27Z" />
            </svg>
          )}
        </button>
      </div>
    </nav>
  );
}
