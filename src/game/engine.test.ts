import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BOARD, RULES } from './rules';
import { buy, createGame, endTurn, netWorth, roll, rentFor } from './engine';

test('board is the specified 36 spaces and keeps the exact city group layout',()=>{
 assert.equal(BOARD.length,36);assert.deepEqual(BOARD.map(t=>t.name),['START','DELHI','HYDERABAD','BANGKOK','BOAT','MUMBAI','SUPER POWER','SINGAPORE','AMSTERDAM','BANK','JAKARTA','RAILWAYS','BERLIN','MOSCOW','TORONTO','BUS','SEOUL','HONG KONG','JAIL','ZURICH','ISRAEL','ELECTRICITY','RIYADH','IRAN','OIL MILL','SAUDI','DUBAI','SUPER POWER','PARIS','LONDON','NIAGARA WATER','BIRMINGHAM','CHICAGO','AIRPORT','CALIFORNIA','NEW YORK']);
 assert.deepEqual(BOARD.filter(t=>t.group==='green').map(t=>t.name),['DELHI','HYDERABAD','MUMBAI']);
 assert.equal(BOARD.some(t=>(t.kind as string)==='tax'),false);
});
test('six-sided movement wraps and pays the configured start salary',()=>{
 const s=createGame(['A','B']);s.players[0].position=34;const result=roll(s,4);assert.equal(result.state.players[0].position,2);assert.equal(result.state.players[0].cash,1000+RULES.salary);
});
test('Bank outcomes are server-selected from configured outcome data',()=>{const s=createGame(['A','B']);s.players[0].position=6;const result=roll(s,3,()=>0).state;assert.equal(result.players[0].position,9);assert.equal(result.players[0].cash,1150);assert.match(result.message,/got \$150/);});
test('purchase is one authoritative state transition and insufficient funds fail safely',()=>{
 const s=createGame(['A','B']);s.players[0].position=1;s.phase='decision';const n=buy(s);assert.equal(n.owners.delhi,'p0');assert.equal(n.players[0].cash,900);assert.equal(s.owners.delhi,undefined);
 const poor=createGame(['A','B']);poor.players[0].position=1;poor.players[0].cash=20;poor.phase='decision';assert.equal(buy(poor),poor);
});
test('rent follows group ownership multipliers then full-group development levels',()=>{
 const s=createGame(['A','B']),owner=s.players[0];s.owners.delhi='p0';assert.equal(rentFor(s,BOARD[1],owner),10);s.owners.hyderabad='p0';assert.equal(rentFor(s,BOARD[1],owner),15);s.owners.mumbai='p0';assert.equal(rentFor(s,BOARD[1],owner),20);s.buildings.delhi=1;assert.equal(rentFor(s,BOARD[1],owner),30);
});
test('net worth and round transition are deterministic',()=>{
 const s=createGame(['A','B']);s.players[0].position=1;s.phase='decision';const n=buy(s);assert.equal(netWorth(n,n.players[0]),975);n.phase='roll';const rolled=roll(n,1).state;const advanced=endTurn(rolled);assert.equal(advanced.turn,1);
});
