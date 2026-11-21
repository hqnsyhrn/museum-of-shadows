// Museum of Shadows — staged moments for the screenshots.
// A screenshot needs a readable instant: a guard's cone sweeping past
// the thief behind a case, an alarm chase, the getaway. Each shot sets
// the real game state — positions, suspicion, relics, alert — and then
// freezes the simulation, so the frame the browser captures is exactly
// the frame the game itself renders. Nothing here is drawn by hand;
// the renderer draws every pixel from this state.
import { CONFIG } from "./config.js";
import { updateGuards } from "./guards.js";

const TILE = CONFIG.TILE;

function placeGuard(guard, tx, ty, dirDegrees, stateName, suspicion) {
  guard.x = (tx + 0.5) * TILE;
  guard.y = (ty + 0.5) * TILE;
  guard.dir = (dirDegrees * Math.PI) / 180;
  guard.state = stateName;
  guard.suspicion = suspicion;
  guard.lastSeen = { x: guard.x, y: guard.y };
  guard.pauseTimer = 0;
  guard.lookTimer = 0;
}

function placePlayer(player, tx, ty, dirDegrees, sneaking) {
  player.x = (tx + 0.5) * TILE;
  player.y = (ty + 0.5) * TILE;
  player.dir = (dirDegrees * Math.PI) / 180;
  player.sneaking = sneaking;
  player.moving = false;
  player.stealProgress = 0;
  player.stealing = null;
}

// Let the patrols run on their own for a few seconds so the cover shot
// catches the guards mid-route instead of lined up at their starts.
// The simulation is deterministic: fixed steps, no randomness.
function runPatrols(state, seconds) {
  const events = [];
  const dummy = { ...state.player, hidden: true };
  for (let t = 0; t < seconds; t += 1 / 60) {
    updateGuards(state.guards, state.level, dummy, [], 1 / 60, events);
  }
}

export function applyShot(state, name) {
  const { level, player, guards } = state;
  state.frozen = true;
  state.shot = name;

  if (name === "cover") {
    // Title screen over a living museum: guards mid-patrol, cones out,
    // relics glinting, the thief waiting at the door.
    state.phase = "title";
    state.time = 6.0;
    runPatrols(state, 6);
    return true;
  }

  if (name === "patrol") {
    // One relic down. The thief crouches behind a display case in the
    // grand hall while a guard's cone sweeps the spot — suspicion
    // climbing, cover holding.
    state.phase = "playing";
    state.time = 95.0;
    state.elapsed = 95;
    state.alert = 12;
    level.relics[0].taken = true;
    player.relics = 1;
    placePlayer(player, 10, 9, -90, true);
    runPatrols(state, 4);
    placeGuard(guards[4], 10, 7, 90, "suspicious", 38);
    guards[4].lastSeen = { x: player.x, y: player.y };
    return true;
  }

  if (name === "chase") {
    // Two relics down and the hall is lit up: two guards in full alarm,
    // red cones, the thief sprinting for the south doors.
    state.phase = "playing";
    state.time = 210.0;
    state.elapsed = 210;
    state.alert = 78;
    state.alarmsRaised = 1;
    level.relics[0].taken = true;
    level.relics[1].taken = true;
    player.relics = 2;
    player.coins = 2;
    placePlayer(player, 15, 10, 90, false);
    player.moving = true;
    placeGuard(guards[4], 13, 9, 35, "alarm", 100);
    guards[4].lastSeen = { x: player.x, y: player.y };
    placeGuard(guards[5], 18, 11, 145, "alarm", 100);
    guards[5].lastSeen = { x: player.x, y: player.y };
    runPatrols(state, 0); // keep the staged guards exactly where set
    return true;
  }

  if (name === "escape") {
    // Clean getaway: all three relics, no alarm raised, the thief on
    // the green exit tiles as the doors swing open.
    state.phase = "win";
    state.time = 287.0;
    state.elapsed = 287;
    state.alert = 0;
    state.alarmsRaised = 0;
    for (const relic of level.relics) relic.taken = true;
    player.relics = 3;
    player.coins = 2;
    placePlayer(player, 14, 18, 0, false);
    runPatrols(state, 3);
    return true;
  }

  return false;
}

export const SHOT_NAMES = ["cover", "patrol", "chase", "escape"];
