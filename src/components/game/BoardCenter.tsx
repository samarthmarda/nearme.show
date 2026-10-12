import { Fragment, useState, type CSSProperties } from "react";
import {
  ArrowUpRight,
  Building2,
  Dices,
  Sparkles,
  X,
} from "lucide-react";
import { BOARD, POWER_OPTIONS, RULES, type PowerId, type Tile } from "../../game/rules";
import {
  bombedRent,
  currentRent,
  powerActorIds,
  powerAvailability,
  powerEligibleIds,
  powerSelectedIds,
  type GameState,
  type Player,
  type PowerEvent,
  type PowerInteraction,
} from "../../game/engine";

const fmt = (value: number) => "$" + Math.round(value).toLocaleString();

export type BoardCenterProps = {
  game: GameState;
  player: Player;
  /** True when the signed-in viewer is the active (turn) player. */
  isMyTurn: boolean;
  /** Stable player id of the signed-in viewer (seat), used for power eligibility. */
  viewerId: string;
  pendingTile: Tile | null;
  displayTile: Tile | null;
  tileOwner?: Player;
  ownedInGroup: number;
  groupSize: number;
  activeRent: number;
  developmentLevel: number;
  canDevelop: boolean;
  canAffordDevelopment: boolean;
  timerText: string;
  eventText: string;
  rolling: boolean;
  motionActive: boolean;
  /** Board property the viewer has focused (its cue card). */
  focusTile: Tile | null;
  /** Latest server-confirmed power outcome to flash briefly. */
  flash: PowerEvent | null;
  onRoll: () => void;
  onBuy: () => void;
  onPass: () => void;
  onBuild: (propertyId: string) => void;
  onChoosePower: (powerId: PowerId) => void;
  onPassPower: () => void;
  onPowerSelect: (propertyId: string) => void;
  onPowerConfirm: () => void;
  onPowerDecline: () => void;
  onPowerCancel: () => void;
  onCloseTile: () => void;
  /** Why the viewer cannot sell this property now (null = allowed). Owner-only UI. */
  sellReason?: (propertyId: string) => string | null;
  /** Sends a SELL_PROPERTY command. The server validates it and decides the result. */
  onSell?: (propertyId: string) => void;
};

function CityHallIllustration() {
  return (
    <svg
      className="city-hall-illustration"
      viewBox="0 0 360 270"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="hallWall" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#fff8df" />
          <stop offset="0.55" stopColor="#eee4c9" />
          <stop offset="1" stopColor="#c8b995" />
        </linearGradient>
        <linearGradient id="hallRoof" x1="0" x2="0.8" y1="0" y2="1">
          <stop offset="0" stopColor="#fffbe9" />
          <stop offset="1" stopColor="#d2c6a9" />
        </linearGradient>
        <linearGradient id="hallDome" x1="0" x2="0.8" y1="0" y2="1">
          <stop offset="0" stopColor="#f5edcf" />
          <stop offset="0.58" stopColor="#d8ca9e" />
          <stop offset="1" stopColor="#a99d84" />
        </linearGradient>
        <filter id="hallShadow" x="-30%" y="-30%" width="160%" height="180%">
          <feDropShadow dx="0" dy="9" stdDeviation="7" floodColor="#233c43" floodOpacity="0.24" />
        </filter>
      </defs>
      <ellipse cx="180" cy="238" rx="139" ry="18" fill="#607a7d" opacity="0.28" />
      <g filter="url(#hallShadow)">
        <polygon points="28,204 180,254 333,202 180,153" fill="#67656e" />
        <polygon points="49,199 180,241 311,198 180,158" fill="#55545d" />
        <polygon points="68,187 180,224 291,187 180,149" fill="#758078" />
        <polygon points="50,195 92,181 113,188 71,204" fill="#8bb765" />
        <polygon points="247,188 288,175 307,182 264,197" fill="#8bb765" />
        <polygon points="140,219 180,232 220,218 180,205" fill="#a9c96f" />
        <path d="M145 217l35 12 35-12-35-12z" fill="#c5db88" />
        <path d="M59 195l29-10 14 5-29 11zM263 190l29-10 12 5-29 10z" fill="#d8ed9c" />

        <polygon points="91,145 180,116 270,145 180,176" fill="#c6b99e" />
        <polygon points="91,139 180,109 270,139 180,169" fill="url(#hallRoof)" />
        <polygon points="105,138 180,113 256,139 180,164" fill="#fff9e5" />
        <polygon points="116,143 180,122 243,143 180,164" fill="#dbcfb4" />

        <polygon points="112,147 180,169 247,147 247,193 180,216 112,193" fill="url(#hallWall)" />
        <polygon points="112,147 180,169 180,216 112,193" fill="#e8dcc0" />
        <polygon points="180,169 247,147 247,193 180,216" fill="#d0c2a2" />
        <polygon points="106,190 180,214 253,190 253,201 180,228 106,203" fill="#f6edda" />
        <polygon points="106,200 180,224 253,200 253,209 180,234 106,209" fill="#a89d87" />

        <g fill="#fff7de" stroke="#c7b99d" strokeWidth="2">
          <path d="M121 154l8 3v37l-8-3z" />
          <path d="M146 162l8 3v38l-8-3z" />
          <path d="M205 162l8-3v38l-8 3z" />
          <path d="M230 154l8-3v37l-8 3z" />
        </g>
        <g fill="#74b5aa" stroke="#e8dfc6" strokeWidth="2">
          <path d="M131 158l8 2v17l-8-2z" />
          <path d="M218 160l8-2v17l-8 2z" />
          <path d="M169 175l8 2v18l-8-2z" />
          <path d="M184 177l8-2v18l-8 2z" />
        </g>
        <path d="M169 194v-18q11-7 22 0v18z" fill="#668c82" stroke="#f8efd7" strokeWidth="3" />
        <path d="M177 194v-13q4-3 7 0v13z" fill="#b4d4c5" />

        <polygon points="112,145 180,122 248,145 180,169" fill="#fff9e7" stroke="#c8bda3" strokeWidth="2" />
        <polygon points="96,144 180,115 264,144 180,173" fill="#e8ddc3" />
        <polygon points="88,140 180,108 272,140 180,172" fill="url(#hallRoof)" stroke="#c6b99d" strokeWidth="2" />
        <polygon points="99,138 180,111 261,138 180,166" fill="#fff9e8" />

        <path d="M132 111c5-26 25-46 48-51 23 5 43 25 48 51l-48 18z" fill="url(#hallDome)" stroke="#b4a889" strokeWidth="2" />
        <ellipse cx="180" cy="111" rx="48" ry="14" fill="#c9bb98" />
        <ellipse cx="180" cy="106" rx="47" ry="13" fill="#e5d8b6" />
        <ellipse cx="180" cy="60" rx="11" ry="6" fill="#f5efd9" />
        <circle cx="180" cy="57" r="3" fill="#fffdf1" />
        <ellipse cx="157" cy="76" rx="5" ry="9" fill="#fffdf1" opacity="0.92" transform="rotate(26 157 76)" />
        <path d="M137 109c17 13 67 17 87 0" fill="none" stroke="#8d806b" strokeWidth="5" />
      </g>
    </svg>
  );
}

