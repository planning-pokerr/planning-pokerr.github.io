import React, { useState } from 'react';
import { CreateRoom } from './CreateRoom.js';
import { JoinRoom } from './JoinRoom.js';

interface Props {
  initialRoomId?: string | undefined;
  onJoined: (roomId: string) => void;
}

type Tab = 'create' | 'join';

export function LobbyScreen({ initialRoomId, onJoined }: Props) {
  const [tab, setTab] = useState<Tab>(initialRoomId ? 'join' : 'create');

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🃏</div>
          <h1 className="text-3xl font-bold text-white">Planning Poker</h1>
          <p className="text-gray-400 mt-2 text-sm">Serverless P2P — no account needed</p>
        </div>

        <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-800">
          <div className="flex border-b border-gray-800">
            <button
              onClick={() => setTab('create')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                tab === 'create'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              Create Room
            </button>
            <button
              onClick={() => setTab('join')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                tab === 'join'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              Join Room
            </button>
          </div>

          <div className="p-6">
            {tab === 'create' ? (
              <CreateRoom onJoined={onJoined} />
            ) : (
              <JoinRoom initialRoomId={initialRoomId} onJoined={onJoined} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
