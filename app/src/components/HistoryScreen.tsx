import { useEffect, useState } from 'react';
import { clearHistory, loadHistory, type HistoryEntry } from '../core/uiPrefs';

/** Past conversations, each one expandable to the full transcript. */
export function HistoryScreen() {
  const [entries, setEntries] = useState<HistoryEntry[]>(() => loadHistory());
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    setEntries(loadHistory());
  }, []);

  const wipe = () => {
    clearHistory();
    setEntries([]);
    setOpenId(null);
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
          No sessions yet. Start one from Home and it will be listed here when you stop.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {entries.map((entry) => {
            const open = openId === entry.id;
            return (
              <li key={entry.id} className="rounded-2xl border border-white/10 bg-white/[0.04]">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : entry.id)}
                  className="w-full px-3 py-2.5 text-left"
                  aria-expanded={open}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] font-medium text-violet-200/70">
                      {new Date(entry.at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                    <span className="rounded-full bg-violet-600/25 px-2 py-0.5 text-[10px] text-violet-100">
                      {entry.provider} · {entry.turns}
                    </span>
                  </div>
                  <p className={`mt-1 text-sm leading-snug text-violet-100 ${open ? '' : 'line-clamp-2'}`}>
                    {entry.preview}
                  </p>
                </button>

                {open ? (
                  <div className="space-y-1.5 border-t border-white/10 px-3 py-2.5">
                    {(entry.lines ?? []).length === 0 ? (
                      <p className="text-[11px] text-violet-200/40">No transcript saved for this session.</p>
                    ) : (
                      (entry.lines ?? []).map((line, index) => (
                        <div
                          key={`${entry.id}-${index}`}
                          className={`max-w-[90%] rounded-xl px-2.5 py-1.5 text-[13px] leading-relaxed ${
                            line.role === 'user' ? 'ml-auto bg-violet-600/25 text-violet-50' : 'mr-auto bg-white/[0.05] text-violet-100'
                          }`}
                        >
                          <span className="mr-1.5 text-[10px] font-semibold uppercase tracking-wide text-violet-300/60">
                            {line.role === 'user' ? 'You' : 'Assistant'}
                          </span>
                          {line.text}
                        </div>
                      ))
                    )}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
