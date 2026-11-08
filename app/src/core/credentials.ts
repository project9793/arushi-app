import { GoogleGenAI } from '@google/genai';
import { getStoredApiKey } from './apiKeyStore';
import { createLogger, describeError } from './logger';

const log = createLogger('credentials');

const API_ROOT = 'https://generativelanguage.googleapis.com/v1beta';

export interface LiveCredentials {
  apiKey: string;
  model?: string;
  source: 'ephemeral-token' | 'env-key' | 'browser-stored';
}

interface KeyCheck {
  liveModels: string[];
}

async function checkKey(apiKey: string): Promise<KeyCheck> {
  const url = `${API_ROOT}/models?pageSize=1000&key=${encodeURIComponent(apiKey)}`;

  let response: Response;
  try {
    response = await fetch(url, { method: 'GET' });
  } catch (error) {
    log.error(`Key check could not reach Gemini: ${describeError(error)}`);
    throw new Error(`Could not reach the Gemini API from this browser: ${describeError(error)}`);
  }

  if (!response.ok) {
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

  const payload = (await response.json()) as { models?: Array<{ name?: string }> };
  const names = (payload.models ?? [])
    .map((model) => (model.name ?? '').replace(/^models\//, ''))
    .filter(Boolean);

  const liveModels = names.filter((name) => /live|native-audio/i.test(name));
  log.info(`API key accepted. Models: ${names.length}, Live-capable: ${liveModels.join(', ') || 'none listed'}`);

  return { liveModels };
}

function pickLiveModel(liveModels: string[]): string | undefined {
  if (liveModels.length === 0) return undefined;
  const preferred = liveModels.find((name) => name.startsWith('gemini-3.8-live'));
  if (preferred) return preferred;
  const anyLive = liveModels.find((name) => name.includes('live'));
  return anyLive ?? liveModels[0];
}

/**
 * Browsers cannot set headers on a WebSocket, so the Live socket carries its
 * credential in the query string. Minting a short-lived token for that is the
 * path Google documents for client-side Live connections.
 *
 * `uses: 0` means no use limit, which matters here: the app tries several
 * models in order, and a one-use token would be spent by the first attempt.
 * If minting is not permitted for this key, we fall back to the key itself.
 */
async function mintEphemeralToken(apiKey: string): Promise<string | null> {
  try {
    const client = new GoogleGenAI({ apiKey, httpOptions: { apiVersion: 'v1alpha' } });
    const token = await client.authTokens.create({ config: { uses: 0 } });
    const name = token.name ?? null;
    log.info(name ? 'Minted a Live token (no use limit)' : 'Token minting returned no name');
    return name;
  } catch (error) {
    log.warn(`Could not mint an ephemeral token, using the API key directly: ${describeError(error)}`);
    return null;
  }
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
    return { apiKey: payload.token, model: payload.model, source: 'ephemeral-token' };
  }

  const rawKey = import.meta.env.VITE_GEMINI_API_KEY?.trim() || getStoredApiKey();
  if (!rawKey) {
    throw new Error(
      'No Gemini API key yet. Open Diagnostics -> API key, paste your key and press Save. It stays in this browser only.',
    );
  }

  const source: LiveCredentials['source'] = import.meta.env.VITE_GEMINI_API_KEY?.trim()
    ? 'env-key'
    : 'browser-stored';

  const check = await checkKey(rawKey);
  const model = pickLiveModel(check.liveModels);

  const token = await mintEphemeralToken(rawKey);
  return { apiKey: token ?? rawKey, model, source };
}
