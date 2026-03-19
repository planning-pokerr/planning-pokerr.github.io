import type { P2PMessage } from '../types.js';

export function isHostActionMessage(msg: P2PMessage): msg is Extract<P2PMessage, { type: 'HOST_ACTION' }> {
  return msg.type === 'HOST_ACTION';
}

export function isPeerHelloMessage(msg: P2PMessage): msg is Extract<P2PMessage, { type: 'PEER_HELLO' }> {
  return msg.type === 'PEER_HELLO';
}

export function isTimerSyncMessage(msg: P2PMessage): msg is Extract<P2PMessage, { type: 'TIMER_SYNC' }> {
  return msg.type === 'TIMER_SYNC';
}
