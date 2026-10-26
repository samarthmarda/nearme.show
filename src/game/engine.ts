import {
  BANK_CUES,
  cueById,
  type BankCueCard,
} from "./bankCues";
import {
  BOARD,
  DEFAULT_PRIVATE_SETTINGS,
  PLAYER_COLORS,
  POWER_OPTIONS,
  RULES,
  type MatchSettings,
  type NetWorthGoalOption,
  type PlayerCountOption,
  type PowerId,
  type RoundLimitOption,
  type Tile,
} from "./rules";

export { BANK_CUES, cueById, DEFAULT_PRIVATE_SETTINGS, type BankCueCard };
export type {
  MatchSettings,
  NetWorthGoalOption,
  PlayerCountOption,
  RoundLimitOption,
};

export type PlayerStatus =
  | "ACTIVE"
  | "JAILED"
  | "DISTRESSED"
  | "BANKRUPT"
  | "FORFEITED";

export type VictoryReason =
  | "NET_WORTH_GOAL"
  | "LAST_STANDING"
  | "ROUND_LIMIT";

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
  /** One-use Controlled Dice rolls granted by Bank Cue #64. */
  controlledRolls: number;
  /** Consecutive timed-out turns tracked by the server. */
  missedTurns: number;
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
  /** True when initiated by Bank Cue #68 (Scam Power), where CANCEL skips rather than returning to 4-power menu. */
  fromBankCue?: boolean;
};

