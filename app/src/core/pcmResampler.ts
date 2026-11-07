export interface ResamplerState {
  readPos: number;
  prevSample: number;
}

export function createResamplerState(): ResamplerState {
  return { readPos: 0, prevSample: 0 };
}

export function resampleBlockToPcm16(
  input: Float32Array,
  inputRate: number,
  targetRate: number,
  state: ResamplerState,
): Int16Array {
  if (input.length === 0) return new Int16Array(0);

  const ratio = inputRate / targetRate;
  const buffer = new Float32Array(input.length + 1);
  buffer[0] = state.prevSample;
  buffer.set(input, 1);

  const output: number[] = [];

  while (state.readPos < buffer.length - 1) {
    const index = Math.floor(state.readPos);
    const frac = state.readPos - index;
    const raw = buffer[index] * (1 - frac) + buffer[index + 1] * frac;
    const sample = raw > 1 ? 1 : raw < -1 ? -1 : raw;
    output.push(sample < 0 ? sample * 0x8000 : sample * 0x7fff);
    state.readPos += ratio;
  }

  state.readPos -= buffer.length - 1;
  state.prevSample = input[input.length - 1];

  return Int16Array.from(output);
}

export function rmsOf(samples: Float32Array): number {
  if (samples.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i += 1) sum += samples[i] * samples[i];
  return Math.sqrt(sum / samples.length);
}
