import React from 'react';
import { Box, Text, useInput } from 'ink';
import { canVote } from '@pokerplanning/shared';
import { useGameState } from '../hooks/useGameState.js';
import { useHostActions } from '../hooks/useHostActions.js';
import { ParticipantTable } from './ParticipantTable.js';
import { CardSelector } from './CardSelector.js';
import { TimerBar } from './TimerBar.js';
import { RevealTable } from './RevealTable.js';

interface Props {
  roomId: string;
  selfPeerId: string;
  onLeave: () => void;
}

export function RoomView({ roomId, selfPeerId, onLeave }: Props) {
  const state = useGameState(roomId);
  const { startVoting, reveal, resetRound, startTimer } = useHostActions();

  useInput((_input, key) => {
    if (key.escape || _input === 'q') { onLeave(); return; }
    if (!state) return;
    const isHost = selfPeerId === state.hostPeerId;
    if (!isHost) return;

    if (_input === 'r' && state.currentRound.phase === 'voting') reveal();
    if (_input === 'n' && state.currentRound.phase === 'revealed') resetRound();
    if (_input === 's' && state.currentRound.phase === 'waiting') startVoting();
    if (_input === 't' && state.currentRound.phase === 'voting') startTimer();
  });

  if (!state) {
    return <Text color="yellow">Connecting to room {roomId}…</Text>;
  }

  const { currentRound, participants, hostPeerId } = state;
  const isHost = selfPeerId === hostPeerId;
  const myVote = currentRound.votes[selfPeerId]?.card ?? null;
  const isVoting = canVote(currentRound.phase);
  const isRevealed = currentRound.phase === 'revealed';
  const peerCount = Object.keys(participants).length;

  return (
    <Box flexDirection="column" gap={1} padding={1}>
      {/* Header */}
      <Box gap={3}>
        <Text bold color="cyan">Room: <Text color="white">{roomId}</Text></Text>
        <Text color="gray">Peers: {peerCount}</Text>
        <TimerBar
          timer={currentRound.timer}
          onExpire={isHost && isVoting ? reveal : undefined}
        />
        {isHost && <Text color="yellow" bold>👑 HOST</Text>}
      </Box>

      {/* Issue name */}
      {currentRound.issueName && (
        <Text color="gray">Issue: <Text color="white">{currentRound.issueName}</Text></Text>
      )}

      {/* Phase */}
      <Text color={isVoting ? 'green' : isRevealed ? 'yellow' : 'gray'}>
        {currentRound.phase === 'waiting' && '◎ Waiting for host to start voting'}
        {currentRound.phase === 'voting' && (myVote ? `✓ Voted: ${myVote}` : '● Voting open — pick a card')}
        {currentRound.phase === 'revealed' && '◉ Cards revealed'}
      </Text>

      {/* Divider */}
      <Text color="gray">{'─'.repeat(40)}</Text>

      {/* Participants */}
      <ParticipantTable
        participants={participants}
        round={currentRound}
        hostPeerId={hostPeerId}
        selfPeerId={selfPeerId}
      />

      {/* Reveal stats */}
      {isRevealed && (
        <>
          <Text color="gray">{'─'.repeat(40)}</Text>
          <RevealTable round={currentRound} />
        </>
      )}

      {/* Card selector */}
      {isVoting && (
        <>
          <Text color="gray">{'─'.repeat(40)}</Text>
          <CardSelector
            deckId={currentRound.deckId}
            selectedCard={myVote}
            canVote={isVoting}
            selfPeerId={selfPeerId}
          />
        </>
      )}

      {/* Host keybindings */}
      <Text color="gray">{'─'.repeat(40)}</Text>
      {isHost ? (
        <Box gap={3} flexWrap="wrap">
          {currentRound.phase === 'waiting' && <Text color="gray">[s] Start voting</Text>}
          {currentRound.phase === 'voting' && <Text color="gray">[r] Reveal  [t] Start timer</Text>}
          {currentRound.phase === 'revealed' && <Text color="gray">[n] New round</Text>}
          <Text color="gray">[q/Esc] Leave</Text>
        </Box>
      ) : (
        <Text color="gray">[q/Esc] Leave</Text>
      )}
    </Box>
  );
}
