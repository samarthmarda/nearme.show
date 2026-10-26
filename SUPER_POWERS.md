# Super Powers

Landing on either SUPER POWER space (`tile_15`, `tile_27`) opens a power interaction for the landing player. The four powers are defined in `POWER_OPTIONS` and tuned in `RULES.powers` / `RULES.timing` in `src/game/rules.ts`. The engine (`src/game/engine.ts`) is the only authority; the centre panel in `src/components/game/BoardCenter.tsx` renders the server state and sends commands.

No power is awarded automatically. The landing player chooses one of the four powers, or passes with CANCEL. The chosen power is recorded in `player.powers` only when it resolves.

## Flow

1. **Choose** (`CHOOSE_POWER`, 20 s). The panel offers BOMB, POWER SWAP, AUCTION and RENT FREE ROUND. A power with no legal target is shown as unavailable with its reason. CANCEL passes.
2. **Action steps** (30 s each). Targets are chosen by clicking eligible property tiles. Eligible tiles get a cue card (ELIGIBLE / SELECTED) and a selection command (`POWER_SELECT`).
3. **Resolve.** A power takes effect only on the server's acceptance of `POWER_CONFIRM` (RELEASE / POWER SWAP / TRADE / SUBMIT OFFER) or on `CHOOSE_POWER` for RENT FREE ROUND. Cancel, decline, or timeout leaves ownership and cash unchanged.
4. The turn engine then resumes automatically. A roll of 6 grants another roll only after the power has resolved. There is no END TURN button and no CONTINUE button.

Every command is checked by the server: actor (must be the power's actor for that step), `interactionId` (stale prompts are rejected), eligibility of each selected property, and current ownership at confirmation.

## The four powers

### BOMB
- Select one rival-owned property. Ownership does not change.
- On RELEASE, the target's rent is halved, rounded **down** to the previous $5 step, with a **minimum of $1**. Examples: $100 → $50, $55 → $25, $25 → $10, $10 → $5, $5 → $1.
- Repeated bombs stack on the same property (each one halves the already-bombed rent). A property already at $1 is not a legal target.
- The missile animation (`PowerEffects.tsx`) starts only from the server's `powerEvent` (`kind: "bomb"`, `fromTileId: "tile_20"` — ISRAEL). Nothing animates before RELEASE is acknowledged.
- Not implemented: bomb expiry and repair. Bombs currently last for the rest of the game. Repair costs are data only (`repairCost` in `rules.ts`).

### POWER SWAP
- Two steps. First select a **rival** property (what you receive); only rival properties are eligible. Then select **one of your own** properties (what you give). Your own properties are not eligible first.
- POWER SWAP is atomic: ownership moves only when both sides are still valid at confirmation. The server records the owner of the rival property at selection time. If that property has changed owner, or your property is no longer yours, the server refuses, clears the selection for every client, and nothing moves.
- Buildings stay attached to their property.

### AUCTION (the former PROPERTY EXCHANGE)
- Timer: 69 seconds from the moment AUCTION is chosen (`RULES.timing.auctionSeconds`). The server rejects any command after the deadline, even before the timer fires, and the timeout ends the auction with no transfer.
- Step 1: the initiator selects one of their own properties and confirms it as the offer.
- Step 2: each opponent may submit exactly one offer of one of their own properties, or decline. An opponent's submitted offer is final.
- Step 3: the initiator selects one submitted offer and confirms TRADE. Only that pair moves: the initiator's property goes to the chosen opponent, and the offered property goes to the initiator.
- Bonus: each of the two participants receives `RULES.economy.exchangeBonus` ($100) from the Bank. No other player receives anything. Declining or unselected offers receive nothing.
- Cancel (by the initiator) or timeout: no transfer and no bonus.

### RENT FREE ROUND
- Activates immediately on acceptance (`CHOOSE_POWER`). No second confirmation.
- For the next `RULES.powers.rentFreeCircuits` (3) completed circuits, the owner's rent and utility/transport/business charges are blocked. Blocked charges show as `RENT BLOCKED` and move no cash.
- A circuit is counted each time the player passes START (position wrap). Moving within a circuit does not count.
- When the third circuit completes, protection ends and the next landing is charged normally.
- Unrelated charges are **not** blocked: Property Tax and other non-rent deductions still apply.
- The rent-free strip in the centre board shows the protected player and the remaining circuits.

## Timers

| Step | Duration |
|---|---|
| Choose a power | `RULES.timing.powerSeconds` (20 s) |
| Power action steps (target, offers, etc.) | `RULES.timing.powerActionSeconds` (30 s) |
| AUCTION (whole interaction) | `RULES.timing.auctionSeconds` (69 s) |

A timeout at the choose step passes the power. A timeout during an action step cancels it. Neither changes ownership or cash.

## Not implemented / known gaps

- Bomb expiry and repair (the spec mentions them; the engine does not implement them).
- Persistent power inventory across turns: powers resolve on the spot and are not held for later use.
- Mortgages and any other sale or buy-back transaction are not part of the power flow.
- The spec's visual references (screenshots / video) were not available in the repository, so the panel visuals have not been checked against them.

See `REALTIME_PROTOCOL.md` for the command and event shapes, and `GAME_RULES.md` for the turn flow.
