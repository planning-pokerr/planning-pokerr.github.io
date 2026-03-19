// src/decks.ts
var DECKS = {
  fibonacci: {
    id: "fibonacci",
    name: "Fibonacci",
    cards: ["0", "1", "2", "3", "5", "8", "13", "21", "34", "55", "89", "?", "\u2615"],
    isNumeric: true
  },
  tshirt: {
    id: "tshirt",
    name: "T-Shirt",
    cards: ["XS", "S", "M", "L", "XL", "XXL", "?", "\u2615"],
    isNumeric: false
  },
  "powers-of-2": {
    id: "powers-of-2",
    name: "Powers of 2",
    cards: ["1", "2", "4", "8", "16", "32", "64", "?", "\u2615"],
    isNumeric: true
  },
  custom: {
    id: "custom",
    name: "Custom",
    cards: [],
    isNumeric: false
    // updated by host at creation time
  }
};
function getDeck(deckId, customCards) {
  const deck = DECKS[deckId];
  if (deckId === "custom" && customCards) {
    const numericCards = customCards.filter((c) => !isNaN(Number(c)));
    return {
      ...deck,
      cards: customCards,
      isNumeric: numericCards.length > 0 && numericCards.length === customCards.filter((c) => c !== "?" && c !== "\u2615").length
    };
  }
  return deck;
}

// src/game-logic.ts
import { nanoid } from "nanoid";
function generateRoomId() {
  return nanoid(8).toUpperCase();
}
function generateRoundId() {
  return nanoid(12);
}
function createInitialTimer() {
  return { durationMs: 6e4, startedAt: null, isPaused: false };
}
function createInitialRound(deckId) {
  return {
    id: generateRoundId(),
    issueName: null,
    phase: "waiting",
    deckId,
    votes: {},
    timer: createInitialTimer(),
    revealedAt: null
  };
}
function validateVote(card, deck) {
  return deck.cards.includes(card);
}
function computeStats(votes, deck) {
  const cast = votes.filter((v) => v.card !== null && v.card !== "?" && v.card !== "\u2615");
  const distribution = {};
  for (const v of votes) {
    if (v.card !== null) {
      distribution[v.card] = (distribution[v.card] ?? 0) + 1;
    }
  }
  const totalVotes = Object.keys(distribution).reduce((sum, k) => sum + (distribution[k] ?? 0), 0);
  const maxCount = Math.max(0, ...Object.values(distribution));
  const consensusPercent = totalVotes > 0 ? Math.round(maxCount / totalVotes * 100) : 0;
  if (!deck.isNumeric || cast.length === 0) {
    const allCards = votes.filter((v) => v.card !== null).map((v) => v.card);
    return {
      average: null,
      median: null,
      min: allCards.length > 0 ? allCards[0] : null,
      max: allCards.length > 0 ? allCards[allCards.length - 1] : null,
      consensusPercent,
      distribution,
      totalVotes
    };
  }
  const nums = cast.map((v) => Number(v.card)).sort((a, b) => a - b);
  const average = Math.round(nums.reduce((s, n) => s + n, 0) / nums.length * 10) / 10;
  const mid = Math.floor(nums.length / 2);
  const median = nums.length % 2 === 0 ? Math.round((nums[mid - 1] + nums[mid]) / 2 * 10) / 10 : nums[mid];
  const numericCards = cast.map((v) => v.card);
  return {
    average,
    median,
    min: numericCards[0] ?? null,
    max: numericCards[numericCards.length - 1] ?? null,
    consensusPercent,
    distribution,
    totalVotes
  };
}
function computeTimerRemaining(timer, now = Date.now()) {
  if (timer.startedAt === null || timer.isPaused) return timer.durationMs;
  return Math.max(0, timer.startedAt + timer.durationMs - now);
}
function deriveHostPeerId(participants) {
  const sorted = Object.entries(participants).sort(([, a], [, b]) => a.joinedAt - b.joinedAt);
  return sorted[0]?.[0] ?? null;
}

// src/state-machine.ts
function transition(phase, event) {
  switch (phase) {
    case "waiting":
      if (event === "START_VOTING") return "voting";
      return phase;
    case "voting":
      if (event === "REVEAL" || event === "TIMER_EXPIRE") return "revealed";
      return phase;
    case "revealed":
      if (event === "RESET_ROUND") return "voting";
      return phase;
  }
}
function canVote(phase) {
  return phase === "voting";
}
function isRevealed(phase) {
  return phase === "revealed";
}

