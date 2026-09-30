# Property economy v1

City base rents are authoritative and configured on each city definition:

- Green: Delhi, Hyderabad, Mumbai — $10 each.
- Light Blue: Bangkok, Amsterdam, Singapore — $20 each.
- Pink: Jakarta, Berlin, Moscow — $25 each.
- Orange: Toronto, Seoul, Hong Kong — $30 each.
- Light Green: Zurich, Israel, Riyadh — $35 each.
- Gold: Iran, Saudi, Dubai — $40 each.
- Purple: Paris $40, London $45, Birmingham $55.
- Red: Chicago $60, California $65, New York $70.

Undeveloped group multipliers are 1×, 1.5×, 2× for one, two or three cities owned by that player. Completed-group development replaces those multipliers with levels 1–4 at 3×, 4×, 5×, 6× base rent. Condition multiplies rent by 100%, 75%, 50% or 25%. The engine's `rentFor` function is the single calculation path.

The specified Standard purchase prices are centralized in `src/game/rules.ts`. City liquidation is 80% of purchase price rounded to the nearest $5. Each development costs 55% of that property's purchase price, rounded to the nearest $5; buildings liquidate at 50% of development investment. Transport/utility purchase prices are retained from the existing prototype and remain tuning values. `rentFor` is the single rent calculation path; `calculateCityRent(propertyId, gameState)` exposes the state-based API.
