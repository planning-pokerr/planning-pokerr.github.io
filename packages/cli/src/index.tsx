// Must be first — polyfills RTCPeerConnection, RTCSessionDescription, RTCIceCandidate for Node.js
import {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
} from 'werift';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g = globalThis as any;
g.RTCPeerConnection = RTCPeerConnection;
g.RTCSessionDescription = RTCSessionDescription;
g.RTCIceCandidate = RTCIceCandidate;

import React from 'react';
import { render } from 'ink';
import { Command } from 'commander';
import { App } from './App.js';

const program = new Command();

program
  .name('poker-plan')
  .description('Planning Poker CLI — serverless P2P, interoperable with the web app')
  .version('0.0.1');

program
  .command('join <roomCode>', { isDefault: false })
  .description('Join a room by code')
  .action((roomCode: string) => {
    render(<App initialRoomId={roomCode.toUpperCase()} />);
  });

program
  .command('create', { isDefault: false })
  .description('Create a new room')
  .action(() => {
    render(<App />);
  });

// Default: show lobby
program
  .argument('[roomCode]', 'Optional room code to join directly')
  .action((roomCode?: string) => {
    render(<App initialRoomId={roomCode?.toUpperCase()} />);
  });

program.parse();
