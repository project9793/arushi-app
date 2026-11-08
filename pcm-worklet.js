/**
 * Microphone -> 16 kHz mono PCM16 worklet.
 *
 * Runs on the audio rendering thread. It downsamples whatever the device gives
 * us (44.1 kHz / 48 kHz typically) to the 16 kHz the Live API expects, converts
 * to signed 16-bit little-endian, and posts 100 ms chunks to the main thread.
 */

const TARGET_SAMPLE_RATE = 16000;
const CHUNK_SAMPLES = 1600; // 100 ms at 16 kHz
const LEVEL_EVERY_N_BLOCKS = 16;

class ArushiPcmCapture extends AudioWorkletProcessor {
  constructor() {
    super();
    this.ratio = sampleRate / TARGET_SAMPLE_RATE;
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
