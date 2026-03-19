import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import * as Y from 'yjs';
import { getDeck, getVotesMap, type DeckId } from '@pokerplanning/shared';
import { getSession } from '../store/session.js';

interface Props {
  deckId: DeckId;
  selectedCard: string | null;
  canVote: boolean;
  selfPeerId: string;
}

export function CardSelector({ deckId, selectedCard, canVote, selfPeerId }: Props) {
  const deck = getDeck(deckId);
  const [cursor, setCursor] = useState(() => {
    const idx = selectedCard ? deck.cards.indexOf(selectedCard) : 0;
    return idx >= 0 ? idx : 0;
  });

  useInput((_input, key) => {
    if (!canVote) return;
    if (key.leftArrow) setCursor((c) => Math.max(0, c - 1));
    if (key.rightArrow) setCursor((c) => Math.min(deck.cards.length - 1, c + 1));
    if (key.return) {
      const card = deck.cards[cursor];
      if (!card) return;
      const session = getSession();
      if (!session) return;
      const { doc } = session;
      const votes = getVotesMap(doc);
      doc.transact(() => {
        const toggle = card === selectedCard;
        let vMap = votes.get(selfPeerId);
        if (!vMap) { vMap = new Y.Map(); votes.set(selfPeerId, vMap); }
        vMap.set('card', toggle ? null : card);
        vMap.set('submittedAt', toggle ? null : Date.now());
      });
    }
  });

  if (!canVote) {
    return <Text color="gray">Voting not open</Text>;
  }

  return (
    <Box flexDirection="column" gap={0}>
      <Text color="gray">← → navigate  Enter to vote</Text>
      <Box gap={1} flexWrap="wrap">
        {deck.cards.map((card, i) => {
          const isCursor = i === cursor;
          const isSelected = card === selectedCard;
          return (
            <Text
              key={card}
              color={isSelected ? 'cyan' : isCursor ? 'green' : 'gray'}
              bold={isCursor || isSelected}
            >
              {isCursor ? `[${card}]` : isSelected ? `(${card})` : ` ${card} `}
            </Text>
          );
        })}
      </Box>
    </Box>
  );
}
