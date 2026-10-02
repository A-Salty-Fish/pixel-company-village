"use client";

import { useState } from "react";
import { wavePressMark } from "@/features/wave-gift/wave-gift";

type Props = {
  label: string;
  className: string;
  disabled?: boolean;
  testId?: string;
  moduleName?: string;
  onWave: () => void;
};

/** Clearer press on the wave control. The mark is off when the flag is off. */
export function WaveButton(props: Props) {
  const [down, setDown] = useState(false);
  const release = () => setDown(false);

  return (
    <button
      type="button"
      className={props.className}
      data-testid={props.testId}
      data-module={props.moduleName}
      data-wave
      data-wave-press={wavePressMark(down)}
      disabled={props.disabled}
      onClick={props.onWave}
      onPointerDown={(event) => {
        if (event.currentTarget.disabled) return;
        setDown(true);
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onPointerLeave={release}
    >
      {props.label}
    </button>
  );
}
