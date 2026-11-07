import { createLogger, describeError } from '../core/logger';
import { resolveApp, allowlistLabels } from './appAllowlist';
import { validatePhoneNumber, validateUrl } from './validation';
import { searchContacts } from './contactService';
import { getNativeBridge, getPlatformMode, type PlatformMode } from './nativeBridge';

const log = createLogger('device-bridge');

export type { PlatformMode };

export interface ActionResult {
  success: boolean;
  action: string;
  mode: PlatformMode;
  detail?: string;
  error?: string;
  contacts?: Array<{ name: string; phoneNumber: string; label?: string }>;
}

export { getNativeBridge, getPlatformMode };

function openTab(url: string): boolean {
  const opened = window.open(url, '_blank', 'noopener,noreferrer');
  if (opened) {
    opened.opener = null;
    return true;
  }
  return false;
}

export async function openWhatsApp(): Promise<ActionResult> {
  const mode = getPlatformMode();
  const bridge = getNativeBridge();

  if (bridge) {
    try {
      const result = await bridge.openWhatsApp();
      log.info('Native openWhatsApp result', result);
      return result.success
        ? { success: true, action: 'openWhatsApp', mode, detail: result.detail ?? 'WhatsApp opened' }
        : { success: false, action: 'openWhatsApp', mode, error: result.error ?? 'WhatsApp could not be opened' };
    } catch (error) {
      log.error('Native openWhatsApp threw', describeError(error));
      return { success: false, action: 'openWhatsApp', mode, error: describeError(error) };
    }
  }

  // wa.me is the official deep link: Android hands it to the installed app,
  // desktop lands on WhatsApp Web.
  if (openTab('https://wa.me/')) {
    return {
      success: true,
      action: 'openWhatsApp',
      mode,
      detail:
        'Opened the WhatsApp deep link in a new tab. On Android this hands off to the installed app if it is present.',
    };
  }

  return {
    success: false,
    action: 'openWhatsApp',
    mode,
    error: 'The browser blocked the new tab, so WhatsApp was not opened.',
  };
}

export async function openApp(appName: string): Promise<ActionResult> {
  const mode = getPlatformMode();
  const bridge = getNativeBridge();
  const target = resolveApp(appName);

  if (!target) {
    return {
      success: false,
      action: 'openApp',
      mode,
      error: `"${appName}" is not on the allowlist. Supported apps: ${allowlistLabels().join(', ')}.`,
    };
  }

  if (bridge) {
    try {
      const result = await bridge.openApp(target.id);
      log.info('Native openApp result', { app: target.id, result });
      return result.success
        ? { success: true, action: 'openApp', mode, detail: `${target.label} opened` }
        : { success: false, action: 'openApp', mode, error: result.error ?? `${target.label} could not be opened` };
    } catch (error) {
      log.error('Native openApp threw', describeError(error));
      return { success: false, action: 'openApp', mode, error: describeError(error) };
    }
  }

  if (!target.webUrl) {
    return {
      success: false,
      action: 'openApp',
      mode,
      error: `${target.label} has no web version, so it can only be opened from the Android app.`,
    };
  }

  if (!openTab(target.webUrl)) {
    return {
      success: false,
      action: 'openApp',
      mode,
      error: 'The browser blocked the new tab.',
    };
  }

  return {
    success: true,
    action: 'openApp',
    mode,
    detail: `Browser mode: opened ${target.label} on the web (${target.webUrl}), not the installed app.`,
  };
}

export async function openUrl(input: string): Promise<ActionResult> {
  const mode = getPlatformMode();
  const bridge = getNativeBridge();

  const validated = validateUrl(input);
  if (!validated.ok) {
    return { success: false, action: 'openUrl', mode, error: validated.error };
  }

  if (bridge) {
    try {
      const result = await bridge.openUrl(validated.value);
      log.info('Native openUrl result', { url: validated.value, result });
      return result.success
        ? { success: true, action: 'openUrl', mode, detail: `Opened ${validated.value}` }
        : { success: false, action: 'openUrl', mode, error: result.error ?? 'The link could not be opened' };
    } catch (error) {
      log.error('Native openUrl threw', describeError(error));
      return { success: false, action: 'openUrl', mode, error: describeError(error) };
    }
  }

  if (!openTab(validated.value)) {
    return { success: false, action: 'openUrl', mode, error: 'The browser blocked the new tab.' };
  }

  return { success: true, action: 'openUrl', mode, detail: `Opened ${validated.value}` };
}

export async function makeCall(phoneNumber: string): Promise<ActionResult> {
  const mode = getPlatformMode();
  const bridge = getNativeBridge();

  const validated = validatePhoneNumber(phoneNumber);
  if (!validated.ok) {
    return { success: false, action: 'makeCall', mode, error: validated.error };
  }

  if (bridge) {
    try {
      const result = await bridge.makeCall(validated.value.dialable);
      log.info('Native makeCall result', { number: validated.value.dialable, result });
      return result.success
        ? {
            success: true,
            action: 'makeCall',
            mode,
            detail: `Call started or dialer opened for ${validated.value.display}`,
          }
        : { success: false, action: 'makeCall', mode, error: result.error ?? 'The call could not be started' };
    } catch (error) {
      log.error('Native makeCall threw', describeError(error));
      return { success: false, action: 'makeCall', mode, error: describeError(error) };
    }
  }

  // Browser: `tel:` opens the dialer. The call itself is never auto-placed.
  window.location.href = `tel:${validated.value.dialable}`;
  return {
    success: true,
    action: 'makeCall',
    mode,
    detail: `Opened the dialer with ${validated.value.display}. The user still has to press call.`,
  };
}

export async function callContact(contactName: string): Promise<ActionResult> {
  const mode = getPlatformMode();

  if (mode === 'browser') {
    return {
      success: false,
      action: 'callContact',
      mode,
      error:
        'Contacts are not available in a browser. The user has to give a number, or use the installed Android app.',
    };
  }

  const result = await searchContacts(contactName);

  if (result.status === 'unsupported' || result.status === 'permission-denied' || result.status === 'error') {
    return { success: false, action: 'callContact', mode, error: result.error };
  }

  if (result.matches.length === 0) {
    return {
      success: false,
      action: 'callContact',
      mode,
      error: `No contact matching "${contactName}" was found. Ask the user for the number.`,
    };
  }

  if (result.matches.length > 1) {
    return {
      success: false,
      action: 'callContact',
      mode,
      error: 'Multiple contacts match that name. Ask the user which one they mean, then call makeCall with the number they confirm.',
      contacts: result.matches.slice(0, 5).map((match) => ({
        name: match.name,
        phoneNumber: match.phoneNumber,
        label: match.label,
      })),
    };
  }

  const match = result.matches[0];
  const call = await makeCall(match.phoneNumber);
  return {
    ...call,
    action: 'callContact',
    detail: call.success ? `Calling ${match.name} (${match.phoneNumber}).` : call.detail,
  };
}
