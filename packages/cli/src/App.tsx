import React, { useState } from 'react';
import { LobbyView } from './components/LobbyView.js';
import { RoomView } from './components/RoomView.js';
import { getSession } from './store/session.js';

interface SessionInfo {
  roomId: string;
  selfPeerId: string;
}

interface Props {
  initialRoomId?: string | undefined;
}

export function App({ initialRoomId }: Props) {
  const [session, setSession] = useState<SessionInfo | null>(null);

  const handleJoined = (roomId: string) => {
    const s = getSession();
    if (!s) return;
    setSession({ roomId, selfPeerId: s.selfPeerId });
  };

  const handleLeave = () => {
    getSession()?.destroy();
    setSession(null);
  };

  if (session) {
    return (
      <RoomView
        roomId={session.roomId}
        selfPeerId={session.selfPeerId}
        onLeave={handleLeave}
      />
    );
  }

  return <LobbyView initialRoomId={initialRoomId} onJoined={handleJoined} />;
}
