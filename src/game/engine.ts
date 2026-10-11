import {
  BOARD,
  POWER_OPTIONS,
  RULES,
  type PowerId,
  type Tile,
} from "./rules";

export type PlayerStatus =
  | "ACTIVE"
  | "JAILED"
  | "DISTRESSED"
  | "BANKRUPT"
  | "FORFEITED";

export type Player = {
  id: string;
  name: string;
  avatar: string;
  cash: number;
  position: number;
  properties: string[];
  jailed: boolean;
  debt: number;
  status: PlayerStatus;
  condition: Record<string, number>;
  /** Super Powers this player has activated or used (history, not a hand). */
  powers: string[];
};

export type LastLanding = {
  playerId: string;
  tileId: string;
  roll: number;
};

/**
 * Super Power interaction steps. Every step has exactly one owner of input:
 * the initiator for all steps except AUCTION_OFFERS, where each opponent may
 * submit their own single offer.
 */
export type PowerStep =
  | "CHOOSE"
  | "BOMB_TARGET"
  | "SWAP_OPPONENT"
  | "SWAP_OWN"
  | "AUCTION_INITIATOR"
  | "AUCTION_OFFERS";

export type PowerInteraction = {
  /** Monotonic id; commands carrying an older id are rejected as stale. */
  id: number;
  /** null while the initiator is choosing among the four powers. */
  kind: PowerId | null;
  step: PowerStep;
  initiatorId: string;
  /** Bomb target · Swap: rival property received · Auction: initiator's offered property. */
  target: string | null;
  /** Power Swap: initiator's own property given away. */
  give: string | null;
  /** Power Swap: owner of `target` when it was selected; a change refuses the swap. */
  targetOwner: string | null;
  /** Auction: player id whose confirmed offer the initiator has selected. */
  offerFrom: string | null;
  /** Auction: confirmed offers, playerId -> propertyId. */
  offers: Record<string, string>;
  /** Auction: opponents' pending (unconfirmed) selections, playerId -> propertyId. */
  drafts: Record<string, string>;
  /** Auction: opponents who chose not to offer. */
  declined: string[];
  /** Server deadline (epoch ms) for the whole Auction; null otherwise. */
  deadline: number | null;
};

export type BombRecord = {
  id: string;
  propertyId: string;
  byPlayerId: string;
  round: number;
  /** Repair cost from the SCAMCITY data; repair itself is not an action yet. */
  repairCost: number;
};

export type RentFreeStatus = {
  remainingCircuits: number;
  activatedRound: number;
};

export type PowerEventKind =
  | "bomb"
  | "power-swap"
  | "auction"
  | "rent-free"
  | "rent-blocked"
  | "rent-free-ended"
  | "power-cancelled"
  | "power-timeout"
  | "auction-expired";

/** Authoritative record of a completed power outcome, rendered by every client. */
export type PowerEvent = {
  id: number;
  kind: PowerEventKind;
  playerId: string;
  text: string;
  propertyIds: string[];
  fromTileId?: string;
  rentBefore?: number;
  rentAfter?: number;
  amount?: number;
  counterpartyId?: string;
};

export type GameState = {
  players: Player[];
  owners: Record<string, string>;
  buildings: Record<string, number>;
  round: number;
  turn: number;
  phase: "roll" | "decision" | "power" | "finished";
  message: string;
  lastRoll: number | null;
  lastLanding: LastLanding | null;
  winner: string | null;
  activity: string[];
  powerInteraction: PowerInteraction | null;
  powerSeq: number;
  powerEvent: PowerEvent | null;
  bombs: BombRecord[];
  rentFree: Record<string, RentFreeStatus>;
};

export type GameEvent = {
  type: string;
  text: string;
  payload?: Record<string, unknown>;
};

export type PowerCommand =
  | { type: "CHOOSE_POWER"; powerId: string; interactionId?: number }
  | { type: "POWER_SELECT"; propertyId: string; interactionId?: number }
  | { type: "POWER_CONFIRM"; interactionId?: number }
  | { type: "POWER_DECLINE"; interactionId?: number }
  | { type: "POWER_CANCEL"; interactionId?: number };

export type GameCommand =
  | { type: "ROLL" }
  | { type: "BUY_PROPERTY" }
  | { type: "PASS_PROPERTY" }
  | { type: "BUILD"; propertyId: string }
  | { type: "CHOOSE_POWER"; powerId: string; interactionId?: number }
  | { type: "PASS_POWER"; interactionId?: number }
  | Exclude<PowerCommand, { type: "CHOOSE_POWER" }>;

export type CommandResult = { state: GameState; error?: string };

const avatars = [
  "#e96d52",
  "#5b9bd3",
  "#d5b84d",
  "#7dbb77",
  "#9b78bb",
  "#43a9a2",
];
const propertyKinds = new Set(["city", "transport", "business"]);

const newPlayer = (name: string, index: number): Player => ({
  id: `p${index}`,
  name,
  avatar: avatars[index],
  cash: RULES.startingCashByOrder[index],
  position: 0,
  properties: [],
  jailed: false,
  debt: 0,
  status: "ACTIVE",
  condition: {},
  powers: [],
});

