"use client";

type Props = {
  on: boolean;
  onToggle: (on: boolean) => void;
};

export function CoPresenceToggle(props: Props) {
  return (
    <button
      type="button"
      className="hud-btn hud-btn-ghost co-presence-toggle"
      data-testid="co-presence-toggle"
      aria-pressed={props.on}
      onClick={() => props.onToggle(!props.on)}
    >
      相伴
    </button>
  );
}
