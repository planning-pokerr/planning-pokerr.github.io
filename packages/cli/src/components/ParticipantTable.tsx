import React from 'react';
import { Box, Text } from 'ink';
import type { Participant, Round } from '@pokerplanning/shared';

interface Props {
  participants: Record<string, Participant>;
  round: Round;
  hostPeerId: string;
  selfPeerId: string;
}

export function ParticipantTable({ participants, round, hostPeerId, selfPeerId }: Props) {
  const sorted = Object.values(participants).sort((a, b) => a.joinedAt - b.joinedAt);
  const isRevealed = round.phase === 'revealed';

  return (
    <Box flexDirection="column" gap={0}>
      {sorted.map((p) => {
        const vote = round.votes[p.peerId];
        const hasVoted = vote?.card !== null && vote?.card !== undefined;
        const isHost = p.peerId === hostPeerId;
        const isSelf = p.peerId === selfPeerId;

        let voteDisplay = '○';
        if (isRevealed && hasVoted) voteDisplay = vote.card ?? '·';
        else if (hasVoted) voteDisplay = '✓';

        return (
          <Box key={p.peerId} gap={2}>
            <Text color={isRevealed && hasVoted ? 'cyan' : hasVoted ? 'green' : 'gray'}>
              {voteDisplay.padEnd(4)}
            </Text>
            <Text color={isSelf ? 'cyan' : 'white'} bold={isSelf}>
              {isHost ? '👑 ' : '   '}{p.name}{isSelf ? ' (you)' : ''}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}
