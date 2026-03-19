import * as Y from 'yjs';
import { nanoid } from 'nanoid';
import { generateRoomId, createInitialRound, deriveHostPeerId } from '../game-logic.js';
import type { DeckId, Participant, Round, TimerState } from '../types.js';

export const APP_ID = 'pokerplanning-v1';

export const NOSTR_RELAY_URLS = [
  'wss://relay.damus.io',
  'wss://relay.nostr.band',
  'wss://nos.lol',
];

// ─── Yjs Map Keys ─────────────────────────────────────────────────────────────

export const ROOT_KEY = 'root';
export const ROOM_ID_KEY = 'roomId';
export const PARTICIPANTS_KEY = 'participants';
export const CURRENT_ROUND_KEY = 'currentRound';

export const ROUND_ID_KEY = 'id';
export const ROUND_ISSUE_KEY = 'issueName';
export const ROUND_PHASE_KEY = 'phase';
export const ROUND_DECK_KEY = 'deckId';
export const ROUND_VOTES_KEY = 'votes';
export const ROUND_TIMER_KEY = 'timer';
export const ROUND_REVEALED_KEY = 'revealedAt';

export const TIMER_DURATION_KEY = 'durationMs';
export const TIMER_STARTED_KEY = 'startedAt';
export const TIMER_PAUSED_KEY = 'isPaused';

// ─── Yjs Document Accessors ───────────────────────────────────────────────────

export function getRootMap(doc: Y.Doc): Y.Map<unknown> {
  return doc.getMap(ROOT_KEY);
}

export function getParticipantsMap(doc: Y.Doc): Y.Map<Y.Map<unknown>> {
  const root = getRootMap(doc);
  if (!root.has(PARTICIPANTS_KEY)) {
    root.set(PARTICIPANTS_KEY, new Y.Map());
  }
  return root.get(PARTICIPANTS_KEY) as Y.Map<Y.Map<unknown>>;
}

export function getCurrentRoundMap(doc: Y.Doc): Y.Map<unknown> {
  const root = getRootMap(doc);
  if (!root.has(CURRENT_ROUND_KEY)) {
    root.set(CURRENT_ROUND_KEY, new Y.Map());
  }
  return root.get(CURRENT_ROUND_KEY) as Y.Map<unknown>;
}

export function getVotesMap(doc: Y.Doc): Y.Map<Y.Map<unknown>> {
  const roundMap = getCurrentRoundMap(doc);
  if (!roundMap.has(ROUND_VOTES_KEY)) {
    roundMap.set(ROUND_VOTES_KEY, new Y.Map());
  }
  return roundMap.get(ROUND_VOTES_KEY) as Y.Map<Y.Map<unknown>>;
}

export function getTimerMap(doc: Y.Doc): Y.Map<unknown> {
  const roundMap = getCurrentRoundMap(doc);
  if (!roundMap.has(ROUND_TIMER_KEY)) {
    roundMap.set(ROUND_TIMER_KEY, new Y.Map());
  }
  return roundMap.get(ROUND_TIMER_KEY) as Y.Map<unknown>;
}

// ─── Yjs Document Initializer ─────────────────────────────────────────────────

export function initDoc(doc: Y.Doc, roomId: string, deckId: DeckId): void {
  const root = getRootMap(doc);
  const initialRound = createInitialRound(deckId);

  doc.transact(() => {
    root.set(ROOM_ID_KEY, roomId);

    // Participants map (empty initially)
    root.set(PARTICIPANTS_KEY, new Y.Map());

    // Current round
    const roundMap = new Y.Map();
    roundMap.set(ROUND_ID_KEY, initialRound.id);
    roundMap.set(ROUND_ISSUE_KEY, null);
    roundMap.set(ROUND_PHASE_KEY, initialRound.phase);
    roundMap.set(ROUND_DECK_KEY, deckId);
    roundMap.set(ROUND_REVEALED_KEY, null);

    const votesMap = new Y.Map();
    roundMap.set(ROUND_VOTES_KEY, votesMap);

    const timerMap = new Y.Map();
    timerMap.set(TIMER_DURATION_KEY, initialRound.timer.durationMs);
    timerMap.set(TIMER_STARTED_KEY, null);
    timerMap.set(TIMER_PAUSED_KEY, false);
    roundMap.set(ROUND_TIMER_KEY, timerMap);

    root.set(CURRENT_ROUND_KEY, roundMap);
  });
}