export type BombRecord = {
  id: string;
  propertyId: string;
  byPlayerId: string;
  round: number;
  /** Authoritative repair cost from landlords.xlsx. */
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

export type TableNotificationCategory =
  | "purchase"
  | "rent"
  | "mortgaged-landing"
  | "build-house"
  | "build-tower"
  | "sell"
  | "mortgage"
  | "unmortgage"
  | "bomb"
  | "repair"
  | "power-swap"
  | "auction"
  | "rent-free"
  | "bank-card"
  | "controlled-roll"
  | "jail"
  | "start-salary"
  | "tax"
  | "bankruptcy"
  | "inactivity"
  | "victory"
  | "round"
  | "turn";

export type TableNotification = {
  id: number;
  kind: TableNotificationCategory;
  title: string;
  text: string;
  actorId?: string;
  counterpartyId?: string;
  propertyId?: string;
  amount?: number;
  cueId?: string;
  cueDescription?: string;
  cueEffect?: string;
  round: number;
};

export type GameState = {
  settings: MatchSettings;
  players: Player[];
  owners: Record<string, string>;
  buildings: Record<string, number>;
  mortgaged: Record<string, boolean>;
  round: number;
  turn: number;
  phase: "roll" | "decision" | "power" | "finished";
  message: string;
  lastRoll: number | null;
  lastLanding: LastLanding | null;
  winner: string | null;
  victoryReason: VictoryReason | null;
  activity: string[];
  notifications: TableNotification[];
  notificationSeq: number;
  lastBankCue: BankCueCard | null;
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
  | { type: "CHOOSE_POWER"; powerId: string; interactionId?: number; commandId?: string }
  | { type: "POWER_SELECT"; propertyId: string; interactionId?: number; commandId?: string }
  | { type: "POWER_CONFIRM"; interactionId?: number; commandId?: string }
  | { type: "POWER_DECLINE"; interactionId?: number; commandId?: string }
  | { type: "POWER_CANCEL"; interactionId?: number; commandId?: string };

export type GameCommand =
  | { type: "ROLL"; controlledValue?: number; commandId?: string }
  | { type: "JAIL_PAY_BAIL"; commandId?: string }
  | { type: "JAIL_SKIP_TURN"; commandId?: string }
  | { type: "BUY_PROPERTY"; commandId?: string }
  | { type: "PASS_PROPERTY"; commandId?: string }
  | { type: "BUILD"; propertyId: string; commandId?: string }
  | { type: "SELL_PROPERTY"; propertyId: string; commandId?: string }
  | { type: "MORTGAGE_PROPERTY"; propertyId: string; commandId?: string }
  | { type: "UNMORTGAGE_PROPERTY"; propertyId: string; commandId?: string }
  | { type: "REPAIR_PROPERTY"; propertyId: string; commandId?: string }
  | { type: "FORFEIT_SELF"; commandId?: string }
  | { type: "CHOOSE_POWER"; powerId: string; interactionId?: number; commandId?: string }
  | { type: "PASS_POWER"; interactionId?: number; commandId?: string }
  | Exclude<PowerCommand, { type: "CHOOSE_POWER" }>;

export type CommandResult = { state: GameState; error?: string };

const propertyKinds = new Set(["city", "transport", "business"]);

export const playerInitials = (name: string): string => {
  const cleaned = name.trim().toUpperCase();
  if (!cleaned) return "P";
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`;
  }
  return cleaned.slice(0, 2);
};

export const isEliminated = (player: Player): boolean =>
  player.status === "BANKRUPT" || player.status === "FORFEITED";

export function normalizeMatchSettings(
  partial?: Partial<MatchSettings>,
  fallbackPlayers = 6,
): MatchSettings {
  const rawPlayers = partial?.maxPlayers ?? fallbackPlayers;
  const maxPlayers = Math.min(6, Math.max(2, Math.round(rawPlayers))) as PlayerCountOption;
  const roundLimit: RoundLimitOption =
    partial && "roundLimit" in partial
      ? partial.roundLimit === 30 || partial.roundLimit === 50
        ? partial.roundLimit
        : null
      : (RULES.victory.roundLimit as RoundLimitOption);
  const targetNetWorth: NetWorthGoalOption =
    partial?.targetNetWorth === 3000 ||
    partial?.targetNetWorth === 5000 ||
    partial?.targetNetWorth === 7000
      ? partial.targetNetWorth
      : (RULES.victory.targetNetWorth as NetWorthGoalOption);

  return {
    mode: "LIVE",
    maxPlayers,
    roundLimit,
    targetNetWorth,
  };
}

const newPlayer = (name: string, index: number): Player => ({
  id: `p${index}`,
  name,
  avatar: PLAYER_COLORS[index % PLAYER_COLORS.length],
  cash: RULES.startingCashByOrder[index] ?? 1000,
  position: 0,
  properties: [],
  jailed: false,
  debt: 0,
  status: "ACTIVE",
  condition: {},
  powers: [],
  controlledRolls: 0,
  missedTurns: 0,
});

export const createGame = (
  names: string[],
  customSettings?: Partial<MatchSettings>,
): GameState => {
  const settings = normalizeMatchSettings(
    customSettings,
    RULES.players.max,
  );
  const players = names
    .slice(0, settings.maxPlayers)
    .map((name, index) => newPlayer(name, index));

  return {
    settings,
    players,
    owners: {},
    buildings: {},
    mortgaged: {},
    round: 1,
    turn: 0,
    phase: "roll",
    message: "Roll to start your turn.",
    lastRoll: null,
    lastLanding: null,
    winner: null,
    victoryReason: null,
    activity: ["The table is set. Scam City is live."],
    notifications: [
      {
        id: 1,
        kind: "turn",
        title: "MATCH LIVE",
        text: `Goal ${formatMoney(settings.targetNetWorth)} · Rounds: ${settings.roundLimit ?? "UNLIMITED"}`,
        actorId: players[0]?.id,
        round: 1,
      },
    ],
    notificationSeq: 1,
    lastBankCue: null,
    powerInteraction: null,
    powerSeq: 0,
    powerEvent: null,
    bombs: [],
    rentFree: {},
  };
};

export const currentPlayer = (state: GameState) => state.players[state.turn];

export function addPlayer(state: GameState, name: string): GameState {
  const cap = state.settings?.maxPlayers ?? 6;
  if (
    state.phase === "finished" ||
    state.players.length >= cap ||
    state.players.length >= 6 ||
    !name.trim()
  ) {
    return state;
  }
  const next = structuredClone(state);
  const index = next.players.length;
  const joined = newPlayer(name.trim().slice(0, 24), index);
  next.players.push(joined);
  pushNotification(next, {
    kind: "turn",
    title: "PLAYER JOINED",
    text: `${joined.name} joined the game.`,
    actorId: joined.id,
  });
  return next;
}

/**
 * Authoritative Net Worth calculation used across player cards, victory, bankruptcy, and final standings:
 * Net worth = cash in hand + sale price of every property owned (less any active mortgage advance debt).
 */
export const calculateNetWorth = (player: Player, state: GameState) =>
  player.cash +
  player.properties.reduce((sum, id) => {
    const tile = BOARD.find((candidate) => candidate.id === id);
    return sum + (tile?.sellValue ?? 0);
  }, 0) -
  player.debt;

export const netWorth = (state: GameState, player: Player) =>
  calculateNetWorth(player, state);

export const groupComplete = (
  state: GameState,
  player: Player,
  group: string,
) => {
  const groupTiles = BOARD.filter((tile) => tile.group === group);
  return (
    groupTiles.length > 0 &&
    groupTiles.every((tile) => state.owners[tile.id] === player.id)
  );
};

export const housesInUse = (state: GameState): number =>
  Object.values(state.buildings).reduce(
    (sum, level) => sum + (level >= 1 && level <= 3 ? level : 0),
    0,
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
  if (state.mortgaged?.[tile.id]) return 0;

  const level = state.buildings[tile.id] ?? 0;
  const schedule = tile.rentSchedule;
  let amount = tile.rent ?? 0;

  if (tile.kind === "city" && level > 0 && schedule?.development) {
    amount = schedule.development[level - 1] ?? schedule.development[3];
  } else if (tile.group && schedule) {
    const groupTiles = BOARD.filter((candidate) => candidate.group === tile.group);
    const ownedCount = groupTiles.filter(
      (candidate) => state.owners[candidate.id] === owner.id,
    ).length;
    if (groupTiles.length === 2) {
      amount = ownedCount >= 2 ? schedule.two : schedule.one;
    } else {
      amount =
        ownedCount >= 3
          ? schedule.three
          : ownedCount === 2
            ? schedule.two
            : schedule.one;
    }
  }

  amount *= owner.condition[tile.id] ?? 1;
  let rent = Math.max(0, Math.round(amount));
  // Each Bomb on this property operates on its current rent in turn.
  const bombs = (state.bombs ?? []).filter(
    (bomb) => bomb.propertyId === tile.id,
  );
  for (let index = 0; index < bombs.length; index++) rent = bombedRent(rent);
  return rent;
}

export const calculateCityRent = (propertyId: string, state: GameState) => {
  const tile = BOARD.find((candidate) => candidate.id === propertyId);
  const ownerId = state.owners[propertyId];
  const owner = state.players.find((candidate) => candidate.id === ownerId);
  return tile && owner ? rentFor(state, tile, owner) : 0;
};

function formatMoney(amount: number) {
  if (amount < 0) return `-$${Math.abs(Math.round(amount)).toLocaleString()}`;
  return `$${Math.round(amount).toLocaleString()}`;
}

function addActivity(state: GameState, text: string) {
  state.activity = [text, ...state.activity].slice(0, 18);
  state.message = text;
}

function pushNotification(
  state: GameState,
  entry: Omit<TableNotification, "id" | "round">,
  updateActivity = true,
): TableNotification {
  state.notificationSeq = (state.notificationSeq ?? 0) + 1;
  const full: TableNotification = {
    ...entry,
    id: state.notificationSeq,
    round: state.round,
  };
  state.notifications = [full, ...(state.notifications ?? [])].slice(0, 36);
  if (updateActivity) {
    addActivity(state, full.text);
  }
  return full;
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

/**
 * Strict bankruptcy rule (Part E Section 19):
 * 1. Net worth <= $0
 * 2. Cash < -$500 (-$500 is NOT bankrupt; -$501 IS bankrupt)
 */
export function isPlayerBankrupt(state: GameState, player: Player): boolean {
  if (isEliminated(player)) return true;
  const nw = netWorth(state, player);
  return (
    nw <= RULES.bankruptcy.minNetWorthExclusive ||
    player.cash < RULES.bankruptcy.minCash
  );
}

/**
 * Eliminates a player and returns every owned property cleanly to the Bank.
 */
function eliminatePlayerInternal(
  state: GameState,
  player: Player,
  status: "BANKRUPT" | "FORFEITED",
  reasonText?: string,
) {
  if (isEliminated(player)) return;

  const returnedIds = [...player.properties];
  for (const propId of returnedIds) {
    delete state.owners[propId];
    delete state.buildings[propId];
    if (state.mortgaged) delete state.mortgaged[propId];
    state.bombs = (state.bombs ?? []).filter(
      (bomb) => bomb.propertyId !== propId,
    );
  }

  player.properties = [];
  player.debt = 0;
  player.jailed = false;
  player.controlledRolls = 0;
  player.status = status;
  if (state.rentFree?.[player.id]) {
    delete state.rentFree[player.id];
  }

  if (state.powerInteraction) {
    const i = state.powerInteraction;
    if (i.initiatorId === player.id) {
      state.powerInteraction = null;
      if (state.phase === "power") state.phase = "roll";
    } else if (i.step === "AUCTION_OFFERS") {
      delete i.offers[player.id];
      delete i.drafts[player.id];
      if (!i.declined.includes(player.id)) {
        i.declined = [...i.declined, player.id];
      }
      if (i.offerFrom === player.id) {
        i.offerFrom = null;
      }
    }
  }

  const assetClause =
    returnedIds.length > 0
      ? ` ${returnedIds.length} propert${returnedIds.length === 1 ? "y" : "ies"} returned to the Bank.`
      : "";

  if (status === "BANKRUPT") {
    pushNotification(state, {
      kind: "bankruptcy",
      title: "PLAYER BANKRUPT",
      text: `${player.name} went bankrupt (${formatMoney(player.cash)} cash).${assetClause}`,
      actorId: player.id,
    });
  } else {
    pushNotification(state, {
      kind: "inactivity",
      title: "PLAYER FORFEITED",
      text:
        reasonText ??
        `${player.name} forfeited due to inactivity.${assetClause}`,
      actorId: player.id,
    });
  }
}

function rankPlayers(state: GameState, pool: Player[]): Player[] {
  return [...pool].sort((a, b) => {
    const nwDiff = netWorth(state, b) - netWorth(state, a);
    if (nwDiff !== 0) return nwDiff;
    if (b.cash !== a.cash) return b.cash - a.cash;
    return state.players.indexOf(a) - state.players.indexOf(b);
  });
}

function evaluateEconomyAndVictory(state: GameState): boolean {
  if (state.phase === "finished" && state.winner) return true;

  for (const player of state.players) {
    if (!isEliminated(player) && isPlayerBankrupt(state, player)) {
      eliminatePlayerInternal(state, player, "BANKRUPT");
    }
  }

  const alive = state.players.filter((player) => !isEliminated(player));
  if (state.players.length >= 2 && alive.length === 1) {
    const survivor = alive[0];
    state.winner = survivor.id;
    state.victoryReason = "LAST_STANDING";
    state.phase = "finished";
    state.powerInteraction = null;
    pushNotification(state, {
      kind: "victory",
      title: "LAST PLAYER STANDING",
      text: `${survivor.name} is the last player standing and wins Scam City!`,
      actorId: survivor.id,
      amount: netWorth(state, survivor),
    });
    return true;
  }

  if (state.players.length >= 1 && alive.length === 0) {
    const top = rankPlayers(state, state.players)[0];
    state.winner = top.id;
    state.victoryReason = "LAST_STANDING";
    state.phase = "finished";
    state.powerInteraction = null;
    pushNotification(state, {
      kind: "victory",
      title: "MATCH FINISHED",
      text: `${top.name} wins Scam City!`,
      actorId: top.id,
      amount: netWorth(state, top),
    });
    return true;
  }

  const targetNetWorth =
    state.settings?.targetNetWorth ?? RULES.victory.targetNetWorth;
  const qualifiers = alive.filter(
    (player) => netWorth(state, player) >= targetNetWorth,
  );
  if (qualifiers.length > 0) {
    const winner = rankPlayers(state, qualifiers)[0];
    state.winner = winner.id;
    state.victoryReason = "NET_WORTH_GOAL";
    state.phase = "finished";
    state.powerInteraction = null;
    pushNotification(state, {
      kind: "victory",
      title: "GOAL REACHED",
      text: `${winner.name} reached the ${formatMoney(targetNetWorth)} wealth target and wins Scam City!`,
      actorId: winner.id,
      amount: netWorth(state, winner),
    });
    return true;
  }

  return false;
}

function nextActiveTurnIndex(state: GameState, fromTurn: number): number {
  const total = state.players.length;
  for (let step = 1; step <= total; step += 1) {
    const idx = (fromTurn + step) % total;
    if (!isEliminated(state.players[idx])) {
      return idx;
    }
  }
  return fromTurn;
}

function advanceToNextPlayer(state: GameState) {
  const prevTurn = state.turn;
  const nextTurn = nextActiveTurnIndex(state, prevTurn);
  const wrapped = nextTurn <= prevTurn;
  state.turn = nextTurn;
  if (wrapped) state.round += 1;
  state.phase = "roll";
  state.lastRoll = null;

  const roundLimit =
    state.settings !== undefined
      ? state.settings.roundLimit
      : RULES.victory.roundLimit;

  if (roundLimit !== null && state.round > roundLimit) {
    const alive = state.players.filter((player) => !isEliminated(player));
    const leader = rankPlayers(
      state,
      alive.length > 0 ? alive : state.players,
    )[0];
    state.round = roundLimit;
    state.winner = leader.id;
    state.victoryReason = "ROUND_LIMIT";
    state.phase = "finished";
    state.powerInteraction = null;
    pushNotification(state, {
      kind: "victory",
      title: "ROUND LIMIT COMPLETE",
      text: `${leader.name} wins Scam City after ${roundLimit} rounds (${formatMoney(netWorth(state, leader))})!`,
      actorId: leader.id,
      amount: netWorth(state, leader),
    });
    return;
  }

  if (wrapped) {
    pushNotification(
      state,
      {
        kind: "round",
        title: `ROUND ${state.round}`,
        text:
          roundLimit !== null
            ? `Round ${state.round} of ${roundLimit} begins.`
            : `Round ${state.round} begins.`,
        actorId: currentPlayer(state)?.id,
      },
      false,
    );
  }

  const next = currentPlayer(state);
  if (next.jailed) {
    addActivity(
      state,
      `${next.name}'s turn (in Jail: pay $${RULES.jail.bailCost} bail or skip turn).`,
    );
  } else {
    addActivity(state, `${next.name}'s turn.`);
  }
}

