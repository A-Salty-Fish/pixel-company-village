"use client";

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

export function openReleaseNotes() {
  const panel = document.getElementById("release-notes");
  if (!(panel instanceof HTMLDetailsElement)) return;
  panel.open = true;
  panel.scrollIntoView({ block: "start" });
}

/** Current ship name, beside the brand. The brand itself stays 「像素公司村」. */
export function ShipTitle() {
  if (!releaseUiVisible()) return null;
  const title = shipTitle();
  if (!title) return null;
  return (
    <p className={`${styles.ship} pixel-label`} data-testid="ship-title" data-module="village-release">
      {title}
    </p>
  );
}

/** Header plaque. Stays off the map. */
export function ReleaseChip() {
  if (!releaseUiVisible()) return null;
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
      {versionLabel()}
    </button>
  );
}

/** Wooden board of player-facing ships. Closed until someone asks. */
export function ReleaseNotes() {
  if (!releaseUiVisible()) return null;
  return (
    <details
      id="release-notes"
      className="hud-panel"
      data-testid="release-notes"
      data-version={APP_VERSION}
      data-module="village-release"
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
      </div>
    </details>
  );
}
