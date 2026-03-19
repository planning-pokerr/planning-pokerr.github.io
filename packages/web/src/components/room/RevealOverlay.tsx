import React from 'react';
import { computeStats, getDeck, type Round, type Participant } from '@pokerplanning/shared';
import { VoteDistribution } from './VoteDistribution.js';

interface Props {
  round: Round;
  participants: Record<string, Participant>;
}

export function RevealOverlay({ round, participants }: Props) {
  const deck = getDeck(round.deckId);
  const votes = Object.values(round.votes);
  const stats = computeStats(votes, deck);

  const allCoffee = Object.values(round.votes).every((v) => v.card === '☕');

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 space-y-5">
      {allCoffee ? (
        <div className="text-center py-4">
          <div className="text-5xl mb-2">☕</div>
          <p className="text-gray-400">Everyone needs a break!</p>
        </div>
      ) : (
        <VoteDistribution stats={stats} />
      )}

      {round.issueName && (
        <div className="text-center text-sm text-gray-400 border-t border-gray-800 pt-3">
          <span className="text-gray-500">Issue:</span>{' '}
          <span className="text-white">{round.issueName}</span>
        </div>
      )}
    </div>
  );
}
