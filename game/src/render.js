// The renderer: draws the night museum in true isometric 3D on one canvas —
// warm marble, gold-framed paintings, rope-barriered relics, vision cones,
// named wardens, the sweeping skylight — and the full HUD rail the heist
// is read from: loot, time, detection, light and shadow, coins.

import { VIEW_W, VIEW_H, TILE_W, TILE_H, COLORS, RELICS, LAMPS } from './config.js';
import { project, tileCorners, depthOf } from './projection.js';
import { skylightPool, isLit } from './skylight.js';

function poly(ctx, pts, fill, stroke, width = 1) {
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.stroke();
  }
}

// An extruded box standing on tile (gx, gy), w/d in tiles, h in pixels.
function isoBox(ctx, gx, gy, w, d, h, top, left, right) {
  const a = project(gx, gy, h);
  const b = project(gx + w, gy, h);
  const c = project(gx + w, gy + d, h);
  const e = project(gx, gy + d, h);
  const a0 = project(gx, gy, 0);
  const b0 = project(gx + w, gy, 0);
  const c0 = project(gx + w, gy + d, 0);
  const e0 = project(gx, gy + d, 0);
  poly(ctx, [e0, c0, c, e], left); // south face
  poly(ctx, [b0, c0, c, b], right); // east face
  poly(ctx, [a, b, c, e], top); // top face
}

function text(ctx, s, x, y, size, color, bold = false, align = 'left') {
  ctx.font = (bold ? '700 ' : '') + size + 'px Georgia, serif';
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(s, x, y);
}

function outlinedText(ctx, s, x, y, size, color) {
  ctx.font = '700 ' + size + 'px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(10,8,12,0.85)';
  ctx.strokeText(s, x, y);
  ctx.fillStyle = color;
  ctx.fillText(s, x, y);
}

export function render(ctx, state) {
  const { level, player, guards, sky, time, phase, message } = state;
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);

  // --- the dark hall behind the marble ---
  const bg = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  bg.addColorStop(0, '#171019');
  bg.addColorStop(0.55, '#241a20');
  bg.addColorStop(1, '#120d12');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // Skylight glow from the glass roof, top centre.
  const glow = ctx.createRadialGradient(640, 10, 10, 640, 10, 520);
  glow.addColorStop(0, 'rgba(255,236,170,0.20)');
  glow.addColorStop(1, 'rgba(255,236,170,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  drawOuterFloor(ctx);
  drawFloor(ctx, level);  drawSkylight(ctx, sky);
  drawWalls(ctx, level);
  drawCones(ctx, guards);
  drawEntities(ctx, state);
  drawHud(ctx, state);
  if (message) drawBanner(ctx, message);
  if (phase === 'caught') drawEndOverlay(ctx, 'CAUGHT!', '#ff4d5e', state);
  if (phase === 'won') drawEndOverlay(ctx, 'HEIST COMPLETE', '#ffc93c', state);
}

function drawOuterFloor(ctx) {
  // The hall does not end at the playable marble: a darker outer floor
  // stretches to the frame's corners, so the room fills the shot instead
  // of floating in a black void.
  const centre = { x: 640, y: 401 };
  const corners = [project(0, 0), project(16, 0), project(16, 12), project(0, 12)];
  const scale = (pts, s) => pts.map((p) => ({
    x: centre.x + (p.x - centre.x) * s,
    y: centre.y + (p.y - centre.y) * s,
  }));
  poly(ctx, scale(corners, 2.1), '#20161c');
  ctx.strokeStyle = 'rgba(255,220,170,0.05)';
  ctx.lineWidth = 1;
  for (const s of [1.35, 1.7]) {
    const ring = scale(corners, s);
    ctx.beginPath();
    ctx.moveTo(ring[0].x, ring[0].y);
    for (let i = 1; i < ring.length; i++) ctx.lineTo(ring[i].x, ring[i].y);
    ctx.closePath();
    ctx.stroke();
  }
}

