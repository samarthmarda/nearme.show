import assert from "node:assert/strict";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { io, type Socket } from "socket.io-client";
import { BRAND } from "../brand";
import { PrivateSettingsModal } from "../components/game/PrivateSettingsModal";
import { DEFAULT_PRIVATE_SETTINGS, type GameState, type MatchSettings } from "./engine";

type RoomPayload = {
  code: string;
  hostId: string;
  settings: MatchSettings;
  started: boolean;
  members: Array<{ id: string; username: string; displayName: string }>;
  connectedUserIds: string[];
  game: GameState | null;
  turnDeadline: number | null;
};

type LiveClient = {
  index: number;
  cookie: string;
  user: { id: string; username: string; displayName: string };
  socket: Socket;
  latestRoom: RoomPayload | null;
  latestGame: GameState | null;
  chats: Array<{ username: string; text: string }>;
};

async function startTestServer(
  port: number,
  dataDir: string,
): Promise<ChildProcessWithoutNullStreams> {
  const child = spawn("./node_modules/.bin/tsx", ["server.ts"], {
    detached: true,
    env: {
      ...process.env,
      PORT: String(port),
      NODE_ENV: "production",
      SCAMCITY_DATA_DIR: dataDir,
    },
    stdio: "pipe",
  });

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      try {
        if (child.pid) process.kill(-child.pid, "SIGKILL");
      } catch {
        child.kill("SIGKILL");
      }
      reject(new Error("Timed out waiting for test server startup"));
    }, 12000);

    child.stdout.on("data", (chunk: Buffer) => {
      if (chunk.toString().includes(`listening on ${port}`)) {
        clearTimeout(timeout);
        resolve();
      }
    });
    child.stderr.on("data", (chunk: Buffer) => {
      const msg = chunk.toString();
      if (/EADDRINUSE|Error:/i.test(msg)) {
        clearTimeout(timeout);
        reject(new Error(msg));
      }
    });
    child.on("exit", (code) => {
      clearTimeout(timeout);
      reject(new Error(`Server exited early with code ${code}`));
    });
  });

  return child;
}

