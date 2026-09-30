# Scam City board v1

The authoritative `BOARD` array is in `src/game/rules.ts`. It contains exactly 36 clockwise spaces; index is position. Exact city, tile and group sequence from product rules is preserved.

| Index | Tile | Kind / group |
|---:|---|---|
| 00 | START | start |
| 01 | DELHI | Green |
| 02 | HYDERABAD | Green |
| 03 | BANGKOK | Light Blue |
| 04 | BOAT | transport |
| 05 | MUMBAI | Green |
| 06 | SUPER POWER | power |
| 07 | SINGAPORE | Light Blue |
| 08 | AMSTERDAM | Light Blue |
| 09 | BANK | bank |
| 10 | JAKARTA | Pink |
| 11 | RAILWAYS | transport |
| 12 | BERLIN | Pink |
| 13 | MOSCOW | Pink |
| 14 | TORONTO | Orange |
| 15 | BUS | transport |
| 16 | SEOUL | Orange |
| 17 | HONG KONG | Orange |
| 18 | JAIL | jail |
| 19 | ZURICH | Light Green |
| 20 | ISRAEL | Light Green |
| 21 | ELECTRICITY | utility |
| 22 | RIYADH | Light Green |
| 23 | IRAN | Gold |
| 24 | OIL MILL | utility |
| 25 | SAUDI | Gold |
| 26 | DUBAI | Gold |
| 27 | SUPER POWER | power |
| 28 | PARIS | Purple |
| 29 | LONDON | Purple |
| 30 | NIAGARA WATER | utility |
| 31 | BIRMINGHAM | Purple |
| 32 | CHICAGO | Red |
| 33 | AIRPORT | transport |
| 34 | CALIFORNIA | Red |
| 35 | NEW YORK | Red |

No tax or go-to-jail tile is part of the board. Prices and non-city rents are initial tunable values in the same board definitions. City base rents match `PROPERTY_ECONOMY.md`.
