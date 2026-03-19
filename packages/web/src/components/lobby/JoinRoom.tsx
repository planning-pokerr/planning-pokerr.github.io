import React, { useState } from 'react';
import { createSession } from '../../store/yjsStore.js';

interface Props {
  initialRoomId?: string | undefined;
  onJoined: (roomId: string) => void;
}

export function JoinRoom({ initialRoomId, onJoined }: Props) {
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState(initialRoomId ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !roomId.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const normalizedId = roomId.trim().toUpperCase();
      await createSession(normalizedId, name.trim(), 'fibonacci', false);
      window.location.hash = normalizedId;
      onJoined(normalizedId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleJoin} className="space-y-4">
      <div>
        <label className="block text-sm text-gray-400 mb-1">Your name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Bob"
          maxLength={32}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Room code</label>
        <input
          type="text"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value.toUpperCase())}
          placeholder="e.g. ABC12345"
          maxLength={12}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 font-mono tracking-widest uppercase"
          required
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading || !name.trim() || !roomId.trim()}
        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
      >
        {loading ? 'Joining…' : 'Join Room'}
      </button>
    </form>
  );
}
