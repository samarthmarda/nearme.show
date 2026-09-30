# Scam City rules (configurable v1 draft)

Scam City is a social property strategy game on the exact 36-tile board in `BOARD.md`. The game supports 2–6 players. Purchase open cities, collect colour groups, develop completed groups, pay rivals rent and grow net worth. No taxes and no go-to-jail tile.

## Current values
- Starting cash by randomized turn order: $1,000 / $1,050 / $1,100 / $1,150 / $1,200 / $1,250.
- Pass or land on START: +$300.
- One six-sided die.
- Wealth Race target $5,000 and 30-round cap.
- Undeveloped city rent uses 1× / 1.5× / 2× for one/two/three group properties. Completed-group development uses 3× / 4× / 5× / 6× base rent at Hotel 1, Hotel 2, Hotel 3, Tower.
- The specified Standard city prices are centralized in `src/game/rules.ts`. City resale is 80% rounded to the nearest $5; development costs are 55% of each city's listed price, rounded to the nearest $5. Starting values for transport and utilities are still tuning placeholders.
- Transport rent is $30 per owned transport; utility rent is $25 per owned utility. These rates are configurable.
- Bank outcomes use configurable weights with the $250 reward weighted as rare. Travel selects a random board tile. Forward travel across START pays salary; backward movement does not. Bank movement currently resolves property rent only; nested Bank/Super Power/Jail destination effects are not implemented.

## Presets
QUICK: $3,000 / 20 rounds; STANDARD: $5,000 / 30; LONG: $7,000 / 40. The defaults exist in `PRESETS`; the current UI only presents the Standard configuration.

## Implemented MVP flow
Board movement, dice value validation, START salary, Bank outcomes, city purchase, rent/group calculation, development, net worth and round-cap winner are implemented. Shared rooms, hashed username/password accounts, friends/presence, chat, server-enforced turns and synchronized game commands are also implemented for the demo MVP. See `BALANCING.md` for simulator limitations/results.

Landing on either SUPER POWER tile grants one uniformly selected power using server-side secure randomness and continues the turn without a choice pause. Power activation effects, injury/recovery/debt settlement, player trades, and persistent game snapshots are not yet implemented. Power names and descriptions are design intent, not available gameplay actions in this MVP.

In non-production mode, the server seeds five shared demo logins (`ayush`, `chirag`, `aniket`, `rishi`, `sam`; password `scamcity`) and makes them mutual friends. These fixed shared credentials are intentionally not created when `NODE_ENV=production`.
