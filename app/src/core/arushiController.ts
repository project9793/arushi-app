import type { FunctionCall, FunctionResponse } from '@google/genai';
import { getModelCandidates, VOICE_NAME } from '../config/geminiConfig';
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
import { resolveCredentials } from './credentials';
import { ArushiLiveSession } from './liveSession';
import { createLogger, describeError } from './logger';
import type { AssistantState, ArushiSnapshot, TranscriptLine } from './types';

const log = createLogger('controller');

export type SnapshotListener = (snapshot: ArushiSnapshot) => void;

const MAX_TRANSCRIPT_LINES = 40;

export class ArushiController {
  private listeners = new Set<SnapshotListener>();
  private snapshot: ArushiSnapshot;

  private streamer: AudioStreamer | null = null;
  private session: ArushiLiveSession | null = null;
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
      voice: VOICE_NAME,
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

  async start(): Promise<void> {
    if (this.starting) return;
    if (this.snapshot.state === 'connecting' || this.snapshot.state === 'listening' || this.snapshot.state === 'speaking') {
      return;
    }

    this.starting = true;
    this.setState('connecting');
    log.info('Arushi starting');

    try {
      // Output AudioContext FIRST, while we are still inside the tap gesture.
      await ensureOutputRunning();
      this.update({ audioContextState: getOutputState(), outputSampleRate: getOutputSampleRate() });

      const credentials = await resolveCredentials();
      log.info('Credentials resolved', { source: credentials.source });

      this.streamer = new AudioStreamer({
        onChunk: (base64) => {
          this.session?.sendAudio(base64);
          const chunks = this.streamer?.chunks ?? 0;
          if (chunks % 10 === 0) this.update({ micChunksSent: chunks });
        },
        onLevel: (rms) => this.update({ micLevel: rms }),
        onError: (error) => this.fail('Microphone error', error),
      });
      await this.streamer.requestMicrophone();

      this.playback = new AudioPlaybackQueue({
        onStart: () => {
          if (this.snapshot.state !== 'error') this.setState('speaking');
        },
        onIdle: () => {
          if (this.snapshot.state === 'speaking') this.setState('listening');
        },
      });

      this.tools = new FunctionCalling((record) => this.onToolExecuted(record));

      this.session = new ArushiLiveSession({
        apiKey: credentials.apiKey,
        models: credentials.model ? [credentials.model, ...getModelCandidates()] : getModelCandidates(),
        handlers: {
          onReady: (model) => {
            this.update({ model });
            if (this.snapshot.state === 'connecting') this.setState('listening');
          },
          onAudio: (audio) => {
            this.playback?.enqueue(audio.samples, audio.sampleRate);
            this.update({ audioChunksIn: this.session?.receivedChunks ?? 0 });
          },
          onModelText: (text) => log.debug('Model text part', { text: text.slice(0, 120) }),
          onUserTranscript: (text, finished) => this.pushTranscript('user', text, finished),
          onAssistantTranscript: (text, finished) => this.pushTranscript('arushi', text, finished),
          onInterrupted: () => {
            this.playback?.clear('barge-in');
            this.currentAssistantLineId = null;
            this.setState('listening');
          },
          onTurnComplete: () => {
            this.currentAssistantLineId = null;
            this.currentUserLineId = null;
            this.playback?.notifyTurnComplete();
          },
          onToolCall: (calls) => this.executeTools(calls),
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
        },
      });

      await this.session.connect();

      await this.streamer.start();
      this.setState('listening');
      log.info('Arushi is live', { model: this.session.model, voice: VOICE_NAME });
    } catch (error) {
      this.fail('Could not start Arushi', error);
      this.teardown();
    } finally {
      this.starting = false;
    }
  }

  stop(): void {
    log.info('Arushi stopping');
    this.teardown();
    this.setState('idle');
    this.update({ micLevel: 0, micChunksSent: 0 });
  }

  async toggle(): Promise<void> {
    const state = this.snapshot.state;
    if (state === 'idle' || state === 'error') {
      await this.start();
    } else {
      this.stop();
    }
  }

  private teardown(): void {
    this.streamer?.stop();
    this.streamer = null;

    this.playback?.clear('session stop');
    this.playback = null;

    this.session?.close();
    this.session = null;

    this.tools = null;
    this.currentUserLineId = null;
    this.currentAssistantLineId = null;
  }

  private fail(message: string, error?: unknown): void {
    const detail = error === undefined ? message : `${message}: ${describeError(error)}`;
    log.error(detail);
    this.setState('error', detail);
  }

  private async executeTools(calls: FunctionCall[]): Promise<FunctionResponse[]> {
    if (!this.tools) return [];
    const responses: FunctionResponse[] = [];
    for (const call of calls) {
      responses.push(await this.tools.execute(call));
    }
    return responses;
  }

  private onToolExecuted(record: ToolExecutionRecord): void {
    const label = `${record.name}${record.result.success ? ' - ok' : ' - failed'}`;
    this.update({ lastAction: label });
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
