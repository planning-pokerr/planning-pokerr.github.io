import { describe, it, expect } from 'vitest';
import { computeStats, deriveHostPeerId, computeTimerRemaining, validateVote } from '../game-logic.js';
import { DECKS } from '../decks.js';
import type { Vote } from '../types.js';

function makeVote(peerId: string, card: string | null): Vote {
  return { peerId, card, submittedAt: card ? Date.now() : null };
}

describe('computeStats — Fibonacci deck', () => {
  const deck = DECKS.fibonacci;

  it('computes correct average and median', () => {
    const votes = [makeVote('a', '3'), makeVote('b', '5'), makeVote('c', '8')];
    const stats = computeStats(votes, deck);
    expect(stats.average).toBe(5.3);
    expect(stats.median).toBe(5);
    expect(stats.totalVotes).toBe(3);
  });

  it('returns 100% consensus when all votes match', () => {
    const votes = [makeVote('a', '5'), makeVote('b', '5'), makeVote('c', '5')];
    const stats = computeStats(votes, deck);
    expect(stats.consensusPercent).toBe(100);
  });

  it('handles ☕ and ? in distribution but excludes from numeric stats', () => {
    const votes = [makeVote('a', '8'), makeVote('b', '☕'), makeVote('c', '?')];
    const stats = computeStats(votes, deck);
    expect(stats.average).toBe(8); // only one numeric vote
    expect(stats.distribution['☕']).toBe(1);
    expect(stats.distribution['?']).toBe(1);
    expect(stats.totalVotes).toBe(3);
  });

  it('handles null votes (not yet voted)', () => {
    const votes = [makeVote('a', '5'), makeVote('b', null)];
    const stats = computeStats(votes, deck);
    expect(stats.totalVotes).toBe(1); // only cast votes in distribution
  });

  it('returns null numeric stats with zero numeric votes', () => {
    const votes = [makeVote('a', '?'), makeVote('b', '☕')];
    const stats = computeStats(votes, deck);
    expect(stats.average).toBeNull();
    expect(stats.median).toBeNull();
  });
});

describe('computeStats — T-shirt deck (non-numeric)', () => {
  const deck = DECKS.tshirt;

  it('returns null numeric stats', () => {
    const votes = [makeVote('a', 'S'), makeVote('b', 'M'), makeVote('c', 'L')];
    const stats = computeStats(votes, deck);
    expect(stats.average).toBeNull();
    expect(stats.median).toBeNull();
    expect(stats.distribution['S']).toBe(1);
    expect(stats.distribution['M']).toBe(1);
    expect(stats.totalVotes).toBe(3);
  });
});

describe('validateVote', () => {
  it('accepts valid card', () => {
    expect(validateVote('5', DECKS.fibonacci)).toBe(true);
  });

  it('rejects invalid card', () => {
    expect(validateVote('99', DECKS.fibonacci)).toBe(false);
  });

  it('accepts ☕ card', () => {
    expect(validateVote('☕', DECKS.fibonacci)).toBe(true);
  });
});

describe('deriveHostPeerId', () => {
  it('returns peer with lowest joinedAt', () => {
    const participants = {
      alice: { joinedAt: 1000 },
      bob: { joinedAt: 500 },
      carol: { joinedAt: 2000 },
    };
    expect(deriveHostPeerId(participants)).toBe('bob');
  });

  it('returns null for empty participants', () => {
    expect(deriveHostPeerId({})).toBeNull();
  });
});

describe('computeTimerRemaining', () => {
  it('returns durationMs when not started', () => {
    const timer = { durationMs: 60_000, startedAt: null, isPaused: false };
    expect(computeTimerRemaining(timer)).toBe(60_000);
  });

  it('computes remaining time correctly', () => {
    const now = Date.now();
    const timer = { durationMs: 60_000, startedAt: now - 10_000, isPaused: false };
    const remaining = computeTimerRemaining(timer, now);
    expect(remaining).toBe(50_000);
  });

  it('clamps to 0 when expired', () => {
    const now = Date.now();
    const timer = { durationMs: 5_000, startedAt: now - 10_000, isPaused: false };
    expect(computeTimerRemaining(timer, now)).toBe(0);
  });
});
