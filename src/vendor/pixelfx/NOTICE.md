# Notices

**Hugo Duprez.** `src/core/sim.js` and the effects that say so at the top of their file adapt Sprite Fusion's
open-source pixel art VFX (https://www.spritefusion.com/pixel-art-vfx), Copyright (c) 2026 Hugo Duprez, MIT License.

**Hollow Crown.** `src/core/act.js` adapts how Hollow Crown plays its skills (poses on 12 fps steps, hit-stops, the springy
straw target), from
https://github.com/rehan-remade/hollow-crown, Copyright (c) 2026 rehan-remade, MIT License.

**Patch Pixel.** The font in `gallery/fonts` is Patch's own and is not covered by this repository's MIT license. See
`gallery/fonts/NOTICE.md`.

---

**Vendored into 像素公司村.** Copied from https://github.com/patch-gg/pixelfx at commit
`a84159688af3ca37a4be05a0d422b94451b2e24e` (MIT, see `LICENSE` next to this file). Only `core/` and the effects the
village draws are kept; the gallery, its fonts (Patch Pixel is not used here) and the other effects are not copied.
Local changes: `fx/weather/{fireflies,falling-leaves,cherry-blossoms,snow,rain,blizzard}.js` take an extra `haze: false` option
that skips their dark backdrop so they can sit over a live map (marked `village patch`).
