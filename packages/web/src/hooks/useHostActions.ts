import { useCallback } from 'react';
import { generateRoundId } from '@pokerplanning/shared';
import {
  getCurrentRoundMap,
  getVotesMap,
  getTimerMap,
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
import { getSession } from '../store/yjsStore.js';

export function useHostActions() {
  const startVoting = useCallback((issueName?: string) => {
    const session = getSession();
    if (!session) return;
    const { doc } = session;
    doc.transact(() => {
      const round = getCurrentRoundMap(doc);
      const votes = getVotesMap(doc);
      round.set(ROUND_PHASE_KEY, 'voting');
      round.set(ROUND_ISSUE_KEY, issueName ?? null);
      // Clear votes
      votes.forEach((_, peerId) => votes.delete(peerId));
    });
  }, []);

  const reveal = useCallback(() => {
    const session = getSession();
    if (!session) return;
    const { doc } = session;
    doc.transact(() => {
      const round = getCurrentRoundMap(doc);
      round.set(ROUND_PHASE_KEY, 'revealed');
      round.set(ROUND_REVEALED_KEY, Date.now());
    });
  }, []);

  const resetRound = useCallback((issueName?: string) => {
    const session = getSession();
    if (!session) return;
    const { doc } = session;
    doc.transact(() => {
      const round = getCurrentRoundMap(doc);
      const votes = getVotesMap(doc);
      const timer = getTimerMap(doc);

      round.set(ROUND_ID_KEY, generateRoundId());
      round.set(ROUND_PHASE_KEY, 'voting');
      round.set(ROUND_REVEALED_KEY, null);
      round.set(ROUND_ISSUE_KEY, issueName ?? null);

      // Clear votes
      votes.forEach((_, peerId) => votes.delete(peerId));

      // Reset timer
      timer.set(TIMER_STARTED_KEY, null);
      timer.set(TIMER_PAUSED_KEY, false);
    });
  }, []);

  const setDeck = useCallback((deckId: DeckId) => {
    const session = getSession();
    if (!session) return;
    const { doc } = session;
    doc.transact(() => {
      const round = getCurrentRoundMap(doc);
      const votes = getVotesMap(doc);
      round.set(ROUND_DECK_KEY, deckId);
      votes.forEach((_, peerId) => votes.delete(peerId));
    });
  }, []);

  const setTimerDuration = useCallback((ms: number) => {
    const session = getSession();
    if (!session) return;
    const { doc } = session;
    doc.transact(() => {
      const timer = getTimerMap(doc);
      timer.set(TIMER_DURATION_KEY, ms);
      timer.set(TIMER_STARTED_KEY, null);
      timer.set(TIMER_PAUSED_KEY, false);
    });
  }, []);

  const startTimer = useCallback(() => {
    const session = getSession();
    if (!session) return;
    const { doc } = session;
    doc.transact(() => {
      const timer = getTimerMap(doc);
      timer.set(TIMER_STARTED_KEY, Date.now());
      timer.set(TIMER_PAUSED_KEY, false);
    });
  }, []);

  const pauseTimer = useCallback(() => {
    const session = getSession();
    if (!session) return;
    const { doc } = session;
    doc.transact(() => {
      const timer = getTimerMap(doc);
      timer.set(TIMER_PAUSED_KEY, true);
    });
  }, []);

  return { startVoting, reveal, resetRound, setDeck, setTimerDuration, startTimer, pauseTimer };
}
