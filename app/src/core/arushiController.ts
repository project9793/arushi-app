import type { FunctionCall, FunctionResponse } from '@google/genai';
import { FunctionCalling, type ToolExecutionRecord } from '../actions/functionCalling';
import { getPlatformLabel, getPlatformMode } from '../actions/nativeBridge';
import {
  disposeOutputAudio,
  ensureOutputRunning,
  getOutputSampleRate,
  getOutputState,
  playTestTone,
} from './audioContextManager';
import { AudioPlaybackQueue } from './audioPlaybackQueue';
import { AudioStreamer } from './audioStreamer';
import { createLogger, describeError } from './logger';
import { buildSystemInstruction, loadSettings, type AppSettings } from './settings';
import { GeminiLiveProvider } from './providers/geminiProvider';
import { createStreamingProvider } from './providers';
import type { VoiceProvider, VoiceProviderEvents } from './providers/types';
import type { AssistantState, ArushiSnapshot, TranscriptLine } from './types';

const log = createLogger('controller');

export type SnapshotListener = (snapshot: ArushiSnapshot) => void;

const MAX_TRANSCRIPT_LINES = 40;

export class ArushiController {
  private listeners = new Set<SnapshotListener>();
  private snapshot: ArushiSnapshot;

  private streamer: AudioStreamer | null = null;
  private provider: VoiceProvider | null = null;
  private playback: AudioPlaybackQueue | null = null;
  private tools: FunctionCalling | null = null;

  private starting = false;
  private currentUserLineId: string | null = null;
  private currentAssistantLineId: string | null = null;
  private lineCounter = 0;

  constructor() {
    this.snapshot = {
      state: 'idle',
      error: null,
      micLevel: 0,
      model: null,
      voice: 'Aoede',
      platform: getPlatformLabel(),
      native: getPlatformMode() === 'native',
      transcript: [],
      lastAction: null,
      audioContextState: getOutputState(),
      outputSampleRate: getOutputSampleRate(),
      micChunksSent: 0,
      audioChunksIn: 0,
    };
  }

  getSnapshot = (): ArushiSnapshot => this.snapshot;

  subscribe = (listener: SnapshotListener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private update(patch: Partial<ArushiSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...patch };
    for (const listener of this.listeners) listener(this.snapshot);
  }

  private setState(state: AssistantState, error: string | null = null): void {
    if (this.snapshot.state === state && this.snapshot.error === error) return;
    log.info('State change', { from: this.snapshot.state, to: state, ...(error ? { error } : {}) });
    this.update({ state, error });
  }

  private pushTranscript(role: TranscriptLine['role'], text: string, finished: boolean): void {
    const isUser = role === 'user';
    const currentId = isUser ? this.currentUserLineId : this.currentAssistantLineId;

    if (currentId) {
      const lines = this.snapshot.transcript.map((line) =>
        line.id === currentId ? { ...line, text, at: Date.now() } : line,
      );
      this.update({ transcript: lines });
    } else {
      const id = `line-${this.lineCounter++}`;
      const line: TranscriptLine = { id, role, text, at: Date.now() };
      const transcript = [...this.snapshot.transcript, line].slice(-MAX_TRANSCRIPT_LINES);
      this.update({ transcript });
      if (isUser) this.currentUserLineId = id;
      else this.currentAssistantLineId = id;
    }

    if (finished) {
      if (isUser) this.currentUserLineId = null;
      else this.currentAssistantLineId = null;
    }
  }

  clearTranscript(): void {
    this.update({ transcript: [] });
    this.currentUserLineId = null;
    this.currentAssistantLineId = null;
  }

  private buildEvents(): VoiceProviderEvents {
    return {
      onReady: (model) => {
        this.update({ model });
        if (this.snapshot.state === 'connecting') this.setState('listening');
      },
      onAudio: (samples, sampleRate) => {
        this.playback?.enqueue(samples, sampleRate);
        this.update({ audioChunksIn: this.snapshot.audioChunksIn + 1 });
      },
      onUserTranscript: (text, finished) => this.pushTranscript('user', text, finished),
      onAssistantTranscript: (text, finished) => this.pushTranscript('arushi', text, finished),
      onInterrupted: () => {
        this.playback?.clear('barge-in');
        this.currentAssistantLineId = null;
        if (this.snapshot.state === 'speaking') this.setState('listening');
      },
      onTurnComplete: () => {
        this.currentAssistantLineId = null;
        this.currentUserLineId = null;
        this.playback?.notifyTurnComplete();
      },
      onError: (message, error) => this.fail(message, error),
      onClosed: ({ reason, reconnecting }) => {
        if (reconnecting) {
          this.setState('connecting');
          return;
        }
        if (this.snapshot.state !== 'error') {
          this.setState('idle');
          log.info('Session closed', { reason });
        }
      },
    };
  }

