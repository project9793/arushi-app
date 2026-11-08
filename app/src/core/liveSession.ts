import { GoogleGenAI, type FunctionCall, type FunctionResponse, type LiveServerMessage, type Session } from '@google/genai';
import { buildLiveConfig } from '../config/geminiConfig';
import { decodeAudioChunk, type DecodedAudio } from './audioDecoder';
import { createLogger, describeError } from './logger';

const log = createLogger('live-session');

const CONNECT_TIMEOUT_MS = 20000;
const MAX_RECONNECTS = 2;

export interface LiveSessionHandlers {
  onReady: (model: string) => void;
  onAudio: (audio: DecodedAudio) => void;
  onModelText: (text: string) => void;
  onUserTranscript: (text: string, finished: boolean) => void;
  onAssistantTranscript: (text: string, finished: boolean) => void;
  onInterrupted: () => void;
  onTurnComplete: () => void;
  onToolCall: (calls: FunctionCall[]) => Promise<FunctionResponse[]>;
  onError: (message: string, error?: unknown) => void;
  onClosed: (info: { reason: string; reconnecting: boolean }) => void;
}

export interface LiveSessionOptions {
  apiKey: string;
  models: string[];
  handlers: LiveSessionHandlers;
}

export class ArushiLiveSession {
  private client: GoogleGenAI;
  private session: Session | null = null;
  private activeModel: string | null = null;
  private intentionalClose = false;
  private resumptionHandle: string | null = null;
  private reconnectAttempts = 0;
  private audioChunksIn = 0;
  private audioChunksOut = 0;
  private lastClose: { code?: number; reason?: string } | null = null;

  constructor(private readonly options: LiveSessionOptions) {
    // The SDK routes an ephemeral token (name starts with "auth_tokens/") to
    // BidiGenerateContentConstrained?access_token=... and that path only exists
    // on v1alpha. Using the default v1beta there fails the handshake, which the
    // browser reports as close code 1006 with no reason.
    const isEphemeralToken = options.apiKey.startsWith('auth_tokens/');
    const clientOptions: { apiKey: string; httpOptions?: { apiVersion: string } } = {
      apiKey: options.apiKey,
    };
    if (isEphemeralToken) clientOptions.httpOptions = { apiVersion: 'v1alpha' };

    this.client = new GoogleGenAI(clientOptions);
    log.info(
      isEphemeralToken
        ? 'Live client ready: ephemeral token on v1alpha (constrained)'
        : 'Live client ready: API key on v1beta',
    );
  }

  get model(): string | null {
    return this.activeModel;
  }

  get receivedChunks(): number {
    return this.audioChunksIn;
  }

  get sentChunks(): number {
    return this.audioChunksOut;
  }

  private closeSuffix(): string {
    if (!this.lastClose) return '';
    return ` (close code ${this.lastClose.code ?? '?'}: ${this.lastClose.reason || 'no reason given'})`;
  }

  async connect(): Promise<string> {
    const errors: string[] = [];
    log.info(`Trying models: ${this.options.models.join(', ')}`);

    for (const model of this.options.models) {
      this.lastClose = null;
      try {
        log.info(`Connecting to Gemini Live: ${model}`);
        await this.openSession(model);
        this.activeModel = model;
        this.reconnectAttempts = 0;
        log.info(`Gemini Live session connected: ${model}`);
        this.options.handlers.onReady(model);
        return model;
      } catch (error) {
        const detail = describeError(error);
        errors.push(`${model}: ${detail}${this.closeSuffix()}`);
        log.warn(`Live connect failed for ${model}: ${detail}${this.closeSuffix()}`);
        this.session = null;
      }
    }

    const message = `Could not connect to any Live model. Tried: ${errors.join(' | ')}`;
    log.error(message);
    throw new Error(message);
  }