export const createGame = (names: string[]): GameState => ({
  players: names.slice(0, 6).map((name, index) => newPlayer(name, index)),
  owners: {},
  buildings: {},
  round: 1,
  turn: 0,
  phase: "roll",
  message: "Roll to start your turn.",
  lastRoll: null,
  lastLanding: null,
  winner: null,
  activity: ["The table is set. Scam City is live."],
  powerInteraction: null,
  powerSeq: 0,
  powerEvent: null,
  bombs: [],
  rentFree: {},
});

export const currentPlayer = (state: GameState) => state.players[state.turn];

export function addPlayer(state: GameState, name: string): GameState {
  if (state.phase === "finished" || state.players.length >= 6 || !name.trim()) {
    return state;
  }
  const next = structuredClone(state);
  const index = next.players.length;
  next.players.push(newPlayer(name.trim().slice(0, 24), index));
  addActivity(next, `${name.trim()} joined the game.`);
  return next;
}

export const calculateNetWorth = (player: Player, state: GameState) =>
  player.cash +
  player.properties.reduce((sum, id) => {
    const tile = BOARD.find((candidate) => candidate.id === id);
    return (
      sum +
      (tile?.sellValue ?? 0) +
      (state.buildings[id] ?? 0) *
        (tile?.developmentCost ?? 0) *
        RULES.property.developmentSellRate
    );
  }, 0) -
  player.debt;

export const netWorth = (state: GameState, player: Player) =>
  calculateNetWorth(player, state);

export const groupComplete = (
  state: GameState,
  player: Player,
  group: string,
) =>
  BOARD.filter((tile) => tile.group === group).every(
    (tile) => state.owners[tile.id] === player.id,
  );

/**
 * Bomb rule: halve the rent, round DOWN to the previous $5 step, never below
 * the $1 minimum. A rent already at the minimum is left alone.
 */
export function bombedRent(rent: number): number {
  const { bombMinimumRent: minimum, bombRoundingStep: step } = RULES.powers;
  if (rent <= minimum) return rent;
  return Math.max(minimum, Math.floor(rent / 2 / step) * step);
}

export function rentFor(state: GameState, tile: Tile, owner: Player): number {
  const level = state.buildings[tile.id] ?? 0;
  const schedule = tile.rentSchedule;
  let amount = tile.rent ?? 0;

  if (tile.kind === "city" && level > 0 && schedule?.development) {
    amount = schedule.development[level - 1] ?? schedule.development[3];
  } else if (tile.group && schedule) {
    const ownedCount = BOARD.filter(
      (candidate) =>
        candidate.group === tile.group && state.owners[candidate.id] === owner.id,
    ).length;
    amount =
      ownedCount >= 3
        ? schedule.three
        : ownedCount === 2
          ? schedule.two
          : schedule.one;
  }

  amount *= owner.condition[tile.id] ?? 1;
  let rent = Math.max(0, Math.round(amount));
  // Each Bomb on this property operates on its current rent in turn.
  const bombs = (state.bombs ?? []).filter((bomb) => bomb.propertyId === tile.id);
  for (let index = 0; index < bombs.length; index++) rent = bombedRent(rent);
  return rent;
}

export const calculateCityRent = (propertyId: string, state: GameState) => {
  const tile = BOARD.find((candidate) => candidate.id === propertyId);
  const ownerId = state.owners[propertyId];
  const owner = state.players.find((candidate) => candidate.id === ownerId);
  return tile && owner ? rentFor(state, tile, owner) : 0;
};

function addActivity(state: GameState, text: string) {
  state.activity = [text, ...state.activity].slice(0, 12);
  state.message = text;
}

function emitPowerEvent(
  state: GameState,
  event: Omit<PowerEvent, "id">,
): PowerEvent {
  state.powerSeq += 1;
  const full: PowerEvent = { id: state.powerSeq, ...event };
  state.powerEvent = full;
  return full;
}

function randomInt(max: number) {
  if (!Number.isInteger(max) || max < 1) {
    throw new RangeError("Random bound must be a positive integer.");
  }
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.getRandomValues) {
    throw new Error("A secure random number generator is required.");
  }
  const limit = Math.floor(0x1_0000_0000 / max) * max;
  const value = new Uint32Array(1);
  do {
    cryptoApi.getRandomValues(value);
  } while (value[0] >= limit);
  return value[0] % max;
}

function finishIfWon(state: GameState) {
  const winner = state.players.find(
    (player) => netWorth(state, player) >= RULES.victory.targetNetWorth,
  );
  if (winner) {
    state.winner = winner.id;
    state.phase = "finished";
    state.powerInteraction = null;
    addActivity(state, `${winner.name} reached the wealth target and wins Scam City!`);
  }
}

