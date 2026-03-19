# Poker Planning

Serverless P2P planning poker — no backend, no account, no setup. Works in the browser and in the terminal.

Peers connect directly via WebRTC, with [Trystero](https://github.com/dmotz/trystero) handling signaling over Nostr relays. Room state is synced using [Yjs](https://github.com/yjs/yjs) CRDTs.

## Features

- Create or join a room with a shareable code
- Choose from Fibonacci, T-Shirt, or Powers of 2 card decks
- Host-controlled timer, voting, and reveal
- Cards flip on reveal with a CSS 3D animation
- Statistics on reveal: average, median, consensus %, distribution
- CLI client interoperable with the web app

---

## Web App

### Using the hosted version

Open the app in your browser. No installation required.

### Running locally

**Requirements:** Node.js ≥ 18, pnpm

```sh
# Install dependencies
pnpm install

# Start the web dev server
pnpm --filter web dev
```

Open [http://localhost:5173](http://localhost:5173).

### How to use

1. **Create a room** — click "Create Room". Share the room code or link with your team.
2. **Join a room** — enter the room code on the home screen.
3. **Vote** — once the host clicks "Start Voting", pick a card from your deck.
4. **Reveal** — the host clicks "Reveal Cards". All voted cards flip simultaneously.
5. **New round** — the host clicks "New Round" to reset and vote again.

The host is whoever created the room (determined by join order — no special role assignment needed).

---

## CLI

### Installation

```sh
# Build the CLI package
pnpm --filter poker-plan build

# Run directly
node packages/cli/dist/index.js
```

Or link it globally:

```sh
cd packages/cli
npm link
poker-plan
```

### Commands

```sh
# Show lobby (create or join)
poker-plan

# Create a new room
poker-plan create

# Join an existing room
poker-plan join <ROOM-CODE>
```

The CLI is fully interoperable with the web app — participants can mix web and CLI clients in the same room.

---

## Deployment

The web app deploys automatically to GitHub Pages on every push to `main` via the included workflow at `.github/workflows/deploy.yml`.

To deploy to your own GitHub Pages:

1. Fork the repo
2. Go to **Settings → Pages** and set the source to "GitHub Actions"
3. Push to `main`

---

## Project Structure

```
pokerplanning/
├── packages/
│   ├── shared/          # Types, game logic, P2P layer (Trystero + Yjs)
│   ├── web/             # React + Vite + Tailwind web app
│   └── cli/             # Node.js + Ink terminal app
├── .github/workflows/   # GitHub Pages deployment
└── package.json         # pnpm workspace + Turborepo root
```

---

## Contributing

### Prerequisites

- Node.js ≥ 18
- pnpm (`npm install -g pnpm`)

### Setup

```sh
git clone <repo>
cd pokerplanning
pnpm install
```

### Development

```sh
# Run all packages in watch mode
pnpm dev

# Run web only
pnpm --filter web dev

# Run CLI in watch mode
pnpm --filter poker-plan dev
```

### Type checking and tests

```sh
pnpm type-check
pnpm test
```

### Package overview

| Package | Purpose |
|---|---|
| `packages/shared` | All shared logic: TypeScript types, game state functions, Yjs document helpers, Trystero P2P provider |
| `packages/web` | React UI, Vite build, Tailwind styles |
| `packages/cli` | Ink terminal UI, werift WebRTC polyfill for Node.js |

### Making changes

- **Game rules / state shape** → `packages/shared/src/`
- **Web UI components** → `packages/web/src/components/`
- **Web state hooks** → `packages/web/src/hooks/`
- **CLI screens** → `packages/cli/src/`

### Pull requests

- Keep PRs focused — one feature or fix per PR
- Run `pnpm type-check` before opening a PR
- The shared package has unit tests in `packages/shared/src/__tests__/` — add tests for new game logic
- No backend changes needed; the app is fully serverless

### Architecture notes

- **No server** — signaling uses public Nostr relays via Trystero; data flows over WebRTC data channels
- **Host election** — deterministic: all peers sort participants by `joinedAt` timestamp and pick the oldest; no protocol needed
- **Timer** — stored as `{startedAt, durationMs}` in Yjs; each peer computes remaining time locally to avoid network chatter
- **CLI WebRTC** — Node.js lacks native WebRTC; `werift` (pure TypeScript) polyfills `RTCPeerConnection` before Trystero loads
