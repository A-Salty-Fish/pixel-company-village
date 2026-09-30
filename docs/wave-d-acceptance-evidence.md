# Wave D acceptance evidence

Date: 2026-09-30. Gate: `pixel-village-wave-d-acceptance-2026-09-30`.

```text
SHA: PV-D-005 branch cursor/wave-d-round-7-9062 (from main 383e3c9)
npm test: PASS (31, includes weekly chore checks)
Playwright smoke: PASS (54, includes PV-D-005 viewer chore scope). Visual job stays continue-on-error with a 2% pixel tolerance.
Privacy: PASS (e2e/privacy.spec.ts)
Visual quiet/busy: PASS locally; CI job stays continue-on-error
Steam rubric final: 8.3 / 10
Prod smoke: SKIPPED (no production SITE_PASSWORD in this environment; script writes 6 PNGs when run)
Screenshot roots: docs/images/wave-d/round1/ docs/images/wave-d/round2/ e2e/visual.spec.ts-snapshots/
Known gaps: production read-only smoke was not executed here

Playtest 2026-09-30 follow-ups:
- Narrow signal card is a bottom sheet. Title and close stay together; the body scrolls; actions and the 3s undo stay in the sheet footer. The header keeps a higher layer so 「出村」 stays clickable.
- Hard refresh shows `village-boot` (“正在请名册”) with no retry button. Retry appears only when the roster request fails and the list is empty.
- Kindness confirm still offers undo for 3 seconds, now inside `signal-actions`. Covered by `e2e/wave-c.spec.ts` and the narrow sheet test.
- PV-D-003: the 3s deadline is stamped inside the undo row when that row mounts, for both 确认关照 and 匿名投喂. `e2e/undo-window.spec.ts` checks the first label is 「撤销（3秒）」, remaining time is still above 2s, the button is still there 2.5s later, and undo restores 今日 0/1. A slow confirm render no longer burns the first second before paint. Local smoke after the fix: 41 passed.
- Round 3: the signal card is a non-modal dialog. Esc returns focus to that roster row and clears the open undo so reopening does not mint a new 3s window. Narrow split, close, password, and the name picker are at least 44px. Reduced motion drops the season fade. Dusk lights house windows, the bench has a back, and the stroll is stones.
- Round 4: 本周小事 sits under the season banner. Water, diary, porch, pins, bench, a card, the gate, and the season banner check off the matching canned chore. Diary buttons show the canned sentence. Nothing is ranked or stored as free text.
- Round 5: each chore on that board is a button. One to three clicks finishes it through the existing local action, then the button stays disabled so porch, pins, and the bench are not toggled back off. Footsteps store coordinates only. The strip says 「可在村里新事里关掉」 and does not add a second switch. Local smoke: 52 passed.
- Round 6: the strip counts 本周 n/3. A started stroll shows n/3 on the button. When all three are done, the canned line 「三件都做完了。布条只挂在这台电脑上。」 appears and the map sets data-week-ribbon. Closing the card or turning the lamp and bench back off does not erase that session's finished chores. The ribbon uses the existing week-board switch. Nothing new is stored. Local smoke: 53 passed.
- PV-D-005: season notice and the gate visit were one shared session flag, so the next identity inherited the first finished chore. Those flags now live in a per-viewer book. `e2e/pv-d-005.spec.ts` checks B is 本周 0/3 with no ribbon, then A still has 3/3.
- Fresh storage: `comfortFromStorage` unit plus `a cleared profile keeps quiet village checked`.
- Stale score days label the button 「本地互动」.
- Comfort settings are grouped into 安静 / 装饰 / 名牌 / 我是谁.
```

Hard red lines: no chat text path, no Redis/Blob/KV, no shame board, love sim, or ambient audio, no secrets in git. New systems have a unit or Playwright check and a local toggle or undo.

## Steam rubric

