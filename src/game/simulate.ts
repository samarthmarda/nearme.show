import { buy, createGame, netWorth, passProperty, roll } from "./engine";
import { BOARD, RULES } from "./rules";

function rngFor(seed: number) {
  let value = seed >>> 0;
  return (max: number) => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value % max;
  };
}

export function simulateBatch(gamesPerPlayerCount = 100) {
  const report: Record<string, unknown> = {
    gamesPerPlayerCount,
    agent: "baseline: buy every affordable unowned asset, otherwise pass; no negotiation/powers/development",
    results: {},
  };
  const results = report.results as Record<string, unknown>;

  for (let count = 2; count <= 6; count++) {
    const stats = {
      games: gamesPerPlayerCount,
      seatWins: Array(count).fill(0),
      averageRounds: 0,
      targetWins: 0,
      propertyPurchases: 0,
      bankruptcies: 0,
    };

    for (let gameIndex = 0; gameIndex < gamesPerPlayerCount; gameIndex++) {
      let state = createGame(Array.from({ length: count }, (_, index) => `P${index + 1}`));
      const rng = rngFor(100000 * count + gameIndex + 12345);
      const maxRolls = count * RULES.victory.roundLimit * 8;
      let rolls = 0;

      for (; rolls < maxRolls && state.phase !== "finished"; rolls++) {
        state = roll(state, undefined, rng).state;
        if (state.phase !== "decision") continue;

        const player = state.players[state.turn];
        const tile = BOARD[player.position];
        if (tile.price && !state.owners[tile.id] && player.cash >= tile.price) {
          const purchased = buy(state);
          if (purchased !== state) {
            state = purchased;
            stats.propertyPurchases++;
            continue;
          }
        }
        state = passProperty(state);
      }

      stats.averageRounds += state.round;
      if (state.winner) {
        const winnerIndex = state.players.findIndex((player) => player.id === state.winner);
        if (winnerIndex >= 0) {
          stats.seatWins[winnerIndex]++;
          if (netWorth(state, state.players[winnerIndex]) >= RULES.victory.targetNetWorth) {
            stats.targetWins++;
          }
        }
      }
      stats.bankruptcies += state.players.filter((player) => player.status === "BANKRUPT").length;
    }

    stats.averageRounds = Number((stats.averageRounds / gamesPerPlayerCount).toFixed(2));
    results[String(count)] = stats;
  }
  return report;
}

if (process.argv[1]?.endsWith("simulate.ts")) {
  console.log(JSON.stringify(simulateBatch(Number(process.argv[2]) || 100), null, 2));
}
