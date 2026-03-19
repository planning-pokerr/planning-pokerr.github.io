import { useState, useEffect, useCallback } from 'react';
import { createSession, getSession } from '../store/yjsStore.js';
import type { DeckId } from '@pokerplanning/shared';

export type RoomStatus = 'idle' | 'connecting' | 'connected' | 'error';

export interface UseRoomReturn {
  status: RoomStatus;
  error: string | null;
  selfPeerId: string | null;
  connect: (roomId: string, name: string, deckId: DeckId, isCreating: boolean) => Promise<void>;
  disconnect: () => void;
}

export function useRoom(): UseRoomReturn {
  const [status, setStatus] = useState<RoomStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [selfPeerId, setSelfPeerId] = useState<string | null>(null);

  const connect = useCallback(async (
    roomId: string,
    name: string,
    deckId: DeckId,
    isCreating: boolean,
  ) => {
    setStatus('connecting');
    setError(null);
    try {
      const session = await createSession(roomId, name, deckId, isCreating);
      setSelfPeerId(session.selfPeerId);
      setStatus('connected');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
      setStatus('error');
    }
  }, []);

  const disconnect = useCallback(() => {
    getSession()?.destroy();
    setStatus('idle');
    setSelfPeerId(null);
  }, []);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      getSession()?.destroy();
    };
  }, []);

  return { status, error, selfPeerId, connect, disconnect };
}
