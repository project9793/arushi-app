/**
 * WAV helpers for the turn-based providers (Sarvam speech-to-text wants a real
 * audio file, not a stream of raw chunks).
 */

/** Wraps signed 16-bit little-endian PCM in a 44-byte RIFF/WAVE header. */
export function encodeWav(pcm: Int16Array, sampleRate: number, channels = 1): ArrayBuffer {
  const dataBytes = pcm.length * 2;
  const buffer = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(buffer);

  const writeString = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataBytes, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channels * 2, true);
  view.setUint16(32, channels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, dataBytes, true);

  let offset = 44;
  for (let i = 0; i < pcm.length; i += 1) {
    view.setInt16(offset, pcm[i], true);
    offset += 2;
  }

  return buffer;
}

/** Joins the base64 chunks the microphone streamer emits into one PCM buffer. */
export function joinBase64Pcm(chunks: string[]): Int16Array {
  const total = chunks.reduce((sum, chunk) => sum + Math.floor(base64Length(chunk) / 2), 0);
  const output = new Int16Array(total);
  let written = 0;

  for (const chunk of chunks) {
    const bytes = base64ToBytes(chunk);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const samples = bytes.byteLength >> 1;
    for (let i = 0; i < samples; i += 1) {
      output[written++] = view.getInt16(i * 2, true);
    }
  }

  return output.subarray(0, written);
}

function base64Length(base64: string): number {
  const clean = base64.replace(/[^A-Za-z0-9+/=]/g, '');
  const padding = clean.endsWith('==') ? 2 : clean.endsWith('=') ? 1 : 0;
  return Math.floor((clean.length * 3) / 4) - padding;
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Decodes base64 WAV/PCM returned by a text-to-speech endpoint into Float32. */
export function decodeWavToFloat32(base64Audio: string): { samples: Float32Array; sampleRate: number } {
  const bytes = base64ToBytes(base64Audio);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  const isWav = bytes.byteLength > 44 && view.getUint32(0, false) === 0x52494646; // 'RIFF'
  const sampleRate = isWav ? view.getUint32(24, true) : 22050;
  const start = isWav ? 44 : 0;
  const sampleCount = (bytes.byteLength - start) >> 1;

  const samples = new Float32Array(sampleCount);
  for (let i = 0; i < sampleCount; i += 1) {
    samples[i] = view.getInt16(start + i * 2, true) / 32768;
  }

  return { samples, sampleRate };
}
