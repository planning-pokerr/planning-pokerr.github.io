import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { DECKS, type DeckId } from '@pokerplanning/shared';
import { createCliSession } from '../store/session.js';
import { createRoomId } from '@pokerplanning/shared';

interface Props {
  initialRoomId?: string | undefined;
  onJoined: (roomId: string) => void;
}

type Mode = 'create' | 'join';
type Field = 'mode' | 'name' | 'roomId' | 'deck' | 'submitting';

export function LobbyView({ initialRoomId, onJoined }: Props) {
  const [mode, setMode] = useState<Mode>(initialRoomId ? 'join' : 'create');
  const [field, setField] = useState<Field>('mode');
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState(initialRoomId ?? '');
  const [deckIdx, setDeckIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const deckIds = (Object.keys(DECKS) as DeckId[]).filter((d) => d !== 'custom');

  useInput((_input, key) => {
    if (field === 'mode') {
      if (key.leftArrow || key.rightArrow || _input === '\t') {
        setMode((m) => (m === 'create' ? 'join' : 'create'));
      }
      if (key.return) setField('name');
    }
    if (field === 'deck') {
      if (key.leftArrow) setDeckIdx((i) => Math.max(0, i - 1));
      if (key.rightArrow) setDeckIdx((i) => Math.min(deckIds.length - 1, i + 1));
      if (key.return) void handleSubmit();
    }
  });

  const handleSubmit = async () => {
    if (!name.trim()) { setField('name'); return; }
    if (mode === 'join' && !roomId.trim()) { setField('roomId'); return; }
    setField('submitting');
    setError(null);
    try {
      const id = mode === 'create' ? createRoomId() : roomId.trim().toUpperCase();
      await createCliSession(id, name.trim(), deckIds[deckIdx] ?? 'fibonacci', mode === 'create');
      onJoined(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
      setField('name');
    }
  };

  return (
    <Box flexDirection="column" padding={1} gap={1}>
      <Box>
        <Text bold color="cyan">🃏 Planning Poker CLI</Text>
        <Text color="gray"> — serverless P2P</Text>
      </Box>

      {/* Mode selector */}
      <Box gap={2}>
        <Text color={mode === 'create' ? 'green' : 'gray'}
          bold={mode === 'create'}>
          {mode === 'create' ? '[●] Create Room' : '[ ] Create Room'}
        </Text>
        <Text color={mode === 'join' ? 'green' : 'gray'}
          bold={mode === 'join'}>
          {mode === 'join' ? '[●] Join Room' : '[ ] Join Room'}
        </Text>
        {field === 'mode' && <Text color="gray"> ← → to switch, Enter to confirm</Text>}
      </Box>

      {/* Name */}
      {field !== 'mode' && (
        <Box gap={1}>
          <Text color="gray">Name: </Text>
          {field === 'name' ? (
            <TextInput
              value={name}
              onChange={setName}
              onSubmit={() => {
                if (name.trim()) setField(mode === 'join' ? 'roomId' : 'deck');
              }}
            />
          ) : (
            <Text color="green">{name}</Text>
          )}
        </Box>
      )}

      {/* Room ID (join mode) */}
      {field !== 'mode' && mode === 'join' && (
        <Box gap={1}>
          <Text color="gray">Room Code: </Text>
          {field === 'roomId' ? (
            <TextInput
              value={roomId}
              onChange={(v) => setRoomId(v.toUpperCase())}
              onSubmit={() => { if (roomId.trim()) setField('deck'); }}
            />
          ) : (
            <Text color="cyan">{roomId}</Text>
          )}
        </Box>
      )}

      {/* Deck picker (create mode or join after roomId entered) */}
      {(field === 'deck' || field === 'submitting') && (
        <Box gap={1} flexDirection="column">
          <Text color="gray">Deck:</Text>
          <Box gap={1}>
            {deckIds.map((id, i) => (
              <Text key={id}
                color={i === deckIdx ? 'cyan' : 'gray'}
                bold={i === deckIdx}>
                {i === deckIdx ? `[${DECKS[id].name}]` : DECKS[id].name}
              </Text>
            ))}
          </Box>
          {field === 'deck' && <Text color="gray">← → to pick, Enter to connect</Text>}
        </Box>
      )}

      {field === 'submitting' && <Text color="yellow">Connecting…</Text>}
      {error && <Text color="red">{error}</Text>}
    </Box>
  );
}
