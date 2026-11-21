// Museum of Shadows — bootstrap and game loop.
// The loop is small on purpose: read input, move the thief, move the guards,
// check relics and the exit, draw. Everything else lives in its own file.
// ?scene=cover|near|hiding|win stages a fixed moment for a screenshot;
// add &freeze=1 to hold that moment still.

import { LEVEL_WIDTH, LEVEL_HEIGHT, RELICS, EXIT_ZONE, PLAYER_START, GUARD_ROUTES } from './level.js';
import { createGuards } from './guards.js';
import { Player, Coin } from './player.js';
import { SoundBank } from './audio.js';
import { Hud } from './ui.js';
import { render } from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const state = {
  player: new Player(PLAYER_START),
  guards: createGuards(GUARD_ROUTES),
  coins: [],
  takenRelics: new Set(),
  elapsed: 0,
  phase: 'playing', // playing | won | caught
  timesSpotted: 0,
  wasAlerted: false,
};

const hud = new Hud();
const sounds = new SoundBank();
const keys = new Set();
let lastTime = 0;
let playerStepTimer = 0;
let guardStepTimer = 0;

function restart() {
  state.player.reset(PLAYER_START);
  state.guards = createGuards(GUARD_ROUTES);
  state.coins = [];
  state.takenRelics = new Set();
  state.elapsed = 0;
  state.phase = 'playing';
  state.timesSpotted = 0;
  state.wasAlerted = false;
  hud.hideOverlay();
  hud.toast('The museum sleeps. Steal the 3 relics, then reach the EXIT.');
}

function formatTime(seconds) {
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(Math.floor(seconds % 60)).padStart(2, '0');
  return `${mm}:${ss}`;
}

function onCaught(guard) {
  if (state.phase !== 'playing') return;
  state.phase = 'caught';
  hud.showOverlay(
    'CAUGHT',
    `${guard.name} caught you in the ${guard.state === 'alerted' ? 'galleries' : 'dark'}. The night ends here — the relics stay behind their glass.`,
    `Relics stolen: ${state.takenRelics.size} of 3 · Time: ${formatTime(state.elapsed)}`,
    'Try again',
    restart,
  );
}

function onWin() {
  if (state.phase !== 'playing') return;
  state.phase = 'won';
  sounds.winChord();
  const unseen = state.timesSpotted === 0;
  hud.showOverlay(
    unseen ? 'ESCAPED UNSEEN' : 'ESCAPED',
    unseen
      ? 'Three relics, no alarm, no trace. The dawn finds the museum poorer and none the wiser.'
      : 'You slipped out with all three relics — but the guards will remember your face.',
    `Time: ${formatTime(state.elapsed)} · Times spotted: ${state.timesSpotted} · Coins left: ${state.player.coins}`,
    'Steal again',
    restart,
  );
}

function checkRelics() {
  for (const relic of RELICS) {
    if (state.takenRelics.has(relic.id)) continue;
    if (Math.hypot(state.player.x - relic.x, state.player.y - relic.y) < 32) {
      state.takenRelics.add(relic.id);
      state.player.relics = state.takenRelics.size;
      sounds.relicChime();
      if (state.takenRelics.size === RELICS.length) {
        hud.toast('All three relics! Now reach the EXIT — unseen.', 3400);
      } else {
        hud.toast(`${relic.name} stolen — ${state.takenRelics.size} of 3.`, 2600);
      }
    }
  }
}

function checkExit() {
  if (state.takenRelics.size !== RELICS.length) return;
  const p = state.player;
  if (p.x > EXIT_ZONE.x && p.x < EXIT_ZONE.x + EXIT_ZONE.w && p.y > EXIT_ZONE.y - 10 && p.y < EXIT_ZONE.y + EXIT_ZONE.h) {
    onWin();
  }
}

function update(dt) {
  if (state.phase !== 'playing') return;
  state.elapsed += dt;
  state.player.update(dt, keys);

  // The thief's own footsteps: soft, and softer still while sneaking.
  if (state.player.moving) {
    playerStepTimer -= dt;
    if (playerStepTimer <= 0) {
      playerStepTimer = state.player.sneaking ? 0.52 : 0.34;
      sounds.footstep(0, state.player.sneaking ? 0.02 : 0.05);
    }
  }

  // A guard's tread grows louder as he nears: listen for it.
  guardStepTimer -= dt;
  if (guardStepTimer <= 0) {
    guardStepTimer = 0.3;
    let nearest = null;
    let nearestDist = 340;
    for (const guard of state.guards) {
      const d = Math.hypot(guard.x - state.player.x, guard.y - state.player.y);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = guard;
      }
    }
    if (nearest) {
      const pan = (nearest.x - state.player.x) / 340;
      sounds.footstep(pan, 0.16 * (1 - nearestDist / 340));
    }
  }

  // Running feet carry: guards in earshot come to look.
  const noise = state.player.noiseRadius();
  if (noise > 0) {
    for (const guard of state.guards) {
      if (Math.hypot(guard.x - state.player.x, guard.y - state.player.y) < noise) {
        guard.hearNoise(state.player.x, state.player.y);
      }
    }
  }

  const alertedBefore = state.guards.some((g) => g.state === 'alerted');
  for (const guard of state.guards) guard.update(dt, state.player, onCaught);
  const alertedNow = state.guards.some((g) => g.state === 'alerted');
  if (alertedNow && !alertedBefore) {
    state.timesSpotted += 1;
    state.player.everAlerted = true;
    sounds.alarmSting();
    hud.toast('Spotted! Break line of sight and hide until they calm down.', 3200);
  }

  for (const coin of state.coins) coin.update(dt);
  state.coins = state.coins.filter((c) => !c.done);

  checkRelics();
  checkExit();
  hud.update(state);
}

