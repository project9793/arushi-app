import { useSyncExternalStore } from 'react';
import { arushiController } from '../core/arushiController';
import type { ArushiSnapshot } from '../core/types';

export interface UseArushiResult {
  snapshot: ArushiSnapshot;
  start: () => Promise<void>;
  stop: () => void;
  toggle: () => Promise<void>;
  runSpeakerTest: () => Promise<void>;
  clearTranscript: () => void;
}

export function useArushi(): UseArushiResult {
  const snapshot = useSyncExternalStore(
    arushiController.subscribe,
    arushiController.getSnapshot,
    arushiController.getSnapshot,
  );

  return {
    snapshot,
    start: () => arushiController.start(),
    stop: () => arushiController.stop(),
    toggle: () => arushiController.toggle(),
    runSpeakerTest: () => arushiController.runSpeakerTest(),
    clearTranscript: () => arushiController.clearTranscript(),
  };
}
