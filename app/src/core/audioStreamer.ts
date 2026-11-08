import { createLogger, describeError } from './logger';
import { bytesToBase64 } from './audioDecoder';
import { createResamplerState, resampleBlockToPcm16, rmsOf } from './pcmResampler';

const log = createLogger('microphone');

const CHUNK_SAMPLES = 1600; // 100 ms at 16 kHz

export interface AudioStreamerOptions {
  onChunk: (base64: string, samples: number) => void;
  onLevel: (rms: number) => void;
  onError: (error: unknown) => void;
  /** Rate the provider wants. Gemini is 16 kHz, Grok realtime is 24 kHz. */
  targetSampleRate?: number;
}

export class AudioStreamer {
  private stream: MediaStream | null = null;
  private context: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private scriptNode: ScriptProcessorNode | null = null;
  private sink: GainNode | null = null;
  private running = false;
  private chunksSent = 0;
  private pending: Int16Array[] = [];
  private pendingSamples = 0;

  constructor(private readonly options: AudioStreamerOptions) {}

  private get targetRate(): number {
    return this.options.targetSampleRate ?? 16000;
  }

  get isRunning(): boolean {
    return this.running;
  }

  get chunks(): number {
    return this.chunksSent;
  }

  async requestMicrophone(): Promise<MediaStream> {
    if (this.stream) return this.stream;
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('This browser does not expose microphone capture (getUserMedia).');
    }

    log.info('Microphone permission requested');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      log.info('Microphone permission granted', {
        tracks: stream.getAudioTracks().map((track) => ({ label: track.label, enabled: track.enabled })),
      });
      this.stream = stream;
      return stream;
    } catch (error) {
      log.error('Microphone permission denied or unavailable', describeError(error));
      throw error;
    }
  }

  async start(): Promise<void> {
    if (this.running) return;

    const stream = await this.requestMicrophone();
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) throw new Error('Web Audio API is not available in this browser.');

    this.context = new Ctor({ latencyHint: 'interactive' });
    if (this.context.state === 'suspended') await this.context.resume();

    this.sourceNode = this.context.createMediaStreamSource(stream);
    this.sink = this.context.createGain();
    this.sink.gain.value = 0;
    this.sink.connect(this.context.destination);

    const useWorklet = typeof this.context.audioWorklet !== 'undefined' && 'AudioWorkletNode' in window;

    if (useWorklet) {
      await this.startWorklet();
    } else {
      log.warn('AudioWorklet unavailable - falling back to ScriptProcessorNode');
      this.startScriptProcessor();
    }

    this.running = true;
    log.info('Microphone started', {
      inputSampleRate: this.context.sampleRate,
      outputSampleRate: this.targetRate,
      pipeline: useWorklet ? 'audioworklet' : 'scriptprocessor',
    });
  }

  private async startWorklet(): Promise<void> {
    const context = this.context as AudioContext;
    const workletUrl = new URL(`${import.meta.env.BASE_URL}pcm-worklet.js`, window.location.href).href;
    await context.audioWorklet.addModule(workletUrl);

    const node = new AudioWorkletNode(context, 'arushi-pcm-capture', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      channelCount: 1,
      channelCountMode: 'explicit',
      processorOptions: { targetSampleRate: this.targetRate },
    });

    node.port.onmessage = (event: MessageEvent<{ type: string; buffer?: ArrayBuffer; rms?: number }>) => {
      const payload = event.data;
      if (payload.type === 'pcm' && payload.buffer) {
        this.emitChunk(payload.buffer);
      } else if (payload.type === 'level' && typeof payload.rms === 'number') {
        this.options.onLevel(payload.rms);
      }
    };

    this.sourceNode?.connect(node);
    node.connect(this.sink as GainNode);
    this.workletNode = node;
  }

  private startScriptProcessor(): void {
    const context = this.context as AudioContext;
    const node = context.createScriptProcessor(4096, 1, 1);
    const state = createResamplerState();

    node.onaudioprocess = (event: AudioProcessingEvent) => {
      const input = event.inputBuffer.getChannelData(0);
      const pcm = resampleBlockToPcm16(input, context.sampleRate, this.targetRate, state);
      this.options.onLevel(rmsOf(input));
      if (pcm.length > 0) this.accumulate(pcm);
    };

    this.sourceNode?.connect(node);
    node.connect(this.sink as GainNode);
    this.scriptNode = node;
  }

  private accumulate(pcm: Int16Array): void {
    this.pending.push(pcm);
    this.pendingSamples += pcm.length;

    while (this.pendingSamples >= CHUNK_SAMPLES) {
      const merged = new Int16Array(CHUNK_SAMPLES);
      let written = 0;
      while (written < CHUNK_SAMPLES && this.pending.length > 0) {
        const head = this.pending[0];
        const take = Math.min(head.length, CHUNK_SAMPLES - written);
        merged.set(head.subarray(0, take), written);
        written += take;
        if (take === head.length) {
          this.pending.shift();
        } else {
          this.pending[0] = head.subarray(take);
        }
      }
      this.pendingSamples -= CHUNK_SAMPLES;
      this.emitChunk(merged.buffer);
    }
  }

  private emitChunk(buffer: ArrayBuffer): void {
    try {
      const base64 = bytesToBase64(new Uint8Array(buffer));
      this.chunksSent += 1;
      this.options.onChunk(base64, buffer.byteLength / 2);
      if (this.chunksSent === 1) log.info('First microphone chunk sent', { bytes: buffer.byteLength });
    } catch (error) {
      log.error('Failed to encode microphone chunk', describeError(error));
      this.options.onError(error);
    }
  }

  stop(): void {
    this.running = false;
    this.chunksSent = 0;
    this.pending = [];
    this.pendingSamples = 0;

    try {
      this.workletNode?.port.close();
      this.workletNode?.disconnect();
      this.scriptNode?.disconnect();
      if (this.scriptNode) this.scriptNode.onaudioprocess = null;
      this.sourceNode?.disconnect();
      this.sink?.disconnect();
    } catch (error) {
      log.warn('Error while disconnecting microphone graph', describeError(error));
    }

    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;

    if (this.context && this.context.state !== 'closed') {
      void this.context.close().catch((error: unknown) => {
        log.warn('Microphone AudioContext close failed', describeError(error));
      });
    }

    this.context = null;
    this.workletNode = null;
    this.scriptNode = null;
    this.sourceNode = null;
    this.sink = null;
    this.options.onLevel(0);
    log.info('Microphone stopped and released');
  }
}
