import { test } from "node:test";
import assert from "node:assert/strict";
import { applyGameCommand, createGame, currentRent } from "../../game/engine";
import { BOARD } from "../../game/rules";
import { tileStrip } from "./tileStrip";

test("an unowned property shows its purchase price in the strip", () => {
  const delhi = BOARD.find((t) => t.id === "tile_01")!;
  assert.deepEqual(tileStrip(delhi, undefined, 0), { mode: "price", amount: delhi.price });
});

test("an owned property shows only its current rent, never the price", () => {
  const delhi = BOARD.find((t) => t.id === "tile_01")!;
  const strip = tileStrip(delhi, "p1", 10);
  assert.deepEqual(strip, { mode: "rent", amount: 10, ownerId: "p1" });
  assert.notEqual(strip?.amount, delhi.price, "rent is not the purchase price");
});

test("tiles without a price have no strip", () => {
  const start = BOARD.find((t) => t.id === "tile_00")!;
  assert.equal(tileStrip(start, undefined, 0), null);
});

test("the owned-tile rent comes from the engine and changes with the colour set", () => {
  const state = createGame(["A", "B", "C"]);
  state.owners.tile_01 = "p0";
  state.players[0].properties.push("tile_01");
  const alone = currentRent(state, "tile_01");
  state.owners.tile_02 = "p0";
  state.players[0].properties.push("tile_02");
  const paired = currentRent(state, "tile_01");
  assert.ok(paired > alone, "owning the colour set raises the strip's rent");
  const delhi = BOARD.find((t) => t.id === "tile_01")!;
  assert.equal(tileStrip(delhi, "p0", paired)?.amount, paired);
  // Sale would remove the rent from the strip; the owner's sale is valid on their turn.
  assert.equal(applyGameCommand(state, "p0", { type: "SELL_PROPERTY", propertyId: "tile_01" }).error, undefined);
});