function DevelopmentIllustration({ level }: { level: number }) {
  const buildings = Math.max(1, Math.min(4, level));
  return (
    <svg
      className="development-illustration-svg"
      viewBox="0 0 92 64"
      aria-hidden="true"
      focusable="false"
    >
      <ellipse cx="46" cy="56" rx="39" ry="5" fill="#7c956e" opacity="0.25" />
      <path d="M7 49l38-13 40 13-39 13z" fill="#8db664" />
      <path d="M16 48l29-10 31 10-30 10z" fill="#b2ce7c" />
      {buildings < 4 ? (
        <g transform={buildings === 1 ? "translate(18 2)" : buildings === 2 ? "translate(5 5) scale(.72)" : "translate(13 0) scale(.86)"}>
          <path d="M13 30l22-13 22 13-22 13z" fill="#d47c60" />
          <path d="M13 30l22 13v17L13 48z" fill="#fff2d7" />
          <path d="M35 43l22-13v18L35 60z" fill="#e5bd86" />
          <path d="M10 29l25-15 25 15-25 15z" fill="#e98662" />
          <path d="M13 28l22-13 22 13-22 13z" fill="#f5a06b" />
          <path d="M22 34l6 3v8l-6-3zM42 39l7-4v8l-7 4z" fill="#6fb8bd" />
          <path d="M32 49v10l7-4v-10z" fill="#986d53" />
          {buildings >= 2 && (
            <>
              <path d="M19 29v-8l14-8v8z" fill="#fff1d5" />
              <path d="M33 21l15-9v8l-15 9z" fill="#e2bd88" />
              <path d="M17 21l17-10 17 10-17 10z" fill="#d8785a" />
              <path d="M22 21l12-7 13 7-13 7z" fill="#f2a16a" />
              <path d="M27 23l5 3v5l-5-3z" fill="#74b8b8" />
            </>
          )}
          {buildings >= 3 && (
            <>
              <path d="M5 38l10-6 10 6v12l-10 6-10-6z" fill="#f6e5c4" />
              <path d="M5 38l10-6 10 6-10 6z" fill="#d98566" />
              <path d="M9 42l3 2v5l-3-2zM17 46l4-2v5l-4 2z" fill="#70b6b6" />
            </>
          )}
        </g>
      ) : (
        <g>
          <path d="M28 14h36v39H28z" fill="#f3e6c8" />
          <path d="M64 14l11-6v39l-11 6z" fill="#d2bd98" />
          <path d="M24 14l40-4 12 5-40 5z" fill="#d97f60" />
          <path d="M34 22h7v7h-7zM47 22h7v7h-7zM34 34h7v7h-7zM47 34h7v7h-7z" fill="#70b8bc" />
          <path d="M58 21l7-1v7l-7 1zM58 34l7-1v7l-7 1z" fill="#70a9b3" />
          <path d="M40 45h11v8H40z" fill="#987253" />
          <path d="M31 13l3-9h23l3 9z" fill="#f5d98a" />
        </g>
      )}
    </svg>
  );
}

function eventHeading(message: string) {
  const text = message.toLowerCase();
  if (text.includes("rent")) return "RENT PAID";
  if (text.includes("bought") || text.includes("acquired")) return "PROPERTY ACQUIRED";
  if (text.includes("developed") || text.includes("upgrade")) return "PROPERTY UPGRADED";
  if (text.includes("landed on")) return "PROPERTY LANDING";
  if (text.includes("passed on")) return "PROPERTY PASSED";
  if (text.includes("property tax")) return "PROPERTY TAX";
  if (text.includes("power") || text.includes("claimed")) return "SPECIAL POWER";
  if (text.includes("turn")) return "TURN CHANGE";
  if (text.includes("bank") || text.includes("collected")) return "BANK OUTCOME";
  return "CITY UPDATE";
}

