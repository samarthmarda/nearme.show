export type BankCueAction =
  | { type: "COLLECT_BANK"; amount: number }
  | { type: "PAY_BANK"; amount: number }
  | { type: "GO_TO_JAIL" }
  | { type: "ADVANCE_TO_TILE"; targetTileId: string; bonusAmount: number }
  | { type: "MOVE_BY_SPACES"; delta: number }
  | {
      type: "MOVE_TO_CATEGORY";
      category: "transport" | "business";
      direction: "forward" | "backward";
    }
  | { type: "GRANT_CONTROLLED_ROLL"; count: number }
  | { type: "TRIGGER_SCAM_SWAP" };

export type BankCueCard = {
  id: string;
  description: string;
  effectText: string;
  action: BankCueAction;
};

export const BANK_CUES: readonly BankCueCard[] = [
  {
    id: "01",
    description:
      "You found a shortcut through a construction site. The shortcut was expensive.",
    effectText: "Pay $50",
    action: { type: "PAY_BANK", amount: 50 },
  },
  {
    id: "02",
    description:
      "You agreed to the terms and conditions without reading them.",
    effectText: "Pay $25",
    action: { type: "PAY_BANK", amount: 25 },
  },
  {
    id: "03",
    description: "Your mother told everyone you are a millionaire.",
    effectText: "Collect $100",
    action: { type: "COLLECT_BANK", amount: 100 },
  },
  {
    id: "04",
    description: "Your recently found your lost locker keys, collect 50$",
    effectText: "Collect $50",
    action: { type: "COLLECT_BANK", amount: 50 },
  },
  {
    id: "05",
    description: "You joined a millionaires’ group chat.",
    effectText: "Collect $50",
    action: { type: "COLLECT_BANK", amount: 50 },
  },
  {
    id: "06",
    description: "You asked the police officer, “Do you know who I am?”",
    effectText: "Go to Jail",
    action: { type: "GO_TO_JAIL" },
  },
  {
    id: "07",
    description: "You went out for coffee and came back with shopping bags.",
    effectText: "Pay $75",
    action: { type: "PAY_BANK", amount: 75 },
  },
  {
    id: "08",
    description: "You nodded confidently through an entire meeting.",
    effectText: "Collect $100",
    action: { type: "COLLECT_BANK", amount: 100 },
  },
  {
    id: "09",
    description: "Everyone laughed at your joke. Even you were surprised.",
    effectText: "Collect $50",
    action: { type: "COLLECT_BANK", amount: 50 },
  },
  {
    id: "10",
    description: "You ordered a snack and somehow paid for dinner.",
    effectText: "Pay $100",
    action: { type: "PAY_BANK", amount: 100 },
  },
  {
    id: "11",
    description: "You sprinted to catch the bus and made it.",
    effectText: "Advance to Start; collect $300",
    action: {
      type: "ADVANCE_TO_TILE",
      targetTileId: "tile_00",
      bonusAmount: 300,
    },
  },
  {
    id: "12",
    description: "You found cash in a jacket you had not worn in years.",
    effectText: "Collect $100",
    action: { type: "COLLECT_BANK", amount: 100 },
  },
  {
    id: "13",
    description: "Your plant died despite your daily motivational speeches.",
    effectText: "Pay $50",
    action: { type: "PAY_BANK", amount: 50 },
  },
  {
    id: "14",
    description: "Your contractor said, “I know a guy.”",
    effectText: "Pay $100",
    action: { type: "PAY_BANK", amount: 100 },
  },
  {
    id: "15",
    description: "Your 47-slide presentation impressed the room.",
    effectText: "Collect $75",
    action: { type: "COLLECT_BANK", amount: 75 },
  },
  {
    id: "16",
    description: "Your boss sent a voice note that started with “Quick thing…”",
    effectText: "Collect $100",
    action: { type: "COLLECT_BANK", amount: 100 },
  },
  {
    id: "17",
    description: "You paid for a luxury restaurant photo.",
    effectText: "Pay $100",
    action: { type: "PAY_BANK", amount: 100 },
  },
  {
    id: "18",
    description: "You won an argument on the internet. The prize was tiny.",
    effectText: "Collect $10",
    action: { type: "COLLECT_BANK", amount: 10 },
  },
  {
    id: "19",
    description: "Your vintage car is finally sold.",
    effectText: "Collect $75",
    action: { type: "COLLECT_BANK", amount: 75 },
  },
  {
    id: "20",
    description: "Your car made a noise you chose to ignore.",
    effectText: "Pay $100",
    action: { type: "PAY_BANK", amount: 100 },
  },
  {
    id: "21",
    description: "You found an envelope you had forgotten about.",
    effectText: "Collect $50",
    action: { type: "COLLECT_BANK", amount: 50 },
  },
  {
    id: "22",
    description: "Your parking skills received official feedback.",
    effectText: "Pay $75",
    action: { type: "PAY_BANK", amount: 75 },
  },
  {
    id: "23",
    description: "An investor liked your rejected business idea.",
    effectText: "Collect $200",
    action: { type: "COLLECT_BANK", amount: 200 },
  },
  {
    id: "24",
    description: "The office coffee machine needed another contribution.",
    effectText: "Pay $50",
    action: { type: "PAY_BANK", amount: 50 },
  },
  {
    id: "25",
    description: "You won a lucky draw.",
    effectText: "Collect $125",
    action: { type: "COLLECT_BANK", amount: 125 },
  },
  {
    id: "26",
    description: "Your delivery arrived at the wrong address.",
    effectText: "Pay $50",
    action: { type: "PAY_BANK", amount: 50 },
  },
  {
    id: "27",
    description: "Your wedding photography side hustle paid off.",
    effectText: "Collect $100",
    action: { type: "COLLECT_BANK", amount: 100 },
  },
  {
    id: "28",
    description: "You sold the things you bought at midnight.",
    effectText: "Collect $150",
    action: { type: "COLLECT_BANK", amount: 150 },
  },
  {
    id: "29",
    description: "Delhi is calling.",
    effectText: "Advance to Delhi; collect $300",
    action: {
      type: "ADVANCE_TO_TILE",
      targetTileId: "tile_01",
      bonusAmount: 300,
    },
  },
  {
    id: "30",
    description: "Hyderabad is calling.",
    effectText: "Advance to Hyderabad; collect $300",
    action: {
      type: "ADVANCE_TO_TILE",
      targetTileId: "tile_02",
      bonusAmount: 300,
    },
  },
  {
    id: "31",
    description: "Bangkok is calling.",
    effectText: "Advance to Bangkok; collect $300",
    action: {
      type: "ADVANCE_TO_TILE",
      targetTileId: "tile_05",
      bonusAmount: 300,
    },
  },
  {
    id: "32",
    description: "Singapore is calling.",
    effectText: "Advance to Singapore; collect $300",
    action: {
      type: "ADVANCE_TO_TILE",
      targetTileId: "tile_07",
      bonusAmount: 300,
    },
  },
  {
    id: "33",
    description: "Dubai is calling.",
    effectText: "Advance to Dubai; collect $300",
    action: {
      type: "ADVANCE_TO_TILE",
      targetTileId: "tile_26",
      bonusAmount: 300,
    },
  },
  {
    id: "34",
    description: "London is calling.",
    effectText: "Advance to London; collect $300",
    action: {
      type: "ADVANCE_TO_TILE",
      targetTileId: "tile_29",
      bonusAmount: 300,
    },
  },
  {
    id: "35",
    description: "California is calling.",
    effectText: "Advance to California; collect $300",
    action: {
      type: "ADVANCE_TO_TILE",
      targetTileId: "tile_31",
      bonusAmount: 300,
    },
  },
  {
    id: "36",
    description: "New York is calling.",
    effectText: "Advance to New York; collect $300",
    action: {
      type: "ADVANCE_TO_TILE",
      targetTileId: "tile_35",
      bonusAmount: 300,
    },
  },
  {
    id: "37",
    description: "Your GPS sent you against the traffic.",
    effectText: "Move back 3 spaces",
    action: { type: "MOVE_BY_SPACES", delta: -3 },
  },
  {
    id: "38",
    description: "You caught the express train.",
    effectText: "Move forward 6 spaces",
    action: { type: "MOVE_BY_SPACES", delta: 6 },
  },
  {
    id: "39",
    description: "You boarded the wrong bus.",
    effectText: "Move back 6 spaces",
    action: { type: "MOVE_BY_SPACES", delta: -6 },
  },
  {
    id: "40",
    description: "Your rideshare driver knew a shortcut.",
    effectText: "Advance to the next Transport tile",
    action: {
      type: "MOVE_TO_CATEGORY",
      category: "transport",
      direction: "forward",
    },
  },
  {
    id: "41",
    description: "Your phone battery reached 1% at the worst time.",
    effectText: "Advance to the next Utility tile",
    action: {
      type: "MOVE_TO_CATEGORY",
      category: "business",
      direction: "forward",
    },
  },
  {
    id: "42",
    description: "You forgot your wallet and had to turn back.",
    effectText: "Move back to the previous Transport tile",
    action: {
      type: "MOVE_TO_CATEGORY",
      category: "transport",
      direction: "backward",
    },
  },
  {
    id: "43",
    description:
      "You completed a course promising to make you a millionaire by Monday.",
    effectText: "Collect $100",
    action: { type: "COLLECT_BANK", amount: 100 },
  },
  {
    id: "44",
    description: "You presented a confident idea that made no sense.",
    effectText: "Pay $50",
    action: { type: "PAY_BANK", amount: 50 },
  },
  {
    id: "45",
    description: "Your luxury watch attracted attention.",
    effectText: "Collect $50",
    action: { type: "COLLECT_BANK", amount: 50 },
  },
  {
    id: "46",
    description: "Your AI-powered pitch impressed the room.",
    effectText: "Collect $100",
    action: { type: "COLLECT_BANK", amount: 100 },
  },
  {
    id: "47",
    description: "Your business partnership ended over a group chat.",
    effectText: "Pay $50",
    action: { type: "PAY_BANK", amount: 50 },
  },
  {
    id: "48",
    description: "Your finance video went viral.",
    effectText: "Collect $50",
    action: { type: "COLLECT_BANK", amount: 50 },
  },
  {
    id: "49",
    description: "You accepted a challenge you should have ignored.",
    effectText: "Pay $25",
    action: { type: "PAY_BANK", amount: 25 },
  },
  {
    id: "50",
    description: "You got into the party. Somehow, you were paid.",
    effectText: "Collect $100",
    action: { type: "COLLECT_BANK", amount: 100 },
  },
  {
    id: "51",
    description: "Your rare collectible found a buyer.",
    effectText: "Collect $100",
    action: { type: "COLLECT_BANK", amount: 100 },
  },
  {
    id: "52",
    description: "You received a surprise grant.",
    effectText: "Collect $100",
    action: { type: "COLLECT_BANK", amount: 100 },
  },
  {
    id: "53",
    description: "Your celebrity property made the news.",
    effectText: "Collect $75",
    action: { type: "COLLECT_BANK", amount: 75 },
  },
  {
    id: "54",
    description: "Your building appeared in a magazine.",
    effectText: "Collect $100",
    action: { type: "COLLECT_BANK", amount: 100 },
  },
  {
    id: "55",
    description: "Your contractor gave you a discount.",
    effectText: "Collect $50",
    action: { type: "COLLECT_BANK", amount: 50 },
  },
  {
    id: "56",
    description: "A mysterious smell appeared in your property.",
    effectText: "Pay $75",
    action: { type: "PAY_BANK", amount: 75 },
  },
  {
    id: "57",
    description: "Your repair tutorial unexpectedly worked.",
    effectText: "Collect $50",
    action: { type: "COLLECT_BANK", amount: 50 },
  },
  {
    id: "58",
    description: "You received a property award.",
    effectText: "Collect $100",
    action: { type: "COLLECT_BANK", amount: 100 },
  },
  {
    id: "59",
    description: "Your contractor stopped answering calls.",
    effectText: "Pay $100",
    action: { type: "PAY_BANK", amount: 100 },
  },
  {
    id: "60",
    description: "Your business became famous overnight.",
    effectText: "Collect $150",
    action: { type: "COLLECT_BANK", amount: 150 },
  },
  {
    id: "61",
    description: "You argued with a traffic officer.",
    effectText: "Go to Jail",
    action: { type: "GO_TO_JAIL" },
  },
  {
    id: "62",
    description: "Your parking ticket was issued to the wrong car.",
    effectText: "Collect $75",
    action: { type: "COLLECT_BANK", amount: 75 },
  },
  {
    id: "63",
    description: "You discovered a loophole in the system.",
    effectText: "Collect 300$",
    action: { type: "COLLECT_BANK", amount: 300 },
  },
  {
    id: "64",
    description: "You discovered a secret route.",
    effectText: "Receive 1 Controlled Dice Power",
    action: { type: "GRANT_CONTROLLED_ROLL", count: 1 },
  },
  {
    id: "65",
    description: "Your property appeared on a makeover show.",
    effectText: "Collect $100",
    action: { type: "COLLECT_BANK", amount: 100 },
  },
  {
    id: "66",
    description: "Your purchase finally got refunded.",
    effectText: "Collect $100",
    action: { type: "COLLECT_BANK", amount: 100 },
  },
  {
    id: "67",
    description: "Your cat accidentally started a business.",
    effectText: "Collect $100",
    action: { type: "COLLECT_BANK", amount: 100 },
  },
  {
    id: "68",
    description: "You found a loophole in a rival’s deal.",
    effectText: "Receive 1 Scam Power",
    action: { type: "TRIGGER_SCAM_SWAP" },
  },
  {
    id: "69",
    description: "The city turned you into a local legend.",
    effectText: "Collect $200",
    action: { type: "COLLECT_BANK", amount: 200 },
  },
];

export function cueById(id: string): BankCueCard | undefined {
  return BANK_CUES.find((card) => card.id === id);
}
