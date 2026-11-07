import { createLogger, describeError } from '../core/logger';
import { getNativeBridge } from './nativeBridge';

const log = createLogger('contacts');

export interface ContactMatch {
  name: string;
  phoneNumber: string;
  label?: string;
}

export type ContactSearchResult =
  | { status: 'ok'; matches: ContactMatch[] }
  | { status: 'unsupported'; error: string }
  | { status: 'permission-denied'; error: string }
  | { status: 'error'; error: string };

function normalise(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\u0900-\u097F ]/g, '').trim();
}

export async function searchContacts(contactName: string): Promise<ContactSearchResult> {
  const bridge = getNativeBridge();
  if (!bridge) {
    return {
      status: 'unsupported',
      error: 'Contacts need the Android app. In a browser there is no access to the contact list.',
    };
  }

  const query = normalise(contactName);
  if (!query) return { status: 'ok', matches: [] };

  try {
    if (bridge.requestContactsPermission) {
      const permission = await bridge.requestContactsPermission();
      if (!permission.granted) {
        return { status: 'permission-denied', error: 'Contacts permission was denied by the user.' };
      }
    }

    const result = await bridge.searchContacts(contactName);
    log.info('Contact search result', {
      query: contactName,
      success: result.success,
      count: result.contacts?.length ?? 0,
    });

    if (!result.success) {
      return { status: 'error', error: result.error ?? 'Contact search failed.' };
    }

    const seen = new Set<string>();
    const matches: ContactMatch[] = [];

    for (const contact of result.contacts ?? []) {
      if (!contact?.phoneNumber) continue;
      const name = normalise(contact.name ?? '');
      if (!name.includes(query) && !query.includes(name)) continue;
      const digits = contact.phoneNumber.replace(/[^\d+]/g, '');
      if (!digits || seen.has(digits)) continue;
      seen.add(digits);
      matches.push({ name: contact.name, phoneNumber: contact.phoneNumber, label: contact.label });
    }

    return { status: 'ok', matches };
  } catch (error) {
    log.error('Contact search threw', describeError(error));
    return { status: 'error', error: describeError(error) };
  }
}
