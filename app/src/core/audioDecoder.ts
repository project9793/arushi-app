export interface AudioMimeInfo {
  mimeType: string;
  sampleRate: number;
  channels: number;
  encoding: 'pcm16' | 'unsupported';
}

export interface DecodedAudio {
  samples: Float32Array;
  sampleRate: number;
  channels: number;
  byteLength: number;
}

/** Native audio output of the Live API is 24 kHz mono PCM16 unless told otherwise. */
export const DEFAULT_OUTPUT_SAMPLE_RATE = 24000;

export function parseAudioMime(mimeType: string | undefined): AudioMimeInfo {
  const raw = (mimeType ?? '').toLowerCase().trim();
  const rateMatch = /rate=(\d+)/.exec(raw);
  const channelMatch = /channels=(\d+)/.exec(raw);

  const isPcm =
    raw.includes('pcm') || raw.includes('l16') || raw.includes('linear16') || raw === '';

  return {
    mimeType: mimeType ?? '',
    sampleRate: rateMatch ? Number(rateMatch[1]) : DEFAULT_OUTPUT_SAMPLE_RATE,
    channels: channelMatch ? Number(channelMatch[1]) : 1,
    encoding: isPcm ? 'pcm16' : 'unsupported',
  };
}

export function base64ToBytes(base64: string): Uint8Array {
  const clean = base64.replace(/[\r\n\t ]/g, '');
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function pcm16ToFloat32(bytes: Uint8Array, littleEndian = true): Float32Array {
  const sampleCount = bytes.byteLength >> 1;
  const samples = new Float32Array(sampleCount);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  for (let i = 0; i < sampleCount; i += 1) {
    samples[i] = view.getInt16(i * 2, littleEndian) / 32768;
  }

  return samples;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const block = 0x8000;
  for (let i = 0; i < bytes.length; i += block) {
    binary += String.fromCharCode(...bytes.subarray(i, i + block));
  }
  return btoa(binary);
}

export function pcm16BufferToBase64(buffer: ArrayBuffer): string {
  return bytesToBase64(new Uint8Array(buffer));
}

export function decodeAudioChunk(data: string, mimeType: string | undefined): DecodedAudio {
  if (!data) throw new Error('Audio chunk is empty');

  const info = parseAudioMime(mimeType);
  if (info.encoding !== 'pcm16') {
    throw new Error(`Unsupported audio encoding "${mimeType}". Only raw PCM16 can be decoded.`);
  }

  const bytes = base64ToBytes(data);
  if (bytes.byteLength === 0) throw new Error('Audio chunk decoded to zero bytes');

  const samples = pcm16ToFloat32(bytes, true);

  return {
    samples,
    sampleRate: info.sampleRate,
    channels: info.channels,
    byteLength: bytes.byteLength,
  };
}
