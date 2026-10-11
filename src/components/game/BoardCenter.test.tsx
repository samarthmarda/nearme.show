import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BoardCenter, PowerFlash, RentFreeStrip, type BoardCenterProps } from "./BoardCenter";
import { ChatMessageList } from "./ChatMessageList";
import { applyGameCommand, createGame, currentPlayer, roll, tileAt, type GameState } from "../../game/engine";
import { BOARD, type Tile } from "../../game/rules";

function centerProps(
  game: BoardCenterProps["game"],
  isMyTurn: boolean,
): BoardCenterProps {
  const player = currentPlayer(game);
  const tile = game.phase === "decision" ? tileAt(player.position) : null;
  return {
    game,
    player,
    isMyTurn,
    viewerId: isMyTurn ? player.id : player.id === "p0" ? "p1" : "p0",
    pendingTile: tile,
    displayTile: isMyTurn ? tile : null,
    tileOwner: undefined,
    ownedInGroup: 0,
    groupSize: tile?.group ? 3 : 0,
    activeRent: tile?.rent ?? 0,
    developmentLevel: 0,
    canDevelop: false,
    canAffordDevelopment: false,
    timerText: "00:15",
    eventText: "",
    rolling: false,
    motionActive: false,
    onRoll: () => {},
    onBuy: () => {},
    onPass: () => {},
    onBuild: () => {},
    onChoosePower: () => {},
    onPassPower: () => {},
    focusTile: null,
    flash: null,
    onPowerSelect: () => {},
    onPowerConfirm: () => {},
    onPowerDecline: () => {},
    onPowerCancel: () => {},
    onCloseTile: () => {},
  };
}

test("property decision actions render only for the player who owns the decision", () => {
  const decision = roll(createGame(["Player A", "Player B"]), 1).state;
  assert.equal(decision.phase, "decision");

  const active = renderToStaticMarkup(
    createElement(BoardCenter, centerProps(decision, true)),
  );
  const spectator = renderToStaticMarkup(
    createElement(BoardCenter, centerProps(decision, false)),
  );

  assert.match(active, /property-card/);
  assert.match(active, /BUY · \$/);
  assert.match(active, /PASS/);
  assert.match(spectator, /waiting-card/);
  assert.match(spectator, /Waiting for Player A/);
  assert.doesNotMatch(spectator, /property-card/);
  assert.doesNotMatch(spectator, /BUY · \$/);
  assert.doesNotMatch(spectator, /PASS/);
});

test("power choices are presented only to the active player", () => {
  const powerState = structuredClone(
    roll(createGame(["Player A", "Player B"]), 1).state,
  );
  powerState.phase = "power";

  const active = renderToStaticMarkup(
    createElement(BoardCenter, centerProps(powerState, true)),
  );
  const spectator = renderToStaticMarkup(
    createElement(BoardCenter, centerProps(powerState, false)),
  );

  assert.match(active, /power-card-option/);
  assert.match(active, /BOMB/);
  assert.match(spectator, /waiting-card/);
  assert.doesNotMatch(spectator, /power-card-option/);
  assert.doesNotMatch(spectator, /BOMB/);
});

test("chat distinguishes sent and received messages in an accessible log", () => {
  const markup = renderToStaticMarkup(
    createElement(ChatMessageList, {
      messages: [
        {
          id: "incoming",
          username: "Player B",
          text: "See you at the bank",
          timestamp: "2026-10-11T12:00:00.000Z",
          fromSelf: false,
        },
        {
          id: "outgoing",
          username: "Player A",
          text: "On my way",
          timestamp: "2026-10-11T12:01:00.000Z",
          fromSelf: true,
        },
      ],
    }),
  );

  assert.match(markup, /role="log"/);
  assert.match(markup, /received-message/);
  assert.match(markup, /sent-message/);
  assert.match(markup, /Player B/);
  assert.match(markup, /See you at the bank/);
  assert.match(markup, /Player A/);
  assert.match(markup, /On my way/);
});

/* ------------------------------------------------------------------------- */
/* Super Power centre panel, cue cards, rent-free strip and flash             */
/* ------------------------------------------------------------------------- */

/** Real engine state: player A lands on SUPER POWER with rival properties on the board. */
function powerGame(): GameState {
  const base = createGame(["Player A", "Player B", "Player C"]);
  base.turn = 0;
  base.phase = "roll";
  base.players[0].position = 14;
  const landed = roll(base, 1, () => 0).state;
  assert.equal(landed.phase, "power");
  landed.owners.tile_01 = "p1";
  landed.players[1].properties.push("tile_01");
  landed.owners.tile_10 = "p2";
  landed.players[2].properties.push("tile_10");
  landed.owners.tile_03 = "p0";
  landed.players[0].properties.push("tile_03");
  return landed;
}

