import type { AssistantState } from '../core/types';

interface PowerButtonProps {
  state: AssistantState;
  onPress: () => void;
}

const ACTIVE_STATES: AssistantState[] = ['connecting', 'listening', 'speaking'];

export function PowerButton({ state, onPress }: PowerButtonProps) {
  const active = ACTIVE_STATES.includes(state);
  const label = active ? 'Stop Arushi' : state === 'error' ? 'Try again' : 'Start Arushi';

  return (
    <button
      type="button"
      onClick={onPress}
      aria-label={label}
      className={`power-button group relative grid h-20 w-20 place-items-center rounded-full transition-transform duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07050f] ${
        active
          ? 'bg-gradient-to-br from-rose-500 to-fuchsia-600 shadow-[0_16px_40px_-12px_rgba(244,63,94,0.8)]'
          : 'bg-gradient-to-br from-violet-500 to-indigo-600 shadow-[0_16px_40px_-12px_rgba(139,92,246,0.9)]'
      }`}
    >
      <span className="sr-only">{label}</span>
      {active ? (
        <svg viewBox="0 0 24 24" className="h-7 w-7 fill-white" aria-hidden="true">
          <rect x="6" y="6" width="12" height="12" rx="2.5" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-8 w-8 fill-white" aria-hidden="true">
          <path d="M12 3a1 1 0 0 1 1 1v7a1 1 0 1 1-2 0V4a1 1 0 0 1 1-1Z" />
          <path d="M7.05 6.34a1 1 0 0 1-.27 1.39 6 6 0 1 0 10.44 0 1 1 0 1 1 1.12-1.66 8 8 0 1 1-13.92 0 1 1 0 0 1 1.63.27Z" />
        </svg>
      )}
    </button>
  );
}
