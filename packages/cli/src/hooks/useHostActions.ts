import { useCallback } from 'react';
import {
  getCurrentRoundMap,
  getVotesMap,
  getTimerMap,
  generateRoundId,
  ROUND_PHASE_KEY,
  ROUND_DECK_KEY,
  ROUND_ID_KEY,
  ROUND_REVEALED_KEY,
  ROUND_ISSUE_KEY,
  TIMER_DURATION_KEY,
  TIMER_STARTED_KEY,
  TIMER_PAUSED_KEY,
  type DeckId,
} from '@pokerplanning/shared';
import { getSession } from '../store/session.js';

export function useHostActions() {
  const startVoting = useCallback((issueName?: string) => {
    const s = getSession();
    if (!s) return;
    s.doc.transact(() => {
      const round = getCurrentRoundMap(s.doc);
      const votes = getVotesMap(s.doc);
      round.set(ROUND_PHASE_KEY, 'voting');
      round.set(ROUND_ISSUE_KEY, issueName ?? null);
      votes.forEach((_, pid) => votes.delete(pid));
    });
  }, []);

  const reveal = useCallback(() => {
    const s = getSession();
    if (!s) return;
    s.doc.transact(() => {
      const round = getCurrentRoundMap(s.doc);
      round.set(ROUND_PHASE_KEY, 'revealed');
      round.set(ROUND_REVEALED_KEY, Date.now());
    });
  }, []);

  const resetRound = useCallback(() => {
    const s = getSession();
    if (!s) return;
    s.doc.transact(() => {
      const round = getCurrentRoundMap(s.doc);
      const votes = getVotesMap(s.doc);
      const timer = getTimerMap(s.doc);
      round.set(ROUND_ID_KEY, generateRoundId());
      round.set(ROUND_PHASE_KEY, 'voting');
      round.set(ROUND_REVEALED_KEY, null);
      round.set(ROUND_ISSUE_KEY, null);
      votes.forEach((_, pid) => votes.delete(pid));
      timer.set(TIMER_STARTED_KEY, null);
      timer.set(TIMER_PAUSED_KEY, false);
    });
  }, []);

  const startTimer = useCallback(() => {
    const s = getSession();
    if (!s) return;
    s.doc.transact(() => {
      const timer = getTimerMap(s.doc);
      timer.set(TIMER_STARTED_KEY, Date.now());
      timer.set(TIMER_PAUSED_KEY, false);
    });
  }, []);

  const setDeck = useCallback((deckId: DeckId) => {
    const s = getSession();
    if (!s) return;
    s.doc.transact(() => {
      const round = getCurrentRoundMap(s.doc);
      const votes = getVotesMap(s.doc);
      round.set(ROUND_DECK_KEY, deckId);
      votes.forEach((_, pid) => votes.delete(pid));
    });
  }, []);

  const setTimerDuration = useCallback((ms: number) => {
    const s = getSession();
    if (!s) return;
    s.doc.transact(() => {
      const timer = getTimerMap(s.doc);
      timer.set(TIMER_DURATION_KEY, ms);
      timer.set(TIMER_STARTED_KEY, null);
    });
  }, []);

  return { startVoting, reveal, resetRound, startTimer, setDeck, setTimerDuration };
}
