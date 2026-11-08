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

/**
 * Check the key against the native Gemini REST API and, at the same time, ask
 * which models it can actually use.
 *
 * Two reasons this exists:
 *  1. A rejected key otherwise surfaces only as "WebSocket error", which tells
 *     the user nothing.
 *  2. Model names churn, and a brand new project is not granted every model.
 *     Instead of hard-coding a guess, we ask the key what it has and use that.
 *
 * Note on key formats: AI Studio now issues "AQ." authentication keys; older
 * accounts still have "AIza" traffic keys. Both work on this native endpoint,
 * so neither is treated as wrong.
 */
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

/** Prefer the newest model the key actually offers. */
function pickLiveModel(liveModels: string[]): string | undefined {
  if (liveModels.length === 0) return undefined;
  const preferred = liveModels.find((name) => name.startsWith('gemini-3.8-live'));
  if (preferred) return preferred;
  const anyLive = liveModels.find((name) => name.includes('live'));
  return anyLive ?? liveModels[0];
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
    const check = await checkKey(envKey);
    return { apiKey: envKey, model: pickLiveModel(check.liveModels), source: 'env-key' };
  }

  const stored = getStoredApiKey();
  if (stored) {
    const check = await checkKey(stored);
    return { apiKey: stored, model: pickLiveModel(check.liveModels), source: 'browser-stored' };
  }

  throw new Error(
    'No Gemini API key yet. Open Diagnostics -> API key, paste your key and press Save. It stays in this browser only.',
  );
}
