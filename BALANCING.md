# Balancing and simulation plan

Initial defaults are in `src/game/rules.ts`; preset adjustments must be layered there, not scattered. No claims of fairness are made until simulation data exists.

Simulation harness next: deterministic seeded RNG; baseline agents (buy affordable assets, develop qualifying sets, otherwise pass); 2–6 players, randomized starting seat; batch summary for per-seat win rate, match rounds, target reach, bankruptcy, group ownership, development frequency and power use. Keep fixed seeds for regression and a larger randomized batch for tuning. Compare equal agents and document each adjustment with before/after metrics.

The current local baseline simulator runs 100 games at each player count (2–6), with identical simple agents that buy each affordable unowned asset and otherwise pass. Initial run: mean round cap was reached in every batch, no target wins and no bankruptcies. Seat wins varied with seat count (sample sizes are small; later seats also start with more cash as required by the setup table). This confirms only that cap resolution works; it does NOT validate a playable economy, strategic agents, seat fairness or comeback. The target-reaching objective is a known open balance issue; add trade/development/interaction agents, more games and property/economy tuning before claiming fairness. Re-run with `npm run simulate -- 1000` after balancing changes.

The local browser demo uses `crypto.getRandomValues` through an injected engine RNG for dice and Bank outcomes. A production engine uses unbiased server-side crypto randomness and records every result in the event log. Never use client randomness for authoritative outcomes.