  private async executeTools(calls: FunctionCall[]): Promise<FunctionResponse[]> {
    if (!this.tools) return [];
    const responses: FunctionResponse[] = [];
    for (const call of calls) responses.push(await this.tools.execute(call));
    return responses;
  }

  private createProvider(settings: AppSettings): VoiceProvider | null {
    const events = this.buildEvents();

    if (settings.provider === 'gemini') {
      this.tools = new FunctionCalling((record) => this.onToolExecuted(record));
      return new GeminiLiveProvider({
        events,
        onToolCall: (calls) => this.executeTools(calls),
      });
    }

    return createStreamingProvider({
      settings,
      instructions: buildSystemInstruction(settings),
      events,
      geminiApiKey: '',
    });
  }

  async start(): Promise<void> {
    if (this.starting) return;
    if (this.snapshot.state === 'connecting' || this.snapshot.state === 'listening' || this.snapshot.state === 'speaking') {
      return;
    }

    this.starting = true;
    this.setState('connecting');
    const settings = loadSettings();
    log.info(`Starting with provider: ${settings.provider}`);

    try {
      // Output AudioContext first, while we are still inside the tap gesture.
      await ensureOutputRunning();
      this.update({ audioContextState: getOutputState(), outputSampleRate: getOutputSampleRate() });

      const provider = this.createProvider(settings);
      if (!provider) throw new Error('No voice provider is configured.');
      this.provider = provider;

      this.playback = new AudioPlaybackQueue({
        onStart: () => {
          if (this.snapshot.state !== 'error') this.setState('speaking');
        },
        onIdle: () => {
          if (this.snapshot.state === 'speaking') this.setState('listening');
        },
      });

      this.streamer = new AudioStreamer({
        targetSampleRate: provider.inputSampleRate,
        onChunk: (base64) => {
          provider.sendAudio(base64);
          const chunks = this.streamer?.chunks ?? 0;
          if (chunks % 10 === 0) this.update({ micChunksSent: chunks });
        },
        onLevel: (rms) => {
          provider.handleLevel(rms);
          this.update({ micLevel: rms });
        },
        onError: (error) => this.fail('Microphone error', error),
      });

      await this.streamer.requestMicrophone();
      await provider.connect();
      await this.streamer.start();

      this.setState('listening');
      log.info(`Session live (${provider.name})`);
    } catch (error) {
      this.fail('Could not start the assistant', error);
      this.teardown();
    } finally {
      this.starting = false;
    }
  }

  stop(): void {
    log.info('Stopping');
    this.teardown();
    this.setState('idle');
    this.update({ micLevel: 0, micChunksSent: 0 });
  }

  async toggle(): Promise<void> {
    const state = this.snapshot.state;
    if (state === 'idle' || state === 'error') await this.start();
    else this.stop();
  }

  private teardown(): void {
    this.streamer?.stop();
    this.streamer = null;

    this.playback?.clear('session stop');
    this.playback = null;

    this.provider?.close();
    this.provider = null;

    this.tools = null;
    this.currentUserLineId = null;
    this.currentAssistantLineId = null;
  }

  private fail(message: string, error?: unknown): void {
    const detail = error === undefined ? message : `${message}: ${describeError(error)}`;
    log.error(detail);
    this.setState('error', detail);
  }

  private onToolExecuted(record: ToolExecutionRecord): void {
    this.update({ lastAction: `${record.name}${record.result.success ? ' - ok' : ' - failed'}` });
  }

  async runSpeakerTest(): Promise<void> {
    try {
      await playTestTone(440, 700);
      this.update({ audioContextState: getOutputState() });
    } catch (error) {
      this.fail('Speaker test failed', error);
    }
  }

  async shutdown(): Promise<void> {
    this.stop();
    await disposeOutputAudio();
  }
}

export const arushiController = new ArushiController();
