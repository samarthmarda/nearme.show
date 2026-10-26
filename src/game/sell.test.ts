import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applyGameCommand,
  calculateNetWorth,
  createGame,
  currentRent,
  roll,
  sellableIds,
  sellBlockReason,
  type GameState,
} from "./engine";
import { BOARD } from "./rules";

const tile = (id: string) => BOARD.find((t) => t.id === id)!;

/** p0 (turn holder) owns tile_01 (DELHI) and is on the roll phase. */
function ownedTable(): GameState {
  const state = createGame(["Red", "Blue", "Green"]);
  state.owners.tile_01 = "p0";
  state.players[0].properties.push("tile_01");
  return state;
}

test("the owner can sell their own property on their turn before rolling", () => {
  const before = ownedTable();
  const cashBefore = before.players[0].cash;
  const worthBefore = calculateNetWorth(before.players[0], before);
  const result = applyGameCommand(before, "p0", { type: "SELL_PROPERTY", propertyId: "tile_01" });
  assert.equal(result.error, undefined);
  const after = result.state;
  assert.equal(after.owners.tile_01, undefined, "property returns to the unowned pool");
  assert.deepEqual(after.players[0].properties, []);
  assert.equal(after.players[0].cash, cashBefore + (tile("tile_01").sellValue ?? 0));
  assert.equal(calculateNetWorth(after.players[0], after), worthBefore, "a sale is net-worth neutral");
  assert.equal(after.phase, "roll", "the turn stays with the seller");
  assert.equal(after.turn, 0);
  assert.equal(before.owners.tile_01, "p0", "the input state is not mutated");
  assert.equal(currentRent(after, "tile_01"), 10, "unowned rent falls back to the base rent");
});

test("only the owner can sell, and only on their own turn", () => {
  const state = ownedTable();
  // Rival with no property of their own cannot sell p0's tile.
  assert.match(sellBlockReason(state, "p1", "tile_01") ?? "", /Only the owner|own turn/);
  const rivalOwned = ownedTable();
  rivalOwned.owners.tile_03 = "p1";
  rivalOwned.players[1].properties.push("tile_03");
  assert.match(sellBlockReason(rivalOwned, "p0", "tile_03") ?? "", /do not own/);
  const refused = applyGameCommand(rivalOwned, "p1", { type: "SELL_PROPERTY", propertyId: "tile_03" });
  assert.ok(refused.error);
  assert.equal(refused.state, rivalOwned, "refused sale leaves state unchanged");
});

test("a sale is refused during a pending decision, a Super Power, or the wrong phase", () => {
  const state = ownedTable();
  state.phase = "decision";
  assert.match(sellBlockReason(state, "p0", "tile_01") ?? "", /before you roll/);
  state.phase = "power";
  assert.ok(applyGameCommand(state, "p0", { type: "SELL_PROPERTY", propertyId: "tile_01" }).error);
  state.phase = "finished";
  assert.ok(applyGameCommand(state, "p0", { type: "SELL_PROPERTY", propertyId: "tile_01" }).error);
});

test("a colour set with buildings cannot be sold piece by piece", () => {
  const state = ownedTable();
  state.owners.tile_02 = "p0";
  state.players[0].properties.push("tile_02");
  state.buildings.tile_02 = 1; // HYDERABAD (same colour set as DELHI)
  assert.match(sellBlockReason(state, "p0", "tile_01") ?? "", /buildings/);
  assert.ok(applyGameCommand(state, "p0", { type: "SELL_PROPERTY", propertyId: "tile_01" }).error);
});

test("unowned and non-property tiles cannot be sold", () => {
  const state = ownedTable();
  assert.ok(applyGameCommand(state, "p0", { type: "SELL_PROPERTY", propertyId: "tile_05" }).error);
  assert.ok(applyGameCommand(state, "p0", { type: "SELL_PROPERTY", propertyId: "tile_00" }).error);
  assert.ok(applyGameCommand(state, "p0", { type: "SELL_PROPERTY", propertyId: "tile_99" }).error);
});

test("sellableIds lists only the owner's sellable tiles on their turn", () => {
  const state = ownedTable();
  assert.deepEqual(sellableIds(state, "p0"), ["tile_01"]);
  assert.deepEqual(sellableIds(state, "p1"), []);
  state.phase = "decision";
  assert.deepEqual(sellableIds(state, "p0"), []);
});

test("a roll that lands on an unowned tile opens a decision; the sale waits for it to resolve", () => {
  const state = ownedTable();
  state.players[0].position = 0;
  const landed = roll(state, 5, () => 0).state; // tile_05, MUMBAI, unowned
  assert.equal(landed.phase, "decision");
  assert.match(sellBlockReason(landed, "p0", "tile_01") ?? "", /before you roll/);
  assert.ok(applyGameCommand(landed, "p0", { type: "SELL_PROPERTY", propertyId: "tile_01" }).error);
});
