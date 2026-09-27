#!/usr/bin/env python3
"""Pack Little Wilds full-pack sprites the village draws. Source zips are not committed."""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "public" / "assets"
FONT_DIR = ROOT / "public" / "fonts"

PACK = Path("/tmp/wilds-full/little-wilds-full/Full pack")
CATS = PACK / "Cat animation"
CROPS = Path("/tmp/pixel-assets/pixel-assets-bundle/crops/Crop_Spritesheet.png")
FONT = Path("/tmp/pixel-assets/pixel-assets-bundle/fonts/fusion-pixel-12px-proportional-zh_hans.otf.woff2")

# Folder name -> frame id. Light grey is the softer unscored color.
COLORS = {
    "Brown": "brown",
    "Dark beige": "dbeige",
    "Dark grey": "dgrey",
    "Light beige": "lbeige",
    "Light grey": "lgrey",
    "Orange": "orange",
    "Yellow": "yellow",
}

# prefix, frame id, cell width, frame count. Rows are down / left / up.
ANIMS = [
    ("Idle", "idle", 32, 7),
    ("Walk", "walk", 32, 8),
    ("Chop", "chop", 64, 8),
    ("Digging", "dig", 64, 8),
    ("Watering", "water", 64, 4),
    ("Sitting idle", "sit", 64, 8),
    ("Hold idle", "hold", 32, 7),
]


class Packer:
    def __init__(self, width: int = 2048) -> None:
        self.width = width
        self.x = 0
        self.y = 0
        self.row_h = 0
        self.placed: list[tuple[int, int, Image.Image]] = []
        self.frames: dict[str, dict[str, int]] = {}

    def add(self, name: str, image: Image.Image, ax: int | None = None, ay: int | None = None) -> None:
        im = image.convert("RGBA")
        bbox = im.getbbox()
        if bbox is None:
            return
        if self.x + im.width > self.width:
            self.x = 0
            self.y += self.row_h
            self.row_h = 0
        frame = {
            "x": self.x,
            "y": self.y,
            "w": im.width,
            "h": im.height,
            "ax": im.width // 2 if ax is None else ax,
            "ay": im.height - 2 if ay is None else ay,
        }
        self.frames[name] = frame
        self.placed.append((self.x, self.y, im))
        self.x += im.width
        self.row_h = max(self.row_h, im.height)

    def save(self, path: Path) -> None:
        height = self.y + self.row_h
        sheet = Image.new("RGBA", (self.width, max(1, height)), (0, 0, 0, 0))
        for x, y, im in self.placed:
            sheet.paste(im, (x, y), im)
        sheet.save(path, optimize=True)
        print(f"atlas {sheet.size} frames {len(self.frames)} -> {path}")


def mirror(im: Image.Image) -> Image.Image:
    return im.transpose(Image.Transpose.FLIP_LEFT_RIGHT)


def feet_anchor(cell: Image.Image, fallback_x: int) -> tuple[int, int]:
    arr = np.array(cell)
    ys, xs = np.where(arr[:, :, 3] > 20)
    if len(xs) == 0:
        return fallback_x, cell.height - 2
    return int(round((xs.min() + xs.max()) / 2)), int(ys.max() + 1)


def find_sheet(folder: Path, prefix: str) -> Path:
    matches = [p for p in folder.iterdir() if p.suffix == ".png" and p.name.startswith(prefix)]
    if not matches:
        raise SystemExit(f"missing {prefix} in {folder}")
    matches.sort(key=lambda p: len(p.name))
    return matches[0]


def tile16(sheet: Image.Image, col: int, row: int) -> Image.Image:
    return sheet.crop((col * 16, row * 16, (col + 1) * 16, (row + 1) * 16))


