// The Sweeping Skylight: the museum's signature hazard. A great beam falls
// from the glass roof and circles the hall on a slow, learnable sweep.
// Whoever stands in the pool of light is LIT — wardens spot a lit thief
// twice as fast as one in shadow. The sweep is the clock the heist runs on.

import { SKYLIGHT, LAMPS } from './config.js';

export function createSkylight() {
  return { angle: 0.6, time: 0 };
}

export function updateSkylight(sky, dt) {
  sky.time += dt;
  sky.angle = (sky.time / SKYLIGHT.periodSec) * Math.PI * 2 + 0.6;
}

// Where the pool of light falls on the floor right now, in tile coordinates.
export function skylightPool(sky) {
  return {
    x: SKYLIGHT.center[0] + Math.cos(sky.angle) * SKYLIGHT.radiusX,
    y: SKYLIGHT.center[1] + Math.sin(sky.angle) * SKYLIGHT.radiusY,
    r: SKYLIGHT.poolRadius,
  };
}

// Is a tile position lit right now — by the beam, or by a wall lamp?
export function isLit(sky, x, y) {
  const pool = skylightPool(sky);
  const dx = x - pool.x;
  const dy = y - pool.y;
  if (dx * dx + dy * dy < pool.r * pool.r) return true;
  for (const [lx, ly] of LAMPS) {
    const ddx = x - (lx + 0.5);
    const ddy = y - (ly + 0.5);
    if (ddx * ddx + ddy * ddy < 2.1) return true;
  }
  return false;
}

// Visibility factor: how fast a warden's suspicion grows when you are seen.
export function visibilityFactor(sky, x, y, sneaking) {
  let f = isLit(sky, x, y) ? 1.0 : 0.45;
  if (sneaking) f *= 0.55;
  return f;
}
