#!/usr/bin/env node

// src/index.tsx
import {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate
} from "werift";
import { render } from "ink";
import { Command } from "commander";

// src/App.tsx
import { useState as useState5 } from "react";

// src/components/LobbyView.tsx
import { useState } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import { DECKS } from "@pokerplanning/shared";

// src/store/session.ts
import * as Y from "yjs";
import {
  APP_ID,
  NOSTR_RELAY_URLS,
  TrysteroYjsProvider,
  initDoc,
  addParticipant,
  removeParticipant,
  generateSelfPeerId
} from "@pokerplanning/shared";
var current = null;
function getSession() {
  return current;
}
async function createCliSession(roomId, name, deckId, isCreating) {
  if (current) {
    current.destroy();
    current = null;
  }
  const { joinRoom } = await import("trystero/nostr");
  const selfPeerId = generateSelfPeerId();
  const doc = new Y.Doc();
  const room = joinRoom(
    { appId: APP_ID, relayUrls: NOSTR_RELAY_URLS },
    roomId
  );
  const provider = new TrysteroYjsProvider({ doc, room });
  if (isCreating) {
    initDoc(doc, roomId, deckId);
  }
  addParticipant(doc, {
    peerId: selfPeerId,
    name,
    joinedAt: Date.now()
  });
  room.onPeerLeave((peerId) => {
    removeParticipant(doc, peerId);
  });
  const destroy = () => {
    provider.destroy();
    doc.destroy();
    current = null;
  };
  current = { doc, provider, selfPeerId, roomId, room, destroy };
  return current;
}

