import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BoardCenter, type BoardCenterProps } from "./BoardCenter";
import { ChatMessageList } from "./ChatMessageList";
import { createGame, currentPlayer, roll, tileAt } from "../../game/engine";

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
