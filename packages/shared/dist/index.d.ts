import * as Y from 'yjs';

type PeerId = string;
type RoomId = string;
type CardValue = string;
type DeckId = 'fibonacci' | 'tshirt' | 'powers-of-2' | 'custom';
interface Deck {
    id: DeckId;
    name: string;
    cards: CardValue[];
    isNumeric: boolean;
}
type GamePhase = 'waiting' | 'voting' | 'revealed';
interface Participant {
    peerId: PeerId;
    name: string;
    joinedAt: number;
}
interface Vote {
    peerId: PeerId;
    card: CardValue | null;
    submittedAt: number | null;
}
interface TimerState {
    durationMs: number;
    startedAt: number | null;
    isPaused: boolean;
}
interface Round {
    id: string;
    issueName: string | null;
    phase: GamePhase;
    deckId: DeckId;
    votes: Record<PeerId, Vote>;
    timer: TimerState;
    revealedAt: number | null;
}
interface RoomState {
    roomId: RoomId;
    participants: Record<PeerId, Participant>;
    hostPeerId: PeerId;
    currentRound: Round;
}
interface RoundStats {
    average: number | null;
    median: number | null;
    min: CardValue | null;
    max: CardValue | null;
    consensusPercent: number;
    distribution: Record<CardValue, number>;
    totalVotes: number;
}
interface HostActionMessage {
    type: 'HOST_ACTION';
    action: 'reveal' | 'reset' | 'set-deck' | 'start-voting' | 'start-timer' | 'pause-timer' | 'set-timer-duration';
    payload?: unknown;
}
interface PeerHelloMessage {
    type: 'PEER_HELLO';
    name: string;
    joinedAt: number;
}
interface TimerSyncMessage {
    type: 'TIMER_SYNC';
    startedAt: number;
    durationMs: number;
}
type P2PMessage = HostActionMessage | PeerHelloMessage | TimerSyncMessage;

declare const DECKS: Record<DeckId, Deck>;
declare function getDeck(deckId: DeckId, customCards?: string[]): Deck;

declare function generateRoomId(): string;
declare function generateRoundId(): string;
declare function createInitialTimer(): TimerState;
declare function createInitialRound(deckId: Round['deckId']): Round;
declare function validateVote(card: CardValue, deck: Deck): boolean;
declare function computeStats(votes: Vote[], deck: Deck): RoundStats;
declare function computeTimerRemaining(timer: TimerState, now?: number): number;
declare function deriveHostPeerId(participants: Record<string, {
    joinedAt: number;
}>): string | null;

type GameEvent = 'START_VOTING' | 'REVEAL' | 'RESET_ROUND' | 'TIMER_EXPIRE';
declare function transition(phase: GamePhase, event: GameEvent): GamePhase;
declare function canVote(phase: GamePhase): boolean;
declare function isRevealed(phase: GamePhase): boolean;

declare function isHostActionMessage(msg: P2PMessage): msg is Extract<P2PMessage, {
    type: 'HOST_ACTION';
}>;
declare function isPeerHelloMessage(msg: P2PMessage): msg is Extract<P2PMessage, {
    type: 'PEER_HELLO';
}>;
declare function isTimerSyncMessage(msg: P2PMessage): msg is Extract<P2PMessage, {
    type: 'TIMER_SYNC';
}>;

declare const APP_ID = "pokerplanning-v1";
declare const NOSTR_RELAY_URLS: string[];
declare const ROOT_KEY = "root";
declare const ROOM_ID_KEY = "roomId";
declare const PARTICIPANTS_KEY = "participants";
declare const CURRENT_ROUND_KEY = "currentRound";
declare const ROUND_ID_KEY = "id";
declare const ROUND_ISSUE_KEY = "issueName";
declare const ROUND_PHASE_KEY = "phase";
declare const ROUND_DECK_KEY = "deckId";
declare const ROUND_VOTES_KEY = "votes";
declare const ROUND_TIMER_KEY = "timer";
declare const ROUND_REVEALED_KEY = "revealedAt";
declare const TIMER_DURATION_KEY = "durationMs";
declare const TIMER_STARTED_KEY = "startedAt";
declare const TIMER_PAUSED_KEY = "isPaused";
declare function getRootMap(doc: Y.Doc): Y.Map<unknown>;
declare function getParticipantsMap(doc: Y.Doc): Y.Map<Y.Map<unknown>>;
declare function getCurrentRoundMap(doc: Y.Doc): Y.Map<unknown>;
declare function getVotesMap(doc: Y.Doc): Y.Map<Y.Map<unknown>>;
declare function getTimerMap(doc: Y.Doc): Y.Map<unknown>;
declare function initDoc(doc: Y.Doc, roomId: string, deckId: DeckId): void;
declare function addParticipant(doc: Y.Doc, participant: Participant): void;
declare function removeParticipant(doc: Y.Doc, peerId: string): void;
declare function readParticipants(doc: Y.Doc): Record<string, Participant>;
declare function readTimerState(doc: Y.Doc): TimerState;
declare function readCurrentRound(doc: Y.Doc): Round;
declare function generateSelfPeerId(): string;
declare function getHostPeerId(doc: Y.Doc): string | null;
declare function createRoomId(): string;

interface TrysteroRoom {
    makeAction: <T>(label: string) => [any, any, ...any[]];
    onPeerJoin: (handler: (peerId: string) => void) => void;
    onPeerLeave: (handler: (peerId: string) => void) => void;
}
interface TrysteroYjsProviderOptions {
    doc: Y.Doc;
    room: TrysteroRoom;
}
/**
 * Bridges a Yjs Y.Doc and a Trystero Room.
 * - Encodes local Yjs updates as Uint8Array and broadcasts them via Trystero.
 * - Applies incoming Uint8Array updates from peers to the local Y.Doc.
 * - Sends full state to newly joined peers so they catch up immediately.
 */
declare class TrysteroYjsProvider {
    onSync?: () => void;
    private doc;
    private room;
    private sendUpdate;
    private isDestroyed;
    private synced;
    constructor({ doc, room }: TrysteroYjsProviderOptions);
    private handleLocalUpdate;
    destroy(): void;
}

export { APP_ID, CURRENT_ROUND_KEY, type CardValue, DECKS, type Deck, type DeckId, type GameEvent, type GamePhase, type HostActionMessage, NOSTR_RELAY_URLS, type P2PMessage, PARTICIPANTS_KEY, type Participant, type PeerHelloMessage, type PeerId, ROOM_ID_KEY, ROOT_KEY, ROUND_DECK_KEY, ROUND_ID_KEY, ROUND_ISSUE_KEY, ROUND_PHASE_KEY, ROUND_REVEALED_KEY, ROUND_TIMER_KEY, ROUND_VOTES_KEY, type RoomId, type RoomState, type Round, type RoundStats, TIMER_DURATION_KEY, TIMER_PAUSED_KEY, TIMER_STARTED_KEY, type TimerState, type TimerSyncMessage, type TrysteroRoom, TrysteroYjsProvider, type TrysteroYjsProviderOptions, type Vote, addParticipant, canVote, computeStats, computeTimerRemaining, createInitialRound, createInitialTimer, createRoomId, deriveHostPeerId, generateRoomId, generateRoundId, generateSelfPeerId, getCurrentRoundMap, getDeck, getHostPeerId, getParticipantsMap, getRootMap, getTimerMap, getVotesMap, initDoc, isHostActionMessage, isPeerHelloMessage, isRevealed, isTimerSyncMessage, readCurrentRound, readParticipants, readTimerState, removeParticipant, transition, validateVote };
