import { useLayoutEffect, useState, type CSSProperties, type RefObject } from "react";
import type { PowerEvent } from "../../game/engine";

/** Origin of every Bomb: the designated ISRAEL cue card (tile_20). */
export const BOMB_ORIGIN_TILE = "tile_20";

type Point = { x: number; y: number };

/**
 * Presentation only. Mounted solely after the server has confirmed a BOMB event
 * (never on RELEASE click), it plays one missile flight and one impact.
 */
export function MissileOverlay({
  event,
  gridRef,
}: {
  event: PowerEvent;
  gridRef: RefObject<HTMLDivElement | null>;
}) {
  const [flight, setFlight] = useState<{ from: Point; to: Point; impact: boolean } | null>(null);

  useLayoutEffect(() => {
    const grid = gridRef.current;
    const targetId = event.propertyIds[0];
    if (!grid || !targetId) return;
    const center = (tileId: string): Point | null => {
      const element = grid.querySelector<HTMLElement>(`[data-tile-id="${tileId}"]`);
      if (!element) return null;
      const origin = grid.getBoundingClientRect();
      const box = element.getBoundingClientRect();
      return {
        x: box.left - origin.left + box.width / 2,
        y: box.top - origin.top + box.height / 2,
      };
    };
    const from = center(event.fromTileId ?? BOMB_ORIGIN_TILE);
    const to = center(targetId);
    if (!from || !to) return;
    setFlight({ from, to, impact: false });
    const impactTimer = window.setTimeout(
      () => setFlight((current) => (current ? { ...current, impact: true } : current)),
      850,
    );
    const clearTimer = window.setTimeout(() => setFlight(null), 1500);
    return () => {
      window.clearTimeout(impactTimer);
      window.clearTimeout(clearTimer);
    };
  }, [event.id, event.fromTileId, event.propertyIds, gridRef]);

  if (!flight) return null;
  const { from, to, impact } = flight;
  return (
    <div className="missile-layer" aria-hidden="true">
      {!impact && (
        <span
          className="missile"
          style={
            {
              left: from.x,
              top: from.y,
              "--dx": `${to.x - from.x}px`,
              "--dy": `${to.y - from.y}px`,
            } as CSSProperties
          }
        >
          ✹
        </span>
      )}
      {impact && <span className="bomb-impact" style={{ left: to.x, top: to.y }} />}
    </div>
  );
}
