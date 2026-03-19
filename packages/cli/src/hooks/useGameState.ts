import { useState, useEffect } from 'react';
import {
  readParticipants,
  readCurrentRound,
  getHostPeerId,
  getRootMap,
  type RoomState,
} from '@pokerplanning/shared';
import { getSession } from '../store/session.js';

function buildState(roomId: string): RoomState | null {
  const s = getSession();
  if (!s) return null;
  return {
    roomId,
    participants: readParticipants(s.doc),
    currentRound: readCurrentRound(s.doc),
    hostPeerId: getHostPeerId(s.doc) ?? '',
  };
}

export function useGameState(roomId: string): RoomState | null {
  const [state, setState] = useState<RoomState | null>(() => buildState(roomId));

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
