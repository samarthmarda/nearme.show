# Deployment status and plan

The app can run locally as a single Node process (`npm run dev`) and can build static client assets (`npm run build`). `npm run start` serves the built client plus auth API and Socket.IO on `PORT` (default 3000). Bind to a public interface behind TLS. Configure a durable, private `SCAMCITY_DATA_DIR` for `accounts.json`; back it up and restrict access.

Current limitations: account records are a JSON file, sessions/rooms/game state live in memory, and reconnect after process restart is not supported. Use one instance only. No PostgreSQL migrations, Redis, email delivery, email verification/reset, multi-instance scaling, production session store, robust rate limiting, full audit/monitoring/admin, or all game mechanics are included. The single-process backend is appropriate for development/private MVP trials, not a public competitive launch. Keep secure cookie settings behind HTTPS and protect the data volume.

Production plan: PostgreSQL/Prisma for user, friendship, room, game snapshot, event log and transaction ledger; Redis for presence/pub-sub; persistent authoritative rooms and idempotent commands; CSRF/rate limits, password recovery/email verification, secure session store, backups, logging and monitoring; then multi-client/reconnect/security stress tests.
