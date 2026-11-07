import { useEffect, useState } from 'react';
import { logger, type LogEntry } from '../core/logger';
import type { ArushiSnapshot } from '../core/types';
import { ApiKeyField } from './ApiKeyField';

interface DiagnosticsPanelProps {
  snapshot: ArushiSnapshot;
  onSpeakerTest: () => void;
  onClearTranscript: () => void;
}

const LEVEL_COLOUR: Record<LogEntry['level'], string> = {
  debug: 'text-violet-300/50',
  info: 'text-emerald-300/80',
  warn: 'text-amber-300/90',
  error: 'text-rose-400',
};

export function DiagnosticsPanel({ snapshot, onSpeakerTest, onClearTranscript }: DiagnosticsPanelProps) {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>(() => logger.snapshot());

  useEffect(() => {
    if (!open) return;
    setLogs(logger.snapshot());
    return logger.subscribe((entry) => {
      setLogs((current) => [...current.slice(-199), entry]);
    });
  }, [open]);

  const rows: Array<[string, string]> = [
    ['State', snapshot.state],
    ['Model', snapshot.model ?? '—'],
    ['Voice', snapshot.voice],
    ['Platform', snapshot.platform],
    ['AudioContext', `${snapshot.audioContextState}${snapshot.outputSampleRate ? ` · ${snapshot.outputSampleRate} Hz` : ''}`],
    ['Mic chunks sent', String(snapshot.micChunksSent)],
    ['Audio chunks received', String(snapshot.audioChunksIn)],
    ['Last action', snapshot.lastAction ?? '—'],
  ];

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={onSpeakerTest}
          className="glass rounded-full px-4 py-2 text-xs font-medium text-violet-100 transition hover:bg-white/10"
        >
          Test speaker (440 Hz)
        </button>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="glass rounded-full px-4 py-2 text-xs font-medium text-violet-100 transition hover:bg-white/10"
          aria-expanded={open}
        >
          {open ? 'Hide diagnostics' : 'Diagnostics'}
        </button>
        <button
          type="button"
          onClick={onClearTranscript}
          className="glass rounded-full px-4 py-2 text-xs font-medium text-violet-100 transition hover:bg-white/10"
        >
          Clear transcript
        </button>
      </div>

      {open ? (
        <div className="glass mt-4 rounded-2xl p-4 text-left">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-xs sm:grid-cols-2">
            {rows.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-3 border-b border-white/5 py-1">
                <dt className="text-violet-200/50">{label}</dt>
                <dd className="truncate text-right font-medium text-violet-50">{value}</dd>
              </div>
            ))}
          </dl>

          <ApiKeyField />

          <p className="mt-3 text-[11px] leading-relaxed text-violet-200/40">
            If the tone is audible but Arushi is silent, the fault is in response parsing, MIME handling, decoding
            or the playback queue — not the speaker. If the tone is silent too, fix the AudioContext first.
          </p>

          <div className="mt-3 max-h-56 overflow-y-auto rounded-xl bg-black/40 p-3">
            {logs.length === 0 ? (
              <p className="text-xs text-violet-200/40">No log entries yet.</p>
            ) : (
              <ul className="space-y-1">
                {logs.map((entry) => (
                  <li key={entry.id} className="log-line text-[11px] leading-snug">
                    <span className="text-violet-200/30">
                      {new Date(entry.time).toLocaleTimeString('en-IN', { hour12: false })}
                    </span>{' '}
                    <span className="text-violet-300/60">[{entry.scope}]</span>{' '}
                    <span className={LEVEL_COLOUR[entry.level]}>{entry.message}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
