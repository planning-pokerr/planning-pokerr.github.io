import React from 'react';
import { canVote, computeTimerRemaining } from '@pokerplanning/shared';
import { useGameState } from '../../hooks/useGameState.js';
import { useHostActions } from '../../hooks/useHostActions.js';
import { RoomCodeBadge } from '../shared/RoomCodeBadge.js';
import { ParticipantList } from './ParticipantList.js';
import { CardDeck } from './CardDeck.js';
import { Timer } from './Timer.js';
import { HostControls } from './HostControls.js';
import { RevealOverlay } from './RevealOverlay.js';

interface Props {
  roomId: string;
  selfPeerId: string;
  onLeave: () => void;
}

export function RoomScreen({ roomId, selfPeerId, onLeave }: Props) {
  const state = useGameState(roomId);
  const { reveal } = useHostActions();

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          Connecting to room…
        </div>
      </div>
    );
  }

  const { currentRound, participants, hostPeerId } = state;
  const isHost = selfPeerId === hostPeerId;
  const myVote = currentRound.votes[selfPeerId]?.card ?? null;
  const isVoting = canVote(currentRound.phase);
  const isRevealed = currentRound.phase === 'revealed';
  const timerRunning = currentRound.timer.startedAt !== null && !currentRound.timer.isPaused;
  const timerRemaining = computeTimerRemaining(currentRound.timer);

  const peerCount = Object.keys(participants).length;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 px-4 py-3 flex items-center justify-between gap-4">
        <RoomCodeBadge roomId={roomId} />

        <div className="flex items-center gap-4">
          <Timer
            timer={currentRound.timer}
            onExpire={isHost && isVoting ? reveal : undefined}
          />
          <span className="text-sm text-gray-400">{peerCount} peer{peerCount !== 1 ? 's' : ''}</span>
          <button
            onClick={onLeave}
            className="text-sm text-gray-500 hover:text-red-400 transition-colors"
          >
            Leave
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center gap-6 px-4 py-8 max-w-2xl mx-auto w-full">
        {/* Issue name */}
        {currentRound.issueName && (
          <div className="text-center">
            <span className="text-sm text-gray-500">Estimating:</span>{' '}
            <span className="text-white font-medium">{currentRound.issueName}</span>
          </div>
        )}

        {/* Phase badge */}
        <div className={`px-4 py-1.5 rounded-full text-sm font-medium ${
          isVoting
            ? 'bg-green-900/50 text-green-400 border border-green-800'
            : isRevealed
              ? 'bg-amber-900/50 text-amber-400 border border-amber-800'
              : 'bg-gray-800 text-gray-400 border border-gray-700'
        }`}>
          {currentRound.phase === 'waiting' && 'Waiting for host to start'}
          {currentRound.phase === 'voting' && (myVote ? `You voted: ${myVote}` : 'Choose your card')}
          {currentRound.phase === 'revealed' && 'Cards revealed'}
        </div>

        {/* Participants */}
        <ParticipantList
          participants={participants}
          round={currentRound}
          hostPeerId={hostPeerId}
          selfPeerId={selfPeerId}
        />

        {/* Reveal stats */}
        {isRevealed && (
          <div className="w-full">
            <RevealOverlay round={currentRound} participants={participants} />
          </div>
        )}

        {/* Card deck */}
        <div className="w-full">
          <CardDeck
            deckId={currentRound.deckId}
            selectedCard={myVote}
            canVote={isVoting}
            selfPeerId={selfPeerId}
          />
        </div>

        {/* Host controls */}
        {isHost && (
          <div className="w-full">
            <HostControls
              phase={currentRound.phase}
              deckId={currentRound.deckId}
              timerDurationMs={currentRound.timer.durationMs}
              timerRunning={timerRunning}
            />
          </div>
        )}
      </main>
    </div>
  );
}