| # | Dimension | Score |
| ---: | --- | ---: |
| R1 | First glance village | 8.5 |
| R2 | Density and layout | 8.0 |
| R3 | Identity at a glance | 8.0 |
| R4 | Nameplate craft | 8.0 |
| R5 | Depth | 8.0 |
| R6 | Terrain readability | 8.5 |
| R7 | HUD / typography | 8.5 |
| R8 | Signal card | 8.5 |
| R9 | Season / festival / night | 8.0 |
| R10 | Motion and quiet | 8.5 |
| R11 | Mobile craft | 8.0 |
| R12 | Privacy and dignity | 9.0 |
| | **Mean** | **8.3** |

No dimension is under 6. Quiet default is calmer (`data-particle-budget=0`). Shots have no chat text and no low-score board.

## Track E

| ID | Mark | Evidence |
| --- | --- | --- |
| E01 | PASS | `deriveLoadStage` returns terrain → roster → villagers → ready; `e2e/wave-c.spec.ts` hard reload |
| E02 | PASS | `forceLoadTimeout` + `load-recovery` in `e2e/wave-c.spec.ts`; refresh button `refresh-scores` |
| E03 | PASS | `e2e/wave-c.spec.ts` wrong password, Enter, 出村 |
| E04 | PASS | `e2e/acceptance.spec.ts` viewer switch keeps pins apart; `waveStorageKey` unit |
| E05 | PASS | kindness dblclick stays `今日 1/1`; switching viewer clears undo (`acceptance.spec.ts`) |
| E06 | PASS | `e2e/wave-c.spec.ts` wave copy |
| E07 | PASS | `scoreDateCopy` unit; `data-honesty` on the date line |
| E08 | PASS | quiet default unit/e2e; comfort copy in Chinese |
| E09 | PASS | `data-show-all` flips in `acceptance.spec.ts`; legend in the scene |
| E10 | PASS | card close exists; narrow split persists in session `village:split-v1` |
| E11 | PASS | `HISTORY_DAYS === 30`; `historyTicks` unit |
| E12 | PASS | four festival dates and the next day in `acceptance.spec.ts` |
| E13 | PASS | scored vs unscored screenshots in `docs/images/wave-d/round1/` |
| E14 | PASS | `refresh-scores` box ≥ 44px; kindness debounce; mobile viewport test |
| E15 | PASS | focus ring in `globals.css`; roster arrows; help/settings are `<details>` |
| E16 | PASS | quiet budget 0; `layoutBudget(60)`; `placeVillagers` of 60 |
| E17 | PASS | `e2e/privacy.spec.ts` probes, allowlist, storage dump |
| E18 | PASS | CI `ci-demo-pass`; visual job `continue-on-error`; privacy not quarantined |
| E19 | PASS | `docs/prod-smoke.md` forbids write APIs |
| E20 | PASS | README, TUTORIAL, SECURITY mention Wave D, quiet, 30 days, no Redis |
| E21 | PASS | `docs/deploy-cli.md`; no secret rotation |
| E22 | PASS | atlas abort shows `load-recovery` |
| E23 | PASS | `migrateWaveKey` unit; key inventory in SECURITY.md |
| E24 | PASS | `isolatePeople` unit; `injectBadRecord` e2e keeps the roster |

## Track F

