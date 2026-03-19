import React from 'react';
import { Box, Text } from 'ink';
import { computeStats, getDeck, type Round } from '@pokerplanning/shared';

interface Props {
  round: Round;
}

export function RevealTable({ round }: Props) {
  const deck = getDeck(round.deckId);
  const votes = Object.values(round.votes);
  const stats = computeStats(votes, deck);

  const entries = Object.entries(stats.distribution).sort(([a], [b]) => {
    const na = Number(a), nb = Number(b);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return a.localeCompare(b);
  });

  const maxCount = Math.max(...Object.values(stats.distribution));

  return (
    <Box flexDirection="column" gap={1}>
      {/* Stats row */}
      <Box gap={4}>
        {stats.average !== null && (
          <Box gap={1}><Text color="gray">Avg:</Text><Text color="white" bold>{stats.average}</Text></Box>
        )}
        {stats.median !== null && (
          <Box gap={1}><Text color="gray">Median:</Text><Text color="cyan" bold>{stats.median}</Text></Box>
        )}
        <Box gap={1}>
          <Text color="gray">Consensus:</Text>
          <Text color={stats.consensusPercent >= 80 ? 'green' : stats.consensusPercent >= 60 ? 'yellow' : 'red'} bold>
            {stats.consensusPercent}%
          </Text>
        </Box>
        <Box gap={1}><Text color="gray">Votes:</Text><Text color="white">{stats.totalVotes}</Text></Box>
      </Box>

      {/* Distribution */}
      {entries.map(([card, count]) => {
        const bar = '█'.repeat(Math.round((count / maxCount) * 20));
        return (
          <Box key={card} gap={1}>
            <Text color="gray">{String(card).padEnd(4)}</Text>
            <Text color="cyan">{bar}</Text>
            <Text color="white">{count}</Text>
          </Box>
        );
      })}
    </Box>
  );
}
