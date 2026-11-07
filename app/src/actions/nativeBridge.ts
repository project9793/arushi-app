export type PlatformMode = 'native' | 'browser';

export function getNativeBridge(): ArushiNativeBridge | null {
  if (typeof window === 'undefined') return null;
  return window.ArushiNative ?? null;
}

export function getPlatformMode(): PlatformMode {
  return getNativeBridge() ? 'native' : 'browser';
}

export function getPlatformLabel(): string {
  const bridge = getNativeBridge();
  if (bridge?.platform) return `Android (${bridge.platform})`;
  return 'Browser';
}
