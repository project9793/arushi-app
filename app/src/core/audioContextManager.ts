import { createLogger, describeError } from './logger';

const log = createLogger('audio-context');

type AudioContextCtor = new (contextOptions?: AudioContextOptions) => AudioContext;

let outputContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
let monitorAnalyser: AnalyserNode | null = null;

function getAudioContextCtor(): AudioContextCtor {
  const w = window as unknown as {
    AudioContext?: AudioContextCtor;
    webkitAudioContext?: AudioContextCtor;
  };
  const ctor = w.AudioContext ?? w.webkitAudioContext;
  if (!ctor) {
    throw new Error('Web Audio API is not available in this browser.');
  }
  return ctor;
}

export function getOutputContext(): AudioContext {
  if (outputContext && outputContext.state !== 'closed') return outputContext;

  const Ctor = getAudioContextCtor();
  outputContext = new Ctor({ latencyHint: 'interactive' });
  log.info('Output AudioContext created', { sampleRate: outputContext.sampleRate });

  masterGain = outputContext.createGain();
  masterGain.gain.value = 1;
  masterGain.connect(outputContext.destination);

  monitorAnalyser = outputContext.createAnalyser();
  monitorAnalyser.fftSize = 512;
  monitorAnalyser.smoothingTimeConstant = 0.6;
  masterGain.connect(monitorAnalyser);

  log.info('Audio graph ready: source -> gain -> destination', {
    gain: masterGain.gain.value,
    destinationChannels: outputContext.destination.channelCount,
  });

  return outputContext;
}

export async function ensureOutputRunning(): Promise<AudioContext> {
  const ctx = getOutputContext();

  if (ctx.state === 'suspended') {
    log.info('AudioContext suspended - resuming');
    try {
      await ctx.resume();
    } catch (error) {
      log.error('AudioContext.resume() failed', describeError(error));
      throw error;
    }
  }

  if (ctx.state !== 'running') {
    const message = `AudioContext is "${ctx.state}" after resume - output would be silent.`;
    log.error(message);
    throw new Error(message);
  }

  log.info('AudioContext running', { state: ctx.state, sampleRate: ctx.sampleRate });
  return ctx;
}

export function getMasterGain(): GainNode {
  if (!masterGain) getOutputContext();
  return masterGain as GainNode;
}

export function getMonitorAnalyser(): AnalyserNode | null {
  return monitorAnalyser;
}

export function getOutputState(): AudioContextState | 'uninitialised' {
  return outputContext ? outputContext.state : 'uninitialised';
}

export function getOutputSampleRate(): number | null {
  return outputContext ? outputContext.sampleRate : null;
}

export async function playTestTone(frequency = 440, durationMs = 600): Promise<void> {
  const ctx = await ensureOutputRunning();
  const gain = getMasterGain();

  const sampleCount = Math.floor((ctx.sampleRate * durationMs) / 1000);
  const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  const fadeSamples = Math.floor(ctx.sampleRate * 0.02);

  for (let i = 0; i < sampleCount; i += 1) {
    const envelope =
      i < fadeSamples
        ? i / fadeSamples
        : i > sampleCount - fadeSamples
          ? (sampleCount - i) / fadeSamples
          : 1;
    data[i] = Math.sin((2 * Math.PI * frequency * i) / ctx.sampleRate) * 0.25 * envelope;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(gain);
  source.start();

  log.info('Test tone started', { frequency, durationMs, contextState: ctx.state, gain: gain.gain.value });

  await new Promise<void>((resolve) => {
    source.onended = () => {
      source.disconnect();
      log.info('Test tone ended');
      resolve();
    };
  });
}

export async function disposeOutputAudio(): Promise<void> {
  if (!outputContext) return;
  const ctx = outputContext;
  outputContext = null;
  masterGain = null;
  monitorAnalyser = null;
  try {
    await ctx.close();
    log.info('Output AudioContext closed');
  } catch (error) {
    log.warn('Output AudioContext close failed', describeError(error));
  }
}
