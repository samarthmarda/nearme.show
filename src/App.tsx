import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { io, type Socket } from "socket.io-client";
import { AuthView } from "./AuthView";
import {
  ArrowUpRight,
  Bell,
  Building2,
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
import { BOARD, POWER_OPTIONS, RULES } from "./game/rules";
import {
  createGame,
  currentPlayer,
  netWorth,
  rentFor,
  tileAt,
  type GameState,
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
    [messages, setMessages] = useState<string[]>([]),
    [selected, setSelected] = useState<string | null>(null),
    [showLobby, setShowLobby] = useState(false),
    [modalDismissed, setModalDismissed] = useState(false),
    [secondsLeft, setSecondsLeft] = useState(RULES.timing.turnSeconds),
    [rolling, setRolling] = useState(false),
    [motionActive, setMotionActive] = useState(false),
    [motionPosition, setMotionPosition] = useState<Record<string, number>>({});
  const suppressState = useRef(false);
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
      setRoomInfo(room);
    });
    live.on("game:state", (state: GameState) => {
      if (suppressState.current) {
        suppressState.current = false;
        return;
      }
      setGame(state);
      if (state.phase === "decision") {
        setSelected(null);
        setModalDismissed(false);
      }
    });
    live.on("presence:update", (ids: string[]) => setOnlineIds(ids));
    live.on("friends:update", (list: FriendView[]) => setFriends(list));
    live.on("chat:message", (message: { username: string; text: string }) =>
      setMessages((list) =>
        [...list, `${message.username}: ${message.text}`].slice(-30),
      ),
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
  const pendingTile = game.phase === "decision" ? tileAt(player.position) : null;
  const selectedTile = BOARD.find((tile) => tile.id === selected);
  const displayTile = pendingTile ?? selectedTile;
  const lastLandingTile = game.lastLanding
    ? BOARD.find((tile) => tile.id === game.lastLanding?.tileId)
    : undefined;
  const lastLandingPlayer = game.lastLanding
    ? players.find((candidate) => candidate.id === game.lastLanding?.playerId)
    : undefined;
  const shownRoll = game.lastRoll ?? game.lastLanding?.roll ?? null;
  const selfPlayerId =
    roomInfo?.started && authUser
      ? `p${roomInfo.members.findIndex((member) => member.id === authUser.id)}`
      : "p0";
  const isMyTurn = player.id === selfPlayerId;
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
  const isPendingPurchase = Boolean(
    game.phase === "decision" &&
      pendingTile &&
      displayTile?.id === pendingTile.id &&
      !game.owners[pendingTile.id] &&
      pendingTile.price,
  );
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
  const notify = (text: string) => {
    setNotice(text);
    window.setTimeout(() => setNotice(""), 3000);
  };
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
    setModalDismissed(false);
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
  const centerAction =
    game.phase === "roll" ? (
      isMyTurn ? (
        <button
          className={`roll-button ${rolling ? "rolling-dice" : ""}`}
          disabled={rolling || motionActive}
          onClick={doRoll}
        >
          <Dices size={20} />{" "}
          {rolling ? "ROLLING…" : game.lastRoll === 6 ? "ROLL AGAIN" : "ROLL DICE"}
        </button>
      ) : (
        <button className="roll-button waiting" disabled>
          WAITING FOR {player.name.toUpperCase()}
        </button>
      )
    ) : game.phase === "power" ? (
      <button className="roll-button waiting" disabled>
        {isMyTurn
          ? "CHOOSE A POWER ABOVE"
          : `${player.name.toUpperCase()} IS PICKING A POWER`}
      </button>
    ) : game.phase === "decision" ? (
      <div className="center-action-hint" aria-live="polite">
        {isMyTurn ? "BUY OR PASS IN THE PROPERTY CARD" : `${player.name.toUpperCase()} IS CHOOSING`}
      </div>
    ) : (
      <button className="roll-button waiting" disabled>
        <Crown size={17} /> GAME COMPLETE
      </button>
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
                  ? isMyTurn
                    ? "POWER PICK"
                    : `${player.name.toUpperCase()} PICKING POWER`
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
            <div className="board-grid">
              {BOARD.map((tile, i) => {
                const owner = players.find(
                  (p) => p.id === game.owners[tile.id],
                );
                const tokenPlayers = players.filter(
                  (p) => (motionPosition[p.id] ?? p.position) === i,
                );
                const pos = tilePos(i);
                const price = tile.price;
                return (
                  <button
                    className={`tile tile-${tile.kind} ${selected === tile.id ? "tile-selected" : ""} ${game.lastLanding?.tileId === tile.id ? "tile-landed" : ""} ${owner ? "tile-owned" : ""} ${displayTile?.group && displayTile.group === tile.group ? "tile-group-highlight" : ""} ${tokenPlayers.length ? "has-token" : ""}`}
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
                      setSelected(tile.id);
                      setModalDismissed(false);
                    }}
                  >
                    <span className="tile-color" />
                    {tile.kind === "start" ? (
                      <span className="tile-icon start-icon">↗</span>
                    ) : (
                      <span className="tile-icon">
                        {tile.kind === "bank"
                          ? "＄"
                          : tile.kind === "power"
                            ? "✦"
                            : tile.kind === "jail"
                              ? "▣"
                              : tile.kind === "transport"
                                ? "↗"
                                : tile.kind === "business"
                                  ? "⌂"
                                  : tile.kind === "tax"
                                    ? "%"
                                    : ""}
                      </span>
                    )}
                    <span className="tile-name">{tile.name}</span>
                    {price && <span className="tile-price">{fmt(price)}</span>}
                    {game.buildings[tile.id] ? (
                      <span className="tile-level">
                        {game.buildings[tile.id] === 4
                          ? "♜"
                          : `H${game.buildings[tile.id]}`}
                      </span>
                    ) : null}
                    {owner && (
                      <span
                        className="owner-dot"
                        style={{ background: owner.avatar }}
                      />
                    )}
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
              <div className={`board-center board-center-${game.phase}`}>
                <div className="center-topline">
                  <span>✦ LIVE CITY · ROUND {game.round}</span>
                  <span className="center-round">{player.name.toUpperCase()} TO ACT</span>
                </div>
                <div className="center-art" aria-hidden="true">
                  <div className="sun-disc" />
                  <div className="hill hill-back" />
                  <div className="hill hill-front" />
                  <div className="center-tower">✦</div>
                </div>
                <div className="center-title">
                  SCAM CITY <span>·</span> AFTER DARK
                </div>
                <div className="center-sub">
                  1–5 auto-passes after resolution · 6 earns another roll
                </div>
                <div className="center-notice" role="status" aria-live="polite">
                  <span className="center-notice-kicker">
                    {game.phase === "decision"
                      ? "PROPERTY ACTION REQUIRED"
                      : game.phase === "power"
                        ? "POWER PICK"
                        : game.phase === "finished"
                          ? "MATCH COMPLETE"
                          : game.lastRoll === 6
                            ? "SIX · BONUS ROLL"
                            : "TABLE UPDATE"}
                  </span>
                  <strong>{game.message}</strong>
                  {game.phase === "roll" && game.activity[1] && (
                    <small>Last resolution · {game.activity[1]}</small>
                  )}
                  {game.lastLandingTile && (
                    <span className="center-landing-chip">
                      {lastLandingPlayer?.name} · {lastLandingTile.name}
                    </span>
                  )}
                </div>
                <div className="roll-result">
                  <span className={`dice-face ${shownRoll ? "" : "idle"}`}>
                    {shownRoll ?? "⚄"}
                  </span>
                  <span>
                    <small>{game.lastRoll === 6 ? "EXTRA ROLL READY" : shownRoll ? "LAST ROLL" : "TURN FLOW"}</small>
                    <b>
                      {game.phase === "decision"
                        ? "Choose BUY or PASS"
                        : game.phase === "roll" && game.lastRoll === 6
                          ? "Same player rolls again"
                          : `Next · ${player.name}`}
                    </b>
                  </span>
                </div>
                {centerAction}
              </div>
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
                            width: `${(secondsLeft / (game.phase === "power" ? RULES.timing.powerSeconds : game.phase === "decision" ? RULES.timing.propertySeconds : RULES.timing.turnSeconds)) * 100}%`,
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
            <div className="chat-lines">
              {messages.length ? (
                messages.map((m, i) => <p key={i}>{m}</p>)
              ) : (
                <p className="chat-empty">
                  No messages yet. Say hello to the real players at your table.
                </p>
              )}
            </div>
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
      <footer className="bottom-bar">
        <div className="turn-player">
          <span className="mini-you">
            <i
              className="player-dot"
              style={{ "--player-color": player.avatar } as CSSProperties}
              aria-hidden="true"
            >
              {player.name.slice(0, 1).toUpperCase()}
            </i>
          </span>
          <span>
            <b>{player.name}'s move</b>
            <small>
              {game.phase === "roll"
                ? game.lastRoll === 6
                  ? "Six rolled · your bonus roll is ready"
                  : "Roll 1–5 passes automatically · 6 rolls again"
                : game.phase === "decision"
                  ? "Resolve the property choice to continue"
                  : game.phase === "power"
                    ? "Power choice resolves before the next roll"
                    : "Final standings"}
            </small>
          </span>
        </div>
        <div className="bottom-middle">
          <span className="key-hint">SPACE</span> roll{" "}
          <i /> 1–5 auto-pass · 6 roll again
        </div>
        {game.phase === "roll" ? (
          <button
            className="bottom-action"
            disabled={!isMyTurn || rolling || motionActive}
            onClick={doRoll}
          >
            <Dices size={18} />{" "}
            {isMyTurn ? (game.lastRoll === 6 ? "ROLL AGAIN" : "ROLL") : "WAIT"}
          </button>
        ) : (
          <div className="bottom-action bottom-action-status" role="status">
            {game.phase === "decision"
              ? isMyTurn
                ? "BUY OR PASS"
                : "PROPERTY CHOICE"
              : game.phase === "power"
                ? "PICK A POWER"
                : "GAME COMPLETE"}
          </div>
        )}
      </footer>
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
        />
        <button aria-label="Send chat message">
          <ArrowUpRight size={19} />
        </button>
      </form>
      {roomInfo?.started && game.phase !== "finished" && (
        <button
          className="room-code-dock live-code-dock"
          onClick={() => void copyRoomCode()}
          aria-label={`Copy live game join code ${roomInfo.code}`}
        >
          <span>LIVE GAME · JOIN BY CODE</span>
          <b>{roomInfo.code}</b>
          <small>
            {roomInfo.members.length >= 6
              ? "TABLE FULL · 6/6"
              : "OPEN WHILE A SEAT REMAINS"}
          </small>
          <i>
            <ArrowUpRight size={15} />
          </i>
        </button>
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
      {displayTile && !modalDismissed && (
        <div
          className="modal-scrim property-scrim"
          onClick={() => {
            if (!isPendingPurchase || !isMyTurn) {
              setModalDismissed(true);
              setSelected(null);
            }
          }}
        >
          <div className="property-sheet" onClick={(e) => e.stopPropagation()}>
            {(!isPendingPurchase || !isMyTurn) && (
              <button
                className="close-sheet"
                aria-label="Close property details"
                onClick={() => {
                  setModalDismissed(true);
                  setSelected(null);
                }}
              >
                <X size={18} />
              </button>
            )}
            <div
              className="sheet-band"
              style={{ background: displayTile.tone || "#a6ba8c" }}
            />
            <div className="eyebrow">
              {displayTile.group || displayTile.kind} · SCAM CITY
            </div>
            <h2>{displayTile.name}</h2>
            <div className="property-owner-line">
              <i
                className={tileOwner ? "owner-status-dot" : "owner-status-dot unowned"}
                style={tileOwner ? { "--owner-color": tileOwner.avatar } as CSSProperties : undefined}
              />
              <span>{tileOwner ? `OWNED BY ${tileOwner.name.toUpperCase()}` : displayTile.price ? "AVAILABLE TO BUY" : displayTile.kind.toUpperCase()}</span>
              {lastLandingTile?.id === displayTile.id && <b>JUST LANDED</b>}
            </div>
            <div className="sheet-stats">
              <div>
                <small>VALUE</small>
                <b>{displayTile.price !== undefined ? fmt(displayTile.price) : "—"}</b>
              </div>
              <div className="sheet-rent-stat">
                <small>{tileOwner ? "CURRENT RENT" : "BASE RENT"}</small>
                <b>{fmt(activeRent)}</b>
              </div>
              <div>
                <small>SELL PRICE</small>
                <b>{displayTile.sellValue !== undefined ? fmt(displayTile.sellValue) : "—"}</b>
              </div>
            </div>
            {(displayTile.mortgageValue !== undefined || displayTile.unmortgageCost !== undefined) && (
              <div className="property-finance-row">
                {displayTile.mortgageValue !== undefined && (
                  <span>MORTGAGE VALUE <b>{fmt(displayTile.mortgageValue)}</b></span>
                )}
                {displayTile.unmortgageCost !== undefined && (
                  <span>REDEEM COST <b>{fmt(displayTile.unmortgageCost)}</b></span>
                )}
              </div>
            )}
            {displayTile.kind === "tax" && (
              <div className="property-fee-note">
                Landing fee <strong>{fmt(displayTile.taxAmount ?? 0)}</strong> · paid to the bank
              </div>
            )}
            {displayTile.rentSchedule && (
              <div className="rent-ladder">
                <div className="ladder-title">
                  RENT SCHEDULE
                  <span>{displayTile.group ? `GROUP ${displayTile.group.toUpperCase()}` : "PROPERTY"}</span>
                </div>
                <div className="rent-steps">
                  {[
                    { label: displayTile.kind === "city" ? "SOLO" : "1 OWNED", value: displayTile.rentSchedule.one },
                    { label: displayTile.kind === "city" ? "2 SAME COLOUR" : "2 OWNED", value: displayTile.rentSchedule.two },
                    { label: displayTile.kind === "city" ? "FULL GROUP" : "3 OWNED", value: displayTile.rentSchedule.three },
                  ].map((step, index) => (
                    <div className="rent-step" key={step.label}>
                      <small>{step.label}</small>
                      <b>{fmt(step.value)}</b>
                      {index === ownedInGroup - 1 && tileOwner && <i>NOW</i>}
                    </div>
                  ))}
                </div>
                {displayTile.kind === "city" && displayTile.rentSchedule.development && (
                  <>
                    <div className="development-track">
                      {displayTile.rentSchedule.development.map((rent, index) => (
                        <div
                          className={`development-level ${developmentLevel === index + 1 && tileOwner?.id === groupOwnerId ? "development-current" : ""}`}
                          key={index}
                        >
                          <span className="development-illustration" aria-hidden="true">
                            <Building2 size={15 + index * 3} strokeWidth={1.7} />
                            {index > 1 && <Building2 size={13} strokeWidth={1.7} />}
                          </span>
                          <small>{["HOTEL 1", "HOTEL 2", "HOTEL 3", "TOWER"][index]}</small>
                          <b>{fmt(rent)}</b>
                        </div>
                      ))}
                    </div>
                    <div className="development-cost-row">
                      <span>BUILD COST</span>
                      <b>{fmt(displayTile.developmentCost ?? 0)} / level</b>
                      {displayTile.repairCost !== undefined && (
                        <>
                          <i />
                          <span>REPAIR</span>
                          <b>{fmt(displayTile.repairCost)}</b>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
            {displayTile.group && (
              <div className="group-progress">
                <Sparkles size={13} />
                {ownedInGroup === groupMembers.length
                  ? displayTile.kind === "city"
                    ? `${tileOwner?.name ?? "YOUR"} GROUP COMPLETE · DEVELOPMENT UNLOCKED`
                    : `${tileOwner?.name ?? "YOUR"} GROUP COMPLETE · MAX GROUP RENT`
                  : `${tileOwner?.name ?? "YOUR"} GROUP · ${ownedInGroup}/${groupMembers.length} OWNED`}
              </div>
            )}
            <div className="sheet-copy">
              {tileOwner
                ? `Owned by ${tileOwner.name} · rent is ${fmt(activeRent)} at this ownership level.`
                : isPendingPurchase
                  ? `Available for ${fmt(displayTile.price ?? 0)}. Buy or pass to resolve this landing.`
                  : displayTile.kind === "tax"
                    ? `Landing here costs ${fmt(displayTile.taxAmount ?? 0)}.`
                    : "Open property · matching group tiles are highlighted on the board."}
            </div>
            {canDevelop && displayTile && (
              <>
                <button
                  className={`sheet-primary ${canAffordDevelopment ? "" : "disabled-buy"}`}
                  disabled={!canAffordDevelopment}
                  onClick={() => doBuild(displayTile.id)}
                >
                  BUILD {["HOTEL 1", "HOTEL 2", "HOTEL 3", "TOWER"][developmentLevel]} · {fmt(displayTile.developmentCost ?? 0)}
                </button>
                {!canAffordDevelopment && (
                  <div className="insufficient">Not enough cash for this development.</div>
                )}
              </>
            )}
            {isPendingPurchase && isMyTurn && displayTile.price !== undefined && (
              <div className="property-actions">
                <button
                  className={`sheet-primary ${player.cash < displayTile.price ? "disabled-buy" : ""}`}
                  disabled={player.cash < displayTile.price}
                  onClick={() => {
                    applyCommand("BUY_PROPERTY");
                    setModalDismissed(true);
                    setSelected(null);
                  }}
                >
                  BUY PROPERTY · {fmt(displayTile.price)}
                </button>
                {player.cash < displayTile.price && (
                  <div className="insufficient">Not enough cash · pass to finish the landing.</div>
                )}
                <button
                  className="sheet-secondary"
                  onClick={() => {
                    applyCommand("PASS_PROPERTY");
                    setModalDismissed(true);
                    setSelected(null);
                  }}
                >
                  PASS PROPERTY
                </button>
              </div>
            )}
            {displayTile.kind === "city" && tileOwner?.id === player.id && developmentLevel === 4 && (
              <div className="group-progress">TOWER COMPLETE · MAX DEVELOPMENT</div>
            )}
            {(!isPendingPurchase || !isMyTurn) && (
              <button
                className="sheet-secondary"
                onClick={() => {
                  setModalDismissed(true);
                  setSelected(null);
                }}
              >
                CLOSE DETAILS
              </button>
            )}
          </div>
        </div>
      )}
      {game.phase === "power" && (
        <div className="modal-scrim power-scrim">
          <section className="power-sheet">
            <div className="power-kicker">
              <span className="power-spark">✦</span> SCAM CITY · POWER STOP{" "}
              <span className="power-countdown">{timerText}</span>
            </div>
            <h2>
              Pick your <em>edge.</em>
            </h2>
            <p>
              {isMyTurn
                ? "Choose one power to add to your kit. The other players are watching."
                : `${player.name} landed on the Power stop. Waiting on their pick…`}
            </p>
            <div className="power-options">
              {POWER_OPTIONS.map((power, index) => (
                <button
                  className="power-option"
                  key={power.id}
                  disabled={!isMyTurn}
                  onClick={() => applyCommand("CHOOSE_POWER", power.id)}
                  style={{ "--power-color": power.color } as CSSProperties}
                >
                  <span className="power-option-icon">{power.icon}</span>
                  <span className="power-option-copy">
                    <b>{power.name}</b>
                    <small>{power.description}</small>
                  </span>
                  <span className="power-option-number">0{index + 1}</span>
                </button>
              ))}
            </div>
            {isMyTurn && (
              <button
                className="power-skip"
                onClick={() => applyCommand("PASS_POWER")}
              >
                SKIP THIS POWER <ArrowUpRight size={15} />
              </button>
            )}
            <div className="power-help">
              ONE POWER PER VISIT <i /> CHOICE LOCKS WHEN SELECTED
            </div>
          </section>
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