def components(path: Path, min_n: int) -> tuple[Image.Image, list[tuple[int, int, int, int, int]]]:
    im = Image.open(path).convert("RGBA")
    arr = np.array(im)
    mask = arr[:, :, 3] > 20
    h, w = mask.shape
    seen = np.zeros_like(mask, dtype=bool)
    found: list[tuple[int, int, int, int, int]] = []
    ys, xs = np.where(mask)
    from collections import deque

    for y, x in zip(ys, xs):
        if seen[y, x]:
            continue
        queue = deque([(int(x), int(y))])
        seen[y, x] = True
        minx = maxx = int(x)
        miny = maxy = int(y)
        n = 0
        while queue:
            cx, cy = queue.popleft()
            n += 1
            minx, maxx = min(minx, cx), max(maxx, cx)
            miny, maxy = min(miny, cy), max(maxy, cy)
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = cx + dx, cy + dy
                if 0 <= nx < w and 0 <= ny < h and mask[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True
                    queue.append((nx, ny))
        if n >= min_n:
            found.append((n, minx, miny, maxx - minx + 1, maxy - miny + 1))
    found.sort(key=lambda item: (item[2], item[1]))
    return im, found


def pack_cats(pack: Packer) -> None:
    dirs = ("down", "left", "up")
    for folder_name, color in COLORS.items():
        folder = CATS / folder_name
        for prefix, anim, cell_w, count in ANIMS:
            sheet = Image.open(find_sheet(folder, prefix)).convert("RGBA")
            for row, direction in enumerate(dirs):
                for frame in range(count):
                    cell = sheet.crop((frame * cell_w, row * 48, (frame + 1) * cell_w, (row + 1) * 48))
                    ax, ay = feet_anchor(cell, cell_w // 2)
                    pack.add(f"cat_{color}_{direction}_{anim}_{frame}", cell, ax, ay)
            for frame in range(count):
                cell = mirror(sheet.crop((frame * cell_w, 48, (frame + 1) * cell_w, 96)))
                ax, ay = feet_anchor(cell, cell_w // 2)
                pack.add(f"cat_{color}_right_{anim}_{frame}", cell, ax, ay)


def pack_ground(pack: Packer) -> None:
    ground = Image.open(PACK / "Ground tiles.png").convert("RGBA")
    grass: list[tuple[int, int]] = []
    dirt: list[tuple[int, int]] = []
    cols, rows = ground.width // 16, ground.height // 16
    for r in range(rows):
        for c in range(cols):
            cell = tile16(ground, c, r)
            opaque = green = brown = 0
            for p in cell.getdata():
                if p[3] < 20:
                    continue
                opaque += 1
                if p[1] > p[0] + 8 and p[1] > p[2]:
                    green += 1
                elif p[0] > p[1] + 6 and p[0] > p[2]:
                    brown += 1
            if opaque < 200:
                continue
            if green > 140 and brown < 40:
                grass.append((c, r))
            elif brown > 120 and green < 60:
                dirt.append((c, r))
    if len(grass) < 6 or len(dirt) < 4:
        raise SystemExit(f"ground tiles grass={len(grass)} dirt={len(dirt)}")
    step = max(1, len(grass) // 12)
    for i, (c, r) in enumerate(grass[::step][:12]):
        pack.add(f"grass_{i}", tile16(ground, c, r), 0, 0)
    step = max(1, len(dirt) // 8)
    picked = dirt[::step][:8]
    for i, (c, r) in enumerate(picked):
        pack.add(f"path_{i}", tile16(ground, c, r), 0, 0)
    pack.add("soil_dry", tile16(ground, picked[0][0], picked[0][1]), 0, 0)
    pack.add("soil_wet", tile16(ground, picked[min(1, len(picked) - 1)][0], picked[min(1, len(picked) - 1)][1]), 0, 0)
    pack.add("soil_edge", tile16(ground, picked[min(2, len(picked) - 1)][0], picked[min(2, len(picked) - 1)][1]), 0, 0)
    pack.add("sand", tile16(ground, picked[min(3, len(picked) - 1)][0], picked[min(3, len(picked) - 1)][1]), 0, 0)
    print(f"ground grass {min(12, len(grass))} dirt {len(picked)}")


def pack_water(pack: Packer) -> None:
    water = Image.open(PACK / "Animated water.png").convert("RGBA")
    arr = np.array(water)
    cols, rows = water.width // 16, water.height // 16
    chosen: list[tuple[int, int]] = []
    for r in range(rows - 4):
        for c in range(cols):
            tile = arr[r * 16 : (r + 1) * 16, c * 16 : (c + 1) * 16]
            if tile[:, :, 3].mean() < 250:
                continue
            blue = ((tile[:, :, 2] > tile[:, :, 0] + 12) & (tile[:, :, 2] > 70)).mean()
            if blue < 0.65:
                continue
            frames = [(c, r)]
            for k in range(1, 6):
                nxt = arr[(r + k) * 16 : (r + k + 1) * 16, c * 16 : (c + 1) * 16]
                diff = np.mean(np.abs(tile.astype(int) - nxt.astype(int)))
                if 1.5 <= diff <= 18:
                    frames.append((c, r + k))
                else:
                    break
            if len(frames) >= 4:
                chosen = frames[:4]
                break
        if chosen:
            break
    if not chosen:
        raise SystemExit("no animated water frames")
    for i, (c, r) in enumerate(chosen):
        pack.add(f"water_{i}", tile16(water, c, r), 0, 0)
    print("water", chosen)


def pack_props(pack: Packer) -> None:
    trees, tree_parts = components(PACK / "Trees.png", 800)
    n = 0
    for _count, x, y, w, h in tree_parts:
        if h < 50 or w < 40:
            continue
        image = trees.crop((x, y, x + w, y + h))
        pack.add(f"tree_{n}", image, w // 2, h - 1)
        n += 1
        if n >= 10:
            break
    if n < 4:
        raise SystemExit("not enough trees")

    buildings, parts = components(PACK / "Building.png", 1000)
    houses = [part for part in parts if part[4] > 60 and part[3] > 50]
    for i, (_count, x, y, w, h) in enumerate(houses[:3]):
        image = buildings.crop((x, y, x + w, y + h))
        pack.add(f"house_{i}", image, w // 2, h - 1)

    deco, deco_parts = components(PACK / "Decorations.png", 80)
    bush_i = flower_i = fence_i = 0
    for _count, x, y, w, h in deco_parts:
        image = deco.crop((x, y, x + w, y + h))
        if h >= 20 and w >= 24 and h <= 40 and bush_i < 6:
            pack.add(f"bush_{bush_i}", image, w // 2, h - 1)
            bush_i += 1
        elif w >= 70 and 16 <= h <= 36 and fence_i < 2:
            pack.add(f"fence_{fence_i}", image, w // 2, h - 1)
            fence_i += 1
        elif 8 <= h <= 22 and 8 <= w <= 28 and flower_i < 8:
            pack.add(f"flower_{flower_i}", image, w // 2, h - 1)
            flower_i += 1

    farm, farm_parts = components(PACK / "Farming.png", 150)
    farm_i = 0
    for _count, x, y, w, h in farm_parts:
        if w < 16 or h < 14 or w > 40:
            continue
        image = farm.crop((x, y, x + w, y + h))
        pack.add(f"farm_{farm_i}", image, w // 2, h - 1)
        farm_i += 1
        if farm_i >= 8:
            break

    cliffs = Image.open(PACK / "Cliffs.png").convert("RGBA")
    cliff_i = 0
    for r in range(0, cliffs.height // 32):
        for c in range(0, cliffs.width // 32):
            cell = cliffs.crop((c * 32, r * 32, (c + 1) * 32, (r + 1) * 32))
            alpha = np.array(cell)[:, :, 3]
            opaque = (alpha > 20).mean()
            if 0.35 < opaque < 0.92:
                pack.add(f"cliff_{cliff_i}", cell, 16, 31)
                cliff_i += 1
                if cliff_i >= 8:
                    break
        if cliff_i >= 8:
            break
    print(f"props trees {n} houses {len(houses[:3])} bushes {bush_i} fences {fence_i} flowers {flower_i} farm {farm_i} cliffs {cliff_i}")


def pack_crops(pack: Packer) -> None:
    crops = Image.open(CROPS)
    stage_cols = [1, 2, 3, 4]
    for row in range(10):
        for side, origin in enumerate((0, 6)):
            for stage, col in enumerate(stage_cols):
                cell = crops.crop(((origin + col) * 16, row * 16, (origin + col + 1) * 16, (row + 1) * 16))
                pack.add(f"crop_{row}_{side}_{stage}", cell, 8, 15)


def main() -> None:
    pack = Packer()
    pack_ground(pack)
    pack_water(pack)
    pack_props(pack)
    pack_crops(pack)
    pack_cats(pack)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    FONT_DIR.mkdir(parents=True, exist_ok=True)
    pack.save(OUT_DIR / "village-atlas.png")
    (OUT_DIR / "village-atlas.json").write_text(
        json.dumps({"image": "/assets/village-atlas.png", "frames": pack.frames})
    )
    dest_font = FONT_DIR / "fusion-pixel-12px-proportional-zh_hans.woff2"
    if FONT.exists():
        dest_font.write_bytes(FONT.read_bytes())
    print("font", dest_font.stat().st_size)


if __name__ == "__main__":
    main()
