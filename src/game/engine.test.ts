import { test } from "node:test";
import assert from "node:assert/strict";
import { BANK_CUES } from "./bankCues";
import {
  addPlayer,
  applyBankCueById,
  applyGameCommand,
  build,
  buildBlockReason,
  buy,
  choosePower,
  createGame,
  currentRent,
  forfeitPlayer,
  housesInUse,
  isPlayerBankrupt,
  mortgageBlockReason,
  mortgageProperty,
  netWorth,
  passProperty,
  payJailBail,
  rentFor,
  repairProperty,
  resolveTurnTimeout,
  roll,
  skipJailTurn,
  unmortgageProperty,
} from "./engine";
import { BOARD, DEFAULT_PRIVATE_SETTINGS, RULES } from "./rules";

test("the board matches all 36 spaces and property groups in landlords.xlsx", () => {
  assert.equal(BOARD.length, 36);
  assert.deepEqual(
    BOARD.map((tile) => tile.name),
    [
      "START",
      "DELHI",
      "HYDERABAD",
      "SEVEN-11",
      "MUMBAI",
      "BANGKOK",
      "BOAT",
      "SINGAPORE",
      "AMSTERDAM",
      "BANK",
      "JAKARTA",
      "RAILWAYS",
      "BERLIN",
      "MOSCOW",
      "TORONTO",
      "SEOUL",
      "SUPER POWER",
      "HONG KONG",
      "JAIL",
      "SYRIA",
      "ISRAEL",
      "RAVE CLUB",
      "RIYADH",
      "IRAN",
      "PROPERTY TAX",
      "SAUDI",
      "DUBAI",
      "BANK",
      "PARIS",
      "LONDON",
      "GYM",
      "CALIFORNIA",
      "CHICAGO",
      "AIRPORT",
      "SUPER POWER",
      "NEW YORK",
    ],
  );
  assert.deepEqual(
    BOARD.filter((tile) => tile.group === "green").map((tile) => tile.name),
    ["DELHI", "HYDERABAD", "MUMBAI"],
  );
  assert.deepEqual(
    BOARD.filter((tile) => tile.group === "purple").map((tile) => tile.name),
    ["PARIS", "LONDON"],
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

test("landlords.xlsx values are authoritative for property value, sale, mortgage, syria, paris/london, and defaults", () => {
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

  // MUMBAI broken Excel formula fixed to $70 mortgage
  const mumbai = BOARD[4];
  assert.equal(mumbai.name, "MUMBAI");
  assert.equal(mumbai.mortgageValue, 70);

  // SYRIA at tile_19 uses Row 31 stats
  const syria = BOARD[19];
  assert.equal(syria.name, "SYRIA");
  assert.equal(syria.price, 255);
  assert.equal(syria.sellValue, 210);

  assert.equal(BOARD[24].taxAmount, 50);
  assert.equal(RULES.salary, 300);
  assert.deepEqual(
    RULES.startingCashByOrder,
    [1000, 1050, 1100, 1150, 1200, 1250],
  );
  assert.deepEqual(DEFAULT_PRIVATE_SETTINGS, {
    mode: "LIVE",
    maxPlayers: 2,
    roundLimit: null,
    targetNetWorth: 7000,
  });
});

test("players may join an active match up to maxPlayers without changing existing turn indexes", () => {
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
  assert.equal(
    addPlayer(createGame(["A", "B", "C", "D", "E", "F"]), "G").players.length,
    6,
  );

  // Private room configured for 2 maxPlayers blocks a 3rd player
  const twoSeat = createGame(["A", "B"], { maxPlayers: 2 });
  assert.equal(addPlayer(twoSeat, "C").players.length, 2);
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

test("landing on Super Power waits for the player's choice before the turn resumes", () => {
  const state = createGame(["A", "B"]);
  state.players[0].position = 15;
  const landed = roll(state, 1, () => 0).state;
  assert.equal(landed.players[0].position, 16);
  assert.equal(landed.phase, "power");
  assert.equal(landed.turn, 0);
  assert.deepEqual(landed.players[0].powers, []);
  assert.equal(landed.powerInteraction?.step, "CHOOSE");

  const chosen = choosePower(landed, "rent-free");
  assert.equal(chosen.phase, "roll");
  assert.equal(chosen.turn, 1);
  assert.equal(chosen.lastRoll, null);
  assert.deepEqual(chosen.players[0].powers, ["rent-free"]);
  assert.match(chosen.message, /B's turn/);
  assert.match(chosen.activity[1], /activated RENT FREE ROUND/);
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
  assert.deepEqual(result.lastLanding, {
    playerId: "p0",
    tileId: "tile_02",
    roll: 1,
  });
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

test("passing START pays the configured $300 salary and still waits for a required property choice", () => {
  const state = createGame(["A", "B"]);
  state.players[0].position = 34;
  const rolled = roll(state, 4).state;
  assert.equal(rolled.players[0].position, 2);
  assert.equal(rolled.players[0].cash, 1300);
  assert.equal(rolled.phase, "decision");
  assert.deepEqual(rolled.lastLanding, {
    playerId: "p0",
    tileId: "tile_02",
    roll: 4,
  });
  const passed = passProperty(rolled);
  assert.equal(passed.turn, 1);
  assert.equal(passed.players[0].cash, 1300);
});

test("Bank outcomes draw from the 69-card deck and auto-advance after resolution", () => {
  const state = createGame(["A", "B"]);
  state.players[0].position = 6;
  // rng = () => 0 selects BANK_CUES[0] (Cue #01: Pay $50 to Bank)
  const result = roll(state, 3, () => 0).state;
  assert.equal(result.players[0].position, 9);
  assert.equal(result.players[0].cash, 950);
  assert.equal(result.lastBankCue?.id, "01");
  assert.equal(result.turn, 1);
  assert.equal(result.phase, "roll");
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

test("a Super Power choice resolves before a bonus roll", () => {
  const state = createGame(["A", "B"]);
  state.players[0].position = 10;
  const landed = roll(state, 6, () => 0).state;
  assert.equal(landed.players[0].position, 16);
  assert.equal(landed.phase, "power");
  assert.equal(landed.turn, 0);
  assert.equal(landed.lastRoll, 6);

  const chosen = choosePower(landed, "rent-free");
  assert.equal(chosen.phase, "roll");
  assert.equal(chosen.turn, 0);
  assert.equal(chosen.lastRoll, 6);
  assert.match(chosen.message, /rolled a 6/);
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

test("city rents use the exact sheet schedule for single, double, 2-city purple, and 3-city groups", () => {
  const state = createGame(["A", "B"]);
  const owner = state.players[0];
  state.owners.tile_01 = "p0";
  assert.equal(rentFor(state, BOARD[1], owner), 10);
  state.owners.tile_02 = "p0";
  assert.equal(rentFor(state, BOARD[1], owner), 20);
  state.owners.tile_04 = "p0"; // MUMBAI completes green set
  assert.equal(rentFor(state, BOARD[1], owner), 30);

  state.buildings.tile_01 = 1;
  assert.equal(rentFor(state, BOARD[1], owner), 50);
  state.buildings.tile_01 = 2;
  assert.equal(rentFor(state, BOARD[1], owner), 100);
  state.buildings.tile_01 = 3;
  assert.equal(rentFor(state, BOARD[1], owner), 150);
  state.buildings.tile_01 = 4;
  assert.equal(rentFor(state, BOARD[1], owner), 180);

  // 2-city Purple set: PARIS (tile_28) + LONDON (tile_29)
  state.owners.tile_28 = "p0";
  assert.equal(rentFor(state, BOARD[28], owner), 40);
  state.owners.tile_29 = "p0";
  assert.equal(rentFor(state, BOARD[28], owner), 90);
  assert.equal(rentFor(state, BOARD[29], owner), 90);
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

  // Red set: CALIFORNIA (tile_31), CHICAGO (tile_32), NEW YORK (tile_35)
  state.owners.tile_31 = "p0";
  state.owners.tile_32 = "p0";
  state.owners.tile_35 = "p0";
  assert.equal(rentFor(state, BOARD[31], owner), 120);
  state.buildings.tile_31 = 1;
  assert.equal(rentFor(state, BOARD[31], owner), 440);
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

  // G10: SEVEN-11 (tile_03), RAVE CLUB (tile_21), GYM (tile_30) -> 50 / 120 / 200
  state.owners.tile_03 = "p0";
  assert.equal(rentFor(state, BOARD[3], owner), 50);
  state.owners.tile_21 = "p0";
  assert.equal(rentFor(state, BOARD[3], owner), 120);
  state.owners.tile_30 = "p0";
  assert.equal(rentFor(state, BOARD[3], owner), 200);
  assert.equal(rentFor(state, BOARD[30], owner), 200);
});

test("development enforces complete group, even-building across peers, and the 29-house Bank pool", () => {
  let state = createGame(["A", "B"], { targetNetWorth: 7000 });
  state.players[0].cash = 2000;
  state.owners.tile_01 = "p0";
  state.players[0].properties.push("tile_01");
  assert.equal(build(state, "tile_01"), state);

  // Complete green set: tile_01 (DELHI), tile_02 (HYDERABAD), tile_04 (MUMBAI)
  state.owners.tile_02 = "p0";
  state.owners.tile_04 = "p0";
  state.players[0].properties.push("tile_02", "tile_04");

  state = build(state, "tile_01");
  assert.equal(state.buildings.tile_01, 1);
  assert.equal(state.players[0].cash, 1950);

  // Even-building rule: cannot build H2 on tile_01 while tile_02 and tile_04 are at H0
  assert.match(buildBlockReason(state, "p0", "tile_01") ?? "", /Build evenly/i);
  assert.equal(build(state, "tile_01"), state);

  state = build(state, "tile_02");
  state = build(state, "tile_04");
  assert.equal(buildBlockReason(state, "p0", "tile_01"), null);
  state = build(state, "tile_01");
  assert.equal(state.buildings.tile_01, 2);

  // 29-house cap: when 29 houses are in use across the board, building another house is blocked,
  // but upgrading a 3-house property to a Tower frees 3 houses back to the Bank!
  const capState = createGame(["A", "B"], { targetNetWorth: 7000 });
  capState.players[0].cash = 1000;
  for (const id of ["tile_01", "tile_02", "tile_04", "tile_28", "tile_29"]) {
    capState.owners[id] = "p0";
    capState.players[0].properties.push(id);
  }
  capState.buildings = {
    tile_01: 3,
    tile_02: 3,
    tile_04: 3,
    tile_05: 3,
    tile_07: 3,
    tile_08: 3,
    tile_10: 3,
    tile_12: 3,
    tile_13: 3,
    tile_28: 1,
    tile_29: 1,
  };
  assert.equal(housesInUse(capState), 29);
  assert.match(
    buildBlockReason(capState, "p0", "tile_28") ?? "",
    /No houses left in the Bank \(29 max\)/i,
  );
  // Upgrading tile_01 from H3 -> Tower (level 4) succeeds and frees 3 houses (29 -> 26)!
  const towered = build(capState, "tile_01");
  assert.equal(towered.buildings.tile_01, 4);
  assert.equal(housesInUse(towered), 26);
  assert.equal(buildBlockReason(towered, "p0", "tile_28"), null);
});

test("mortgage, redeem, and immediate bomb repair follow authoritative rules", () => {
  let state = createGame(["A", "B"]);
  state.owners.tile_01 = "p0";
  state.players[0].properties.push("tile_01");

  // Mortgage DELHI (+$70) -> $0 rent while mortgaged
  const mortRes = mortgageProperty(state, "p0", "tile_01");
  assert.equal(mortRes.error, undefined);
  state = mortRes.state;
  assert.equal(state.mortgaged.tile_01, true);
  assert.equal(state.players[0].cash, 1070);
  assert.equal(currentRent(state, "tile_01"), 0);

  // Redeem DELHI (-$80) -> restores rent ($10)
  const unmortRes = unmortgageProperty(state, "p0", "tile_01");
  assert.equal(unmortRes.error, undefined);
  state = unmortRes.state;
  assert.equal(Boolean(state.mortgaged.tile_01), false);
  assert.equal(state.players[0].cash, 990);
  assert.equal(currentRent(state, "tile_01"), 10);

  // Cannot mortgage when colour group has a building
  state.owners.tile_02 = "p0";
  state.owners.tile_04 = "p0";
  state.buildings.tile_02 = 1;
  assert.match(
    mortgageBlockReason(state, "p0", "tile_01") ?? "",
    /buildings/i,
  );

  // Immediate Bomb repair on owner's turn restores halved rent
  delete state.buildings.tile_02;
  state.bombs.push({
    id: "b1",
    propertyId: "tile_01",
    byPlayerId: "p1",
    round: 1,
    repairCost: 25,
  });
  assert.equal(currentRent(state, "tile_01"), 15); // 30 halved -> 15
  const repaired = repairProperty(state, "p0", "tile_01");
  assert.equal(repaired.error, undefined);
  assert.equal(repaired.state.bombs.length, 0);
  assert.equal(currentRent(repaired.state, "tile_01"), 30);
  assert.equal(repaired.state.players[0].cash, 965);
});

test("all 69 Bank cue cards exist and execute cleanly without recursive loops", () => {
  assert.equal(BANK_CUES.length, 69);
  const seenIds = new Set<string>();
  for (let i = 0; i < BANK_CUES.length; i++) {
    const cue = BANK_CUES[i];
    assert.equal(cue.id, String(i + 1).padStart(2, "0"));
    assert.ok(cue.description.length > 5);
    seenIds.add(cue.id);

    // Execute every single cue against a populated 4-player board
    const g = createGame(["P1", "P2", "P3", "P4"]);
    g.players[0].position = 27; // Second BANK tile so forward wraps & backward moves get exercised
    g.owners.tile_01 = "p0";
    g.players[0].properties.push("tile_01");
    g.buildings.tile_01 = 2;
    g.owners.tile_02 = "p0";
    g.players[0].properties.push("tile_02");
    g.buildings.tile_02 = 4; // Tower
    g.owners.tile_10 = "p1";
    g.players[1].properties.push("tile_10");

    const after = applyBankCueById(g, cue.id);
    assert.equal(after.lastBankCue?.id, cue.id);
    assert.ok(after.notifications.length > 0);
  }
  assert.equal(seenIds.size, 69);
});

test("Bank Cues 06/61 (Jail), 64 (Controlled Roll), 68 (Power Swap), and movement START pass work accurately", () => {
  // Cue 06 sends player to Jail without START salary even from tile_27, and cancels bonus roll on 6
  const baseJail = createGame(["A", "B"]);
  baseJail.players[0].position = 21;
  // Roll 6 onto tile_27 (BANK) drawing Cue #06 (index 5: rng(69) -> 5)
  const jailed = roll(baseJail, 6, () => 5).state;
  assert.equal(jailed.players[0].position, 18);
  assert.equal(jailed.players[0].jailed, true);
  assert.equal(jailed.players[0].cash, 1000); // No START bonus when sent to Jail!
  assert.equal(jailed.turn, 1); // Bonus roll cancelled when jailed!

  // On A's next turn in Jail: A cannot roll directly, can pay $150 bail or skip 1 turn
  jailed.turn = 0;
  assert.ok(applyGameCommand(jailed, "p0", { type: "ROLL" }).error);
  const bailed = payJailBail(jailed);
  assert.equal(bailed.error, undefined);
  assert.equal(bailed.state.players[0].jailed, false);
  assert.equal(bailed.state.players[0].cash, 850);
  assert.equal(bailed.state.turn, 0); // Can roll immediately after paying bail!

  const skipped = skipJailTurn(jailed);
  assert.equal(skipped.error, undefined);
  assert.equal(skipped.state.players[0].jailed, false);
  assert.equal(skipped.state.turn, 1); // Served 1 turn -> passes turn

  // Landing normally on tile_18 (JAIL) is Just Visiting
  const visitor = createGame(["A", "B"]);
  visitor.players[0].position = 17;
  const visited = roll(visitor, 1).state;
  assert.equal(visited.players[0].position, 18);
  assert.equal(visited.players[0].jailed, false);
  assert.equal(visited.turn, 1);

  // Cue 64 grants 1 Controlled Roll; player chooses exact die face 5, consuming it
  let ctrl = createGame(["A", "B"]);
  ctrl = applyBankCueById(ctrl, "64");
  assert.equal(ctrl.players[0].controlledRolls, 1);
  ctrl.turn = 0;
  ctrl.phase = "roll";
  const picked = applyGameCommand(ctrl, "p0", {
    type: "ROLL",
    controlledValue: 5,
  });
  assert.equal(picked.error, undefined);
  assert.equal(picked.state.players[0].position, 5);
  assert.equal(picked.state.players[0].controlledRolls, 0);
  // Spoofing controlledValue without Cue 64 is rejected
  const spoof = applyGameCommand(createGame(["A", "B"]), "p0", {
    type: "ROLL",
    controlledValue: 6,
  });
  assert.ok(spoof.error);

  // Cue 68 opens immediate Power Swap when both sides own a property
  const swapBase = createGame(["A", "B"]);
  swapBase.owners.tile_01 = "p0";
  swapBase.players[0].properties.push("tile_01");
  swapBase.owners.tile_10 = "p1";
  swapBase.players[1].properties.push("tile_10");
  const swapTriggered = applyBankCueById(swapBase, "68");
  assert.equal(swapTriggered.phase, "power");
  assert.equal(swapTriggered.powerInteraction?.kind, "power-swap");
  assert.equal(swapTriggered.powerInteraction?.step, "SWAP_OPPONENT");
});

test("strict bankruptcy (-$500 allowed with assets, -$501 or NW <= 0 bankrupts) and Last Standing victory", () => {
  // -$500 cash with $780 sellable property (NW = +$280 > 0) is NOT bankrupt!
  const solventAtMinus500 = createGame(["A", "B", "C"]);
  solventAtMinus500.players[0].cash = -500;
  solventAtMinus500.owners.tile_35 = "p0"; // NEW YORK sellValue = $400
  solventAtMinus500.owners.tile_31 = "p0"; // CALIFORNIA sellValue = $380 -> total $780, NW = +$280
  solventAtMinus500.players[0].properties.push("tile_35", "tile_31");
  assert.equal(
    isPlayerBankrupt(solventAtMinus500, solventAtMinus500.players[0]),
    false,
  );

  // -$501 cash EVEN with $780 in properties IS bankrupt!
  solventAtMinus500.players[0].cash = -501;
  assert.equal(
    isPlayerBankrupt(solventAtMinus500, solventAtMinus500.players[0]),
    true,
  );

  // Triggering bankruptcy during rent/tax returns all assets to Bank and eliminates player
  const match = createGame(["A", "B"]);
  match.players[0].cash = -490;
  match.owners.tile_35 = "p0";
  match.owners.tile_31 = "p0";
  match.players[0].properties.push("tile_35", "tile_31");
  match.buildings.tile_35 = 1;
  match.owners.tile_02 = "p1"; // HYDERABAD rent $10 -> pushes A from -$490 to -$500 (still alive!)
  match.players[0].position = 1;
  const atMinus500 = roll(match, 1).state;
  assert.equal(atMinus500.players[0].cash, -500);
  assert.equal(atMinus500.players[0].status, "ACTIVE");
  assert.equal(atMinus500.phase, "roll");

  // Next hit of $50 tax pushes A to -$550 (< -$500) -> BANKRUPT -> B wins by LAST_STANDING!
  atMinus500.turn = 0;
  atMinus500.players[0].position = 23;
  const busted = roll(atMinus500, 1).state;
  assert.equal(busted.players[0].status, "BANKRUPT");
  assert.equal(busted.owners.tile_35, undefined);
  assert.equal(busted.buildings.tile_35, undefined);
  assert.equal(busted.phase, "finished");
  assert.equal(busted.winner, "p1");
  assert.equal(busted.victoryReason, "LAST_STANDING");
});

test("configurable Net Worth Goal ($3000/$5000/$7000) and finite vs UNLIMITED round limits", () => {
  // $3,000 Net Worth Goal triggers immediately upon crossing $3,000
  const quickGoal = createGame(["A", "B"], {
    maxPlayers: 2,
    roundLimit: null,
    targetNetWorth: 3000,
  });
  quickGoal.players[0].cash = 2900;
  // Cue 23 awards +$200 -> $3,100 >= $3,000 -> immediate win!
  const wonGoal = applyBankCueById(quickGoal, "23");
  assert.equal(wonGoal.phase, "finished");
  assert.equal(wonGoal.winner, "p0");
  assert.equal(wonGoal.victoryReason, "NET_WORTH_GOAL");

  // Finite 30-round limit ends after the last active player finishes round 30
  const r30 = createGame(["A", "B"], {
    maxPlayers: 2,
    roundLimit: 30,
    targetNetWorth: 7000,
  });
  r30.round = 30;
  r30.turn = 1;
  r30.players[0].cash = 2100;
  r30.players[1].cash = 2400;
  r30.players[1].position = 17; // Roll 1 -> tile_18 (Just Visiting) -> completes round 30!
  const ended30 = roll(r30, 1).state;
  assert.equal(ended30.phase, "finished");
  assert.equal(ended30.winner, "p1");
  assert.equal(ended30.victoryReason, "ROUND_LIMIT");

  // UNLIMITED rounds continues past round 30 and round 50 without ending
  const unlim = createGame(["A", "B"], {
    maxPlayers: 2,
    roundLimit: null,
    targetNetWorth: 7000,
  });
  unlim.round = 50;
  unlim.turn = 1;
  unlim.players[1].position = 17;
  const r51 = roll(unlim, 1).state;
  assert.equal(r51.phase, "roll");
  assert.equal(r51.round, 51);
  assert.equal(r51.winner, null);
});

test("inactivity warns at 2 missed turns and forfeits with full asset return at 3 missed turns", () => {
  let state = createGame(["A", "B", "C"]);
  state.owners.tile_01 = "p0";
  state.players[0].properties.push("tile_01");
  state.buildings.tile_01 = 1;

  // Missed turn 1 for p0
  state = resolveTurnTimeout(state);
  assert.equal(state.players[0].missedTurns, 1);
  assert.equal(state.players[0].status, "ACTIVE");

  // Back to p0 for Missed turn 2 -> warning issued, still ACTIVE
  state.turn = 0;
  state.phase = "roll";
  state = resolveTurnTimeout(state);
  assert.equal(state.players[0].missedTurns, 2);
  assert.equal(state.players[0].status, "ACTIVE");
  assert.ok(
    state.notifications.some((n) =>
      /WARNING|inactivity|missed/i.test(n.title + n.text),
    ),
  );

  // Back to p0 for Missed turn 3 -> FORFEITED, tile_01 & building returned to Bank!
  state.turn = 0;
  state.phase = "roll";
  state = resolveTurnTimeout(state);
  assert.equal(state.players[0].status, "FORFEITED");
  assert.equal(state.owners.tile_01, undefined);
  assert.equal(state.buildings.tile_01, undefined);
  assert.equal(state.phase, "roll"); // B and C continue playing!

  // If B also forfeits, C wins immediately as LAST_STANDING
  const finalState = forfeitPlayer(state, "p1", "VOLUNTARY");
  assert.equal(finalState.phase, "finished");
  assert.equal(finalState.winner, "p2");
  assert.equal(finalState.victoryReason, "LAST_STANDING");
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
