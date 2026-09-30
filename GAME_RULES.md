# Scam City rules (configurable v1 draft)

Scam City is a social property strategy game on the exact 36-tile board in `BOARD.md`. The game supports 2–6 players. Purchase open cities, collect colour groups, develop completed groups, pay rivals rent and grow net worth. No taxes and no go-to-jail tile.

## Current values
- Starting cash by randomized turn order: $1,000 / $1,050 / $1,100 / $1,150 / $1,200 / $1,250.
- Pass or land on START: +$300.
- One six-sided die.
- Wealth Race target $5,000 and 30-round cap.
- Undeveloped city rent uses 1× / 1.5× / 2× for one/two/three group properties. Completed-group development uses 3× / 4× / 5× / 6× base rent at Hotel 1, Hotel 2, Hotel 3, Tower.
- Prices, development cost ($150 in v1), transport and utility values are centralized in `src/game/rules.ts`. Purchase prices and several peripheral asset mechanics were not fixed by the prompt and remain balance placeholders.
- Bank offers configured cash and movement outcomes. Its result is selected by engine RNG; travel goes to a random transport tile. Forward travel across START pays salary; backward movement does not.

## Presets
QUICK: $3,000 / 20 rounds; STANDARD: $5,000 / 30; LONG: $7,000 / 40. The defaults exist in `PRESETS`; the current UI only presents the Standard configuration.

## Implemented in local engine slice
Board movement, dice value validation, START salary, Bank outcomes, city purchase, rent/group calculation, development, net worth and round-cap winner. See `BALANCING.md` for simulator limitations/results.

## Not yet implemented as production multiplayer mechanics
Secure accounts, shared rooms, server authority, trades/exchanges, social donation/friend validation, concession, all five Super Powers, injury/recovery/debt settlement, timers enforced by server, event sequencing and persistent game snapshots. They are documented as target product features, not represented as working services.
