import { beforeEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS,
  buildSystemInstruction,
  loadSettings,
  resetSettings,
  saveSettings,
} from '../settings';

class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
}

beforeEach(() => {
  (globalThis as unknown as { window: { localStorage: MemoryStorage } }).window = {
    localStorage: new MemoryStorage(),
  };
});

describe('settings storage', () => {
  it('falls back to defaults when nothing is stored', () => {
    expect(loadSettings().assistantName).toBe(DEFAULT_SETTINGS.assistantName);
  });

  it('round-trips a saved name, persona and voice', () => {
    saveSettings({ ...DEFAULT_SETTINGS, assistantName: 'Riya', userName: 'Siya', voice: 'Kore' });
    const loaded = loadSettings();
    expect(loaded.assistantName).toBe('Riya');
    expect(loaded.userName).toBe('Siya');
    expect(loaded.voice).toBe('Kore');
  });

  it('resets back to defaults', () => {
    saveSettings({ ...DEFAULT_SETTINGS, assistantName: 'Riya' });
    expect(resetSettings().assistantName).toBe(DEFAULT_SETTINGS.assistantName);
    expect(loadSettings().assistantName).toBe(DEFAULT_SETTINGS.assistantName);
  });
});

describe('buildSystemInstruction', () => {
  it('uses the configured assistant name', () => {
    const prompt = buildSystemInstruction({ ...DEFAULT_SETTINGS, assistantName: 'Riya' });
    expect(prompt).toContain('Your name is Riya');
  });

  it('adds the user name when given', () => {
    const prompt = buildSystemInstruction({ ...DEFAULT_SETTINGS, userName: 'Siya' });
    expect(prompt).toContain("The user's name is Siya");
  });

  it('omits the user section when no name is set', () => {
    const prompt = buildSystemInstruction({ ...DEFAULT_SETTINGS, userName: '' });
    expect(prompt).not.toContain("The user's name is");
  });

  it('applies the chosen language mode', () => {
    expect(buildSystemInstruction({ ...DEFAULT_SETTINGS, language: 'hindi' })).toContain('Always reply in natural spoken Hindi');
    expect(buildSystemInstruction({ ...DEFAULT_SETTINGS, language: 'english' })).toContain('Always reply in clear spoken English');
    expect(buildSystemInstruction({ ...DEFAULT_SETTINGS, language: 'auto' })).toContain('Detect the language');
  });

  it('uses the custom persona text when preset is custom', () => {
    const prompt = buildSystemInstruction({
      ...DEFAULT_SETTINGS,
      preset: 'custom',
      customPersona: 'You are a strict cricket coach.',
    });
    expect(prompt).toContain('You are a strict cricket coach.');
  });

  it('appends extra instructions verbatim', () => {
    const prompt = buildSystemInstruction({ ...DEFAULT_SETTINGS, extraInstructions: 'never mention politics' });
    expect(prompt).toContain('never mention politics');
  });

  it('tells the model actions are off when the user disables them', () => {
    const prompt = buildSystemInstruction({ ...DEFAULT_SETTINGS, allowDeviceActions: false });
    expect(prompt).toContain('actions are turned off');
    expect(prompt).not.toContain('openWhatsApp, sendWhatsAppMessage');
  });
});
