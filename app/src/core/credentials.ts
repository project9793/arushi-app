import { getStoredApiKey } from './apiKeyStore';

export interface LiveCredentials {
  apiKey: string;
  model?: string;
  source: 'ephemeral-token' | 'env-key' | 'browser-stored';
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

  const envKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
  if (envKey) return { apiKey: envKey, source: 'env-key' };

  const stored = getStoredApiKey();
  if (stored) return { apiKey: stored, source: 'browser-stored' };

  throw new Error(
    'No Gemini API key yet. Open Diagnostics -> API key, paste your key and press Save. It stays in this browser only.',
  );
}