// src/components/LobbyView.tsx
import { createRoomId } from "@pokerplanning/shared";
import { jsx, jsxs } from "react/jsx-runtime";
function LobbyView({ initialRoomId, onJoined }) {
  const [mode, setMode] = useState(initialRoomId ? "join" : "create");
  const [field, setField] = useState("mode");
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState(initialRoomId ?? "");
  const [deckIdx, setDeckIdx] = useState(0);
  const [error, setError] = useState(null);
  const deckIds = Object.keys(DECKS).filter((d) => d !== "custom");
  useInput((_input, key) => {
    if (field === "mode") {
      if (key.leftArrow || key.rightArrow || _input === "	") {
        setMode((m) => m === "create" ? "join" : "create");
      }
      if (key.return) setField("name");
    }
    if (field === "deck") {
      if (key.leftArrow) setDeckIdx((i) => Math.max(0, i - 1));
      if (key.rightArrow) setDeckIdx((i) => Math.min(deckIds.length - 1, i + 1));
      if (key.return) void handleSubmit();
    }
  });
  const handleSubmit = async () => {
    if (!name.trim()) {
      setField("name");
      return;
    }
    if (mode === "join" && !roomId.trim()) {
      setField("roomId");
      return;
    }
    setField("submitting");
    setError(null);
    try {
      const id = mode === "create" ? createRoomId() : roomId.trim().toUpperCase();
      await createCliSession(id, name.trim(), deckIds[deckIdx] ?? "fibonacci", mode === "create");
      onJoined(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
      setField("name");
    }
  };
  return /* @__PURE__ */ jsxs(Box, { flexDirection: "column", padding: 1, gap: 1, children: [
    /* @__PURE__ */ jsxs(Box, { children: [
      /* @__PURE__ */ jsx(Text, { bold: true, color: "cyan", children: "\u{1F0CF} Planning Poker CLI" }),
      /* @__PURE__ */ jsx(Text, { color: "gray", children: " \u2014 serverless P2P" })
    ] }),
    /* @__PURE__ */ jsxs(Box, { gap: 2, children: [
      /* @__PURE__ */ jsx(
        Text,
        {
          color: mode === "create" ? "green" : "gray",
          bold: mode === "create",
          children: mode === "create" ? "[\u25CF] Create Room" : "[ ] Create Room"
        }
      ),
      /* @__PURE__ */ jsx(
        Text,
        {
          color: mode === "join" ? "green" : "gray",
          bold: mode === "join",
          children: mode === "join" ? "[\u25CF] Join Room" : "[ ] Join Room"
        }
      ),
      field === "mode" && /* @__PURE__ */ jsx(Text, { color: "gray", children: " \u2190 \u2192 to switch, Enter to confirm" })
    ] }),
    field !== "mode" && /* @__PURE__ */ jsxs(Box, { gap: 1, children: [
      /* @__PURE__ */ jsx(Text, { color: "gray", children: "Name: " }),
      field === "name" ? /* @__PURE__ */ jsx(
        TextInput,
        {
          value: name,
          onChange: setName,
          onSubmit: () => {
            if (name.trim()) setField(mode === "join" ? "roomId" : "deck");
          }
        }
      ) : /* @__PURE__ */ jsx(Text, { color: "green", children: name })
    ] }),
    field !== "mode" && mode === "join" && /* @__PURE__ */ jsxs(Box, { gap: 1, children: [
      /* @__PURE__ */ jsx(Text, { color: "gray", children: "Room Code: " }),
      field === "roomId" ? /* @__PURE__ */ jsx(
        TextInput,
        {
          value: roomId,
          onChange: (v) => setRoomId(v.toUpperCase()),
          onSubmit: () => {
            if (roomId.trim()) setField("deck");
          }
        }
      ) : /* @__PURE__ */ jsx(Text, { color: "cyan", children: roomId })
    ] }),
    (field === "deck" || field === "submitting") && /* @__PURE__ */ jsxs(Box, { gap: 1, flexDirection: "column", children: [
      /* @__PURE__ */ jsx(Text, { color: "gray", children: "Deck:" }),
      /* @__PURE__ */ jsx(Box, { gap: 1, children: deckIds.map((id, i) => /* @__PURE__ */ jsx(
        Text,
        {
          color: i === deckIdx ? "cyan" : "gray",
          bold: i === deckIdx,
          children: i === deckIdx ? `[${DECKS[id].name}]` : DECKS[id].name
        },
        id
      )) }),
      field === "deck" && /* @__PURE__ */ jsx(Text, { color: "gray", children: "\u2190 \u2192 to pick, Enter to connect" })
    ] }),
    field === "submitting" && /* @__PURE__ */ jsx(Text, { color: "yellow", children: "Connecting\u2026" }),
    error && /* @__PURE__ */ jsx(Text, { color: "red", children: error })
  ] });
}

// src/components/RoomView.tsx
import { Box as Box5, Text as Text6, useInput as useInput3 } from "ink";
import { canVote } from "@pokerplanning/shared";

// src/hooks/useGameState.ts
import { useState as useState2, useEffect } from "react";
import {
  readParticipants,
  readCurrentRound,
  getHostPeerId,
  getRootMap
} from "@pokerplanning/shared";
function buildState(roomId) {
  const s = getSession();
  if (!s) return null;
  return {
    roomId,
    participants: readParticipants(s.doc),
    currentRound: readCurrentRound(s.doc),
    hostPeerId: getHostPeerId(s.doc) ?? ""
  };
}
function useGameState(roomId) {
  const [state, setState] = useState2(() => buildState(roomId));
  useEffect(() => {
    const s = getSession();
    if (!s) return;
    const root = getRootMap(s.doc);
    const handler = () => setState(buildState(roomId));
    root.observeDeep(handler);
    setState(buildState(roomId));
    return () => root.unobserveDeep(handler);
  }, [roomId]);
  return state;
}

// src/hooks/useHostActions.ts
import { useCallback } from "react";
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
  TIMER_PAUSED_KEY
} from "@pokerplanning/shared";
function useHostActions() {
  const startVoting = useCallback((issueName) => {
    const s = getSession();
    if (!s) return;
    s.doc.transact(() => {
      const round = getCurrentRoundMap(s.doc);
      const votes = getVotesMap(s.doc);
      round.set(ROUND_PHASE_KEY, "voting");
      round.set(ROUND_ISSUE_KEY, issueName ?? null);
      votes.forEach((_, pid) => votes.delete(pid));
    });
  }, []);
  const reveal = useCallback(() => {
    const s = getSession();
    if (!s) return;
    s.doc.transact(() => {
      const round = getCurrentRoundMap(s.doc);
      round.set(ROUND_PHASE_KEY, "revealed");
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
      round.set(ROUND_PHASE_KEY, "voting");
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
  const setDeck = useCallback((deckId) => {
    const s = getSession();
    if (!s) return;
    s.doc.transact(() => {
      const round = getCurrentRoundMap(s.doc);
      const votes = getVotesMap(s.doc);
      round.set(ROUND_DECK_KEY, deckId);
      votes.forEach((_, pid) => votes.delete(pid));
    });
  }, []);
  const setTimerDuration = useCallback((ms) => {
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

// src/components/ParticipantTable.tsx
import { Box as Box2, Text as Text2 } from "ink";
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
function ParticipantTable({ participants, round, hostPeerId, selfPeerId }) {
  const sorted = Object.values(participants).sort((a, b) => a.joinedAt - b.joinedAt);
  const isRevealed = round.phase === "revealed";
  return /* @__PURE__ */ jsx2(Box2, { flexDirection: "column", gap: 0, children: sorted.map((p) => {
    const vote = round.votes[p.peerId];
    const hasVoted = vote?.card !== null && vote?.card !== void 0;
    const isHost = p.peerId === hostPeerId;
    const isSelf = p.peerId === selfPeerId;
    let voteDisplay = "\u25CB";
    if (isRevealed && hasVoted) voteDisplay = vote.card ?? "\xB7";
    else if (hasVoted) voteDisplay = "\u2713";
    return /* @__PURE__ */ jsxs2(Box2, { gap: 2, children: [
      /* @__PURE__ */ jsx2(Text2, { color: isRevealed && hasVoted ? "cyan" : hasVoted ? "green" : "gray", children: voteDisplay.padEnd(4) }),
      /* @__PURE__ */ jsxs2(Text2, { color: isSelf ? "cyan" : "white", bold: isSelf, children: [
        isHost ? "\u{1F451} " : "   ",
        p.name,
        isSelf ? " (you)" : ""
      ] })
    ] }, p.peerId);
  }) });
}

// src/components/CardSelector.tsx
import { useState as useState3 } from "react";
import { Box as Box3, Text as Text3, useInput as useInput2 } from "ink";
import * as Y2 from "yjs";
import { getDeck, getVotesMap as getVotesMap2 } from "@pokerplanning/shared";
import { jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
function CardSelector({ deckId, selectedCard, canVote: canVote2, selfPeerId }) {
  const deck = getDeck(deckId);
  const [cursor, setCursor] = useState3(() => {
    const idx = selectedCard ? deck.cards.indexOf(selectedCard) : 0;
    return idx >= 0 ? idx : 0;
  });
  useInput2((_input, key) => {
    if (!canVote2) return;
    if (key.leftArrow) setCursor((c) => Math.max(0, c - 1));
    if (key.rightArrow) setCursor((c) => Math.min(deck.cards.length - 1, c + 1));
    if (key.return) {
      const card = deck.cards[cursor];
      if (!card) return;
      const session = getSession();
      if (!session) return;
      const { doc } = session;
      const votes = getVotesMap2(doc);
      doc.transact(() => {
        const toggle = card === selectedCard;
        let vMap = votes.get(selfPeerId);
        if (!vMap) {
          vMap = new Y2.Map();
          votes.set(selfPeerId, vMap);
        }
        vMap.set("card", toggle ? null : card);
        vMap.set("submittedAt", toggle ? null : Date.now());
      });
    }
  });
  if (!canVote2) {
    return /* @__PURE__ */ jsx3(Text3, { color: "gray", children: "Voting not open" });
  }
  return /* @__PURE__ */ jsxs3(Box3, { flexDirection: "column", gap: 0, children: [
    /* @__PURE__ */ jsx3(Text3, { color: "gray", children: "\u2190 \u2192 navigate  Enter to vote" }),
    /* @__PURE__ */ jsx3(Box3, { gap: 1, flexWrap: "wrap", children: deck.cards.map((card, i) => {
      const isCursor = i === cursor;
      const isSelected = card === selectedCard;
      return /* @__PURE__ */ jsx3(
        Text3,
        {
          color: isSelected ? "cyan" : isCursor ? "green" : "gray",
          bold: isCursor || isSelected,
          children: isCursor ? `[${card}]` : isSelected ? `(${card})` : ` ${card} `
        },
        card
      );
    }) })
  ] });
}

// src/components/TimerBar.tsx
import { useState as useState4, useEffect as useEffect2 } from "react";
import { Text as Text4 } from "ink";
import { computeTimerRemaining } from "@pokerplanning/shared";
import { jsxs as jsxs4 } from "react/jsx-runtime";
function fmt(ms) {
  const s = Math.ceil(ms / 1e3);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
function TimerBar({ timer, onExpire }) {
  const [remaining, setRemaining] = useState4(() => computeTimerRemaining(timer));
  useEffect2(() => {
    const r = computeTimerRemaining(timer);
    setRemaining(r);
    if (timer.startedAt === null || timer.isPaused || r === 0) return;
    const iv = setInterval(() => {
      const next = computeTimerRemaining(timer);
      setRemaining(next);
      if (next === 0) {
        clearInterval(iv);
        onExpire?.();
      }
    }, 500);
    return () => clearInterval(iv);
  }, [timer.startedAt, timer.durationMs, timer.isPaused]);
  if (timer.startedAt === null && remaining === timer.durationMs) return null;
  const urgent = remaining <= 1e4 && timer.startedAt !== null && !timer.isPaused;
  return /* @__PURE__ */ jsxs4(Text4, { color: urgent ? "red" : timer.isPaused ? "yellow" : "white", children: [
    timer.isPaused ? "\u23F8" : "\u23F1",
    " ",
    fmt(remaining)
  ] });
}

// src/components/RevealTable.tsx
import { Box as Box4, Text as Text5 } from "ink";
import { computeStats, getDeck as getDeck2 } from "@pokerplanning/shared";
import { jsx as jsx4, jsxs as jsxs5 } from "react/jsx-runtime";
function RevealTable({ round }) {
  const deck = getDeck2(round.deckId);
  const votes = Object.values(round.votes);
  const stats = computeStats(votes, deck);
  const entries = Object.entries(stats.distribution).sort(([a], [b]) => {
    const na = Number(a), nb = Number(b);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return a.localeCompare(b);
  });
  const maxCount = Math.max(...Object.values(stats.distribution));
  return /* @__PURE__ */ jsxs5(Box4, { flexDirection: "column", gap: 1, children: [
    /* @__PURE__ */ jsxs5(Box4, { gap: 4, children: [
      stats.average !== null && /* @__PURE__ */ jsxs5(Box4, { gap: 1, children: [
        /* @__PURE__ */ jsx4(Text5, { color: "gray", children: "Avg:" }),
        /* @__PURE__ */ jsx4(Text5, { color: "white", bold: true, children: stats.average })
      ] }),
      stats.median !== null && /* @__PURE__ */ jsxs5(Box4, { gap: 1, children: [
        /* @__PURE__ */ jsx4(Text5, { color: "gray", children: "Median:" }),
        /* @__PURE__ */ jsx4(Text5, { color: "cyan", bold: true, children: stats.median })
      ] }),
      /* @__PURE__ */ jsxs5(Box4, { gap: 1, children: [
        /* @__PURE__ */ jsx4(Text5, { color: "gray", children: "Consensus:" }),
        /* @__PURE__ */ jsxs5(Text5, { color: stats.consensusPercent >= 80 ? "green" : stats.consensusPercent >= 60 ? "yellow" : "red", bold: true, children: [
          stats.consensusPercent,
          "%"
        ] })
      ] }),
      /* @__PURE__ */ jsxs5(Box4, { gap: 1, children: [
        /* @__PURE__ */ jsx4(Text5, { color: "gray", children: "Votes:" }),
        /* @__PURE__ */ jsx4(Text5, { color: "white", children: stats.totalVotes })
      ] })
    ] }),
    entries.map(([card, count]) => {
      const bar = "\u2588".repeat(Math.round(count / maxCount * 20));
      return /* @__PURE__ */ jsxs5(Box4, { gap: 1, children: [
        /* @__PURE__ */ jsx4(Text5, { color: "gray", children: String(card).padEnd(4) }),
        /* @__PURE__ */ jsx4(Text5, { color: "cyan", children: bar }),
        /* @__PURE__ */ jsx4(Text5, { color: "white", children: count })
      ] }, card);
    })
  ] });
}

// src/components/RoomView.tsx
import { Fragment, jsx as jsx5, jsxs as jsxs6 } from "react/jsx-runtime";
function RoomView({ roomId, selfPeerId, onLeave }) {
  const state = useGameState(roomId);
  const { startVoting, reveal, resetRound, startTimer } = useHostActions();
  useInput3((_input, key) => {
    if (key.escape || _input === "q") {
      onLeave();
      return;
    }
    if (!state) return;
    const isHost2 = selfPeerId === state.hostPeerId;
    if (!isHost2) return;
    if (_input === "r" && state.currentRound.phase === "voting") reveal();
    if (_input === "n" && state.currentRound.phase === "revealed") resetRound();
    if (_input === "s" && state.currentRound.phase === "waiting") startVoting();
    if (_input === "t" && state.currentRound.phase === "voting") startTimer();
  });
  if (!state) {
    return /* @__PURE__ */ jsxs6(Text6, { color: "yellow", children: [
      "Connecting to room ",
      roomId,
      "\u2026"
    ] });
  }
  const { currentRound, participants, hostPeerId } = state;
  const isHost = selfPeerId === hostPeerId;
  const myVote = currentRound.votes[selfPeerId]?.card ?? null;
  const isVoting = canVote(currentRound.phase);
  const isRevealed = currentRound.phase === "revealed";
  const peerCount = Object.keys(participants).length;
  return /* @__PURE__ */ jsxs6(Box5, { flexDirection: "column", gap: 1, padding: 1, children: [
    /* @__PURE__ */ jsxs6(Box5, { gap: 3, children: [
      /* @__PURE__ */ jsxs6(Text6, { bold: true, color: "cyan", children: [
        "Room: ",
        /* @__PURE__ */ jsx5(Text6, { color: "white", children: roomId })
      ] }),
      /* @__PURE__ */ jsxs6(Text6, { color: "gray", children: [
        "Peers: ",
        peerCount
      ] }),
      /* @__PURE__ */ jsx5(
        TimerBar,
        {
          timer: currentRound.timer,
          onExpire: isHost && isVoting ? reveal : void 0
        }
      ),
      isHost && /* @__PURE__ */ jsx5(Text6, { color: "yellow", bold: true, children: "\u{1F451} HOST" })
    ] }),
    currentRound.issueName && /* @__PURE__ */ jsxs6(Text6, { color: "gray", children: [
      "Issue: ",
      /* @__PURE__ */ jsx5(Text6, { color: "white", children: currentRound.issueName })
    ] }),
    /* @__PURE__ */ jsxs6(Text6, { color: isVoting ? "green" : isRevealed ? "yellow" : "gray", children: [
      currentRound.phase === "waiting" && "\u25CE Waiting for host to start voting",
      currentRound.phase === "voting" && (myVote ? `\u2713 Voted: ${myVote}` : "\u25CF Voting open \u2014 pick a card"),
      currentRound.phase === "revealed" && "\u25C9 Cards revealed"
    ] }),
    /* @__PURE__ */ jsx5(Text6, { color: "gray", children: "\u2500".repeat(40) }),
    /* @__PURE__ */ jsx5(
      ParticipantTable,
      {
        participants,
        round: currentRound,
        hostPeerId,
        selfPeerId
      }
    ),
    isRevealed && /* @__PURE__ */ jsxs6(Fragment, { children: [
      /* @__PURE__ */ jsx5(Text6, { color: "gray", children: "\u2500".repeat(40) }),
      /* @__PURE__ */ jsx5(RevealTable, { round: currentRound })
    ] }),
    isVoting && /* @__PURE__ */ jsxs6(Fragment, { children: [
      /* @__PURE__ */ jsx5(Text6, { color: "gray", children: "\u2500".repeat(40) }),
      /* @__PURE__ */ jsx5(
        CardSelector,
        {
          deckId: currentRound.deckId,
          selectedCard: myVote,
          canVote: isVoting,
          selfPeerId
        }
      )
    ] }),
    /* @__PURE__ */ jsx5(Text6, { color: "gray", children: "\u2500".repeat(40) }),
    isHost ? /* @__PURE__ */ jsxs6(Box5, { gap: 3, flexWrap: "wrap", children: [
      currentRound.phase === "waiting" && /* @__PURE__ */ jsx5(Text6, { color: "gray", children: "[s] Start voting" }),
      currentRound.phase === "voting" && /* @__PURE__ */ jsx5(Text6, { color: "gray", children: "[r] Reveal  [t] Start timer" }),
      currentRound.phase === "revealed" && /* @__PURE__ */ jsx5(Text6, { color: "gray", children: "[n] New round" }),
      /* @__PURE__ */ jsx5(Text6, { color: "gray", children: "[q/Esc] Leave" })
    ] }) : /* @__PURE__ */ jsx5(Text6, { color: "gray", children: "[q/Esc] Leave" })
  ] });
}

// src/App.tsx
import { jsx as jsx6 } from "react/jsx-runtime";
function App({ initialRoomId }) {
  const [session, setSession] = useState5(null);
  const handleJoined = (roomId) => {
    const s = getSession();
    if (!s) return;
    setSession({ roomId, selfPeerId: s.selfPeerId });
  };
  const handleLeave = () => {
    getSession()?.destroy();
    setSession(null);
  };
  if (session) {
    return /* @__PURE__ */ jsx6(
      RoomView,
      {
        roomId: session.roomId,
        selfPeerId: session.selfPeerId,
        onLeave: handleLeave
      }
    );
  }
  return /* @__PURE__ */ jsx6(LobbyView, { initialRoomId, onJoined: handleJoined });
}

// src/index.tsx
import { jsx as jsx7 } from "react/jsx-runtime";
var g = globalThis;
g.RTCPeerConnection = RTCPeerConnection;
g.RTCSessionDescription = RTCSessionDescription;
g.RTCIceCandidate = RTCIceCandidate;
var program = new Command();
program.name("poker-plan").description("Planning Poker CLI \u2014 serverless P2P, interoperable with the web app").version("0.0.1");
program.command("join <roomCode>", { isDefault: false }).description("Join a room by code").action((roomCode) => {
  render(/* @__PURE__ */ jsx7(App, { initialRoomId: roomCode.toUpperCase() }));
});
program.command("create", { isDefault: false }).description("Create a new room").action(() => {
  render(/* @__PURE__ */ jsx7(App, {}));
});
program.argument("[roomCode]", "Optional room code to join directly").action((roomCode) => {
  render(/* @__PURE__ */ jsx7(App, { initialRoomId: roomCode?.toUpperCase() }));
});
program.parse();
//# sourceMappingURL=index.js.map