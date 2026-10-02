"use client";

import { useEffect, useLayoutEffect, useRef, useSyncExternalStore } from "react";
import { markSloganSeen, sloganRestSnapshot, subscribeSloganRest, syncSloganRest } from "@/features/slogan-rest/slogan-rest";
import {
  APP_VERSION,
  RELEASE_BOARD_INTRO,
  RELEASE_BOARD_TITLE,
  RELEASES,
  currentRelease,
  releaseDateLabel,
  releaseNotesScrollable,
  releaseScrollDelta,
  releaseUiVisible,
  releaseWheelShouldCapture,
  shipTitle,
  versionLabel,
} from "@/features/village-release/changelog";
import styles from "@/features/village-release/release-notes.module.css";

const listeners = new Set<() => void>();
let sheetOpen = false;

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function openReleaseNotes() {
  sheetOpen = true;
  emit();
  if (typeof window !== "undefined") markSloganSeen(window.localStorage);
}

export function closeReleaseNotes() {
  sheetOpen = false;
  emit();
}

function sheetSnapshot() {
  return sheetOpen;
}

/** Header plaque. Brand stays 「像素公司村」; the ship name shares this 44px chip. */
export function ReleaseChip() {
  const rest = useSyncExternalStore(subscribeSloganRest, sloganRestSnapshot, () => false);
  useLayoutEffect(() => {
    syncSloganRest(window.localStorage);
  }, []);
  if (!releaseUiVisible()) return null;
  const title = shipTitle();
  return (
    <button
      type="button"
      className={`${styles.chip} pixel-label`}
      data-testid="village-version"
      data-version={APP_VERSION}
      data-module="village-release"
      data-slogan={rest ? "rest" : "show"}
      aria-controls="release-notes"
      onClick={openReleaseNotes}
    >
      <span className={styles.chipVersion}>{versionLabel()}</span>
      {title && !rest ? (
        <span className={styles.chipTitle} data-testid="ship-title">
          {title}
        </span>
      ) : null}
    </button>
  );
}

/** Wooden board of player-facing ships. A tap on the version chip opens it as a sheet. */
export function ReleaseNotes() {
  const open = useSyncExternalStore(subscribe, sheetSnapshot, () => false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollOn = open && releaseNotesScrollable();

  useEffect(() => {
    if (!scrollOn) return;
    const node = scrollRef.current;
    node?.focus({ preventScroll: true });
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onWheel = (event: WheelEvent) => {
      if (!releaseWheelShouldCapture(true)) return;
      const scroller = scrollRef.current;
      if (!scroller) return;
      const target = event.target;
      if (target instanceof Node && scroller.contains(target)) return;
      event.preventDefault();
      scroller.scrollTop += event.deltaY;
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const scroller = scrollRef.current;
      if (!scroller) return;
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return;
      }
      const delta = releaseScrollDelta(event.key, scroller.clientHeight || 320);
      if (!delta) return;
      event.preventDefault();
      scroller.scrollTop += delta;
    };

    const onTouchMove = (event: TouchEvent) => {
      const scroller = scrollRef.current;
      if (!scroller) return;
      const target = event.target;
      if (target instanceof Node && scroller.contains(target)) return;
      event.preventDefault();
    };

    window.addEventListener("wheel", onWheel, { capture: true, passive: false });
    window.addEventListener("keydown", onKey);
    window.addEventListener("touchmove", onTouchMove, { capture: true, passive: false });
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("wheel", onWheel, { capture: true });
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("touchmove", onTouchMove, { capture: true });
    };
  }, [scrollOn]);

  if (!releaseUiVisible()) return null;
  return (
    <>
      {open ? (
        <button type="button" className={styles.scrim} aria-label="收起更新日志" onClick={closeReleaseNotes} />
      ) : null}
      <details
        id="release-notes"
        className={open ? `${styles.sheet} hud-panel` : "hud-panel"}
        data-testid="release-notes"
        data-version={APP_VERSION}
        data-module="village-release"
        data-release-sheet={open ? "1" : "0"}
        open={open}
        onToggle={(event) => {
          if (event.currentTarget.open !== open) {
            if (event.currentTarget.open) openReleaseNotes();
            else closeReleaseNotes();
          }
        }}
      >
        <summary className="hud-title cursor-pointer">
          {RELEASE_BOARD_TITLE} · {versionLabel()}
          {currentRelease()?.title ? ` · ${currentRelease()?.title}` : ""}
        </summary>
        <div
          ref={scrollRef}
          className={scrollOn ? `${styles.scroll} space-y-3 px-3 py-3 text-sm text-[#2a1a10]` : "space-y-3 px-3 py-3 text-sm text-[#2a1a10]"}
          data-testid="release-notes-scroll"
          data-release-scroll={scrollOn ? "1" : "0"}
          tabIndex={scrollOn ? 0 : undefined}
        >
          <p className="text-xs leading-5 text-[#6a3d18]">{RELEASE_BOARD_INTRO}</p>
          <ol className={styles.board}>
            {RELEASES.map((release) => (
              <li key={release.version} className={styles.release} data-release={release.version}>
                <p className="pixel-label text-[#2a1a10]">
                  {versionLabel(release.version)} · {release.title}
                </p>
                <p className={styles.date}>{releaseDateLabel(release.date)}</p>
                <ul className={styles.notes}>
                  {release.notes.map((note) => (
                    <li key={note} className={styles.note}>
                      {note}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
          {open ? (
            <button type="button" className="hud-btn hud-btn-ghost" onClick={closeReleaseNotes}>
              收起
            </button>
          ) : null}
        </div>
      </details>
    </>
  );
}
