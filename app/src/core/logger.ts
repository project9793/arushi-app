export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  id: number;
  time: number;
  level: LogLevel;
  scope: string;
  message: string;
  data?: unknown;
}

type Listener = (entry: LogEntry) => void;

const MAX_ENTRIES = 400;

class Logger {
  private entries: LogEntry[] = [];
  private listeners = new Set<Listener>();
  private nextId = 1;

  log(level: LogLevel, scope: string, message: string, data?: unknown): void {
    const entry: LogEntry = { id: this.nextId++, time: Date.now(), level, scope, message, data };

    this.entries.push(entry);
    if (this.entries.length > MAX_ENTRIES) this.entries.shift();

    const line = `[${scope}] ${message}`;
    switch (level) {
      case 'error':
        data === undefined ? console.error(line) : console.error(line, data);
        break;
      case 'warn':
        data === undefined ? console.warn(line) : console.warn(line, data);
        break;
      case 'debug':
        data === undefined ? console.debug(line) : console.debug(line, data);
        break;
      default:
        data === undefined ? console.log(line) : console.log(line, data);
    }

    for (const listener of this.listeners) {
      try {
        listener(entry);
      } catch (error) {
        console.error('[logger] listener failed', error);
      }
    }
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  snapshot(): LogEntry[] {
    return [...this.entries];
  }

  clear(): void {
    this.entries = [];
  }
}

export const logger = new Logger();

export interface ScopedLogger {
  debug(message: string, data?: unknown): void;
  info(message: string, data?: unknown): void;
  warn(message: string, data?: unknown): void;
  error(message: string, data?: unknown): void;
}

export function createLogger(scope: string): ScopedLogger {
  return {
    debug: (message, data) => logger.log('debug', scope, message, data),
    info: (message, data) => logger.log('info', scope, message, data),
    warn: (message, data) => logger.log('warn', scope, message, data),
    error: (message, data) => logger.log('error', scope, message, data),
  };
}

export function describeError(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}
