import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { io, type Socket } from "socket.io-client";
import { AuthView } from "./AuthView";
import { BoardCenter } from "./components/game/BoardCenter";
import { PrivateSettingsModal } from "./components/game/PrivateSettingsModal";
export { PrivateSettingsModal };
import { tileStrip } from "./components/game/tileStrip";
import { MissileOverlay } from "./components/game/PowerEffects";
import {
  ChatMessageList,
  type ChatMessageView,
} from "./components/game/ChatMessageList";
import {
  ArrowLeft,
  ArrowUpRight,
  Bell,
  ChevronDown,
  CircleHelp,
  Crown,
  Dices,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import { BRAND } from "./brand";
import {
  BOARD,
  DEFAULT_PRIVATE_SETTINGS,
  NET_WORTH_GOAL_OPTIONS,
  PLAYER_COLORS,
  PLAYER_COUNT_OPTIONS,
  POWER_OPTIONS,
  ROUND_LIMIT_OPTIONS,
  RULES,
  type MatchSettings,
  type NetWorthGoalOption,
  type PlayerCountOption,
  type PowerId,
  type RoundLimitOption,
  type Tile,
} from "./game/rules";
import {
  createGame,
  currentPlayer,
  currentRent,
  groupComplete,
  isEliminated,
  netWorth,
  playerInitials,
  powerEligibleIds,
  powerSelectedIds,
  rentFor,
  sellBlockReason,
  tileAt,
  type GameState,
  type PowerEvent,
  type TableNotification,
} from "./game/engine";
import "./index.css";
import "./v2.css";

type AccountView = { id: string; username: string; displayName: string };
type FriendView = AccountView & { online: boolean; isFriend?: boolean };
type RoomView = {
  code: string;
  hostId: string;
  settings?: MatchSettings;
  started: boolean;
  members: AccountView[];
  connectedUserIds?: string[];
  game: GameState | null;
  turnDeadline?: number | null;
};

const fmt = (v: number) =>
  v < 0
    ? `-$${Math.abs(Math.round(v)).toLocaleString()}`
    : `$${Math.round(v).toLocaleString()}`;

const powerName = (kind: PowerId | null) =>
  POWER_OPTIONS.find((power) => power.id === kind)?.name ?? "CHOOSE A POWER";

const propertyLike = (tile: Tile) =>
  tile.kind === "city" || tile.kind === "transport" || tile.kind === "business";

const initial = createGame(["Player 1", "Player 2"]);

function tilePos(i: number) {
  if (i === 0) return { gridColumn: 1, gridRow: 10 };
  if (i <= 8) return { gridColumn: 1, gridRow: 10 - i };
  if (i === 9) return { gridColumn: 1, gridRow: 1 };
  if (i <= 17) return { gridColumn: i - 8, gridRow: 1 };
  if (i === 18) return { gridColumn: 10, gridRow: 1 };
  if (i <= 26) return { gridColumn: 10, gridRow: i - 17 };
  if (i === 27) return { gridColumn: 10, gridRow: 10 };
  return { gridColumn: 37 - i, gridRow: 10 };
}

export default function App() {
  const [authUser, setAuthUser] = useState<AccountView | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomInfo, setRoomInfo] = useState<RoomView | null>(null);
  const [friends, setFriends] = useState<FriendView[]>([]);
  const [onlineIds, setOnlineIds] = useState<string[]>([]);
  const [friendQuery, setFriendQuery] = useState("");
  const [people, setPeople] = useState<FriendView[]>([]);
  const [pendingInvite, setPendingInvite] = useState<{
    from: string;
    roomCode: string;
  } | null>(null);
  const [roomCodeInput, setRoomCodeInput] = useState("");

  const [game, setGame] = useState<GameState>(initial);
  const [notice, setNotice] = useState("");
  const [chat, setChat] = useState("");
  const [messages, setMessages] = useState<ChatMessageView[]>([]);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showLobby, setShowLobby] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editingExistingRoomSettings, setEditingExistingRoomSettings] =
    useState(false);

  const [centerEvent, setCenterEvent] = useState(initial.message);
  const [notifQueue, setNotifQueue] = useState<TableNotification[]>([]);
  const seenNotifSeq = useRef<number | null>(null);

  const [secondsLeft, setSecondsLeft] = useState(RULES.timing.turnSeconds);
  const [rolling, setRolling] = useState(false);
  const [motionActive, setMotionActive] = useState(false);
  const [motionPosition, setMotionPosition] = useState<Record<string, number>>(
    {},
  );
  const commandBusyRef = useRef(false);
  const suppressState = useRef(false);
  const activeRoomCode = useRef<string | null>(null);
  const activeRoomStarted = useRef(false);
  const mobileChatOpenRef = useRef(false);

  useEffect(() => {
    mobileChatOpenRef.current = mobileChatOpen;
    if (mobileChatOpen) setUnreadChatCount(0);
  }, [mobileChatOpen]);

  useEffect(() => {
    let mounted = true;
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (mounted) setAuthUser(d.user ?? null);
      })
      .catch(() => {
        if (mounted) setAuthUser(null);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!authUser) return;
    const live = io({ withCredentials: true });
    setSocket(live);

    live.on("room:update", (room: RoomView) => {
      if (activeRoomCode.current !== room.code) {
        activeRoomCode.current = room.code;
        activeRoomStarted.current = false;
        seenNotifSeq.current = null;
        setNotifQueue([]);
        setMessages([]);
        setUnreadChatCount(0);
      }
      const enteringGame = !activeRoomStarted.current && Boolean(room.game);
      activeRoomStarted.current = Boolean(room.game);
      setRoomInfo(room);
      if (enteringGame && room.game) {
        seenNotifSeq.current = room.game.notificationSeq ?? 0;
        setGame(room.game);
      }
    });

    live.on("connect", () => {
      const code = activeRoomCode.current;
      if (!code) return;
      live.emit("room:join", code, (r: { ok: boolean; room?: RoomView }) => {
        if (r?.ok && r.room?.game) {
          seenNotifSeq.current = r.room.game.notificationSeq ?? 0;
          setGame(r.room.game);
          setRoomInfo(r.room);
        }
      });
    });

    live.on("game:state", (state: GameState) => {
      if (suppressState.current) {
        suppressState.current = false;
        return;
      }
      setGame(state);
    });

    live.on("presence:update", (ids: string[]) => setOnlineIds(ids));
    live.on("friends:update", (list: FriendView[]) => setFriends(list));

    live.on(
      "chat:message",
      (message: { username: string; text: string; timestamp?: string }) => {
        const timestamp = message.timestamp ?? new Date().toISOString();
        const fromSelf = message.username === authUser.displayName;
        setMessages((list) =>
          [
            ...list,
            {
              id: crypto.randomUUID(),
              username: message.username,
              text: message.text,
              timestamp,
              fromSelf,
            },
          ].slice(-80),
        );
        if (!fromSelf && !mobileChatOpenRef.current) {
          setUnreadChatCount((c) => c + 1);
        }
      },
    );

    live.on("game:invite", (invite: { from: string; roomCode: string }) => {
      setPendingInvite(invite);
      setNotice(`${invite.from} invited you to room ${invite.roomCode}.`);
      setShowLobby(true);
    });

    fetch("/api/friends", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setFriends(d.friends || []))
      .catch(() => {});

    return () => {
      live.disconnect();
      setSocket(null);
    };
  }, [authUser]);

  // Queue structured server notifications so rapid chained events never overwrite each other.
  useEffect(() => {
    const list = game.notifications ?? [];
    if (seenNotifSeq.current === null) {
      seenNotifSeq.current = game.notificationSeq ?? list[0]?.id ?? 0;
      return;
    }
    const fresh = list
      .filter((item) => item.id > (seenNotifSeq.current ?? 0))
      .sort((a, b) => a.id - b.id);
    if (fresh.length > 0) {
      seenNotifSeq.current = fresh[fresh.length - 1].id;
      setNotifQueue((prev) => [...prev, ...fresh].slice(-12));
    }
  }, [game.notifications, game.notificationSeq]);

  useEffect(() => {
    if (notifQueue.length === 0) return;
    const current = notifQueue[0];
    const dwellMs =
      notifQueue.length > 1
        ? current.cueId
          ? 3000
          : 2100
        : current.cueId
          ? 4800
          : 3500;
    const timer = window.setTimeout(() => {
      setNotifQueue((prev) => prev.slice(1));
    }, dwellMs);
    return () => window.clearTimeout(timer);
  }, [notifQueue]);

  const player = currentPlayer(game);
  const players = game.players;
  const selfMemberIndex =
    roomInfo?.started && authUser
      ? roomInfo.members.findIndex((member) => member.id === authUser.id)
      : 0;
  const selfPlayerId =
    selfMemberIndex >= 0 ? `p${selfMemberIndex}` : "p0";
  const selfPlayer =
    players.find((candidate) => candidate.id === selfPlayerId) ?? player;
  const isMyTurn = player.id === selfPlayerId;

  useEffect(() => {
    if (game.phase === "decision" && isMyTurn) {
      setSelected(null);
    }
  }, [game.phase, isMyTurn]);

  const pendingTile =
    game.phase === "decision" ? tileAt(player.position) : null;
  const selectedTile = BOARD.find((tile) => tile.id === selected);
  const displayTile =
    game.phase === "decision"
      ? isMyTurn
        ? pendingTile
        : selectedTile
      : selectedTile;

  const tileOwner = displayTile
    ? players.find((candidate) => candidate.id === game.owners[displayTile.id])
    : undefined;
  const groupMembers = displayTile?.group
    ? BOARD.filter((tile) => tile.group === displayTile.group)
    : [];
  const groupOwnerId = tileOwner?.id ?? selfPlayer.id;
  const ownedInGroup = groupMembers.filter(
    (tile) => game.owners[tile.id] === groupOwnerId,
  ).length;
  const activeRent = displayTile
    ? tileOwner
      ? rentFor(game, displayTile, tileOwner)
      : (displayTile.rent ?? 0)
    : 0;
  const developmentLevel = displayTile
    ? (game.buildings[displayTile.id] ?? 0)
    : 0;
  const canDevelop = Boolean(
    displayTile?.kind === "city" &&
      displayTile.group &&
      isMyTurn &&
      game.phase === "roll" &&
      tileOwner?.id === player.id &&
      groupComplete(game, player, displayTile.group) &&
      developmentLevel < 4,
  );
  const canAffordDevelopment = Boolean(
    canDevelop && player.cash >= (displayTile?.developmentCost ?? Infinity),
  );
  const timerText = `00:${String(secondsLeft).padStart(2, "0")}`;

  const powerEligible = new Set(
    game.phase === "power" ? powerEligibleIds(game, selfPlayerId) : [],
  );
  const powerSelected = new Set(
    game.phase === "power" ? powerSelectedIds(game, selfPlayerId) : [],
  );
  const powerFocusTile =
    game.phase === "power" && selectedTile && powerEligible.has(selectedTile.id)
      ? selectedTile
      : null;

  const [powerFlash, setPowerFlash] = useState<PowerEvent | null>(null);
  const seenPowerEvent = useRef<number | null>(null);
  const boardGridRef = useRef<HTMLDivElement | null>(null);
  const powerIdentity = game.powerInteraction
    ? `${game.powerInteraction.id}:${game.powerInteraction.step}`
    : "none";

  useEffect(() => {
    setSelected(null);
  }, [powerIdentity]);

  useEffect(() => {
    const event = game.powerEvent;
    if (!event) return;
    if (seenPowerEvent.current === null) {
      seenPowerEvent.current = event.id;
      return;
    }
    if (event.id === seenPowerEvent.current) return;
    seenPowerEvent.current = event.id;
    setPowerFlash(event);
    const timer = window.setTimeout(() => setPowerFlash(null), 4200);
    return () => window.clearTimeout(timer);
  }, [game.powerEvent]);

  const notify = (text: string) => {
    setNotice(text);
    window.setTimeout(() => setNotice(""), 3000);
  };

  const dispatchCommand = (
    payload: Record<string, unknown>,
    fallbackError = "That move could not be completed.",
  ) => {
    if (!roomInfo?.started || !socket) {
      notify("Create or join a real player table before making a move.");
      return;
    }
    if (commandBusyRef.current) return;
    commandBusyRef.current = true;
    const commandId = crypto.randomUUID();
    socket.emit(
      "game:command",
      { ...payload, commandId },
      (result: { ok: boolean; error?: string; state?: GameState }) => {
        commandBusyRef.current = false;
        if (!result.ok) {
          notify(result.error || fallbackError);
          return;
        }
        if (result.state) setGame(result.state);
      },
    );
  };

  const sendPower = (command: Record<string, unknown>) =>
    dispatchCommand(
      { ...command, interactionId: game.powerInteraction?.id },
      "That Super Power action could not be completed.",
    );

  const sendSell = (propertyId: string) =>
    dispatchCommand({ type: "SELL_PROPERTY", propertyId });

  const sendMortgage = (propertyId: string) =>
    dispatchCommand({ type: "MORTGAGE_PROPERTY", propertyId });

  const sendUnmortgage = (propertyId: string) =>
    dispatchCommand({ type: "UNMORTGAGE_PROPERTY", propertyId });

  const sendRepair = (propertyId: string) =>
    dispatchCommand({ type: "REPAIR_PROPERTY", propertyId });

  const applyCommand = (type: string, propertyId?: string) =>
    dispatchCommand({ type, propertyId, powerId: propertyId });

  const createRoom = (customSettings?: MatchSettings) => {
    if (!socket || !socket.connected) {
      notify(
        "Connecting to the live game server. Please try again in a moment.",
      );
      return;
    }
    const settingsToUse = customSettings ?? DEFAULT_PRIVATE_SETTINGS;
    socket
      .timeout(8000)
      .emit(
        "room:create",
        settingsToUse,
        (
          timeoutError: Error | null,
          r: { ok: boolean; error?: string; room?: RoomView },
        ) => {
          if (timeoutError) {
            notify(
              "The game server did not respond. Check your connection and try again.",
            );
            return;
          }
          if (!r?.ok) {
            notify(r?.error || "Could not create a room.");
            return;
          }
          setShowSettingsModal(false);
          notify(
            `Room created (${settingsToUse.maxPlayers}P · ${settingsToUse.roundLimit ?? "UNLIMITED"} rounds · $${settingsToUse.targetNetWorth.toLocaleString()} goal).`,
          );
        },
      );
  };

  const updateRoomSettings = (updated: MatchSettings) => {
    if (!socket?.connected) {
      notify("Connection lost. Reconnect first.");
      return;
    }
    socket.emit(
      "room:settings",
      updated,
      (r: { ok: boolean; error?: string }) => {
        if (!r?.ok) {
          notify(r?.error || "Could not update room settings.");
          return;
        }
        setShowSettingsModal(false);
        setEditingExistingRoomSettings(false);
        notify("Match settings updated.");
      },
    );
  };

  const copyRoomCode = async () => {
    if (!roomInfo) return;
    try {
      await navigator.clipboard.writeText(roomInfo.code);
      notify("Join code copied. Share it with your players.");
    } catch {
      notify(`Room code: ${roomInfo.code}`);
    }
  };

  const joinRoom = (codeValue = roomCodeInput) =>
    socket?.emit(
      "room:join",
      codeValue,
      (r: { ok: boolean; error?: string }) => {
        if (!r.ok) notify(r.error || "Could not join that room.");
        else {
          setRoomCodeInput("");
          setPendingInvite(null);
          notify("You joined the game lobby.");
        }
      },
    );

  const startRoom = () => {
    if (!socket?.connected) {
      notify("Live game connection lost. Reconnect before starting.");
      return;
    }
    socket
      .timeout(8000)
      .emit(
        "room:start",
        (timeoutError: Error | null, r: { ok: boolean; error?: string }) => {
          if (timeoutError) {
            notify(
              "The game server did not respond. Check your connection and try again.",
            );
            return;
          }
          if (!r?.ok) {
            notify(r?.error || "Could not start the game.");
            return;
          }
          setShowLobby(false);
          notify("The city is live!");
        },
      );
  };

  const inviteFriend = (friendId: string) => {
    if (!roomInfo) {
      notify("Create a room first, then invite your friend.");
      return;
    }
    socket?.emit(
      "room:invite",
      friendId,
      (r: { ok: boolean; error?: string }) =>
        notify(r.ok ? "Invite sent." : r.error || "Invite could not be sent."),
    );
  };

  const sendReaction = (emoji: string) => {
    if (!roomInfo?.started || !socket) return;
    socket.emit("chat:send", emoji);
  };

  const searchPeople = async (q: string) => {
    setFriendQuery(q);
    if (q.trim().length < 2) {
      setPeople([]);
      return;
    }
    try {
      const r = await fetch(`/api/people?q=${encodeURIComponent(q)}`, {
        credentials: "include",
      });
      const d = await r.json();
      setPeople(d.people || []);
    } catch {
      setPeople([]);
    }
  };

  const addFriend = async (username: string) => {
    try {
      const r = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setFriends((list) =>
        list.some((f) => f.id === d.friend.id) ? list : [...list, d.friend],
      );
      setPeople((list) =>
        list.map((p) => (p.id === d.friend.id ? { ...p, isFriend: true } : p)),
      );
      notify(`Added @${d.friend.username} to your friends.`);
    } catch (e) {
      notify(e instanceof Error ? e.message : "Could not add that player.");
    }
  };

  const logout = async () => {
    socket?.emit("room:leave");
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
    socket?.disconnect();
    setSocket(null);
    setAuthUser(null);
    setRoomInfo(null);
  };

  useEffect(() => {
    if (["decision", "power", "finished"].includes(game.phase)) {
      setCenterEvent("");
      return;
    }
    setCenterEvent(game.message);
    const timer = window.setTimeout(() => setCenterEvent(""), 3800);
    return () => window.clearTimeout(timer);
  }, [game.message, game.phase]);

  useEffect(() => {
    if (!roomInfo?.started || !roomInfo.turnDeadline) return;
    const update = () =>
      setSecondsLeft(
        Math.max(0, Math.ceil((roomInfo.turnDeadline! - Date.now()) / 1000)),
      );
    update();
    const timer = window.setInterval(update, 250);
    return () => window.clearInterval(timer);
  }, [roomInfo?.started, roomInfo?.turnDeadline]);

  const presentRoll = (next: GameState, before: number, playerId: string) => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      setRolling(false);
      setGame(next);
      return;
    }

    window.setTimeout(() => {
      const rolledPlayer = next.players.find(
        (candidate) => candidate.id === playerId,
      );
      const after = rolledPlayer?.position ?? before;
      const steps = (after - before + BOARD.length) % BOARD.length;
      setRolling(false);
      if (steps > 0 && steps <= 6) {
        setMotionActive(true);
        setMotionPosition({ [playerId]: before });
        let step = 0;
        const walker = window.setInterval(() => {
          step++;
          setMotionPosition({ [playerId]: (before + step) % BOARD.length });
          if (step >= steps) {
            window.clearInterval(walker);
            window.setTimeout(() => {
              setMotionActive(false);
              setMotionPosition({});
            }, 90);
          }
        }, 120);
      }
      setGame(next);
    }, 420);
  };

  const doRoll = (controlledValue?: number) => {
    if (
      !roomInfo?.started ||
      !socket ||
      rolling ||
      motionActive ||
      commandBusyRef.current ||
      game.phase !== "roll" ||
      !isMyTurn ||
      player.jailed
    ) {
      return;
    }
    setSelected(null);
    setRolling(true);
    commandBusyRef.current = true;
    const before = player.position;
    suppressState.current = true;
    const commandId = crypto.randomUUID();
    socket.emit(
      "game:command",
      controlledValue !== undefined
        ? { type: "ROLL", controlledValue, commandId }
        : { type: "ROLL", commandId },
      (r: { ok: boolean; error?: string; state?: GameState }) => {
        commandBusyRef.current = false;
        if (!r.ok || !r.state) {
          suppressState.current = false;
          setRolling(false);
          notify(r.error || "Could not roll.");
          return;
        }
        presentRoll(r.state, before, player.id);
      },
    );
  };

  const doBuild = (id: string) => applyCommand("BUILD", id);

  const groups = useMemo(
    () =>
      Array.from(
        new Set(
          selfPlayer.properties
            .map((id) => BOARD.find((t) => t.id === id)?.group)
            .filter(Boolean),
        ),
      ),
    [selfPlayer.properties],
  );

  if (!authUser) return <AuthView onAuthed={(user) => setAuthUser(user)} />;

  const lobbySettings = roomInfo?.settings ?? DEFAULT_PRIVATE_SETTINGS;

  if (!roomInfo?.started || !roomInfo.game) {
    return (
      <main
        className={`pregame-shell ${roomInfo && !roomInfo.started ? "has-open-code" : ""}`}
      >
        <header className="pre-header">
          <div className="brand">
            <div className="brand-mark">
              S<span>✦</span>
            </div>
            <div>
              <b>{BRAND.name}</b>
              <small>REAL PLAYERS · PRIVATE &amp; CODE TABLES</small>
            </div>
          </div>
          <div className="pre-user">
            <span
              className="player-dot"
              style={{ "--player-color": "#2ed573" } as CSSProperties}
            />
            <span>
              <b>{authUser.displayName}</b>
              <small>@{authUser.username}</small>
            </span>
            <button onClick={logout}>LOG OUT</button>
          </div>
        </header>

        <section className="pre-hero">
          <div className="pre-kicker">
            <i /> THE CITY IS OPEN
          </div>
          <h1>
            Gather your crew.
            <br />
            <em>Make your move.</em>
          </h1>
          <p>
            Configure your Private Game — choose 2–6 players, 30 / 50 /
            Unlimited rounds, and a $3,000 / $5,000 / $7,000 Net Worth Goal —
            then share the join code.
          </p>
          <div className="pre-facts">
            <span>2–6 REAL PLAYERS</span>
            <i />
            <span>36 CITY STOPS · 69 BANK CUES</span>
            <i />
            <span>CONFIGURABLE ROUNDS &amp; GOALS</span>
          </div>
        </section>

        {pendingInvite && !roomInfo && (
          <div className="pre-invite">
            <div>
              <b>{pendingInvite.from} invited you to play</b>
              <small>Private room · code {pendingInvite.roomCode}</small>
            </div>
            <button onClick={() => joinRoom(pendingInvite.roomCode)}>
              JOIN GAME <ArrowUpRight size={16} />
            </button>
          </div>
        )}

        <section className="pre-layout">
          <div className="pre-card pre-table-card">
            {roomInfo ? (
              <>
                <div className="pre-card-top">
                  <div>
                    <div className="pre-label">
                      {lobbySettings.mode} · {lobbySettings.maxPlayers} PLAYERS ·{" "}
                      {lobbySettings.roundLimit
                        ? `${lobbySettings.roundLimit} ROUNDS`
                        : "UNLIMITED ROUNDS"}{" "}
                      · ${lobbySettings.targetNetWorth.toLocaleString()} GOAL
                    </div>
                    <h2>
                      Room <strong>{roomInfo.code}</strong>
                    </h2>
                  </div>
                  <div className="pre-card-top-actions">
                    {roomInfo.hostId === authUser.id && (
                      <button
                        type="button"
                        className="pre-copy"
                        onClick={() => {
                          setEditingExistingRoomSettings(true);
                          setShowSettingsModal(true);
                        }}
                      >
                        <SlidersHorizontal size={13} /> SETTINGS
                      </button>
                    )}
                    <button
                      className="pre-copy"
                      onClick={() => void copyRoomCode()}
                    >
                      COPY CODE
                    </button>
                  </div>
                </div>
                <p className="pre-card-note">
                  Share code <b>{roomInfo.code}</b> — up to{" "}
                  <b>{lobbySettings.maxPlayers}</b> signed-in players can join
                  this table.
                </p>
                <div className="pre-seats">
                  {roomInfo.members.map((member, index) => (
                    <div className="pre-seat" key={member.id}>
                      <span
                        className="player-dot"
                        style={
                          {
                            "--player-color":
                              PLAYER_COLORS[index % PLAYER_COLORS.length],
                          } as CSSProperties
                        }
                      />
                      <b>{member.displayName}</b>
                      <small>
                        {member.id === authUser.id
                          ? "YOU"
                          : member.id === roomInfo.hostId
                            ? "HOST"
                            : "READY"}
                      </small>
                    </div>
                  ))}
                  {Array.from(
                    {
                      length: Math.max(
                        0,
                        lobbySettings.maxPlayers - roomInfo.members.length,
                      ),
                    },
                    (_, i) => (
                      <div className="pre-seat pre-open-seat" key={`open-${i}`}>
                        <span>+</span>
                        <b>Open seat</b>
                        <small>SHARE CODE</small>
                      </div>
                    ),
                  )}
                </div>
                <div className="pre-table-actions">
                  <button
                    className="pre-primary"
                    disabled={roomInfo.hostId !== authUser.id}
                    onClick={startRoom}
                  >
                    {roomInfo.hostId !== authUser.id
                      ? "WAITING FOR HOST"
                      : "START GAME"}{" "}
                    <ArrowUpRight size={17} />
                  </button>
                  <button
                    className="pre-secondary"
                    onClick={() => {
                      socket?.emit("room:leave");
                      setRoomInfo(null);
                      notify("You left the room.");
                    }}
                  >
                    LEAVE TABLE
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="pre-label">START PLAYING</div>
                <h2>Host a private game.</h2>
                <p className="pre-card-note">
                  Choose player count, round limit, and net worth goal — or enter
                  a 6-character code shared by a friend.
                </p>
                <button
                  className="pre-primary pre-create"
                  onClick={() => {
                    setEditingExistingRoomSettings(false);
                    setShowSettingsModal(true);
                  }}
                >
                  <span className="pre-action-symbol">⚙</span>
                  <span>
                    <b>CREATE PRIVATE GAME</b>
                    <small>
                      Configure players, rounds &amp; net worth goal
                    </small>
                  </span>
                  <ArrowUpRight size={18} />
                </button>
                <div className="pre-or">
                  <span /> OR JOIN A TABLE <span />
                </div>
                <form
                  className="pre-join"
                  onSubmit={(e) => {
                    e.preventDefault();
                    joinRoom();
                  }}
                >
                  <input
                    aria-label="Room code"
                    value={roomCodeInput}
                    onChange={(e) =>
                      setRoomCodeInput(
                        e.target.value.toUpperCase().slice(0, 6),
                      )
                    }
                    placeholder="ENTER 6-CHARACTER CODE"
                    maxLength={6}
                  />
                  <button disabled={roomCodeInput.length !== 6}>JOIN</button>
                </form>
              </>
            )}
          </div>

          <div className="pre-card pre-friends-card">
            <div className="pre-card-top">
              <div>
                <div className="pre-label">YOUR CREW</div>
                <h2>
                  Friends <strong>{friends.length}</strong>
                </h2>
              </div>
              <div className="pre-online">
                <i />{" "}
                {
                  friends.filter((f) => onlineIds.includes(f.id) || f.online)
                    .length
                }{" "}
                ONLINE
              </div>
            </div>
            <form
              className="pre-search"
              onSubmit={(e) => {
                e.preventDefault();
                addFriend(friendQuery);
              }}
            >
              <input
                value={friendQuery}
                onChange={(e) => void searchPeople(e.target.value)}
                placeholder="Find a friend by username"
              />
              <button disabled={friendQuery.trim().length < 3}>ADD</button>
            </form>
            {people
              .filter((p) => !p.isFriend)
              .map((person) => (
                <div className="pre-friend" key={person.id}>
                  <span
                    className={`friend-dot ${person.online || onlineIds.includes(person.id) ? "online" : ""}`}
                  />
                  <span>
                    <b>@{person.username}</b>
                    <small>
                      {person.online || onlineIds.includes(person.id)
                        ? "ONLINE"
                        : "PLAYER"}
                    </small>
                  </span>
                  {roomInfo && (
                    <button
                      disabled={
                        !person.online && !onlineIds.includes(person.id)
                      }
                      onClick={() => inviteFriend(person.id)}
                    >
                      INVITE
                    </button>
                  )}
                </div>
              ))}
            {friends.length === 0 && !people.length ? (
              <div className="pre-empty">
                No friends yet. Search a username to add someone; demo accounts
                are mutual friends in development.
              </div>
            ) : (
              friends.map((friend) => {
                const online = onlineIds.includes(friend.id) || friend.online;
                return (
                  <div className="pre-friend" key={friend.id}>
                    <span className={`friend-dot ${online ? "online" : ""}`} />
                    <span>
                      <b>{friend.displayName}</b>
                      <small>
                        @{friend.username} · {online ? "ONLINE" : "OFFLINE"}
                      </small>
                    </span>
                    {roomInfo && (
                      <button
                        disabled={!online}
                        onClick={() => inviteFriend(friend.id)}
                      >
                        {online ? "INVITE" : "OFFLINE"}
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>

        {notice && (
          <div className="toast" role="status">
            {notice}
          </div>
        )}

        {roomInfo && !roomInfo.started && (
          <button
            className="room-code-dock"
            onClick={() => void copyRoomCode()}
            aria-label={`Copy join code ${roomInfo.code}`}
          >
            <span>
              JOIN CODE · {roomInfo.members.length}/{lobbySettings.maxPlayers}{" "}
              SEATS
            </span>
            <b>{roomInfo.code}</b>
            <small>
              {roomInfo.members.length >= lobbySettings.maxPlayers
                ? "TABLE FULL · READY TO START"
                : `GOAL $${lobbySettings.targetNetWorth.toLocaleString()} · ${lobbySettings.roundLimit ?? "UNLIMITED"} ROUNDS`}
            </small>
            <i>
              <ArrowUpRight size={16} />
            </i>
          </button>
        )}

        {showSettingsModal && (
          <PrivateSettingsModal
            initialSettings={
              editingExistingRoomSettings && roomInfo?.settings
                ? roomInfo.settings
                : DEFAULT_PRIVATE_SETTINGS
            }
            minPlayers={
              editingExistingRoomSettings
                ? Math.max(2, roomInfo?.members.length ?? 2)
                : 2
            }
            submitLabel={editingExistingRoomSettings ? "SAVE" : "NEXT"}
            onClose={() => {
              setShowSettingsModal(false);
              setEditingExistingRoomSettings(false);
            }}
            onConfirm={(chosen) =>
              editingExistingRoomSettings
                ? updateRoomSettings(chosen)
                : createRoom(chosen)
            }
          />
        )}

        <footer className="pre-footer">
          <span>SCAM CITY · SOCIAL STRATEGY GAME</span>
          <span>NO NPCs · REAL FRIENDS · ONE CITY</span>
        </footer>
      </main>
    );
  }

  const targetNetWorth =
    game.settings?.targetNetWorth ?? RULES.victory.targetNetWorth;
  const roundLimit =
    game.settings !== undefined
      ? game.settings.roundLimit
      : RULES.victory.roundLimit;
  const connectedIds = new Set(roomInfo.connectedUserIds ?? onlineIds);
  const latestChatMessage = messages[messages.length - 1];

  return (
    <main className="app-shell">
      <header className="topbar">
        <button
          className="game-back"
          type="button"
          aria-label="Open room and friends"
          onClick={() => setShowLobby(true)}
        >
          <ArrowLeft size={20} />
        </button>
        <div className="brand">
          <div className="brand-mark">
            S<span>✦</span>
          </div>
          <div>
            <b>{BRAND.name}</b>
            <small>TRUST NOBODY · OWN THE BLOCK</small>
          </div>
        </div>
        <div className="top-center">
          <span className="live-dot" /> LIVE MATCH{" "}
          <span className="room-code">
            ROOM · {roomInfo.code} ·{" "}
            {roundLimit ? `${roundLimit}R` : "UNLIMITED"} · {fmt(targetNetWorth)}
          </span>
        </div>
        <div className="header-right">
          <button
            className="icon-button"
            aria-label="Open room & settings"
            onClick={() => setShowLobby(true)}
          >
            <Bell size={18} />
            <i />
          </button>
          <button className="profile-chip" onClick={() => setShowLobby(true)}>
            <span className="you-avatar">
              <i
                className="player-dot"
                style={
                  {
                    "--player-color": selfPlayer?.avatar || "#ff4757",
                  } as CSSProperties
                }
                aria-hidden="true"
              >
                {playerInitials(authUser.displayName)}
              </i>
            </span>
            <span>
              <b>{authUser.displayName}</b>
              <small>@{authUser.username}</small>
            </span>
            <ChevronDown size={15} />
          </button>
          <button
            className="menu-btn"
            aria-label="Open room and friends"
            onClick={() => setShowLobby(true)}
          >
            <MoreHorizontal />
          </button>
        </div>
      </header>

      <section className="game-heading">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" /> LIVE MATCH ·{" "}
            {players.filter((p) => !isEliminated(p)).length}/{players.length}{" "}
            STANDING
          </div>
          <h1>
            Make your <em>next move.</em>
          </h1>
          <p>Build your empire, manage leverage, and watch for Bombs.</p>
        </div>
        <div className="goal-card">
          <div className="goal-icon">
            <Trophy size={19} />
          </div>
          <div className="goal-copy">
            <small>
              ROUND {game.round}
              {roundLimit !== null
                ? ` OF ${roundLimit} (${Math.max(0, roundLimit - game.round + 1)} LEFT)`
                : " · UNLIMITED ROUNDS"}
            </small>
            <b>
              {fmt(targetNetWorth)} <span>goal</span>
            </b>
            <div className="goal-track">
              <i
                style={{
                  width: `${Math.max(0, Math.min(100, (netWorth(game, selfPlayer) / targetNetWorth) * 100))}%`,
                }}
              />
            </div>
          </div>
          <button
            className="more-btn"
            onClick={() => setShowLobby(true)}
            aria-label="Room info"
          >
            <MoreHorizontal />
          </button>
        </div>
      </section>

      {/* Mobile Region 1 (~10% dvh): Full 2–6 Player Roster with Cash, Net Worth & Status */}
      <section
        className={`mobile-top-roster players-count-${players.length}`}
        aria-label="Players and standings"
      >
        <div className="mobile-roster-cards">
          {players.map((p, index) => {
            const active = game.players[game.turn]?.id === p.id && game.phase !== "finished";
            const member = roomInfo.members[index];
            const offline = member ? !connectedIds.has(member.id) : false;
            const eliminated = isEliminated(p);
            const rentFreeLeft = game.rentFree?.[p.id]?.remainingCircuits ?? 0;
            const pNetWorth = netWorth(game, p);

            return (
              <div
                key={p.id}
                className={`roster-player-card ${active ? "is-active-turn" : ""} ${eliminated ? "is-eliminated" : ""}`}
                style={{ "--p-color": p.avatar } as CSSProperties}
              >
                <div className="rpc-head">
                  <span className="rpc-avatar" aria-hidden="true">
                    {playerInitials(p.name)}
                  </span>
                  <span className="rpc-name">
                    {p.name}
                    {p.id === selfPlayerId ? " · YOU" : ""}
                  </span>
                  {active && (
                    <span className="rpc-turn-badge">TURN {secondsLeft}s</span>
                  )}
                </div>
                <div className="rpc-stats">
                  <span className={p.cash < 0 ? "is-negative" : ""}>
                    <small>CASH</small>
                    <b>{fmt(p.cash)}</b>
                  </span>
                  <span>
                    <small>NW</small>
                    <b>{fmt(pNetWorth)}</b>
                  </span>
                </div>
                {(p.jailed ||
                  rentFreeLeft > 0 ||
                  (p.controlledRolls ?? 0) > 0 ||
                  offline ||
                  eliminated) && (
                  <div className="rpc-badges">
                    {eliminated && (
                      <em className="badge-out">{p.status}</em>
                    )}
                    {!eliminated && p.jailed && (
                      <em className="badge-jail">JAIL</em>
                    )}
                    {!eliminated && rentFreeLeft > 0 && (
                      <em className="badge-free">FREE×{rentFreeLeft}</em>
                    )}
                    {!eliminated && (p.controlledRolls ?? 0) > 0 && (
                      <em className="badge-dice">DICE×{p.controlledRolls}</em>
                    )}
                    {!eliminated && offline && (
                      <em className="badge-offline">OFFLINE</em>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <button
          type="button"
          className="mobile-menu-trigger"
          onClick={() => setShowLobby(true)}
          aria-label="Room settings and friends"
        >
          <MoreHorizontal size={16} />
          <small>{roomInfo.code}</small>
        </button>
      </section>

      <div className="main-grid">
        <section className="board-column">
          <div className="board-meta">
            <div className="turn-tag">
              <span className="turn-pulse" />{" "}
              {game.phase === "roll"
                ? isMyTurn
                  ? player.jailed
                    ? "JAIL TURN · PAY BAIL OR SERVE 1 TURN"
                    : game.lastRoll === 6
                      ? "BONUS ROLL · YOUR TURN"
                      : "YOUR TURN · ROLL OR MANAGE ASSETS"
                  : `${player.name.toUpperCase()}'S TURN`
                : game.phase === "power"
                  ? `SUPER POWER · ${powerName(game.powerInteraction?.kind ?? null)}`
                  : game.phase === "decision"
                    ? isMyTurn
                      ? "PROPERTY CHOICE · BUY OR PASS"
                      : `${player.name.toUpperCase()} IS DECIDING`
                    : "GAME FINISHED"}
            </div>
            <div className="turn-timer">
              <span className="timer-icon">◷</span> {timerText}{" "}
              <span className="meta-divider" />{" "}
              <button onClick={() => setShowLobby(true)}>
                <Settings2 size={15} /> Room
              </button>
            </div>
          </div>

          {/* Mobile Region 2 (~80% dvh) & Desktop Square Board */}
          <div className="board-wrap">
            <div className="board-grid" ref={boardGridRef}>
              {BOARD.map((tile, i) => {
                const owner = players.find(
                  (p) => p.id === game.owners[tile.id],
                );
                const tokenPlayers = players.filter(
                  (p) =>
                    !isEliminated(p) &&
                    (motionPosition[p.id] ?? p.position) === i,
                );
                const pos = tilePos(i);
                const price = tile.price;
                const isTileMortgaged = Boolean(game.mortgaged?.[tile.id]);
                const isTileBombed = (game.bombs ?? []).some(
                  (b) => b.propertyId === tile.id,
                );
                const strip = tileStrip(
                  tile,
                  owner?.id,
                  owner ? currentRent(game, tile.id) : 0,
                );
                const buildLvl = game.buildings[tile.id] ?? 0;

                return (
                  <button
                    data-tile-id={tile.id}
                    className={`tile tile-${tile.kind} ${strip ? "has-value-strip" : ""} ${selected === tile.id ? "tile-selected" : ""} ${game.lastLanding?.tileId === tile.id ? "tile-landed" : ""} ${owner ? "tile-owned" : ""} ${isTileMortgaged ? "tile-mortgaged" : ""} ${isTileBombed ? "tile-bombed" : ""} ${displayTile?.group && displayTile.group === tile.group ? "tile-group-highlight" : ""} ${tokenPlayers.length ? "has-token" : ""} ${powerEligible.has(tile.id) ? "tile-power-eligible" : ""} ${powerSelected.has(tile.id) ? "tile-power-selected" : ""}`}
                    aria-label={`${tile.name}${price ? `, value ${fmt(price)}` : ""}${owner ? `, owned by ${owner.name}, rent ${fmt(currentRent(game, tile.id))}` : ""}${isTileMortgaged ? ", mortgaged" : ""}${isTileBombed ? ", bombed" : ""}`}
                    title={`${tile.name}${price ? ` · ${fmt(price)}` : ""}${owner ? ` · Owned by ${owner.name}` : ""}`}
                    style={
                      {
                        ...pos,
                        "--tile-color": tile.tone ?? "#516575",
                        "--owner-color": owner?.avatar ?? "transparent",
                      } as CSSProperties
                    }
                    key={`${tile.id}-${i}`}
                    onClick={() => {
                      if (game.phase === "decision" && isMyTurn) return;
                      if (game.phase === "power") {
                        if (powerEligible.has(tile.id)) setSelected(tile.id);
                        else if (propertyLike(tile)) {
                          notify(
                            "That property is not eligible for this Super Power step.",
                          );
                        }
                        return;
                      }
                      setSelected((prev) =>
                        prev === tile.id ? null : tile.id,
                      );
                    }}
                  >
                    {/* Distinct group colour identity bar (always visible on properties) */}
                    <span className="tile-color" />

                    {/* Top value / owner rent strip */}
                    {strip && (
                      <span
                        className={`tile-value-strip ${strip.mode === "rent" ? "is-owned" : "is-price"}`}
                        style={
                          strip.mode === "rent"
                            ? { background: owner?.avatar }
                            : undefined
                        }
                        data-strip={strip.mode}
                      >
                        {strip.mode === "rent" && owner && (
                          <em className="tile-owner-tag">
                            {playerInitials(owner.name)}
                          </em>
                        )}
                        <span>
                          {isTileMortgaged ? "MORT" : fmt(strip.amount)}
                        </span>
                      </span>
                    )}

                    {tile.kind === "start" ? (
                      <span className="tile-icon start-icon">GO</span>
                    ) : !propertyLike(tile) ? (
                      <span className="tile-icon">
                        {tile.kind === "bank"
                          ? "🏦"
                          : tile.kind === "power"
                            ? "⚡"
                            : tile.kind === "jail"
                              ? "⛓"
                              : tile.kind === "tax"
                                ? "$50"
                                : ""}
                      </span>
                    ) : null}

                    <span className="tile-name">{tile.name}</span>

                    {(buildLvl > 0 || isTileBombed || isTileMortgaged) && (
                      <span className="tile-status-badges">
                        {buildLvl > 0 && (
                          <span className="tile-level">
                            {buildLvl === 4 ? "♜TWR" : `⌂H${buildLvl}`}
                          </span>
                        )}
                        {isTileBombed && (
                          <span className="tile-bomb-badge" title="Bombed">
                            ✹
                          </span>
                        )}
                        {isTileMortgaged && (
                          <span className="tile-mort-badge" title="Mortgaged">
                            M
                          </span>
                        )}
                      </span>
                    )}

                    {tokenPlayers.length > 0 && (
                      <span className="token-stack">
                        {tokenPlayers.map((p) => (
                          <i
                            className="player-dot token-pip"
                            key={p.id}
                            style={
                              { "--player-color": p.avatar } as CSSProperties
                            }
                            title={p.name}
                          >
                            {p.name.slice(0, 1).toUpperCase()}
                          </i>
                        ))}
                      </span>
                    )}
                  </button>
                );
              })}

              {powerFlash?.kind === "bomb" && (
                <MissileOverlay event={powerFlash} gridRef={boardGridRef} />
              )}

              <BoardCenter
                game={game}
                player={player}
                isMyTurn={isMyTurn}
                viewerId={selfPlayerId}
                focusTile={powerFocusTile}
                flash={powerFlash}
                pendingTile={pendingTile}
                displayTile={displayTile ?? null}
                tileOwner={tileOwner}
                ownedInGroup={ownedInGroup}
                groupSize={groupMembers.length}
                activeRent={activeRent}
                developmentLevel={developmentLevel}
                canDevelop={canDevelop}
                canAffordDevelopment={canAffordDevelopment}
                timerText={timerText}
                eventText={centerEvent}
                activeNotification={notifQueue[0] ?? null}
                queuedNotificationCount={Math.max(0, notifQueue.length - 1)}
                onDismissNotification={() =>
                  setNotifQueue((prev) => prev.slice(1))
                }
                rolling={rolling}
                motionActive={motionActive}
                onRoll={doRoll}
                onPayBail={() => dispatchCommand({ type: "JAIL_PAY_BAIL" })}
                onSkipJail={() => dispatchCommand({ type: "JAIL_SKIP_TURN" })}
                onBuy={() => applyCommand("BUY_PROPERTY")}
                onPass={() => applyCommand("PASS_PROPERTY")}
                onBuild={doBuild}
                onChoosePower={(powerId) =>
                  sendPower({ type: "CHOOSE_POWER", powerId })
                }
                onPassPower={() => sendPower({ type: "POWER_CANCEL" })}
                onPowerSelect={(propertyId) =>
                  sendPower({ type: "POWER_SELECT", propertyId })
                }
                onPowerConfirm={() => sendPower({ type: "POWER_CONFIRM" })}
                onPowerDecline={() => sendPower({ type: "POWER_DECLINE" })}
                onPowerCancel={() => sendPower({ type: "POWER_CANCEL" })}
                sellReason={(propertyId) =>
                  sellBlockReason(game, selfPlayerId, propertyId)
                }
                onSell={sendSell}
                onMortgage={sendMortgage}
                onUnmortgage={sendUnmortgage}
                onRepair={sendRepair}
                onQuickReaction={sendReaction}
                onCloseTile={() => setSelected(null)}
              />
            </div>
          </div>

          <div className="board-foot">
            <span>
              <i className="legend-dot owned" /> Owner badge + rent strip
            </span>
            <span>
              <i className="legend-dot available" /> Group colour + buy price
            </span>
            <span>
              <i className="legend-dot special" /> 69 Bank cues &amp; 4 Powers
            </span>
            <span className="foot-help">
              <CircleHelp size={14} /> Tap any tile to inspect or manage
            </span>
          </div>
        </section>

        <aside className="side-column">
          <section className="players-card">
            <div className="section-head">
              <div>
                <div className="eyebrow">AT THIS TABLE</div>
                <h2>
                  Players{" "}
                  <span>
                    {players.length}/{game.settings?.maxPlayers ?? 6}
                  </span>
                </h2>
              </div>
              <button
                className="round-add"
                onClick={() => setShowLobby(true)}
                aria-label="Open room modal"
              >
                <Plus size={17} />
              </button>
            </div>
            {players.map((p, i) => {
              const active =
                game.players[game.turn]?.id === p.id &&
                game.phase !== "finished";
              const member = roomInfo.members[i];
              const offline = member ? !connectedIds.has(member.id) : false;
              const eliminated = isEliminated(p);
              const rentFreeLeft =
                game.rentFree?.[p.id]?.remainingCircuits ?? 0;

              return (
                <div
                  className={`player-row ${active ? "active-player" : ""} ${eliminated ? "eliminated-player" : ""}`}
                  key={p.id}
                >
                  <div className={`player-avatar av-${i}`}>
                    <i
                      className="player-dot"
                      style={{ "--player-color": p.avatar } as CSSProperties}
                      aria-hidden="true"
                    >
                      {playerInitials(p.name)}
                    </i>
                    {active && <i />}
                  </div>
                  <div className="player-main">
                    <div className="player-name">
                      {p.name}
                      {p.id === selfPlayerId && (
                        <span className="you-tag">YOU</span>
                      )}
                      {eliminated && (
                        <span className="status-tag tag-out">{p.status}</span>
                      )}
                      {!eliminated && p.jailed && (
                        <span className="status-tag tag-jail">JAIL</span>
                      )}
                      {!eliminated && rentFreeLeft > 0 && (
                        <span className="status-tag tag-free">
                          FREE×{rentFreeLeft}
                        </span>
                      )}
                      {!eliminated && (p.controlledRolls ?? 0) > 0 && (
                        <span className="status-tag tag-dice">
                          DICE×{p.controlledRolls}
                        </span>
                      )}
                      {!eliminated && offline && (
                        <span className="status-tag tag-offline">OFFLINE</span>
                      )}
                    </div>
                    <div className="player-sub">
                      {p.properties.length} properties <span>·</span>{" "}
                      {p.missedTurns > 0
                        ? `${p.missedTurns} missed turn${p.missedTurns > 1 ? "s" : ""}`
                        : p.properties.length > 0
                          ? "building portfolio"
                          : "liquid"}
                    </div>
                    {active && (
                      <div className="player-clock">
                        <i
                          style={{
                            width: `${Math.min(100, (secondsLeft / (game.phase === "power" ? (game.powerInteraction?.kind === "auction" ? RULES.timing.auctionSeconds : game.powerInteraction?.kind === null || !game.powerInteraction ? RULES.timing.powerSeconds : RULES.timing.powerActionSeconds) : game.phase === "decision" ? RULES.timing.propertySeconds : RULES.timing.turnSeconds)) * 100)}%`,
                          }}
                        />
                        <small>{timerText}</small>
                      </div>
                    )}
                  </div>
                  <div className="player-cash">
                    <b className={p.cash < 0 ? "cash-negative" : ""}>
                      {fmt(p.cash)}
                    </b>
                    <small>NW {fmt(netWorth(game, p))}</small>
                  </div>
                </div>
              );
            })}
            <button className="invite-btn" onClick={() => setShowLobby(true)}>
              <Plus size={16} /> ROOM &amp; INVITES <span>↗</span>
            </button>
          </section>

          <section className="portfolio-card">
            <div className="section-head">
              <div>
                <div className="eyebrow">YOUR PORTFOLIO</div>
                <h2>Assets</h2>
              </div>
              <span className="portfolio-count">
                {selfPlayer.properties.length} OWNED
              </span>
            </div>
            {selfPlayer.properties.length === 0 ? (
              <div className="empty-portfolio">
                <div className="empty-icon">⌂</div>
                <b>No properties yet.</b>
                <span>Land on an unowned property to acquire it.</span>
              </div>
            ) : (
              <div className="asset-list">
                {selfPlayer.properties.map((id) => {
                  const t = BOARD.find((x) => x.id === id)!;
                  const mort = Boolean(game.mortgaged?.[id]);
                  const bombed = (game.bombs ?? []).some(
                    (b) => b.propertyId === id,
                  );
                  return (
                    <div
                      className="asset-row"
                      key={id}
                      onClick={() => setSelected(id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") setSelected(id);
                      }}
                    >
                      <i style={{ background: t.tone }} />
                      <span>
                        <b>{t.name}</b>
                        <small>
                          Rent {mort ? "$0 (MORT)" : fmt(currentRent(game, id))}
                          {game.buildings[id]
                            ? ` · ${RULES.development.levels[game.buildings[id] - 1]}`
                            : ""}
                          {bombed ? " · BOMBED" : ""}
                        </small>
                      </span>
                      <b>{fmt(t.sellValue || 0)}</b>
                    </div>
                  );
                })}
              </div>
            )}
            {groups.length > 0 && (
              <div className="set-bonus">
                <Sparkles size={14} /> Click any asset above to build, mortgage,
                repair, or sell.
              </div>
            )}
          </section>

          <section className="feed-card">
            <div className="feed-head">
              <div>
                <div className="eyebrow">AROUND THE TABLE</div>
                <h2>
                  Table talk{" "}
                  <span className="online-count">
                    ● {connectedIds.size} online
                  </span>
                </h2>
              </div>
            </div>
            <ChatMessageList messages={messages} />
            <form
              className="chat-compose"
              onSubmit={(e) => {
                e.preventDefault();
                if (chat.trim() && roomInfo?.started) {
                  socket?.emit(
                    "chat:send",
                    chat.trim(),
                    (r: { ok: boolean; error?: string }) => {
                      if (!r.ok) notify(r.error || "Message not sent.");
                    },
                  );
                  setChat("");
                }
              }}
            >
              <input
                value={chat}
                onChange={(e) => setChat(e.target.value)}
                placeholder="Message your table…"
                aria-label="Message your table"
                enterKeyHint="send"
              />
              <button aria-label="Send message">
                <ArrowUpRight size={17} />
              </button>
            </form>
            <div className="reaction-row">
              {["😂", "😭", "🔥", "🤝", "😈"].map((x) => (
                <button key={x} type="button" onClick={() => sendReaction(x)}>
                  {x}
                </button>
              ))}
            </div>
          </section>
        </aside>
      </div>

      {/* Mobile Region 3 (~10% dvh): Primary Contextual Action + Compact Collapsible Chat Launcher */}
      <footer
        className="mobile-bottom-region"
        role="region"
        aria-label="Match controls and chat launcher"
      >
        <div className="mobile-primary-control">
          {game.phase === "roll" && isMyTurn && !player.jailed ? (
            <button
              type="button"
              className="mbr-action-btn mbr-roll"
              disabled={rolling || motionActive}
              onClick={() => doRoll()}
            >
              <Dices size={17} />
              <span>
                {rolling
                  ? "ROLLING…"
                  : game.lastRoll === 6
                    ? "ROLL AGAIN"
                    : "ROLL DICE"}
              </span>
            </button>
          ) : game.phase === "roll" && isMyTurn && player.jailed ? (
            <div className="mbr-inline-pair">
              <button
                type="button"
                className="mbr-action-btn mbr-secondary"
                onClick={() => dispatchCommand({ type: "JAIL_SKIP_TURN" })}
              >
                SKIP
              </button>
              <button
                type="button"
                className="mbr-action-btn mbr-roll"
                disabled={player.cash < RULES.jail.bailCost}
                onClick={() => dispatchCommand({ type: "JAIL_PAY_BAIL" })}
              >
                BAIL {fmt(RULES.jail.bailCost)}
              </button>
            </div>
          ) : game.phase === "decision" && isMyTurn && pendingTile ? (
            <div className="mbr-inline-pair">
              <button
                type="button"
                className="mbr-action-btn mbr-secondary"
                onClick={() => applyCommand("PASS_PROPERTY")}
              >
                PASS
              </button>
              <button
                type="button"
                className="mbr-action-btn mbr-buy"
                disabled={player.cash < (pendingTile.price ?? Infinity)}
                onClick={() => applyCommand("BUY_PROPERTY")}
              >
                BUY {fmt(pendingTile.price ?? 0)}
              </button>
            </div>
          ) : (
            <div className="mbr-turn-summary">
              <span
                className="mbr-dot"
                style={{ background: player.avatar }}
              />
              <div>
                <b>
                  {isMyTurn
                    ? "RESOLVE POWER ABOVE"
                    : `${player.name.toUpperCase()}'S TURN`}
                </b>
                <small>
                  {timerText} · {selfPlayer.properties.length} owned
                </small>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          className={`mobile-chat-launcher ${unreadChatCount > 0 ? "has-unread" : ""}`}
          onClick={() => setMobileChatOpen((open) => !open)}
          aria-expanded={mobileChatOpen}
          aria-label="Toggle table chat"
        >
          <MessageSquare size={16} />
          <span className="mcl-copy">
            <b>CHAT</b>
            <small>
              {latestChatMessage
                ? `${latestChatMessage.username}: ${latestChatMessage.text}`
                : "Say hello…"}
            </small>
          </span>
          {unreadChatCount > 0 && (
            <em className="mcl-badge">{unreadChatCount}</em>
          )}
        </button>
      </footer>

      {mobileChatOpen && (
        <div
          className="mobile-chat-scrim"
          onClick={() => setMobileChatOpen(false)}
        >
          <section
            className="mobile-chat-drawer"
            role="dialog"
            aria-label="Game chat"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="mcd-head">
              <div>
                <b>TABLE CHAT</b>
                <small>● {connectedIds.size} online</small>
              </div>
              <div className="mcd-reactions">
                {["😂", "🔥", "🤝", "👀", "😈"].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => sendReaction(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="mcd-close"
                onClick={() => setMobileChatOpen(false)}
                aria-label="Collapse chat"
              >
                <X size={18} />
              </button>
            </header>
            <ChatMessageList messages={messages} />
            <form
              className="mobile-chat-bar"
              onSubmit={(e) => {
                e.preventDefault();
                if (chat.trim() && roomInfo?.started) {
                  socket?.emit(
                    "chat:send",
                    chat.trim(),
                    (r: { ok: boolean; error?: string }) => {
                      if (!r.ok) notify(r.error || "Message not sent.");
                    },
                  );
                  setChat("");
                }
              }}
            >
              <input
                value={chat}
                onChange={(e) => setChat(e.target.value)}
                placeholder="Message your table…"
                aria-label="Message your table"
                enterKeyHint="send"
              />
              <button aria-label="Send chat message">
                <ArrowUpRight size={19} />
              </button>
            </form>
          </section>
        </div>
      )}

      {notice && (
        <div
          className={`toast ${/rent|paid|collected|cash/i.test(notice) ? "toast-money" : ""}`}
          role="status"
          aria-live="polite"
        >
          <Sparkles size={16} />
          <span>{notice}</span>
        </div>
      )}

      {showLobby && (
        <div className="modal-scrim" onClick={() => setShowLobby(false)}>
          <section
            className="friend-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="friend-sheet-head">
              <div>
                <div className="eyebrow">SCAM CITY ROOM</div>
                <h2>Match &amp; Friends</h2>
              </div>
              <button
                className="close-sheet"
                onClick={() => setShowLobby(false)}
              >
                <X size={18} />
              </button>
            </header>
            <div className="room-panel">
              <div className="room-code-label">
                ROOM <b>{roomInfo.code}</b> ·{" "}
                {roundLimit ? `${roundLimit} ROUNDS` : "UNLIMITED"} · GOAL{" "}
                {fmt(targetNetWorth)}
                <button onClick={() => void copyRoomCode()}>COPY</button>
              </div>
              <div className="room-member-list">
                {roomInfo.members.map((member, index) => (
                  <div className="room-member" key={member.id}>
                    <i
                      className="friend-dot"
                      style={
                        {
                          "--dot-color":
                            PLAYER_COLORS[index % PLAYER_COLORS.length],
                        } as CSSProperties
                      }
                    />
                    <span>
                      {member.displayName}
                      {member.id === authUser.id ? " (you)" : ""}
                    </span>
                    <small>
                      {member.id === roomInfo.hostId ? "HOST · " : ""}
                      {connectedIds.has(member.id) ? "ONLINE" : "OFFLINE"}
                    </small>
                  </div>
                ))}
              </div>
              <div className="room-live">
                <i /> LIVE SYNC · 3 missed turns forfeits &amp; returns assets
              </div>
              {!isEliminated(selfPlayer) && game.phase !== "finished" && (
                <button
                  type="button"
                  className="leave-room"
                  onClick={() => {
                    dispatchCommand({ type: "FORFEIT_SELF" });
                    setShowLobby(false);
                  }}
                >
                  FORFEIT MATCH &amp; RETURN ASSETS
                </button>
              )}
            </div>

            <div className="friend-list">
              <div className="friend-section-title">
                YOUR FRIENDS{" "}
                <span>
                  {
                    friends.filter((f) => onlineIds.includes(f.id) || f.online)
                      .length
                  }{" "}
                  ONLINE
                </span>
              </div>
              {friends.length === 0 ? (
                <div className="friends-empty">
                  No friends yet. Add friends from the pre-game lobby.
                </div>
              ) : (
                friends.map((friend) => {
                  const online = onlineIds.includes(friend.id) || friend.online;
                  return (
                    <div className="friend-row" key={friend.id}>
                      <i className={`friend-dot ${online ? "online" : ""}`} />
                      <span>
                        <b>{friend.displayName}</b>
                        <small>
                          @{friend.username} · {online ? "ONLINE" : "OFFLINE"}
                        </small>
                      </span>
                      <button
                        disabled={!online}
                        onClick={() => inviteFriend(friend.id)}
                      >
                        INVITE
                      </button>
                    </div>
                  );
                })
              )}
            </div>
            <button className="logout-link" onClick={logout}>
              LOG OUT OF @{authUser.username}
            </button>
          </section>
        </div>
      )}

      {game.phase === "finished" && (
        <div className="modal-scrim end-scrim">
          <section className="end-sheet">
            <div className="end-kicker">
              <Crown size={16} /> SCAM CITY ·{" "}
              {game.victoryReason === "LAST_STANDING"
                ? "LAST PLAYER STANDING"
                : game.victoryReason === "ROUND_LIMIT"
                  ? `${roundLimit} ROUNDS COMPLETE`
                  : `${fmt(targetNetWorth)} GOAL REACHED`}
            </div>
            <div className="winner-avatar">
              <i
                className="player-dot"
                style={
                  {
                    "--player-color":
                      game.players.find((p) => p.id === game.winner)?.avatar ||
                      "#ffab00",
                  } as CSSProperties
                }
              />
            </div>
            <h2>
              {game.players.find((p) => p.id === game.winner)?.name}{" "}
              <em>won.</em>
            </h2>
            <p>
              {game.victoryReason === "LAST_STANDING"
                ? "Outlasted every rival in Scam City."
                : game.victoryReason === "ROUND_LIMIT"
                  ? "Finished at the top of the net-worth table."
                  : "Hit the target net worth first."}
            </p>
            <div className="final-rankings">
              {[...game.players]
                .sort((a, b) => {
                  const aOut = isEliminated(a) ? 1 : 0;
                  const bOut = isEliminated(b) ? 1 : 0;
                  if (aOut !== bOut) return aOut - bOut;
                  return (
                    netWorth(game, b) - netWorth(game, a) || b.cash - a.cash
                  );
                })
                .map((p, i) => (
                  <div
                    className={`rank-row ${p.id === game.winner ? "winner-row" : ""}`}
                    key={p.id}
                  >
                    <span className="rank-number">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="rank-avatar">
                      <i
                        className="player-dot"
                        style={{ "--player-color": p.avatar } as CSSProperties}
                      />
                    </span>
                    <b>
                      {p.name}
                      {isEliminated(p) ? ` (${p.status})` : ""}
                    </b>
                    <strong>
                      {fmt(netWorth(game, p))} <small>({fmt(p.cash)})</small>
                    </strong>
                  </div>
                ))}
            </div>
            <div className="xp-note">
              <Sparkles size={15} /> REMATCH KEEPS{" "}
              {game.settings?.maxPlayers ?? players.length}P ·{" "}
              {roundLimit ? `${roundLimit}R` : "UNLIMITED"} ·{" "}
              {fmt(targetNetWorth)}
            </div>
            <button
              className="sheet-primary rematch-button"
              disabled={!!roomInfo?.started && roomInfo.hostId !== authUser.id}
              onClick={() =>
                socket?.emit(
                  "room:rematch",
                  (r: { ok: boolean; error?: string }) => {
                    if (!r.ok) notify(r.error || "Rematch could not start.");
                    else notify("Rematch started. Starting seat rotated.");
                  },
                )
              }
            >
              {roomInfo?.started && roomInfo.hostId !== authUser.id
                ? "WAITING FOR HOST"
                : "PLAY AGAIN"}{" "}
              <ArrowUpRight size={17} />
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
