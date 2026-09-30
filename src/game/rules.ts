export type TileKind = 'start'|'city'|'bank'|'power'|'jail'|'transport'|'utility';
export type Tile = { id:string; name:string; kind:TileKind; group?:string; price?:number; rent?:number; tone?:string; sellValue?:number; developmentCost?:number };
export const RULES = {
  version: 'scam-city-v1', boardVersion: '36-city-loop-v1',
  startingCashByOrder: [1000,1050,1100,1150,1200,1250], salary:300,
  victory: { targetNetWorth:5000, roundLimit:30 },
  timing:{turnSeconds:30,propertySeconds:15,exchangeSeconds:60},
  property:{ developmentCost:150, sellRate:.75, developmentSellRate:.5, conditionLevels:[1,.75,.5,.25] as number[], repairCost:100 },
  rent:{groupMultipliers:[1,1.5,2] as number[], developmentMultipliers:[3,4,5,6] as number[]},
  economy:{bankruptcyThreshold:3000,exchangeBonus:100},
  bank:{outcomes:[{type:'cash',amount:150},{type:'cash',amount:100},{type:'cash',amount:250},{type:'cash',amount:50},{type:'cash',amount:-100},{type:'cash',amount:-150},{type:'lowest',amount:50},{type:'move',spaces:3},{type:'move',spaces:-3},{type:'travel'}] as const},
} as const;
const city=(id:string,name:string,group:string,rent:number,tone:string,price:number):Tile=>({id,name,group,rent,tone,price,kind:'city',sellValue:Math.round(price*.75),developmentCost:RULES.property.developmentCost});
export const BOARD:Tile[]=[
 {id:'start',name:'START',kind:'start'},
 city('delhi','DELHI','green',10,'#55a86e',100),city('hyderabad','HYDERABAD','green',10,'#55a86e',120),city('bangkok','BANGKOK','light-blue',20,'#65abc5',140),
 {id:'boat',name:'BOAT',kind:'transport',price:180,rent:25,tone:'#65abc5'},city('mumbai','MUMBAI','green',10,'#55a86e',140),{id:'power-1',name:'SUPER POWER',kind:'power',tone:'#efbd4e'},city('singapore','SINGAPORE','light-blue',20,'#65abc5',160),city('amsterdam','AMSTERDAM','light-blue',20,'#65abc5',180),
 {id:'bank',name:'BANK',kind:'bank',tone:'#b9a16b'},city('jakarta','JAKARTA','pink',25,'#d77da4',200),{id:'railways',name:'RAILWAYS',kind:'transport',price:220,rent:30,tone:'#9a8ab5'},city('berlin','BERLIN','pink',25,'#d77da4',220),city('moscow','MOSCOW','pink',25,'#d77da4',240),city('toronto','TORONTO','orange',30,'#e59156',260),{id:'bus',name:'BUS',kind:'transport',price:280,rent:35,tone:'#9a8ab5'},city('seoul','SEOUL','orange',30,'#e59156',280),city('hong-kong','HONG KONG','orange',30,'#e59156',300),
 {id:'jail',name:'JAIL',kind:'jail',tone:'#748579'},city('zurich','ZURICH','light-green',35,'#8ab56f',320),city('israel','ISRAEL','light-green',35,'#8ab56f',340),{id:'electricity',name:'ELECTRICITY',kind:'utility',price:360,rent:45,tone:'#eac85f'},city('riyadh','RIYADH','light-green',35,'#8ab56f',360),city('iran','IRAN','gold',40,'#d1ac4f',380),{id:'oil-mill',name:'OIL MILL',kind:'utility',price:400,rent:50,tone:'#eac85f'},city('saudi','SAUDI','gold',40,'#d1ac4f',420),city('dubai','DUBAI','gold',40,'#d1ac4f',440),
 {id:'power-2',name:'SUPER POWER',kind:'power',tone:'#efbd4e'},city('paris','PARIS','purple',40,'#9275bd',460),city('london','LONDON','purple',45,'#9275bd',480),{id:'niagara-water',name:'NIAGARA WATER',kind:'utility',price:500,rent:60,tone:'#65abc5'},city('birmingham','BIRMINGHAM','purple',55,'#9275bd',520),city('chicago','CHICAGO','red',60,'#d9675d',540),{id:'airport',name:'AIRPORT',kind:'transport',price:560,rent:70,tone:'#9a8ab5'},city('california','CALIFORNIA','red',65,'#d9675d',580),city('new-york','NEW YORK','red',70,'#d9675d',620),
];
export const PRESETS={QUICK:{target:3000,rounds:20},STANDARD:{target:5000,rounds:30},LONG:{target:7000,rounds:40}} as const;