/** Resolve turn continuation after all automatic effects and pending choices. */
function continueAfterLanding(state: GameState) {
  if (evaluateEconomyAndVictory(state)) return;
  if (state.phase === "finished") return;

  const actor = currentPlayer(state);
  if (isEliminated(actor) || actor.jailed) {
    advanceToNextPlayer(state);
    return;
  }

  if (state.lastRoll === 6) {
    state.phase = "roll";
    addActivity(state, `${actor.name} rolled a 6. Roll again!`);
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

/** Current rent a property would charge, including Mortgage ($0) and Bomb halving. */
export function currentRent(state: GameState, propertyId: string): number {
  const tile = tileById(propertyId);
  if (!tile) return 0;
  if (state.mortgaged?.[propertyId]) return 0;
  const owner = playerById(state, state.owners[propertyId]);
  return owner ? rentFor(state, tile, owner) : (tile.rent ?? 0);
}

export const isRentProtected = (state: GameState, playerId: string) =>
  Boolean(state.rentFree?.[playerId]);

function tickRentFreeCircuit(state: GameState, player: Player) {
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
    pushNotification(state, {
      kind: "rent-free",
      title: "RENT FREE ENDED",
      text: `${player.name}'s RENT FREE ROUND has ended.`,
      actorId: player.id,
    });
  } else {
    pushNotification(
      state,
      {
        kind: "rent-free",
        title: "RENT FREE CIRCUIT",
        text: `${player.name} completed a circuit of Rent Free (${status.remainingCircuits} left).`,
        actorId: player.id,
      },
      true,
    );
  }
}

/**
 * One Rent Free "circuit" completes each time the protected player crosses the
 * START boundary moving forward, which is the same boundary that pays salary.
 */
function crossStart(state: GameState, player: Player) {
  player.cash += RULES.salary;
  pushNotification(state, {
    kind: "start-salary",
    title: "START SALARY",
    text: `${player.name} collected $${RULES.salary} from START.`,
    actorId: player.id,
    propertyId: "tile_00",
    amount: RULES.salary,
  });
  tickRentFreeCircuit(state, player);
}

/**
 * Charge rent for a property landing.
 * Mortgaged properties charge $0. Rent Free blocks the payment entirely.
 * Mandatory rent deducts the full amount (allowing cash to go negative so strict -$500 / netWorth <= 0 bankruptcy rules apply).
 */
function collectRent(
  state: GameState,
  payer: Player,
  tile: Tile,
  owner: Player,
  suffix: string,
) {
  if (state.mortgaged?.[tile.id]) {
    pushNotification(state, {
      kind: "mortgaged-landing",
      title: "MORTGAGED · $0 RENT",
      text: `${payer.name} landed on ${tile.name} (${owner.name}) — mortgaged, $0 rent.`,
      actorId: payer.id,
      counterpartyId: owner.id,
      propertyId: tile.id,
      amount: 0,
    });
    return;
  }

  const rent = rentFor(state, tile, owner);
  if (isRentProtected(state, payer.id)) {
    const blockedText = `RENT BLOCKED: ${payer.name} is protected by RENT FREE. ${tile.name} rent of ${formatMoney(rent)} not paid.`;
    emitPowerEvent(state, {
      kind: "rent-blocked",
      playerId: payer.id,
      propertyIds: [tile.id],
      amount: rent,
      counterpartyId: owner.id,
      text: blockedText,
    });
    pushNotification(state, {
      kind: "rent-free",
      title: "RENT BLOCKED",
      text: blockedText,
      actorId: payer.id,
      counterpartyId: owner.id,
      propertyId: tile.id,
      amount: rent,
    });
    return;
  }

  payer.cash -= rent;
  owner.cash += rent;
  pushNotification(state, {
    kind: "rent",
    title: "RENT PAID",
    text: `${payer.name} paid ${formatMoney(rent)} rent to ${owner.name} ${suffix}.`,
    actorId: payer.id,
    counterpartyId: owner.id,
    propertyId: tile.id,
    amount: rent,
  });
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
  pushNotification(state, {
    kind: "turn",
    title: "SUPER POWER",
    text: `${player.name} landed on SUPER POWER. Choose your power.`,
    actorId: player.id,
    propertyId: BOARD[player.position]?.id,
  });
}

function enterScamSwapFromBankCue(state: GameState, player: Player): boolean {
  const blocked = powerAvailability(state, player.id)["power-swap"];
  if (blocked !== null) return false;

  state.powerSeq += 1;
  state.powerInteraction = {
    id: state.powerSeq,
    kind: "power-swap",
    step: "SWAP_OPPONENT",
    initiatorId: player.id,
    target: null,
    give: null,
    targetOwner: null,
    offerFrom: null,
    offers: {},
    drafts: {},
    declined: [],
    deadline: null,
    fromBankCue: true,
  };
  state.phase = "power";
  return true;
}

/**
 * Resolves landing on `BOARD[player.position]` (for both normal rolls and Bank movement cues).
 */
function resolveDestinationTile(
  state: GameState,
  player: Player,
  rng: (max: number) => number,
  rentSuffix: string,
  bankDepth: number,
) {
  const landedTile = BOARD[player.position];

  if (isPurchasable(landedTile)) {
    const ownerId = state.owners[landedTile.id];
    if (ownerId && ownerId !== player.id) {
      const owner = playerById(state, ownerId);
      if (owner && !isEliminated(owner)) {
        collectRent(state, player, landedTile, owner, rentSuffix);
      }
    } else {
      addActivity(state, `${player.name} landed on ${landedTile.name}.`);
    }

    if (!state.owners[landedTile.id] && !isPlayerBankrupt(state, player)) {
      state.phase = "decision";
    }
    return;
  }

  if (landedTile.kind === "bank") {
    if (bankDepth >= RULES.bank.maxResolutionDepth) return;
    const cueIndex = rng(BANK_CUES.length);
    const cue = BANK_CUES[cueIndex] ?? BANK_CUES[0];
    applyBankCueInternal(state, player, cue, rng, bankDepth + 1);
    return;
  }

  if (landedTile.kind === "tax") {
    const tax = landedTile.taxAmount ?? 0;
    player.cash -= tax;
    pushNotification(state, {
      kind: "tax",
      title: "PROPERTY TAX",
      text: `${player.name} paid ${formatMoney(tax)} property tax.`,
      actorId: player.id,
      propertyId: landedTile.id,
      amount: tax,
    });
    return;
  }

  if (landedTile.kind === "jail") {
    addActivity(state, `${player.name} is visiting Jail. Keep your eyes open.`);
  }
}

/**
 * Authoritatively resolves a single drawn Bank Cue card (#01–#69).
 */
function applyBankCueInternal(
  state: GameState,
  player: Player,
  cue: BankCueCard,
  rng: (max: number) => number,
  bankDepth: number,
) {
  state.lastBankCue = cue;
  const action = cue.action;

  if (action.type === "COLLECT_BANK") {
    player.cash += action.amount;
    pushNotification(state, {
      kind: "bank-card",
      title: `BANK CUE #${cue.id}`,
      text: `Bank #${cue.id}: ${cue.description} — ${player.name} collected ${formatMoney(action.amount)}.`,
      actorId: player.id,
      amount: action.amount,
      cueId: cue.id,
      cueDescription: cue.description,
      cueEffect: cue.effectText,
    });
    return;
  }

  if (action.type === "PAY_BANK") {
    player.cash -= action.amount;
    pushNotification(state, {
      kind: "bank-card",
      title: `BANK CUE #${cue.id}`,
      text: `Bank #${cue.id}: ${cue.description} — ${player.name} paid ${formatMoney(action.amount)}.`,
      actorId: player.id,
      amount: action.amount,
      cueId: cue.id,
      cueDescription: cue.description,
      cueEffect: cue.effectText,
    });
    return;
  }

  if (action.type === "GO_TO_JAIL") {
    player.position = RULES.jail.tileIndex;
    player.jailed = true;
    player.status = "JAILED";
    // Going to Jail forfeits any roll-of-6 bonus turn.
    state.lastRoll = null;
    pushNotification(state, {
      kind: "jail",
      title: `BANK CUE #${cue.id} · GO TO JAIL`,
      text: `Bank #${cue.id}: ${cue.description} — ${player.name} was sent to Jail!`,
      actorId: player.id,
      propertyId: RULES.jail.tileId,
      cueId: cue.id,
      cueDescription: cue.description,
      cueEffect: cue.effectText,
    });
    return;
  }

  if (action.type === "ADVANCE_TO_TILE") {
    const oldPos = player.position;
    const destIndex = BOARD.findIndex((t) => t.id === action.targetTileId);
    const targetPos = destIndex >= 0 ? destIndex : 0;
    const wrappedStart = targetPos <= oldPos && oldPos !== 0;

    player.position = targetPos;
    // Award the cue's explicit $300 once (never double-awarding START salary).
    player.cash += action.bonusAmount;
    if (wrappedStart) {
      tickRentFreeCircuit(state, player);
    }

    const destTile = BOARD[targetPos];
    pushNotification(state, {
      kind: "bank-card",
      title: `BANK CUE #${cue.id}`,
      text: `Bank #${cue.id}: ${cue.description} — ${player.name} advanced to ${destTile.name} (+${formatMoney(action.bonusAmount)}).`,
      actorId: player.id,
      propertyId: destTile.id,
      amount: action.bonusAmount,
      cueId: cue.id,
      cueDescription: cue.description,
      cueEffect: cue.effectText,
    });

    if (destTile.kind !== "start") {
      resolveDestinationTile(
        state,
        player,
        rng,
        `for ${destTile.name} after Bank #${cue.id}`,
        bankDepth,
      );
    }
    return;
  }

  if (action.type === "MOVE_BY_SPACES") {
    const oldPos = player.position;
    const rawTarget = oldPos + action.delta;
    const passedStart = action.delta > 0 && rawTarget >= BOARD.length;
    const destination =
      ((rawTarget % BOARD.length) + BOARD.length) % BOARD.length;
    player.position = destination;
    const destTile = BOARD[destination];

    pushNotification(state, {
      kind: "bank-card",
      title: `BANK CUE #${cue.id}`,
      text: `Bank #${cue.id}: ${cue.description} — ${player.name} moved ${action.delta > 0 ? `forward ${action.delta}` : `back ${Math.abs(action.delta)}`} to ${destTile.name}.`,
      actorId: player.id,
      propertyId: destTile.id,
      cueId: cue.id,
      cueDescription: cue.description,
      cueEffect: cue.effectText,
    });

    if (passedStart) {
      crossStart(state, player);
    }

    resolveDestinationTile(
      state,
      player,
      rng,
      `for ${destTile.name} after Bank #${cue.id}`,
      bankDepth,
    );
    return;
  }

  if (action.type === "MOVE_TO_CATEGORY") {
    const oldPos = player.position;
    let destination = oldPos;
    let passedStart = false;

    if (action.direction === "forward") {
      for (let step = 1; step <= BOARD.length; step += 1) {
        const idx = (oldPos + step) % BOARD.length;
        if (BOARD[idx].kind === action.category) {
          destination = idx;
          passedStart = oldPos + step >= BOARD.length;
          break;
        }
      }
    } else {
      for (let step = 1; step <= BOARD.length; step += 1) {
        const idx = (oldPos - step + BOARD.length) % BOARD.length;
        if (BOARD[idx].kind === action.category) {
          destination = idx;
          passedStart = false;
          break;
        }
      }
    }

    player.position = destination;
    const destTile = BOARD[destination];

    pushNotification(state, {
      kind: "bank-card",
      title: `BANK CUE #${cue.id}`,
      text: `Bank #${cue.id}: ${cue.description} — ${player.name} moved to ${destTile.name}.`,
      actorId: player.id,
      propertyId: destTile.id,
      cueId: cue.id,
      cueDescription: cue.description,
      cueEffect: cue.effectText,
    });

    if (passedStart) {
      crossStart(state, player);
    }

    resolveDestinationTile(
      state,
      player,
      rng,
      `for ${destTile.name} after Bank #${cue.id}`,
      bankDepth,
    );
    return;
  }

  if (action.type === "GRANT_CONTROLLED_ROLL") {
    player.controlledRolls = (player.controlledRolls ?? 0) + action.count;
    pushNotification(state, {
      kind: "bank-card",
      title: `BANK CUE #${cue.id} · CONTROLLED DICE`,
      text: `Bank #${cue.id}: ${cue.description} — ${player.name} received 1 Controlled Dice Power!`,
      actorId: player.id,
      cueId: cue.id,
      cueDescription: cue.description,
      cueEffect: cue.effectText,
    });
    return;
  }

  if (action.type === "TRIGGER_SCAM_SWAP") {
    const opened = enterScamSwapFromBankCue(state, player);
    pushNotification(state, {
      kind: "bank-card",
      title: `BANK CUE #${cue.id} · SCAM POWER`,
      text: opened
        ? `Bank #${cue.id}: ${cue.description} — ${player.name} received Scam Power! Pick a rival property to swap.`
        : `Bank #${cue.id}: ${cue.description} — No eligible rival/own property pair to swap yet.`,
      actorId: player.id,
      cueId: cue.id,
      cueDescription: cue.description,
      cueEffect: cue.effectText,
    });
  }
}

export function applyBankCueById(
  state: GameState,
  cueId: string,
  rng: (max: number) => number = randomInt,
): GameState {
  const cue = cueById(cueId);
  if (!cue || state.phase === "finished") return state;
  const next = structuredClone(state);
  const player = currentPlayer(next);
  if (!player || isEliminated(player)) return state;
  applyBankCueInternal(next, player, cue, rng, 1);
  next.lastLanding = {
    playerId: player.id,
    tileId: BOARD[player.position].id,
    roll: next.lastRoll ?? 1,
  };
  evaluateEconomyAndVictory(next);
  if (
    next.phase !== "finished" &&
    next.phase !== "decision" &&
    next.phase !== "power"
  ) {
    if (BOARD[player.position].kind === "power" && !player.jailed) {
      enterPowerStop(next, player);
    } else {
      continueAfterLanding(next);
    }
  }
  return next;
}

export function roll(
  state: GameState,
  value?: number,
  rng: (max: number) => number = randomInt,
): { state: GameState; events: GameEvent[] } {
  if (state.phase !== "roll" || state.winner) {
    return { state, events: [] };
  }
  const active = currentPlayer(state);
  if (!active || isEliminated(active) || active.jailed) {
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

  resolveDestinationTile(next, player, rng, `for ${landedTile.name}`, 0);

  next.lastLanding = {
    playerId: player.id,
    tileId: BOARD[player.position].id,
    roll: result,
  };

  evaluateEconomyAndVictory(next);
  if (
    next.phase !== "finished" &&
    next.phase !== "decision" &&
    next.phase !== "power"
  ) {
    // A Super Power stop (direct landing or after a Bank move) waits for the
    // player's choice; the turn engine resumes once that power resolves.
    if (BOARD[player.position].kind === "power" && !player.jailed) {
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

export function payJailBail(state: GameState): CommandResult {
  if (state.phase !== "roll") {
    return failure(state, "Bail can only be paid at the start of your turn.");
  }
  const active = currentPlayer(state);
  if (!active || !active.jailed) {
    return failure(state, "You are not currently in Jail.");
  }
  if (active.cash < RULES.jail.bailCost) {
    return failure(
      state,
      `Need ${formatMoney(RULES.jail.bailCost)} cash to pay bail.`,
    );
  }

  const next = structuredClone(state);
  const player = currentPlayer(next);
  player.cash -= RULES.jail.bailCost;
  player.jailed = false;
  player.status = "ACTIVE";
  pushNotification(next, {
    kind: "jail",
    title: "BAIL PAID",
    text: `${player.name} paid ${formatMoney(RULES.jail.bailCost)} bail and left Jail. Roll now!`,
    actorId: player.id,
    propertyId: RULES.jail.tileId,
    amount: RULES.jail.bailCost,
  });
  evaluateEconomyAndVictory(next);
  return { state: next };
}

export function skipJailTurn(state: GameState): CommandResult {
  if (state.phase !== "roll") {
    return failure(state, "Jail turn can only be served during your roll step.");
  }
  const active = currentPlayer(state);
  if (!active || !active.jailed) {
    return failure(state, "You are not currently in Jail.");
  }

  const next = structuredClone(state);
  const player = currentPlayer(next);
  player.jailed = false;
  player.status = "ACTIVE";
  pushNotification(next, {
    kind: "jail",
    title: "JAIL SERVED",
    text: `${player.name} served 1 turn in Jail and will roll next round.`,
    actorId: player.id,
    propertyId: RULES.jail.tileId,
  });
  advanceToNextPlayer(next);
  return { state: next };
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
  pushNotification(next, {
    kind: "purchase",
    title: "PROPERTY ACQUIRED",
    text: `${player.name} bought ${tile.name} for ${formatMoney(tile.price)}.`,
    actorId: player.id,
    propertyId: tile.id,
    amount: tile.price,
  });
  evaluateEconomyAndVictory(next);
  continueAfterLanding(next);
  return next;
}

export function buildBlockReason(
  state: GameState,
  actorId: string,
  propertyId: string,
): string | null {
  const tile = BOARD.find((candidate) => candidate.id === propertyId);
  if (!tile || tile.kind !== "city" || !tile.group || !tile.developmentCost) {
    return "Only city properties support houses and towers.";
  }
  if (state.owners[propertyId] !== actorId) {
    return "You do not own this property.";
  }
  if (state.phase !== "roll" || currentPlayer(state)?.id !== actorId) {
    return "Build is available on your turn before rolling.";
  }
  const player = currentPlayer(state);
  if (player.jailed) {
    return "Leave Jail before developing properties.";
  }
  if (!groupComplete(state, player, tile.group)) {
    return "Complete this colour group first to build.";
  }
  const groupTiles = BOARD.filter((candidate) => candidate.group === tile.group);
  if (groupTiles.some((candidate) => state.mortgaged?.[candidate.id])) {
    return "Redeem all mortgaged properties in this colour group first.";
  }
  const level = state.buildings[propertyId] ?? 0;
  if (level >= 4) {
    return "Maximum development (Tower) reached.";
  }
  const minLevel = Math.min(
    ...groupTiles.map((candidate) => state.buildings[candidate.id] ?? 0),
  );
  if (level > minLevel) {
    return "Build evenly across all properties in this colour group.";
  }
  if (level < 3 && housesInUse(state) >= RULES.development.maxHouses) {
    return `No houses left in the Bank (${RULES.development.maxHouses} max).`;
  }
  if (player.cash < tile.developmentCost) {
    return `Need ${formatMoney(tile.developmentCost)} cash to build.`;
  }
  return null;
}

export function build(state: GameState, propertyId: string): GameState {
  const actor = currentPlayer(state);
  if (!actor || buildBlockReason(state, actor.id, propertyId) !== null) {
    return state;
  }

  const next = structuredClone(state);
  const player = currentPlayer(next);
  const tile = BOARD.find((candidate) => candidate.id === propertyId)!;
  const level = next.buildings[propertyId] ?? 0;
  const cost = tile.developmentCost ?? 0;

  player.cash -= cost;
  next.buildings[propertyId] = level + 1;
  const label = RULES.development.levels[level];
  const updatedRent = rentFor(next, tile, player);
  pushNotification(next, {
    kind: level + 1 === 4 ? "build-tower" : "build-house",
    title: level + 1 === 4 ? "TOWER BUILT" : "HOUSE BUILT",
    text: `${player.name} developed ${tile.name} to ${label} (${formatMoney(cost)} · Rent ${formatMoney(updatedRent)}).`,
    actorId: player.id,
    propertyId,
    amount: cost,
  });
  evaluateEconomyAndVictory(next);
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
export function canBomb(
  state: GameState,
  propertyId: string,
  bomberId: string,
) {
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
  const rivals = ids.filter(
    (id) => ownerOf(state, id) && ownerOf(state, id) !== playerId,
  );
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
    .filter((player) => !isEliminated(player))
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
        !state.players.some(
          (player) => player.id === viewerId && !isEliminated(player),
        ) ||
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
  const tile = tileById(propertyId);
  const mortgageDebt =
    state.mortgaged?.[propertyId] && tile?.mortgageValue
      ? tile.mortgageValue
      : 0;
  const fromId = state.owners[propertyId];
  if (fromId) {
    const from = playerById(state, fromId)!;
    from.properties = from.properties.filter((id) => id !== propertyId);
    if (mortgageDebt > 0) {
      from.debt = Math.max(0, from.debt - mortgageDebt);
    }
  }
  const to = playerById(state, toId)!;
  to.properties.push(propertyId);
  if (mortgageDebt > 0) {
    to.debt += mortgageDebt;
  }
  state.owners[propertyId] = toId;
}

function completePower(state: GameState) {
  state.powerInteraction = null;
  state.phase = "roll";
  if (evaluateEconomyAndVictory(state)) return;
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
    return failure(
      state,
      "That Super Power prompt has already changed. Please use the latest prompt.",
    );
  }
  const actingPlayer = playerById(state, actorId);
  if (!actingPlayer || isEliminated(actingPlayer)) {
    return failure(state, "You are not an active player in this game.");
  }
  // The server, not the client timer, decides whether the Auction is still open.
  if (current.deadline !== null && now >= current.deadline) {
    return failure(
      state,
      "The AUCTION timer has expired. No trade can be completed.",
    );
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
        return failure(
          state,
          `Waiting for ${playerById(state, i.initiatorId)?.name ?? "the player"} to choose a power.`,
        );
      }
      const powerId = POWER_OPTIONS.find(
        (power) => power.id === command.powerId,
      )?.id;
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
        pushNotification(next, {
          kind: "rent-free",
          title: "RENT FREE ACTIVE",
          text,
          actorId,
        });
        next.powerInteraction = null;
        next.phase = "roll";
        continueAfterLanding(next);
        return { state: next };
      }

      i.kind = powerId;
      if (powerId === "bomb") {
        i.step = "BOMB_TARGET";
        addActivity(
          next,
          `${player.name} chose BOMB. Pick a rival property to halve.`,
        );
      } else if (powerId === "power-swap") {
        i.step = "SWAP_OPPONENT";
        addActivity(
          next,
          `${player.name} chose POWER SWAP. Pick a rival property first.`,
        );
      } else {
        i.step = "AUCTION_INITIATOR";
        i.deadline = now + RULES.timing.auctionSeconds * 1000;
        addActivity(
          next,
          `${player.name} opened an AUCTION. Offer one of your properties.`,
        );
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
          addActivity(
            next,
            `${player.name} selected ${name}. Now choose one of your properties to give.`,
          );
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
          return failure(
            state,
            "Select a rival property that still has rent to halve.",
          );
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
        pushNotification(next, {
          kind: "bomb",
          title: "BOMB HIT",
          text,
          actorId,
          counterpartyId: owner.id,
          propertyId: target,
          amount: rentAfter,
        });
        player.powers.push("bomb");
        completePower(next);
        return { state: next };
      }

      if (i.step === "SWAP_OWN") {
        const { target, give } = i;
        if (!target || !give) {
          return failure(
            state,
            "Select both properties before confirming POWER SWAP.",
          );
        }
        const receiveOwner = ownerOf(state, target);
        if (
          !receiveOwner ||
          receiveOwner === actorId ||
          ownerOf(state, give) !== actorId ||
          !isProperty(target) ||
          !isProperty(give)
        ) {
          i.target = null;
          i.give = null;
          i.targetOwner = null;
          i.step = "SWAP_OPPONENT";
          addActivity(
            next,
            "POWER SWAP selection went stale. Select a rival property again.",
          );
          return {
            state: next,
            error:
              "Ownership changed before confirmation. Select the rival property again.",
          };
        }
        if (receiveOwner !== i.targetOwner) {
          i.target = null;
          i.give = null;
          i.targetOwner = null;
          i.step = "SWAP_OPPONENT";
          addActivity(
            next,
            "POWER SWAP selection went stale. Select a rival property again.",
          );
          return {
            state: next,
            error:
              "That property changed owner before confirmation. Select it again.",
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
        pushNotification(next, {
          kind: "power-swap",
          title: "POWER SWAP",
          text,
          actorId,
          counterpartyId: other.id,
          propertyId: target,
        });
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
        pushNotification(next, {
          kind: "auction",
          title: "AUCTION OPEN",
          text: `${player.name} offers ${tileById(target)!.name}. Rivals may submit one property each.`,
          actorId,
          propertyId: target,
        });
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
          pushNotification(next, {
            kind: "auction",
            title: "AUCTION COMPLETE",
            text,
            actorId,
            counterpartyId: counterparty.id,
            propertyId: offerPid,
            amount: bonus,
          });
          player.powers.push("auction");
          completePower(next);
          return { state: next };
        }

        const draft = i.drafts[actorId];
        if (!draft || ownerOf(state, draft) !== actorId || i.offers[actorId]) {
          delete i.drafts[actorId];
          return failure(
            state,
            "Select one of your own properties before submitting your offer.",
          );
        }
        i.offers[actorId] = draft;
        delete i.drafts[actorId];
        pushNotification(next, {
          kind: "auction",
          title: "AUCTION OFFER",
          text: `${player.name} submitted an offer: ${tileById(draft)!.name}.`,
          actorId,
          propertyId: draft,
        });
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
        return failure(
          state,
          "Only the player who landed on Super Power can cancel it.",
        );
      }
      if (i.kind === null || i.fromBankCue) {
        addActivity(next, `${player.name} passed on the Super Power.`);
        completePower(next);
        return { state: next };
      }
      const label =
        POWER_OPTIONS.find((power) => power.id === i.kind)?.name ?? "power";
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
    pushNotification(next, {
      kind: "auction",
      title: "AUCTION EXPIRED",
      text: "AUCTION expired. No properties moved and no bonus was paid.",
      actorId: player.id,
    });
  } else {
    emitPowerEvent(next, {
      kind: "power-timeout",
      playerId: player.id,
      propertyIds: [],
      text: `${player.name}'s Super Power timed out. Nothing was applied.`,
    });
    pushNotification(next, {
      kind: "turn",
      title: "POWER TIMED OUT",
      text: `${player.name}'s Super Power timed out. Nothing was applied.`,
      actorId: player.id,
    });
  }
  completePower(next);
  return next;
}

export function choosePower(
  state: GameState,
  id: PowerId,
  actorId: string = currentPlayer(state)?.id,
): GameState {
  return applyPowerCommand(state, actorId, {
    type: "CHOOSE_POWER",
    powerId: id,
  }).state;
}

export function skipPower(
  state: GameState,
  actorId: string = currentPlayer(state)?.id,
): GameState {
  return applyPowerCommand(state, actorId, { type: "POWER_CANCEL" }).state;
}

/* ------------------------------------------------------------------------- */
/* Property Management: Mortgage, Unmortgage, Bomb Repair & Bank Sale         */
/* ------------------------------------------------------------------------- */

export function mortgageBlockReason(
  state: GameState,
  actorId: string,
  propertyId: string,
): string | null {
  const tile = BOARD.find((candidate) => candidate.id === propertyId);
  if (!tile || tile.price === undefined || tile.mortgageValue === undefined) {
    return "This tile cannot be mortgaged.";
  }
  if (state.phase !== "roll") {
    return "You can mortgage only on your turn, before you roll.";
  }
  if (currentPlayer(state)?.id !== actorId) {
    return "Only the owner can mortgage, on their own turn.";
  }
  if (state.owners[propertyId] !== actorId) {
    return "You do not own this property.";
  }
  if (state.mortgaged?.[propertyId]) {
    return "This property is already mortgaged.";
  }
  const colourSet = tile.group
    ? BOARD.filter((candidate) => candidate.group === tile.group)
    : [tile];
  if (colourSet.some((candidate) => (state.buildings[candidate.id] ?? 0) > 0)) {
    return "Cannot mortgage while this colour group has buildings.";
  }
  return null;
}

export function mortgageProperty(
  state: GameState,
  actorId: string,
  propertyId: string,
): CommandResult {
  const reason = mortgageBlockReason(state, actorId, propertyId);
  if (reason) return failure(state, reason);

  const next = structuredClone(state);
  if (!next.mortgaged) next.mortgaged = {};
  const player = playerById(next, actorId)!;
  const tile = BOARD.find((candidate) => candidate.id === propertyId)!;
  const advance = tile.mortgageValue ?? 0;

  next.mortgaged[propertyId] = true;
  player.cash += advance;
  player.debt += advance;

  pushNotification(next, {
    kind: "mortgage",
    title: "PROPERTY MORTGAGED",
    text: `${player.name} mortgaged ${tile.name} for ${formatMoney(advance)} ($0 rent until redeemed).`,
    actorId: player.id,
    propertyId,
    amount: advance,
  });
  evaluateEconomyAndVictory(next);
  return { state: next };
}

export function unmortgageBlockReason(
  state: GameState,
  actorId: string,
  propertyId: string,
): string | null {
  const tile = BOARD.find((candidate) => candidate.id === propertyId);
  if (!tile || tile.price === undefined || tile.unmortgageCost === undefined) {
    return "This tile cannot be redeemed.";
  }
  if (state.phase !== "roll") {
    return "You can redeem only on your turn, before you roll.";
  }
  if (currentPlayer(state)?.id !== actorId) {
    return "Only the owner can redeem, on their own turn.";
  }
  if (state.owners[propertyId] !== actorId) {
    return "You do not own this property.";
  }
  if (!state.mortgaged?.[propertyId]) {
    return "This property is not mortgaged.";
  }
  const player = playerById(state, actorId)!;
  if (player.cash < tile.unmortgageCost) {
    return `Need ${formatMoney(tile.unmortgageCost)} cash to redeem.`;
  }
  return null;
}

export function unmortgageProperty(
  state: GameState,
  actorId: string,
  propertyId: string,
): CommandResult {
  const reason = unmortgageBlockReason(state, actorId, propertyId);
  if (reason) return failure(state, reason);

  const next = structuredClone(state);
  const player = playerById(next, actorId)!;
  const tile = BOARD.find((candidate) => candidate.id === propertyId)!;
  const cost = tile.unmortgageCost ?? 0;
  const advance = tile.mortgageValue ?? 0;

  player.cash -= cost;
  player.debt = Math.max(0, player.debt - advance);
  delete next.mortgaged[propertyId];

  const restoredRent = rentFor(next, tile, player);
  pushNotification(next, {
    kind: "unmortgage",
    title: "MORTGAGE REDEEMED",
    text: `${player.name} redeemed ${tile.name} for ${formatMoney(cost)} (Rent restored to ${formatMoney(restoredRent)}).`,
    actorId: player.id,
    propertyId,
    amount: cost,
  });
  evaluateEconomyAndVictory(next);
  return { state: next };
}

export function repairBlockReason(
  state: GameState,
  actorId: string,
  propertyId: string,
): string | null {
  const tile = BOARD.find((candidate) => candidate.id === propertyId);
  if (!tile || tile.price === undefined) {
    return "This tile cannot be repaired.";
  }
  const activeBombs = (state.bombs ?? []).filter(
    (bomb) => bomb.propertyId === propertyId,
  );
  if (activeBombs.length === 0) {
    return "This property has no Bomb damage.";
  }
  if (state.phase !== "roll") {
    return "You can repair only on your turn, before you roll.";
  }
  if (currentPlayer(state)?.id !== actorId) {
    return "Only the owner can repair, on their own turn.";
  }
  if (state.owners[propertyId] !== actorId) {
    return "You do not own this property.";
  }
  const cost = tile.repairCost ?? activeBombs[0].repairCost;
  if (!cost && tile.repairCost === undefined) {
    return "No repair cost is listed for this asset.";
  }
  const player = playerById(state, actorId)!;
  if (player.cash < cost) {
    return `Need ${formatMoney(cost)} cash to repair.`;
  }
  return null;
}

export function repairProperty(
  state: GameState,
  actorId: string,
  propertyId: string,
): CommandResult {
  const reason = repairBlockReason(state, actorId, propertyId);
  if (reason) return failure(state, reason);

  const next = structuredClone(state);
  const player = playerById(next, actorId)!;
  const tile = BOARD.find((candidate) => candidate.id === propertyId)!;
  const bombIdx = next.bombs.findIndex((b) => b.propertyId === propertyId);
  if (bombIdx < 0) return failure(state, "This property has no Bomb damage.");

  const cost = tile.repairCost ?? next.bombs[bombIdx].repairCost;
  const rentBefore = rentFor(next, tile, player);
  player.cash -= cost;
  next.bombs.splice(bombIdx, 1);
  const rentAfter = rentFor(next, tile, player);

  pushNotification(next, {
    kind: "repair",
    title: "BOMB REPAIRED",
    text: `${player.name} repaired ${tile.name} for ${formatMoney(cost)} (Rent ${formatMoney(rentBefore)} → ${formatMoney(rentAfter)}).`,
    actorId: player.id,
    propertyId,
    amount: cost,
  });
  evaluateEconomyAndVictory(next);
  return { state: next };
}

export function sellBlockReason(
  state: GameState,
  actorId: string,
  propertyId: string,
): string | null {
  const tile = BOARD.find((candidate) => candidate.id === propertyId);
  if (!tile || tile.price === undefined || tile.sellValue === undefined) {
    return "This tile cannot be sold.";
  }
  if (state.phase !== "roll") {
    return "You can sell only on your turn, before you roll.";
  }
  if (currentPlayer(state)?.id !== actorId) {
    return "Only the owner can sell, on their own turn.";
  }
  if (state.owners[propertyId] !== actorId) {
    return "You do not own this property.";
  }
  if (state.mortgaged?.[propertyId]) {
    return "Redeem this mortgaged property before selling it.";
  }
  const colourSet = tile.group
    ? BOARD.filter((candidate) => candidate.group === tile.group)
    : [tile];
  if (colourSet.some((candidate) => (state.buildings[candidate.id] ?? 0) > 0)) {
    return "Sell the buildings in this colour set first.";
  }
  return null;
}

/** Property ids `playerId` may sell right now. */
export function sellableIds(state: GameState, playerId: string): string[] {
  return BOARD.filter(
    (tile) =>
      tile.price !== undefined && !sellBlockReason(state, playerId, tile.id),
  ).map((tile) => tile.id);
}

export function sellProperty(
  state: GameState,
  actorId: string,
  propertyId: string,
): CommandResult {
  const reason = sellBlockReason(state, actorId, propertyId);
  if (reason) return failure(state, reason);
  const next = structuredClone(state);
  const player = playerById(next, actorId)!;
  const tile = BOARD.find((candidate) => candidate.id === propertyId)!;
  const price = tile.sellValue ?? 0;
  player.cash += price;
  player.properties = player.properties.filter((id) => id !== propertyId);
  delete next.owners[propertyId];
  delete next.buildings[propertyId];
  if (next.mortgaged) delete next.mortgaged[propertyId];
  next.bombs = (next.bombs ?? []).filter((b) => b.propertyId !== propertyId);

  pushNotification(next, {
    kind: "sell",
    title: "PROPERTY SOLD",
    text: `${player.name} sold ${tile.name} to the Bank for ${formatMoney(price)}.`,
    actorId: player.id,
    propertyId,
    amount: price,
  });
  evaluateEconomyAndVictory(next);
  return { state: next };
}

/* ------------------------------------------------------------------------- */
/* Inactivity & Forfeiture                                                    */
/* ------------------------------------------------------------------------- */

export function forfeitPlayer(
  state: GameState,
  playerId: string,
  reason: "INACTIVITY" | "VOLUNTARY" = "INACTIVITY",
): GameState {
  if (state.phase === "finished") return state;
  const target = playerById(state, playerId);
  if (!target || isEliminated(target)) return state;

  const next = structuredClone(state);
  const wasCurrentTurn = currentPlayer(next)?.id === playerId;
  const player = playerById(next, playerId)!;
  const returnedCount = player.properties.length;
  const assetClause =
    returnedCount > 0
      ? ` ${returnedCount} propert${returnedCount === 1 ? "y" : "ies"} returned to the Bank.`
      : "";

  eliminatePlayerInternal(
    next,
    player,
    "FORFEITED",
    reason === "INACTIVITY"
      ? `${player.name} forfeited after ${RULES.inactivity.forfeitAfterMissedTurns} consecutive missed turns.${assetClause}`
      : `${player.name} forfeited the match.${assetClause}`,
  );

  if (evaluateEconomyAndVictory(next)) {
    return next;
  }

  if (wasCurrentTurn) {
    next.phase = "roll";
    next.powerInteraction = null;
    next.lastRoll = null;
    advanceToNextPlayer(next);
  }
  return next;
}

/**
 * Called by the server when a turn timer expires without manual input from the active player.
 * Tracks consecutive missed turns, warns at 2, and forfeits at 3 (returning all properties to Bank).
 */
export function resolveTurnTimeout(state: GameState): GameState {
  if (state.phase === "finished") return state;
  let next = structuredClone(state);

  const actorId =
    next.phase === "power" && next.powerInteraction
      ? next.powerInteraction.initiatorId
      : currentPlayer(next)?.id;
  const actor = playerById(next, actorId);
  if (!actor || isEliminated(actor)) return state;

  actor.missedTurns = (actor.missedTurns ?? 0) + 1;

  if (actor.missedTurns >= RULES.inactivity.forfeitAfterMissedTurns) {
    return forfeitPlayer(next, actor.id, "INACTIVITY");
  }

  if (actor.missedTurns === RULES.inactivity.warnAfterMissedTurns) {
    pushNotification(next, {
      kind: "inactivity",
      title: "INACTIVITY WARNING",
      text: `${actor.name} missed ${actor.missedTurns} turns in a row — 1 more missed turn forfeits the match!`,
      actorId: actor.id,
    });
  }

  if (next.phase === "roll") {
    if (actor.jailed) {
      next = skipJailTurn(next).state;
    } else {
      next = roll(next).state;
      if (next.phase === "decision") next = passProperty(next);
      else if (next.phase === "power") next = timeoutPowerInteraction(next);
    }
  } else if (next.phase === "power") {
    next = timeoutPowerInteraction(next);
  } else if (next.phase === "decision") {
    next = passProperty(next);
  }

  return next;
}

export function applyGameCommand(
  state: GameState,
  actorId: string,
  command: GameCommand,
  now: number = Date.now(),
): CommandResult {
  if (state.phase === "finished") {
    return failure(state, "The match has already finished.");
  }
  const actingPlayer = playerById(state, actorId);
  if (!actingPlayer || isEliminated(actingPlayer)) {
    return failure(state, "You are no longer active in this match.");
  }

  // Any valid manual command from a player resets their inactivity streak on the resulting state.
  const clearInactivity = (res: CommandResult): CommandResult => {
    if (res.error || res.state === state) return res;
    const p = playerById(res.state, actorId);
    if (p && p.missedTurns > 0) {
      p.missedTurns = 0;
    }
    return res;
  };

  switch (command?.type) {
    case "FORFEIT_SELF":
      return { state: forfeitPlayer(state, actorId, "VOLUNTARY") };
    case "SELL_PROPERTY":
      return clearInactivity(sellProperty(state, actorId, command.propertyId));
    case "MORTGAGE_PROPERTY":
      return clearInactivity(
        mortgageProperty(state, actorId, command.propertyId),
      );
    case "UNMORTGAGE_PROPERTY":
      return clearInactivity(
        unmortgageProperty(state, actorId, command.propertyId),
      );
    case "REPAIR_PROPERTY":
      return clearInactivity(
        repairProperty(state, actorId, command.propertyId),
      );
    case "JAIL_PAY_BAIL": {
      if (currentPlayer(state)?.id !== actorId) {
        return failure(state, "NOT_YOUR_TURN");
      }
      return clearInactivity(payJailBail(state));
    }
    case "JAIL_SKIP_TURN": {
      if (currentPlayer(state)?.id !== actorId) {
        return failure(state, "NOT_YOUR_TURN");
      }
      return clearInactivity(skipJailTurn(state));
    }
    case "ROLL": {
      if (currentPlayer(state)?.id !== actorId) {
        return failure(state, "NOT_YOUR_TURN");
      }
      if (actingPlayer.jailed) {
        return failure(
          state,
          `Pay ${formatMoney(RULES.jail.bailCost)} bail or serve your turn in Jail first.`,
        );
      }
      if (command.controlledValue !== undefined) {
        const cv = Number(command.controlledValue);
        if (
          !Number.isInteger(cv) ||
          cv < 1 ||
          cv > 6 ||
          (actingPlayer.controlledRolls ?? 0) <= 0
        ) {
          return failure(
            state,
            "Controlled Dice roll is not available or value is invalid.",
          );
        }
        const pre = structuredClone(state);
        const p = currentPlayer(pre);
        p.controlledRolls -= 1;
        pushNotification(
          pre,
          {
            kind: "controlled-roll",
            title: "CONTROLLED DICE",
            text: `${p.name} used Controlled Dice Power to roll a ${cv}!`,
            actorId: p.id,
          },
          true,
        );
        const rolled = roll(pre, cv).state;
        if (rolled === pre) {
          return failure(state, "Could not execute Controlled Dice roll.");
        }
        return clearInactivity({ state: rolled });
      }
      const next = roll(state).state;
      if (next === state) {
        return failure(state, "Action is not valid in this phase or state.");
      }
      return clearInactivity({ state: next });
    }
    case "BUY_PROPERTY":
    case "PASS_PROPERTY":
    case "BUILD": {
      if (currentPlayer(state)?.id !== actorId) {
        return failure(state, "NOT_YOUR_TURN");
      }
      if (command.type === "BUILD") {
        const reason = buildBlockReason(
          state,
          actorId,
          String(command.propertyId),
        );
        if (reason) return failure(state, reason);
      }
      const next =
        command.type === "BUY_PROPERTY"
          ? buy(state)
          : command.type === "PASS_PROPERTY"
            ? passProperty(state)
            : build(state, String(command.propertyId));
      if (next === state) {
        return failure(state, "Action is not valid in this phase or state.");
      }
      return clearInactivity({ state: next });
    }
    case "CHOOSE_POWER":
    case "PASS_POWER":
    case "POWER_SELECT":
    case "POWER_CONFIRM":
    case "POWER_DECLINE":
    case "POWER_CANCEL":
      return clearInactivity(
        applyPowerCommand(state, actorId, command as PowerCommand, now),
      );
    default:
      return failure(state, "Unknown game command.");
  }
}

export const tileAt = (position: number): Tile => BOARD[position];
