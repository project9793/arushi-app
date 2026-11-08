import type { AppSettings } from '../settings';
import { GrokRealtimeProvider } from './grokRealtime';
import { SarvamPipelineProvider } from './sarvamPipeline';
import type { VoiceProvider, VoiceProviderEvents } from './types';

export type { VoiceProvider, VoiceProviderEvents } from './types';

export interface ProviderConfig {
  settings: AppSettings;
  instructions: string;
  events: VoiceProviderEvents;
  geminiApiKey: string;
}

/**
 * Picks the backend the user chose in settings.
 *
 * Gemini is created by the controller itself (it needs the token/key dance in
 * credentials.ts); this factory covers the two REST/WebSocket providers that are
 * self-contained.
 */
export function createStreamingProvider(config: ProviderConfig): VoiceProvider | null {
  const { settings, instructions, events } = config;

  if (settings.provider === 'grok') {
    return new GrokRealtimeProvider({
      apiKey: settings.xaiApiKey ?? '',
      voice: settings.grokVoice,
      instructions,
      events,
    });
  }

  if (settings.provider === 'sarvam') {
    return new SarvamPipelineProvider({
      apiKey: settings.sarvamApiKey ?? '',
      voice: settings.sarvamVoice,
      languageCode: settings.sarvamLanguage,
      instructions,
      events,
    });
  }

  return null;
}
