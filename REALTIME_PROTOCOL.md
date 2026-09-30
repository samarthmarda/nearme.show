# Realtime protocol

The current MVP serves same-origin HTTP + Socket.IO. Signup/login set an HttpOnly, SameSite=Lax cookie. Socket middleware resolves that session to an account; user/player identity is never accepted from a game command as authority. Presence is socket-backed. Friend requests are simplified to mutual add-by-username for this MVP. Rooms use six-character codes, cap at six players, randomize turn order at start and broadcast shared room/game state.

Current socket messages: `room:create`, `room:join`, `room:leave`, `room:invite`, `room:start`, `game:command`, `chat:send`; server events include `room:update`, `game:state`, `presence:update`, `friends:update`, `game:invite`, `chat:message`. Supported game commands are ROLL, BUY_PROPERTY, PASS_PROPERTY, BUILD and END_TURN. Turn and decision timeout are enforced by the server; safe timeout behavior auto-rolls then passes an unowned purchase and ends the turn.

Planned protocol hardening: persist unique command IDs, monotonic per-game event sequence/eventId, expected sequence validation, transactional ledger, replay/snapshot reconnect, reconnect grace period, per-command rate limits, trusted player-seat mapping after reconnect, and integration tests under concurrent duplicate commands. The MVP room/game state is volatile and does not yet meet replay/reconnect acceptance criteria.
