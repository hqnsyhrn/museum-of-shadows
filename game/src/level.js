// Museum of Shadows — the museum itself: walls, display cases (cover),
// the three relic pedestals, the exit, and the thief's entrance.
// Legend: # wall, . floor, C display case, R relic pedestal, E exit, P spawn.
// The map is 32 by 20 tiles of 40 px, exactly one 1280x800 screen, so
// the whole level — cones, cover and exit — is visible in every shot.
import { CONFIG } from "./config.js";

export const MAP = [
  "################################",
  "#.......#.......#......#.......#",
  "#..R....#...C...#..C...#...R...#",
  "#.......#.......#......#.......#",
  "#..C....#...C...#..C...#.......#",
  "#.......#.......#......#.......#",
  "###.#######..#######..#######.##",
  "#..............................#",
  "#..C......C.....C......C....C..#",
  "#..............................#",
  "#......C..........C............#",
  "#..............................#",
  "###.#######..#######..#######.##",
  "#.......#.......#......#.......#",
  "#..C....#...C...#..C...#...C...#",
  "#.......#.......#......#.......#",
  "#.......#...R...#......#.......#",
  "#.......#.......#......#.......#",
  "#..P...........................#",
  "###############EE###############",
];

export const RELIC_NAMES = [
  "Golden Scarab",
  "Jade Mask",
  "Star Sapphire",
];

export const GUARD_ROUTES = [
  // West gallery, north.
  [[2, 1], [6, 1], [6, 5], [2, 5]],
  // Central-west gallery, north.
  [[10, 1], [14, 1], [14, 5], [10, 5]],
  // Central-east gallery, north.
  [[18, 1], [21, 1], [21, 5], [18, 5]],
  // East gallery, north.
  [[25, 1], [29, 1], [29, 5], [25, 5]],
  // Grand hall, west half.
  [[2, 7], [15, 7], [15, 11], [2, 11]],
  // Grand hall, east half.
  [[17, 7], [29, 7], [29, 11], [17, 11]],
  // Central galleries, south (guards the Star Sapphire).
  [[10, 13], [14, 13], [14, 17], [10, 17]],
  // East gallery, south.
  [[25, 13], [29, 13], [29, 17], [25, 17]],
];

export function buildLevel() {
  const grid = MAP.map((row) => row.split(""));
  const relics = [];
  const cases = [];
  let spawn = { x: 3.5 * CONFIG.TILE, y: 18.5 * CONFIG.TILE };
  const exitTiles = [];

  for (let ty = 0; ty < CONFIG.ROWS; ty++) {
    for (let tx = 0; tx < CONFIG.COLS; tx++) {
      const ch = grid[ty][tx];
      const cx = (tx + 0.5) * CONFIG.TILE;
      const cy = (ty + 0.5) * CONFIG.TILE;
      if (ch === "R") {
        relics.push({
          index: relics.length,
          name: RELIC_NAMES[relics.length] || "Relic",
          tx,
          ty,
          x: cx,
          y: cy,
          taken: false,
        });
      } else if (ch === "C") {
        cases.push({ tx, ty, x: cx, y: cy });
      } else if (ch === "P") {
        spawn = { x: cx, y: cy };
      } else if (ch === "E") {
        exitTiles.push({ tx, ty, x: cx, y: cy });
      }
    }
  }

  const inBounds = (tx, ty) =>
    tx >= 0 && ty >= 0 && tx < CONFIG.COLS && ty < CONFIG.ROWS;
  const tileAt = (tx, ty) => (inBounds(tx, ty) ? grid[ty][tx] : "#");
  const isWall = (tx, ty) => tileAt(tx, ty) === "#";
  const isCase = (tx, ty) => tileAt(tx, ty) === "C";
  const blocksMove = (tx, ty) => isWall(tx, ty) || isCase(tx, ty);
  // Walls and display cases both block a guard's line of sight:
  // crouching behind a case is real cover.
  const blocksSight = (tx, ty) => isWall(tx, ty) || isCase(tx, ty);
  const isExit = (tx, ty) => tileAt(tx, ty) === "E";

  return {
    grid,
    relics,
    cases,
    spawn,
    exitTiles,
    tileAt,
    isWall,
    isCase,
    blocksMove,
    blocksSight,
    isExit,
  };
}

// Pixel position -> tile coordinates.
export function tileOf(x, y) {
  return {
    tx: Math.floor(x / CONFIG.TILE),
    ty: Math.floor(y / CONFIG.TILE),
  };
}

// Is the straight line between two points blocked by sight-blocking tiles?
// Samples along the ray; cheap and exact enough for cone checks.
export function lineBlocked(level, x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 8));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const { tx, ty } = tileOf(x0 + dx * t, y0 + dy * t);
    if (level.blocksSight(tx, ty)) return true;
  }
  return false;
}
