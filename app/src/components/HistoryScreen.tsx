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
          <h1 className="text-lg font-bold tracking-tight text-[#1f1235]">History</h1>
          <p className="text-[11px] text-[#9385ae]">past conversations, kept on this device</p>
        </div>
        {entries.length > 0 ? (
          <button
            type="button"
            onClick={wipe}
            className="rounded-full border border-[#e6dcf8] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#7c3aed]"
          >
            Clear all
          </button>
        ) : null}
      </header>

      {entries.length === 0 ? (
        <p className="mt-16 text-center text-xs text-[#9385ae]">
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
                    <span className="text-[11px] font-semibold text-[#6b5b8a]">
                      {new Date(entry.at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                    <span className="rounded-full border border-[#e6dcf8] bg-[#f3eefe] px-2 py-0.5 text-[10px] font-semibold text-[#6d28d9]">
                      {entry.provider} · {entry.turns}
                    </span>
                  </div>
                  <p className={`mt-1 text-sm leading-snug text-[#1f1235] ${open ? '' : 'line-clamp-2'}`}>
                    {entry.preview}
                  </p>
                </button>

                {open ? (
                  <div className="space-y-1.5 border-t border-[#e6dcf8] px-3 py-2.5">
                    {(entry.lines ?? []).length === 0 ? (
                      <p className="text-[11px] text-[#9385ae]">No transcript saved for this session.</p>
                    ) : (
                      (entry.lines ?? []).map((line, index) => (
                        <div
                          key={`${entry.id}-${index}`}
                          className={`max-w-[90%] rounded-xl px-2.5 py-1.5 text-[13px] leading-relaxed ${
                            line.role === 'user' ? 'bubble-out ml-auto' : 'bubble-in mr-auto'
                          }`}
                        >
                          <span
                            className="mr-1.5 text-[10px] font-bold uppercase tracking-wide"
                            style={{ color: line.role === 'user' ? 'rgba(255,255,255,0.78)' : '#9385ae' }}
                          >
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
