// ─── Primitives ───────────────────────────────────────────────────────────────

export type PeerId = string;
export type RoomId = string;
export type CardValue = string; // "1", "8", "XL", "?", "☕"

// ─── Decks ────────────────────────────────────────────────────────────────────

export type DeckId = 'fibonacci' | 'tshirt' | 'powers-of-2' | 'custom';

export interface Deck {
  id: DeckId;
  name: string;
  cards: CardValue[];
  isNumeric: boolean;
}

// ─── Game Phases ──────────────────────────────────────────────────────────────

export type GamePhase = 'waiting' | 'voting' | 'revealed';

// ─── Participants ─────────────────────────────────────────────────────────────

export interface Participant {
  peerId: PeerId;
  name: string;
  joinedAt: number; // epoch ms — used for deterministic host election
}

// ─── Votes ────────────────────────────────────────────────────────────────────

export interface Vote {
  peerId: PeerId;
  card: CardValue | null; // null = no vote yet
  submittedAt: number | null;
}

// ─── Timer ────────────────────────────────────────────────────────────────────

export interface TimerState {
  durationMs: number;
  startedAt: number | null; // epoch ms; null = not running
  isPaused: boolean;
}

// ─── Round ────────────────────────────────────────────────────────────────────

export interface Round {
  id: string;
  issueName: string | null;
  phase: GamePhase;
  deckId: DeckId;
  votes: Record<PeerId, Vote>;
  timer: TimerState;
  revealedAt: number | null;
}

// ─── Room State (full Yjs doc shape as plain TS) ──────────────────────────────

export interface RoomState {
  roomId: RoomId;
  participants: Record<PeerId, Participant>;
  hostPeerId: PeerId; // derived: oldest joinedAt
  currentRound: Round;
}

// ─── Statistics (computed locally, never stored in Yjs) ───────────────────────

export interface RoundStats {
  average: number | null; // null for non-numeric decks
  median: number | null;
  min: CardValue | null;
  max: CardValue | null;
  consensusPercent: number;
  distribution: Record<CardValue, number>;
  totalVotes: number;
}

// ─── P2P Message Types ────────────────────────────────────────────────────────

export interface HostActionMessage {
  type: 'HOST_ACTION';
  action: 'reveal' | 'reset' | 'set-deck' | 'start-voting' | 'start-timer' | 'pause-timer' | 'set-timer-duration';
  payload?: unknown;
}

export interface PeerHelloMessage {
  type: 'PEER_HELLO';
  name: string;
  joinedAt: number;
}

export interface TimerSyncMessage {
  type: 'TIMER_SYNC';
  startedAt: number;
  durationMs: number;
}

export type P2PMessage = HostActionMessage | PeerHelloMessage | TimerSyncMessage;
