const STORAGE_KEY = 'arushi.geminiApiKey';

export function getStoredApiKey(): string | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value && value.trim() ? value.trim() : null;
  } catch {
    return null;
  }
}

export function setStoredApiKey(value: string): void {
  try {
    const trimmed = value.trim();
    if (trimmed) window.localStorage.setItem(STORAGE_KEY, trimmed);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Private browsing can block storage; the key then simply does not persist.
  }
}

export function clearStoredApiKey(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function maskApiKey(value: string): string {
  if (value.length <= 8) return '••••';
  return `${value.slice(0, 4)}••••${value.slice(-4)}`;
}
