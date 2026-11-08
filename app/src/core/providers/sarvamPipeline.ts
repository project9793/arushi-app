import { createLogger, describeError } from '../logger';
import { decodeWavToFloat32, encodeWav, joinBase64Pcm } from '../wav';
import type { VoiceProvider, VoiceProviderEvents } from './types';

const log = createLogger('sarvam');

const STT_URL = 'https://api.sarvam.ai/speech-to-text';
const CHAT_URL = 'https://api.sarvam.ai/v1/chat/completions';
const TTS_URL = 'https://api.sarvam.ai/text-to-speech';
const SAMPLE_RATE = 16000;
const SILENCE_MS = 900;
const SPEECH_RMS = 0.02;
const MAX_TURN_MS = 25000;

export interface SarvamOptions {
  apiKey: string;
  voice: string;
  languageCode: string;
  instructions: string;
  events: VoiceProviderEvents;
}

/**
 * Sarvam AI has no single speech-to-speech socket, so this provider runs the
 * classic pipeline: buffer the microphone until the user stops talking, then
 * Saaras (speech to text) -> Sarvam chat -> Bulbul (text to speech) -> speaker.
 */
export class SarvamPipelineProvider implements VoiceProvider {
  readonly name = 'sarvam';
  readonly inputSampleRate = SAMPLE_RATE;

  private chunks: string[] = [];
  private speaking = false;
  private lastVoiceAt = 0;
  private turnStartedAt = 0;
  private busy = false;
  private closed = false;
  private history: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  constructor(private readonly options: SarvamOptions) {}

  async connect(): Promise<string> {
    const response = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': this.options.apiKey,
      },
      body: JSON.stringify({
        model: 'sarvam-105b-conversations',
        messages: [{ role: 'user', content: 'Reply with the single word: ready' }],
        max_tokens: 8,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Sarvam rejected the API key (HTTP ${response.status}): ${body.slice(0, 200)}`);
    }

    log.info('Sarvam key accepted, pipeline ready');
    this.options.events.onReady('sarvam: saaras + sarvam-105b + bulbul');
    return 'sarvam';
  }

  sendAudio(base64Pcm: string): void {
    if (this.closed || this.busy) return;
    this.chunks.push(base64Pcm);
    if (this.chunks.length > 400) this.chunks.shift();
  }

  /** Typed message: skip speech-to-text and answer it directly. */
  sendText(text: string): void {
    if (this.closed || this.busy) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    this.busy = true;
    void (async () => {
      try {
        const reply = await this.reply(trimmed);
        if (!reply) return;
        this.options.events.onAssistantTranscript(reply, true);
        await this.speak(reply);
        this.options.events.onTurnComplete();
      } catch (error) {
        log.error(`Typed turn failed: ${describeError(error)}`);
        this.options.events.onError(`Sarvam turn failed: ${describeError(error)}`);
      } finally {
        this.busy = false;
      }
    })();
  }

  handleLevel(rms: number): void {
    if (this.closed || this.busy) return;

    const now = Date.now();
    if (rms > SPEECH_RMS) {
      if (!this.speaking) {
        this.speaking = true;
        this.turnStartedAt = now;
        this.chunks = [];
        this.options.events.onInterrupted();
      }
      this.lastVoiceAt = now;
      return;
    }

    if (!this.speaking) return;

    const silentFor = now - this.lastVoiceAt;
    const turnLength = now - this.turnStartedAt;
    if (silentFor > SILENCE_MS || turnLength > MAX_TURN_MS) {
      this.speaking = false;
      void this.runTurn();
    }
  }

  private async runTurn(): Promise<void> {
    const chunks = this.chunks;
    this.chunks = [];
    if (chunks.length === 0) return;

    this.busy = true;
    try {
      const pcm = joinBase64Pcm(chunks);
      const seconds = pcm.length / SAMPLE_RATE;
      if (seconds < 0.35) {
        log.debug(`Ignoring a ${seconds.toFixed(2)}s blip`);
        return;
      }

      const transcript = await this.transcribe(pcm);
      if (!transcript) {
        log.info('No speech recognised in that turn');
        return;
      }

      this.options.events.onUserTranscript(transcript, true);
      const reply = await this.reply(transcript);
      if (!reply) return;

      this.options.events.onAssistantTranscript(reply, true);
      await this.speak(reply);
      this.options.events.onTurnComplete();
    } catch (error) {
      log.error(`Turn failed: ${describeError(error)}`);
      this.options.events.onError(`Sarvam turn failed: ${describeError(error)}`);
    } finally {
      this.busy = false;
    }
  }

  private async transcribe(pcm: Int16Array): Promise<string> {
    const wav = encodeWav(pcm, SAMPLE_RATE);
    const form = new FormData();
    form.append('file', new Blob([wav], { type: 'audio/wav' }), 'turn.wav');
    form.append('model', 'saaras:v4');
    form.append('mode', 'transcribe');

    const response = await fetch(STT_URL, {
      method: 'POST',
      headers: { 'api-subscription-key': this.options.apiKey },
      body: form,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`speech-to-text ${response.status}: ${body.slice(0, 200)}`);
    }

    const payload = (await response.json()) as { transcript?: string };
    return (payload.transcript ?? '').trim();
  }

  private async reply(transcript: string): Promise<string> {
    this.history.push({ role: 'user', content: transcript });
    if (this.history.length > 12) this.history = this.history.slice(-12);

    const response = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': this.options.apiKey,
      },
      body: JSON.stringify({
        model: 'sarvam-105b-conversations',
        messages: [{ role: 'system', content: this.options.instructions }, ...this.history],
        max_tokens: 220,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`chat ${response.status}: ${body.slice(0, 200)}`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = (payload.choices?.[0]?.message?.content ?? '').trim();
    if (text) this.history.push({ role: 'assistant', content: text });
    return text;
  }

  private async speak(text: string): Promise<void> {
    const response = await fetch(TTS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': this.options.apiKey,
      },
      body: JSON.stringify({
        text: text.slice(0, 2400),
        language_code: this.options.languageCode,
        model: 'bulbul:v3',
        speaker: this.options.voice,
        speech_sample_rate: 24000,
        output_audio_codec: 'wav',
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`text-to-speech ${response.status}: ${body.slice(0, 200)}`);
    }

    const payload = (await response.json()) as { audios?: string[] };
    const audio = (payload.audios ?? []).join('');
    if (!audio) {
      log.warn('Text to speech returned no audio');
      return;
    }

    const decoded = decodeWavToFloat32(audio);
    this.options.events.onAudio(decoded.samples, decoded.sampleRate);
  }

  close(): void {
    this.closed = true;
    this.chunks = [];
    this.speaking = false;
    this.busy = false;
    this.history = [];
    log.info('Sarvam pipeline closed');
  }
}
