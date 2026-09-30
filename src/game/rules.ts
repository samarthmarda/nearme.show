export type TileKind = 'start' | 'city' | 'bank' | 'power' | 'jail' | 'transport' | 'utility';

export type Tile = {
  id: string;
  name: string;
  kind: TileKind;
  group?: string;
  price?: number;
  rent?: number;
  tone?: string;
  sellValue?: number;
  developmentCost?: number;
};

const roundToFive = (amount: number): number => Math.round(amount / 5) * 5;

export const RULES = {
  version: 'scam-city-v1',
  boardVersion: '36-city-loop-v1',
  startingCashByOrder: [1000, 1050, 1100, 1150, 1200, 1250],
  salary: 300,
  victory: { targetNetWorth: 5000, roundLimit: 30 },
  timing: { turnSeconds: 30, propertySeconds: 15, powerSeconds: 20, exchangeSeconds: 60 },
  property: {
    sellRate: 0.8,
    developmentSellRate: 0.5,
    conditionLevels: [1, 0.75, 0.5, 0.25] as const,
    repairCostRate: 0.4,
  },
  rent: {
    groupMultipliers: [1, 1.5, 2] as const,
    developmentMultipliers: [3, 4, 5, 6] as const,
  },
  development: {
    costRate: 0.55,
    levels: ['HOTEL 1', 'HOTEL 2', 'HOTEL 3', 'TOWER'] as const,
  },
  transport: { rentPerOwned: 30 },
  utilities: { rentPerOwned: 25 },
  economy: { bankruptcyThreshold: 3000, exchangeBonus: 100 },
  bank: {
    maxResolutionDepth: 3,
    outcomes: [
      { type: 'cash', amount: 150, weight: 10 },
      { type: 'cash', amount: 100, weight: 10 },
      { type: 'cash', amount: 250, weight: 2 },
      { type: 'cash', amount: 50, weight: 10 },
      { type: 'cash', amount: -100, weight: 10 },
      { type: 'cash', amount: -150, weight: 10 },
      { type: 'lowest', amount: 50, weight: 10 },
      { type: 'move', spaces: 3, weight: 10 },
      { type: 'move', spaces: -3, weight: 10 },
      { type: 'travel', weight: 10 },
    ] as const,
  },
} as const;

const palette = {
  green: '#55a86e',
  'light-blue': '#65abc5',
  pink: '#d77da4',
  orange: '#e59156',
  'light-green': '#8ab56f',
  gold: '#d1ac4f',
  purple: '#9275bd',
  red: '#d9675d',
  transport: '#9a8ab5',
  utility: '#eac85f',
};

const property = (
  index: number,
  name: string,
  kind: 'city' | 'transport' | 'utility',
  price: number,
  rent: number,
  group?: string,
): Tile => ({
  id: `tile_${String(index).padStart(2, '0')}`,
  name,
  kind,
  price,
  rent,
  ...(group ? { group, tone: palette[group as keyof typeof palette] } : { tone: palette[kind] }),
  sellValue: roundToFive(price * RULES.property.sellRate),
  ...(kind === 'city' ? { developmentCost: roundToFive(price * RULES.development.costRate) } : {}),
});

export const BOARD: Tile[] = [
  { id: 'tile_00', name: 'START', kind: 'start' },
  property(1, 'DELHI', 'city', 100, 10, 'green'),
  property(2, 'HYDERABAD', 'city', 110, 10, 'green'),
  property(3, 'BANGKOK', 'city', 130, 20, 'light-blue'),
  property(4, 'BOAT', 'transport', 180, 0),
  property(5, 'MUMBAI', 'city', 120, 10, 'green'),
  { id: 'tile_06', name: 'SUPER POWER', kind: 'power', tone: '#efbd4e' },
  property(7, 'SINGAPORE', 'city', 145, 20, 'light-blue'),
  property(8, 'AMSTERDAM', 'city', 160, 20, 'light-blue'),
  { id: 'tile_09', name: 'BANK', kind: 'bank', tone: '#b9a16b' },
  property(10, 'JAKARTA', 'city', 170, 25, 'pink'),
  property(11, 'RAILWAYS', 'transport', 220, 0),
  property(12, 'BERLIN', 'city', 185, 25, 'pink'),
  property(13, 'MOSCOW', 'city', 200, 25, 'pink'),
  property(14, 'TORONTO', 'city', 210, 30, 'orange'),
  property(15, 'BUS', 'transport', 280, 0),
  property(16, 'SEOUL', 'city', 225, 30, 'orange'),
  property(17, 'HONG KONG', 'city', 350, 30, 'orange'),
  { id: 'tile_18', name: 'JAIL', kind: 'jail', tone: '#748579' },
  property(19, 'ZURICH', 'city', 250, 35, 'light-green'),
  property(20, 'ISRAEL', 'city', 275, 35, 'light-green'),
  property(21, 'ELECTRICITY', 'utility', 360, 0),
  property(22, 'RIYADH', 'city', 300, 35, 'light-green'),
  property(23, 'IRAN', 'city', 300, 40, 'gold'),
  property(24, 'OIL MILL', 'utility', 400, 0),
  property(25, 'SAUDI', 'city', 315, 40, 'gold'),
  property(26, 'DUBAI', 'city', 330, 40, 'gold'),
  { id: 'tile_27', name: 'SUPER POWER', kind: 'power', tone: '#efbd4e' },
  property(28, 'PARIS', 'city', 350, 40, 'purple'),
  property(29, 'LONDON', 'city', 420, 45, 'purple'),
  property(30, 'NIAGARA WATER', 'utility', 500, 0),
  property(31, 'BIRMINGHAM', 'city', 400, 55, 'purple'),
  property(32, 'CHICAGO', 'city', 425, 60, 'red'),
  property(33, 'AIRPORT', 'transport', 560, 0),
  property(34, 'CALIFORNIA', 'city', 440, 65, 'red'),
  property(35, 'NEW YORK', 'city', 450, 70, 'red'),
];

export const POWER_OPTIONS = [
  { id: 'bomb', name: 'BOMB', icon: '✹', color: '#f17858', description: 'Damage up to two rival properties. Their rent takes a hit.' },
  { id: 'controlled-roll', name: 'CONTROLLED ROLL', icon: '⚄', color: '#56a9d1', description: 'Choose a precise 1–6 roll before your next move.' },
  { id: 'hotel-pass', name: 'FREE HOTEL PASS', icon: '▣', color: '#a18bd2', description: 'Waive the cash cost of one eligible final upgrade.' },
  { id: 'jail-pass', name: 'JAIL FREE PASS', icon: '↗', color: '#62ae78', description: 'Keep in your pocket. Use it to walk out of Jail.' },
  { id: 'auction', name: 'PROPERTY EXCHANGE', icon: '⇄', color: '#d7ac44', description: 'Open a timed property-for-property exchange.' },
] as const;

export type PowerId = typeof POWER_OPTIONS[number]['id'];
export const PRESETS = { QUICK: { target: 3000, rounds: 20 }, STANDARD: { target: 5000, rounds: 30 }, LONG: { target: 7000, rounds: 40 } } as const;
