import { test } from "node:test";
import assert from "node:assert/strict";
import { addPlayer, build, buy, createGame, netWorth, passProperty, roll, rentFor } from "./engine";
import { BOARD, RULES } from "./rules";

test("the V2 board matches the 36 spaces and property groups in SCAMCITY", () => {
  assert.equal(BOARD.length, 36);
  assert.deepEqual(
    BOARD.map((tile) => tile.name),
    [
      "START",
      "DELHI",
      "HYDERABAD",
      "BANGKOK",
      "SEVEN-11",
      "MUMBAI",
      "BOAT",
      "SINGAPORE",
      "AMSTERDAM",
      "BANK",
      "JAKARTA",
      "RAILWAYS",
      "BERLIN",
      "MOSCOW",
      "TORONTO",
      "SUPER POWER",
      "SEOUL",
      "HONG KONG",
      "JAIL",
      "ZURICH",
      "ISRAEL",
      "RAVE CLUB",
      "RIYADH",
      "IRAN",
      "PROPERTY TAX",
      "SAUDI",
      "DUBAI",
      "SUPER POWER",
      "PARIS",
      "LONDON",
      "GYM",
      "BIRMINGHAM",
      "CHICAGO",
      "AIRPORT",
      "CALIFORNIA",
      "NEW YORK",
    ],
  );
  assert.deepEqual(
    BOARD.filter((tile) => tile.group === "green").map((tile) => tile.name),
    ["DELHI", "HYDERABAD", "MUMBAI"],
  );
  assert.deepEqual(
    BOARD.filter((tile) => tile.group === "G9").map((tile) => tile.name),
    ["BOAT", "RAILWAYS", "AIRPORT"],
  );
  assert.deepEqual(
    BOARD.filter((tile) => tile.group === "G10").map((tile) => tile.name),
    ["SEVEN-11", "RAVE CLUB", "GYM"],
  );
});

test("sheet values are authoritative for property value, sale, mortgage and development", () => {
  assert.equal(
    BOARD.every(
      (tile, index) => tile.id === `tile_${String(index).padStart(2, "0")}`,
    ),
    true,
  );
  const delhi = BOARD[1];
  assert.equal(delhi.price, 110);
  assert.equal(delhi.sellValue, 100);
  assert.equal(delhi.mortgageValue, 70);
  assert.equal(delhi.unmortgageCost, 80);
  assert.equal(delhi.developmentCost, 50);
  assert.equal(delhi.repairCost, 25);
  assert.deepEqual(delhi.rentSchedule, {
    one: 10,
    two: 20,
    three: 30,
    development: [50, 100, 150, 180],
  });
  assert.equal(BOARD[24].taxAmount, 50);
  assert.equal(RULES.salary, 300);
  assert.deepEqual(RULES.startingCashByOrder, [1000, 1050, 1100, 1150, 1200, 1250]);
});

test("players may join an active match without changing existing turn indexes", () => {
  const state = createGame(["A", "B"]);
  state.phase = "roll";
  state.turn = 1;
  const joined = addPlayer(state, " C ");
  assert.equal(joined.players.length, 3);
  assert.equal(joined.players[2].id, "p2");
  assert.equal(joined.players[2].name, "C");
  assert.equal(joined.players[2].cash, RULES.startingCashByOrder[2]);
  assert.equal(joined.turn, 1);
  assert.equal(state.players.length, 2);
  assert.equal(addPlayer(createGame(["A", "B", "C", "D", "E", "F"]), "G").players.length, 6);
});

