type NativeSync = {
  getPlatform?: () => string;
  openApp: (appName: string) => string;
  openWhatsApp: () => string;
  openUrl: (url: string) => string;
  makeCall: (phoneNumber: string) => string;
  callContact: (contactName: string) => string;
  searchContacts: (contactName: string) => string;
  requestContactsPermission: () => string;
};

function parse(raw: unknown): unknown {
  if (typeof raw !== 'string') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return { success: false, error: 'Native bridge returned malformed JSON' };
  }
}

function call<K extends keyof NativeSync>(native: NativeSync, method: K, args: unknown[] = []): Promise<unknown> {
  return new Promise((resolve) => {
    try {
      const fn = native[method] as ((...input: unknown[]) => unknown) | undefined;
      if (typeof fn !== 'function') {
        resolve({ success: false, error: `Native bridge is missing ${String(method)}` });
        return;
      }
      resolve(parse(fn.apply(native, args)));
    } catch (error) {
      resolve({ success: false, error: `Native bridge call failed: ${String(error)}` });
    }
  });
}

export function installAndroidShim(): void {
  if (typeof window === 'undefined') return;
  if (window.ArushiNative) return;

  const native = (window as unknown as { ArushiNativeAndroid?: NativeSync }).ArushiNativeAndroid;
  if (!native) return;

  const bridge: ArushiNativeBridge = {
    platform: typeof native.getPlatform === 'function' ? native.getPlatform() : 'android',
    openApp: (appName: string) => call(native, 'openApp', [appName]) as Promise<NativeActionResult>,
    openWhatsApp: () => call(native, 'openWhatsApp') as Promise<NativeActionResult>,
    openUrl: (url: string) => call(native, 'openUrl', [url]) as Promise<NativeActionResult>,
    makeCall: (phoneNumber: string) => call(native, 'makeCall', [phoneNumber]) as Promise<NativeActionResult>,
    callContact: (contactName: string) => call(native, 'callContact', [contactName]) as Promise<NativeActionResult>,
    searchContacts: (contactName: string) =>
      call(native, 'searchContacts', [contactName]) as Promise<NativeContactResult>,
    requestContactsPermission: () =>
      call(native, 'requestContactsPermission') as Promise<{ granted: boolean }>,
  };

  window.ArushiNative = bridge;
}