function advanceToNextPlayer(state: GameState) {
  state.turn = (state.turn + 1) % state.players.length;
  if (state.turn === 0) state.round += 1;
  state.phase = "roll";
  state.lastRoll = null;

  if (state.round > RULES.victory.roundLimit) {
    state.winner = [...state.players].sort(
      (a, b) => netWorth(state, b) - netWorth(state, a),
    )[0].id;
    state.phase = "finished";
    addActivity(
      state,
      `${state.players.find((player) => player.id === state.winner)?.name} wins Scam City!`,
    );
    return;
  }

  addActivity(state, `${currentPlayer(state).name}'s turn.`);
}

/** Resolve turn continuation after all automatic effects and pending choices. */
function continueAfterLanding(state: GameState) {
  if (state.phase === "finished") return;
  if (state.lastRoll === 6) {
    state.phase = "roll";
    addActivity(state, `${currentPlayer(state).name} rolled a 6. Roll again!`);
    return;
  }
  advanceToNextPlayer(state);
}

function isPurchasable(tile: Tile) {
  return propertyKinds.has(tile.kind) && typeof tile.price === "number";
}

const tileById = (id: string) => BOARD.find((tile) => tile.id === id);
const playerById = (state: GameState, id: string | null | undefined) =>
  id ? state.players.find((player) => player.id === id) : undefined;

/** Every purchasable board property, in board order. */
export const propertyIds = () =>
  BOARD.filter(isPurchasable).map((tile) => tile.id);

const isProperty = (id: string) => {
  const tile = tileById(id);
  return Boolean(tile && isPurchasable(tile));
};

/** Current rent a property would charge, including Bomb halving. */
export function currentRent(state: GameState, propertyId: string): number {
  const tile = tileById(propertyId);
  if (!tile) return 0;
  const owner = playerById(state, state.owners[propertyId]);
  return owner ? rentFor(state, tile, owner) : (tile.rent ?? 0);
}

export const isRentProtected = (state: GameState, playerId: string) =>
  Boolean(state.rentFree?.[playerId]);

/**
 * One Rent Free "circuit" completes each time the protected player crosses the
 * START boundary moving forward, which is the same boundary that pays salary.
 */
function crossStart(state: GameState, player: Player) {
  player.cash += RULES.salary;
  addActivity(state, `${player.name} collected $${RULES.salary} from START.`);
  const status = state.rentFree?.[player.id];
  if (!status) return;
  status.remainingCircuits -= 1;
  if (status.remainingCircuits <= 0) {
    delete state.rentFree[player.id];
    emitPowerEvent(state, {
      kind: "rent-free-ended",
      playerId: player.id,
      propertyIds: [],
      text: `${player.name}'s RENT FREE ROUND has ended. Rent applies again.`,
    });
    addActivity(state, `${player.name}'s RENT FREE ROUND has ended.`);
  } else {
    addActivity(
      state,
      `${player.name} completed a circuit of Rent Free (${status.remainingCircuits} left).`,
    );
  }
}

/**
 * Charge rent for a property landing. Rent Free blocks the payment entirely:
 * no cash moves, the owner is not credited, and nothing else changes.
 */
function collectRent(
  state: GameState,
  payer: Player,
  tile: Tile,
  owner: Player,
  suffix: string,
) {
  const rent = rentFor(state, tile, owner);
  if (isRentProtected(state, payer.id)) {
    emitPowerEvent(state, {
      kind: "rent-blocked",
      playerId: payer.id,
      propertyIds: [tile.id],
      amount: rent,
      counterpartyId: owner.id,
      text: `RENT BLOCKED: ${payer.name} is protected by RENT FREE. ${tile.name} rent of ${formatMoney(rent)} not paid.`,
    });
    addActivity(
      state,
      `RENT BLOCKED: ${payer.name} is protected by RENT FREE. ${tile.name} rent of ${formatMoney(rent)} not paid.`,
    );
    return;
  }
  const paid = Math.min(payer.cash, rent);
  payer.cash -= paid;
  owner.cash += paid;
  addActivity(
    state,
    `${payer.name} paid ${formatMoney(paid)} rent to ${owner.name} ${suffix}.`,
  );
}

function enterPowerStop(state: GameState, player: Player) {
  state.powerSeq += 1;
  state.powerInteraction = {
    id: state.powerSeq,
    kind: null,
    step: "CHOOSE",
    initiatorId: player.id,
    target: null,
    give: null,
    targetOwner: null,
    offerFrom: null,
    offers: {},
    drafts: {},
    declined: [],
    deadline: null,
  };
  state.phase = "power";
  addActivity(state, `${player.name} landed on SUPER POWER. Choose your power.`);
}

