import type { AssistantState } from '../core/types';

interface ArushiOrbProps {
  state: AssistantState;
  micLevel: number;
}

export function ArushiOrb({ state, micLevel }: ArushiOrbProps) {
  const level = state === 'listening' ? Math.min(1, micLevel * 9) : 0;

  return (
    <div
      className={`orb orb--${state}`}
      style={{ ['--level' as string]: level.toFixed(3) }}
      aria-hidden="true"
    >
      <div className="orb__glow" />
      <div className="orb__ring orb__ring--1" />
      <div className="orb__ring orb__ring--2" />
      <div className="orb__core">
        {state === 'speaking' ? (
          <div className="waveform">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        ) : null}
      </div>
    </div>
  );
}
