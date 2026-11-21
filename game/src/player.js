// Museum of Shadows — the thief: movement, sneak, noise and the thrown coin.
// Running is fast and loud; sneaking is slow and quiet. A thrown coin lands
// with a clink and pulls every guard in earshot toward it — the oldest trick
// in a thief's pocket.

import { resolveCircle } from './level.js';

export const PLAYER_RADIUS = 13;
export const WALK_SPEED = 165;
export const SNEAK_SPEED = 78;
export const RUN_NOISE_RADIUS = 105;
export const COIN_RANGE = 270;
export const COIN_NOISE_RADIUS = 135;

export class Player {
  constructor(start) {
    this.x = start.x;
    this.y = start.y;
    this.facing = -Math.PI / 2;
    this.sneaking = false;
    this.running = false;
    this.moving = false;
    this.stepPhase = 0;
    this.coins = 6;
    this.relics = 0;
    this.everAlerted = false;
  }

  reset(start) {
    this.x = start.x;
    this.y = start.y;
    this.facing = -Math.PI / 2;
    this.sneaking = false;
    this.running = false;
    this.moving = false;
    this.coins = 6;
    this.relics = 0;
    this.everAlerted = false;
  }

  update(dt, keys) {
    let dx = 0;
    let dy = 0;
    if (keys.has('arrowup') || keys.has('w')) dy -= 1;
    if (keys.has('arrowdown') || keys.has('s')) dy += 1;
    if (keys.has('arrowleft') || keys.has('a')) dx -= 1;
    if (keys.has('arrowright') || keys.has('d')) dx += 1;
    this.moving = dx !== 0 || dy !== 0;
    this.sneaking = keys.has('shift');
    this.running = this.moving && !this.sneaking;

    if (this.moving) {
      const len = Math.hypot(dx, dy);
      const speed = this.sneaking ? SNEAK_SPEED : WALK_SPEED;
      const step = speed * dt;
      const nx = this.x + (dx / len) * step;
      const ny = this.y + (dy / len) * step;
      const solved = resolveCircle(nx, ny, PLAYER_RADIUS);
      this.x = solved.x;
      this.y = solved.y;
      this.facing = Math.atan2(dy, dx);
      this.stepPhase += dt * speed * 0.11;
    }
  }

  /** Loud feet carry: running within earshot of a guard is an invitation. */
  noiseRadius() {
    return this.running ? RUN_NOISE_RADIUS : 0;
  }
}

export class Coin {
  constructor(x, y, tx, ty) {
    this.x = x;
    this.y = y;
    const dx = tx - x;
    const dy = ty - y;
    const dist = Math.min(Math.hypot(dx, dy), COIN_RANGE);
    const angle = Math.atan2(dy, dx);
    this.targetX = x + Math.cos(angle) * dist;
    this.targetY = y + Math.sin(angle) * dist;
    this.t = 0; // 0 flying, 1 landed
    this.ring = 0; // expanding noise ring after landing
    this.done = false;
  }

  update(dt) {
    if (this.t < 1) {
      this.t = Math.min(1, this.t + dt * 2.4);
      this.x += (this.targetX - this.x) * 0.18;
      this.y += (this.targetY - this.y) * 0.18;
    } else {
      this.ring += dt * 260;
      if (this.ring > COIN_NOISE_RADIUS) this.done = true;
    }
  }
}
