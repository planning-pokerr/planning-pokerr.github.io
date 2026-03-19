import * as Y from 'yjs';

// Trystero Room interface (minimal — avoids importing all of trystero at type level)
export interface TrysteroRoom {
  // makeAction returns [sender, receiver, progress?] — we only use the first two
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  makeAction: <T>(label: string) => [any, any, ...any[]];
  onPeerJoin: (handler: (peerId: string) => void) => void;
  onPeerLeave: (handler: (peerId: string) => void) => void;
}

export interface TrysteroYjsProviderOptions {
  doc: Y.Doc;
  room: TrysteroRoom;
}

/**
 * Bridges a Yjs Y.Doc and a Trystero Room.
 * - Encodes local Yjs updates as Uint8Array and broadcasts them via Trystero.
 * - Applies incoming Uint8Array updates from peers to the local Y.Doc.
 * - Sends full state to newly joined peers so they catch up immediately.
 */
export class TrysteroYjsProvider {
  onSync?: () => void;
  private doc: Y.Doc;
  private room: TrysteroRoom;
  private sendUpdate: (data: Uint8Array, targetPeerId?: string) => void;
  private isDestroyed = false;
  private synced = false;

  constructor({ doc, room }: TrysteroYjsProviderOptions) {
    this.doc = doc;
    this.room = room;

    const [sendUpdate, receiveUpdate] = room.makeAction<Uint8Array>('yjs-update');
    this.sendUpdate = sendUpdate;

    // Broadcast local updates to all peers
    this.doc.on('update', this.handleLocalUpdate);

    // Apply updates from remote peers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    receiveUpdate((update: any, _peerId: any) => {
      if (this.isDestroyed) return;
      Y.applyUpdate(this.doc, update as Uint8Array);
      if (!this.synced) {
        this.synced = true;
        this.onSync?.();
      }
    });

    // Send full state snapshot to newly joined peer
    room.onPeerJoin((peerId) => {
      if (this.isDestroyed) return;
      const fullState = Y.encodeStateAsUpdate(this.doc);
      sendUpdate(fullState, peerId);
    });
  }

  private handleLocalUpdate = (update: Uint8Array, origin: unknown) => {
    // Skip if update originated from a remote peer (already applied)
    if (origin === 'remote' || this.isDestroyed) return;
    this.sendUpdate(update);
  };

  destroy() {
    this.isDestroyed = true;
    this.doc.off('update', this.handleLocalUpdate);
  }
}