test("a roll from 1 through 5 opens a required buy/pass choice before handoff", () => {
  const state = createGame(["A", "B"]);
  const rolled = roll(state, 1).state;
  assert.equal(rolled.players[0].position, 1);
  assert.equal(rolled.lastRoll, 1);
  assert.equal(rolled.phase, "decision");
  assert.equal(rolled.turn, 0);

  const passed = passProperty(rolled);
  assert.equal(passed.phase, "roll");
  assert.equal(passed.turn, 1);
  assert.equal(passed.lastRoll, null);
  assert.match(passed.message, /B's turn/);
});

test("buying an unowned property resolves the landing and automatically passes the turn", () => {
  const rolled = roll(createGame(["A", "B"]), 1).state;
  const purchased = buy(rolled);
  assert.equal(purchased.owners.tile_01, "p0");
  assert.equal(purchased.players[0].cash, 890);
  assert.equal(purchased.phase, "roll");
  assert.equal(purchased.turn, 1);
  assert.equal(purchased.lastRoll, null);
  assert.equal(rolled.owners.tile_01, undefined);
});

test("rolling a 6 onto an open property waits for the required choice, then keeps the same player", () => {
  const rolled = roll(createGame(["A", "B"]), 6).state;
  assert.equal(rolled.players[0].position, 6);
  assert.equal(rolled.phase, "decision");
  assert.equal(rolled.turn, 0);
  assert.equal(rolled.lastRoll, 6);

  const passed = passProperty(rolled);
  assert.equal(passed.phase, "roll");
  assert.equal(passed.turn, 0);
  assert.equal(passed.lastRoll, 6);
  assert.match(passed.message, /rolled a 6/);
});

test("a power landing resolves before the automatic next-player handoff", () => {
  const state = createGame(["A", "B"]);
  state.players[0].position = 14;
  const result = roll(state, 1, () => 0).state;
  assert.equal(result.players[0].position, 15);
  assert.deepEqual(result.players[0].powers, ["bomb"]);
  assert.equal(result.phase, "roll");
  assert.equal(result.turn, 1);
  assert.equal(result.lastRoll, null);
  assert.match(result.message, /B's turn/);
  assert.match(result.activity[1], /received BOMB/);
});

test("an ordinary resolved landing hands the dice to the next player automatically", () => {
  const state = createGame(["A", "B"]);
  state.players[0].position = 1;
  state.owners.tile_02 = "p1";
  const result = roll(state, 1).state;
  assert.equal(result.players[0].cash, 990);
  assert.equal(result.players[1].cash, 1060);
  assert.equal(result.turn, 1);
  assert.equal(result.phase, "roll");
  assert.equal(result.lastRoll, null);
  assert.deepEqual(result.lastLanding, { playerId: "p0", tileId: "tile_02", roll: 1 });
  assert.match(result.activity[1], /paid \$10 rent/);
});

test("a 6 on an already-owned property resolves rent, then leaves the same player active", () => {
  const state = createGame(["A", "B"]);
  state.owners.tile_06 = "p1";
  const result = roll(state, 6).state;
  assert.equal(result.turn, 0);
  assert.equal(result.phase, "roll");
  assert.equal(result.lastRoll, 6);
  assert.equal(result.players[0].cash, 965);
  assert.equal(result.players[1].cash, 1085);
  assert.match(result.message, /rolled a 6/);
  assert.match(result.activity[1], /paid \$35 rent/);
});

test("passing START pays the configured salary and still waits for a required property choice", () => {
  const state = createGame(["A", "B"]);
  state.players[0].position = 34;
  const rolled = roll(state, 4).state;
  assert.equal(rolled.players[0].position, 2);
  assert.equal(rolled.players[0].cash, 1300);
  assert.equal(rolled.phase, "decision");
  assert.deepEqual(rolled.lastLanding, { playerId: "p0", tileId: "tile_02", roll: 4 });
  const passed = passProperty(rolled);
  assert.equal(passed.turn, 1);
  assert.equal(passed.players[0].cash, 1300);
});

test("Bank outcomes are server-selected and the turn auto-advances after resolution", () => {
  const state = createGame(["A", "B"]);
  state.players[0].position = 6;
  const result = roll(state, 3, () => 0).state;
  assert.equal(result.players[0].position, 9);
  assert.equal(result.players[0].cash, 1150);
  assert.equal(result.turn, 1);
  assert.equal(result.phase, "roll");
  assert.match(result.activity[1], /got \$150/);
});

test("the $50 Property Tax landing fee resolves before the dice pass", () => {
  const state = createGame(["A", "B"]);
  state.players[0].position = 23;
  const result = roll(state, 1).state;
  assert.equal(result.players[0].position, 24);
  assert.equal(result.players[0].cash, 950);
  assert.equal(result.turn, 1);
  assert.equal(result.phase, "roll");
  assert.match(result.activity[1], /paid \$50 property tax/);
});

test("a Super Power award resolves before a bonus roll", () => {
  const state = createGame(["A", "B"]);
  state.players[0].position = 9;
  const landed = roll(state, 6, () => 0).state;
  assert.equal(landed.players[0].position, 15);
  assert.equal(landed.phase, "roll");
  assert.equal(landed.turn, 0);
  assert.equal(landed.lastRoll, 6);
  assert.deepEqual(landed.players[0].powers, ["bomb"]);
});

test("purchases use spreadsheet prices and insufficient funds fail safely", () => {
  const rolled = roll(createGame(["A", "B"]), 1).state;
  const purchased = buy(rolled);
  assert.equal(purchased.owners.tile_01, "p0");
  assert.equal(purchased.players[0].cash, 890);

  const poor = createGame(["A", "B"]);
  poor.players[0].cash = 20;
  const poorLanding = roll(poor, 1).state;
  assert.equal(buy(poorLanding), poorLanding);
});

test("city rents use the exact sheet schedule for single, double and complete groups", () => {
  const state = createGame(["A", "B"]);
  const owner = state.players[0];
  state.owners.tile_01 = "p0";
  assert.equal(rentFor(state, BOARD[1], owner), 10);
  state.owners.tile_02 = "p0";
  assert.equal(rentFor(state, BOARD[1], owner), 20);
  state.owners.tile_05 = "p0";
  assert.equal(rentFor(state, BOARD[1], owner), 30);

  state.buildings.tile_01 = 1;
  assert.equal(rentFor(state, BOARD[1], owner), 50);
  state.buildings.tile_01 = 2;
  assert.equal(rentFor(state, BOARD[1], owner), 100);
  state.buildings.tile_01 = 3;
  assert.equal(rentFor(state, BOARD[1], owner), 150);
  state.buildings.tile_01 = 4;
  assert.equal(rentFor(state, BOARD[1], owner), 180);
});

test("property-specific group and development rents are not generic multipliers", () => {
  const state = createGame(["A", "B"]);
  const owner = state.players[0];
  state.owners.tile_10 = "p0";
  state.owners.tile_12 = "p0";
  assert.equal(rentFor(state, BOARD[10], owner), 35);
  state.owners.tile_13 = "p0";
  assert.equal(rentFor(state, BOARD[10], owner), 45);
  state.buildings.tile_10 = 1;
  assert.equal(rentFor(state, BOARD[10], owner), 105);

  state.owners.tile_32 = "p0";
  state.owners.tile_34 = "p0";
  state.owners.tile_35 = "p0";
  assert.equal(rentFor(state, BOARD[34], owner), 120);
  state.buildings.tile_34 = 1;
  assert.equal(rentFor(state, BOARD[34], owner), 440);
});

test("G9 and G10 assets use their own exact count-based rent schedules", () => {
  const state = createGame(["A", "B"]);
  const owner = state.players[0];
  state.owners.tile_06 = "p0";
  assert.equal(rentFor(state, BOARD[6], owner), 35);
  state.owners.tile_11 = "p0";
  assert.equal(rentFor(state, BOARD[6], owner), 70);
  state.owners.tile_33 = "p0";
  assert.equal(rentFor(state, BOARD[6], owner), 140);
  assert.equal(rentFor(state, BOARD[33], owner), 200);

  state.owners.tile_04 = "p0";
  state.owners.tile_21 = "p0";
  state.owners.tile_30 = "p0";
  assert.equal(rentFor(state, BOARD[4], owner), 200);
  assert.equal(rentFor(state, BOARD[21], owner), 200);
});

test("development requires the complete city group and charges the sheet's building cost", () => {
  const state = createGame(["A", "B"]);
  state.owners.tile_01 = "p0";
  state.players[0].properties.push("tile_01");
  assert.equal(build(state, "tile_01"), state);

  state.owners.tile_02 = "p0";
  state.owners.tile_05 = "p0";
  state.players[0].properties.push("tile_02", "tile_05");
  const built = build(state, "tile_01");
  assert.equal(built.buildings.tile_01, 1);
  assert.equal(built.players[0].cash, 950);
  assert.equal(build(built, "tile_01").buildings.tile_01, 2);
});

test("net worth uses exact sell price and round advances only on automatic handoff", () => {
  const rolled = roll(createGame(["A", "B"]), 1).state;
  const purchased = buy(rolled);
  assert.equal(netWorth(purchased, purchased.players[0]), 990);
  assert.equal(purchased.turn, 1);
  assert.equal(purchased.round, 1);

  const state = createGame(["A", "B"]);
  state.turn = 1;
  state.players[1].position = 0;
  const next = passProperty(roll(state, 1).state);
  assert.equal(next.turn, 0);
  assert.equal(next.round, 2);
});
