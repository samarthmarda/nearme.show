# Realtime protocol

The current MVP serves same-origin HTTP + Socket.IO. Signup/login set an HttpOnly, SameSite=Lax cookie. Socket middleware resolves that session to an account; user/player identity is never accepted from a game command as authority. Presence is socket-backed. Friend requests are simplified to mutual add-by-username for this MVP. Rooms use six-character codes, cap at six players, randomize turn order at start and broadcast shared room/game state.

Current socket messages: `room:create`, `room:join`, `room:leave`, `room:invite`, `room:start`, `game:command`, `chat:send`; server events include `room:update`, `game:state`, `presence:update`, `friends:update`, `game:invite`, `chat:message`. On reconnect the client emits `room:join` again with its room code; the server re-adds the socket to the room and replies with the current game state, so an open Super Power interaction is restored for every client.

Supported game commands (`game:command`, acked with `{ok, state}` or `{ok: false, error}`):

- Dice and property: `ROLL`, `BUY_PROPERTY`, `PASS_PROPERTY`, `BUILD`.
- Super Power: `CHOOSE_POWER` (`powerId`: `bomb`, `power-swap`, `auction`, `rent-free`), `POWER_SELECT` (`propertyId`), `POWER_CONFIRM`, `POWER_DECLINE`, `POWER_CANCEL`. `PASS_POWER` is accepted as an alias of `POWER_CANCEL`.
- Every Super Power command carries `interactionId` (the id of the interaction the client is answering). A command for an older interaction is rejected with an "already changed" error.

There is no END_TURN command: the server advances after all landing effects and required choices resolve, with a 6 granting the same player another roll. Turn, decision, and Super Power timeouts are enforced by the server. An unanswered property choice times out as PASS; an unanswered Super Power step times out as CANCEL; an AUCTION that reaches its deadline ends with no transfer and no bonus.

Command validation (in `src/game/engine.ts`, applied by `server.ts`): the actor must be the seat that owns the current step; each selected property must be eligible for that step; ownership is re-checked when a POWER SWAP or AUCTION is confirmed; and a command after the AUCTION deadline is refused even before the timer fires. Payouts (the $100 AUCTION bonus) are computed only on the server.

Refused commands return an error. If a refused command still reset the interaction (for example, a POWER SWAP whose property changed owner), the server broadcasts the reset `game:state` to the room before returning the error, so every client drops stale highlights.

Planned protocol hardening: persist unique command IDs, monotonic per-game event sequence/eventId, expected sequence validation, transactional ledger, replay/snapshot reconnect, reconnect grace period, per-command rate limits, trusted player-seat mapping after reconnect, and integration tests under concurrent duplicate commands. The MVP room/game state is volatile and does not yet meet replay/reconnect acceptance criteria.
