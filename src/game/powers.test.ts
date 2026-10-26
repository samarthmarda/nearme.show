import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applyGameCommand,
  applyPowerCommand,
  bombedRent,
  choosePower,
  createGame,
  currentRent,
  powerActorIds,
  powerAvailability,
  powerEligibleIds,
  powerSelectedIds,
  rentFor,
  roll,
  timeoutPowerInteraction,
  type GameCommand,
  type GameState,
} from "./engine";
import { BOARD, RULES } from "./rules";

/* ------------------------------------------------------------------------- */
/* Harness: four clients connected to one authoritative server state.         */
/* Each broadcast is JSON round-tripped, as a Socket.IO payload would be.     */
/* ------------------------------------------------------------------------- */

const NOW = 1_000_000;
const ids = ["p0", "p1", "p2", "p3"];

function table(): GameState {
  return createGame(["Red", "Blue", "Green", "Gold"]);
}

/** Put player `playerId` on the first SUPER POWER stop (tile_16) via a real roll. */
function landOnPower(state: GameState, playerId = "p0", roll6 = 1): GameState {
  const powerIdx = BOARD.findIndex((t) => t.kind === "power");
  const next = structuredClone(state);
  next.turn = next.players.findIndex((p) => p.id === playerId);
  next.phase = "roll";
  next.players.find((p) => p.id === playerId)!.position = powerIdx - roll6;
  const landed = roll(next, roll6, () => 0).state;
  assert.equal(landed.phase, "power", "landing on SUPER POWER opens the power phase");
  return landed;
}

class Table {
  /** The authoritative server state. */
  server: GameState;
  /** Last state each connected client has rendered. */
  clients: Record<string, GameState>;
  log: Array<{ actor: string; command: GameCommand | Record<string, unknown>; ok: boolean; error?: string }> = [];

  constructor(state: GameState) {
    this.server = state;
    this.clients = Object.fromEntries(ids.map((id) => [id, this.wire(state)]));
  }

  private wire(state: GameState): GameState {
    return JSON.parse(JSON.stringify(state));
  }

  /** Send a command as `actor`. On success every client receives the new state. */
  send(actor: string, command: GameCommand, now = NOW): { ok: boolean; error?: string } {
    const withId = { ...command, interactionId: this.server.powerInteraction?.id } as GameCommand;
    const result = applyGameCommand(this.server, actor, withId, now);
    this.log.push({ actor, command: withId, ok: !result.error, error: result.error });
    // Like the server: a refused command that still resets state (e.g. a stale
    // selection) is broadcast, so every client drops the stale highlight.
    if (result.state !== this.server) {
      this.server = result.state;
      for (const id of ids) this.clients[id] = this.wire(this.server);
    }
    return result.error ? { ok: false, error: result.error } : { ok: true };
  }

  /** Mutate the server state directly (used to model a change made outside the power flow). */
  mutate(fn: (state: GameState) => void) {
    fn(this.server);
    for (const id of ids) this.clients[id] = this.wire(this.server);
  }
}

const cash = (state: GameState, id: string) => state.players.find((p) => p.id === id)!.cash;
const owner = (state: GameState, tileId: string) => state.owners[tileId];

/* ------------------------------------------------------------------------- */
/* Shared authority and multiplayer synchronisation                          */
/* ------------------------------------------------------------------------- */

test("four connected clients receive identical Super Power state and eligibility", () => {
  const t = new Table(landOnPower(table()));
  t.mutate((s) => {
    s.owners.tile_01 = "p1";
    s.players[1].properties.push("tile_01");
  });
  const views = ids.map((id) => ({
    actors: powerActorIds(t.clients[id]),
    interaction: JSON.stringify(t.clients[id].powerInteraction),
    eligible: powerEligibleIds(t.clients[id], id),
  }));
  for (const view of views.slice(1)) assert.deepEqual(view.interaction, views[0].interaction);
  // Only the initiator may act at the choice step, on every client.
  assert.deepEqual(powerActorIds(t.clients.p2), ["p0"]);
  assert.deepEqual(views[0].eligible, []);
});

