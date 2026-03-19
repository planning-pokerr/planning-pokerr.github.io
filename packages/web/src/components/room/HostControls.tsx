import React, { useState } from 'react';
import { DECKS, type GamePhase, type DeckId } from '@pokerplanning/shared';
import { useHostActions } from '../../hooks/useHostActions.js';

interface Props {
  phase: GamePhase;
  deckId: DeckId;
  timerDurationMs: number;
  timerRunning: boolean;
}

export function HostControls({ phase, deckId, timerDurationMs, timerRunning }: Props) {
  const { startVoting, reveal, resetRound, setDeck, setTimerDuration, startTimer, pauseTimer } = useHostActions();
  const [issueName, setIssueName] = useState('');
  const [showTimerPicker, setShowTimerPicker] = useState(false);

  const timerOptions = [
    { label: '30s', ms: 30_000 },
    { label: '1m', ms: 60_000 },
    { label: '2m', ms: 120_000 },
    { label: '3m', ms: 180_000 },
    { label: 'Off', ms: 0 },
  ];

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 text-xs text-indigo-400 font-medium uppercase tracking-wider">
        <span>👑</span> Host Controls
      </div>

      {/* Issue name input */}
      <input
        type="text"
        value={issueName}
        onChange={(e) => setIssueName(e.target.value)}
        placeholder="Issue name (optional)"
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
      />

      {/* Phase actions */}
      <div className="flex gap-2 flex-wrap">
        {phase === 'waiting' && (
          <button
            onClick={() => startVoting(issueName || undefined)}
            className="flex-1 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-medium transition-colors"
          >
            Start Voting
          </button>
        )}
        {phase === 'voting' && (
          <>
            <button
              onClick={reveal}
              className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-sm font-medium transition-colors"
            >
              Reveal Cards
            </button>
            {!timerRunning ? (
              <button
                onClick={startTimer}
                className="py-2 px-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
                title="Start timer"
              >
                ⏱ Start
              </button>
            ) : (
              <button
                onClick={pauseTimer}
                className="py-2 px-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
                title="Pause timer"
              >
                ⏸ Pause
              </button>
            )}
          </>
        )}
        {phase === 'revealed' && (
          <button
            onClick={() => { resetRound(issueName || undefined); setIssueName(''); }}
            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors"
          >
            New Round
          </button>
        )}
      </div>

      {/* Deck selector */}
      <div>
        <div className="text-xs text-gray-500 mb-1.5">Deck</div>
        <div className="flex gap-1.5 flex-wrap">
          {(Object.keys(DECKS) as DeckId[]).filter((id) => id !== 'custom').map((id) => (
            <button
              key={id}
              onClick={() => setDeck(id)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                deckId === id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {DECKS[id].name}
            </button>
          ))}
        </div>
      </div>

      {/* Timer settings */}
      <div>
        <button
          onClick={() => setShowTimerPicker(!showTimerPicker)}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          ⏱ Timer: {timerDurationMs === 0 ? 'Off' : `${timerDurationMs / 1000}s`} {showTimerPicker ? '▲' : '▼'}
        </button>
        {showTimerPicker && (
          <div className="flex gap-1.5 mt-1.5 flex-wrap">
            {timerOptions.map(({ label, ms }) => (
              <button
                key={label}
                onClick={() => { setTimerDuration(ms); setShowTimerPicker(false); }}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  timerDurationMs === ms
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
