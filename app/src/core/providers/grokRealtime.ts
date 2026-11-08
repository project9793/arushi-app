import { createLogger, describeError } from '../logger';
import type { VoiceProvider, VoiceProviderEvents } from './types';

const log = createLogger('grok');

const REALTIME_URL = 'wss://api.x.ai/v1/realtime?model=grok-voice-latest';
const CLIENT_SECRET_URL = 'https://api.x.ai/v1/realtime/client_secrets';
const CONNECT_TIMEOUT_MS = 20000;
const SAMPLE_RATE = 24000;

export interface GrokOptions {
  apiKey: string;
  voice: string;
  instructions: string;
  events: VoiceProviderEvents;
}

/**
 * Grok Realtime speech-to-speech.
 *
 * Browsers cannot set an Authorization header on a WebSocket, so we mint a
 * short-lived client secret with the API key and pass it as a subprotocol:
 * `xai-client-secret.<token>`. That is the flow xAI documents for client-side
 * apps.
 */
export class GrokRealtimeProvider implements VoiceProvider {
  readonly name = 'grok';
  readonly inputSampleRate = SAMPLE_RATE;

  private socket: WebSocket | null = null;
  private assistantBuffer = '';
  private intentionalClose = false;

  constructor(private readonly options: GrokOptions) {}

  private async mintClientSecret(): Promise<string> {
    const response = await fetch(CLIENT_SECRET_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.options.apiKey}`,
      },
      body: JSON.stringify({ expires_after: { seconds: 300 } }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`xAI rejected the API key (HTTP ${response.status}): ${body.slice(0, 200)}`);
    }

    const payload = (await response.json()) as { value?: string };
    if (!payload.value) throw new Error('xAI returned no client secret');
    log.info('Minted an xAI client secret');
    return payload.value;
  }

  async connect(): Promise<string> {
    const secret = await this.mintClientSecret();

    return new Promise<string>((resolve, reject) => {
      let settled = false;
      const socket = new WebSocket(REALTIME_URL, [`xai-client-secret.${secret}`]);
      this.socket = socket;

      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        reject(new Error(`Grok did not confirm the session within ${CONNECT_TIMEOUT_MS} ms`));
      }, CONNECT_TIMEOUT_MS);

      socket.onopen = () => {
        log.info('Grok socket open, sending session.update');
        socket.send(
          JSON.stringify({
            type: 'session.update',
            session: {
              voice: this.options.voice,
              instructions: this.options.instructions,
              turn_detection: { type: 'server_vad' },
              audio: {
                input: { format: { type: 'audio/pcm', rate: SAMPLE_RATE } },
                output: { format: { type: 'audio/pcm', rate: SAMPLE_RATE } },
              },
            },
          }),
        );
      };

      socket.onmessage = (event: MessageEvent<string>) => {
        let payload: Record<string, unknown>;
        try {
          payload = JSON.parse(event.data) as Record<string, unknown>;
        } catch (error) {
          log.error(`Grok sent unparseable data: ${describeError(error)}`);
          return;
        }

        const type = String(payload.type ?? '');

        if ((type === 'session.updated' || type === 'session.created') && !settled) {
          settled = true;
          clearTimeout(timer);
          log.info(`Grok session ready (${type})`);
          this.options.events.onReady('grok-voice-latest');
          resolve('grok-voice-latest');
          return;
        }

        this.handleEvent(type, payload);
      };

      socket.onerror = () => {
        log.error('Grok socket error');
        this.options.events.onError('Grok connection error');
      };

      socket.onclose = (event: CloseEvent) => {
        clearTimeout(timer);
        const reason = event.reason || 'no reason given';
        log.warn(`Grok socket closed (code ${event.code}, ${reason})`);
        this.socket = null;
        if (!settled) {
          settled = true;
          reject(new Error(`Grok closed before the session started (code ${event.code}, ${reason})`));
          return;
        }
        this.options.events.onClosed({ reason, reconnecting: false });
        if (this.intentionalClose) log.info('Grok session closed by the app');
      };
    });
  }

  private handleEvent(type: string, payload: Record<string, unknown>): void {
    const events = this.options.events;

    switch (type) {
      case 'response.output_audio.delta': {
        const delta = payload.delta;
        if (typeof delta === 'string' && delta) {
          events.onAudio(decodePcm16(delta), SAMPLE_RATE);
        }
        break;
      }

      case 'response.output_audio_transcript.delta': {
        const delta = payload.delta;
        if (typeof delta === 'string') {
          this.assistantBuffer += delta;
          events.onAssistantTranscript(this.assistantBuffer, false);
        }
        break;
      }

      case 'response.output_audio_transcript.done':
        if (this.assistantBuffer) events.onAssistantTranscript(this.assistantBuffer, true);
        this.assistantBuffer = '';
        break;

      case 'conversation.item.input_audio_transcription.completed': {
        const transcript = payload.transcript;
        if (typeof transcript === 'string') events.onUserTranscript(transcript, true);
        break;
      }

      case 'input_audio_buffer.speech_started':
        events.onInterrupted();
        break;

      case 'response.done':
        events.onTurnComplete();
        break;

      case 'error': {
        const error = payload.error as { message?: string } | undefined;
        log.error(`Grok error event: ${error?.message ?? 'unknown'}`);
        events.onError(`Grok error: ${error?.message ?? 'unknown'}`);
        break;
      }

      default:
        break;
    }
  }

  sendAudio(base64Pcm: string): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    this.socket.send(JSON.stringify({ type: 'input_audio_buffer.append', audio: base64Pcm }));
  }

  handleLevel(): void {
    // Server-side VAD handles turn detection for Grok.
  }

  close(): void {
    this.intentionalClose = true;
    try {
      this.socket?.close();
    } catch (error) {
      log.warn(`Grok close failed: ${describeError(error)}`);
    }
    this.socket = null;
  }
}

function decodePcm16(base64: string): Float32Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);

  const view = new DataView(bytes.buffer);
  const count = bytes.byteLength >> 1;
  const samples = new Float32Array(count);
  for (let i = 0; i < count; i += 1) samples[i] = view.getInt16(i * 2, true) / 32768;
  return samples;
}