test("an eligible property can be selected through its cue card action; an ineligible one cannot", () => {
  const t = new Table(landOnPower(table()));
  t.mutate((s) => {
    s.owners.tile_01 = "p1";
    s.players[1].properties.push("tile_01");
  });
  assert.equal(t.send("p0", { type: "CHOOSE_POWER", powerId: "bomb" }).ok, true);
  assert.deepEqual(powerEligibleIds(t.server, "p0"), ["tile_01"]);

  // Own property and unowned property are not valid bomb targets.
  assert.equal(t.send("p0", { type: "POWER_SELECT", propertyId: "tile_05" }).ok, false);
  const before = JSON.stringify(t.server);
  const rejected = t.send("p0", { type: "POWER_SELECT", propertyId: "tile_01" });
  assert.equal(rejected.ok, true);
  assert.deepEqual(powerSelectedIds(t.server, "p0"), ["tile_01"]);
  assert.notEqual(JSON.stringify(t.server), before);
  assert.match(t.log[1].error ?? "", /not eligible/);
});

test("a client cannot select an ineligible property by sending an arbitrary event", () => {
  const state = landOnPower(table());
  state.owners.tile_01 = "p1";
  state.players[1].properties.push("tile_01");
  const chosen = choosePower(state, "bomb");
  assert.equal(chosen.powerInteraction?.kind, "bomb");
  const result = applyPowerCommand(chosen, "p0", { type: "POWER_SELECT", propertyId: "tile_30" });
  assert.equal(result.state, chosen, "state is returned unchanged");
  assert.match(result.error ?? "", /not eligible/);
  const unknown = applyPowerCommand(chosen, "p0", { type: "POWER_SELECT", propertyId: "tile_99" });
  assert.match(unknown.error ?? "", /not eligible/);
});

test("waiting players cannot select, confirm, or cancel another player's power", () => {
  const t = new Table(landOnPower(table()));
  t.mutate((s) => {
    s.owners.tile_01 = "p1";
    s.players[1].properties.push("tile_01");
  });
  assert.equal(t.send("p1", { type: "CHOOSE_POWER", powerId: "bomb" }).ok, false);
  assert.equal(t.send("p0", { type: "CHOOSE_POWER", powerId: "bomb" }).ok, true);
  assert.equal(t.send("p1", { type: "POWER_SELECT", propertyId: "tile_01" }).ok, false);
  assert.equal(t.send("p1", { type: "POWER_CONFIRM" }).ok, false);
  assert.equal(t.send("p1", { type: "POWER_CANCEL" }).ok, false);
  assert.equal(t.server.bombs.length, 0);
});

test("a stale interaction id is rejected instead of applying to a newer prompt", () => {
  const chosen = choosePower(landOnPower(table()), "bomb");
  const result = applyGameCommand(chosen, "p0", {
    type: "POWER_SELECT",
    propertyId: "tile_01",
    interactionId: chosen.powerInteraction!.id + 7,
  });
  assert.match(result.error ?? "", /already changed/);
});

/* ------------------------------------------------------------------------- */
/* 1 · BOMB                                                                   */
/* ------------------------------------------------------------------------- */

function bombReady(): Table {
  const t = new Table(landOnPower(table()));
  t.mutate((s) => {
    s.owners.tile_01 = "p1";
    s.players[1].properties.push("tile_01");
  });
  t.send("p0", { type: "CHOOSE_POWER", powerId: "bomb" });
  return t;
}

test("BOMB does not apply or animate before RELEASE", () => {
  const t = bombReady();
  t.send("p0", { type: "POWER_SELECT", propertyId: "tile_01" });
  assert.equal(t.server.bombs.length, 0);
  assert.equal(t.server.powerEvent, null, "no missile event before confirmation");
  assert.equal(currentRent(t.server, "tile_01"), 10);
  assert.equal(owner(t.server, "tile_01"), "p1");
  assert.equal(t.server.phase, "power");
});

