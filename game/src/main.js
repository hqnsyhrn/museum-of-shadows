// Museum of Shadows — the game loop and the wiring.
// Owns the state object, reads keyboard and mouse, steps the thief,
// the guards and the coins, and calls the renderer. A `?shot=` query
// freezes a staged moment for screenshots; without it the game plays
// normally from the title screen.
import { CONFIG } from "./config.js";
import { buildLevel } from "./level.js";
import { createGuards, updateGuards, guardCatchesPlayer } from "./guards.js";
import { createPlayer, updatePlayer, throwCoin, updateCoin } from "./player.js";
import { render } from "./render.js";
import { audio } from "./audio.js";
import { applyShot } from "./shots.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function createState() {
  const level = buildLevel();
  return {
    level,
    player: createPlayer(level),
    guards: createGuards(level),
    coins: [],
    phase: "title", // title | playing | paused | win | busted
    alert: 0,
    elapsed: 0,
    time: 0,
    alarmsRaised: 0,
    frozen: false,
    shot: null,
  };
}

const state = createState();

const input = {
  up: false,
  down: false,
  left: false,
  right: false,
  sneak: false,
  steal: false,
};

const KEYMAP = {
  KeyW: "up",
  ArrowUp: "up",
  KeyS: "down",
  ArrowDown: "down",
  KeyA: "left",
  ArrowLeft: "left",
  KeyD: "right",
  ArrowRight: "right",
  ShiftLeft: "sneak",
  ShiftRight: "sneak",
  KeyE: "steal",
};

function startGame() {
  if (state.phase !== "title") return;
  state.phase = "playing";
  audio.ensure();
}

function resetGame() {
  const shot = state.shot;
  const fresh = createState();
  fresh.phase = "playing";
  fresh.shot = shot;
  Object.keys(state).forEach((key) => delete state[key]);
  Object.assign(state, fresh);
  if (shot) applyShot(state, shot);
}

window.addEventListener("keydown", (event) => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
    event.preventDefault();
  }
  audio.ensure();
  const field = KEYMAP[event.code];
  if (field) input[field] = true;
  if (event.code === "Enter" || event.code === "Space") {
    if (state.phase === "title") startGame();
  }
  if (event.code === "KeyP") {
    if (state.phase === "playing") state.phase = "paused";
    else if (state.phase === "paused") state.phase = "playing";
  }
  if (event.code === "KeyR") {
    if (state.phase === "win" || state.phase === "busted") resetGame();
  }
});

window.addEventListener("keyup", (event) => {
  const field = KEYMAP[event.code];
  if (field) input[field] = false;
});

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * CONFIG.WIDTH,
    y: ((event.clientY - rect.top) / rect.height) * CONFIG.HEIGHT,
  };
}

canvas.addEventListener("mousedown", (event) => {
  audio.ensure();
  if (state.phase === "title") {
    startGame();
    return;
  }
  if (state.phase !== "playing") return;
  const point = canvasPoint(event);
  const coin = throwCoin(state.player, point.x, point.y);
  if (coin) {
    state.coins.push(coin);
    audio.coin();
  }
});

function step(dt) {
  state.time += dt;
  if (state.phase !== "playing") return;
  state.elapsed += dt;

  const stealEvent = updatePlayer(state.player, state.level, input, dt);

  for (const coin of state.coins) updateCoin(coin, dt);
  state.coins = state.coins.filter((coin) => coin.ring > 0 || !coin.landed);

  const events = [];
  const { alarmNow, alarmStarted } = updateGuards(
    state.guards,
    state.level,
    state.player,
    state.coins,
    dt,
    events,
  );
  if (alarmStarted) {
    state.alarmsRaised += 1;
    audio.alarm();
  }
  if (alarmNow) {
    state.alert = Math.min(100, state.alert + 26 * dt);
  } else {
    state.alert = Math.max(0, state.alert - CONFIG.ALERT_DECAY * dt);
  }

  if (stealEvent && stealEvent.type === "stole") {
    audio.pickup();
  }

  const catcher = guardCatchesPlayer(state.guards, state.player);
  if (catcher) {
    state.phase = "busted";
    audio.busted();
    return;
  }

  // The exit opens once all three relics are lifted.
  if (state.player.relics >= 3) {
    const { tx, ty } = {
      tx: Math.floor(state.player.x / CONFIG.TILE),
      ty: Math.floor(state.player.y / CONFIG.TILE),
    };
    if (state.level.isExit(tx, ty)) {
      state.phase = "win";
      audio.win();
    }
  }
}

let last = performance.now();
let readySignalled = false;

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!state.frozen) step(dt);
  render(ctx, state);
  if (!readySignalled) {
    readySignalled = true;
    window.__ready = true;
    window.__game = state;
  }
  requestAnimationFrame(frame);
}

// A staged screenshot (?shot=cover|patrol|chase|escape) freezes the
// simulation on a readable moment of the real game.
const params = new URLSearchParams(window.location.search);
const shot = params.get("shot");
if (shot) {
  audio.enabled = false;
  if (applyShot(state, shot)) {
    render(ctx, state);
    window.__ready = true;
    window.__game = state;
    readySignalled = true;
  }
}

requestAnimationFrame(frame);