function PropertyCard({
  tile,
  owner,
  rent,
  ownedInGroup,
  groupSize,
  developmentLevel,
  pending,
  canDevelop,
  canAffordDevelopment,
  player,
  onBuy,
  onPass,
  onBuild,
  onClose,
  sell,
}: {
  tile: Tile;
  owner?: Player;
  rent: number;
  ownedInGroup: number;
  groupSize: number;
  developmentLevel: number;
  pending: boolean;
  canDevelop: boolean;
  canAffordDevelopment: boolean;
  player: Player;
  onBuy: () => void;
  onPass: () => void;
  onBuild: (propertyId: string) => void;
  onClose: () => void;
  sell?: { reason: string | null; onSell: (propertyId: string) => void } | null;
}) {
  const [confirmingSale, setConfirmingSale] = useState(false);
  const schedule = tile.rentSchedule;
  const salePrice = fmt(tile.sellValue ?? 0);
  const levels = RULES.development.levels;
  const canBuy = pending && tile.price !== undefined && player.cash >= tile.price;
  return (
    <article className={`center-card property-card ${pending ? "purchase-card" : "inspect-card"}`} aria-label={`${tile.name} property details`}>
      <header className="property-card-header" style={{ "--card-tone": tile.tone || "#527fb2" } as CSSProperties}>
        <div>
          <span>{tile.group ? `GROUP ${tile.group}` : tile.kind.toUpperCase()} · SCAM CITY</span>
          <h2>{tile.name}</h2>
        </div>
        {!pending && (
          <button className="card-close" onClick={onClose} aria-label="Close property details">
            <X size={17} />
          </button>
        )}
      </header>
      <div className="property-card-body">
        <div className="property-metrics">
          <div><span>VALUE</span><b>{tile.price !== undefined ? fmt(tile.price) : "—"}</b></div>
          <div><span>RENT</span><b>{fmt(rent)}</b></div>
          <div><span>SELL PRICE</span><b>{tile.sellValue !== undefined ? fmt(tile.sellValue) : "—"}</b></div>
        </div>
        {owner ? (
          <div className="property-owner-chip">
            <i style={{ background: owner.avatar }} />
            OWNED BY <b>{owner.name}</b>
            {tile.group && <span>{ownedInGroup}/{groupSize} SET</span>}
          </div>
        ) : tile.kind === "tax" ? (
          <div className="property-owner-chip">BANK FEE · {fmt(tile.taxAmount ?? 0)}</div>
        ) : tile.price !== undefined ? (
          <div className="property-owner-chip unowned-property">AVAILABLE TO BUY</div>
        ) : null}
        {schedule && (
          <section className="rent-schedule" aria-label="Rent by ownership count">
            <div className="card-section-heading">
              <span>RENT BY OWNERSHIP</span>
              <small>{tile.group ? `${ownedInGroup}/${groupSize} OWNED` : "GROUP SCHEDULE"}</small>
            </div>
            <div className="ownership-rents">
              {[
                { label: tile.kind === "city" ? "1 PROPERTY" : "1 OWNED", amount: schedule.one },
                { label: tile.kind === "city" ? "2 SAME COLOUR" : "2 OWNED", amount: schedule.two },
                { label: tile.kind === "city" ? "FULL GROUP" : "3 OWNED", amount: schedule.three },
              ].map((step, index) => (
                <div className={`ownership-rent ${owner && ownedInGroup === index + 1 ? "rent-current" : ""}`} key={step.label}>
                  <span>{step.label}</span><b>{fmt(step.amount)}</b>
                </div>
              ))}
            </div>
          </section>
        )}
        {tile.kind === "city" && schedule?.development && (
          <section className="development-schedule" aria-label="Development rent levels">
            <div className="card-section-heading">
              <span>DEVELOPMENT</span>
              <small>{owner && developmentLevel > 0 ? `${levels[developmentLevel - 1]} BUILT` : "BUILD IN ORDER"}</small>
            </div>
            <div className="development-levels">
              {schedule.development.map((amount, index) => (
                <div className={`development-level-card ${owner && developmentLevel === index + 1 ? "level-current" : ""}`} key={levels[index]}>
                  <DevelopmentIllustration level={index + 1} />
                  <span>{levels[index].replace("HOTEL ", "H")}</span>
                  <b>{fmt(amount)}</b>
                </div>
              ))}
            </div>
            <div className="building-cost-line">
              <span>BUILD COST</span><b>{fmt(tile.developmentCost ?? 0)} / LEVEL</b>
              {tile.repairCost !== undefined && <><i /><span>REPAIR</span><b>{fmt(tile.repairCost)}</b></>}
            </div>
          </section>
        )}
        {!schedule && tile.kind === "tax" && (
          <div className="tile-info-note">Landing here costs <b>{fmt(tile.taxAmount ?? 0)}</b>, paid to the bank.</div>
        )}
        {tile.mortgageValue !== undefined && (
          <div className="mortgage-line"><span>Mortgage {fmt(tile.mortgageValue)}</span><span>Redeem {fmt(tile.unmortgageCost ?? 0)}</span></div>
        )}
      </div>
      <footer className="property-card-actions">
        {pending ? (
          <>
            <button className="property-action secondary-action" onClick={onPass}>PASS</button>
            {canBuy ? (
              <button className="property-action primary-action" onClick={onBuy}>BUY · {fmt(tile.price ?? 0)}</button>
            ) : (
              <div className="cannot-buy-note">Need {fmt(tile.price ?? 0)} cash to buy</div>
            )}
          </>
        ) : canDevelop && tile.price !== undefined ? (
          canAffordDevelopment ? (
            <button className="property-action primary-action build-action" onClick={() => onBuild(tile.id)}>
              <Building2 size={17} /> BUILD {levels[developmentLevel]} · {fmt(tile.developmentCost ?? 0)}
            </button>
          ) : (
            <div className="cannot-buy-note">Need {fmt(tile.developmentCost ?? 0)} cash to build</div>
          )
        ) : (
          <span className="card-inspection-label">{owner ? "PROPERTY DETAILS" : "PUBLIC TILE DETAILS"}</span>
        )}
        {sell && !pending && (
          <div className="sell-row">
            {sell.reason ? (
              <>
                <button type="button" className="property-action sell-action" disabled aria-label={`Sell ${tile.name}, not available`}>
                  SELL · {salePrice}
                </button>
                <span className="sell-blocked">{sell.reason}</span>
              </>
            ) : confirmingSale ? (
              <>
                <button type="button" className="property-action secondary-action" onClick={() => setConfirmingSale(false)}>
                  KEEP
                </button>
                <button
                  type="button"
                  className="property-action sell-action confirm"
                  onClick={() => {
                    setConfirmingSale(false);
                    sell.onSell(tile.id);
                  }}
                >
                  CONFIRM SALE · {salePrice}
                </button>
              </>
            ) : (
              <button
                type="button"
                className="property-action sell-action"
                aria-label={`Sell ${tile.name} to the Bank for ${salePrice}`}
                onClick={() => setConfirmingSale(true)}
              >
                SELL · {salePrice}
              </button>
            )}
          </div>
        )}
      </footer>
    </article>
  );
}