test("BOMB applies exactly once on RELEASE and keeps ownership", () => {
  const t = bombReady();
  t.send("p0", { type: "POWER_SELECT", propertyId: "tile_01" });
  assert.equal(t.send("p0", { type: "POWER_CONFIRM" }).ok, true);
  assert.equal(t.server.bombs.length, 1);
  assert.equal(currentRent(t.server, "tile_01"), 5);
  assert.equal(owner(t.server, "tile_01"), "p1");
  assert.equal(t.server.powerEvent?.kind, "bomb");
  assert.equal(t.server.powerEvent?.fromTileId, "tile_20", "missile originates at ISRAEL");
  assert.equal(t.server.powerEvent?.rentBefore, 10);
  assert.equal(t.server.powerEvent?.rentAfter, 5);
  assert.equal(t.server.phase, "roll");
  assert.equal(t.server.turn, 1, "turn engine resumes automatically");

  // Duplicate RELEASE (double click, retry, or reconnect replay) does nothing.
  const duplicate = applyGameCommand(t.server, "p0", { type: "POWER_CONFIRM" });
  assert.ok(duplicate.error);
  assert.equal(t.server.bombs.length, 1);
  assert.equal(currentRent(t.server, "tile_01"), 5);
});

test("each Bomb halves current rent, rounds down to the previous $5, and never goes below $1", () => {
  assert.equal(bombedRent(100), 50);
  assert.equal(bombedRent(55), 25);
  assert.equal(bombedRent(25), 10);
  assert.equal(bombedRent(10), 5);
  assert.equal(bombedRent(5), 1);
  assert.equal(bombedRent(2), 1);
  assert.equal(bombedRent(1), 1);

  const state = table();
  state.owners.tile_01 = "p1";
  const owner = state.players[1];
  const tile = BOARD[1];
  const base = rentFor(state, tile, owner);
  assert.equal(base, 10);
  const chain: number[] = [base];
  for (let n = 0; n < 6; n++) {
    state.bombs.push({ id: `b${n}`, propertyId: tile.id, byPlayerId: "p0", round: 1, repairCost: 25 });
    chain.push(rentFor(state, tile, owner));
  }
  assert.deepEqual(chain, [10, 5, 1, 1, 1, 1, 1]);
});

test("a property already at the minimum rent is not a Bomb target", () => {
  const t = bombReady();
  t.mutate((s) => {
    s.bombs.push(
      { id: "x1", propertyId: "tile_01", byPlayerId: "p0", round: 1, repairCost: 25 },
      { id: "x2", propertyId: "tile_01", byPlayerId: "p0", round: 1, repairCost: 25 },
    );
  });
  assert.equal(currentRent(t.server, "tile_01"), 1);
  const reselect = applyGameCommand(t.server, "p0", { type: "POWER_SELECT", propertyId: "tile_01" });
  assert.ok(reselect.error);
  assert.equal(powerAvailability(t.server, "p0").bomb, "No rival property has rent left to halve.");
});

test("BOMB can be cancelled back to the four choices with no effect", () => {
  const t = bombReady();
  t.send("p0", { type: "POWER_SELECT", propertyId: "tile_01" });
  assert.equal(t.send("p0", { type: "POWER_CANCEL" }).ok, true);
  assert.equal(t.server.phase, "power");
  assert.equal(t.server.powerInteraction?.kind, null);
  assert.equal(t.server.bombs.length, 0);
  assert.equal(currentRent(t.server, "tile_01"), 10);
  assert.deepEqual(t.server.players[0].powers, []);
  // Cancellation clears every client's highlights.
  for (const id of ids) {
    assert.deepEqual(powerEligibleIds(t.clients[id], id), []);
    assert.deepEqual(powerSelectedIds(t.clients[id], id), []);
  }
});

/* ------------------------------------------------------------------------- */
/* 2 · POWER SWAP                                                             */
/* ------------------------------------------------------------------------- */

test("POWER SWAP requires the rival property first and only then exposes own properties", () => {
  const t = new Table(landOnPower(table()));
  t.mutate((s) => {
    s.owners.tile_01 = "p0";
    s.players[0].properties.push("tile_01");
    s.owners.tile_10 = "p1";
    s.players[1].properties.push("tile_10");
  });
  t.send("p0", { type: "CHOOSE_POWER", powerId: "power-swap" });
  assert.deepEqual(powerEligibleIds(t.server, "p0"), ["tile_10"], "only rival property at first stage");

  const own = t.send("p0", { type: "POWER_SELECT", propertyId: "tile_01" });
  assert.equal(own.ok, false, "own property cannot be picked first");
  assert.equal(t.server.powerInteraction?.step, "SWAP_OPPONENT");

  assert.equal(t.send("p0", { type: "POWER_SELECT", propertyId: "tile_10" }).ok, true);
  assert.equal(t.server.powerInteraction?.step, "SWAP_OWN");
  assert.equal(t.server.powerInteraction?.target, "tile_10", "first selection stays locked");
  assert.equal(owner(t.server, "tile_10"), "p1", "nothing transfers before confirmation");
  assert.ok(powerEligibleIds(t.server, "p0").includes("tile_01"));
});

