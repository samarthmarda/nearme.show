# Deploying Scam City

## Container deployment

The repository includes a production Docker image. It builds the React/Vite client and bundles the TypeScript server, then installs only runtime packages in the final image.

```sh
docker build -t scam-city .
docker run --rm -p 3000:3000 \
  -e NODE_ENV=production \
  -e SCAMCITY_DATA_DIR=/var/data \
  -v scam-city-data:/var/data \
  scam-city
```

Open `http://localhost:3000`. The health check is `GET /api/health`. In a hosted container platform, expose the service's `PORT` over HTTPS and mount persistent storage at `/var/data` (or set `SCAMCITY_DATA_DIR` to the provider's persistent disk path). Keep the database file private; never mount the data directory as a public static path.

The container build excludes `.env`, local accounts, `node_modules`, and Git history. Demo accounts are created only in development. On production startup, any matching shared demo credentials in a copied account file are removed.

## Hosting requirements

- One Node.js 22 web instance; the process binds `0.0.0.0` and honors `PORT`.
- Persistent writable storage for `accounts.json`; set `SCAMCITY_DATA_DIR`.
- HTTPS at the public edge (production auth cookies are `Secure`).
- WebSocket/Socket.IO support enabled by the hosting provider/proxy.
- A health check pointed at `/api/health`.
- Room codes are unlisted share links: any authenticated account can join a room with an open seat (no friendship required). Codes are rate-limited to 20 join attempts per account per minute; new joins stop when the match ends.

Do not scale this MVP horizontally: sessions, presence, rooms, and game state are in memory and will not synchronize between instances or survive a restart. Account data is a JSON file rather than a transactional database. A persistent disk preserves accounts, but it does **not** preserve live games or sessions.

## Before a public launch

The current build is deployable for a small, single-instance playtest; it is not a hardened public competitive service. Add a transactional database, persistent/reconnectable games, shared session storage, stronger per-account/IP abuse limits, password reset and email verification, audit logging, monitoring, backups, and security review before inviting the general public. Ensure your privacy notice covers account data and chat. Demo names/passwords are not production defaults.

## Build and run locally

```sh
npm ci
npm run lint
npm test
npm run build
npm start
```
