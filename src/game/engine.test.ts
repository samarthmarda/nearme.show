import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BOARD, RULES } from './rules';
import { addPlayer, buy, createGame, endTurn, netWorth, roll, rentFor } from './engine';

test('board is the specified 36 spaces and keeps the exact city group layout',()=>{
 assert.equal(BOARD.length,36);assert.deepEqual(BOARD.map(t=>t.name),['START','DELHI','HYDERABAD','BANGKOK','BOAT','MUMBAI','SUPER POWER','SINGAPORE','AMSTERDAM','BANK','JAKARTA','RAILWAYS','BERLIN','MOSCOW','TORONTO','BUS','SEOUL','HONG KONG','JAIL','ZURICH','ISRAEL','ELECTRICITY','RIYADH','IRAN','OIL MILL','SAUDI','DUBAI','SUPER POWER','PARIS','LONDON','NIAGARA WATER','BIRMINGHAM','CHICAGO','AIRPORT','CALIFORNIA','NEW YORK']);
 assert.deepEqual(BOARD.filter(t=>t.group==='green').map(t=>t.name),['DELHI','HYDERABAD','MUMBAI']);
 assert.equal(BOARD.some(t=>(t.kind as string)==='tax'),false);
});
test('board identifiers, purchase prices, resale values, and development costs are centralized',()=>{assert.equal(BOARD.every((tile,index)=>tile.id===`tile_${String(index).padStart(2,'0')}`),true);const cityPrices=[100,110,130,120,145,160,170,185,200,210,225,350,250,275,300,300,315,330,350,420,400,425,440,450];assert.deepEqual(BOARD.filter(tile=>tile.kind==='city').map(tile=>tile.price),cityPrices);assert.equal(BOARD[1].sellValue,80);assert.equal(BOARD[1].developmentCost,55);assert.equal(RULES.salary,300);assert.deepEqual(RULES.startingCashByOrder,[1000,1050,1100,1150,1200,1250]);});
test('players may join an active match without changing existing turn indexes',()=>{const s=createGame(['A','B']);s.phase='decision';s.turn=1;const joined=addPlayer(s,' C ');assert.equal(joined.players.length,3);assert.equal(joined.players[2].id,'p2');assert.equal(joined.players[2].name,'C');assert.equal(joined.players[2].cash,RULES.startingCashByOrder[2]);assert.equal(joined.turn,1);assert.equal(joined.phase,'decision');assert.equal(s.players.length,2);const full=createGame(['A','B','C','D','E','F']);assert.equal(addPlayer(full,'G'),full);full.phase='finished';assert.equal(addPlayer(full,'G'),full);});
test('six-sided movement wraps and pays the configured start salary',()=>{
 const s=createGame(['A','B']);s.players[0].position=34;const result=roll(s,4);assert.equal(result.state.players[0].position,2);assert.equal(result.state.players[0].cash,1000+RULES.salary);
});
test('Bank outcomes are server-selected from configured outcome data',()=>{const s=createGame(['A','B']);s.players[0].position=6;const result=roll(s,3,()=>0).state;assert.equal(result.players[0].position,9);assert.equal(result.players[0].cash,1150);assert.match(result.message,/got \$150/);});
test('landing on a Super Power stop awards exactly one uniformly selected power on the server',()=>{const s=createGame(['A','B']);const landed=roll(s,6,()=>0).state;assert.equal(landed.players[0].position,6);assert.equal(landed.phase,'decision');assert.deepEqual(landed.players[0].powers,['bomb']);assert.match(landed.message,/received BOMB/);assert.deepEqual(s.players[0].powers,[]);});
test('a Super Power award does not pause the active turn',()=>{const landed=roll(createGame(['A','B']),6,()=>0).state;const next=endTurn(landed);assert.equal(next.turn,1);assert.equal(next.phase,'roll');assert.deepEqual(next.players[0].powers,['bomb']);});
test('purchase is one authoritative state transition and insufficient funds fail safely',()=>{
 const s=createGame(['A','B']);s.players[0].position=1;s.phase='decision';const n=buy(s);assert.equal(n.owners.tile_01,'p0');assert.equal(n.players[0].cash,900);assert.equal(s.owners.tile_01,undefined);
 const poor=createGame(['A','B']);poor.players[0].position=1;poor.players[0].cash=20;poor.phase='decision';assert.equal(buy(poor),poor);
});
test('rent follows group ownership multipliers then full-group development levels',()=>{
 const s=createGame(['A','B']),owner=s.players[0];s.owners.tile_01='p0';assert.equal(rentFor(s,BOARD[1],owner),10);s.owners.tile_02='p0';assert.equal(rentFor(s,BOARD[1],owner),15);s.owners.tile_05='p0';assert.equal(rentFor(s,BOARD[1],owner),20);for(const [level,multiplier] of [3,4,5,6].entries()){s.buildings.tile_01=level+1;assert.equal(rentFor(s,BOARD[1],owner),10*multiplier);}
});
test('transport and utility rent scale by owned asset count from configured rules',()=>{const s=createGame(['A','B']),owner=s.players[0];s.owners.tile_04='p0';assert.equal(rentFor(s,BOARD[4],owner),30);s.owners.tile_11='p0';assert.equal(rentFor(s,BOARD[4],owner),60);s.owners.tile_21='p0';assert.equal(rentFor(s,BOARD[21],owner),25);s.owners.tile_24='p0';assert.equal(rentFor(s,BOARD[21],owner),50);});
test('net worth and round transition are deterministic',()=>{
 const s=createGame(['A','B']);s.players[0].position=1;s.phase='decision';const n=buy(s);assert.equal(netWorth(n,n.players[0]),980);n.phase='roll';const rolled=roll(n,1).state;const advanced=endTurn(rolled);assert.equal(advanced.turn,1);
});
