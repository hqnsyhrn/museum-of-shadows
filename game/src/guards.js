// The wardens: eight named guards who patrol the hall, watch with vision
// cones, grow suspicious, give chase, and — if they lose you — give up and
// go back to their rounds. A near miss raises the alarm; a clean break
// lets it cool down, so patience is always a route back.

import { GUARDS } from './config.js';

const CONE_RANGE = 5.2;
const CONE_HALF_ANGLE = 0.61; // ~35 degrees each side
const CHASE_SPEED = 3.1;
const SUSPICION_RISE = 46; // per second at full visibility, point blank
const SUSPICION_FALL = 14; // per second while unseen
const CATCH_DIST = 0.55;

export function createGuards() {
  return GUARDS.map((g) => ({
    name: g.name,
    route: g.route.map(([x, y]) => ({ x: x + 0.5, y: y + 0.5 })),
    speed: g.speed,
    leg: 0,
    x: g.route[0][0] + 0.5,
    y: g.route[0][1] + 0.5,
    facing: 0,
    suspicion: 0,
    state: 'patrol', // patrol | suspicious | chase | investigate | search
    pause: 0,
    lostTime: 0,
    investigateX: 0,
    investigateY: 0,
    bob: Math.random() * 6,
  }));
}

function angleTo(g, x, y) {
  return Math.atan2(y - g.y, x - g.x);
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// Can this warden see the thief right now? In the cone, in range, in line
// of sight — and the skylight and the thief's sneak decide how fast it counts.
export function guardSees(g, level, player, visFactor) {
  const dx = player.x - g.x;
  const dy = player.y - g.y;
  const dist = Math.hypot(dx, dy);
  if (dist > CONE_RANGE) return 0;
  const ang = Math.atan2(dy, dx);
  if (Math.abs(angleDiff(ang, g.facing)) > CONE_HALF_ANGLE) return 0;
  if (!level.hasLineOfSight(g.x, g.y, player.x, player.y)) return 0;
  const closeness = 1 - (dist / CONE_RANGE) * 0.55;
  return visFactor * closeness;
}

function moveToward(g, tx, ty, speed, dt, level) {
  const dx = tx - g.x;
  const dy = ty - g.y;
  const d = Math.hypot(dx, dy);
  if (d < 0.02) return true;
  const step = Math.min(d, speed * dt);
  const nx = g.x + (dx / d) * step;
  const ny = g.y + (dy / d) * step;
  // Slide along walls: try x then y separately so patrols never snag.
  if (!level.solid(Math.floor(nx), Math.floor(g.y))) g.x = nx;
  if (!level.solid(Math.floor(g.x), Math.floor(ny))) g.y = ny;
  g.facing = Math.atan2(dy, dx);
  return d <= step;
}

export function updateGuard(g, dt, level, player, visFactor) {
  g.bob += dt * 6;
  const seen = guardSees(g, level, player, visFactor);

  if (g.state === 'chase') {
    if (seen > 0) {
      g.suspicion = 100;
      g.lostTime = 0;
    } else {
      g.lostTime += dt;
      if (g.lostTime > 4) {
        g.state = 'search';
        g.suspicion = 45;
        g.lostTime = 0;
      }
    }
    moveToward(g, player.x, player.y, CHASE_SPEED, dt, level);
    if (Math.hypot(player.x - g.x, player.y - g.y) < CATCH_DIST) return 'caught';
    return null;
  }

  if (g.state === 'investigate') {
    const arrived = moveToward(g, g.investigateX, g.investigateY, g.speed * 1.4, dt, level);
    if (seen > 0) g.suspicion = Math.min(100, g.suspicion + SUSPICION_RISE * seen * dt);
    else g.suspicion = Math.max(0, g.suspicion - SUSPICION_FALL * dt);
    if (g.suspicion >= 100) {
      g.state = 'chase';
      return null;
    }
    if (arrived) {
      g.pause += dt;
      if (g.pause > 2.2) {
        g.state = 'patrol';
        g.pause = 0;
      }
    }
    return null;
  }

  if (g.state === 'search') {
    g.facing += dt * 1.6;
    g.suspicion = Math.max(0, g.suspicion - SUSPICION_FALL * dt);
    if (seen > 0) {
      g.suspicion = Math.min(100, g.suspicion + SUSPICION_RISE * seen * dt);
      if (g.suspicion >= 100) g.state = 'chase';
      return null;
    }
    if (g.suspicion <= 8) {
      g.state = 'patrol';
      g.suspicion = 0;
    }
    return null;
  }

  // patrol / suspicious: walk the route, watch, let suspicion breathe.
  if (seen > 0) {
    g.suspicion = Math.min(100, g.suspicion + SUSPICION_RISE * seen * dt);
    g.state = g.suspicion >= 55 ? 'suspicious' : 'patrol';
    if (g.suspicion >= 100) {
      g.state = 'chase';
      return null;
    }
  } else {
    g.suspicion = Math.max(0, g.suspicion - SUSPICION_FALL * dt);
    if (g.suspicion < 55 && g.state === 'suspicious') g.state = 'patrol';
  }

  if (g.pause > 0) {
    g.pause -= dt;
    return null;
  }
  const target = g.route[(g.leg + 1) % g.route.length];
  if (moveToward(g, target.x, target.y, g.speed, dt, level)) {
    g.leg = (g.leg + 1) % g.route.length;
    g.pause = 1.1;
  }
  return null;
}

// A thrown coin pulls every warden in earshot to the spot it landed.
export function distractGuards(guards, x, y) {
  for (const g of guards) {
    const d = Math.hypot(g.x - x, g.y - y);
    if (g.state !== 'chase' && d < 6.5) {
      g.state = 'investigate';
      g.investigateX = x;
      g.investigateY = y;
      g.pause = 0;
    }
  }
}

export function maxSuspicion(guards) {
  return guards.reduce((m, g) => Math.max(m, g.suspicion), 0);
}

export function chasingGuard(guards) {
  return guards.find((g) => g.state === 'chase') || null;
}
