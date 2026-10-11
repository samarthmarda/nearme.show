# Scam City architecture

## Current vertical slice
The repository began as a client-side Vite/React prototype. It now includes Scam City branding, the exact board and economy config (`src/game/rules.ts`), framework-independent transitions (`src/game/engine.ts`), a responsive browser table, username/password signup/login, a small real-time social backend, tests and a simulation harness. The current service is a single-process MVP, not horizontally scalable or production-hardened.

## Current boundaries
- Browser: React/TypeScript, local presentation/animation state; uses HTTP for auth/friend lookup and Socket.IO for presence, private rooms, table chat and game commands.
- `server.ts`: Express + Socket.IO. Passwords are scrypt-hashed; session IDs are random HttpOnly SameSite cookies. Game commands are validated against the authenticated seat, phase and server-owned state. Room turns and timers are held in memory.
- Game engine: pure transition functions, no React/DOM/database/network dependencies.
- Accounts: JSON file for this prototype. Rooms, session tokens, presence and current game state are process memory.

## Production direction
Move to Next.js web, a separate Node/TypeScript Socket.IO game service, PostgreSQL/Prisma for users/ledger/events/snapshots, and Redis for presence/pub-sub and multi-node rooms. Add transaction/idempotency persistence, reconnection replay/snapshots, email verification/reset, rate limits, moderation, observability, admin audit and deployment security before public launch.

## Trust boundary
Dice, cash, ownership, rent, purchase validity, development and turn state are server-generated for room games. The browser animates and renders; it cannot submit authoritative results. The current room server supports the basic roll/buy/pass/build/end-turn command path. Advanced social-economy and power actions are roadmap items, not implemented commands.

See `GAME_RULES.md`, `BOARD.md`, `PROPERTY_ECONOMY.md`, `DATABASE.md`, `REALTIME_PROTOCOL.md`, and `BALANCING.md`.
