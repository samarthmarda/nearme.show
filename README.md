# Scam City

Scam City is an original social property strategy game. This repository now includes a responsive browser client, a 36-space board, a pure game-engine slice, username/password accounts, friend lookup/add, online presence, private six-character rooms, real-time room/game sync, table chat and server-owned dice/property/rent/turn changes.

## Run locally

```sh
npm install
npm run dev
```

Open the Vite-served app at the preview URL. Create separate accounts in two browser sessions, add each other by username, create a room, invite the online friend and start.

## Commands

```sh
npm run build       # production static client
npm run start       # single-process HTTP + Socket.IO production server
npm run lint        # TypeScript check
npm test            # engine tests
npm run simulate -- 100
```

## Current architecture
- `src/brand.ts`: central branding.
- `src/game/rules.ts`: exact 36-tile board and configurable initial values.
- `src/game/engine.ts`: pure movement, Bank, purchase, rent, development and victory transitions.
- `server.ts`: Vite dev middleware + Express API + Socket.IO; scrypt password hashes, HTTP-only session cookie, file-backed account list, in-memory friends presence/rooms and authoritative game commands.
- `src/AuthView.tsx`: username/password signup/login.

## Deployment limits
This is a useful single-process multiplayer MVP, not the full production platform. It currently stores accounts as JSON in `data/accounts.json` and active rooms/sessions in process memory. Use one server instance with durable protected storage for a small private test; horizontal scale, PostgreSQL/Prisma, Redis, email verification/password reset, robust session persistence, reconnect replay/snapshots, abuse controls, admin, and the full trade/concession/donation/power systems remain to be implemented. Do not deploy publicly with valuable/private user data until those production controls are added. See `DEPLOYMENT.md` and `ARCHITECTURE.md`.
