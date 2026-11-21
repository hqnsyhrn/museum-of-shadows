// Museum of Shadows — level layout: walls, cover, lamps, relics, exit, patrols.
// One screen, 1280 x 720, top-down. Everything here is data; the systems in
// guards.js, player.js and render.js read it, they never hard-code positions.

export const LEVEL_WIDTH = 1280;
export const LEVEL_HEIGHT = 720;
export const WALL = 24;

// Solid rectangles. They block movement and block a guard's line of sight.
export const WALLS = [
  // Outer frame
  { x: 0, y: 0, w: 1280, h: WALL },
  { x: 0, y: 720 - WALL, w: 1280, h: WALL },
  { x: 0, y: 0, w: WALL, h: 720 },
  { x: 1280 - WALL, y: 0, w: WALL, h: 720 },
  // Wing divider A (x = 420): door gap y 300..420
  { x: 420, y: WALL, w: 16, h: 276 },
  { x: 420, y: 420, w: 16, h: 276 },
  // Wing divider B (x = 844): door gap y 300..420
  { x: 844, y: WALL, w: 16, h: 276 },
  { x: 844, y: 420, w: 16, h: 276 },
];

// Display cases and pillars. They block movement and sight: the cover you
// crouch behind. Cases are wide, pillars are small squares.
export const COVER = [
  // West wing
  { x: 110, y: 110, w: 130, h: 62, kind: 'case' },
  { x: 110, y: 430, w: 130, h: 62, kind: 'case' },
  { x: 290, y: 250, w: 62, h: 130, kind: 'case' },
  // Central hall
  { x: 560, y: 110, w: 160, h: 62, kind: 'case' },
  { x: 560, y: 480, w: 160, h: 62, kind: 'case' },
  { x: 500, y: 210, w: 38, h: 38, kind: 'pillar' },
  { x: 742, y: 210, w: 38, h: 38, kind: 'pillar' },
  { x: 500, y: 560, w: 38, h: 38, kind: 'pillar' },
  { x: 742, y: 560, w: 38, h: 38, kind: 'pillar' },
  // East wing
  { x: 1040, y: 110, w: 130, h: 62, kind: 'case' },
  { x: 1040, y: 430, w: 130, h: 62, kind: 'case' },
  { x: 928, y: 250, w: 62, h: 130, kind: 'case' },
];

// Every solid obstacle, walls plus cover, for collision and line of sight.
export const SOLIDS = [...WALLS, ...COVER];

// Warm pools of lamplight. Standing in one, a guard spots you far faster;
// the dark floor between them is where a thief belongs.
export const LAMPS = [
  { x: 175, y: 175, r: 118 },
  { x: 175, y: 545, r: 118 },
  { x: 640, y: 360, r: 128 },
  { x: 1105, y: 175, r: 118 },
  { x: 1105, y: 545, r: 118 },
  { x: 640, y: 90, r: 96 },
];

// The three relics. Steal all three, then reach the exit.
export const RELICS = [
  { id: 'scarab', name: 'Jade Scarab', x: 175, y: 315, color: '#4ce08a' },
  { id: 'pearl', name: 'Moon Pearl', x: 640, y: 300, color: '#9fd8ff' },
  { id: 'ibis', name: 'Golden Ibis', x: 1105, y: 315, color: '#f2c94c' },
];

// The way out: the south door of the central hall.
export const EXIT_ZONE = { x: 600, y: 640, w: 80, h: 56 };

export const PLAYER_START = { x: 120, y: 620 };

// Eight guards, each with a patrol loop of waypoints. Learn the loops and
// the gaps between them are yours.
export const GUARD_ROUTES = [
  { name: 'Warden Ash', waypoints: [[300, 120], [300, 560]] },
  { name: 'Warden Birch', waypoints: [[90, 360], [360, 360]] },
  { name: 'Warden Cade', waypoints: [[480, 90], [800, 90]] },
  { name: 'Warden Dove', waypoints: [[480, 360], [800, 360]] },
  { name: 'Warden Elm', waypoints: [[480, 620], [800, 620]] },
  { name: 'Warden Fern', waypoints: [[980, 120], [980, 560]] },
  { name: 'Warden Gale', waypoints: [[920, 360], [1190, 360]] },
  { name: 'Warden Hale', waypoints: [[640, 90], [1180, 90], [1180, 620], [90, 620], [90, 90], [640, 90]] },
];

/** True when the point lies inside any solid rectangle. */
export function pointInSolid(x, y) {
  for (const s of SOLIDS) {
    if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) return true;
  }
  return false;
}

/** True when the point stands inside a pool of lamplight. */
export function pointInLight(x, y) {
  for (const lamp of LAMPS) {
    const dx = x - lamp.x;
    const dy = y - lamp.y;
    if (dx * dx + dy * dy <= lamp.r * lamp.r) return true;
  }
  return false;
}

function segmentHitsRect(x1, y1, x2, y2, r) {
  // Slab test: does the segment cross the rectangle?
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tMin = 0;
  let tMax = 1;
  for (const [p, q] of [[-dx, x1 - r.x], [dx, r.x + r.w - x1], [-dy, y1 - r.y], [dy, r.y + r.h - y1]]) {
    if (p === 0) {
      if (q < 0) return false;
    } else {
      const t = q / p;
      if (p < 0) {
        if (t > tMax) return false;
        if (t > tMin) tMin = t;
      } else {
        if (t < tMin) return false;
        if (t < tMax) tMax = t;
      }
    }
  }
  return true;
}

/** True when no solid stands between the two points. */
export function hasLineOfSight(x1, y1, x2, y2) {
  for (const s of SOLIDS) {
    if (segmentHitsRect(x1, y1, x2, y2, s)) return false;
  }
  return true;
}

/** Push a circle out of every solid it overlaps; returns the corrected spot. */
export function resolveCircle(x, y, radius) {
  let nx = x;
  let ny = y;
  for (const s of SOLIDS) {
    const cx = Math.max(s.x, Math.min(nx, s.x + s.w));
    const cy = Math.max(s.y, Math.min(ny, s.y + s.h));
    const dx = nx - cx;
    const dy = ny - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 < radius * radius) {
      if (d2 === 0) {
        ny = s.y - radius;
      } else {
        const d = Math.sqrt(d2);
        nx = cx + (dx / d) * radius;
        ny = cy + (dy / d) * radius;
      }
    }
  }
  nx = Math.max(WALL + radius, Math.min(LEVEL_WIDTH - WALL - radius, nx));
  ny = Math.max(WALL + radius, Math.min(LEVEL_HEIGHT - WALL - radius, ny));
  return { x: nx, y: ny };
}