async function createAuthenticatedClient(
  baseUrl: string,
  index: number,
): Promise<LiveClient> {
  const suffix = `${Date.now().toString(36)}${index}`;
  const res = await fetch(`${baseUrl}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: `player_${suffix}`,
      displayName: `Crew ${index + 1}`,
      password: "password123",
    }),
  });
  assert.equal(res.status, 200);
  const rawCookie = res.headers.get("set-cookie");
  assert.ok(rawCookie, "Expected session cookie from signup");
  const cookie = rawCookie.split(";")[0];
  const data = (await res.json()) as {
    user: { id: string; username: string; displayName: string };
  };

  const client: LiveClient = {
    index,
    cookie,
    user: data.user,
    socket: null as unknown as Socket,
    latestRoom: null,
    latestGame: null,
    chats: [],
  };

  const socket = io(baseUrl, {
    transports: ["websocket"],
    extraHeaders: { Cookie: cookie },
  });
  client.socket = socket;

  socket.on("room:update", (room: RoomPayload) => {
    client.latestRoom = room;
    if (room.game && !client.latestGame) client.latestGame = room.game;
  });
  socket.on("game:state", (game: GameState) => {
    client.latestGame = game;
  });
  socket.on("chat:message", (msg: { username: string; text: string }) => {
    client.chats.push(msg);
  });

  await new Promise<void>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("Socket connect timeout")), 5000);
    socket.once("connect", () => {
      clearTimeout(t);
      resolve();
    });
    socket.once("connect_error", (err) => {
      clearTimeout(t);
      reject(err);
    });
  });

  return client;
}

function emitAck<T = Record<string, unknown>>(
  socket: Socket,
  event: string,
  ...args: unknown[]
): Promise<T> {
  return new Promise((resolve) => {
    socket.emit(event, ...args, (res: T) => resolve(res));
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

test("6-client live multiplayer server integration: private settings, capacity, sync, deduplication, reconnect, forfeit & rematch", async () => {
  const port = 4389;
  const baseUrl = `http://127.0.0.1:${port}`;
  const tempDataDir = mkdtempSync(path.join(os.tmpdir(), "scamcity-e2e-"));
  const serverProc = await startTestServer(port, tempDataDir);
  const clients: LiveClient[] = [];

  try {
    for (let i = 0; i < 6; i++) {
      clients.push(await createAuthenticatedClient(baseUrl, i));
    }

    // 1. Host creates a Private Game with default 2-player, UNLIMITED, $7000 settings
    const createRes = await emitAck<{
      ok: boolean;
      room?: RoomPayload;
    }>(clients[0].socket, "room:create", DEFAULT_PRIVATE_SETTINGS);
    assert.equal(createRes.ok, true);
    const roomCode = createRes.room!.code;
    assert.equal(roomCode.length, 6);
    assert.deepEqual(createRes.room?.settings, {
      mode: "LIVE",
      maxPlayers: 2,
      roundLimit: null,
      targetNetWorth: 7000,
    });

    // Client 2 joins; Client 3 is blocked by 2-player cap
    const join2 = await emitAck<{ ok: boolean }>(
      clients[1].socket,
      "room:join",
      roomCode,
    );
    assert.equal(join2.ok, true);

    const join3Blocked = await emitAck<{ ok: boolean; error?: string }>(
      clients[2].socket,
      "room:join",
      roomCode,
    );
    assert.equal(join3Blocked.ok, false);
    assert.match(join3Blocked.error ?? "", /full/i);

    // 2. Host updates pre-game settings to 6 players, 30 rounds, $3000 goal
    const settingsRes = await emitAck<{ ok: boolean; room?: RoomPayload }>(
      clients[0].socket,
      "room:settings",
      {
        mode: "LIVE",
        maxPlayers: 6,
        roundLimit: 30,
        targetNetWorth: 3000,
      },
    );
    assert.equal(settingsRes.ok, true);

    for (let i = 2; i < 6; i++) {
      const joined = await emitAck<{ ok: boolean }>(
        clients[i].socket,
        "room:join",
        roomCode,
      );
      assert.equal(joined.ok, true);
    }
    await sleep(80);
    for (const c of clients) {
      assert.equal(c.latestRoom?.members.length, 6);
      assert.equal(c.latestRoom?.connectedUserIds.length, 6);
      assert.equal(c.latestRoom?.settings.maxPlayers, 6);
      assert.equal(c.latestRoom?.settings.roundLimit, 30);
      assert.equal(c.latestRoom?.settings.targetNetWorth, 3000);
    }

    // 3. Start the 6-player match and verify synchronized initial state
    const startRes = await emitAck<{ ok: boolean }>(
      clients[0].socket,
      "room:start",
    );
    assert.equal(startRes.ok, true);
    await sleep(80);

    for (const c of clients) {
      assert.equal(c.latestGame?.players.length, 6);
      assert.equal(c.latestGame?.settings.roundLimit, 30);
      assert.equal(c.latestGame?.settings.targetNetWorth, 3000);
      assert.deepEqual(
        c.latestGame?.players.map((p) => p.cash),
        [1000, 1050, 1100, 1150, 1200, 1250],
      );
    }

    const clientAtSeat = (seatIdx: number): LiveClient => {
      const memberId = clients[0].latestRoom!.members[seatIdx].id;
      const found = clients.find((c) => c.user.id === memberId);
      assert.ok(found, `Expected live client for seat ${seatIdx}`);
      return found;
    };

    // 4. Out-of-turn action is rejected (seat 3 cannot roll on seat 0's turn)
    const outOfTurn = await emitAck<{ ok: boolean; error?: string }>(
      clientAtSeat(3).socket,
      "game:command",
      { type: "ROLL", commandId: "bad-turn-cmd" },
    );
    assert.equal(outOfTurn.ok, false);

    // 5. Active player's command succeeds once and duplicate commandId is idempotently ignored without re-executing
    const seat0Client = clientAtSeat(0);
    const roll1 = await emitAck<{ ok: boolean; state?: GameState }>(
      seat0Client.socket,
      "game:command",
      { type: "ROLL", commandId: "cmd-unique-1" },
    );
    assert.equal(roll1.ok, true);
    const seqAfterFirst = roll1.state!.notificationSeq;
    const activityLenAfterFirst = roll1.state!.activity.length;

    const roll1Dup = await emitAck<{ ok: boolean; state?: GameState }>(
      seat0Client.socket,
      "game:command",
      { type: "ROLL", commandId: "cmd-unique-1" },
    );
    assert.equal(roll1Dup.ok, true);
    assert.equal(roll1Dup.state!.notificationSeq, seqAfterFirst);
    assert.equal(roll1Dup.state!.activity.length, activityLenAfterFirst);

    // Resolve several live turns across the 6 clients
    for (let step = 0; step < 8; step++) {
      await sleep(35);
      const state = clients[0].latestGame!;
      if (state.phase === "finished") break;
      const activeIdx = state.turn;
      const activeSocket = clientAtSeat(activeIdx).socket;

      if (state.phase === "decision") {
        const buyOrPass = await emitAck<{ ok: boolean }>(
          activeSocket,
          "game:command",
          { type: "BUY_PROPERTY", commandId: `step-buy-${step}` },
        );
        if (!buyOrPass.ok) {
          await emitAck(activeSocket, "game:command", {
            type: "PASS_PROPERTY",
            commandId: `step-pass-${step}`,
          });
        }
      } else if (state.phase === "power") {
        await emitAck(activeSocket, "game:command", {
          type: "POWER_CANCEL",
          interactionId: state.powerInteraction?.id,
          commandId: `step-pwr-${step}`,
        });
      } else if (state.players[activeIdx].jailed) {
        await emitAck(activeSocket, "game:command", {
          type: "JAIL_SKIP_TURN",
          commandId: `step-jail-${step}`,
        });
      } else {
        await emitAck(activeSocket, "game:command", {
          type: "ROLL",
          commandId: `step-roll-${step}`,
        });
      }
    }

    await sleep(80);
    // Every connected client has identical authoritative game state
    const canonical = JSON.stringify(clients[0].latestGame);
    for (let i = 1; i < 6; i++) {
      assert.equal(JSON.stringify(clients[i].latestGame), canonical);
    }

    // 6. Chat broadcast reaches all 6 clients
    const chatRes = await emitAck<{ ok: boolean }>(
      clients[2].socket,
      "chat:send",
      "GG from Crew 3!",
    );
    assert.equal(chatRes.ok, true);
    await sleep(60);
    for (const c of clients) {
      assert.equal(c.chats[c.chats.length - 1]?.text, "GG from Crew 3!");
    }

    // 7. Disconnect updates connectedUserIds (OFFLINE badge) and reconnect restores exact state
    clients[4].socket.disconnect();
    await sleep(80);
    assert.equal(
      clients[0].latestRoom?.connectedUserIds.includes(clients[4].user.id),
      false,
    );

    clients[4].socket.connect();
    await new Promise<void>((resolve) =>
      clients[4].socket.once("connect", () => resolve()),
    );
    const rejoin = await emitAck<{ ok: boolean; room?: RoomPayload }>(
      clients[4].socket,
      "room:join",
      roomCode,
    );
    assert.equal(rejoin.ok, true);
    await sleep(80);
    assert.equal(
      clients[0].latestRoom?.connectedUserIds.includes(clients[4].user.id),
      true,
    );
    assert.equal(
      JSON.stringify(clients[4].latestGame),
      JSON.stringify(clients[0].latestGame),
    );

    // 8. Voluntary forfeits down to Last Player Standing -> Rematch preserves settings & rotates starting seat
    const prevSeat1Name = clients[0].latestRoom!.members[1].displayName;
    for (let i = 5; i >= 1; i--) {
      const forfeitRes = await emitAck<{ ok: boolean }>(
        clientAtSeat(i).socket,
        "game:command",
        { type: "FORFEIT_SELF", commandId: `forfeit-${i}` },
      );
      assert.equal(forfeitRes.ok, true);
    }
    await sleep(80);
    assert.equal(clients[0].latestGame?.phase, "finished");
    assert.equal(clients[0].latestGame?.winner, "p0");
    assert.equal(clients[0].latestGame?.victoryReason, "LAST_STANDING");

    const rematchRes = await emitAck<{ ok: boolean }>(
      clients[0].socket,
      "room:rematch",
    );
    assert.equal(rematchRes.ok, true);
    await sleep(80);
    assert.equal(clients[0].latestGame?.phase, "roll");
    assert.equal(clients[0].latestGame?.players.length, 6);
    assert.equal(clients[0].latestGame?.settings.roundLimit, 30);
    assert.equal(clients[0].latestGame?.settings.targetNetWorth, 3000);
    assert.equal(clients[0].latestGame?.players[0].name, prevSeat1Name);
    assert.equal(clients[0].latestRoom?.members[0].displayName, prevSeat1Name);
  } finally {
    for (const c of clients) {
      c.socket?.disconnect();
    }
    try {
      if (serverProc.pid) process.kill(-serverProc.pid, "SIGKILL");
    } catch {
      serverProc.kill("SIGKILL");
    }
    rmSync(tempDataDir, { recursive: true, force: true });
  }
});

