"use client";

import { useEffect } from "react";
import { clearHintClock } from "@/features/today-can-do/today-can-do";

/** A visit to the gate forgets the previous half-minute, so the next map starts clean. */
export function ClearHintOnGate() {
  useEffect(() => {
    clearHintClock();
  }, []);
  return null;
}