test("POWER SWAP is atomic and keeps buildings attached to their properties", () => {
  const t = new Table(landOnPower(table()));
  t.mutate((s) => {
    s.owners.tile_01 = "p0";
    s.players[0].properties.push("tile_01");
    s.buildings.tile_01 = 2;
    s.owners.tile_10 = "p1";
    s.players[1].properties.push("tile_10");
  });
  t.send("p0", { type: "CHOOSE_POWER", powerId: "power-swap" });
  t.send("p0", { type: "POWER_SELECT", propertyId: "tile_10" });
  t.send("p0", { type: "POWER_SELECT", propertyId: "tile_01" });
  assert.equal(t.send("p0", { type: "POWER_CONFIRM" }).ok, true);

  assert.equal(owner(t.server, "tile_10"), "p0");
  assert.equal(owner(t.server, "tile_01"), "p1");
  assert.equal(t.server.buildings.tile_01, 2, "buildings stay with the property");
  assert.deepEqual(t.server.players[0].properties, ["tile_10"]);
  assert.deepEqual(t.server.players[1].properties, ["tile_01"]);
  assert.equal(t.server.phase, "roll");
  assert.equal(t.server.turn, 1);
});

test("POWER SWAP fails without transferring either property when ownership changed before confirmation", () => {
  const t = new Table(landOnPower(table()));
  t.mutate((s) => {
    s.owners.tile_01 = "p0";
    s.players[0].properties.push("tile_01");
    s.owners.tile_10 = "p1";
    s.players[1].properties.push("tile_10");
  });
  t.send("p0", { type: "CHOOSE_POWER", powerId: "power-swap" });
  t.send("p0", { type: "POWER_SELECT", propertyId: "tile_10" });
  t.send("p0", { type: "POWER_SELECT", propertyId: "tile_01" });

  // tile_10 is sold to a different rival while the initiator is still deciding.
  t.mutate((s) => {
    s.owners.tile_10 = "p2";
    s.players[1].properties = [];
    s.players[2].properties.push("tile_10");
  });
  const before = JSON.stringify(t.server.owners);
  const result = t.send("p0", { type: "POWER_CONFIRM" });
  assert.equal(result.ok, false);
  assert.equal(JSON.stringify(t.server.owners), before, "no partial transfer");
  assert.equal(owner(t.server, "tile_01"), "p0");
  assert.equal(t.server.phase, "power", "interaction stays open");
  // The stale selection is cleared for every client, not left highlighted.
  assert.equal(t.server.powerInteraction?.step, "SWAP_OPPONENT");
  assert.equal(t.server.powerInteraction?.target, null);
  for (const id of ids) assert.deepEqual(powerSelectedIds(t.clients[id], id), []);
});

/* ------------------------------------------------------------------------- */
/* 3 · AUCTION                                                                */
/* ------------------------------------------------------------------------- */

function auctionReady(): Table {
  const t = new Table(landOnPower(table()));
  t.mutate((s) => {
    s.owners.tile_01 = "p0";
    s.players[0].properties.push("tile_01");
    s.owners.tile_10 = "p1";
    s.players[1].properties.push("tile_10");
    s.owners.tile_20 = "p2";
    s.players[2].properties.push("tile_20");
    s.owners.tile_30 = "p3";
    s.players[3].properties.push("tile_30");
  });
  t.send("p0", { type: "CHOOSE_POWER", powerId: "auction" }, NOW);
  t.send("p0", { type: "POWER_SELECT", propertyId: "tile_01" }, NOW);
  t.send("p0", { type: "POWER_CONFIRM" }, NOW);
  return t;
}

test("AUCTION starts the 69-second server timer at initiation and only offers own property", () => {
  const t = new Table(landOnPower(table()));
  t.mutate((s) => {
    s.owners.tile_01 = "p0";
    s.players[0].properties.push("tile_01");
  });
  t.send("p0", { type: "CHOOSE_POWER", powerId: "auction" }, NOW);
  assert.equal(t.server.powerInteraction?.deadline, NOW + RULES.timing.auctionSeconds * 1000);
  assert.equal(RULES.timing.auctionSeconds, 69);
  assert.deepEqual(powerEligibleIds(t.server, "p0"), ["tile_01"]);
  assert.deepEqual(powerEligibleIds(t.server, "p1"), []);
});

