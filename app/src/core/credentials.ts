import { getStoredApiKey } from './apiKeyStore';
import { createLogger, describeError } from './logger';

const log = createLogger('credentials');

export interface LiveCredentials {
  apiKey: string;
  model?: string;
  source: 'ephemeral-token' | 'env-key' | 'browser-stored';
}

/**
 * Ask the Gemini REST API whether this key works before we open a websocket.
 *
 * Without this, a bad key surfaces only as "WebSocket error" after the socket is
 * torn down, which tells the user nothing. A models.list call returns the real
 * reason: key not valid, API not enabled, referer blocked, quota, etc.
 */
async function assertKeyWorks(apiKey: string): Promise<void> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?pageSize=1&key=${encodeURIComponent(apiKey)}`;

  let response: Response;
  try {
    response = await fetch(url, { method: 'GET' });
  } catch (error) {
    log.error(`Key check could not reach Gemini: ${describeError(error)}`);
    throw new Error(`Could not reach the Gemini API from this browser: ${describeError(error)}`);
  }

  if (response.ok) {
    log.info('API key accepted by Gemini');
    return;
  }

  const body = await response.text().catch(() => '');
  let reason = body.slice(0, 300);
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string } };
    if (parsed.error?.message) reason = parsed.error.message;
  } catch {
    // keep the raw body
  }

  log.error(`API key rejected (${response.status}): ${reason}`);
  throw new Error(`Gemini rejected the API key (HTTP ${response.status}): ${reason}`);
}

export async function resolveCredentials(): Promise<LiveCredentials> {
  const endpoint = import.meta.env.VITE_EPHEMERAL_TOKEN_ENDPOINT?.trim();

  if (endpoint) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`Token endpoint returned ${response.status}.`);
    }
    const payload = (await response.json()) as { token?: string; model?: string };
    if (!payload.token) throw new Error('Token endpoint did not return a token.');
    // Ephemeral tokens only work for Live sessions, so they cannot be checked
    // against models.list.
    return { apiKey: payload.token, model: payload.model, source: 'ephemeral-token' };
  }

  const envKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
  if (envKey) {
    await assertKeyWorks(envKey);
    return { apiKey: envKey, source: 'env-key' };
  }

  const stored = getStoredApiKey();
  if (stored) {
    if (!stored.startsWith('AIza')) {
      throw new Error(
        'That does not look like a Gemini API key. Gemini keys start with "AIza" (this one starts with "' +
          stored.slice(0, 4) +
          '"). Create one at https://aistudio.google.com/apikey and paste the whole AIza... string.',
      );
    }
    await assertKeyWorks(stored);
    return { apiKey: stored, source: 'browser-stored' };
  }

  throw new Error(
    'No Gemini API key yet. Open Diagnostics -> API key, paste your key and press Save. It stays in this browser only.',
  );
}