function drawFloor(ctx, level) {
  // Marble checker, plus a red carpet runner down the middle of the hall.
  for (let y = 0; y < 12; y++) {
    for (let x = 0; x < 16; x++) {
      if (level.walls.has(x + ',' + y)) continue;
      const corners = tileCorners(x, y);
      const marble = (x + y) % 2 === 0 ? COLORS.floorA : COLORS.floorB;
      poly(ctx, corners, marble);
      const carpet = (y === 5 && x >= 1 && x <= 14) || (x === 7 && y >= 1 && y <= 10);
      if (carpet) {
        const inset = tileCorners(x, y).map((p) => {
          const c = project(x + 0.5, y + 0.5);
          return { x: c.x + (p.x - c.x) * 0.82, y: c.y + (p.y - c.y) * 0.82 };
        });
        poly(ctx, inset, COLORS.carpet, COLORS.carpetEdge, 1);
      }
    }
  }
  // Slab edge: the marble floor is a thick slab, not a floating diamond.
  const s0 = project(0, 12, 0);
  const s1 = project(16, 12, 0);
  const s2 = project(16, 0, 0);
  poly(ctx, [
    { x: s0.x, y: s0.y }, { x: s1.x, y: s1.y },
    { x: s1.x, y: s1.y + 14 }, { x: s0.x, y: s0.y + 14 },
  ], '#3a2a1e');
  poly(ctx, [
    { x: s1.x, y: s1.y }, { x: s2.x, y: s2.y },
    { x: s2.x, y: s2.y + 14 }, { x: s1.x, y: s1.y + 14 },
  ], '#2c1f16');
}

