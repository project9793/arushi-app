/**
 * Small UI preferences that are not part of the assistant configuration:
 * the hero avatar image and the last open tab.
 */

const AVATAR_KEY = 'arushi.avatarUrl';
const TAB_KEY = 'arushi.tab';

export type TabId = 'home' | 'chat' | 'history' | 'settings';

export function getAvatarUrl(): string {
  try {
    return window.localStorage.getItem(AVATAR_KEY) ?? '';
  } catch {
    return '';
  }
}

export function setAvatarUrl(url: string): void {
  try {
    if (url.trim()) window.localStorage.setItem(AVATAR_KEY, url.trim());
    else window.localStorage.removeItem(AVATAR_KEY);
  } catch {
    // storage can be blocked in private mode
  }
}

export function getLastTab(): TabId {
  try {
    const value = window.localStorage.getItem(TAB_KEY);
    if (value === 'home' || value === 'chat' || value === 'history' || value === 'settings') return value;
  } catch {
    // ignore
  }
  return 'home';
}

export function setLastTab(tab: TabId): void {
  try {
    window.localStorage.setItem(TAB_KEY, tab);
  } catch {
    // ignore
  }
}

export interface HistoryEntry {
  id: string;
  at: number;
  provider: string;
  preview: string;
  turns: number;
}

const HISTORY_KEY = 'arushi.history.v1';
const MAX_HISTORY = 40;

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveHistoryEntry(entry: HistoryEntry): void {
  try {
    const entries = [entry, ...loadHistory().filter((item) => item.id !== entry.id)].slice(0, MAX_HISTORY);
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
  } catch {
    // ignore
  }
}

export function clearHistory(): void {
  try {
    window.localStorage.removeItem(HISTORY_KEY);
  } catch {
    // ignore
  }
}
