export type TileKind =
  | "start"
  | "city"
  | "bank"
  | "power"
  | "jail"
  | "transport"
  | "business"
  | "tax";

export type RentSchedule = {
  /** Rent with one property in the group. */
  one: number;
  /** Rent when the owner has two properties in the group. */
  two: number;
  /** Rent when the owner has the complete three-property group. */
  three: number;
  /** Exact rent at Hotel 1, Hotel 2, Hotel 3, and Tower. */
  development?: readonly [number, number, number, number];
};

export type Tile = {
  id: string;
  name: string;
  kind: TileKind;
  group?: string;
  price?: number;
  rent?: number;
  tone?: string;
  sellValue?: number;
  mortgageValue?: number;
  unmortgageCost?: number;
  developmentCost?: number;
  repairCost?: number;
  rentSchedule?: RentSchedule;
  taxAmount?: number;
};

export const RULES = {
  version: "scam-city-v2",
  boardVersion: "36-tile-scamcity-v2",
  startingCashByOrder: [1000, 1050, 1100, 1150, 1200, 1250],
  salary: 300,
  victory: { targetNetWorth: 5000, roundLimit: 30 },
  timing: {
    turnSeconds: 30,
    propertySeconds: 15,
    /** Super Power choice page (four powers + CANCEL). */
    powerSeconds: 20,
    /** Bomb / Power Swap selection steps. */
    powerActionSeconds: 30,
    /** Whole Auction interaction, from initiation until trade, cancel or expiry. */
    auctionSeconds: 69,
  },
  powers: {
    rentFreeCircuits: 3,
    bombRoundingStep: 5,
    bombMinimumRent: 1,
  },
  property: {
    developmentSellRate: 0.5,
    conditionLevels: [1, 0.75, 0.5, 0.25] as const,
  },
  development: {
    levels: ["HOTEL 1", "HOTEL 2", "HOTEL 3", "TOWER"] as const,
  },
  economy: { bankruptcyThreshold: 3000, exchangeBonus: 100 },
  bank: {
    maxResolutionDepth: 3,
    outcomes: [
      { type: "cash", amount: 150, weight: 10 },
      { type: "cash", amount: 100, weight: 10 },
      { type: "cash", amount: 250, weight: 2 },
      { type: "cash", amount: 50, weight: 10 },
      { type: "cash", amount: -100, weight: 10 },
      { type: "cash", amount: -150, weight: 10 },
      { type: "lowest", amount: 50, weight: 10 },
      { type: "move", spaces: 3, weight: 10 },
      { type: "move", spaces: -3, weight: 10 },
      { type: "travel", weight: 10 },
    ] as const,
  },
} as const;

const palette: Record<string, string> = {
  green: "#55a86e",
  "light-blue": "#65abc5",
  pink: "#d77da4",
  orange: "#e59156",
  "light-green": "#8ab56f",
  gold: "#d1ac4f",
  purple: "#9275bd",
  red: "#d9675d",
  G9: "#7185a8",
  G10: "#9670ad",
  tax: "#d48c5e",
  start: "#6f9c77",
  bank: "#b9a16b",
  power: "#efbd4e",
  jail: "#748579",
};

type PropertyData = {
  price: number;
  sell: number;
  mortgage: number;
  unmortgage: number;
  rents: readonly [number, number, number];
  developmentCost?: number;
  developmentRents?: readonly [number, number, number, number];
  repairCost?: number;
};

const property = (
  index: number,
  name: string,
  kind: "city" | "transport" | "business",
  group: string,
  data: PropertyData,
): Tile => ({
  id: `tile_${String(index).padStart(2, "0")}`,
  name,
  kind,
  group,
  tone: palette[group],
  price: data.price,
  rent: data.rents[0],
  sellValue: data.sell,
  mortgageValue: data.mortgage,
  unmortgageCost: data.unmortgage,
  rentSchedule: {
    one: data.rents[0],
    two: data.rents[1],
    three: data.rents[2],
    ...(data.developmentRents ? { development: data.developmentRents } : {}),
  },
  ...(data.developmentCost !== undefined
    ? { developmentCost: data.developmentCost }
    : {}),
  ...(data.repairCost !== undefined ? { repairCost: data.repairCost } : {}),
});

const city = (
  index: number,
  name: string,
  group: string,
  data: PropertyData,
) => property(index, name, "city", group, data);

const transport = (index: number, name: string, data: PropertyData) =>
  property(index, name, "transport", "G9", data);

const business = (index: number, name: string, data: PropertyData) =>
  property(index, name, "business", "G10", data);

