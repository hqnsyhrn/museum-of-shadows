// Museum of Shadows — rendering. Everything is drawn on one canvas, no
// images: the floor, the lamplight, the vision cones, the guards and the
// thief are all shapes and gradients. The picture must read in a still:
// gold cones are danger, warm pools are danger, dark floor is safety.

import { LEVEL_WIDTH, LEVEL_HEIGHT, WALLS, COVER, LAMPS, RELICS, EXIT_ZONE, WALL } from './level.js';
import { VISION_RANGE, VISION_HALF_ANGLE } from './guards.js';

const TILE = 64;

function drawFloor(ctx) {
  ctx.fillStyle = '#12141f';
  ctx.fillRect(0, 0, LEVEL_WIDTH, LEVEL_HEIGHT);
  // Marble tiles
  ctx.strokeStyle = 'rgba(255,255,255,0.045)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= LEVEL_WIDTH; x += TILE) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, LEVEL_HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y <= LEVEL_HEIGHT; y += TILE) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(LEVEL_WIDTH, y);
    ctx.stroke();
  }
  // Faint carpet runner down the central hall
  ctx.fillStyle = 'rgba(122, 32, 40, 0.28)';
  ctx.fillRect(560, WALL, 160, LEVEL_HEIGHT - WALL * 2);
}

