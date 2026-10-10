# Property economy V2

`src/game/rules.ts` is the authoritative property table transcribed from the current SCAMCITY sheet. Purchase value, sell price, mortgage value, redemption cost, base rent, group rents, development costs, rents at each development level, and repair costs are stored per tile. The UI reads these values directly; it does not derive sale prices or rent tiers from generic multipliers.

## City rent tiers

| Group | Solo base rents | Any 2 in group | Full 3-property group | Build cost | Hotel 1 | Hotel 2 | Hotel 3 | Tower | Repair |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Green | $10 each | $20 | $30 | $50 | $50 | $100 | $150 | $180 | $25 |
| Light Blue | $15 each | $30 | $45 | $70 | $90 | $135 | $195 | $295 | $35 |
| Pink | $20 each | $35 | $45 | $90 | $105 | $195 | $295 | $375 | $45 |
| Orange | $30 each | $40 | $55 | $120 | $130 | $240 | $360 | $440 | $60 |
| Light Green | $35 each | $50 | $60 | $140 | $180 | $270 | $445 | $590 | $70 |
| Gold | $40 each | $60 | $80 | $170 | $210 | $355 | $505 | $720 | $90 |
| Purple | Paris $40, London $45, Birmingham $55 | $70 | $105 | $195 | $245 | $420 | $630 | $940 | $100 |
| Red | Chicago $60, California $65, New York $70 | $80 | $120 | $225 | Chicago $330; California/New York $440 | $660 | $880 | $1,120 | $110 |

For a city without development, the engine uses the exact solo, two-owned, or complete-group value from that property's schedule. Once built, the property's exact Hotel/Tower rent replaces the group tier. A full three-city group is required to build, and each build uses that property's listed cost. There are four development levels: Hotel 1, Hotel 2, Hotel 3, and Tower.

## G9 and G10 rents

| Group | Property | Value | Sell price | Mortgage | Redeem | Rent at 1 | Rent at 2 | Rent at 3 |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| G9 | Boat | $150 | $150 | $100 | $110 | $35 | $70 | $140 |
| G9 | Railways | $150 | $150 | $100 | $110 | $35 | $70 | $140 |
| G9 | Airport | $200 | $200 | $140 | $160 | $50 | $100 | $200 |
| G10 | Seven-11 | $200 | $200 | $140 | $160 | $50 | $100 | $200 |
| G10 | Rave Club | $150 | $150 | $100 | $110 | $50 | $100 | $200 |
| G10 | Gym | $200 | $200 | $140 | $160 | $50 | $100 | $200 |

G9/G10 have no house or hotel levels. Their rent follows each asset's sheet row and the count of G9/G10 assets owned by the same player.

## Other economy rules

- Passing or landing on START pays $300.
- Property sale values are the explicit sheet values. Net worth counts cash, sale value, and 50% of development investment, less debt.
- The Property Tax tile charges $50 to the bank.
- Property condition multipliers remain 100%, 75%, 50%, or 25%; `rentFor` is the single rent-calculation path and applies condition after the exact sheet tier.
- Mortgage, redemption, and repair prices are visible data. Mortgage, redemption, and repair transactions are not currently offered as gameplay actions, so the UI does not present buttons for them.