| ID | Mark | Evidence |
| --- | --- | --- |
| F01 | PASS | `weatherFor` unit; weather chip |
| F02 | PASS | `visibleFootprints` frozen-clock unit |
| F03 | PASS | `nodTargets` threshold unit |
| F04 | PASS | `setDiary` rejects non-whitelist; index only in storage |
| F05 | PASS | `wreathColor` unit |
| F06 | PASS | `togglePorch` off unit; per-viewer blob |
| F07 | PASS | `weekBoard` has 3 items and a no-compare note |
| F08 | PASS | `duskActive` enter/exit hours |
| F09 | PASS | fourth pin shows「最多钉三枚名牌。」; reload + viewer switch e2e |
| F10 | PASS | `critterKind` is `none` when quiet |
| F11 | PASS | water next day unit; e2e second pour blocked |
| F12 | PASS | postcard click records no upload POST |
| F13 | PASS | chronicle stores counts; privacy dump |
| F14 | PASS | hat checkboxes local |
| F15 | PASS | `sitDown` toggles; no quota |
| F16 | PASS | `millAngle` stops under reduced motion |
| F17 | PASS | `giftNames` has no sender field |
| F18 | PASS | `strollPoints` length 3 |
| F19 | PASS | `atlasRatio` clamped |
| F20 | PASS | `data-season-fade=400` |
| F21 | PASS | `starBudget` ≤ particle cap; quiet returns 0 |
| F22 | PASS | instrument enum; no `Audio(` in Wave D |
| F23 | PASS | 回家 sets `data-camera-zoom=2` |
| F24 | PASS | visitor banner; home disabled until「我是谁」 |

## Track G

| ID | Mark | Evidence |
| --- | --- | --- |
| G01 | PASS | darker path borders; round1 map shots |
| G02 | PASS | five facade variants in `pixel-scene.ts` |
| G03 | PASS | day + dusk shots in round1/round2 |
| G04 | PASS | `.hud-title` / `.pixel-title` / `.pixel-label` scale |
| G05 | PASS | signal card zones; close control |
| G06 | PASS | nameplate alpha; selected/pinned priority |
| G07 | PASS | Y-sort in `drawActors` |
| G08 | PASS | `seasonDecorLayer` flower/leaf/fruit/snow |
| G09 | PASS | `particleAllowance` shared with stars; quiet is 0 |
| G10 | PASS | split 全地图 / 全卡片 persists |
| G11 | PASS | boot copy and pixel load panel |
| G12 | PASS | `empty-yard` e2e |
| G13 | PASS | settings groups 安静与装饰 / 名牌 / 我是谁 |
| G14 | PASS | `village-help` one drawer |
| G15 | PASS | `thumb-bar` on viewports under 900px; `mobile-thumb.png` |
| G16 | PASS | 8 files in `docs/images/wave-d/round1/` |
| G17 | PASS | round2 pack; rubric 8.3 |
| G18 | PASS | quiet `map-overview` + busy `map-overview-busy` baselines |
| G19 | PASS | `EASING` and `--season-fade: 400ms` |
| G20 | PASS | `AXIS_MARK` unit; ring `data-shape` |

## Track H

| ID | Mark | Evidence |
| --- | --- | --- |
| H01 | PASS | stroll, dusk, porch, sit, season layer unit |
| H02 | PASS | kindness undo, water day, pin cap |
| H03 | PASS | `atlasRatio` |
| H04 | PASS | pin serialize via viewer key + e2e reload |
| H05 | PASS | `weatherFor` |
| H06 | PASS | diary whitelist |
| H07 | PASS | `isolatePeople` |
| H08 | PASS | `copyIsClean` / `publicCopyLines` |
| H09–H16 | PASS | login, reload, kindness, wave, leave, festival, mobile, privacy specs |
| H17 | PASS | pin 3, reject 4, reload, viewer switch |
| H18 | PASS | home camera zoom |
| H19 | PASS | visitor banner |
| H20 | PASS | water same day / next day |
| H21 | PASS | `@visual` quiet + busy |
| H22 | PASS | `.github/workflows/playwright.yml` |
| H23 | SKIPPED | script ready in `e2e/prod-readonly.spec.ts`; production password not available here |
| H24 | PASS | `CHANGELOG.md` |

## Wave C regression

Existing `npm test` and `e2e/wave-c.spec.ts`, `festival.spec.ts`, `quotas.spec.ts`, `relogin.spec.ts` stayed green. No Redis, chat text, shame board, or secret edits.