function act(state: GameState, actor: string, command: Record<string, unknown>): GameState {
  const result = applyGameCommand(state, actor, { interactionId: state.powerInteraction?.id, ...command } as never);
  assert.equal(result.error, undefined, String(result.error));
  return result.state;
}

function renderFor(game: GameState, viewer: string, focus: string | null = null) {
  const player = currentPlayer(game);
  const focusTile: Tile | null = focus ? BOARD.find((t) => t.id === focus) ?? null : null;
  const props = centerProps(game, viewer === player.id);
  return renderToStaticMarkup(createElement(BoardCenter, { ...props, viewerId: viewer, focusTile }));
}

test("power choice page shows exactly the four powers with CANCEL, and no END TURN or CONTINUE", () => {
  const html = renderFor(powerGame(), "p0");
  for (const name of ["BOMB", "POWER SWAP", "AUCTION", "RENT FREE"]) assert.match(html, new RegExp(name));
  assert.equal((html.match(/class="power-card-option"/g) ?? []).length, 4);
  assert.doesNotMatch(html, /Controlled Roll|CONTROLLED ROLL/i);
  assert.match(html, /CANCEL/);
  assert.doesNotMatch(html, /END TURN|CONTINUE/i);
});

test("BOMB target state: no target selected, RELEASE is disabled, and the rival cue is eligible", () => {
  const game = act(powerGame(), "p0", { type: "CHOOSE_POWER", powerId: "bomb" });
  const html = renderFor(game, "p0", "tile_01");
  assert.match(html, /SELECT A RIVAL PROPERTY/);
  assert.match(html, /sp-state-eligible/);
  assert.match(html, /<button[^>]*sp-primary[^>]*disabled=""[^>]*>RELEASE/);
});

test("BOMB cue-card selection enables RELEASE and shows the halved rent preview", () => {
  let game = act(powerGame(), "p0", { type: "CHOOSE_POWER", powerId: "bomb" });
  game = act(game, "p0", { type: "POWER_SELECT", propertyId: "tile_01" });
  const html = renderFor(game, "p0", "tile_01");
  assert.match(html, /sp-state-selected/);
  assert.match(html, /<button(?![^>]*disabled)[^>]*sp-primary[^>]*>RELEASE/);
  assert.match(html, /\$5/, "rent preview shows the halved amount");
  assert.equal(game.bombs.length, 0, "rendering a selection does not apply the bomb");
});

test("POWER SWAP shows a two-step panel: rival first, own property second", () => {
  let game = act(powerGame(), "p0", { type: "CHOOSE_POWER", powerId: "power-swap" });
  let html = renderFor(game, "p0", "tile_10");
  assert.match(html, /SELECT TO RECEIVE/);
  assert.match(html, /YOU GIVE/);
  game = act(game, "p0", { type: "POWER_SELECT", propertyId: "tile_10" });
  html = renderFor(game, "p0", "tile_03");
  assert.match(html, /SELECT TO GIVE/);
  assert.match(html, /POWER SWAP/);
});

test("AUCTION offers: the initiator sees a waiting state while opponents submit, and opponents see SUBMIT OFFER", () => {
  let game = act(powerGame(), "p0", { type: "CHOOSE_POWER", powerId: "auction" });
  game = act(game, "p0", { type: "POWER_SELECT", propertyId: "tile_03" });
  game = act(game, "p0", { type: "POWER_CONFIRM" });
  assert.equal(game.powerInteraction?.step, "AUCTION_OFFERS");

  const opponent = renderFor(game, "p1");
  assert.match(opponent, /SUBMIT OFFER/);
  const initiator = renderFor(game, "p0");
  assert.match(initiator, /Waiting for/);
  assert.doesNotMatch(initiator, /SUBMIT OFFER/);
});

test("waiting: a viewer who is not the power actor sees the live status, not the choice cards", () => {
  const game = powerGame();
  const html = renderFor(game, "p2");
  assert.doesNotMatch(html, /class="power-card-option"/);
  assert.match(html, /SUPER POWER|Waiting for|waiting/i);
});

test("RENT FREE strip renders the protected player and remaining circuits", () => {
  const game = act(powerGame(), "p0", { type: "CHOOSE_POWER", powerId: "rent-free" });
  const html = renderToStaticMarkup(createElement(RentFreeStrip, { game }));
  assert.match(html, /RENT FREE ACTIVE/);
  assert.match(html, /Player A/);
  assert.match(html, /3 circuits left/);
  assert.equal(renderToStaticMarkup(createElement(RentFreeStrip, { game: powerGame() })), "");
});

test("power flash announces the server result text with a status role", () => {
  const game = act(powerGame(), "p0", { type: "CHOOSE_POWER", powerId: "rent-free" });
  assert.ok(game.powerEvent);
  const html = renderToStaticMarkup(createElement(PowerFlash, { event: game.powerEvent! }));
  assert.match(html, /role="status"/);
  assert.ok(html.includes(game.powerEvent!.text));
});