function drawSkylight(ctx, sky) {
  const pool = skylightPool(sky);
  const c = project(pool.x, pool.y);
  const rx = pool.r * TILE_W * 0.72;
  const ry = pool.r * TILE_H * 0.72;
  // The beam itself, slanting down from the glass roof.
  ctx.save();
  ctx.globalAlpha = 0.10;
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath();
  ctx.moveTo(560, 0);
  ctx.lineTo(720, 0);
  ctx.lineTo(c.x + rx * 0.7, c.y);
  ctx.lineTo(c.x - rx * 0.7, c.y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // The pool of light on the marble.
  const g = ctx.createRadialGradient(c.x, c.y, 4, c.x, c.y, rx);
  g.addColorStop(0, 'rgba(255,240,180,0.5)');
  g.addColorStop(0.7, 'rgba(255,240,180,0.22)');
  g.addColorStop(1, 'rgba(255,240,180,0)');
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.scale(1, ry / rx);
  ctx.translate(-c.x, -c.y);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(c.x, c.y, rx, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawWalls(ctx, level) {
  // North wall: warm terracotta, gold trim, four framed paintings.
  const n0 = project(0, 0, 0);
  const n1 = project(16, 0, 0);
  const n0t = project(0, 0, 78);
  const n1t = project(16, 0, 78);
  poly(ctx, [n0, n1, n1t, n0t], COLORS.wallNorth);
  poly(ctx, [n0t, n1t, { x: n1t.x, y: n1t.y + 5 }, { x: n0t.x, y: n0t.y + 5 }], COLORS.wallTrim);
  const paintings = [2.5, 6.5, 10.5, 13.5];
  paintings.forEach((gx, i) => {
    const cx = project(gx, 0, 42);
    const w = 46;
    const h = 34;
    const skew = 0.5;
    const frame = [
      { x: cx.x - w / 2, y: cx.y - h / 2 - skew * 8 },
      { x: cx.x + w / 2, y: cx.y - h / 2 + skew * 8 },
      { x: cx.x + w / 2, y: cx.y + h / 2 + skew * 8 },
      { x: cx.x - w / 2, y: cx.y + h / 2 - skew * 8 },
    ];
    poly(ctx, frame, COLORS.frameGold);
    const inner = frame.map((p) => {
      const dx = p.x - cx.x;
      const dy = p.y - cx.y;
      return { x: cx.x + dx * 0.8, y: cy(cx, dy) };
      function cy(c, d) { return c.y + d * 0.8; }
    });
    const scenes = ['#2f5d8a', '#7a4a6e', '#3f7a4d', '#8a6a2f'];
    poly(ctx, inner, scenes[i % scenes.length]);
    // A tiny landscape in each frame: a hill and a moon.
    ctx.fillStyle = 'rgba(240,220,180,0.9)';
    ctx.beginPath();
    ctx.arc(cx.x + 10, cy0(cx, -6), 4, 0, Math.PI * 2);
    ctx.fill();
    function cy0(c, d) { return c.y + d; }
  });
  // West wall: darker, with the CLOSED banner and a wall lamp.
  const w0 = project(0, 0, 0);
  const w1 = project(0, 12, 0);
  const w0t = project(0, 0, 78);
  const w1t = project(0, 12, 78);
  poly(ctx, [w0, w1, w1t, w0t], COLORS.wallWest);
  poly(ctx, [w0t, w1t, { x: w1t.x, y: w1t.y + 5 }, { x: w0t.x, y: w0t.y + 5 }], COLORS.wallTrim);
  const banner = project(0, 6, 52);
  ctx.save();
  ctx.translate(banner.x, banner.y);
  ctx.rotate(-0.42);
  ctx.fillStyle = '#e8dcc2';
  ctx.fillRect(-34, -13, 68, 26);
  ctx.strokeStyle = '#8a5a3b';
  ctx.lineWidth = 2;
  ctx.strokeRect(-34, -13, 68, 26);
  ctx.fillStyle = '#5a1f24';
  ctx.font = '700 13px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('CLOSED', 0, 1);
  ctx.restore();
  // Wall lamps glow on the north wall.
  for (const [lx, ly] of LAMPS) {
    const p = project(lx + 0.5, ly + 0.5, 30);
    const g = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, 46);
    g.addColorStop(0, 'rgba(255,214,120,0.5)');
    g.addColorStop(1, 'rgba(255,214,120,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  // The green EXIT door on the east wall.
  const e = project(15.5, 5.5, 0);
  const eTop = project(15.5, 5.5, 62);
  ctx.save();
  ctx.shadowColor = COLORS.exit;
  ctx.shadowBlur = 22;
  ctx.fillStyle = '#0d5c2e';
  ctx.beginPath();
  ctx.moveTo(e.x - 26, e.y);
  ctx.lineTo(e.x - 26, eTop.y);
  ctx.lineTo(e.x + 26, eTop.y);
  ctx.lineTo(e.x + 26, e.y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = COLORS.exit;
  ctx.beginPath();
  ctx.moveTo(e.x - 20, e.y);
  ctx.lineTo(e.x - 20, eTop.y + 6);
  ctx.lineTo(e.x + 20, eTop.y + 6);
  ctx.lineTo(e.x + 20, e.y);
  ctx.closePath();
  ctx.fill();
  outlinedText(ctx, 'EXIT', e.x, eTop.y - 16, 15, '#7dffab');
}

function drawCones(ctx, guards) {
  for (const g of guards) {
    const base = project(g.x, g.y, 2);
    const alert = g.state === 'chase' || g.state === 'suspicious';
    const range = 5.2;
    const pts = [base];
    const steps = 14;
    for (let i = 0; i <= steps; i++) {
      const a = g.facing - 0.61 + (1.22 * i) / steps;
      const p = project(g.x + Math.cos(a) * range, g.y + Math.sin(a) * range, 2);
      pts.push(p);
    }
    ctx.save();
    ctx.globalAlpha = alert ? 0.95 : 0.9;
    poly(ctx, pts, alert ? COLORS.coneAlert : COLORS.cone);
    ctx.restore();
  }
}

function drawEntities(ctx, state) {
  const { level, player, guards, sky } = state;
  const items = [];
  for (const ped of level.pedestals) items.push({ kind: 'pedestal', d: depthOf(ped.x, ped.y), ped });
  for (const col of level.columns) items.push({ kind: 'column', d: depthOf(col.x, col.y), col });
  for (const g of guards) items.push({ kind: 'guard', d: depthOf(g.x, g.y), g });
  items.push({ kind: 'player', d: depthOf(player.x, player.y), player });
  items.sort((a, b) => a.d - b.d);
  for (const it of items) {
    if (it.kind === 'pedestal') drawPedestal(ctx, it.ped, state);
    else if (it.kind === 'column') drawColumn(ctx, it.col);
    else if (it.kind === 'guard') drawGuard(ctx, it.g);
    else drawPlayer(ctx, it.player, sky);
  }
  drawCoin(ctx, player);
}

function drawPedestal(ctx, ped, state) {
  const { player } = state;
  isoBox(ctx, ped.x + 0.18, ped.y + 0.18, 0.64, 0.64, 34, COLORS.pedestalTop, '#4a3023', COLORS.pedestal);
  const top = project(ped.x + 0.5, ped.y + 0.5, 34);
  if (ped.relic && !player.stolen.includes(ped.relic.id)) {
    drawRelic(ctx, ped.relic, top);
    outlinedText(ctx, ped.relic.name, top.x, top.y - 52, 11, ped.relic.color);
    drawRopes(ctx, ped);
  } else if (!ped.relic) {
    // A plain display: a small marble bust on the pedestal.
    ctx.fillStyle = '#c9b18a';
    ctx.beginPath();
    ctx.ellipse(top.x, top.y - 8, 7, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(top.x, top.y - 20, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  // A brass plaque on the pedestal's face.
  const plaque = project(ped.x + 0.5, ped.y + 0.82, 16);
  ctx.fillStyle = '#d8a24a';
  ctx.fillRect(plaque.x - 10, plaque.y - 4, 20, 8);
}

function drawRopes(ctx, ped) {
  // Red velvet rope around a relic pedestal: four brass posts, two sags.
  const posts = [
    [ped.x - 0.28, ped.y - 0.28], [ped.x + 1.28, ped.y - 0.28],
    [ped.x - 0.28, ped.y + 1.28], [ped.x + 1.28, ped.y + 1.28],
  ];
  const tops = [];
  for (const [px, py] of posts) {
    const b = project(px, py, 0);
    const t = project(px, py, 16);
    ctx.strokeStyle = '#d8a24a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(t.x, t.y);
    ctx.stroke();
    ctx.fillStyle = '#e8b64c';
    ctx.beginPath();
    ctx.arc(t.x, t.y, 2.5, 0, Math.PI * 2);
    ctx.fill();
    tops.push(t);
  }
  ctx.strokeStyle = '#a12330';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(tops[2].x, tops[2].y);
  ctx.quadraticCurveTo((tops[2].x + tops[3].x) / 2, Math.max(tops[2].y, tops[3].y) + 9, tops[3].x, tops[3].y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(tops[1].x, tops[1].y);
  ctx.quadraticCurveTo((tops[1].x + tops[3].x) / 2, Math.max(tops[1].y, tops[3].y) + 9, tops[3].x, tops[3].y);
  ctx.stroke();
}

function drawRelic(ctx, relic, top) {
  const x = top.x;
  const y = top.y - 12;
  ctx.save();
  ctx.shadowColor = relic.color;
  ctx.shadowBlur = 18;
  if (relic.id === 'scarab') {
    // The Golden Scarab: a winged gold beetle.
    ctx.fillStyle = relic.color;
    ctx.beginPath();
    ctx.ellipse(x, y, 11, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8a6414';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y - 8);
    ctx.lineTo(x, y + 8);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,233,150,0.9)';
    ctx.beginPath();
    ctx.ellipse(x - 12, y - 4, 9, 4, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 12, y - 4, 9, 4, 0.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (relic.id === 'idol') {
    // The Jade Idol: a small green statue, head and folded arms.
    ctx.fillStyle = relic.color;
    ctx.beginPath();
    ctx.moveTo(x - 9, y + 10);
    ctx.lineTo(x - 6, y - 4);
    ctx.lineTo(x + 6, y - 4);
    ctx.lineTo(x + 9, y + 10);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y - 10, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0d3d24';
    ctx.fillRect(x - 7, y + 1, 14, 3);
  } else {
    // The Crimson Crown: three points, a band, three gems.
    ctx.fillStyle = relic.color;
    ctx.beginPath();
    ctx.moveTo(x - 13, y + 8);
    ctx.lineTo(x - 13, y - 6);
    ctx.lineTo(x - 6, y + 1);
    ctx.lineTo(x, y - 12);
    ctx.lineTo(x + 6, y + 1);
    ctx.lineTo(x + 13, y - 6);
    ctx.lineTo(x + 13, y + 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff';
    for (const gx of [-9, 0, 9]) {
      ctx.beginPath();
      ctx.arc(x + gx, y + 3, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawColumn(ctx, col) {
  isoBox(ctx, col.x + 0.15, col.y + 0.15, 0.7, 0.7, 92, COLORS.column, '#a8906a', '#8a7550');
  const top = project(col.x + 0.5, col.y + 0.5, 92);
  ctx.fillStyle = '#d8c49a';
  ctx.beginPath();
  ctx.ellipse(top.x, top.y, 24, 10, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawGuard(ctx, g) {
  const base = project(g.x, g.y, 0);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(base.x, base.y, 16, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  const bob = Math.sin(g.bob) * 1.5;
  const bodyH = 30;
  isoBox(ctx, g.x - 0.17, g.y - 0.17, 0.34, 0.34, bodyH, COLORS.guard, '#16264a', '#12203f');
  const top = project(g.x, g.y, bodyH + bob);
  // Pale face and peaked cap.
  ctx.fillStyle = '#e8c9a0';
  ctx.beginPath();
  ctx.arc(top.x, top.y - 6, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#16264a';
  ctx.beginPath();
  ctx.arc(top.x, top.y - 8, 7, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = COLORS.guardTrim;
  ctx.fillRect(top.x - 7, top.y - 9, 14, 2);
  // Name, or the mark of what the warden is thinking.
  if (g.state === 'chase') {
    outlinedText(ctx, '!', top.x, top.y - 26, 18, '#ff4d5e');
    outlinedText(ctx, g.name, top.x, top.y - 44, 10, '#ff8a80');
  } else if (g.state === 'suspicious') {
    outlinedText(ctx, '!', top.x, top.y - 26, 16, '#ffc93c');
    outlinedText(ctx, g.name, top.x, top.y - 42, 10, '#ffd97a');
  } else if (g.state === 'investigate') {
    outlinedText(ctx, '?', top.x, top.y - 26, 16, '#7dd7ff');
  } else if (g.suspicion > 20) {
    outlinedText(ctx, g.name, top.x, top.y - 40, 10, '#cbbd9a');
  }
}

function drawPlayer(ctx, p, sky) {
  const base = project(p.x, p.y, 0);
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(base.x, base.y, 15, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  // A gold ring under the thief, so the eye finds them at a glance.
  ctx.strokeStyle = 'rgba(232,182,76,0.85)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(base.x, base.y, 17, 7, 0, 0, Math.PI * 2);
  ctx.stroke();
  const lit = isLit(sky, p.x, p.y);
  const h = p.sneaking ? 24 : 31;
  isoBox(ctx, p.x - 0.16, p.y - 0.16, 0.32, 0.32, h, COLORS.player, '#1e2240', '#171a33');
  const top = project(p.x, p.y, h);
  ctx.fillStyle = '#1a1d31';
  ctx.beginPath();
  ctx.arc(top.x, top.y - 5, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#e8b64c';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(top.x, top.y - 5, 7, 0.3, Math.PI - 0.3);
  ctx.stroke();
  if (lit) {
    ctx.strokeStyle = 'rgba(255,240,180,0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(top.x, top.y - 12, 15, 0, Math.PI * 2);
    ctx.stroke();
    outlinedText(ctx, 'LIT', top.x, top.y - 34, 10, '#ffe9a8');
  } else if (p.sneaking) {
    outlinedText(ctx, 'HIDDEN', top.x, top.y - 34, 10, '#9fd8ff');
  }
}

function drawCoin(ctx, p) {
  if (!p.coin) return;
  const t = p.coin.t;
  const x = p.coin.x + (p.coin.tx - p.coin.x) * t;
  const y = p.coin.y + (p.coin.ty - p.coin.y) * t;
  const z = Math.sin(t * Math.PI) * 26;
  const pos = project(x, y, z);
  ctx.save();
  ctx.shadowColor = '#ffc93c';
  ctx.shadowBlur = 12;
  ctx.fillStyle = '#ffc93c';
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = '#8a6414';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2);
  ctx.stroke();
}

function relicIcon(ctx, relic, x, y, stolen) {
  ctx.save();
  ctx.globalAlpha = stolen ? 1 : 0.28;
  ctx.shadowColor = relic.color;
  ctx.shadowBlur = stolen ? 8 : 0;
  if (relic.id === 'scarab') {
    ctx.fillStyle = relic.color;
    ctx.beginPath();
    ctx.ellipse(x, y, 7, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (relic.id === 'idol') {
    ctx.fillStyle = relic.color;
    ctx.beginPath();
    ctx.moveTo(x - 6, y + 6);
    ctx.lineTo(x - 4, y - 4);
    ctx.lineTo(x + 4, y - 4);
    ctx.lineTo(x + 6, y + 6);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y - 7, 4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = relic.color;
    ctx.beginPath();
    ctx.moveTo(x - 8, y + 6);
    ctx.lineTo(x - 8, y - 3);
    ctx.lineTo(x - 4, y + 1);
    ctx.lineTo(x, y - 7);
    ctx.lineTo(x + 4, y + 1);
    ctx.lineTo(x + 8, y - 3);
    ctx.lineTo(x + 8, y + 6);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawHud(ctx, state) {
  const { player, guards, time, phase } = state;
  const detection = Math.round(guards.reduce((m, g) => Math.max(m, g.suspicion), 0));
  const lit = isLit(state.sky, player.x, player.y);

  // --- top rail ---
  ctx.fillStyle = COLORS.hudBg;
  ctx.fillRect(0, 0, VIEW_W, 64);
  ctx.fillStyle = COLORS.hudGold;
  ctx.fillRect(0, 64, VIEW_W, 2);

  text(ctx, 'MUSEUM OF SHADOWS', 20, 24, 21, COLORS.hudGold, true);
  text(ctx, '3 RELICS · 8 GUARDS · COIN TOSS · SWEEPING SKYLIGHT', 20, 47, 11, COLORS.hudDim);

  // Loot: three relic icons, lit as they are stolen.
  text(ctx, 'LOOT', 430, 22, 11, COLORS.hudDim, true);
  RELICS.forEach((r, i) => {
    relicIcon(ctx, r, 452 + i * 26, 44, player.stolen.includes(r.id));
  });
  text(ctx, player.stolen.length + '/3', 530, 44, 15, COLORS.hudText, true);

  // Timer.
  const mm = String(Math.floor(time / 60)).padStart(2, '0');
  const ss = String(Math.floor(time % 60)).padStart(2, '0');
  text(ctx, 'TIME', 580, 22, 11, COLORS.hudDim, true);
  text(ctx, mm + ':' + ss, 580, 44, 16, COLORS.hudText, true);

  // Detection meter.
  text(ctx, 'DETECTION', 680, 22, 11, COLORS.hudDim, true);
  ctx.fillStyle = '#2a2430';
  ctx.fillRect(680, 34, 150, 12);
  const detColor = detection < 40 ? '#3ddc84' : detection < 75 ? '#ffc93c' : '#ff4d5e';
  ctx.fillStyle = detColor;
  ctx.fillRect(680, 34, Math.max(2, (150 * detection) / 100), 12);
  ctx.strokeStyle = COLORS.hudGold;
  ctx.lineWidth = 1;
  ctx.strokeRect(680, 34, 150, 12);
  text(ctx, detection + '%', 838, 42, 14, detColor, true);

  // Light / shadow visibility.
  text(ctx, 'VISIBILITY', 900, 22, 11, COLORS.hudDim, true);
  ctx.fillStyle = lit ? '#ffe9a8' : '#3a4a6b';
  ctx.beginPath();
  ctx.arc(910, 42, 7, 0, Math.PI * 2);
  ctx.fill();
  text(ctx, lit ? 'LIT — SEEN FAST' : 'SHADOW — HARD TO SEE', 924, 42, 13, lit ? '#ffe9a8' : '#9fd8ff', true);

  // Coins.
  text(ctx, 'COINS', 1120, 22, 11, COLORS.hudDim, true);
  for (let i = 0; i < player.coins; i++) {
    ctx.fillStyle = '#ffc93c';
    ctx.beginPath();
    ctx.arc(1132 + i * 18, 42, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  text(ctx, '×' + player.coins, 1180, 42, 14, COLORS.hudText, true);

  // --- bottom rail: controls and the hall's word on you ---
  ctx.fillStyle = COLORS.hudBg;
  ctx.fillRect(0, VIEW_H - 30, VIEW_W, 30);
  ctx.fillStyle = COLORS.hudGold;
  ctx.fillRect(0, VIEW_H - 30, VIEW_W, 1);
  text(ctx, 'WASD MOVE · SHIFT SNEAK · SPACE THROW COIN · E STEAL · R RESTART', 20, VIEW_H - 15, 12, COLORS.hudDim);
  const chaser = guards.find((g) => g.state === 'chase');
  const status = chaser
    ? 'ALARM — ' + chaser.name + ' IS CHASING YOU'
    : player.stolen.length === 3
      ? 'ALL RELICS STOLEN — REACH THE GREEN EXIT!'
      : '8 WARDENS ON PATROL · STAY OUT OF THE SKYLIGHT';
  text(ctx, status, VIEW_W - 20, VIEW_H - 15, 12, chaser ? '#ff8a80' : COLORS.hudDim, false, 'right');

  // Objective prompt when a relic is in reach.
  if (state.nearRelic && phase === 'playing') {
    ctx.fillStyle = 'rgba(12,10,16,0.85)';
    const label = 'PRESS E — STEAL THE ' + state.nearRelic.name;
    const w = 340;
    ctx.fillRect((VIEW_W - w) / 2, VIEW_H - 78, w, 30);
    ctx.strokeStyle = state.nearRelic.color;
    ctx.lineWidth = 1.5;
    ctx.strokeRect((VIEW_W - w) / 2, VIEW_H - 78, w, 30);
    text(ctx, label, VIEW_W / 2, VIEW_H - 62, 14, state.nearRelic.color, true, 'center');
  }
}

function drawBanner(ctx, message) {
  const w = 620;
  ctx.fillStyle = 'rgba(90,10,16,0.92)';
  ctx.fillRect((VIEW_W - w) / 2, 78, w, 34);
  ctx.strokeStyle = '#ff8a80';
  ctx.lineWidth = 1.5;
  ctx.strokeRect((VIEW_W - w) / 2, 78, w, 34);
  text(ctx, message, VIEW_W / 2, 96, 15, '#ffd7d4', true, 'center');
}

function drawEndOverlay(ctx, title, color, state) {
  ctx.fillStyle = 'rgba(8,6,10,0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  text(ctx, title, VIEW_W / 2, 300, 44, color, true, 'center');
  const mm = String(Math.floor(state.time / 60)).padStart(2, '0');
  const ss = String(Math.floor(state.time % 60)).padStart(2, '0');
  text(ctx, 'LOOT ' + state.player.stolen.length + '/3 · TIME ' + mm + ':' + ss, VIEW_W / 2, 350, 18, COLORS.hudText, false, 'center');
  text(ctx, 'PRESS R TO PLAY AGAIN', VIEW_W / 2, 390, 15, COLORS.hudDim, false, 'center');
}