function frame(time) {
  const dt = Math.min(0.05, (time - lastTime) / 1000 || 0);
  lastTime = time;
  update(dt);
  render(ctx, state);
  if (state.phase === 'playing') requestAnimationFrame(frame);
}

// --- Input: keyboard and mouse -------------------------------------------

window.addEventListener('keydown', (event) => {
  sounds.ensure();
  const key = event.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) event.preventDefault();
  if (key === 'r') {
    restart();
    return;
  }
  if (key === 'm') {
    const muted = sounds.toggleMute();
    hud.toast(muted ? 'Sound off.' : 'Sound on.');
    return;
  }
  keys.add(key);
});

window.addEventListener('keyup', (event) => {
  keys.delete(event.key.toLowerCase());
});

canvas.addEventListener('mousedown', (event) => {
  sounds.ensure();
  if (state.phase !== 'playing') return;
  if (state.player.coins <= 0) {
    hud.toast('No coins left — patience is free.', 1800);
    return;
  }
  const rect = canvas.getBoundingClientRect();
  const tx = ((event.clientX - rect.left) / rect.width) * LEVEL_WIDTH;
  const ty = ((event.clientY - rect.top) / rect.height) * LEVEL_HEIGHT;
  const coin = new Coin(state.player.x, state.player.y, tx, ty);
  state.coins.push(coin);
  state.player.coins -= 1;
  // The clink lands a beat after the throw, when the coin does.
  setTimeout(() => {
    sounds.coinClink();
    for (const guard of state.guards) {
      if (Math.hypot(guard.x - coin.targetX, guard.y - coin.targetY) < 135) {
        guard.hearNoise(coin.targetX, coin.targetY);
      }
    }
  }, 420);
});

// --- Screenshot staging ---------------------------------------------------
// ?scene=cover | near | hiding | win  — a fixed, readable moment of the game.
// &freeze=1 holds it still. The game itself never depends on these.

function stageScene(name) {
  const p = state.player;
  const g = state.guards;
  if (name === 'cover') {
    p.x = 175;
    p.y = 518;
    p.sneaking = true;
    p.facing = Math.PI / 2;
    g[0].x = 300; g[0].y = 430; g[0].facing = Math.PI; // Ash, cone sweeping west
    g[1].x = 200; g[1].y = 360; g[1].facing = Math.PI / 2; // Birch, facing south
    g[3].x = 560; g[3].y = 360; g[3].facing = 0;
    state.elapsed = 47;
  } else if (name === 'near') {
    p.x = 662;
    p.y = 382;
    p.sneaking = true;
    p.facing = -Math.PI / 2;
    g[3].x = 560; g[3].y = 360; g[3].facing = 0.1; // Dove's cone just touches the thief
    g[3].suspicion = 55;
    g[3].state = 'suspicious';
    g[2].x = 640; g[2].y = 90; g[2].facing = Math.PI;
    state.elapsed = 96;
  } else if (name === 'hiding') {
    p.x = 110;
    p.y = 655;
    p.sneaking = true;
    p.facing = 0;
    g[0].x = 300; g[0].y = 600; g[0].facing = Math.PI; // Ash passes the dark corner
    g[1].x = 360; g[1].y = 360; g[1].facing = Math.PI;
    g[6].x = 1050; g[6].y = 360; g[6].facing = Math.PI / 2;
    state.elapsed = 133;
  } else if (name === 'win') {
    for (const relic of RELICS) state.takenRelics.add(relic.id);
    state.player.relics = 3;
    p.x = 640;
    p.y = 662;
    p.facing = -Math.PI / 2;
    g[4].x = 560; g[4].y = 620; g[4].facing = Math.PI;
    g[3].x = 700; g[3].y = 360; g[3].facing = Math.PI / 2;
    state.elapsed = 214;
    state.phase = 'won';
    hud.showOverlay(
      'ESCAPED UNSEEN',
      'Three relics, no alarm, no trace. The dawn finds the museum poorer and none the wiser.',
      'Time: 03:34 · Times spotted: 0 · Coins left: 4',
      'Steal again',
      restart,
    );
  }
  hud.update(state);
}

// --- Boot -----------------------------------------------------------------

const params = new URLSearchParams(window.location.search);
const scene = params.get('scene');
const frozen = params.get('freeze') === '1';
if (scene) stageScene(scene);
hud.update(state);
if (!scene) hud.toast('The museum sleeps. Steal the 3 relics, then reach the EXIT.');
render(ctx, state);
if (!frozen) requestAnimationFrame(frame);
