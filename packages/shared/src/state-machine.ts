import type { GamePhase } from './types.js';

export type GameEvent =
  | 'START_VOTING'
  | 'REVEAL'
  | 'RESET_ROUND'
  | 'TIMER_EXPIRE';

export function transition(phase: GamePhase, event: GameEvent): GamePhase {
  switch (phase) {
    case 'waiting':
      if (event === 'START_VOTING') return 'voting';
      return phase;

    case 'voting':
      if (event === 'REVEAL' || event === 'TIMER_EXPIRE') return 'revealed';
      return phase;

    case 'revealed':
      if (event === 'RESET_ROUND') return 'voting';
      return phase;
  }
}

export function canVote(phase: GamePhase): boolean {
  return phase === 'voting';
}

export function isRevealed(phase: GamePhase): boolean {
  return phase === 'revealed';
}
