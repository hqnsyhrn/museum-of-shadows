// Museum of Shadows — the game loop. Boots the hall, runs the heist, and
// stages the four screenshot moments when the page is opened with ?shot=.
// Play it: WASD or arrows to move, Shift to sneak, Space to throw a coin,
// E to steal a relic, R to start over. Steal all three relics, then reach
// the green EXIT without being caught.

import { VIEW_W, VIEW_H, RELIC_COUNT } from './config.js';
import { buildLevel } from './level.js';
import { createGuards, updateGuard, distractGuards, chasingGuard } from './guards.js';
import { createPlayer, updatePlayer, throwCoin, relicInReach, stealRelic, atExit } from './player.js';
import { createSkylight, updateSkylight, isLit, visibilityFactor } from './skylight.js';
import { render } from './render.js';
import { stageShot } from './shots.js';
import { unlockAudio, footstep, guardStep, coinClink, stealChime, alarmSting, winChime } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW_W;
canvas.height = VIEW_H;

const level = buildLevel();

function freshState() {
  return {
    level,
    player: createPlayer(),
    guards: createGuards(),
    sky: createSkylight(),
    time: 0,
    phase: 'playing', // playing | caught | won
    caughtBy: null,
    message: null,
    nearRelic: null,
    frozen: false,
  };
}

let state = freshState();
const keys = {};
let last = performance.now();
let guardStepTimer = 0;
let alarmWasOn = false;

function reset() {
  state = freshState();
}

window.addEventListener('keydown', (e) => {
  unlockAudio();
  const k = e.key.toLowerCase();
  keys[k] = true;
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
  if (k === 'r') reset();
  if (k === ' ' && state.phase === 'playing' && !state.frozen) {
    if (throwCoin(state.player)) coinClink();
  }
  if (k === 'e' && state.phase === 'playing' && !state.frozen) {
    const relic = relicInReach(state.player, level);
    if (relic && stealRelic(state.player, relic)) stealChime();
  }
});

window.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener('mousedown', (e) => {
  unlockAudio();
  if (state.phase !== 'playing' || state.frozen) return;
  const rect = canvas.getBoundingClientRect();
  const sx = ((e.clientX - rect.left) / rect.width) * VIEW_W;
  const sy = ((e.clientY - rect.top) / rect.height) * VIEW_H;
  // Click to throw a coin toward the clicked tile.
  const dx = sx - VIEW_W / 2;
  const dy = sy - VIEW_H / 2;
  state.player.facing = Math.atan2(dy, dx);
  if (throwCoin(state.player)) coinClink();
});

function update(dt) {
  if (state.frozen || state.phase !== 'playing') return;
  state.time += dt;
  updateSkylight(state.sky, dt);
  const p = state.player;

  const stepped = updatePlayer(p, dt, keys, level, (sneaking) => footstep(sneaking));
  if (stepped && stepped.coinLanded) {
    distractGuards(state.guards, stepped.coinLanded.x, stepped.coinLanded.y);
  }

  const vis = visibilityFactor(state.sky, p.x, p.y, p.sneaking);
  for (const g of state.guards) {
    const result = updateGuard(g, dt, level, p, vis);
    if (result === 'caught') {
      state.phase = 'caught';
      state.caughtBy = g.name;
      state.message = 'CAUGHT BY ' + g.name;
      alarmSting();
      return;
    }
  }

  const chaser = chasingGuard(state.guards);
  if (chaser && !alarmWasOn) alarmSting();
  alarmWasOn = !!chaser;
  state.message = chaser ? 'SPOTTED BY ' + chaser.name + ' — BREAK LINE OF SIGHT!' : null;

  // Footsteps of the nearest warden, louder the closer they are.
  guardStepTimer += dt;
  if (guardStepTimer > 0.5) {
    guardStepTimer = 0;
    let nearest = 99;
    for (const g of state.guards) {
      nearest = Math.min(nearest, Math.hypot(g.x - p.x, g.y - p.y));
    }
    if (nearest < 5) guardStep(nearest);
  }

  state.nearRelic = relicInReach(p, level);
  if (p.stolen.length >= RELIC_COUNT && atExit(p, level)) {
    state.phase = 'won';
    winChime();
  }
}

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  render(ctx, state);
  requestAnimationFrame(frame);
}

// A staged shot (?shot=cover|relic|spotted|escape) freezes one exact moment
// of the heist for the screenshot — still a real frame of the running game.
const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  // Screenshots are the canvas alone, edge to edge: no page hint below it.
  const hint = document.querySelector('.hint');
  if (hint) hint.style.display = 'none';
  canvas.style.width = '1280px';
  canvas.style.height = '720px';
  stageShot(state, shot);
  updateSkylight(state.sky, 0);
  render(ctx, state);
  window.__shotReady = true;
} else {
  requestAnimationFrame(frame);
}
