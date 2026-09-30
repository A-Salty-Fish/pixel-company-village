"use client";

import { toyDockItems } from "@/features/toy-dock/toy-dock";

type Props = {
  look: { lantern: boolean; scare: number; pebbles: number };
  pulse: string;
  disabled: boolean;
  onAct: (id: "lantern" | "scarecrow" | "pebble") => void;
};

/** Same-screen toy names. Clicks do not live under the map. */
export function ToyDock(props: Props) {
  const items = toyDockItems(props.look);
  return (
    <div className="toy-dock" data-testid="toy-dock" role="group" aria-label="地图上的小玩">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className="hud-btn hud-btn-ghost toy-dock-btn"
          data-testid={`toy-dock-${item.id}`}
          data-toy-id={item.id}
          data-toy-state={item.state}
          data-toy-pulse={props.pulse === item.id ? "1" : "0"}
          disabled={props.disabled}
          onPointerDown={(event) => event.preventDefault()}
          onClick={() => props.onAct(item.id)}
        >
          <span className="toy-dock-name">{item.label}</span>
          <span className="toy-dock-state">{item.state}</span>
        </button>
      ))}
    </div>
  );
}
