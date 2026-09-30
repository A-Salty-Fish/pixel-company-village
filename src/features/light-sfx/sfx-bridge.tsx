"use client";

import { useEffect, useRef } from "react";
import { LIGHT_SFX_ENABLED, playUiClick, sfxAllowed } from "@/features/light-sfx/light-sfx";

/**
 * Listens for button presses. Stores only "click" / "silent" and a count.
 * Button labels are not read, so chat text cannot land here.
 */
export function LightSfxBridge({ muted, reduceMotion }: { muted: boolean; reduceMotion: boolean }) {
  const markRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!LIGHT_SFX_ENABLED) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (!target.closest("button")) return;
      const allowed = sfxAllowed({ muted, reduceMotion });
      const played = playUiClick(allowed) === "played";
      const node = markRef.current;
      if (!node) return;
      node.dataset.sfxLast = played ? "click" : "silent";
      if (played) node.dataset.sfxCount = String(Number(node.dataset.sfxCount ?? "0") + 1);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [muted, reduceMotion]);

  return (
    <span ref={markRef} data-testid="sfx-status" data-sfx-last="none" data-sfx-count="0" hidden />
  );
}