const greenRent = [10, 20, 30] as const;
const greenDevelopment = [50, 100, 150, 180] as const;
const lightBlueRent = [15, 30, 45] as const;
const lightBlueDevelopment = [90, 135, 195, 295] as const;
const pinkRent = [20, 35, 45] as const;
const pinkDevelopment = [105, 195, 295, 375] as const;
const orangeRent = [30, 40, 55] as const;
const orangeDevelopment = [130, 240, 360, 440] as const;
const lightGreenRent = [35, 50, 60] as const;
const lightGreenDevelopment = [180, 270, 445, 590] as const;
const goldRent = [40, 60, 80] as const;
const goldDevelopment = [210, 355, 505, 720] as const;
const purpleDevelopment = [245, 420, 630, 940] as const;
const redDevelopment = [330, 660, 880, 1120] as const;

/**
 * Property prices and rent schedules are transcribed from the SCAMCITY sheet.
 * Group 2 / full-group rents are explicit data: they are not multipliers.
 */
export const BOARD: Tile[] = [
  { id: "tile_00", name: "START", kind: "start", tone: palette.start },
  city(1, "DELHI", "green", {
    price: 110,
    sell: 100,
    mortgage: 70,
    unmortgage: 80,
    rents: greenRent,
    developmentCost: 50,
    developmentRents: greenDevelopment,
    repairCost: 25,
  }),
  city(2, "HYDERABAD", "green", {
    price: 110,
    sell: 100,
    mortgage: 70,
    unmortgage: 80,
    rents: greenRent,
    developmentCost: 50,
    developmentRents: greenDevelopment,
    repairCost: 25,
  }),
  city(3, "BANGKOK", "light-blue", {
    price: 130,
    sell: 115,
    mortgage: 80,
    unmortgage: 90,
    rents: lightBlueRent,
    developmentCost: 70,
    developmentRents: lightBlueDevelopment,
    repairCost: 35,
  }),
  business(4, "SEVEN-11", {
    price: 200,
    sell: 200,
    mortgage: 140,
    unmortgage: 160,
    rents: [50, 100, 200],
  }),
  city(5, "MUMBAI", "green", {
    price: 120,
    sell: 100,
    mortgage: 70,
    unmortgage: 80,
    rents: greenRent,
    developmentCost: 50,
    developmentRents: greenDevelopment,
    repairCost: 25,
  }),
  transport(6, "BOAT", {
    price: 150,
    sell: 150,
    mortgage: 100,
    unmortgage: 110,
    rents: [35, 70, 140],
  }),
  city(7, "SINGAPORE", "light-blue", {
    price: 150,
    sell: 125,
    mortgage: 100,
    unmortgage: 110,
    rents: lightBlueRent,
    developmentCost: 70,
    developmentRents: lightBlueDevelopment,
    repairCost: 35,
  }),
  city(8, "AMSTERDAM", "light-blue", {
    price: 140,
    sell: 125,
    mortgage: 90,
    unmortgage: 100,
    rents: lightBlueRent,
    developmentCost: 70,
    developmentRents: lightBlueDevelopment,
    repairCost: 35,
  }),
  { id: "tile_09", name: "BANK", kind: "bank", tone: palette.bank },
  city(10, "JAKARTA", "pink", {
    price: 160,
    sell: 130,
    mortgage: 110,
    unmortgage: 120,
    rents: pinkRent,
    developmentCost: 90,
    developmentRents: pinkDevelopment,
    repairCost: 45,
  }),
  transport(11, "RAILWAYS", {
    price: 150,
    sell: 150,
    mortgage: 100,
    unmortgage: 110,
    rents: [35, 70, 140],
  }),
  city(12, "BERLIN", "pink", {
    price: 170,
    sell: 135,
    mortgage: 120,
    unmortgage: 135,
    rents: pinkRent,
    developmentCost: 90,
    developmentRents: pinkDevelopment,
    repairCost: 45,
  }),
  city(13, "MOSCOW", "pink", {
    price: 180,
    sell: 140,
    mortgage: 130,
    unmortgage: 140,
    rents: pinkRent,
    developmentCost: 90,
    developmentRents: pinkDevelopment,
    repairCost: 45,
  }),
  city(14, "TORONTO", "orange", {
    price: 200,
    sell: 180,
    mortgage: 150,
    unmortgage: 165,
    rents: orangeRent,
    developmentCost: 120,
    developmentRents: orangeDevelopment,
    repairCost: 60,
  }),
  { id: "tile_15", name: "SUPER POWER", kind: "power", tone: palette.power },
  city(16, "SEOUL", "orange", {
    price: 220,
    sell: 190,
    mortgage: 160,
    unmortgage: 175,
    rents: orangeRent,
    developmentCost: 120,
    developmentRents: orangeDevelopment,
    repairCost: 60,
  }),
  city(17, "HONG KONG", "orange", {
    price: 240,
    sell: 200,
    mortgage: 170,
    unmortgage: 190,
    rents: orangeRent,
    developmentCost: 120,
    developmentRents: orangeDevelopment,
    repairCost: 60,
  }),
  { id: "tile_18", name: "JAIL", kind: "jail", tone: palette.jail },
  city(19, "ZURICH", "light-green", {
    price: 255,
    sell: 210,
    mortgage: 180,
    unmortgage: 200,
    rents: lightGreenRent,
    developmentCost: 140,
    developmentRents: lightGreenDevelopment,
    repairCost: 70,
  }),
  city(20, "ISRAEL", "light-green", {
    price: 255,
    sell: 215,
    mortgage: 190,
    unmortgage: 210,
    rents: lightGreenRent,
    developmentCost: 140,
    developmentRents: lightGreenDevelopment,
    repairCost: 70,
  }),
  business(21, "RAVE CLUB", {
    price: 150,
    sell: 150,
    mortgage: 100,
    unmortgage: 110,
    rents: [50, 100, 200],
  }),
  city(22, "RIYADH", "light-green", {
    price: 275,
    sell: 220,
    mortgage: 200,
    unmortgage: 220,
    rents: lightGreenRent,
    developmentCost: 140,
    developmentRents: lightGreenDevelopment,
    repairCost: 70,
  }),
  city(23, "IRAN", "gold", {
    price: 300,
    sell: 245,
    mortgage: 220,
    unmortgage: 240,
    rents: goldRent,
    developmentCost: 170,
    developmentRents: goldDevelopment,
    repairCost: 90,
  }),
  {
    id: "tile_24",
    name: "PROPERTY TAX",
    kind: "tax",
    tone: palette.tax,
    taxAmount: 50,
  },
  city(25, "SAUDI", "gold", {
    price: 320,
    sell: 250,
    mortgage: 220,
    unmortgage: 240,
    rents: goldRent,
    developmentCost: 170,
    developmentRents: goldDevelopment,
    repairCost: 90,
  }),
  city(26, "DUBAI", "gold", {
    price: 335,
    sell: 260,
    mortgage: 230,
    unmortgage: 240,
    rents: goldRent,
    developmentCost: 170,
    developmentRents: goldDevelopment,
    repairCost: 90,
  }),
  { id: "tile_27", name: "SUPER POWER", kind: "power", tone: palette.power },
  city(28, "PARIS", "purple", {
    price: 350,
    sell: 310,
    mortgage: 280,
    unmortgage: 310,
    rents: [40, 70, 105],
    developmentCost: 195,
    developmentRents: purpleDevelopment,
    repairCost: 100,
  }),
  city(29, "LONDON", "purple", {
    price: 355,
    sell: 320,
    mortgage: 280,
    unmortgage: 310,
    rents: [45, 70, 105],
    developmentCost: 195,
    developmentRents: purpleDevelopment,
    repairCost: 100,
  }),
  business(30, "GYM", {
    price: 200,
    sell: 200,
    mortgage: 140,
    unmortgage: 160,
    rents: [50, 100, 200],
  }),
  city(31, "BIRMINGHAM", "purple", {
    price: 360,
    sell: 330,
    mortgage: 300,
    unmortgage: 330,
    rents: [55, 70, 105],
    developmentCost: 195,
    developmentRents: purpleDevelopment,
    repairCost: 100,
  }),
  city(32, "CHICAGO", "red", {
    price: 420,
    sell: 370,
    mortgage: 350,
    unmortgage: 385,
    rents: [60, 80, 120],
    developmentCost: 225,
    developmentRents: redDevelopment,
    repairCost: 110,
  }),
  transport(33, "AIRPORT", {
    price: 200,
    sell: 200,
    mortgage: 140,
    unmortgage: 160,
    rents: [50, 100, 200],
  }),
  city(34, "CALIFORNIA", "red", {
    price: 420,
    sell: 380,
    mortgage: 350,
    unmortgage: 385,
    rents: [65, 80, 120],
    developmentCost: 225,
    developmentRents: [440, 660, 880, 1120],
    repairCost: 110,
  }),
  city(35, "NEW YORK", "red", {
    price: 450,
    sell: 400,
    mortgage: 380,
    unmortgage: 420,
    rents: [70, 80, 120],
    developmentCost: 225,
    developmentRents: [440, 660, 880, 1120],
    repairCost: 110,
  }),
];

export const POWER_OPTIONS = [
  {
    id: "bomb",
    name: "BOMB",
    icon: "✹",
    color: "#f17858",
    description: "Halve one rival property's rent. Ownership does not change.",
  },
  {
    id: "power-swap",
    name: "POWER SWAP",
    icon: "⇄",
    color: "#56a9d1",
    description: "Force a swap: one rival property for one of yours.",
  },
  {
    id: "auction",
    name: "AUCTION",
    icon: "◎",
    color: "#d7ac44",
    description: "Offer one of yours. A rival's offer can be swapped for it; both earn $100.",
  },
  {
    id: "rent-free",
    name: "RENT FREE ROUND",
    icon: "✦",
    color: "#62ae78",
    description: "Rent and property charges are blocked for three circuits.",
  },
] as const;

export type PowerId = (typeof POWER_OPTIONS)[number]["id"];

export const PRESETS = {
  QUICK: { target: 3000, rounds: 20 },
  STANDARD: { target: 5000, rounds: 30 },
  LONG: { target: 7000, rounds: 40 },
} as const;