function playerById(game: GameState, id: string | null | undefined) {
  return id ? game.players.find((candidate) => candidate.id === id) : undefined;
}

function ownerOfProperty(game: GameState, propertyId: string) {
  return playerById(game, game.owners[propertyId]);
}

const powerName = (kind: PowerId | null) =>
  POWER_OPTIONS.find((power) => power.id === kind)?.name ?? "SUPER POWER";

const powerIcon = (kind: PowerId | null) =>
  POWER_OPTIONS.find((power) => power.id === kind)?.icon ?? "✦";

const plural = (count: number, word: string) =>
  `${count} ${word}${count === 1 ? "" : "s"}`;

/** The live interaction, normalised so a bare "power" phase reads as choosing. */
function interactionOf(game: GameState, fallbackInitiator: string): PowerInteraction {
  return (
    game.powerInteraction ?? {
      id: 0,
      kind: null,
      step: "CHOOSE",
      initiatorId: fallbackInitiator,
      target: null,
      give: null,
      targetOwner: null,
      offerFrom: null,
      offers: {},
      drafts: {},
      declined: [],
      deadline: null,
    }
  );
}

function WaitingCard({ player, tile, phase }: { player: Player; tile: Tile | null; phase: "decision" | "power" }) {
  return (
    <section className="center-card waiting-card" role="status" aria-live="polite">
      <div className="waiting-icon"><span>{phase === "power" ? "✦" : "…"}</span></div>
      <span className="interaction-kicker">{phase === "power" ? "SUPER POWER IN PROGRESS" : "PROPERTY DECISION IN PROGRESS"}</span>
      <h2 className="waiting-name">
        <i style={{ background: player.avatar }} /> Waiting for {player.name}…
      </h2>
      <p>{phase === "decision" ? `${tile?.name ?? "Property"} · Player is deciding whether to buy or pass.` : "Player is choosing or resolving a Super Power. Only they can act."}</p>
      <div className="waiting-public-note">The board and public game events stay visible to everyone.</div>
    </section>
  );
}

function PowerBox({
  label,
  tile,
  game,
  rent,
  afterRent,
  empty,
  onClick,
  selected,
}: {
  label: string;
  tile?: Tile;
  game: GameState;
  rent?: number;
  afterRent?: number;
  empty?: string;
  onClick?: () => void;
  selected?: boolean;
}) {
  const owner = tile ? ownerOfProperty(game, tile.id) : undefined;
  const level = tile ? game.buildings[tile.id] ?? 0 : 0;
  const body = tile ? (
    <>
      <span className="sp-box-label">{label}</span>
      <b className="sp-box-name">{tile.name}</b>
      <small className="sp-box-owner">{owner ? `OWNER ${owner.name.toUpperCase()}` : "UNOWNED"}</small>
      <span className="sp-box-rent">
        RENT {fmt(rent ?? 0)}
        {afterRent !== undefined && <> → <em>{fmt(afterRent)}</em></>}
      </span>
      {level > 0 && <span className="sp-box-tag">{RULES.development.levels[level - 1]}</span>}
    </>
  ) : (
    <>
      <span className="sp-box-label">{label}</span>
      <span className="sp-box-empty">{empty ?? "EMPTY"}</span>
    </>
  );
  const style = { "--owner": owner?.avatar ?? "#c9c4b8" } as CSSProperties;
  if (onClick) {
    return (
      <button
        type="button"
        className={`sp-box ${tile ? "sp-box-filled" : "sp-box-empty-state"} ${selected ? "sp-box-selected" : ""}`}
        style={style}
        onClick={onClick}
        aria-label={tile ? `${label}: ${tile.name}` : label}
      >
        {body}
      </button>
    );
  }
  return (
    <div className={`sp-box ${tile ? "sp-box-filled" : "sp-box-empty-state"}`} style={style} aria-label={tile ? `${label}: ${tile.name}` : label}>
      {body}
    </div>
  );
}

