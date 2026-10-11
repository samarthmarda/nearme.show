# Balancing and simulation plan

Initial defaults are in `src/game/rules.ts`; preset adjustments must be layered there, not scattered. No claims of fairness are made until simulation data exists.

Simulation harness next: deterministic seeded RNG; baseline agents (buy affordable assets, develop qualifying sets, otherwise pass); 2–6 players, randomized starting seat; batch summary for per-seat win rate, match rounds, target reach, bankruptcy, group ownership, development frequency and power use. Keep fixed seeds for regression and a larger randomized batch for tuning. Compare equal agents and document each adjustment with before/after metrics.

The local baseline simulator runs the requested number of games at each player count (2–6), with identical simple agents that buy each affordable unowned asset and otherwise pass. A 1,000-games-per-count run completed: all batches reached the 30-round cap, with zero target wins and zero bankruptcies. Seat wins were 2p 511/489; 3p 334/311/355; 4p 256/257/233/254; 5p 199/202/192/195/212; 6p 137/155/145/192/196/175. This exposes a major limitation: this simple agent does not test development, debt recovery, trading, concessions or social play, and the target is unreachable in this strategy over the round cap. These results do NOT validate a playable economy, strategic agents, seat fairness or comeback. Build behavior-rich agents and tune the configured economy before claiming balance. Run with `npm run simulate -- 1000` to reproduce at a new seed set.

The local browser demo uses `crypto.getRandomValues` through an injected engine RNG for dice and Bank outcomes. A production engine uses unbiased server-side crypto randomness and records every result in the event log. Never use client randomness for authoritative outcomes.
