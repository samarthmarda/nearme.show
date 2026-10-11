# Data model

## Static definitions
`BoardTileDefinition`: id, label, kind, group, purchase price, base rent, visual tone. `PowerDefinition` and `CardDefinition` are planned immutable configuration records. They must not be copied into UI components.

## Match state
`GameState`: ordered players, property owner map, building levels, round, active turn, phase and winner. `Player`: stable match id, account id in production, display/avatar, cash, position, properties, jail/status, debt. Property runtime condition/mortgage/locks are separate mutable match state in the server version.

## Persistence target
User (normalized unique username, password hash), Profile, Friendship, Room, RoomPlayer, GameRules version, GameProperty, PlayerPower, GameEvent (append-only sequence), GameSnapshot, Transaction, TradeOffer, ExchangeSession, ExchangeOffer, ChatMessage, GameResult, Notification and Report. Static definitions are versioned configuration; live mutable state is per game.

Keep account credentials out of logs and event payloads. Transactions that move currency or assets must update all affected records atomically.
