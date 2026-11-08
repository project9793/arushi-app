export interface VoiceProviderEvents {
  onReady: (model: string) => void;
  onAudio: (samples: Float32Array, sampleRate: number) => void;
  onUserTranscript: (text: string, finished: boolean) => void;
  onAssistantTranscript: (text: string, finished: boolean) => void;
  onInterrupted: () => void;
  onTurnComplete: () => void;
  onError: (message: string, error?: unknown) => void;
  onClosed: (info: { reason: string; reconnecting: boolean }) => void;
}

/**
 * One interface for every backend.
 *
 * Gemini Live and Grok Realtime are true streaming speech-to-speech sockets.
 * Sarvam is a turn-based pipeline (transcribe, think, speak), so it buffers the
 * microphone and answers once the user stops talking. The controller does not
 * need to know which is which.
 */
export interface VoiceProvider {
  readonly name: string;
  /** Rate the microphone should be resampled to for this provider. */
  readonly inputSampleRate: number;
  connect(): Promise<string>;
  sendAudio(base64Pcm: string): void;
  /** Microphone level, used by the turn-based provider for end-of-speech. */
  handleLevel(rms: number): void;
  close(): void;
}