function SuperPowerPanel({
  game,
  interaction: i,
  viewerId,
  timerText,
  focusTile,
  onSelect,
  onConfirm,
  onDecline,
  onCancel,
}: {
  game: GameState;
  interaction: PowerInteraction;
  viewerId: string;
  timerText: string;
  focusTile: Tile | null;
  onSelect: (propertyId: string) => void;
  onConfirm: () => void;
  onDecline: () => void;
  onCancel: () => void;
}) {
  const kind = i.kind;
  const initiator = playerById(game, i.initiatorId);
  const isInitiator = i.initiatorId === viewerId;
  const actors = powerActorIds(game);
  const canAct = actors.includes(viewerId);
  const eligible = powerEligibleIds(game, viewerId);
  const selectedIds = powerSelectedIds(game, viewerId);
  const focusEligible = focusTile && canAct && eligible.includes(focusTile.id) ? focusTile : null;
  const waiting = actors.filter((id) => id !== viewerId).map((id) => playerById(game, id)).filter(Boolean) as Player[];
  const offerEntries = Object.entries(i.offers);
  const offerPlayers = offerEntries.map(([playerId, propertyId]) => ({
    player: playerById(game, playerId),
    tile: BOARD.find((tile) => tile.id === propertyId),
  }));
  const tileOf = (id: string | null) => (id ? BOARD.find((tile) => tile.id === id) : undefined);
  const targetTile = tileOf(i.target);
  const giveTile = tileOf(i.give);
  const myDraft = tileOf(i.drafts[viewerId] ?? null);
  const offeredTile = i.offerFrom ? tileOf(i.offers[i.offerFrom] ?? null) : undefined;
  const option = POWER_OPTIONS.find((power) => power.id === kind);
  const tone = option?.color ?? "#d7ac44";

  let kicker = "SUPER POWER";
  let instruction = "";
  let primary: { label: string; enabled: boolean } | null = null;
  let decline = false;

  switch (i.step) {
    case "BOMB_TARGET":
      kicker = `BOMB · ${timerText}`;
      instruction = isInitiator
        ? "Select a rival property on the board. The bomb halves its rent. Ownership does not change."
        : `${initiator?.name ?? "The player"} is choosing a BOMB target.`;
      primary = { label: "RELEASE", enabled: Boolean(targetTile && eligible.includes(i.target ?? "")) };
      break;
    case "SWAP_OPPONENT":
      kicker = `POWER SWAP · STEP 1 OF 2 · ${timerText}`;
      instruction = isInitiator
        ? "Select an opponent's property first. This is the property you RECEIVE."
        : `${initiator?.name ?? "The player"} is choosing a rival property to receive.`;
      break;
    case "SWAP_OWN":
      kicker = `POWER SWAP · STEP 2 OF 2 · ${timerText}`;
      instruction = isInitiator
        ? "Now select one of your properties to GIVE. The rival property stays locked until you confirm."
        : `${initiator?.name ?? "The player"} is choosing a property to give.`;
      primary = { label: "POWER SWAP", enabled: Boolean(targetTile && giveTile) };
      break;
    case "AUCTION_INITIATOR":
      kicker = `AUCTION · ${timerText}`;
      instruction = isInitiator
        ? "Offer one of your properties. Rival players may then each submit one offer."
        : `${initiator?.name ?? "The player"} is choosing a property to offer.`;
      primary = { label: "CONFIRM PROPERTY", enabled: Boolean(targetTile) };
      break;
    case "AUCTION_OFFERS":
      kicker = `AUCTION · OFFERS OPEN · ${timerText}`;
      if (isInitiator) {
        instruction = offerEntries.length
          ? offeredTile
            ? "Review both properties side by side, then TRADE to complete the exchange."
            : "Click an offer below to select it, then TRADE."
          : "Waiting for rival offers. Click an offer to review it.";
        primary = { label: "TRADE", enabled: Boolean(i.offerFrom && offeredTile && targetTile) };
      } else if (canAct) {
        instruction = "Select one of your properties to offer, then submit, or pass.";
        primary = { label: "SUBMIT OFFER", enabled: Boolean(myDraft && !i.offers[viewerId]) };
        decline = true;
      } else {
        instruction = i.offers[viewerId]
          ? "Your offer is in. Waiting for the other players."
          : "You passed on this Auction. Waiting for the other players.";
      }
      break;
    default:
      instruction = "";
  }

  const actionLabel = (tile: Tile) => {
    const owner = ownerOfProperty(game, tile.id);
    switch (i.step) {
      case "BOMB_TARGET":
        return "SELECT TARGET";
      case "SWAP_OPPONENT":
        return "SELECT TO RECEIVE";
      case "SWAP_OWN":
        return owner?.id === viewerId ? "SELECT TO GIVE" : "SELECT TO RECEIVE";
      case "AUCTION_INITIATOR":
        return "SELECT TO OFFER";
      case "AUCTION_OFFERS":
        return isInitiator ? "SELECT THIS OFFER" : "SELECT TO OFFER";
      default:
        return "SELECT";
    }
  };

  const boxes = (() => {
    switch (i.step) {
      case "BOMB_TARGET":
        return (
          <PowerBox
            label="TARGET"
            tile={targetTile}
            game={game}
            rent={targetTile ? currentRent(game, targetTile.id) : undefined}
            afterRent={targetTile ? bombedRent(currentRent(game, targetTile.id)) : undefined}
            empty="SELECT A RIVAL PROPERTY"
          />
        );
      case "SWAP_OPPONENT":
      case "SWAP_OWN":
        return (
          <>
            <PowerBox label="YOU RECEIVE" tile={targetTile} game={game} rent={targetTile ? currentRent(game, targetTile.id) : undefined} empty="RIVAL PROPERTY" selected />
            <PowerBox label="YOU GIVE" tile={giveTile} game={game} rent={giveTile ? currentRent(game, giveTile.id) : undefined} empty={i.step === "SWAP_OWN" ? "YOUR PROPERTY" : "LOCKED"} selected />
          </>
        );
      case "AUCTION_INITIATOR":
        return <PowerBox label="YOUR OFFER" tile={targetTile} game={game} rent={targetTile ? currentRent(game, targetTile.id) : undefined} empty="YOUR PROPERTY" />;
      case "AUCTION_OFFERS":
        if (isInitiator && offeredTile && targetTile) {
          return (
            <>
              <PowerBox label="YOU GIVE" tile={targetTile} game={game} rent={currentRent(game, targetTile.id)} />
              <PowerBox label="YOU RECEIVE" tile={offeredTile} game={game} rent={currentRent(game, offeredTile.id)} />
            </>
          );
        }
        return (
          <div className="sp-offer-grid">
            <PowerBox label="YOUR OFFER" tile={targetTile} game={game} rent={targetTile ? currentRent(game, targetTile.id) : undefined} />
            {offerPlayers.map(({ player, tile }) =>
              tile ? (
                <Fragment key={player?.id ?? tile.id}>
                  <PowerBox
                    label={`OFFER · ${player?.name.toUpperCase() ?? ""}`}
                    tile={tile}
                    game={game}
                    rent={currentRent(game, tile.id)}
                    onClick={isInitiator ? () => onSelect(tile.id) : undefined}
                    selected={i.offerFrom === player?.id}
                  />
                </Fragment>
              ) : null,
            )}
            {canAct && myDraft && <PowerBox label="YOUR DRAFT" tile={myDraft} game={game} rent={currentRent(game, myDraft.id)} />}
          </div>
        );
      default:
        return null;
    }
  })();

  return (
    <section className="center-card super-power-panel" aria-label={`${powerName(kind)} interaction`} style={{ "--power-tone": tone } as CSSProperties}>
      <header className="sp-header">
        <span className="power-icon" aria-hidden="true">{powerIcon(kind)}</span>
        <div>
          <span className="sp-kicker">{kicker}</span>
          <h2>{powerName(kind)}</h2>
        </div>
        {initiator && (
          <span className="sp-initiator" style={{ "--player-color": initiator.avatar } as CSSProperties}>
            <i /> {initiator.name}
          </span>
        )}
      </header>
      <p className="sp-status" role="status" aria-live="polite">
        {canAct ? instruction : ""}
      </p>
      {!canAct && (
        <div className="sp-waiting" role="status">
          {waiting.length ? (
            waiting.map((player) => (
              <span key={player.id} className="sp-waiting-name">
                <i style={{ background: player.avatar }} /> Waiting for player {player.name}…
              </span>
            ))
          ) : (
            <span>{instruction}</span>
          )}
        </div>
      )}
      {i.step === "AUCTION_OFFERS" && (
        <div className="sp-auction-summary">
          {plural(offerEntries.length, "offer")} in · {plural(i.declined.length, "pass")} · {plural(Math.max(0, game.players.length - 1 - offerEntries.length - i.declined.length), "pending")}
        </div>
      )}
      <div className={`sp-boxes sp-boxes-${i.step === "SWAP_OPPONENT" || i.step === "SWAP_OWN" || (i.step === "AUCTION_OFFERS" && isInitiator && offeredTile) ? "pair" : "single"}`}>
        {boxes}
      </div>
      {focusEligible && (
        <div className="sp-cue" aria-label="Property cue card">
          <span className="sp-cue-strip" style={{ background: ownerOfProperty(game, focusEligible.id)?.avatar ?? "#c9c4b8" }} />
          <div className="sp-cue-copy">
            <span>{focusEligible.group ? `GROUP ${focusEligible.group}` : focusEligible.kind.toUpperCase()}</span>
            <b>{focusEligible.name}</b>
            <small>
              {ownerOfProperty(game, focusEligible.id)?.name ?? "Unowned"} · RENT {fmt(currentRent(game, focusEligible.id))}
              {i.step === "BOMB_TARGET" && <> → {fmt(bombedRent(currentRent(game, focusEligible.id)))}</>}
            </small>
          </div>
          <span className={`sp-state ${selectedIds.includes(focusEligible.id) ? "sp-state-selected" : "sp-state-eligible"}`}>
            {selectedIds.includes(focusEligible.id) ? "SELECTED" : "ELIGIBLE"}
          </span>
          <button type="button" className="property-action primary-action sp-cue-action" onClick={() => onSelect(focusEligible.id)}>
            {actionLabel(focusEligible)}
          </button>
        </div>
      )}
      <footer className="sp-actions">
        {isInitiator && (
          <button type="button" className="property-action secondary-action sp-cancel" onClick={onCancel}>
            CANCEL
          </button>
        )}
        {decline && (
          <button type="button" className="property-action secondary-action sp-cancel" onClick={onDecline}>
            NO OFFER
          </button>
        )}
        {primary && canAct && (
          <button type="button" className="property-action primary-action sp-primary" disabled={!primary.enabled} onClick={onConfirm}>
            {primary.label}
          </button>
        )}
        {!primary && i.step !== "AUCTION_OFFERS" && <span className="sp-hint">Click a highlighted property on the board.</span>}
      </footer>
    </section>
  );
}

