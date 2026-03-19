import React, { useState, useEffect } from 'react';
import { LobbyScreen } from './components/lobby/LobbyScreen.js';
import { RoomScreen } from './components/room/RoomScreen.js';
import { getSession } from './store/yjsStore.js';
import {
  getParticipantsMap,
  removeParticipant,
} from '@pokerplanning/shared';

interface SessionInfo {
  roomId: string;
  selfPeerId: string;
}

function getRoomIdFromHash(): string | undefined {
  const hash = window.location.hash.slice(1).trim();
  return hash.length > 0 ? hash.toUpperCase() : undefined;
}

export function App() {
  const [session, setSession] = useState<SessionInfo | null>(null);

  const initialRoomId = getRoomIdFromHash();

  // Handle peer disconnects — remove them from the Yjs participants map
  useEffect(() => {
    if (!session) return;
    const s = getSession();
    if (!s) return;

    const handlePeerLeave = (peerId: string) => {
      removeParticipant(s.doc, peerId);
    };

    s.room.onPeerLeave(handlePeerLeave);
  }, [session]);

  // Sync URL hash changes (back/forward navigation)
  useEffect(() => {
    const handleHashChange = () => {
      const roomId = getRoomIdFromHash();
      if (!roomId && session) {
        handleLeave();
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [session]);

  const handleJoined = (roomId: string) => {
    const s = getSession();
    if (!s) return;
    setSession({ roomId, selfPeerId: s.selfPeerId });
  };

  const handleLeave = () => {
    getSession()?.destroy();
    window.location.hash = '';
    setSession(null);
  };

  if (session) {
    return (
      <RoomScreen
        roomId={session.roomId}
        selfPeerId={session.selfPeerId}
        onLeave={handleLeave}
      />
    );
  }

  return <LobbyScreen initialRoomId={initialRoomId} onJoined={handleJoined} />;
}