function drawLightPools(ctx) {
  for (const lamp of LAMPS) {
    const g = ctx.createRadialGradient(lamp.x, lamp.y, 8, lamp.x, lamp.y, lamp.r);
    g.addColorStop(0, 'rgba(255, 196, 110, 0.34)');
    g.addColorStop(0.6, 'rgba(255, 180, 90, 0.14)');
    g.addColorStop(1, 'rgba(255, 180, 90, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, lamp.r, 0, Math.PI * 2);
    ctx.fill();
    // The lamp itself, a small brass fixture
    ctx.fillStyle = '#f2c94c';
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(242, 201, 76, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, 9, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawPatrolRoutes(ctx, guards) {
  ctx.save();
  ctx.setLineDash([2, 9]);
  ctx.strokeStyle = 'rgba(230, 225, 200, 0.30)';
  ctx.lineWidth = 1.5;
  for (const guard of guards) {
    const pts = guard.waypoints;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    if (pts.length > 2) ctx.closePath();
    ctx.stroke();
  }
  ctx.restore();
}

function drawWalls(ctx) {
  for (const w of WALLS) {
    ctx.fillStyle = '#2a2d3d';
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.fillRect(w.x, w.y, w.w, 3);
  }
}

function drawCover(ctx) {
  for (const c of COVER) {
    if (c.kind === 'case') {
      ctx.fillStyle = '#1b2b3d';
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.fillStyle = 'rgba(140, 200, 255, 0.16)';
      ctx.fillRect(c.x + 4, c.y + 4, c.w - 8, c.h - 8);
      ctx.strokeStyle = '#c9a24b';
      ctx.lineWidth = 3;
      ctx.strokeRect(c.x, c.y, c.w, c.h);
      ctx.fillStyle = 'rgba(220, 230, 255, 0.35)';
      ctx.fillRect(c.x + 8, c.y + 8, c.w - 16, 5);
    } else {
      ctx.fillStyle = '#33364a';
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.strokeStyle = '#555a75';
      ctx.lineWidth = 2;
      ctx.strokeRect(c.x, c.y, c.w, c.h);
    }
  }
}

function drawRelics(ctx, taken) {
  ctx.textAlign = 'center';
  for (const relic of RELICS) {
    if (taken.has(relic.id)) continue;
    const pulse = 0.75 + Math.sin(Date.now() / 380) * 0.25;
    const glow = ctx.createRadialGradient(relic.x, relic.y, 2, relic.x, relic.y, 46);
    glow.addColorStop(0, relic.color + 'cc');
    glow.addColorStop(1, relic.color + '00');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(relic.x, relic.y, 46, 0, Math.PI * 2);
    ctx.fill();
    // Pedestal
    ctx.fillStyle = '#3a3f55';
    ctx.fillRect(relic.x - 16, relic.y + 6, 32, 12);
    // The relic: a floating diamond
    ctx.save();
    ctx.translate(relic.x, relic.y - 4);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = relic.color;
    ctx.globalAlpha = pulse;
    const s = 11;
    ctx.fillRect(-s / 2, -s / 2, s, s);
    ctx.restore();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#f2e6b8';
    ctx.font = 'bold 11px Georgia, serif';
    ctx.fillText(relic.name.toUpperCase(), relic.x, relic.y + 34);
  }
  ctx.textAlign = 'left';
}

function drawExit(ctx, open) {
  const { x, y, w, h } = EXIT_ZONE;
  const glow = ctx.createRadialGradient(x + w / 2, y + h / 2, 4, x + w / 2, y + h / 2, 90);
  const color = open ? '110, 255, 150' : '90, 200, 120';
  glow.addColorStop(0, `rgba(${color}, 0.55)`);
  glow.addColorStop(1, `rgba(${color}, 0)`);
  ctx.fillStyle = glow;
  ctx.fillRect(x - 50, y - 50, w + 100, h + 100);
  ctx.fillStyle = open ? '#12351d' : '#0e2416';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = open ? '#6eff96' : '#3f9e58';
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = open ? '#a9ffc2' : '#7fd695';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', x + w / 2, y + h / 2 + 5);
  ctx.textAlign = 'left';
  if (open) {
    ctx.fillStyle = '#a9ffc2';
    ctx.font = 'bold 12px Georgia, serif';
    ctx.fillText('▼ ALL RELICS — GO!', x + w / 2, y - 10);
  }
}

function drawVisionCone(ctx, guard) {
  const color = guard.coneColor();
  const steps = 26;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  for (let i = 0; i <= steps; i++) {
    const a = guard.facing - VISION_HALF_ANGLE + (2 * VISION_HALF_ANGLE * i) / steps;
    ctx.lineTo(guard.x + Math.cos(a) * VISION_RANGE, guard.y + Math.sin(a) * VISION_RANGE);
  }
  ctx.closePath();
  const g = ctx.createRadialGradient(guard.x, guard.y, 10, guard.x, guard.y, VISION_RANGE);
  g.addColorStop(0, `rgba(${color}, 0.42)`);
  g.addColorStop(0.75, `rgba(${color}, 0.20)`);
  g.addColorStop(1, `rgba(${color}, 0.05)`);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = `rgba(${color}, 0.35)`;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawGuard(ctx, guard) {
  drawVisionCone(ctx, guard);
  // Body: dark uniform with a brass helmet
  ctx.fillStyle = '#1c2438';
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = guard.state === 'alerted' ? '#ff5a5a' : '#8a93b8';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#c9a24b';
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, 6, 0, Math.PI * 2);
  ctx.fill();
  // Facing tick
  ctx.strokeStyle = '#e8ddc0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.lineTo(guard.x + Math.cos(guard.facing) * 20, guard.y + Math.sin(guard.facing) * 20);
  ctx.stroke();
  // Footstep bob
  const bob = Math.sin(guard.stepPhase) * 1.5;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(guard.x, guard.y + 15 + bob, 9, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  // Alert mark
  const mark = guard.mark();
  if (mark) {
    ctx.fillStyle = guard.state === 'alerted' ? '#ff5a5a' : '#f2a94c';
    ctx.font = 'bold 22px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(mark, guard.x, guard.y - 24);
    ctx.textAlign = 'left';
  }
}

function drawPlayer(ctx, player) {
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.ellipse(player.x, player.y + 12, 12, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  // Hooded cloak: a triangle pointing where the thief faces
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.facing);
  ctx.fillStyle = player.sneaking ? '#2e6f5e' : '#3f7d6b';
  ctx.beginPath();
  ctx.moveTo(16, 0);
  ctx.lineTo(-11, -11);
  ctx.lineTo(-7, 0);
  ctx.lineTo(-11, 11);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#0d2b23';
  ctx.beginPath();
  ctx.arc(4, 0, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Sneak = crouched: a smaller, lower silhouette ring
  if (player.sneaking) {
    ctx.strokeStyle = 'rgba(126, 226, 160, 0.7)';
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.arc(player.x, player.y, 18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawCoins(ctx, coins) {
  for (const coin of coins) {
    if (coin.t < 1) {
      ctx.fillStyle = '#f2c94c';
      ctx.beginPath();
      ctx.arc(coin.x, coin.y, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = `rgba(242, 201, 76, ${1 - coin.ring / 135})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(coin.targetX, coin.targetY, coin.ring, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#f2c94c';
      ctx.beginPath();
      ctx.arc(coin.targetX, coin.targetY, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawNoiseRing(ctx, player) {
  const r = player.noiseRadius();
  if (r > 0) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(player.x, player.y, r, 0, Math.PI * 2);
    ctx.stroke();
  }
}

/** Draw one frame of the museum. */
export function render(ctx, state) {
  drawFloor(ctx);
  drawLightPools(ctx);
  drawPatrolRoutes(ctx, state.guards);
  drawWalls(ctx);
  drawCover(ctx);
  drawRelics(ctx, state.takenRelics);
  drawExit(ctx, state.takenRelics.size === RELICS.length);
  drawNoiseRing(ctx, state.player);
  for (const guard of state.guards) drawGuard(ctx, guard);
  drawCoins(ctx, state.coins);
  drawPlayer(ctx, state.player);
  // Vignette: the night closes in at the edges
  const v = ctx.createRadialGradient(640, 360, 260, 640, 360, 720);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.42)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, LEVEL_WIDTH, LEVEL_HEIGHT);
}
