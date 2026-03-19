import React from 'react';
import { getDeck, getVotesMap, type DeckId } from '@pokerplanning/shared';
import { getSession } from '../../store/yjsStore.js';
import { Card } from './Card.js';
import * as Y from 'yjs';

interface Props {
  deckId: DeckId;
  selectedCard: string | null;
  canVote: boolean;
  selfPeerId: string;
}

export function CardDeck({ deckId, selectedCard, canVote, selfPeerId }: Props) {
  const deck = getDeck(deckId);

  const handleSelect = (value: string) => {
    const session = getSession();
    if (!session) return;
    const { doc } = session;

    const votes = getVotesMap(doc);
    doc.transact(() => {
      let voteMap = votes.get(selfPeerId);
      if (!voteMap) {
        voteMap = new Y.Map();
        votes.set(selfPeerId, voteMap);
      }
      voteMap.set('card', value === selectedCard ? null : value);
      voteMap.set('submittedAt', value === selectedCard ? null : Date.now());
    });
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm text-gray-400">
        {canVote ? 'Choose your card' : 'Voting is not open'}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {deck.cards.map((card) => (
          <Card
            key={card}
            value={card}
            isSelected={selectedCard === card}
            isRevealed
            onClick={canVote ? () => handleSelect(card) : undefined}
            disabled={!canVote}
          />
        ))}
      </div>
    </div>
  );
}
