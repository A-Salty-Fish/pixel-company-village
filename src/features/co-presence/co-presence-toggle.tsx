"use client";

import { companionLabel, companionMark } from "@/features/companion-read/companion-read";

type Props = {
  on: boolean;
  onToggle: (on: boolean) => void;
};

export function CoPresenceToggle(props: Props) {
  return (
    <button
      type="button"
      className="hud-btn hud-btn-ghost co-presence-toggle map-more-item"
      data-testid="co-presence-toggle"
      data-companion={companionMark(props.on)}
      aria-pressed={props.on}
      onClick={() => props.onToggle(!props.on)}
    >
      {companionLabel(props.on)}
    </button>
  );
}