test("PrivateSettingsModal, App shell, and mobile 3-region CSS architecture match UX acceptance rules", () => {
  const modalHtml = renderToStaticMarkup(
    <PrivateSettingsModal
      initialSettings={DEFAULT_PRIVATE_SETTINGS}
      onClose={() => {}}
      onConfirm={() => {}}
    />,
  );

  // Reference Private Game settings defaults & full option sets
  assert.match(modalHtml, /SETTINGS/);
  assert.match(modalHtml, /Game Mode/);
  assert.match(modalHtml, /LIVE/);
  for (const n of ["2", "3", "4", "5", "6"]) {
    assert.match(modalHtml, new RegExp(`>${n}</button>`));
  }
  assert.match(modalHtml, />30<\/button>/);
  assert.match(modalHtml, />50<\/button>/);
  assert.match(modalHtml, />UNLIMITED<\/button>/);
  assert.match(modalHtml, />\$3000<\/button>/);
  assert.match(modalHtml, />\$5000<\/button>/);
  assert.match(modalHtml, />\$7000<\/button>/);
  assert.match(modalHtml, />NEXT<\/button>/);

  // Scam City branding preserved
  assert.match(BRAND.name, /Scam City/i);

  // Verify App.tsx renders the mobile 3-region DOM and persistent ownership classes
  const appTsx = readFileSync(
    path.join(process.cwd(), "src/App.tsx"),
    "utf8",
  );
  assert.match(appTsx, /mobile-top-roster/);
  assert.match(appTsx, /mobile-bottom-region/);
  assert.match(appTsx, /mobile-chat-drawer/);
  assert.match(appTsx, /tile-owned/);
  assert.match(appTsx, /tile-owner-tag/);

  // Verify mobile 100dvh 3-region CSS (~10% top roster, ~80% board, ~10% bottom bar + collapsible chat drawer + reduced motion)
  const v2Css = readFileSync(
    path.join(process.cwd(), "src/v2.css"),
    "utf8",
  );
  assert.match(v2Css, /100dvh/);
  assert.match(v2Css, /\.mobile-top-roster/);
  assert.match(v2Css, /\.mobile-bottom-region/);
  assert.match(v2Css, /\.mobile-chat-drawer/);
  assert.match(v2Css, /\.tile-owned/);
  assert.match(v2Css, /\.tile-owner-tag/);
  assert.match(v2Css, /prefers-reduced-motion:\s*reduce/);
});
