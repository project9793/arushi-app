import type { FunctionCall, FunctionResponse } from '@google/genai';
import { createLogger, describeError } from '../core/logger';
import {
  callContact,
  makeCall,
  openApp,
  openUrl,
  openWhatsApp,
  searchWeb,
  sendWhatsAppMessage,
  type ActionResult,
} from './deviceActionBridge';

const log = createLogger('tools');

const ALLOWED_TOOLS = new Set([
  'openWhatsApp',
  'sendWhatsAppMessage',
  'openApp',
  'openUrl',
  'searchWeb',
  'makeCall',
  'callContact',
]);

export interface ToolExecutionRecord {
  name: string;
  args: Record<string, unknown>;
  result: ActionResult | { success: false; action: string; error: string; mode?: string };
  at: number;
}

export type ToolObserver = (record: ToolExecutionRecord) => void;

function asString(args: Record<string, unknown>, key: string): string | null {
  const value = args[key];
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
}

export class FunctionCalling {
  constructor(private readonly observe?: ToolObserver) {}

  async execute(call: FunctionCall): Promise<FunctionResponse> {
    const name = call.name ?? '';
    const args = (call.args ?? {}) as Record<string, unknown>;

    log.info('Tool call received', { name, args });

    if (!ALLOWED_TOOLS.has(name)) {
      const response = { success: false, action: name, error: `Unknown or disallowed tool "${name}".` };
      log.error('Rejected unknown tool', { name });
      return { id: call.id, name, response };
    }

    let result: ActionResult | { success: false; action: string; error: string };

    try {
      switch (name) {
        case 'openWhatsApp':
          result = await openWhatsApp();
          break;

        case 'sendWhatsAppMessage': {
          const number = asString(args, 'phoneNumber');
          const message = asString(args, 'message');
          result =
            number && message
              ? await sendWhatsAppMessage(number, message)
              : { success: false, action: 'sendWhatsAppMessage', error: 'phoneNumber and message are both required.' };
          break;
        }

        case 'openApp': {
          const appName = asString(args, 'appName');
          result = appName
            ? await openApp(appName)
            : { success: false, action: 'openApp', error: 'appName was missing from the tool call.' };
          break;
        }

        case 'openUrl': {
          const url = asString(args, 'url');
          result = url
            ? await openUrl(url)
            : { success: false, action: 'openUrl', error: 'url was missing from the tool call.' };
          break;
        }

        case 'searchWeb': {
          const query = asString(args, 'query');
          result = query
            ? await searchWeb(query)
            : { success: false, action: 'searchWeb', error: 'query was missing from the tool call.' };
          break;
        }

        case 'makeCall': {
          const number = asString(args, 'phoneNumber');
          result = number
            ? await makeCall(number)
            : { success: false, action: 'makeCall', error: 'phoneNumber was missing from the tool call.' };
          break;
        }

        case 'callContact': {
          const contactName = asString(args, 'contactName');
          result = contactName
            ? await callContact(contactName)
            : { success: false, action: 'callContact', error: 'contactName was missing from the tool call.' };
          break;
        }

        default:
          result = { success: false, action: name, error: 'Unhandled tool.' };
      }
    } catch (error) {
      log.error(`Tool "${name}" threw`, describeError(error));
      result = { success: false, action: name, error: describeError(error) };
    }

    log.info('Tool executed', result);
    this.observe?.({ name, args, result, at: Date.now() });

    return {
      id: call.id,
      name,
      response: {
        success: result.success,
        action: name,
        ...(result.success
          ? { detail: 'detail' in result ? result.detail : undefined }
          : { error: 'error' in result ? result.error : 'Action failed' }),
        ...('contacts' in result && result.contacts ? { contacts: result.contacts } : {}),
        ...('mode' in result && result.mode ? { mode: result.mode } : {}),
      },
    };
  }
}
