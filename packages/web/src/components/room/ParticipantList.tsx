import React from 'react';
import type { Participant, Round } from '@pokerplanning/shared';
import { Card } from './Card.js';

interface Props {
  participants: Record<string, Participant>;
  round: Round;
  hostPeerId: string;
  selfPeerId: string;
}

export function ParticipantList({ participants, round, hostPeerId, selfPeerId }: Props) {
  const sorted = Object.values(participants).sort((a, b) => a.joinedAt - b.joinedAt);
  const isRevealed = round.phase === 'revealed';

  return (
    <div className="flex flex-wrap gap-5 justify-center">
      {sorted.map((p) => {
        const vote = round.votes[p.peerId];
        const hasVoted = vote?.card !== null && vote?.card !== undefined;
        const isHost = p.peerId === hostPeerId;
        const isSelf = p.peerId === selfPeerId;

        return (
          <div key={p.peerId} className="flex flex-col items-center gap-2">
            <Card
              value={vote?.card ?? '?'}
              isRevealed={isRevealed && hasVoted}
              isSelected={hasVoted}
              size="lg"
            />
            <div className="flex items-center gap-1">
              {isHost && <span title="Host" className="text-xs">👑</span>}
              <span className={`text-xs max-w-20 truncate ${isSelf ? 'text-indigo-300 font-medium' : 'text-gray-400'}`}>
                {p.name}{isSelf ? ' (you)' : ''}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
