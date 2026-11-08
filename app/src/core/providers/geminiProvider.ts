import type { FunctionCall, FunctionResponse } from '@google/genai';
import { resolveCredentials } from '../credentials';
import { ArushiLiveSession } from '../liveSession';
import { getModelCandidates } from '../../config/geminiConfig';
import { createLogger } from '../logger';
import type { VoiceProvider, VoiceProviderEvents } from './types';

const log = createLogger('gemini-provider');

/** Adapts the Gemini Live session to the VoiceProvider interface. */
export class GeminiLiveProvider implements VoiceProvider {
  readonly name = 'gemini';
  readonly inputSampleRate = 16000;

  private session: ArushiLiveSession | null = null;

  constructor(
    private readonly options: {
      events: VoiceProviderEvents;
      onToolCall: (calls: FunctionCall[]) => Promise<FunctionResponse[]>;
    },
  ) {}

  get receivedChunks(): number {
    return this.session?.receivedChunks ?? 0;
  }

  async connect(): Promise<string> {
    const credentials = await resolveCredentials();
    log.info(`Credentials resolved (${credentials.source})`);

    const session = new ArushiLiveSession({
      apiKey: credentials.apiKey,
      models: credentials.model ? [credentials.model, ...getModelCandidates()] : getModelCandidates(),
      handlers: {
        onReady: (model) => this.options.events.onReady(model),
        onAudio: (audio) => this.options.events.onAudio(audio.samples, audio.sampleRate),
        onModelText: () => undefined,
        onUserTranscript: (text, finished) => this.options.events.onUserTranscript(text, finished),
        onAssistantTranscript: (text, finished) => this.options.events.onAssistantTranscript(text, finished),
        onInterrupted: () => this.options.events.onInterrupted(),
        onTurnComplete: () => this.options.events.onTurnComplete(),
        onToolCall: (calls) => this.options.onToolCall(calls),
        onError: (message, error) => this.options.events.onError(message, error),
        onClosed: (info) => this.options.events.onClosed(info),
      },
    });

    this.session = session;
    return session.connect();
  }

  sendAudio(base64Pcm: string): void {
    this.session?.sendAudio(base64Pcm);
  }

  sendText(text: string): void {
    this.session?.sendTextTurn(text);
  }

  handleLevel(): void {
    // Gemini uses server-side voice activity detection.
  }

  close(): void {
    this.session?.close();
    this.session = null;
  }
}
