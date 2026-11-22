// Isometric projection: turns hall tiles (x, y, height) into screen pixels.
// The hall is drawn in true 3D: every box is extruded up from its floor tile
// and every figure stands on the floor, so the camera reads as isometric,
// never as a flat top-down grid.

import { TILE_W, TILE_H } from './config.js';

// Camera origin: chosen so the 16x12 hall fills ~90% of a 1280x720 frame.
export const ORIGIN_X = 556;
export const ORIGIN_Y = 128;

// Tile centre (gx, gy) at floor level -> screen point.
export function project(gx, gy, z = 0) {
  return {
    x: ORIGIN_X + (gx - gy) * (TILE_W / 2),
    y: ORIGIN_Y + (gx + gy) * (TILE_H / 2) - z,
  };
}

// The four corners of one floor tile, for drawing the marble slab.
export function tileCorners(gx, gy) {
  const hw = TILE_W / 2;
  const hh = TILE_H / 2;
  const c = project(gx + 0.5, gy + 0.5);
  return [
    { x: c.x, y: c.y - hh },
    { x: c.x + hw, y: c.y },
    { x: c.x, y: c.y + hh },
    { x: c.x - hw, y: c.y },
  ];
}

// Painter's depth: things further north-west draw first, south-east last.
export function depthOf(gx, gy) {
  return gx + gy;
}

// Screen point back to the nearest tile, for mouse aiming.
export function screenToTile(sx, sy) {
  const dx = sx - ORIGIN_X;
  const dy = sy - ORIGIN_Y;
  const gx = (dx / (TILE_W / 2) + dy / (TILE_H / 2)) / 2;
  const gy = (dy / (TILE_H / 2) - dx / (TILE_W / 2)) / 2;
  return { gx: Math.floor(gx), gy: Math.floor(gy) };
}
