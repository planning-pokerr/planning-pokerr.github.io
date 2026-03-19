import { useState, useEffect } from 'react';
import * as Y from 'yjs';
import {
  readParticipants,
  readCurrentRound,
  getHostPeerId,
  getRootMap,
  type RoomState,
} from '@pokerplanning/shared';
import { getSession } from '../store/yjsStore.js';

function buildRoomState(doc: Y.Doc, roomId: string): RoomState {
  const participants = readParticipants(doc);
  const currentRound = readCurrentRound(doc);
  const hostPeerId = getHostPeerId(doc) ?? '';
  return { roomId, participants, hostPeerId, currentRound };
}

export function useGameState(roomId: string): RoomState | null {
  const session = getSession();
  const [state, setState] = useState<RoomState | null>(
    session ? buildRoomState(session.doc, roomId) : null,
  );

  useEffect(() => {
    const s = getSession();
    if (!s) return;

    const root = getRootMap(s.doc);
    const handler = () => {
      setState(buildRoomState(s.doc, roomId));
    };

    // Observe the entire root map and all nested maps
    root.observeDeep(handler);

    // Set initial state
    setState(buildRoomState(s.doc, roomId));

    return () => {
      root.unobserveDeep(handler);
    };
  }, [roomId]);

  return state;
}