test("AUCTION opens offers only after the initiating property is accepted", () => {
  const t = new Table(landOnPower(table()));
  t.mutate((s) => {
    s.owners.tile_01 = "p0";
    s.players[0].properties.push("tile_01");
  });
  t.send("p0", { type: "CHOOSE_POWER", powerId: "auction" });
  assert.equal(t.server.powerInteraction?.step, "AUCTION_INITIATOR");
  assert.equal(applyGameCommand(t.server, "p0", { type: "POWER_CONFIRM" }, NOW).error !== undefined, true);
  t.send("p0", { type: "POWER_SELECT", propertyId: "tile_01" });
  assert.equal(t.server.powerInteraction?.step, "AUCTION_INITIATOR", "selection alone does not open offers");
  t.send("p0", { type: "POWER_CONFIRM" });
  assert.equal(t.server.powerInteraction?.step, "AUCTION_OFFERS");
});

test("each opponent can submit exactly one offer of their own property", () => {
  const t = auctionReady();
  assert.deepEqual(powerEligibleIds(t.server, "p1"), ["tile_10"]);
  assert.deepEqual(powerEligibleIds(t.server, "p0"), [], "initiator has no offer to pick yet");

  // Offering another player's property is refused.
  assert.equal(t.send("p1", { type: "POWER_SELECT", propertyId: "tile_20" }).ok, false);
  assert.equal(t.send("p1", { type: "POWER_SELECT", propertyId: "tile_10" }).ok, true);
  assert.equal(t.send("p1", { type: "POWER_CONFIRM" }).ok, true);
  assert.equal(t.server.powerInteraction?.offers.p1, "tile_10");

  // A second offer from the same opponent is refused.
  assert.equal(t.send("p1", { type: "POWER_SELECT", propertyId: "tile_10" }).ok, false);
  assert.equal(t.send("p1", { type: "POWER_CONFIRM" }).ok, false);
  assert.equal(Object.keys(t.server.powerInteraction!.offers).length, 1);
});

test("the initiator can select one offer and TRADE only that pair", () => {
  const t = auctionReady();
  t.send("p1", { type: "POWER_SELECT", propertyId: "tile_10" });
  t.send("p1", { type: "POWER_CONFIRM" });
  t.send("p2", { type: "POWER_SELECT", propertyId: "tile_20" });
  t.send("p2", { type: "POWER_CONFIRM" });

  assert.equal(t.send("p0", { type: "POWER_CONFIRM" }).ok, false, "TRADE needs a chosen offer");
  assert.equal(t.send("p0", { type: "POWER_SELECT", propertyId: "tile_20" }).ok, true);
  assert.equal(t.server.powerInteraction?.offerFrom, "p2");
  assert.equal(t.send("p0", { type: "POWER_SELECT", propertyId: "tile_10" }).ok, true);
  assert.equal(t.server.powerInteraction?.offerFrom, "p1");
});

test("a completed AUCTION transfers only the two selected properties and pays exactly $100 to each", () => {
  const t = auctionReady();
  t.send("p1", { type: "POWER_SELECT", propertyId: "tile_10" });
  t.send("p1", { type: "POWER_CONFIRM" });
  t.send("p2", { type: "POWER_SELECT", propertyId: "tile_20" });
  t.send("p2", { type: "POWER_CONFIRM" });
  t.send("p3", { type: "POWER_DECLINE" });
  t.send("p0", { type: "POWER_SELECT", propertyId: "tile_10" });

  const before = { p0: cash(t.server, "p0"), p1: cash(t.server, "p1"), p2: cash(t.server, "p2"), p3: cash(t.server, "p3") };
  assert.equal(t.send("p0", { type: "POWER_CONFIRM" }).ok, true);

  assert.equal(owner(t.server, "tile_01"), "p1", "initiator's property goes to the selected opponent");
  assert.equal(owner(t.server, "tile_10"), "p0", "selected offer goes to the initiator");
  assert.equal(owner(t.server, "tile_20"), "p2", "unselected offer does not move");
  assert.equal(owner(t.server, "tile_30"), "p3");

  assert.equal(cash(t.server, "p0") - before.p0, 100);
  assert.equal(cash(t.server, "p1") - before.p1, 100);
  assert.equal(cash(t.server, "p2"), before.p2, "unselected opponent receives no bonus");
  assert.equal(cash(t.server, "p3"), before.p3, "declining opponent receives no bonus");
  const total = ["p0", "p1"].reduce((sum, id) => sum + cash(t.server, id) - before[id as "p0" | "p1"], 0);
  assert.equal(total, 200);

  assert.equal(t.server.powerEvent?.kind, "auction");
  assert.equal(t.server.powerEvent?.amount, 100);
  assert.equal(t.server.phase, "roll");
  assert.equal(t.server.turn, 1);
  assert.equal(t.send("p0", { type: "POWER_CONFIRM" }).ok, false, "a finished trade cannot pay twice");
  assert.equal(cash(t.server, "p0") - before.p0, 100);
});

