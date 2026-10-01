"use client";

import { GESTURE_SFX_ENABLED } from "@/features/gesture-sfx/gesture-sfx";

type Props = {
  muted: boolean;
  ambient: boolean;
  onMute: (muted: boolean) => void;
  onAmbient: (on: boolean) => void;
};

/** Map-corner toggles. Mute defaults to the existing silent comfort flag. */
export function GestureChrome({ muted, ambient, onMute, onAmbient }: Props) {
  if (!GESTURE_SFX_ENABLED) return null;
  return (
    <div className="flex gap-1" data-testid="gesture-sfx" data-module="gesture-sfx">
      <button
        type="button"
        className="hud-icon hud-icon-wide"
        data-testid="gesture-mute"
        aria-pressed={muted}
        onClick={() => onMute(!muted)}
      >
        {muted ? "静音" : "有声"}
      </button>
      <button
        type="button"
        className="hud-icon hud-icon-wide map-more-item"
        data-testid="gesture-ambient"
        aria-pressed={ambient}
        onClick={() => onAmbient(!ambient)}
      >
        氛围
      </button>
    </div>
  );
}