export function roll(
  state: GameState,
  value?: number,
  rng: (max: number) => number = randomInt,
): { state: GameState; events: GameEvent[] } {
  if (state.phase !== "roll" || state.winner) {
    return { state, events: [] };
  }
  const next = structuredClone(state);
  const player = currentPlayer(next);
  const from = player.position;
  const result = value ?? rng(6) + 1;
  if (!Number.isInteger(result) || result < 1 || result > 6) {
    return { state, events: [] };
  }

  const rawPosition = from + result;
  player.position = rawPosition % BOARD.length;
  if (rawPosition >= BOARD.length) {
    crossStart(next, player);
  }
  next.lastRoll = result;
  const landedTile = BOARD[player.position];

  if (isPurchasable(landedTile)) {
    const ownerId = next.owners[landedTile.id];
    if (ownerId && ownerId !== player.id) {
      const owner = playerById(next, ownerId)!;
      collectRent(next, player, landedTile, owner, `for ${landedTile.name}`);
    } else {
      addActivity(next, `${player.name} landed on ${landedTile.name}.`);
    }

    if (!ownerId) {
      next.phase = "decision";
    }
  } else if (landedTile.kind === "bank") {
    const totalWeight = RULES.bank.outcomes.reduce(
      (total, outcome) => total + outcome.weight,
      0,
    );
    let ticket = rng(totalWeight);
    const outcome =
      RULES.bank.outcomes.find((item) => {
        ticket -= item.weight;
        return ticket < 0;
      }) ?? RULES.bank.outcomes[0];

    if (outcome.type === "cash") {
      player.cash = Math.max(0, player.cash + outcome.amount);
      addActivity(
        next,
        `${outcome.amount >= 0 ? "Lucky! " : "Bank fee: "}${player.name} ${outcome.amount >= 0 ? "got" : "paid"} ${formatMoney(Math.abs(outcome.amount))} at the Bank.`,
      );
    } else if (outcome.type === "lowest") {
      const other = next.players
        .filter((candidate) => candidate.id !== player.id && candidate.status === "ACTIVE")
        .sort((a, b) => a.cash - b.cash)[0];
      if (other) {
        other.cash += outcome.amount;
        player.cash = Math.max(0, player.cash - outcome.amount);
        addActivity(
          next,
          `${player.name} paid ${formatMoney(outcome.amount)} to ${other.name} at the Bank.`,
        );
      }
    } else if (outcome.type === "move") {
      const oldPosition = player.position;
      const destination =
        (oldPosition + outcome.spaces + BOARD.length) % BOARD.length;
      if (outcome.spaces > 0 && destination < oldPosition) {
        crossStart(next, player);
      }
      player.position = destination;
      addActivity(
        next,
        `${player.name} was moved ${outcome.spaces > 0 ? "forward" : "back"} ${Math.abs(outcome.spaces)} at the Bank.`,
      );
      const destinationTile = BOARD[destination];
      const ownerId = next.owners[destinationTile.id];
      if (ownerId && ownerId !== player.id && isPurchasable(destinationTile)) {
        const owner = playerById(next, ownerId)!;
        collectRent(next, player, destinationTile, owner, "after the Bank move");
      }
    } else {
      const destination = BOARD[rng(BOARD.length)];
      const oldPosition = player.position;
      const destinationPosition = BOARD.findIndex(
        (candidate) => candidate.id === destination.id,
      );
      if (destinationPosition < oldPosition) crossStart(next, player);
      player.position = destinationPosition;
      addActivity(next, `${player.name} travelled to ${destination.name} from the Bank.`);
      const ownerId = next.owners[destination.id];
      if (ownerId && ownerId !== player.id && isPurchasable(destination)) {
        const owner = playerById(next, ownerId)!;
        collectRent(next, player, destination, owner, "after the Bank travel");
      }
    }
  } else if (landedTile.kind === "tax") {
    const tax = landedTile.taxAmount ?? 0;
    const paid = Math.min(player.cash, tax);
    player.cash -= paid;
    addActivity(next, `${player.name} paid ${formatMoney(paid)} property tax.`);
  } else if (landedTile.kind === "jail") {
    addActivity(next, `${player.name} is visiting Jail. Keep your eyes open.`);
  }

  next.lastLanding = {
    playerId: player.id,
    tileId: BOARD[player.position].id,
    roll: result,
  };

  finishIfWon(next);
  if (next.phase !== "finished" && next.phase !== "decision") {
    // A Super Power stop (direct landing or after a Bank move) waits for the
    // player's choice; the turn engine resumes once that power resolves.
    if (BOARD[player.position].kind === "power") {
      enterPowerStop(next, player);
    } else {
      continueAfterLanding(next);
    }
  }

  return {
    state: next,
    events: [
      {
        type: "DICE_ROLLED",
        text: next.message,
        payload: { value: result, position: player.position },
      },
    ],
  };
}

function formatMoney(amount: number) {
  return `$${Math.round(amount).toLocaleString()}`;
}

export function buy(state: GameState): GameState {
  if (state.phase !== "decision") return state;
  const next = structuredClone(state);
  const player = currentPlayer(next);
  const tile = BOARD[player.position];
  if (
    !isPurchasable(tile) ||
    next.owners[tile.id] ||
    !tile.price ||
    player.cash < tile.price
  ) {
    return state;
  }

  player.cash -= tile.price;
  player.properties.push(tile.id);
  next.owners[tile.id] = player.id;
  addActivity(next, `${player.name} bought ${tile.name} for ${formatMoney(tile.price)}.`);
  finishIfWon(next);
  continueAfterLanding(next);
  return next;
}

