/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY?: string;
  readonly VITE_GEMINI_MODEL?: string;
  readonly VITE_GEMINI_VOICE?: string;
  readonly VITE_EPHEMERAL_TOKEN_ENDPOINT?: string;
  readonly VITE_APP_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface ArushiNativeBridge {
  readonly platform: string;
  openApp(appName: string): Promise<NativeActionResult>;
  openWhatsApp(): Promise<NativeActionResult>;
  openUrl(url: string): Promise<NativeActionResult>;
  makeCall(phoneNumber: string): Promise<NativeActionResult>;
  callContact(contactName: string): Promise<NativeActionResult>;
  searchContacts(contactName: string): Promise<NativeContactResult>;
  requestContactsPermission?(): Promise<{ granted: boolean }>;
}

interface NativeActionResult {
  success: boolean;
  error?: string;
  detail?: string;
}

interface NativeContactResult {
  success: boolean;
  error?: string;
  contacts?: Array<{ name: string; phoneNumber: string; label?: string }>;
}

interface Window {
  ArushiNative?: ArushiNativeBridge;
  ArushiNativeAndroid?: Record<string, (...args: string[]) => string>;
  Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string };
}
