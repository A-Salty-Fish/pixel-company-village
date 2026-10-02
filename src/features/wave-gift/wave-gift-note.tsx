"use client";

import { useEffect, useState } from "react";
import { WAVE_GIFT_ENABLED, waveGiftPhase, waveGiftVisible, type WaveGiftPhase } from "@/features/wave-gift/wave-gift";

type Props = {
  line: string;
  testId: string;
  className: string;
  at: number;
  still: boolean;
  moduleName?: string;
  header?: boolean;
};

/**
 * The receipt lives in this leaf so the phase tick does not redraw the map.
 * Quiet and reduced motion render the resting line on the first paint.
 */
export function WaveGiftNote(props: Props) {
  const [phase, setPhase] = useState<WaveGiftPhase>(() => waveGiftPhase(Math.max(0, Date.now() - props.at), props.still));
  const shown: WaveGiftPhase = props.still ? "still" : phase;

  useEffect(() => {
    if (!WAVE_GIFT_ENABLED || props.still) return;
    const apply = () => setPhase(waveGiftPhase(Date.now() - props.at, false));
    const kick = window.setTimeout(apply, 0);
    const id = window.setInterval(apply, 40);
    return () => {
      window.clearTimeout(kick);
      window.clearInterval(id);
    };
  }, [props.at, props.still]);

  if (!waveGiftVisible(shown)) return null;

  return (
    <p
      className={props.className}
      data-testid={props.testId}
      data-module={props.moduleName}
      data-header-wave={props.header ? "receipt" : undefined}
      data-gift={shown}
      data-motion={props.still ? "still" : shown}
    >
      {props.line}
    </p>
  );
}
