import { createLogger, describeError } from './logger';
import { getMasterGain, getOutputContext } from './audioContextManager';

const log = createLogger('playback-queue');

export interface PlaybackQueueEvents {
  onStart?: () => void;
  onIdle?: () => void;
}

export class AudioPlaybackQueue {
  private nextStartTime = 0;
  private active = new Set<AudioBufferSourceNode>();
  private chunksPlayed = 0;
  private interrupted = false;

  constructor(private readonly events: PlaybackQueueEvents = {}) {}

  get isActive(): boolean {
    return this.active.size > 0;
  }

  get played(): number {
    return this.chunksPlayed;
  }

  enqueue(samples: Float32Array, sampleRate: number): void {
    if (samples.length === 0) return;

    const context = getOutputContext();
    if (context.state !== 'running') {
      log.warn('AudioContext not running at enqueue time - attempting resume', { state: context.state });
      void context.resume().catch((error: unknown) => {
        log.error('AudioContext resume during enqueue failed', describeError(error));
      });
    }

    const buffer = context.createBuffer(1, samples.length, sampleRate);
    buffer.getChannelData(0).set(samples);

    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(getMasterGain());

    const wasIdle = this.active.size === 0;
    const startAt = Math.max(this.nextStartTime, context.currentTime + 0.03);
    this.nextStartTime = startAt + buffer.duration;
    this.interrupted = false;

    source.onended = () => {
      const wasTracked = this.active.delete(source);
      source.disconnect();
      if (!wasTracked) return;

      if (this.active.size === 0) {
        log.info('Playback finished', { chunksPlayed: this.chunksPlayed });
        this.events.onIdle?.();
      }
    };

    this.active.add(source);
    source.start(startAt);
    this.chunksPlayed += 1;

    if (wasIdle) {
      log.info('Playback started', {
        bufferDuration: Number(buffer.duration.toFixed(3)),
        sampleRate,
        contextState: context.state,
        gain: getMasterGain().gain.value,
      });
      this.events.onStart?.();
    }
  }

  notifyTurnComplete(): void {
    if (this.active.size === 0) this.events.onIdle?.();
  }

  clear(reason = 'interrupted'): void {
    const count = this.active.size;
    this.interrupted = true;
    for (const source of this.active) {
      try {
        source.onended = null;
        source.stop();
        source.disconnect();
      } catch (error) {
        log.warn('Error stopping audio source', describeError(error));
      }
    }
    this.active.clear();
    this.nextStartTime = 0;

    if (count > 0) log.info(`Playback queue cleared (${reason})`, { stoppedSources: count });
    this.events.onIdle?.();
  }

  get wasInterrupted(): boolean {
    return this.interrupted;
  }
}
