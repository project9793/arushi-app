import {
  ActivityHandling,
  EndSensitivity,
  Modality,
  StartSensitivity,
  type LiveConnectConfig,
} from '@google/genai';
import { TOOL_DECLARATIONS } from '../actions/toolDeclarations';
import { buildSystemInstruction, loadSettings } from '../core/settings';

export const DEFAULT_MODEL = 'gemini-3.8-live';
export const FALLBACK_MODELS = [
  'gemini-3.8-live',
  'gemini-3.1-flash-live-preview',
  'gemini-2.5-flash-native-audio-preview-12-2025',
  'gemini-2.5-flash-native-audio-latest',
];

export function getModelCandidates(): string[] {
  const fromEnv = import.meta.env.VITE_GEMINI_MODEL?.trim();
  const candidates = fromEnv ? [fromEnv, ...FALLBACK_MODELS] : FALLBACK_MODELS;
  return [...new Set(candidates.filter(Boolean))];
}

/** Kept for the diagnostics snapshot; the live session uses the configured voice. */
export const VOICE_NAME = 'Aoede';

/**
 * Minimal setup payload. Only what the assistant needs: audio out, the
 * user-configured persona as the system instruction, the chosen voice, the
 * tool declarations and voice-activity settings. Optional extras such as
 * context-window compression were removed because a model that rejects one
 * field drops the socket before setup completes (close code 1006, no reason).
 */
export function buildLiveConfig(): LiveConnectConfig {
  const settings = loadSettings();

  return {
    responseModalities: [Modality.AUDIO],
    systemInstruction: { parts: [{ text: buildSystemInstruction(settings) }] },
    speechConfig: {
      voiceConfig: { prebuiltVoiceConfig: { voiceName: settings.voice } },
    },
    tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
    realtimeInputConfig: {
      automaticActivityDetection: {
        disabled: false,
        startOfSpeechSensitivity: StartSensitivity.START_SENSITIVITY_HIGH,
        endOfSpeechSensitivity: EndSensitivity.END_SENSITIVITY_LOW,
        prefixPaddingMs: 40,
        silenceDurationMs: 500,
      },
      activityHandling: ActivityHandling.START_OF_ACTIVITY_INTERRUPTS,
    },
  };
}

export const APP_NAME = 'Arushi';
