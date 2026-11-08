/**
 * Microphone -> mono PCM16 worklet.
 *
 * The target sample rate is passed in via processorOptions so the same worklet
 * serves Gemini (16 kHz) and the providers that want 24 kHz.
 */

const CHUNK_SAMPLES = 1600;
const LEVEL_EVERY_N_BLOCKS = 16;

class ArushiPcmCapture extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const target = options && options.processorOptions && options.processorOptions.targetSampleRate;
    this.targetSampleRate = typeof target === 'number' && target > 0 ? target : 16000;
    this.ratio = sampleRate / this.targetSampleRate;
    this.readPos = 0;
    this.prevSample = 0;
    this.pcm = new Int16Array(CHUNK_SAMPLES);
    this.writeIndex = 0;
    this.blockCount = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;

    const channel = input[0];
    if (!channel || channel.length === 0) return true;

    // Keep one sample of history so interpolation is continuous across blocks.
    const buffer = new Float32Array(channel.length + 1);
    buffer[0] = this.prevSample;
    buffer.set(channel, 1);

    let sumSquares = 0;
    let counted = 0;

    while (this.readPos < buffer.length - 1) {
      const index = Math.floor(this.readPos);
      const frac = this.readPos - index;
      const raw = buffer[index] * (1 - frac) + buffer[index + 1] * frac;
      const sample = raw > 1 ? 1 : raw < -1 ? -1 : raw;

      this.pcm[this.writeIndex++] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      sumSquares += sample * sample;
      counted++;

      if (this.writeIndex === CHUNK_SAMPLES) {
        this.port.postMessage({ type: 'pcm', buffer: this.pcm.buffer }, [this.pcm.buffer]);
        this.pcm = new Int16Array(CHUNK_SAMPLES);
        this.writeIndex = 0;
      }

      this.readPos += this.ratio;
    }

    this.readPos -= buffer.length - 1;
    this.prevSample = channel[channel.length - 1];

    this.blockCount++;
    if (this.blockCount % LEVEL_EVERY_N_BLOCKS === 0) {
      const rms = counted > 0 ? Math.sqrt(sumSquares / counted) : 0;
      this.port.postMessage({ type: 'level', rms });
    }

    return true;
  }
}

registerProcessor('arushi-pcm-capture', ArushiPcmCapture);