// src/p2p/messages.ts
function isHostActionMessage(msg) {
  return msg.type === "HOST_ACTION";
}
function isPeerHelloMessage(msg) {
  return msg.type === "PEER_HELLO";
}
function isTimerSyncMessage(msg) {
  return msg.type === "TIMER_SYNC";
}

// src/p2p/room.ts
import * as Y from "yjs";
import { nanoid as nanoid2 } from "nanoid";
var APP_ID = "pokerplanning-v1";
var NOSTR_RELAY_URLS = [
  "wss://relay.damus.io",
  "wss://relay.nostr.band",
  "wss://nos.lol"
];
var ROOT_KEY = "root";
var ROOM_ID_KEY = "roomId";
var PARTICIPANTS_KEY = "participants";
var CURRENT_ROUND_KEY = "currentRound";
var ROUND_ID_KEY = "id";
var ROUND_ISSUE_KEY = "issueName";
var ROUND_PHASE_KEY = "phase";
var ROUND_DECK_KEY = "deckId";
var ROUND_VOTES_KEY = "votes";
var ROUND_TIMER_KEY = "timer";
var ROUND_REVEALED_KEY = "revealedAt";
var TIMER_DURATION_KEY = "durationMs";
var TIMER_STARTED_KEY = "startedAt";
var TIMER_PAUSED_KEY = "isPaused";
function getRootMap(doc) {
  return doc.getMap(ROOT_KEY);
}
function getParticipantsMap(doc) {
  const root = getRootMap(doc);
  if (!root.has(PARTICIPANTS_KEY)) {
    root.set(PARTICIPANTS_KEY, new Y.Map());
  }
  return root.get(PARTICIPANTS_KEY);
}
function getCurrentRoundMap(doc) {
  const root = getRootMap(doc);
  if (!root.has(CURRENT_ROUND_KEY)) {
    root.set(CURRENT_ROUND_KEY, new Y.Map());
  }
  return root.get(CURRENT_ROUND_KEY);
}
function getVotesMap(doc) {
  const roundMap = getCurrentRoundMap(doc);
  if (!roundMap.has(ROUND_VOTES_KEY)) {
    roundMap.set(ROUND_VOTES_KEY, new Y.Map());
  }
  return roundMap.get(ROUND_VOTES_KEY);
}
function getTimerMap(doc) {
  const roundMap = getCurrentRoundMap(doc);
  if (!roundMap.has(ROUND_TIMER_KEY)) {
    roundMap.set(ROUND_TIMER_KEY, new Y.Map());
  }
  return roundMap.get(ROUND_TIMER_KEY);
}
function initDoc(doc, roomId, deckId) {
  const root = getRootMap(doc);
  const initialRound = createInitialRound(deckId);
  doc.transact(() => {
    root.set(ROOM_ID_KEY, roomId);
    root.set(PARTICIPANTS_KEY, new Y.Map());
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
function addParticipant(doc, participant) {
  const participants = getParticipantsMap(doc);
  const pMap = new Y.Map();
  pMap.set("peerId", participant.peerId);
  pMap.set("name", participant.name);
  pMap.set("joinedAt", participant.joinedAt);
  participants.set(participant.peerId, pMap);
}
function removeParticipant(doc, peerId) {
  const participants = getParticipantsMap(doc);
  participants.delete(peerId);
  const votes = getVotesMap(doc);
  votes.delete(peerId);
}
function readParticipants(doc) {
  const root = getRootMap(doc);
  if (!root.has(PARTICIPANTS_KEY)) return {};
  const participants = root.get(PARTICIPANTS_KEY);
  const result = {};
  participants.forEach((pMap, peerId) => {
    result[peerId] = {
      peerId,
      name: pMap.get("name"),
      joinedAt: pMap.get("joinedAt")
    };
  });
  return result;
}
function readTimerState(doc) {
  const root = getRootMap(doc);
  const roundMap = root.get(CURRENT_ROUND_KEY);
  const timerMap = roundMap?.get(ROUND_TIMER_KEY);
  return {
    durationMs: timerMap?.get(TIMER_DURATION_KEY) ?? 6e4,
    startedAt: timerMap?.get(TIMER_STARTED_KEY) ?? null,
    isPaused: timerMap?.get(TIMER_PAUSED_KEY) ?? false
  };
}
function readCurrentRound(doc) {
  const root = getRootMap(doc);
  if (!root.has(CURRENT_ROUND_KEY)) {
    return {
      id: "",
      issueName: null,
      phase: "waiting",
      deckId: "fibonacci",
      votes: {},
      timer: { durationMs: 6e4, startedAt: null, isPaused: false },
      revealedAt: null
    };
  }
  const roundMap = root.get(CURRENT_ROUND_KEY);
  const votesMap = roundMap.get(ROUND_VOTES_KEY);
  const timerMap = roundMap.get(ROUND_TIMER_KEY);
  const votes = {};
  votesMap?.forEach((vMap, peerId) => {
    votes[peerId] = {
      peerId,
      card: vMap.get("card") ?? null,
      submittedAt: vMap.get("submittedAt") ?? null
    };
  });
  return {
    id: roundMap.get(ROUND_ID_KEY) ?? nanoid2(12),
    issueName: roundMap.get(ROUND_ISSUE_KEY) ?? null,
    phase: roundMap.get(ROUND_PHASE_KEY) ?? "waiting",
    deckId: roundMap.get(ROUND_DECK_KEY) ?? "fibonacci",
    votes,
    timer: {
      durationMs: timerMap?.get(TIMER_DURATION_KEY) ?? 6e4,
      startedAt: timerMap?.get(TIMER_STARTED_KEY) ?? null,
      isPaused: timerMap?.get(TIMER_PAUSED_KEY) ?? false
    },
    revealedAt: roundMap.get(ROUND_REVEALED_KEY) ?? null
  };
}
function generateSelfPeerId() {
  return nanoid2(16);
}
function getHostPeerId(doc) {
  const participants = readParticipants(doc);
  return deriveHostPeerId(participants);
}
function createRoomId() {
  return generateRoomId();
}

// src/p2p/trystero-provider.ts
import * as Y2 from "yjs";
var TrysteroYjsProvider = class {
  onSync;
  doc;
  room;
  sendUpdate;
  isDestroyed = false;
  synced = false;
  constructor({ doc, room }) {
    this.doc = doc;
    this.room = room;
    const [sendUpdate, receiveUpdate] = room.makeAction("yjs-update");
    this.sendUpdate = sendUpdate;
    this.doc.on("update", this.handleLocalUpdate);
    receiveUpdate((update, _peerId) => {
      if (this.isDestroyed) return;
      Y2.applyUpdate(this.doc, update);
      if (!this.synced) {
        this.synced = true;
        this.onSync?.();
      }
    });
    room.onPeerJoin((peerId) => {
      if (this.isDestroyed) return;
      const fullState = Y2.encodeStateAsUpdate(this.doc);
      sendUpdate(fullState, peerId);
    });
  }
  handleLocalUpdate = (update, origin) => {
    if (origin === "remote" || this.isDestroyed) return;
    this.sendUpdate(update);
  };
  destroy() {
    this.isDestroyed = true;
    this.doc.off("update", this.handleLocalUpdate);
  }
};
export {
  APP_ID,
  CURRENT_ROUND_KEY,
  DECKS,
  NOSTR_RELAY_URLS,
  PARTICIPANTS_KEY,
  ROOM_ID_KEY,
  ROOT_KEY,
  ROUND_DECK_KEY,
  ROUND_ID_KEY,
  ROUND_ISSUE_KEY,
  ROUND_PHASE_KEY,
  ROUND_REVEALED_KEY,
  ROUND_TIMER_KEY,
  ROUND_VOTES_KEY,
  TIMER_DURATION_KEY,
  TIMER_PAUSED_KEY,
  TIMER_STARTED_KEY,
  TrysteroYjsProvider,
  addParticipant,
  canVote,
  computeStats,
  computeTimerRemaining,
  createInitialRound,
  createInitialTimer,
  createRoomId,
  deriveHostPeerId,
  generateRoomId,
  generateRoundId,
  generateSelfPeerId,
  getCurrentRoundMap,
  getDeck,
  getHostPeerId,
  getParticipantsMap,
  getRootMap,
  getTimerMap,
  getVotesMap,
  initDoc,
  isHostActionMessage,
  isPeerHelloMessage,
  isRevealed,
  isTimerSyncMessage,
  readCurrentRound,
  readParticipants,
  readTimerState,
  removeParticipant,
  transition,
  validateVote
};
//# sourceMappingURL=index.js.map