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
    <div className="flex min-h-full flex-col px-4 pb-4 pt-3">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-[#fff4e2]">History</h1>
          <p className="text-[11px] text-[#ffd9a8]/70">past conversations, kept on this device</p>
        </div>
        {entries.length > 0 ? (
          <button
            type="button"
            onClick={wipe}
            className="rounded-full border border-[#f3bd57]/45 bg-[#f3bd57]/15 px-3 py-1.5 text-[11px] font-semibold text-[#ffe6ab]"
          >
            Clear all
          </button>
        ) : null}
      </header>

      {entries.length === 0 ? (
        <p className="mt-16 text-center text-xs text-[#ffe9d2]/60">
          No sessions yet. Start one from Home and it will be listed here when you stop.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {entries.map((entry) => {
            const open = openId === entry.id;
            return (
              <li key={entry.id} className="card overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : entry.id)}
                  className="w-full px-3 py-2.5 text-left"
                  aria-expanded={open}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] font-semibold text-[#ffe6ab]/85">
                      {new Date(entry.at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                    <span className="rounded-full border border-[#f3bd57]/40 bg-[#f3bd57]/18 px-2 py-0.5 text-[10px] font-semibold text-[#ffe6ab]">
                      {entry.provider} · {entry.turns}
                    </span>
                  </div>
                  <p className={`mt-1 text-sm leading-snug text-[#fff4e2] ${open ? '' : 'line-clamp-2'}`}>
                    {entry.preview}
                  </p>
                </button>

                {open ? (
                  <div className="space-y-1.5 border-t border-[#ffd9a8]/25 px-3 py-2.5">
                    {(entry.lines ?? []).length === 0 ? (
                      <p className="text-[11px] text-[#ffe9d2]/55">No transcript saved for this session.</p>
                    ) : (
                      (entry.lines ?? []).map((line, index) => (
                        <div
                          key={`${entry.id}-${index}`}
                          className={`max-w-[90%] rounded-xl px-2.5 py-1.5 text-[13px] leading-relaxed ${
                            line.role === 'user'
                              ? 'ml-auto border border-[#f3bd57]/40 bg-[#f3bd57]/20 text-[#fff8ee]'
                              : 'mr-auto border border-[#ffd9a8]/25 bg-[#ffd9a8]/12 text-[#fff4e2]'
                          }`}
                        >
                          <span className="mr-1.5 text-[10px] font-bold uppercase tracking-wide text-[#ffe6ab]/75">
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