test("a cancelled AUCTION gives no bonus and transfers no property", () => {
  const t = auctionReady();
  t.send("p1", { type: "POWER_SELECT", propertyId: "tile_10" });
  t.send("p1", { type: "POWER_CONFIRM" });
  t.send("p0", { type: "POWER_SELECT", propertyId: "tile_10" });
  const before = JSON.stringify({ owners: t.server.owners, cash: t.server.players.map((p) => p.cash) });

  assert.equal(t.send("p0", { type: "POWER_CANCEL" }).ok, true);
  assert.equal(t.server.powerInteraction?.kind, null, "returns to the four choices");
  assert.equal(t.server.powerInteraction?.deadline, null);
  assert.equal(JSON.stringify({ owners: t.server.owners, cash: t.server.players.map((p) => p.cash) }), before);
  assert.equal(t.server.bombs.length, 0);
  for (const id of ids) assert.deepEqual(powerSelectedIds(t.clients[id], id), []);
});

test("an AUCTION that times out after 69 seconds transfers nothing and pays no bonus", () => {
  const t = auctionReady();
  t.send("p1", { type: "POWER_SELECT", propertyId: "tile_10" });
  t.send("p1", { type: "POWER_CONFIRM" });
  t.send("p0", { type: "POWER_SELECT", propertyId: "tile_10" });
  const deadline = t.server.powerInteraction!.deadline!;
  const before = JSON.stringify({ owners: t.server.owners, cash: t.server.players.map((p) => p.cash) });

  // A trade attempted at the deadline is refused even before the timer fires.
  const late = applyGameCommand(t.server, "p0", { type: "POWER_CONFIRM" }, deadline);
  assert.match(late.error ?? "", /expired/);

  const expired = timeoutPowerInteraction(t.server);
  assert.equal(JSON.stringify({ owners: expired.owners, cash: expired.players.map((p) => p.cash) }), before);
  assert.equal(expired.powerEvent?.kind, "auction-expired");
  assert.equal(expired.powerInteraction, null);
  assert.equal(expired.phase, "roll");
  assert.equal(expired.turn, 1, "turn engine resumes after expiry");

  // The client cannot complete a trade once the server has expired the Auction.
  const after = applyGameCommand(expired, "p0", { type: "POWER_CONFIRM" });
  assert.ok(after.error);
  assert.equal(after.state, expired);
});

/* ------------------------------------------------------------------------- */
/* 4 · RENT FREE ROUND                                                         */
/* ------------------------------------------------------------------------- */

test("RENT FREE activates immediately on server acceptance, without a second confirmation", () => {
  const t = new Table(landOnPower(table()));
  assert.equal(t.send("p0", { type: "CHOOSE_POWER", powerId: "rent-free" }).ok, true);
  assert.deepEqual(t.server.rentFree.p0, { remainingCircuits: RULES.powers.rentFreeCircuits, activatedRound: 1 });
  assert.equal(t.server.phase, "roll", "no pending confirmation step");
  assert.equal(t.server.turn, 1);
  assert.equal(t.server.powerEvent?.kind, "rent-free");
  assert.deepEqual(t.server.players[0].powers, ["rent-free"]);
});

