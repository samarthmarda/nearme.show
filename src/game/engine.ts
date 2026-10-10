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
  powers: string[];
};

export type LastLanding = {
  playerId: string;
  tileId: string;
  roll: number;
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
};

export type GameEvent = {
  type: string;
  text: string;
  payload?: Record<string, unknown>;
};

const avatars = [
  "#e96d52",
  "#5b9bd3",
  "#d5b84d",
  "#7dbb77",
  "#9b78bb",
  "#43a9a2",
];
const propertyKinds = new Set(["city", "transport", "business"]);

export const createGame = (names: string[]): GameState => ({
  players: names.slice(0, 6).map((name, index) => ({
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
  })),
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
});

export const currentPlayer = (state: GameState) => state.players[state.turn];

export function addPlayer(state: GameState, name: string): GameState {
  if (state.phase === "finished" || state.players.length >= 6 || !name.trim()) {
    return state;
  }
  const next = structuredClone(state);
  const index = next.players.length;
  next.players.push({
    id: `p${index}`,
    name: name.trim().slice(0, 24),
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
  return Math.max(0, Math.round(amount));
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
    player.cash += RULES.salary;
    addActivity(next, `${player.name} collected $${RULES.salary} from START.`);
  }
  next.lastRoll = result;
  const landedTile = BOARD[player.position];

  if (isPurchasable(landedTile)) {
    const ownerId = next.owners[landedTile.id];
    if (ownerId && ownerId !== player.id) {
      const owner = next.players.find((candidate) => candidate.id === ownerId)!;
      const rent = rentFor(next, landedTile, owner);
      const paid = Math.min(player.cash, rent);
      player.cash -= paid;
      owner.cash += paid;
      addActivity(
        next,
        `${player.name} paid ${formatMoney(paid)} rent to ${owner.name} for ${landedTile.name}.`,
      );
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
        player.cash += RULES.salary;
        addActivity(next, `${player.name} collected $${RULES.salary} from START.`);
      }
      player.position = destination;
      addActivity(
        next,
        `${player.name} was moved ${outcome.spaces > 0 ? "forward" : "back"} ${Math.abs(outcome.spaces)} at the Bank.`,
      );
      const destinationTile = BOARD[destination];
      const ownerId = next.owners[destinationTile.id];
      if (ownerId && ownerId !== player.id && isPurchasable(destinationTile)) {
        const owner = next.players.find((candidate) => candidate.id === ownerId)!;
        const rent = rentFor(next, destinationTile, owner);
        const paid = Math.min(player.cash, rent);
        player.cash -= paid;
        owner.cash += paid;
        addActivity(
          next,
          `${player.name} paid ${formatMoney(paid)} rent to ${owner.name} after the Bank move.`,
        );
      }
    } else {
      const destination = BOARD[rng(BOARD.length)];
      const oldPosition = player.position;
      const destinationPosition = BOARD.findIndex(
        (candidate) => candidate.id === destination.id,
      );
      if (destinationPosition < oldPosition) player.cash += RULES.salary;
      player.position = destinationPosition;
      addActivity(next, `${player.name} travelled to ${destination.name} from the Bank.`);
      const ownerId = next.owners[destination.id];
      if (ownerId && ownerId !== player.id && isPurchasable(destination)) {
        const owner = next.players.find((candidate) => candidate.id === ownerId)!;
        const rent = rentFor(next, destination, owner);
        const paid = Math.min(player.cash, rent);
        player.cash -= paid;
        owner.cash += paid;
        addActivity(next, `${player.name} paid ${formatMoney(paid)} after the Bank travel.`);
      }
    }
  } else if (landedTile.kind === "tax") {
    const tax = landedTile.taxAmount ?? 0;
    const paid = Math.min(player.cash, tax);
    player.cash -= paid;
    addActivity(next, `${player.name} paid ${formatMoney(paid)} property tax.`);
  } else if (landedTile.kind === "jail") {
    addActivity(next, `${player.name} is visiting Jail. Keep your eyes open.`);
  } else if (landedTile.kind === "power") {
    const power = POWER_OPTIONS[rng(POWER_OPTIONS.length)];
    player.powers.push(power.id);
    addActivity(next, `${player.name} received ${power.name} at the Super Power stop.`);
  }

  next.lastLanding = {
    playerId: player.id,
    tileId: BOARD[player.position].id,
    roll: result,
  };

  finishIfWon(next);
  if (next.phase !== "finished" && next.phase !== "decision") {
    continueAfterLanding(next);
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

export function choosePower(state: GameState, id: PowerId): GameState {
  if (
    state.phase !== "power" ||
    !POWER_OPTIONS.some((power) => power.id === id)
  ) {
    return state;
  }
  const next = structuredClone(state);
  const player = currentPlayer(next);
  player.powers.push(id);
  addActivity(
    next,
    `${player.name} claimed ${POWER_OPTIONS.find((power) => power.id === id)!.name}.`,
  );
  next.phase = "roll";
  finishIfWon(next);
  continueAfterLanding(next);
  return next;
}

export function skipPower(state: GameState): GameState {
  if (state.phase !== "power") return state;
  const next = structuredClone(state);
  addActivity(next, `${currentPlayer(next).name} passed on the Super Power.`);
  next.phase = "roll";
  continueAfterLanding(next);
  return next;
}

export const tileAt = (position: number): Tile => BOARD[position];