export function addParticipant(doc: Y.Doc, participant: Participant): void {
  const participants = getParticipantsMap(doc);
  const pMap = new Y.Map();
  pMap.set('peerId', participant.peerId);
  pMap.set('name', participant.name);
  pMap.set('joinedAt', participant.joinedAt);
  participants.set(participant.peerId, pMap);
}

export function removeParticipant(doc: Y.Doc, peerId: string): void {
  const participants = getParticipantsMap(doc);
  participants.delete(peerId);
  // Also remove their vote
  const votes = getVotesMap(doc);
  votes.delete(peerId);
}

// ─── Read Helpers (Yjs → Plain TS) ───────────────────────────────────────────

export function readParticipants(doc: Y.Doc): Record<string, Participant> {
  const root = getRootMap(doc);
  if (!root.has(PARTICIPANTS_KEY)) return {};
  const participants = root.get(PARTICIPANTS_KEY) as Y.Map<Y.Map<unknown>>;
  const result: Record<string, Participant> = {};
  participants.forEach((pMap, peerId) => {
    result[peerId] = {
      peerId,
      name: pMap.get('name') as string,
      joinedAt: pMap.get('joinedAt') as number,
    };
  });
  return result;
}

export function readTimerState(doc: Y.Doc): TimerState {
  const root = getRootMap(doc);
  const roundMap = root.get(CURRENT_ROUND_KEY) as Y.Map<unknown> | undefined;
  const timerMap = roundMap?.get(ROUND_TIMER_KEY) as Y.Map<unknown> | undefined;
  return {
    durationMs: (timerMap?.get(TIMER_DURATION_KEY) as number | undefined) ?? 60_000,
    startedAt: (timerMap?.get(TIMER_STARTED_KEY) as number | null | undefined) ?? null,
    isPaused: (timerMap?.get(TIMER_PAUSED_KEY) as boolean | undefined) ?? false,
  };
}

export function readCurrentRound(doc: Y.Doc): Round {
  const root = getRootMap(doc);
  if (!root.has(CURRENT_ROUND_KEY)) {
    return {
      id: '',
      issueName: null,
      phase: 'waiting',
      deckId: 'fibonacci',
      votes: {},
      timer: { durationMs: 60_000, startedAt: null, isPaused: false },
      revealedAt: null,
    };
  }

  const roundMap = root.get(CURRENT_ROUND_KEY) as Y.Map<unknown>;
  const votesMap = roundMap.get(ROUND_VOTES_KEY) as Y.Map<Y.Map<unknown>> | undefined;
  const timerMap = roundMap.get(ROUND_TIMER_KEY) as Y.Map<unknown> | undefined;

  const votes: Record<string, { peerId: string; card: string | null; submittedAt: number | null }> = {};
  votesMap?.forEach((vMap, peerId) => {
    votes[peerId] = {
      peerId,
      card: (vMap.get('card') as string | null | undefined) ?? null,
      submittedAt: (vMap.get('submittedAt') as number | null | undefined) ?? null,
    };
  });

  return {
    id: (roundMap.get(ROUND_ID_KEY) as string | undefined) ?? nanoid(12),
    issueName: (roundMap.get(ROUND_ISSUE_KEY) as string | null | undefined) ?? null,
    phase: ((roundMap.get(ROUND_PHASE_KEY) as string | undefined) ?? 'waiting') as Round['phase'],
    deckId: ((roundMap.get(ROUND_DECK_KEY) as string | undefined) ?? 'fibonacci') as DeckId,
    votes,
    timer: {
      durationMs: (timerMap?.get(TIMER_DURATION_KEY) as number | undefined) ?? 60_000,
      startedAt: (timerMap?.get(TIMER_STARTED_KEY) as number | null | undefined) ?? null,
      isPaused: (timerMap?.get(TIMER_PAUSED_KEY) as boolean | undefined) ?? false,
    },
    revealedAt: (roundMap.get(ROUND_REVEALED_KEY) as number | null | undefined) ?? null,
  };
}

// ─── generateSelfPeerId ────────────────────────────────────────────────────────

export function generateSelfPeerId(): string {
  return nanoid(16);
}

// ─── Host election ─────────────────────────────────────────────────────────────

export function getHostPeerId(doc: Y.Doc): string | null {
  const participants = readParticipants(doc);
  return deriveHostPeerId(participants);
}

// ─── Room creation helper ──────────────────────────────────────────────────────

export function createRoomId(): string {
  return generateRoomId();
}
