import React, { useState } from 'react';
import { DECKS, type DeckId } from '@pokerplanning/shared';
import { createRoomId } from '@pokerplanning/shared';
import { createSession } from '../../store/yjsStore.js';

interface Props {
  onJoined: (roomId: string) => void;
}

export function CreateRoom({ onJoined }: Props) {
  const [name, setName] = useState('');
  const [deckId, setDeckId] = useState<DeckId>('fibonacci');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const roomId = createRoomId();
      await createSession(roomId, name.trim(), deckId, true);
      window.location.hash = roomId;
      onJoined(roomId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleCreate} className="space-y-4">
      <div>
        <label className="block text-sm text-gray-400 mb-1">Your name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Alice"
          maxLength={32}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Card deck</label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(DECKS) as DeckId[]).filter((id) => id !== 'custom').map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setDeckId(id)}
              className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                deckId === id
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
              }`}
            >
              {DECKS[id].name}
              <div className="text-xs opacity-60 mt-0.5 truncate">
                {DECKS[id].cards.slice(0, 5).join(' · ')}…
              </div>
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
      >
        {loading ? 'Creating…' : 'Create Room'}
      </button>
    </form>
  );
}
