export type AssistantState = 'idle' | 'connecting' | 'listening' | 'speaking' | 'error';

export interface TranscriptLine {
  id: string;
  role: 'user' | 'arushi';
  text: string;
  at: number;
}

export interface ArushiSnapshot {
  state: AssistantState;
  error: string | null;
  micLevel: number;
  model: string | null;
  voice: string;
  platform: string;
  native: boolean;
  transcript: TranscriptLine[];
  lastAction: string | null;
  audioContextState: AudioContextState | 'uninitialised';
  outputSampleRate: number | null;
  micChunksSent: number;
  audioChunksIn: number;
}
