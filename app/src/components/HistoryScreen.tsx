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
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-bold tracking-tight">History</h1>
          <p className="text-[11px] text-white/55">past conversations, kept on this device</p>
        </div>
        {entries.length > 0 ? (
          <button
            type="button"
            onClick={wipe}
            className="shrink-0 rounded-full border border-rose-400/45 bg-rose-500/15 px-3 py-1.5 text-[11px] font-bold text-rose-200 transition active:scale-95"
          >
            Clear all
          </button>
        ) : null}
      </header>

      {entries.length === 0 ? (
        <p className="mt-16 text-center text-xs text-white/55">
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
                    <span className="text-[11px] font-semibold text-white/60">
                      {new Date(entry.at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                    <span className="rounded-full border border-[#22d3ee]/40 bg-[#22d3ee]/15 px-2 py-0.5 text-[10px] font-bold text-[#a5f3fc]">
                      {entry.provider} · {entry.turns}
                    </span>
                  </div>
                  <p className={`mt-1 text-sm leading-snug text-white ${open ? '' : 'line-clamp-2'}`}>
                    {entry.preview}
                  </p>
                </button>

                {open ? (
                  <div className="space-y-1.5 border-t border-[#22d3ee]/20 px-3 py-2.5">
                    {(entry.lines ?? []).length === 0 ? (
                      <p className="text-[11px] text-white/55">No transcript saved for this session.</p>
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
                            style={{ color: line.role === 'user' ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.55)' }}
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