function PowerChoicePanel({
  player,
  timerText,
  availability,
  canChoose,
  onChoose,
  onCancel,
}: {
  player: Player;
  timerText: string;
  availability: Record<PowerId, string | null>;
  canChoose: boolean;
  onChoose: (id: PowerId) => void;
  onCancel: () => void;
}) {
  return (
    <section className="center-card power-card super-power-panel" aria-label="Super Power selection">
      <header className="power-card-header">
        <span className="power-icon"><Sparkles size={20} /></span>
        <div><span>SPECIAL POWER · {timerText}</span><h2>Choose your edge</h2></div>
      </header>
      <p className="sp-status" role="status">{player.name} landed on SUPER POWER. Pick one of the four powers.</p>
      <div className="power-card-options">
        {POWER_OPTIONS.map((power) => {
          const blocked = availability[power.id as PowerId];
          return (
            <button
              className="power-card-option"
              key={power.id}
              disabled={!canChoose || Boolean(blocked)}
              onClick={() => onChoose(power.id as PowerId)}
              style={{ "--power-tone": power.color } as CSSProperties}
              title={blocked ?? undefined}
            >
              <span className="power-option-symbol">{power.icon}</span>
              <span><b>{power.name}</b><small>{blocked ?? power.description}</small></span>
              <ArrowUpRight size={15} />
            </button>
          );
        })}
      </div>
      <footer className="power-card-actions">
        <span>FOR {player.name.toUpperCase()} · CHOICE LOCKS WHEN SELECTED</span>
        {canChoose && (
          <button className="property-action secondary-action sp-cancel" onClick={onCancel}>CANCEL</button>
        )}
      </footer>
    </section>
  );
}