test("RENT FREE blocks rent and utility charges without moving cash or changing ownership", () => {
  const state = table();
  state.owners.tile_06 = "p1"; // BOAT (G9 utility-style transport)
  state.players[1].properties.push("tile_06");
  state.owners.tile_04 = "p2"; // SEVEN-11 (G10 business)
  state.players[2].properties.push("tile_04");
  state.rentFree.p0 = { remainingCircuits: 3, activatedRound: 1 };

  state.players[0].position = 3;
  const boat = roll(state, 3, () => 0).state; // lands on BOAT
  assert.equal(boat.players[0].cash, state.players[0].cash, "payer keeps cash");
  assert.equal(boat.players[1].cash, state.players[1].cash, "owner is not credited");
  assert.equal(boat.owners.tile_06, "p1");
  assert.equal(boat.powerEvent?.kind, "rent-blocked");
  assert.ok(boat.activity.some((entry) => /RENT BLOCKED/.test(entry)));

  const businessState = structuredClone(state);
  businessState.players[0].position = 2;
  const business = roll(businessState, 2, () => 0).state; // lands on SEVEN-11 (tile_04)
  assert.equal(business.players[0].cash, state.players[0].cash);
  assert.equal(business.players[2].cash, state.players[2].cash);
  assert.equal(business.powerEvent?.kind, "rent-blocked");
});

test("RENT FREE does not exempt unrelated charges such as Property Tax", () => {
  const state = table();
  state.rentFree.p0 = { remainingCircuits: 3, activatedRound: 1 };
  state.players[0].position = 22;
  const taxed = roll(state, 2, () => 0).state; // lands on PROPERTY TAX (tile_24)
  assert.equal(taxed.players[0].cash, state.players[0].cash - 50);
});

test("without RENT FREE the same landing charges rent normally", () => {
  const state = table();
  state.owners.tile_06 = "p1";
  state.players[1].properties.push("tile_06");
  state.players[0].position = 3;
  const boat = roll(state, 3, () => 0).state;
  assert.equal(boat.players[0].cash, state.players[0].cash - 35);
  assert.equal(boat.players[1].cash, state.players[1].cash + 35);
});

test("RENT FREE progress counts only completed START crossings and expires after the third", () => {
  const t = new Table(landOnPower(table()));
  t.send("p0", { type: "CHOOSE_POWER", powerId: "rent-free" });
  t.mutate((s) => {
    s.owners.tile_06 = "p1";
    s.players[1].properties.push("tile_06");
  });

  const step = (position: number, value: number) => {
    t.mutate((s) => {
      s.turn = 0;
      s.phase = "roll";
      s.players[0].position = position;
    });
    const result = roll(t.server, value, () => 0).state;
    t.mutate((s) => Object.assign(s, result));
  };

  step(2, 2); // 2 → 4, no START crossing
  assert.equal(t.server.rentFree.p0.remainingCircuits, 3, "moving within the circuit is not progress");

  step(34, 3); // crosses START → circuit 1
  assert.equal(t.server.rentFree.p0.remainingCircuits, 2);
  step(34, 4); // crosses START → circuit 2
  assert.equal(t.server.rentFree.p0.remainingCircuits, 1);
  assert.notEqual(t.server.powerEvent?.kind, "rent-free-ended", "not yet expired");

  // Third circuit: protection ends at the boundary, so the landing is charged normally.
  step(34, 1); // 34 → 35 is not a crossing
  assert.equal(t.server.rentFree.p0.remainingCircuits, 1);
  step(34, 6); // crosses START → circuit 3, expires
  assert.equal(t.server.rentFree.p0, undefined);
  assert.equal(t.server.powerEvent?.kind, "rent-free-ended");
  assert.ok(t.server.activity.some((entry) => /has ended/.test(entry)));
});

test("a landing on the third circuit's crossing is charged normally after protection expires", () => {
  const state = table();
  state.owners.tile_05 = "p1"; // BANGKOK, light-blue, one owned: rent $15
  state.players[1].properties.push("tile_05");
  state.rentFree.p0 = { remainingCircuits: 1, activatedRound: 1 };
  state.players[0].position = 35;
  const result = roll(state, 6, () => 0).state; // 35 → 41 = tile_05, crossing START (expiry) first
  assert.equal(result.rentFree.p0, undefined);
  assert.equal(result.players[0].cash, state.players[0].cash + RULES.salary - 15);
  assert.equal(result.players[1].cash, state.players[1].cash + 15);
});

