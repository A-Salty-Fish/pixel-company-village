# Credits

Sprites below are the ones drawn in the village. The Little Wilds zip is not redistributed.

## Little Wilds

- Floppy Cat Studios
- Purchased commercial license for the full pack. Do not redistribute the pack on its own.
- https://floppycatstudios.itch.io/little-wilds-cozy-rpg-asset-pack
- Used: ground tiles, animated water, trees, buildings, cliff edges, decorations, farming props, and all seven cat colors (Brown, Dark beige, Dark grey, Light beige, Light grey, Orange, Yellow) for idle, walk, chop, digging, watering, sitting, and hold.

## Fusion Pixel Font

- Fusion Pixel 12px proportional zh-Hans
- OFL-1.1
- TakWolf
- https://github.com/TakWolf/fusion-pixel-font/releases/tag/2026.09.25
- File: `public/fonts/fusion-pixel-12px-proportional-zh_hans.woff2`

## Farming crops 16×16

- josehzz
- CC0
- https://opengameart.org/content/farming-crops-16x16
- Used: growth stages on the plots (portrait cells omitted)

## pixelfx

- patch-gg/pixelfx, MIT License, Copyright (c) 2026 Patch
- https://github.com/patch-gg/pixelfx (commit a84159688af3ca37a4be05a0d422b94451b2e24e)
- Vendored in `src/vendor/pixelfx/` with its `LICENSE` and `NOTICE.md`: the core painter and the weather, fire, water, arcane, holy, nature, ice, critter, firework, pickup and confetti effects the magic town draws. Four weather loops carry a small `haze: false` patch.
- Carried-over credits inside pixelfx: Sprite Fusion pixel art VFX by Hugo Duprez (MIT) and Hollow Crown by rehan-remade (MIT, `core/sim.js`, `core/act.js`); their file headers are kept as is.
- The village's own effects in `src/features/magic-town/fx/` are written against the pixelfx core and say so at the top.
- The Patch Pixel font is not covered by pixelfx's license and is not used or copied.

## Not shipped

- Sunlit Meadow, Emberglen Meadow, Market Day Folk, and Cute Farmer are not drawn.
- The LPC barn and water wheel are no longer drawn; buildings and water come from Little Wilds.
- Paid pack zip files are not in this repo.
