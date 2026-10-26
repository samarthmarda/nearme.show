# Scam City board V2

The authoritative `BOARD` array is in `src/game/rules.ts`. It contains 36 clockwise tiles and follows the current SCAMCITY sheet. Tile IDs are stable: the two-digit suffix is the clockwise board index.

| Index | Tile | Kind / group |
|---:|---|---|
| 00 | START | start |
| 01 | DELHI | Green city |
| 02 | HYDERABAD | Green city |
| 03 | BANGKOK | Light Blue city |
| 04 | SEVEN-11 | G10 business |
| 05 | MUMBAI | Green city |
| 06 | BOAT | G9 transport |
| 07 | SINGAPORE | Light Blue city |
| 08 | AMSTERDAM | Light Blue city |
| 09 | BANK | bank |
| 10 | JAKARTA | Pink city |
| 11 | RAILWAYS | G9 transport |
| 12 | BERLIN | Pink city |
| 13 | MOSCOW | Pink city |
| 14 | TORONTO | Orange city |
| 15 | SUPER POWER | power |
| 16 | SEOUL | Orange city |
| 17 | HONG KONG | Orange city |
| 18 | JAIL | jail |
| 19 | ZURICH | Light Green city |
| 20 | ISRAEL | Light Green city |
| 21 | RAVE CLUB | G10 business |
| 22 | RIYADH | Light Green city |
| 23 | IRAN | Gold city |
| 24 | PROPERTY TAX | fixed $50 landing fee |
| 25 | SAUDI | Gold city |
| 26 | DUBAI | Gold city |
| 27 | SUPER POWER | power |
| 28 | PARIS | Purple city |
| 29 | LONDON | Purple city |
| 30 | GYM | G10 business |
| 31 | BIRMINGHAM | Purple city |
| 32 | CHICAGO | Red city |
| 33 | AIRPORT | G9 transport |
| 34 | CALIFORNIA | Red city |
| 35 | NEW YORK | Red city |

City ownership groups are Green, Light Blue, Pink, Orange, Light Green, Gold, Purple, and Red. G9 (Boat, Railways, Airport) and G10 (Seven-11, Rave Club, Gym) are three-asset groups with their own sheet-specified rent tiers; they are not developable city sets. The Property Tax tile charges $50. Jail is a visit tile; there is no Go To Jail tile.

Every property tile displays its group strip, value, owner marker, and any development indicator. Tap a tile to inspect the sheet's value, rent schedule, sell price, development costs, and owner. A landing is highlighted on the board and echoed in the center status panel.

## Super Power spaces

`tile_15` and `tile_27` are SUPER POWER. Landing on either opens the power choice (see `SUPER_POWERS.md`). The BOMB missile originates from `tile_20` (ISRAEL) in the centre-board animation.
