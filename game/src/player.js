// The thief: one hooded figure, quick on open marble, slow and hard to see
// while sneaking. Carries three coins to throw, steals relics up close, and
// wins by reaching the green EXIT with all three.

import { COIN_COUNT, PLAYER_START } from './config.js';

const WALK_SPEED = 3.4;
const SNEAK_SPEED = 1.7;
const COIN_THROW_DIST = 3.2;

export function createPlayer() {
  return {
    x: PLAYER_START[0] + 0.5,
    y: PLAYER_START[1] + 0.5,
    facing: -Math.PI / 2,
    sneaking: false,
    moving: false,
    coins: COIN_COUNT,
    stolen: [],
    stepTime: 0,
    coin: null, // {x, y, tx, ty, t} while a coin is flying
    stealTimer: 0,
  };
}

export function updatePlayer(p, dt, keys, level, onStep) {
  let mx = 0;
  let my = 0;
  if (keys['arrowup'] || keys['w']) my -= 1;
  if (keys['arrowdown'] || keys['s']) my += 1;
  if (keys['arrowleft'] || keys['a']) mx -= 1;
  if (keys['arrowright'] || keys['d']) mx += 1;
  p.sneaking = !!keys['shift'];
  p.moving = mx !== 0 || my !== 0;
  if (p.moving) {
    const len = Math.hypot(mx, my);
    mx /= len;
    my /= len;
    p.facing = Math.atan2(my, mx);
    const speed = p.sneaking ? SNEAK_SPEED : WALK_SPEED;
    const nx = p.x + mx * speed * dt;
    const ny = p.y + my * speed * dt;
    if (!level.solid(Math.floor(nx), Math.floor(p.y))) p.x = nx;
    if (!level.solid(Math.floor(p.x), Math.floor(ny))) p.y = ny;
    p.stepTime += dt * (p.sneaking ? 0.7 : 1.4);
    if (p.stepTime > 0.55) {
      p.stepTime = 0;
      if (onStep) onStep(p.sneaking);
    }
  }
  if (p.stealTimer > 0) p.stealTimer -= dt;
  if (p.coin) {
    p.coin.t += dt * 2.4;
    if (p.coin.t >= 1) {
      const landed = { x: p.coin.tx, y: p.coin.ty };
      p.coin = null;
      return { coinLanded: landed };
    }
  }
  return null;
}

// Throw a coin ahead of the thief; wardens in earshot go to look at it.
export function throwCoin(p) {
  if (p.coins <= 0 || p.coin) return false;
  p.coins -= 1;
  const tx = p.x + Math.cos(p.facing) * COIN_THROW_DIST;
  const ty = p.y + Math.sin(p.facing) * COIN_THROW_DIST;
  p.coin = { x: p.x, y: p.y, tx, ty, t: 0 };
  return true;
}

export function coinPosition(p) {
  if (!p.coin) return null;
  const t = p.coin.t;
  const x = p.coin.x + (p.coin.tx - p.coin.x) * t;
  const y = p.coin.y + (p.coin.ty - p.coin.y) * t;
  const z = Math.sin(t * Math.PI) * 26;
  return { x, y, z };
}

// The relic pedestal within reach, if any — the thief steals with E.
export function relicInReach(p, level) {
  for (const ped of level.pedestals) {
    if (!ped.relic) continue;
    if (p.stolen.includes(ped.relic.id)) continue;
    const d = Math.hypot(ped.x + 0.5 - p.x, ped.y + 0.5 - p.y);
    if (d < 1.35) return ped.relic;
  }
  return null;
}

export function stealRelic(p, relic) {
  if (p.stealTimer > 0) return false;
  p.stolen.push(relic.id);
  p.stealTimer = 0.5;
  return true;
}

export function atExit(p, level) {
  return Math.hypot(level.exit.x + 0.5 - p.x, level.exit.y + 0.5 - p.y) < 1.1;
}
