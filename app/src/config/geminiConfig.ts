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

/** The model the user typed in Settings wins, then the env var, then defaults. */
export function getModelCandidates(): string[] {
  const settings = loadSettings();
  const typed = settings.modelOverride?.trim();
  const fromEnv = import.meta.env.VITE_GEMINI_MODEL?.trim();
  const preferred = [typed, fromEnv, DEFAULT_MODEL].filter((value): value is string => Boolean(value));
  return [...new Set([...preferred, ...FALLBACK_MODELS])];
}

/** Kept for the diagnostics panel; the real voice comes from settings. */
export const VOICE_NAME = 'Aoede';

export const APP_NAME = 'Arushi';

export function buildLiveConfig(): LiveConnectConfig {
  const settings = loadSettings();

  // Google Search grounding: without it the model answers from training data and
  // presents two-year-old news as if it were current.
  const tools: Array<Record<string, unknown>> = [];
  if (settings.webSearch) tools.push({ googleSearch: {} });
  if (settings.allowDeviceActions) tools.push({ functionDeclarations: TOOL_DECLARATIONS });

  return {
    responseModalities: [Modality.AUDIO],
    systemInstruction: { parts: [{ text: buildSystemInstruction(settings) }] },
    speechConfig: {
      voiceConfig: { prebuiltVoiceConfig: { voiceName: settings.voice } },
    },
    tools: tools as LiveConnectConfig['tools'],
    realtimeInputConfig: {
      automaticActivityDetection: {
        startOfSpeechSensitivity: StartSensitivity.START_SENSITIVITY_HIGH,
        endOfSpeechSensitivity: EndSensitivity.END_SENSITIVITY_LOW,
        prefixPaddingMs: 40,
        silenceDurationMs: 550,
      },
      activityHandling: ActivityHandling.START_OF_ACTIVITY_INTERRUPTS,
    },
  };
}
