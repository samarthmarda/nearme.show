# Scam City rules (V2)

Scam City is a social property strategy game on the 36-tile board documented in `BOARD.md`. The current board has 2–6 players. Buy open cities and businesses, collect colour groups, develop complete city sets, pay rent to rivals, and grow net worth. Property Tax is a $50 landing tile; Jail is a visit tile, with no Go To Jail tile.

## Economy and match setup

- Starting cash by randomized turn order: $1,000 / $1,050 / $1,100 / $1,150 / $1,200 / $1,250.
- Pass or land on START: +$300.
- One six-sided die.
- Wealth Race target $5,000 and 30-round cap.
- The SCAMCITY sheet is the source for per-property prices, sell values, rents, development costs/rents, mortgage/redemption values, and repair costs. These values are centralized in `src/game/rules.ts`.
- City group rents use each tile's exact solo / two-owned / full-group schedule. The listed Hotel 1, Hotel 2, Hotel 3, and Tower rents replace the group rent after development; a full three-city group is required to develop.
- G9 transport and G10 business rents also use the property's sheet schedule. See `PROPERTY_ECONOMY.md`.
- Mortgage, redemption, and repair values are displayed as data only; those transactions are not available actions in this implementation.
- Bank outcomes use configurable weights, with the $250 reward weighted as rare. Travel selects a random board tile. Forward travel across START pays salary; backward movement does not. Bank movement currently resolves property rent only; nested Bank/Super Power/Jail destination effects are not implemented.

## Dice and automatic turn flow

`ROLL → MOVE → RESOLVE LANDING → PENDING ACTIONS → NEXT PLAYER (or BONUS ROLL on a 6)`

- Rolls 1–5 finish the active player's rolling sequence after landing effects and any required property decision resolve. The server automatically passes the dice to the next player; there is no End Turn button or command.
- A roll of 6 gives that same player another legal roll, but only after landing effects and any required property decision resolve.
- An unowned purchasable tile pauses for BUY or PASS. Either choice automatically continues the sequence according to the roll value.
- Rent, Bank results, Property Tax, and Super Power interactions resolve before the turn continues. While a Super Power is pending, no roll is possible; the turn resumes only after it resolves, cancels, or times out.
- The server enforces active-player ownership, legal phases, and turn timeouts. An unanswered property choice times out as PASS and then follows the same automatic handoff/bonus-roll rule. An unanswered Super Power step times out as CANCEL.

## Presets

QUICK: $3,000 / 20 rounds; STANDARD: $5,000 / 30; LONG: $7,000 / 40. The defaults exist in `PRESETS`; the current UI presents the Standard configuration.

## Implemented MVP flow

Board movement, dice validation, START salary, Bank outcomes, Property Tax, property purchase, sheet-based rent/group calculation, development, net worth, automatic turn continuation, round-cap winner, open multiplayer rooms, hashed username/password accounts, friends/presence, chat, server-enforced turns, and synchronized game commands are implemented.

Landing on either SUPER POWER tile (`tile_15`, `tile_27`) opens a power choice for the landing player: BOMB, POWER SWAP, AUCTION, or RENT FREE ROUND, or CANCEL to pass. No power is granted at random or automatically. Powers are validated and resolved by the server; see `SUPER_POWERS.md` for each power's rules, timers, and the parts that are not yet implemented (bomb expiry, repair, and persistent power inventory). Persistent game snapshots are not yet implemented.

In non-production mode, the server seeds five shared demo logins (`ayush`, `chirag`, `aniket`, `rishi`, `sam`; password `scamcity`) and makes them mutual friends. These fixed shared credentials are intentionally not created when `NODE_ENV=production`.