const flashHeading: Record<PowerEvent["kind"], string> = {
  bomb: "BOMB HIT",
  "power-swap": "POWER SWAP COMPLETE",
  auction: "AUCTION COMPLETE",
  "rent-free": "RENT FREE ACTIVE",
  "rent-blocked": "RENT BLOCKED",
  "rent-free-ended": "RENT FREE ENDED",
  "power-cancelled": "POWER CANCELLED",
  "power-timeout": "POWER TIMED OUT",
  "auction-expired": "AUCTION EXPIRED",
};

export function PowerFlash({ event }: { event: PowerEvent }) {
  return (
    <div className={`power-flash power-flash-${event.kind}`} role="status" aria-live="polite">
      <span>{flashHeading[event.kind]}</span>
      <strong>{event.text}</strong>
    </div>
  );
}

/** Rent Free protection status. Stays visible until the server expires it. */
export function RentFreeStrip({ game }: { game: GameState }) {
  const entries = Object.entries(game.rentFree ?? {});
  if (!entries.length) return null;
  return (
    <>
      {entries.map(([playerId, status]) => {
        const player = playerById(game, playerId);
        if (!player) return null;
        return (
          <div className="rent-free-strip" key={playerId} role="status" style={{ "--player-color": player.avatar } as CSSProperties}>
            <span className="rf-dot" aria-hidden="true" />
            <b>RENT FREE ACTIVE</b>
            <span className="rf-player">{player.name}</span>
            <span className="rf-circuits">{plural(status.remainingCircuits, "circuit")} left</span>
            <small>Protection ends after {plural(status.remainingCircuits, "more START crossing")}.</small>
          </div>
        );
      })}
    </>
  );
}

