import * as Y from 'yjs';
import {
  APP_ID,
  NOSTR_RELAY_URLS,
  TrysteroYjsProvider,
  initDoc,
  addParticipant,
  removeParticipant,
  generateSelfPeerId,
  type DeckId,
} from '@pokerplanning/shared';

export interface CliSession {
  doc: Y.Doc;
  provider: TrysteroYjsProvider;
  selfPeerId: string;
  roomId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  room: any;
  destroy: () => void;
}

let current: CliSession | null = null;

export function getSession(): CliSession | null {
  return current;
}

export async function createCliSession(
  roomId: string,
  name: string,
  deckId: DeckId,
  isCreating: boolean,
): Promise<CliSession> {
  if (current) {
    current.destroy();
    current = null;
  }

  // Dynamic import to avoid bundling issues with trystero's ESM-only nature
  const { joinRoom } = await import('trystero/nostr');

  const selfPeerId = generateSelfPeerId();
  const doc = new Y.Doc();

  const room = joinRoom(
    { appId: APP_ID, relayUrls: NOSTR_RELAY_URLS },
    roomId,
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const provider = new TrysteroYjsProvider({ doc, room: room as any });

  if (isCreating) {
    initDoc(doc, roomId, deckId);
  }

  addParticipant(doc, {
    peerId: selfPeerId,
    name,
    joinedAt: Date.now(),
  });

  room.onPeerLeave((peerId: string) => {
    removeParticipant(doc, peerId);
  });

  const destroy = () => {
    provider.destroy();
    doc.destroy();
    current = null;
  };

  current = { doc, provider, selfPeerId, roomId, room, destroy };
  return current;
}