export function build(state: GameState, propertyId: string): GameState {
  if (state.phase !== "roll") return state;
  const next = structuredClone(state);
  const player = currentPlayer(next);
  const tile = BOARD.find((candidate) => candidate.id === propertyId);
  const level = next.buildings[propertyId] ?? 0;
  if (
    !tile ||
    tile.kind !== "city" ||
    !tile.group ||
    next.owners[propertyId] !== player.id ||
    !groupComplete(next, player, tile.group) ||
    player.cash < (tile.developmentCost ?? 0) ||
    level >= 4
  ) {
    return state;
  }

  player.cash -= tile.developmentCost ?? 0;
  next.buildings[propertyId] = level + 1;
  addActivity(
    next,
    `${player.name} developed ${tile.name} to ${RULES.development.levels[level]}.`,
  );
  finishIfWon(next);
  return next;
}

export function passProperty(state: GameState): GameState {
  if (state.phase !== "decision") return state;
  const next = structuredClone(state);
  const player = currentPlayer(next);
  const tile = BOARD[player.position];
  if (!isPurchasable(tile) || next.owners[tile.id]) return state;
  addActivity(next, `${player.name} passed on ${tile.name}.`);
  continueAfterLanding(next);
  return next;
}

/* ------------------------------------------------------------------------- */
/* Super Power interactions                                                   */
/* ------------------------------------------------------------------------- */

const ownerOf = (state: GameState, propertyId: string) =>
  state.owners[propertyId];

/** Properties a Bomb may hit: rival-owned and still above the minimum rent. */
export function canBomb(state: GameState, propertyId: string, bomberId: string) {
  const owner = ownerOf(state, propertyId);
  return (
    isProperty(propertyId) &&
    Boolean(owner) &&
    owner !== bomberId &&
    currentRent(state, propertyId) > RULES.powers.bombMinimumRent
  );
}

/** Each power's availability for a player; a string is the reason it is blocked. */
export function powerAvailability(
  state: GameState,
  playerId: string,
): Record<PowerId, string | null> {
  const ids = propertyIds();
  const mine = ids.filter((id) => ownerOf(state, id) === playerId);
  const rivals = ids.filter((id) => ownerOf(state, id) && ownerOf(state, id) !== playerId);
  return {
    bomb: ids.some((id) => canBomb(state, id, playerId))
      ? null
      : "No rival property has rent left to halve.",
    "power-swap":
      rivals.length && mine.length
        ? null
        : "Needs one rival property and one of your own.",
    auction: mine.length ? null : "Needs one of your properties to offer.",
    "rent-free": isRentProtected(state, playerId)
      ? "RENT FREE is already active for you."
      : null,
  };
}

const actorIsInitiator = (i: PowerInteraction, playerId: string) =>
  i.initiatorId === playerId;

/** Who must act right now. Everyone else sees a waiting state. */
export function powerActorIds(state: GameState): string[] {
  const i = state.powerInteraction;
  if (state.phase !== "power" || !i) return [];
  if (i.step !== "AUCTION_OFFERS") return [i.initiatorId];
  const pendingOpponents = state.players
    .map((player) => player.id)
    .filter(
      (id) =>
        id !== i.initiatorId && !i.offers[id] && !i.declined.includes(id),
    );
  return [i.initiatorId, ...pendingOpponents];
}

/** Property ids this viewer may select right now. Identical for every client. */
export function powerEligibleIds(state: GameState, viewerId: string): string[] {
  const i = state.powerInteraction;
  if (state.phase !== "power" || !i) return [];
  const mine = propertyIds().filter((id) => ownerOf(state, id) === viewerId);
  const rivals = propertyIds().filter(
    (id) => ownerOf(state, id) && ownerOf(state, id) !== viewerId,
  );
  const initiator = actorIsInitiator(i, viewerId);
  switch (i.step) {
    case "BOMB_TARGET":
      return initiator
        ? propertyIds().filter((id) => canBomb(state, id, viewerId))
        : [];
    case "SWAP_OPPONENT":
      return initiator ? rivals : [];
    case "SWAP_OWN":
      // Own properties only become eligible after the rival choice is accepted.
      return initiator ? [...mine, ...rivals] : [];
    case "AUCTION_INITIATOR":
      return initiator ? mine : [];
    case "AUCTION_OFFERS":
      if (initiator) return Object.values(i.offers);
      if (
        !state.players.some((player) => player.id === viewerId) ||
        i.offers[viewerId] ||
        i.declined.includes(viewerId)
      ) {
        return [];
      }
      return mine;
    default:
      return [];
  }
}

/** Properties this viewer should see as SELECTED (their own draft included). */
export function powerSelectedIds(state: GameState, viewerId: string): string[] {
  const i = state.powerInteraction;
  if (state.phase !== "power" || !i) return [];
  const ids: string[] = [];
  if (i.target) ids.push(i.target);
  if (i.give) ids.push(i.give);
  if (i.step === "AUCTION_OFFERS") {
    ids.push(...Object.values(i.offers));
    if (i.drafts[viewerId]) ids.push(i.drafts[viewerId]);
  }
  return [...new Set(ids)];
}

