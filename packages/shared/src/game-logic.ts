import { nanoid } from 'nanoid';
import type { CardValue, Deck, Round, RoundStats, TimerState, Vote } from './types.js';

export function generateRoomId(): string {
  return nanoid(8).toUpperCase();
}

export function generateRoundId(): string {
  return nanoid(12);
}

export function createInitialTimer(): TimerState {
  return { durationMs: 60_000, startedAt: null, isPaused: false };
}

export function createInitialRound(deckId: Round['deckId']): Round {
  return {
    id: generateRoundId(),
    issueName: null,
    phase: 'waiting',
    deckId,
    votes: {},
    timer: createInitialTimer(),
    revealedAt: null,
  };
}

export function validateVote(card: CardValue, deck: Deck): boolean {
  return deck.cards.includes(card);
}

export function computeStats(votes: Vote[], deck: Deck): RoundStats {
  const cast = votes.filter((v) => v.card !== null && v.card !== '?' && v.card !== '☕');

  // Build distribution across ALL non-null votes (including ? and ☕)
  const distribution: Record<CardValue, number> = {};
  for (const v of votes) {
    if (v.card !== null) {
      distribution[v.card] = (distribution[v.card] ?? 0) + 1;
    }
  }

  const totalVotes = Object.keys(distribution).reduce((sum, k) => sum + (distribution[k] ?? 0), 0);

  const maxCount = Math.max(0, ...Object.values(distribution));
  const consensusPercent = totalVotes > 0 ? Math.round((maxCount / totalVotes) * 100) : 0;

  // Numeric stats only when deck is numeric and we have castable votes
  if (!deck.isNumeric || cast.length === 0) {
    const allCards = votes
      .filter((v) => v.card !== null)
      .map((v) => v.card as CardValue);

    return {
      average: null,
      median: null,
      min: allCards.length > 0 ? allCards[0]! : null,
      max: allCards.length > 0 ? allCards[allCards.length - 1]! : null,
      consensusPercent,
      distribution,
      totalVotes,
    };
  }

  const nums = cast
    .map((v) => Number(v.card))
    .sort((a, b) => a - b);

  const average = Math.round((nums.reduce((s, n) => s + n, 0) / nums.length) * 10) / 10;

  const mid = Math.floor(nums.length / 2);
  const median =
    nums.length % 2 === 0
      ? Math.round(((nums[mid - 1]! + nums[mid]!) / 2) * 10) / 10
      : nums[mid]!;

  const numericCards = cast.map((v) => v.card as CardValue);

  return {
    average,
    median,
    min: numericCards[0] ?? null,
    max: numericCards[numericCards.length - 1] ?? null,
    consensusPercent,
    distribution,
    totalVotes,
  };
}

export function computeTimerRemaining(timer: TimerState, now = Date.now()): number {
  if (timer.startedAt === null || timer.isPaused) return timer.durationMs;
  return Math.max(0, timer.startedAt + timer.durationMs - now);
}

export function deriveHostPeerId(participants: Record<string, { joinedAt: number }>): string | null {
  const sorted = Object.entries(participants).sort(([, a], [, b]) => a.joinedAt - b.joinedAt);
  return sorted[0]?.[0] ?? null;
}
