import { useEffect, useState } from 'react';
import { clearHistory, loadHistory, type HistoryEntry } from '../core/uiPrefs';

export function HistoryScreen() {
  const [entries, setEntries] = useState<HistoryEntry[]>(() => loadHistory());

  useEffect(() => {
    setEntries(loadHistory());
  }, []);

  const wipe = () => {
    clearHistory();
    setEntries([]);
  };

  return (
    <div className="flex min-h-full flex-col px-4 pb-32 pt-3">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">History</h1>
          <p className="text-[11px] text-violet-200/45">past conversations, kept on this device</p>
        </div>
        {entries.length > 0 ? (
          <button
            type="button"
            onClick={wipe}
            className="rounded-full border border-white/10 px-3 py-1.5 text-[11px] text-violet-100/80 transition hover:bg-white/10"
          >
            Clear all
          </button>
        ) : null}
      </header>

      {entries.length === 0 ? (
        <p className="mt-16 text-center text-xs text-violet-200/35">
          No sessions yet. Each conversation you have is listed here once you stop.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {entries.map((entry) => (
            <li key={entry.id} className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-medium text-violet-200/70">
                  {new Date(entry.at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
                <span className="rounded-full bg-violet-600/25 px-2 py-0.5 text-[10px] text-violet-100">
                  {entry.provider} · {entry.turns} turns
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-sm leading-snug text-violet-100">{entry.preview}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
