import React, { useState } from "react";
import { X } from "lucide-react";
import {
  NET_WORTH_GOAL_OPTIONS,
  PLAYER_COUNT_OPTIONS,
  ROUND_LIMIT_OPTIONS,
  type MatchSettings,
  type NetWorthGoalOption,
  type PlayerCountOption,
  type RoundLimitOption,
} from "../../game/rules";

export function PrivateSettingsModal({
  initialSettings,
  minPlayers = 2,
  submitLabel = "NEXT",
  onClose,
  onConfirm,
}: {
  initialSettings: MatchSettings;
  minPlayers?: number;
  submitLabel?: string;
  onClose: () => void;
  onConfirm: (settings: MatchSettings) => void;
}) {
  const [maxPlayers, setMaxPlayers] = useState<PlayerCountOption>(
    initialSettings.maxPlayers,
  );
  const [roundLimit, setRoundLimit] = useState<RoundLimitOption>(
    initialSettings.roundLimit,
  );
  const [targetNetWorth, setTargetNetWorth] = useState<NetWorthGoalOption>(
    initialSettings.targetNetWorth,
  );

  return (
    <div
      className="modal-scrim settings-scrim"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Private game settings"
    >
      <section
        className="private-settings-sheet"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="ps-head">
          <h2>SETTINGS</h2>
          <button
            type="button"
            className="ps-close"
            onClick={onClose}
            aria-label="Close settings"
          >
            <X size={18} />
          </button>
        </header>

        <div className="ps-group">
          <span className="ps-label">Game Mode</span>
          <div className="ps-pills ps-mode-pills">
            <button
              type="button"
              className="ps-pill is-selected"
              aria-pressed="true"
            >
              LIVE
            </button>
          </div>
        </div>

        <div className="ps-group">
          <span className="ps-label">Players</span>
          <div className="ps-player-circles" role="radiogroup" aria-label="Player count">
            {PLAYER_COUNT_OPTIONS.map((count) => {
              const disabled = count < minPlayers;
              return (
                <button
                  key={count}
                  type="button"
                  disabled={disabled}
                  className={`ps-circle ${maxPlayers === count ? "is-selected" : ""}`}
                  aria-pressed={maxPlayers === count}
                  onClick={() => setMaxPlayers(count)}
                >
                  {count}
                </button>
              );
            })}
          </div>
        </div>

        <div className="ps-group">
          <span className="ps-label">Rounds</span>
          <div className="ps-pills" role="radiogroup" aria-label="Round limit">
            {ROUND_LIMIT_OPTIONS.map((opt) => {
              const selected = roundLimit === opt;
              const label = opt === null ? "UNLIMITED" : String(opt);
              return (
                <button
                  key={label}
                  type="button"
                  className={`ps-pill ${selected ? "is-selected" : ""}`}
                  aria-pressed={selected}
                  onClick={() => setRoundLimit(opt)}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="ps-group">
          <span className="ps-label">Net Worth Goal</span>
          <div className="ps-pills" role="radiogroup" aria-label="Net worth goal">
            {NET_WORTH_GOAL_OPTIONS.map((goal) => {
              const selected = targetNetWorth === goal;
              return (
                <button
                  key={goal}
                  type="button"
                  className={`ps-pill ${selected ? "is-selected" : ""}`}
                  aria-pressed={selected}
                  onClick={() => setTargetNetWorth(goal)}
                >
                  ${goal}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          className="ps-next-btn"
          onClick={() =>
            onConfirm({
              mode: "LIVE",
              maxPlayers,
              roundLimit,
              targetNetWorth,
            })
          }
        >
          {submitLabel}
        </button>
      </section>
    </div>
  );
}
