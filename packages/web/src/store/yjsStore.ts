import * as Y from 'yjs';
import { joinRoom } from 'trystero/nostr';
import {
  APP_ID,
  NOSTR_RELAY_URLS,
  TrysteroYjsProvider,
  initDoc,
  addParticipant,
  generateSelfPeerId,
  type DeckId,
} from '@pokerplanning/shared';

export interface RoomSession {
  doc: Y.Doc;
  provider: TrysteroYjsProvider;
  selfPeerId: string;
  roomId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  room: any; // Trystero room — kept opaque to avoid deep type coupling
  destroy: () => void;
}

let currentSession: RoomSession | null = null;

export function getSession(): RoomSession | null {
  return currentSession;
}

export async function createSession(
  roomId: string,
  selfName: string,
  deckId: DeckId,
  isCreating: boolean,
): Promise<RoomSession> {
  if (currentSession) {
    currentSession.destroy();
    currentSession = null;
  }

  const selfPeerId = generateSelfPeerId();
  const doc = new Y.Doc();

  const room = joinRoom(
    { appId: APP_ID, relayUrls: NOSTR_RELAY_URLS },
    roomId,
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const provider = new TrysteroYjsProvider({ doc, room: room as any });

  if (isCreating) {
    // Initialize doc with default room state and add ourselves immediately
    initDoc(doc, roomId, deckId);
    addParticipant(doc, { peerId: selfPeerId, name: selfName, joinedAt: Date.now() });
  } else {
    // Joiners must wait for the host's state to arrive before adding themselves,
    // otherwise addParticipant creates a conflicting Y.Map that overwrites the
    // host's participants map during Yjs CRDT merge.
    const joinedAt = Date.now();
    provider.onSync = () => {
      addParticipant(doc, { peerId: selfPeerId, name: selfName, joinedAt });
    };
  }

  const destroy = () => {
    provider.destroy();
    room.leave?.();
    doc.destroy();
    currentSession = null;
  };

  currentSession = { doc, provider, selfPeerId, roomId, room, destroy };
  return currentSession;
}
