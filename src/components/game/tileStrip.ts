/**
 * What the top value strip of a board tile shows.
 *
 * - Unowned purchasable tile: the purchase price, in the property-group colour.
 * - Owned tile: the current rent only, in the owner's colour.
 *   It never shows the purchase price or the word RENT.
 * - Tiles with no price (start, bank, jail, power, tax): no strip.
 *
 * Rent comes from the authoritative engine (`currentRent`); nothing is
 * hardcoded per tile.
 */
export type TileStrip =
  | { mode: "price"; amount: number }
  | { mode: "rent"; amount: number; ownerId: string };

export function tileStrip(
  tile: { price?: number },
  ownerId: string | null | undefined,
  currentRent: number,
): TileStrip | null {
  if (tile.price === undefined) return null;
  if (ownerId) return { mode: "rent", amount: currentRent, ownerId };
  return { mode: "price", amount: tile.price };
}
