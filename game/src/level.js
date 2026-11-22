// The level: parses the hall map into walls, pedestals, columns, relics and
// the exit, and answers the two questions stealth lives on — can a figure
// stand here, and can a warden see from here to there.

import { MAP, MAP_W, MAP_H, RELICS, EXIT_TILE, PLAYER_START } from './config.js';

export function buildLevel() {
  const walls = new Set();
  const pedestals = [];
  const columns = [];
  const key = (x, y) => x + ',' + y;

  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const ch = MAP[y][x];
      if (ch === '#') walls.add(key(x, y));
      else if (ch === 'P') pedestals.push({ x, y, relic: null });
      else if (ch === 'C') columns.push({ x, y });
      else if (ch === 'R') {
        // R1/R2/R3 are two characters: the digit follows the R.
        const digit = MAP[y][x + 1];
        const relic = RELICS.find((r) => r.key === 'R' + digit);
        pedestals.push({ x, y, relic });
      }
    }
  }

  const solid = (x, y) => {
    if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return true;
    if (walls.has(key(x, y))) return true;
    if (pedestals.some((p) => p.x === x && p.y === y)) return true;
    if (columns.some((c) => c.x === x && c.y === y)) return true;
    return false;
  };

  // Line of sight on the grid: a warden's gaze is blocked by walls,
  // pedestals and columns, never by the open marble.
  const blocksSight = (x, y) => {
    if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return true;
    if (walls.has(key(x, y))) return true;
    if (pedestals.some((p) => p.x === x && p.y === y)) return true;
    if (columns.some((c) => c.x === x && c.y === y)) return true;
    return false;
  };

  function hasLineOfSight(ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    const steps = Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) * 4);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const x = Math.floor(ax + dx * t);
      const y = Math.floor(ay + dy * t);
      if (x === Math.floor(bx) && y === Math.floor(by)) break;
      if (blocksSight(x, y)) return false;
    }
    return true;
  }

  const relicAt = (x, y) => {
    const p = pedestals.find((q) => q.x === x && q.y === y && q.relic);
    return p ? p.relic : null;
  };

  return {
    walls,
    pedestals,
    columns,
    solid,
    hasLineOfSight,
    relicAt,
    exit: { x: EXIT_TILE[0], y: EXIT_TILE[1] },
    start: { x: PLAYER_START[0], y: PLAYER_START[1] },
  };
}