function transferProperty(state: GameState, propertyId: string, toId: string) {
  const fromId = state.owners[propertyId];
  if (fromId) {
    const from = playerById(state, fromId)!;
    from.properties = from.properties.filter((id) => id !== propertyId);
  }
  playerById(state, toId)!.properties.push(propertyId);
  state.owners[propertyId] = toId;
}

function completePower(state: GameState) {
  state.powerInteraction = null;
  state.phase = "roll";
  continueAfterLanding(state);
}

function resetInteractionToChoices(state: GameState) {
  const i = state.powerInteraction!;
  state.powerSeq += 1;
  state.powerInteraction = {
    id: state.powerSeq,
    kind: null,
    step: "CHOOSE",
    initiatorId: i.initiatorId,
    target: null,
    give: null,
    targetOwner: null,
    offerFrom: null,
    offers: {},
    drafts: {},
    declined: [],
    deadline: null,
  };
}

const failure = (state: GameState, error: string): CommandResult => ({
  state,
  error,
});

/**
 * Validate and apply one Super Power command. Every client-supplied field is
 * checked here against the authoritative state; invalid input returns the
 * original state unchanged with an error.
 */
export function applyPowerCommand(
  state: GameState,
  actorId: string,
  command: PowerCommand | { type: "PASS_POWER"; interactionId?: number },
  now: number = Date.now(),
): CommandResult {
  if (state.phase !== "power" || !state.powerInteraction) {
    return failure(state, "No Super Power decision is pending.");
  }
  const current = state.powerInteraction;
  if (
    command.interactionId !== undefined &&
    command.interactionId !== current.id
  ) {
    return failure(state, "That Super Power prompt has already changed. Please use the latest prompt.");
  }
  if (!playerById(state, actorId)) {
    return failure(state, "You are not a player in this game.");
  }
  // The server, not the client timer, decides whether the Auction is still open.
  if (current.deadline !== null && now >= current.deadline) {
    return failure(state, "The AUCTION timer has expired. No trade can be completed.");
  }

  const next = structuredClone(state);
  const i = next.powerInteraction!;
  const player = playerById(next, actorId)!;

  switch (command.type) {
    case "CHOOSE_POWER": {
      if (i.kind !== null || i.step !== "CHOOSE") {
        return failure(state, "A Super Power is already in progress.");
      }
      if (!actorIsInitiator(i, actorId)) {
        return failure(state, `Waiting for ${playerById(state, i.initiatorId)?.name ?? "the player"} to choose a power.`);
      }
      const powerId = POWER_OPTIONS.find((power) => power.id === command.powerId)?.id;
      if (!powerId) return failure(state, "Unknown Super Power.");
      const blocked = powerAvailability(state, actorId)[powerId];
      if (blocked) return failure(state, blocked);

      if (powerId === "rent-free") {
        player.powers.push(powerId);
        next.rentFree[actorId] = {
          remainingCircuits: RULES.powers.rentFreeCircuits,
          activatedRound: next.round,
        };
        const text = `${player.name} activated RENT FREE ROUND: ${RULES.powers.rentFreeCircuits} circuits of protection from rent and property charges.`;
        emitPowerEvent(next, {
          kind: "rent-free",
          playerId: actorId,
          propertyIds: [],
          text,
        });
        addActivity(next, text);
        next.powerInteraction = null;
        next.phase = "roll";
        continueAfterLanding(next);
        return { state: next };
      }

      i.kind = powerId;
      if (powerId === "bomb") {
        i.step = "BOMB_TARGET";
        addActivity(next, `${player.name} chose BOMB. Pick a rival property to halve.`);
      } else if (powerId === "power-swap") {
        i.step = "SWAP_OPPONENT";
        addActivity(next, `${player.name} chose POWER SWAP. Pick a rival property first.`);
      } else {
        i.step = "AUCTION_INITIATOR";
        i.deadline = now + RULES.timing.auctionSeconds * 1000;
        addActivity(next, `${player.name} opened an AUCTION. Offer one of your properties.`);
      }
      return { state: next };
    }

    case "POWER_SELECT": {
      if (i.kind === null) return failure(state, "Choose a Super Power first.");
      if (!powerActorIds(state).includes(actorId)) {
        return failure(state, "Waiting for another player.");
      }
      const propertyId = String(command.propertyId ?? "");
      if (!powerEligibleIds(state, actorId).includes(propertyId)) {
        return failure(state, "That property is not eligible for this step.");
      }
      const name = tileById(propertyId)?.name ?? "property";
      switch (i.step) {
        case "BOMB_TARGET":
          i.target = propertyId;
          break;
        case "SWAP_OPPONENT":
          i.target = propertyId;
          i.targetOwner = ownerOf(state, propertyId) ?? null;
          i.give = null;
          i.step = "SWAP_OWN";
          addActivity(next, `${player.name} selected ${name}. Now choose one of your properties to give.`);
          break;
        case "SWAP_OWN":
          if (ownerOf(state, propertyId) === actorId) {
            i.give = propertyId;
          } else {
            i.target = propertyId;
            i.targetOwner = ownerOf(state, propertyId) ?? null;
          }
          break;
        case "AUCTION_INITIATOR":
          i.target = propertyId;
          break;
        case "AUCTION_OFFERS":
          if (actorIsInitiator(i, actorId)) {
            i.offerFrom = ownerOf(state, propertyId) ?? null;
          } else {
            i.drafts[actorId] = propertyId;
          }
          break;
        default:
          return failure(state, "This step does not accept a selection.");
      }
      return { state: next };
    }

    case "POWER_CONFIRM": {
      if (i.kind === null) return failure(state, "Choose a Super Power first.");
      if (!powerActorIds(state).includes(actorId)) {
        return failure(state, "Waiting for another player.");
      }

      if (i.step === "BOMB_TARGET") {
        const target = i.target;
        if (!target || !canBomb(state, target, actorId)) {
          i.target = null;
          return failure(state, "Select a rival property that still has rent to halve.");
        }
        const rentBefore = currentRent(state, target);
        const repairCost = tileById(target)?.repairCost ?? 0;
        next.bombs.push({
          id: `bomb-${next.powerSeq + 1}`,
          propertyId: target,
          byPlayerId: actorId,
          round: next.round,
          repairCost,
        });
        next.powerSeq += 1;
        const rentAfter = currentRent(next, target);
        const owner = playerById(next, ownerOf(next, target))!;
        const text = `BOMB hit ${tileById(target)!.name} (${owner.name}): rent ${formatMoney(rentBefore)} → ${formatMoney(rentAfter)}. Ownership unchanged.`;
        next.powerEvent = {
          id: next.powerSeq,
          kind: "bomb",
          playerId: actorId,
          propertyIds: [target],
          fromTileId: "tile_20",
          rentBefore,
          rentAfter,
          counterpartyId: owner.id,
          text,
        };
        addActivity(next, text);
        player.powers.push("bomb");
        completePower(next);
        return { state: next };
      }

      if (i.step === "SWAP_OWN") {
        const { target, give } = i;
        if (!target || !give) {
          return failure(state, "Select both properties before confirming POWER SWAP.");
        }
        const receiveOwner = ownerOf(state, target);
        if (
          !receiveOwner ||
          receiveOwner === actorId ||
          ownerOf(state, give) !== actorId ||
          !isProperty(target) ||
          !isProperty(give)
        ) {
          // Ownership changed before confirmation: clear the stale selection for
          // every client. Nothing transfers.
          i.target = null;
          i.give = null;
          i.targetOwner = null;
          i.step = "SWAP_OPPONENT";
          addActivity(next, "POWER SWAP selection went stale. Select a rival property again.");
          return { state: next, error: "Ownership changed before confirmation. Select the rival property again." };
        }
        if (receiveOwner !== i.targetOwner) {
          i.target = null;
          i.give = null;
          i.targetOwner = null;
          i.step = "SWAP_OPPONENT";
          addActivity(next, "POWER SWAP selection went stale. Select a rival property again.");
          return {
            state: next,
            error: "That property changed owner before confirmation. Select it again.",
          };
        }
        const other = playerById(next, receiveOwner)!;
        transferProperty(next, target, actorId);
        transferProperty(next, give, other.id);
        const text = `POWER SWAP: ${player.name} received ${tileById(target)!.name} from ${other.name} for ${tileById(give)!.name}.`;
        emitPowerEvent(next, {
          kind: "power-swap",
          playerId: actorId,
          propertyIds: [target, give],
          counterpartyId: other.id,
          text,
        });
        addActivity(next, text);
        player.powers.push("power-swap");
        completePower(next);
        return { state: next };
      }

      if (i.step === "AUCTION_INITIATOR") {
        const target = i.target;
        if (!target || ownerOf(state, target) !== actorId) {
          i.target = null;
          return failure(state, "Select one of your properties to offer.");
        }
        i.step = "AUCTION_OFFERS";
        addActivity(next, `${player.name} offers ${tileById(target)!.name}. Rivals may submit one property each.`);
        return { state: next };
      }

      if (i.step === "AUCTION_OFFERS") {
        if (actorIsInitiator(i, actorId)) {
          const offerFrom = i.offerFrom;
          const offerPid = offerFrom ? i.offers[offerFrom] : undefined;
          const target = i.target;
          if (
            !offerFrom ||
            !offerPid ||
            !target ||
            ownerOf(state, target) !== actorId ||
            ownerOf(state, offerPid) !== offerFrom ||
            offerFrom === actorId
          ) {
            return failure(state, "Select a valid rival offer before TRADE.");
          }
          const counterparty = playerById(next, offerFrom)!;
          transferProperty(next, target, offerFrom);
          transferProperty(next, offerPid, actorId);
          const bonus = RULES.economy.exchangeBonus;
          player.cash += bonus;
          counterparty.cash += bonus;
          const text = `AUCTION complete: ${player.name} and ${counterparty.name} swapped ${tileById(target)!.name} for ${tileById(offerPid)!.name}. Each received ${formatMoney(bonus)} from the Bank.`;
          emitPowerEvent(next, {
            kind: "auction",
            playerId: actorId,
            propertyIds: [target, offerPid],
            amount: bonus,
            counterpartyId: counterparty.id,
            text,
          });
          addActivity(next, text);
          player.powers.push("auction");
          completePower(next);
          return { state: next };
        }

        const draft = i.drafts[actorId];
        if (!draft || ownerOf(state, draft) !== actorId || i.offers[actorId]) {
          delete i.drafts[actorId];
          return failure(state, "Select one of your own properties before submitting your offer.");
        }
        i.offers[actorId] = draft;
        delete i.drafts[actorId];
        addActivity(next, `${player.name} submitted an offer: ${tileById(draft)!.name}.`);
        return { state: next };
      }

      return failure(state, "This step cannot be confirmed.");
    }

    case "POWER_DECLINE": {
      if (i.step !== "AUCTION_OFFERS" || actorIsInitiator(i, actorId)) {
        return failure(state, "Only rival players can decline an Auction offer.");
      }
      if (!powerActorIds(state).includes(actorId)) {
        return failure(state, "Waiting for another player.");
      }
      i.declined = [...i.declined, actorId];
      delete i.drafts[actorId];
      addActivity(next, `${player.name} passed on the Auction.`);
      return { state: next };
    }

    case "POWER_CANCEL":
    case "PASS_POWER": {
      if (!actorIsInitiator(i, actorId)) {
        return failure(state, "Only the player who landed on Super Power can cancel it.");
      }
      if (i.kind === null) {
        // CANCEL on the choice page ends the pending power; the turn resumes.
        addActivity(next, `${player.name} passed on the Super Power.`);
        completePower(next);
        return { state: next };
      }
      // Cancellation returns to the four choices. No transfer, bonus or effect.
      const label = POWER_OPTIONS.find((power) => power.id === i.kind)?.name ?? "power";
      resetInteractionToChoices(next);
      emitPowerEvent(next, {
        kind: "power-cancelled",
        playerId: actorId,
        propertyIds: [],
        text: `${player.name} cancelled ${label}. Choose again.`,
      });
      addActivity(next, `${player.name} cancelled ${label}. Choose again.`);
      return { state: next };
    }

    default:
      return failure(state, "Unknown Super Power command.");
  }
}

