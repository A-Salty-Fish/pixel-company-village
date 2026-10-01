"use client";

import { useSyncExternalStore } from "react";
import {
  APP_VERSION,
  RELEASE_BOARD_INTRO,
  RELEASE_BOARD_TITLE,
  RELEASES,
  currentRelease,
  releaseDateLabel,
  releaseUiVisible,
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
  if (!releaseUiVisible()) return null;
  const title = shipTitle();
  return (
    <button
      type="button"
      className={`${styles.chip} pixel-label`}
      data-testid="village-version"
      data-version={APP_VERSION}
      data-module="village-release"
      aria-controls="release-notes"
      onClick={openReleaseNotes}
    >
      <span className={styles.chipVersion}>{versionLabel()}</span>
      {title ? (
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
        <div className="space-y-3 px-3 py-3 text-sm text-[#2a1a10]">
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