  private async openSession(model: string): Promise<void> {
    const config = buildLiveConfig();
    if (this.resumptionHandle) {
      config.sessionResumption = { handle: this.resumptionHandle };
    }

    const connectPromise = this.client.live.connect({
      model,
      config,
      callbacks: {
        onopen: () => log.info(`Live websocket open: ${model}`),
        onmessage: (message: LiveServerMessage) => this.handleMessage(message),
        onerror: (event: ErrorEvent) => {
          const detail = event?.error ? describeError(event.error) : (event?.message ?? 'unknown socket error');
          log.error(`Live websocket error: ${detail}`);
          this.options.handlers.onError(`Connection error: ${detail}`, event);
        },
        onclose: (event: CloseEvent) => this.handleClose(event),
      },
    });

    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Timed out after ${CONNECT_TIMEOUT_MS} ms`)), CONNECT_TIMEOUT_MS);
    });

    this.session = await Promise.race([connectPromise, timeout]);
  }

  private handleMessage(message: LiveServerMessage): void {
    if (message.setupComplete) {
      log.info(`Live setup complete (session ${message.setupComplete.sessionId ?? 'unknown'})`);
    }

    if (message.sessionResumptionUpdate?.resumable && message.sessionResumptionUpdate.newHandle) {
      this.resumptionHandle = message.sessionResumptionUpdate.newHandle;
    }

    if (message.goAway) {
      log.warn(`Server sent goAway - session will end soon (${message.goAway.timeLeft ?? 'unknown'})`);
    }

    const serverContent = message.serverContent;

    if (serverContent) {
      if (serverContent.interrupted) {
        log.info('Model generation interrupted by the user');
        this.options.handlers.onInterrupted();
      }

      const parts = serverContent.modelTurn?.parts ?? [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          this.handleAudioPart(part.inlineData.data, part.inlineData.mimeType);
        } else if (typeof part.text === 'string' && part.text.trim()) {
          this.options.handlers.onModelText(part.text);
        }
      }

      const inputTranscription = serverContent.inputTranscription ?? serverContent.interimInputTranscription;
      if (inputTranscription?.text) {
        this.options.handlers.onUserTranscript(inputTranscription.text, Boolean(inputTranscription.finished));
      }

      if (serverContent.outputTranscription?.text) {
        this.options.handlers.onAssistantTranscript(
          serverContent.outputTranscription.text,
          Boolean(serverContent.outputTranscription.finished),
        );
      }

      if (serverContent.turnComplete) {
        this.options.handlers.onTurnComplete();
      }
    }

    if (message.toolCall?.functionCalls?.length) {
      void this.handleToolCall(message.toolCall.functionCalls);
    }

    if (message.toolCallCancellation?.ids?.length) {
      log.warn(`Tool call cancelled by the server: ${message.toolCallCancellation.ids.join(', ')}`);
    }
  }

  private handleAudioPart(data: string, mimeType: string | undefined): void {
    try {
      const decoded = decodeAudioChunk(data, mimeType);
      this.audioChunksIn += 1;

      if (this.audioChunksIn === 1) {
        log.info(
          `First audio chunk received (${mimeType ?? 'no mime'}, ${decoded.sampleRate} Hz, ${decoded.channels} ch, ${decoded.byteLength} bytes)`,
        );
      }

      this.options.handlers.onAudio(decoded);
    } catch (error) {
      log.error(`Failed to decode audio chunk (${mimeType ?? 'no mime'}): ${describeError(error)}`);
      this.options.handlers.onError('Audio decoding failed', error);
    }
  }

  private async handleToolCall(calls: FunctionCall[]): Promise<void> {
    try {
      const responses = await this.options.handlers.onToolCall(calls);
      this.sendToolResponses(responses);
    } catch (error) {
      log.error(`Tool call handling failed: ${describeError(error)}`);
      this.options.handlers.onError('Tool call failed', error);
      this.sendToolResponses(
        calls.map((call) => ({
          id: call.id,
          name: call.name,
          response: { success: false, error: 'The action could not be completed on this device.' },
        })),
      );
    }
  }

  private sendToolResponses(functionResponses: FunctionResponse[]): void {
    if (!this.session) {
      log.error('Cannot send tool response: no active session');
      return;
    }
    try {
      this.session.sendToolResponse({ functionResponses });
      log.info(`Tool response sent (${functionResponses.length})`);
    } catch (error) {
      log.error(`Sending tool response failed: ${describeError(error)}`);
    }
  }

  sendAudio(base64Pcm: string): void {
    if (!this.session) return;
    try {
      this.session.sendRealtimeInput({
        audio: { data: base64Pcm, mimeType: 'audio/pcm;rate=16000' },
      });
      this.audioChunksOut += 1;
    } catch (error) {
      log.error(`Sending microphone audio failed: ${describeError(error)}`);
    }
  }

  sendTextTurn(text: string): void {
    if (!this.session) return;
    this.session.sendClientContent({ turns: [{ role: 'user', parts: [{ text }] }], turnComplete: true });
  }

  close(): void {
    this.intentionalClose = true;
    if (!this.session) return;
    try {
      this.session.close();
      log.info('Live session closed by the app');
    } catch (error) {
      log.warn(`Live session close failed: ${describeError(error)}`);
    }
    this.session = null;
  }

  private handleClose(event: CloseEvent): void {
    const reason = event?.reason || 'no reason given';
    const code = event?.code;
    this.lastClose = { code, reason };

    if (this.intentionalClose) {
      log.info(`Live session closed (code ${code}, ${reason})`);
      this.session = null;
      this.options.handlers.onClosed({ reason, reconnecting: false });
      return;
    }

    log.warn(`Live session dropped unexpectedly (code ${code}, ${reason})`);

    if (this.reconnectAttempts >= MAX_RECONNECTS) {
      this.options.handlers.onError(`The voice session ended (code ${code}, ${reason}). Tap the button to reconnect.`);
      this.options.handlers.onClosed({ reason, reconnecting: false });
      return;
    }

    this.reconnectAttempts += 1;
    this.options.handlers.onClosed({ reason, reconnecting: true });

    void (async () => {
      await new Promise((resolve) => setTimeout(resolve, 600 * this.reconnectAttempts));
      try {
        const model = this.activeModel ?? this.options.models[0];
        await this.openSession(model);
        this.options.handlers.onReady(model);
        log.info(`Live session reconnected: ${model} (attempt ${this.reconnectAttempts})`);
      } catch (error) {
        const detail = describeError(error);
        log.error(`Reconnect failed: ${detail}${this.closeSuffix()}`);
        this.options.handlers.onError(`Lost the voice session and could not reconnect: ${detail}${this.closeSuffix()}`);
        this.options.handlers.onClosed({ reason, reconnecting: false });
      }
    })();
  }
}