export function BoardCenter(props: BoardCenterProps) {
  const {
    game,
    player,
    isMyTurn,
    viewerId,
    pendingTile,
    displayTile,
    tileOwner,
    ownedInGroup,
    groupSize,
    activeRent,
    developmentLevel,
    canDevelop,
    canAffordDevelopment,
    timerText,
    eventText,
    rolling,
    motionActive,
    focusTile,
    flash,
    onRoll,
    onBuy,
    onPass,
    onBuild,
    onChoosePower,
    onPassPower,
    onCloseTile,
    sellReason,
    onSell,
    onPowerSelect,
    onPowerConfirm,
    onPowerDecline,
    onPowerCancel,
  } = props;

  if (game.phase === "decision") {
    return (
      <div className="board-center board-interaction board-center-decision">
        {isMyTurn && pendingTile ? (
          <PropertyCard
            tile={pendingTile}
            owner={tileOwner}
            rent={activeRent}
            ownedInGroup={ownedInGroup}
            groupSize={groupSize}
            developmentLevel={developmentLevel}
            pending
            canDevelop={false}
            canAffordDevelopment={false}
            player={player}
            onBuy={onBuy}
            onPass={onPass}
            onBuild={onBuild}
            onClose={onCloseTile}
          />
        ) : (
          <WaitingCard player={player} tile={pendingTile} phase="decision" />
        )}
        <RentFreeStrip game={game} />
      </div>
    );
  }

  if (game.phase === "power") {
    const interaction = interactionOf(game, player.id);
    const initiator = playerById(game, interaction.initiatorId) ?? player;
    const choosing = interaction.kind === null || interaction.step === "CHOOSE";
    const viewerIsInitiator = interaction.initiatorId === viewerId;
    return (
      <div className={`board-center board-interaction board-center-power ${choosing ? "board-center-power-choose" : "board-center-power-action"}`}>
        {choosing ? (
          viewerIsInitiator || isMyTurn ? (
            <PowerChoicePanel
              player={initiator}
              timerText={timerText}
              availability={powerAvailability(game, initiator.id)}
              canChoose={viewerIsInitiator || isMyTurn}
              onChoose={onChoosePower}
              onCancel={onPassPower}
            />
          ) : (
            <WaitingCard player={initiator} tile={null} phase="power" />
          )
        ) : (
          <SuperPowerPanel
            game={game}
            interaction={interaction}
            viewerId={viewerId}
            timerText={timerText}
            focusTile={focusTile}
            onSelect={onPowerSelect}
            onConfirm={onPowerConfirm}
            onDecline={onPowerDecline}
            onCancel={onPowerCancel}
          />
        )}
      </div>
    );
  }

  if (game.phase === "roll" && displayTile) {
    return (
      <div
        className="board-center board-interaction board-center-inspect"
        key={displayTile.id}
      >
        {flash && <PowerFlash event={flash} />}
        <RentFreeStrip game={game} />
        <PropertyCard
          tile={displayTile}
          owner={tileOwner}
          rent={activeRent}
          ownedInGroup={ownedInGroup}
          groupSize={groupSize}
          developmentLevel={developmentLevel}
          pending={false}
          canDevelop={canDevelop}
          canAffordDevelopment={canAffordDevelopment}
          player={player}
          onBuy={onBuy}
          onPass={onPass}
          onBuild={onBuild}
          onClose={onCloseTile}
          sell={
            tileOwner?.id === viewerId && onSell
              ? { reason: sellReason?.(displayTile.id) ?? null, onSell }
              : null
          }
        />
      </div>
    );
  }

  const lastRoll = game.lastRoll ?? game.lastLanding?.roll ?? null;
  const winner = game.players.find((candidate) => candidate.id === game.winner);
  if (game.phase === "finished") {
    return (
      <div className="board-center board-center-finished">
        <div className="winner-center-card">
          <span className="winner-icon">♛</span>
          <span className="interaction-kicker">SCAM CITY · FINAL RESULT</span>
          <h2>{winner ? `${winner.name} wins` : "Game complete"}</h2>
          {winner && <p>{fmt(winner.cash)} cash · {winner.properties.length} properties</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={`board-center board-center-roll ${isMyTurn ? "my-center-turn" : ""}`}>
      <div className="center-topline">
        <span>✦ LIVE CITY · ROUND {game.round}</span>
        <span className="center-round">{isMyTurn ? "YOUR MOVE" : `${player.name.toUpperCase()} TO ACT`}</span>
      </div>
      {flash && <PowerFlash event={flash} />}
      <RentFreeStrip game={game} />
      <div className="center-art"><CityHallIllustration /></div>
      <div className="center-brand-title">SCAM CITY <span>✦</span></div>
      <div className="center-sub">BUILD YOUR EMPIRE · TRUST NOBODY</div>
      {eventText && (
        <div className="center-event" role="status" aria-live="polite">
          <span>{eventHeading(eventText)}</span>
          <strong>{eventText}</strong>
        </div>
      )}
      <div className="center-controls">
        <div className="center-dice-result" aria-label={lastRoll ? `Last roll ${lastRoll}` : "Dice ready"}>
          <span className={`dice-face ${lastRoll ? "" : "dice-idle"}`}>{lastRoll ?? "⚄"}</span>
          <span><small>{game.lastRoll === 6 ? "BONUS ROLL" : lastRoll ? "LAST ROLL" : "DICE READY"}</small><b>{game.lastRoll === 6 ? "Same player rolls again" : "1–5 passes after resolution"}</b></span>
        </div>
        {isMyTurn ? (
          <button className={`roll-button ${rolling ? "rolling-dice" : ""}`} disabled={rolling || motionActive} onClick={onRoll}>
            <Dices size={18} /> {rolling ? "ROLLING…" : game.lastRoll === 6 ? "ROLL AGAIN" : "ROLL DICE"}
          </button>
        ) : (
          <div className="roll-waiting-label">WAITING FOR {player.name.toUpperCase()}</div>
        )}
      </div>
      {game.activity.length > 1 && (
        <div className="center-history" aria-label="Recent public activity">
          {game.activity.slice(1, 3).map((entry, index) => <span key={`${entry}-${index}`}>{entry}</span>)}
        </div>
      )}
    </div>
  );
}