/** Server timer expiry: cancel whatever is pending and resume the turn engine. */
export function timeoutPowerInteraction(state: GameState): GameState {
  if (state.phase !== "power" || !state.powerInteraction) return state;
  const next = structuredClone(state);
  const i = next.powerInteraction!;
  const player = playerById(next, i.initiatorId)!;
  if (i.kind === "auction") {
    emitPowerEvent(next, {
      kind: "auction-expired",
      playerId: player.id,
      propertyIds: [],
      text: `AUCTION expired after ${RULES.timing.auctionSeconds} seconds. No properties moved and no bonus was paid.`,
    });
    addActivity(next, "AUCTION expired. No properties moved and no bonus was paid.");
  } else {
    emitPowerEvent(next, {
      kind: "power-timeout",
      playerId: player.id,
      propertyIds: [],
      text: `${player.name}'s Super Power timed out. Nothing was applied.`,
    });
    addActivity(next, `${player.name}'s Super Power timed out. Nothing was applied.`);
  }
  completePower(next);
  return next;
}

export function choosePower(
  state: GameState,
  id: PowerId,
  actorId: string = currentPlayer(state)?.id,
): GameState {
  return applyPowerCommand(state, actorId, { type: "CHOOSE_POWER", powerId: id }).state;
}

export function skipPower(state: GameState, actorId: string = currentPlayer(state)?.id): GameState {
  return applyPowerCommand(state, actorId, { type: "POWER_CANCEL" }).state;
}