/* ------------------------------------------------------------------------- */
/* Cancellation, reconnection and turn-engine integration                    */
/* ------------------------------------------------------------------------- */

test("CANCEL on the four-choice page passes the power and resumes the turn engine", () => {
  const t = new Table(landOnPower(table()));
  assert.equal(t.send("p0", { type: "POWER_CANCEL" }).ok, true);
  assert.equal(t.server.phase, "roll");
  assert.equal(t.server.turn, 1);
  assert.equal(t.server.powerInteraction, null);
  assert.deepEqual(t.server.players[0].powers, []);
});

test("reconnecting restores the same active interaction and selections on any client", () => {
  const t = bombReady();
  t.send("p0", { type: "POWER_SELECT", propertyId: "tile_01" });
  // A reconnecting client receives the room's current game state (JSON wire form).
  const reconnected = JSON.parse(JSON.stringify(t.server)) as GameState;
  assert.deepEqual(reconnected.powerInteraction, t.server.powerInteraction);
  assert.deepEqual(powerSelectedIds(reconnected, "p1"), ["tile_01"]);
  assert.deepEqual(powerEligibleIds(reconnected, "p0"), ["tile_01"]);
  assert.deepEqual(powerActorIds(reconnected), ["p0"]);
  // The restored client can finish the same action exactly once.
  const confirmed = applyGameCommand(reconnected, "p0", { type: "POWER_CONFIRM", interactionId: reconnected.powerInteraction!.id });
  assert.equal(confirmed.error, undefined);
  assert.equal(confirmed.state.bombs.length, 1);
});

test("no dice roll is possible while a Super Power interaction is unresolved", () => {
  const t = bombReady();
  const attempt = applyGameCommand(t.server, "p0", { type: "ROLL" });
  assert.ok(attempt.error);
  assert.equal(attempt.state, t.server);
});

test("a 6 rolled onto SUPER POWER grants another roll only after the power resolves", () => {
  const landed = landOnPower(table(), "p0", 6);
  assert.equal(landed.lastRoll, 6);
  assert.equal(applyGameCommand(landed, "p0", { type: "ROLL" }).error !== undefined, true, "no roll while pending");
  const chosen = choosePower(landed, "rent-free");
  assert.equal(chosen.phase, "roll");
  assert.equal(chosen.turn, 0, "same player keeps the dice");
  assert.equal(chosen.lastRoll, 6);
  assert.match(chosen.message, /rolled a 6/);
});

for (const value of [1, 2, 3, 4, 5]) {
  test(`a roll of ${value} on SUPER POWER advances the turn only after the power resolves`, () => {
    const landed = landOnPower(table(), "p0", value);
    assert.equal(landed.turn, 0, "no premature handoff while the power is pending");
    const resolved = applyPowerCommand(landed, "p0", { type: "POWER_CANCEL" }).state;
    assert.equal(resolved.turn, 1);
    assert.equal(resolved.phase, "roll");
    assert.equal(resolved.lastRoll, null);
  });
}

test("a power can only be taken when at least one legal target exists", () => {
  const state = landOnPower(table());
  const availability = powerAvailability(state, "p0");
  assert.match(availability.bomb ?? "", /No rival/);
  assert.match(availability["power-swap"] ?? "", /Needs one rival/);
  assert.match(availability.auction ?? "", /Needs one/);
  assert.equal(availability["rent-free"], null);
  const blocked = applyGameCommand(state, "p0", { type: "CHOOSE_POWER", powerId: "bomb" });
  assert.ok(blocked.error);
});

test("a rejected or stale command leaves every client's state untouched", () => {
  const t = bombReady();
  const snapshot = JSON.stringify(t.server);
  t.send("p0", { type: "POWER_SELECT", propertyId: "tile_30" });
  t.send("p3", { type: "POWER_CONFIRM" });
  t.send("p0", { type: "POWER_CONFIRM" }); // no selection yet
  assert.equal(JSON.stringify(t.server), snapshot);
  for (const id of ids) assert.equal(JSON.stringify(t.clients[id]), snapshot);
});

test("no Super Power is ever awarded automatically on landing", () => {
  const landed = landOnPower(table());
  assert.deepEqual(landed.players[0].powers, []);
  assert.equal(landed.powerInteraction?.kind, null);
});
