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
import { tileStrip } from "./components/game/tileStrip";
import { MissileOverlay } from "./components/game/PowerEffects";
import { ChatMessageList, type ChatMessageView } from "./components/game/ChatMessageList";
import {
  ArrowLeft,
  ArrowUpRight,
  Bell,
  ChevronDown,
  CircleHelp,
  Crown,
  Dices,
  MoreHorizontal,
  Plus,
  Settings2,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import { BRAND } from "./brand";
import { BOARD, POWER_OPTIONS, RULES, type PowerId, type Tile } from "./game/rules";
import {
  createGame,
  currentPlayer,
  currentRent,
  netWorth,
  powerEligibleIds,
  sellableIds,
  sellBlockReason,
  powerSelectedIds,
  rentFor,
  tileAt,
  type GameState,
  type PowerEvent,
} from "./game/engine";
import "./index.css";
import "./v2.css";
type AccountView = { id: string; username: string; displayName: string };
type FriendView = AccountView & { online: boolean; isFriend?: boolean };
type RoomView = {
  code: string;
  hostId: string;
  started: boolean;
  members: AccountView[];
  game: GameState | null;
  turnDeadline?: number | null;
};
const fmt = (v: number) => "$" + Math.round(v).toLocaleString();
const powerName = (kind: PowerId | null) =>
  POWER_OPTIONS.find((power) => power.id === kind)?.name ?? "CHOOSE A POWER";
const propertyLike = (tile: Tile) =>
  tile.kind === "city" || tile.kind === "transport" || tile.kind === "business";
const initial = createGame([""]);
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
  const [authUser, setAuthUser] = useState<AccountView | null>(null),
    [socket, setSocket] = useState<Socket | null>(null),
    [roomInfo, setRoomInfo] = useState<RoomView | null>(null),
    [friends, setFriends] = useState<FriendView[]>([]),
    [onlineIds, setOnlineIds] = useState<string[]>([]),
    [friendQuery, setFriendQuery] = useState(""),
    [people, setPeople] = useState<FriendView[]>([]),
    [pendingInvite, setPendingInvite] = useState<{
      from: string;
      roomCode: string;
    } | null>(null),
    [roomCodeInput, setRoomCodeInput] = useState("");
  const [game, setGame] = useState<GameState>(initial),
    [notice, setNotice] = useState(""),
    [chat, setChat] = useState(""),
    [messages, setMessages] = useState<ChatMessageView[]>([]),
    [selected, setSelected] = useState<string | null>(null),
    [showLobby, setShowLobby] = useState(false),
    [centerEvent, setCenterEvent] = useState(initial.message),
    [secondsLeft, setSecondsLeft] = useState(RULES.timing.turnSeconds),
    [rolling, setRolling] = useState(false),
    [motionActive, setMotionActive] = useState(false),
    [motionPosition, setMotionPosition] = useState<Record<string, number>>({});
  const suppressState = useRef(false);
  const activeRoomCode = useRef<string | null>(null);
  const activeRoomStarted = useRef(false);
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
        setMessages([]);
      }
      const enteringGame = !activeRoomStarted.current && Boolean(room.game);
      activeRoomStarted.current = Boolean(room.game);
      setRoomInfo(room);
      if (enteringGame && room.game) setGame(room.game);
    });
    live.on("connect", () => {
      // After a reconnect the socket must rejoin its room to receive the
      // authoritative state (including any open Super Power interaction).
      const code = activeRoomCode.current;
      if (!code) return;
      live.emit("room:join", code, (r: { ok: boolean; room?: RoomView }) => {
        if (r?.ok && r.room?.game) {
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
      if (state.phase === "decision") {
        setSelected(null);
      }
    });
    live.on("presence:update", (ids: string[]) => setOnlineIds(ids));
    live.on("friends:update", (list: FriendView[]) => setFriends(list));
    live.on(
      "chat:message",
      (message: { username: string; text: string; timestamp?: string }) => {
        const timestamp = message.timestamp ?? new Date().toISOString();
        setMessages((list) =>
          [
            ...list,
            {
              id: crypto.randomUUID(),
              username: message.username,
              text: message.text,
              timestamp,
              fromSelf: message.username === authUser.displayName,
            },
          ].slice(-80),
        );
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
  const player = currentPlayer(game);
  const players = game.players;
  const selfPlayerId =
    roomInfo?.started && authUser
      ? `p${roomInfo.members.findIndex((member) => member.id === authUser.id)}`
      : "p0";
  const isMyTurn = player.id === selfPlayerId;
  const pendingTile = game.phase === "decision" ? tileAt(player.position) : null;
  const selectedTile = BOARD.find((tile) => tile.id === selected);
  // A pending property card is private to the player who must resolve it.
  // Spectators retain the shared board and receive a neutral wait state.
  const displayTile =
    game.phase === "decision"
      ? isMyTurn
        ? pendingTile
        : undefined
      : selectedTile;
  const tileOwner = displayTile
    ? players.find((candidate) => candidate.id === game.owners[displayTile.id])
    : undefined;
  const groupMembers = displayTile?.group
    ? BOARD.filter((tile) => tile.group === displayTile.group)
    : [];
  const groupOwnerId = tileOwner?.id ?? player.id;
  const ownedInGroup = groupMembers.filter(
    (tile) => game.owners[tile.id] === groupOwnerId,
  ).length;
  const activeRent = displayTile
    ? tileOwner
      ? rentFor(game, displayTile, tileOwner)
      : (displayTile.rent ?? 0)
    : 0;
  const developmentLevel = displayTile ? (game.buildings[displayTile.id] ?? 0) : 0;
  const canDevelop = Boolean(
    displayTile?.kind === "city" &&
      displayTile.group &&
      isMyTurn &&
      game.phase === "roll" &&
      tileOwner?.id === player.id &&
      groupMembers.length === 3 &&
      ownedInGroup === groupMembers.length &&
      developmentLevel < 4,
  );
  const canAffordDevelopment = Boolean(
    canDevelop && player.cash >= (displayTile?.developmentCost ?? Infinity),
  );
  const timerText = `00:${String(secondsLeft).padStart(2, "0")}`;
  // Super Power eligibility and selection are computed by the same shared
  // engine function on the server; this only decides what this viewer may click.
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
    // Selections and highlights never outlive the step that created them.
    setSelected(null);
  }, [powerIdentity]);
  useEffect(() => {
    const event = game.powerEvent;
    if (!event) return;
    if (seenPowerEvent.current === null) {
      // First state seen in this session: remember it without replaying it.
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
  // Super Power commands. The server validates the actor, eligibility and the
  // interaction id; a successful ack carries the authoritative state.
  const sendPower = (command: Record<string, unknown>) => {
    if (!roomInfo?.started || !socket) {
      notify("Create or join a real player table before making a move.");
      return;
    }
    socket.emit(
      "game:command",
      { ...command, interactionId: game.powerInteraction?.id },
      (result: { ok: boolean; error?: string; state?: GameState }) => {
        if (!result.ok) {
          notify(result.error || "That Super Power action could not be completed.");
          return;
        }
        if (result.state) setGame(result.state);
      },
    );
  };
  // Sell is a server-validated command. The button is shown only when the
  // server-side rules allow it; the ack state is applied as with other commands.
  const sendSell = (propertyId: string) =>
    sendPower({ type: "SELL_PROPERTY", propertyId });
  const applyCommand = (type: string, propertyId?: string) => {
    if (!roomInfo?.started || !socket) {
      notify("Create or join a real player table before making a move.");
      return;
    }
    suppressState.current = true;
    socket.emit(
      "game:command",
      { type, propertyId, powerId: propertyId },
      (result: { ok: boolean; error?: string; state?: GameState }) => {
        if (!result.ok) {
          suppressState.current = false;
          notify(result.error || "That move could not be completed.");
          return;
        }
        if (result.state) setGame(result.state);
      },
    );
  };
  const createRoom = () => {
    if (!socket) {
      notify(
        "Connecting to the live game server. Please try again in a moment.",
      );
      return;
    }
    if (!socket.connected) {
      notify(
        "Live game connection is not ready yet. Please try again in a moment.",
      );
      return;
    }
    socket
      .timeout(8000)
      .emit(
        "room:create",
        (timeoutError: Error | null, r: { ok: boolean; error?: string }) => {
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
          notify(
            "Open table created. Share the room code and start when your players are ready.",
          );
        },
      );
  };
  const copyRoomCode = async () => {
    if (!roomInfo) return;
    try {
      await navigator.clipboard.writeText(roomInfo.code);
      notify(
        "Join code copied. Anyone signed in can use it before the game starts.",
      );
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
          notify("You joined the open game lobby.");
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
          notify(
            "The city is live. Other players can still join with your code.",
          );
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
        }),
        d = await r.json();
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
    window.setTimeout(() => {
      const rolledPlayer = next.players.find((candidate) => candidate.id === playerId);
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
            }, 110);
          }
        }, 145);
      }
      setGame(next);
    }, 620);
  };
  const doRoll = () => {
    if (
      !roomInfo?.started ||
      !socket ||
      rolling ||
      motionActive ||
      game.phase !== "roll" ||
      !isMyTurn
    )
      return;
    setSelected(null);
    setRolling(true);
    const before = player.position;
    suppressState.current = true;
    socket.emit(
      "game:command",
      { type: "ROLL" },
      (r: { ok: boolean; error?: string; state?: GameState }) => {
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
          player.properties
            .map((id) => BOARD.find((t) => t.id === id)?.group)
            .filter(Boolean),
        ),
      ),
    [player.properties],
  );
  if (!authUser) return <AuthView onAuthed={(user) => setAuthUser(user)} />;
  if (!roomInfo?.started || !roomInfo.game)
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
              <small>REAL PLAYERS · OPEN JOIN CODES</small>
            </div>
          </div>
          <div className="pre-user">
            <span
              className="player-dot"
              style={{ "--player-color": "#92b954" } as CSSProperties}
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
            Create an open Scam City table and share its code. Any signed-in
            player can join by code while the match is open and a seat
            remains—no friend request needed.
          </p>
          <div className="pre-facts">
            <span>1–6 REAL PLAYERS</span>
            <i />
            <span>36 CITY STOPS</span>
            <i />
            <span>${RULES.victory.targetNetWorth.toLocaleString()} TO WIN</span>
          </div>
        </section>
        {pendingInvite && !roomInfo && (
          <div className="pre-invite">
            <div>
              <b>{pendingInvite.from} invited you to play</b>
              <small>Open room · code {pendingInvite.roomCode}</small>
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
                    <div className="pre-label">OPEN TABLE · JOIN BY CODE</div>
                    <h2>
                      Room <strong>{roomInfo.code}</strong>
                    </h2>
                  </div>
                  <button
                    className="pre-copy"
                    onClick={() => void copyRoomCode()}
                  >
                    COPY CODE
                  </button>
                </div>
                <p className="pre-card-note">
                  Share the code—any signed-in player can join without a friend
                  request while the match is open and seats remain.
                </p>
                <div className="pre-seats">
                  {roomInfo.members.map((member, index) => (
                    <div className="pre-seat" key={member.id}>
                      <span
                        className="player-dot"
                        style={
                          {
                            "--player-color": [
                              "#e96d52",
                              "#5b9bd3",
                              "#d5b84d",
                              "#7dbb77",
                              "#9b78bb",
                              "#43a9a2",
                            ][index],
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
                    { length: Math.max(0, 6 - roomInfo.members.length) },
                    (_, i) => (
                      <div className="pre-seat pre-open-seat" key={`open-${i}`}>
                        <span>+</span>
                        <b>Open seat</b>
                        <small>INVITE A FRIEND</small>
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
                <h2>Make a table.</h2>
                <p className="pre-card-note">
                  Create an open game and share its code, or enter a code shared
                  by any player.
                </p>
                <button className="pre-primary pre-create" onClick={createRoom}>
                  <span className="pre-action-symbol">＋</span>
                  <span>
                    <b>CREATE AN OPEN GAME</b>
                    <small>Start now · invite real players anytime</small>
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
                      setRoomCodeInput(e.target.value.toUpperCase().slice(0, 6))
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
            aria-label={`Copy public join code ${roomInfo.code}`}
          >
            <span>JOIN CODE · OPEN TO PLAYERS</span>
            <b>{roomInfo.code}</b>
            <small>
              {roomInfo.members.length >= 6
                ? "TABLE FULL · NO OPEN SEATS"
                : "ANY SIGNED-IN PLAYER CAN JOIN"}
            </small>
            <i>
              <ArrowUpRight size={16} />
            </i>
          </button>
        )}
        <footer className="pre-footer">
          <span>SCAM CITY · SOCIAL STRATEGY GAME</span>
          <span>NO NPCs · REAL FRIENDS · ONE CITY</span>
        </footer>
      </main>
    );
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
          <span className="live-dot" /> FRIEND TABLE{" "}
          <span className="room-code">
            {roomInfo ? `ROOM · ${roomInfo.code}` : "ADD FRIENDS TO PLAY"}
          </span>
        </div>
        <div className="header-right">
          <button className="icon-button" aria-label="Notifications">
            <Bell size={18} />
            <i />
          </button>
          <button className="profile-chip" onClick={() => setShowLobby(true)}>
            <span className="you-avatar">
              <i
                className="player-dot"
                style={
                  {
                    "--player-color":
                      players.find((p) => p.id === selfPlayerId)?.avatar ||
                      "#e96d52",
                  } as CSSProperties
                }
                aria-hidden="true"
              >
                {authUser.displayName.slice(0, 1).toUpperCase()}
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
            <span className="eyebrow-line" /> GAME IN PROGRESS
          </div>
          <h1>
            Make your <em>next move.</em>
          </h1>
          <p>Build a little fortune. Make a few friends. Maybe keep both.</p>
        </div>
        <div className="goal-card">
          <div className="goal-icon">
            <Trophy size={19} />
          </div>
          <div className="goal-copy">
            <small>
              WEALTH RACE · ROUND {game.round} ·{" "}
              {Math.max(0, RULES.victory.roundLimit - game.round + 1)} ROUNDS
              LEFT
            </small>
            <b>
              {fmt(RULES.victory.targetNetWorth)} <span>to win</span>
            </b>
            <div className="goal-track">
              <i
                style={{
                  width: `${Math.min(100, (netWorth(game, player) / RULES.victory.targetNetWorth) * 100)}%`,
                }}
              />
            </div>
          </div>
          <button className="more-btn">
            <MoreHorizontal />
          </button>
        </div>
      </section>
      <div className="main-grid">
        <section className="board-column">
          <div className="board-meta">
            <div className="turn-tag">
              <span className="turn-pulse" />{" "}
              {game.phase === "roll"
                ? isMyTurn
                  ? game.lastRoll === 6
                    ? "BONUS ROLL · YOUR TURN"
                    : "YOUR TURN · AUTO PASS ON 1–5"
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
              <button
                onClick={() =>
                  notify("Game settings are ready for the full room build.")
                }
              >
                <Settings2 size={15} /> Rules
              </button>
            </div>
          </div>
          <div className="mobile-player-rail rail-top">
            {players.slice(0, Math.ceil(players.length / 2)).map((p) => (
              <div
                className={`mobile-seat ${game.players[game.turn].id === p.id ? "active-seat" : ""}`}
                key={p.id}
              >
                <span
                  className="player-dot"
                  style={{ "--player-color": p.avatar } as CSSProperties}
                  aria-label={`${p.name} player token`}
                >
                  {p.name.slice(0, 1).toUpperCase()}
                </span>
                <div>
                  <b>
                    {p.name}
                    {p.id === selfPlayerId ? " · YOU" : ""}
                  </b>
                  <small>
                    {fmt(p.cash)} <em>({fmt(netWorth(game, p))})</em>
                  </small>
                </div>
                {game.players[game.turn].id === p.id && (
                  <span className="your-turn-pill">YOUR TURN</span>
                )}
              </div>
            ))}
          </div>
          <div className="board-wrap">
            <div className="board-grid" ref={boardGridRef}>
              {BOARD.map((tile, i) => {
                const owner = players.find(
                  (p) => p.id === game.owners[tile.id],
                );
                const tokenPlayers = players.filter(
                  (p) => (motionPosition[p.id] ?? p.position) === i,
                );
                const pos = tilePos(i);
                const price = tile.price;
                const strip = tileStrip(
                  tile,
                  owner?.id,
                  owner ? currentRent(game, tile.id) : 0,
                );
                return (
                  <button
                    data-tile-id={tile.id}
                    className={`tile tile-${tile.kind} ${strip ? "has-value-strip" : ""} ${selected === tile.id ? "tile-selected" : ""} ${game.lastLanding?.tileId === tile.id ? "tile-landed" : ""} ${owner ? "tile-owned" : ""} ${displayTile?.group && displayTile.group === tile.group ? "tile-group-highlight" : ""} ${tokenPlayers.length ? "has-token" : ""} ${powerEligible.has(tile.id) ? "tile-power-eligible" : ""} ${powerSelected.has(tile.id) ? "tile-power-selected" : ""}`}
                    aria-label={`${tile.name}${price ? `, value ${fmt(price)}` : ""}${owner ? `, owned by ${owner.name}` : ""}${game.lastLanding?.tileId === tile.id ? ", last landing" : ""}`}
                    title={`${tile.name}${price ? ` · ${fmt(price)}` : ""}${owner ? ` · Owned by ${owner.name}` : ""}`}
                    style={
                      {
                        ...pos,
                        "--tile-color": tile.tone ?? "#c6d1c4",
                      } as CSSProperties
                    }
                    key={`${tile.id}-${i}`}
                    onClick={() => {
                      if (game.phase === "decision") return;
                      if (game.phase === "power") {
                        if (powerEligible.has(tile.id)) setSelected(tile.id);
                        else if (propertyLike(tile))
                          notify("That property is not eligible for this Super Power step.");
                        return;
                      }
                      setSelected(tile.id);
                    }}
                  >
                    <span className="tile-color" />
                    {tile.kind === "start" ? (
                      <span className="tile-icon start-icon">⬆️</span>
                    ) : (
                      <span className="tile-icon">
                        {tile.kind === "bank"
                          ? "🏦"
                          : tile.kind === "power"
                            ? "✨"
                            : tile.kind === "jail"
                              ? "🚔"
                              : tile.kind === "transport"
                                ? "🚆"
                                : tile.kind === "business"
                                  ? "🏢"
                                  : tile.kind === "tax"
                                    ? "🧾"
                                    : ""}
                      </span>
                    )}
                    <span className="tile-name">{tile.name}</span>
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
                        {fmt(strip.amount)}
                      </span>
                    )}
                    {game.buildings[tile.id] ? (
                      <span className="tile-level">
                        {game.buildings[tile.id] === 4
                          ? "♜"
                          : `H${game.buildings[tile.id]}`}
                      </span>
                    ) : null}
                    {tokenPlayers.length > 0 && (
                      <span className="token-stack">
                        {tokenPlayers.map((p) => (
                          <i
                            className="player-dot"
                            key={p.id}
                            style={
                              { "--player-color": p.avatar } as CSSProperties
                            }
                          />
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
                rolling={rolling}
                motionActive={motionActive}
                onRoll={doRoll}
                onBuy={() => applyCommand("BUY_PROPERTY")}
                onPass={() => applyCommand("PASS_PROPERTY")}
                onBuild={doBuild}
                onChoosePower={(powerId) => sendPower({ type: "CHOOSE_POWER", powerId })}
                onPassPower={() => sendPower({ type: "POWER_CANCEL" })}
                onPowerSelect={(propertyId) => sendPower({ type: "POWER_SELECT", propertyId })}
                onPowerConfirm={() => sendPower({ type: "POWER_CONFIRM" })}
                onPowerDecline={() => sendPower({ type: "POWER_DECLINE" })}
                onPowerCancel={() => sendPower({ type: "POWER_CANCEL" })}
                sellReason={(propertyId) =>
                  sellBlockReason(game, selfPlayerId, propertyId)
                }
                onSell={sendSell}
                onCloseTile={() => setSelected(null)}
              />
            </div>
          </div>
          <div className="mobile-player-rail rail-bottom">
            {players.slice(Math.ceil(players.length / 2)).map((p) => (
              <div
                className={`mobile-seat ${game.players[game.turn].id === p.id ? "active-seat" : ""}`}
                key={p.id}
              >
                <span
                  className="player-dot"
                  style={{ "--player-color": p.avatar } as CSSProperties}
                  aria-label={`${p.name} player token`}
                >
                  {p.name.slice(0, 1).toUpperCase()}
                </span>
                <div>
                  <b>
                    {p.name}
                    {p.id === selfPlayerId ? " · YOU" : ""}
                  </b>
                  <small>
                    {fmt(p.cash)} <em>({fmt(netWorth(game, p))})</em>
                  </small>
                </div>
                {game.players[game.turn].id === p.id && (
                  <span className="your-turn-pill">YOUR TURN</span>
                )}
              </div>
            ))}
            {players.length < 6 && (
              <button
                className="mobile-seat-add"
                type="button"
                aria-label="Invite another player"
                onClick={() => setShowLobby(true)}
              >
                <Plus size={20} />
                <span>ADD</span>
              </button>
            )}
          </div>
          <div className="board-foot">
            <span>
              <i className="legend-dot owned" /> Owned
            </span>
            <span>
              <i className="legend-dot available" /> Available
            </span>
            <span>
              <i className="legend-dot special" /> City moment
            </span>
            <span className="foot-help">
              <CircleHelp size={14} /> How to play
            </span>
          </div>
        </section>
        <aside className="side-column">
          <section className="players-card">
            <div className="section-head">
              <div>
                <div className="eyebrow">AT THIS TABLE</div>
                <h2>
                  Players <span>{players.length}/6</span>
                </h2>
              </div>
              <button className="round-add" onClick={() => setShowLobby(true)}>
                <Plus size={17} />
              </button>
            </div>
            {players.map((p, i) => {
              const active = game.players[game.turn].id === p.id;
              return (
                <div
                  className={`player-row ${active ? "active-player" : ""}`}
                  key={p.id}
                >
                  <div className={`player-avatar av-${i}`}>
                    <i
                      className="player-dot"
                      style={{ "--player-color": p.avatar } as CSSProperties}
                      aria-hidden="true"
                    >
                      {p.name.slice(0, 1).toUpperCase()}
                    </i>
                    {active && <i />}
                  </div>
                  <div className="player-main">
                    <div className="player-name">
                      {p.name}
                      {p.id === selfPlayerId && (
                        <span className="you-tag">YOU</span>
                      )}
                    </div>
                    <div className="player-sub">
                      {p.properties.length} properties <span>·</span>{" "}
                      {Object.values(game.owners).filter((id) => id === p.id)
                        .length
                        ? `${Object.values(game.owners).filter((id) => id === p.id).length} owned`
                        : "just arrived"}
                    </div>
                    {p.powers.length > 0 && (
                      <div className="player-power-chips">
                        {p.powers.map((id, index) => (
                          <span key={`${id}-${index}`}>
                            {POWER_OPTIONS.find((power) => power.id === id)
                              ?.name || id}
                          </span>
                        ))}
                      </div>
                    )}
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
                    <b>{fmt(p.cash)}</b>
                    <small>NET {fmt(netWorth(game, p))}</small>
                  </div>
                </div>
              );
            })}
            <button className="invite-btn" onClick={() => setShowLobby(true)}>
              <Plus size={16} /> INVITE A FRIEND <span>↗</span>
            </button>
          </section>
          <section className="portfolio-card">
            <div className="section-head">
              <div>
                <div className="eyebrow">YOUR LITTLE EMPIRE</div>
                <h2>Portfolio</h2>
              </div>
              <span className="portfolio-count">
                {player.properties.length} ASSETS
              </span>
            </div>
            {player.properties.length === 0 ? (
              <div className="empty-portfolio">
                <div className="empty-icon">⌂</div>
                <b>Your story starts somewhere.</b>
                <span>Land on an open property and make it yours.</span>
              </div>
            ) : (
              <div className="asset-list">
                {player.properties.map((id) => {
                  const t = BOARD.find((x) => x.id === id)!;
                  return (
                    <div className="asset-row" key={id}>
                      <i style={{ background: t.tone }} />
                      <span>
                        <b>{t.name}</b>
                        <small>
                          {t.group || "Transit"} · {game.buildings[id] || 0}{" "}
                          upgrades
                        </small>
                      </span>
                      <b>{fmt(t.price || 0)}</b>
                      {t.group && (
                        <button onClick={() => doBuild(id)} title="Develop">
                          ＋
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {groups.length > 0 && (
              <div className="set-bonus">
                <Sparkles size={14} /> Complete a set to unlock development.
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
                    ● {onlineIds.length} online
                  </span>
                </h2>
              </div>
              <button className="text-btn">VIEW ALL</button>
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
                placeholder="Say something nice…"
                aria-label="Message your table"
                enterKeyHint="send"
              />
              <button aria-label="Send message">
                <ArrowUpRight size={17} />
              </button>
            </form>
            <div className="reaction-row">
              {["😂", "😭", "🔥", "🤝", "😈"].map((x) => (
                <button
                  key={x}
                  onClick={() => {
                    if (roomInfo?.started) socket?.emit("chat:send", x);
                  }}
                >
                  {x}
                </button>
              ))}
              <button className="reaction-more">＋</button>
            </div>
          </section>
        </aside>
      </div>
      <div className="mobile-chat-dock" role="region" aria-label="Game chat">
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
          placeholder="Say hello to your table…"
          aria-label="Message your table"
          enterKeyHint="send"
        />
        <button aria-label="Send chat message">
          <ArrowUpRight size={19} />
        </button>
      </form>
      </div>
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
                <div className="eyebrow">SCAM CITY SOCIAL</div>
                <h2>Friends & rooms</h2>
              </div>
              <button
                className="close-sheet"
                onClick={() => setShowLobby(false)}
              >
                <X size={18} />
              </button>
            </header>
            {pendingInvite && (
              <div className="incoming-invite">
                <span className="friend-dot" />
                <div>
                  <b>{pendingInvite.from} invited you</b>
                  <small>ROOM {pendingInvite.roomCode}</small>
                </div>
                <button onClick={() => joinRoom(pendingInvite.roomCode)}>
                  JOIN
                </button>
              </div>
            )}
            {roomInfo ? (
              <div className="room-panel">
                <div className="room-code-label">
                  {roomInfo.started
                    ? "ROOM CODE · MATCH LIVE"
                    : "OPEN JOIN CODE"}{" "}
                  <b>{roomInfo.code}</b>
                  <button onClick={() => void copyRoomCode()}>COPY</button>
                </div>
                <div className="room-member-list">
                  {roomInfo.members.map((member, index) => (
                    <div className="room-member" key={member.id}>
                      <i
                        className="friend-dot"
                        style={
                          {
                            "--dot-color": [
                              "#ec755c",
                              "#559bd4",
                              "#d1ad48",
                              "#75af75",
                              "#9975b6",
                              "#3aa99e",
                            ][index],
                          } as CSSProperties
                        }
                      />
                      <span>
                        {member.displayName}
                        {member.id === authUser.id ? " (you)" : ""}
                      </span>
                      <small>
                        {member.id === roomInfo.hostId ? "HOST" : "JOINED"}
                      </small>
                    </div>
                  ))}
                </div>
                {roomInfo.started ? (
                  <div className="room-live">
                    <i /> GAME IN PROGRESS · room state is synced
                  </div>
                ) : (
                  <div className="room-actions">
                    {roomInfo.hostId === authUser.id ? (
                      <button className="sheet-primary" onClick={startRoom}>
                        START GAME <ArrowUpRight size={16} />
                      </button>
                    ) : (
                      <span>Waiting for the host to start…</span>
                    )}
                    <button
                      className="leave-room"
                      onClick={() => {
                        socket?.emit("room:leave");
                        setRoomInfo(null);
                        notify("You left the room.");
                      }}
                    >
                      LEAVE ROOM
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="room-create-row">
                  <div>
                    <b>Start an open table</b>
                    <small>
                      Any signed-in player can join by code before play.
                    </small>
                  </div>
                  <button onClick={createRoom}>
                    CREATE OPEN ROOM <Plus size={15} />
                  </button>
                </div>
                <form
                  className="join-room-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    joinRoom();
                  }}
                >
                  <input
                    value={roomCodeInput}
                    onChange={(e) =>
                      setRoomCodeInput(e.target.value.toUpperCase().slice(0, 6))
                    }
                    placeholder="ENTER 6-CHARACTER ROOM CODE"
                    maxLength={6}
                  />
                  <button disabled={roomCodeInput.length !== 6}>JOIN</button>
                </form>
              </>
            )}
            <div className="friend-search">
              <div className="friend-section-title">
                FIND PLAYERS <span>USERNAME</span>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addFriend(friendQuery);
                }}
              >
                <input
                  value={friendQuery}
                  onChange={(e) => void searchPeople(e.target.value)}
                  placeholder="Search a username to add"
                />
                <button disabled={friendQuery.trim().length < 3}>ADD</button>
              </form>
              {people
                .filter((p) => !p.isFriend)
                .map((person) => (
                  <div className="friend-row" key={person.id}>
                    <i className="friend-dot" />
                    <span>
                      <b>@{person.username}</b>
                      <small>
                        {person.online || onlineIds.includes(person.id)
                          ? "ONLINE"
                          : "OFFLINE"}
                      </small>
                    </span>
                    <button onClick={() => addFriend(person.username)}>
                      ADD FRIEND
                    </button>
                  </div>
                ))}
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
                  No friends yet. Search by username above to add someone.
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
                        disabled={!online || !roomInfo}
                        title={
                          !roomInfo
                            ? "Create a room first"
                            : !online
                              ? "Friend is offline"
                              : "Invite to room"
                        }
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
              <Crown size={16} /> SCAM CITY · FINAL STANDINGS
            </div>
            <div className="winner-avatar">
              <i
                className="player-dot"
                style={
                  {
                    "--player-color":
                      game.players.find((p) => p.id === game.winner)?.avatar ||
                      "#d5b84d",
                  } as CSSProperties
                }
              />
            </div>
            <h2>
              {game.players.find((p) => p.id === game.winner)?.name}{" "}
              <em>won.</em>
            </h2>
            <p>Made the city work for them.</p>
            <div className="final-rankings">
              {[...game.players]
                .sort(
                  (a, b) =>
                    netWorth(game, b) - netWorth(game, a) || b.cash - a.cash,
                )
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
                    <b>{p.name}</b>
                    <strong>{fmt(netWorth(game, p))}</strong>
                  </div>
                ))}
            </div>
            <div className="xp-note">
              <Sparkles size={15} /> MATCH COMPLETE · FINAL STANDINGS
            </div>
            <button
              className="sheet-primary rematch-button"
              disabled={!!roomInfo?.started && roomInfo.hostId !== authUser.id}
              onClick={() =>
                socket?.emit(
                  "room:rematch",
                  (r: { ok: boolean; error?: string }) => {
                    if (!r.ok) notify(r.error || "Rematch could not start.");
                    else notify("New round. Starting seat rotated.");
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