/**
 * Single authoritative dispatch for every game command. The server calls this
 * with the seat-derived actor id; nothing from the client decides who acts.
 */
export function applyGameCommand(
  state: GameState,
  actorId: string,
  command: GameCommand,
  now: number = Date.now(),
): CommandResult {
  switch (command?.type) {
    case "ROLL":
    case "BUY_PROPERTY":
    case "PASS_PROPERTY":
    case "BUILD": {
      if (currentPlayer(state)?.id !== actorId) {
        return failure(state, "NOT_YOUR_TURN");
      }
      let next = state;
      if (command.type === "ROLL") next = roll(state).state;
      else if (command.type === "BUY_PROPERTY") next = buy(state);
      else if (command.type === "PASS_PROPERTY") next = passProperty(state);
      else next = build(state, String(command.propertyId));
      if (next === state) {
        return failure(state, "Action is not valid in this phase or state.");
      }
      return { state: next };
    }
    case "CHOOSE_POWER":
    case "PASS_POWER":
    case "POWER_SELECT":
    case "POWER_CONFIRM":
    case "POWER_DECLINE":
    case "POWER_CANCEL":
      return applyPowerCommand(state, actorId, command as PowerCommand, now);
    default:
      return failure(state, "Unknown game command.");
  }
}

export const tileAt = (position: number): Tile => BOARD[position];
