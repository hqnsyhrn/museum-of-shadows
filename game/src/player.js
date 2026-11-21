// Museum of Shadows — the thief.
// WASD or arrows to move, Shift to sneak (slower, harder to spot),
// Space or mouse click to throw a coin and pull a guard away, E to
// lift a relic off its pedestal. Collision slides along walls and
// display cases; the thief can never walk through cover.
import { CONFIG } from "./config.js";

export function createPlayer(level) {
  return {
    x: level.spawn.x,
    y: level.spawn.y,
    dir: -Math.PI / 2, // facing up, into the museum
    sneaking: false,
    moving: false,
    coins: CONFIG.COINS_START,
    relics: 0,
    stealProgress: 0,
    stealing: null, // relic being lifted, or null
    hidden: false,
    walkCycle: 0,
  };
}

function blockedAt(level, x, y, radius) {
  // Circle vs blocked tiles: test the tiles the circle overlaps.
  const x0 = Math.floor((x - radius) / CONFIG.TILE);
  const x1 = Math.floor((x + radius) / CONFIG.TILE);
  const y0 = Math.floor((y - radius) / CONFIG.TILE);
  const y1 = Math.floor((y + radius) / CONFIG.TILE);
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      if (!level.blocksMove(tx, ty)) continue;
      const cx = Math.max(tx * CONFIG.TILE, Math.min(x, (tx + 1) * CONFIG.TILE));
      const cy = Math.max(ty * CONFIG.TILE, Math.min(y, (ty + 1) * CONFIG.TILE));
      if ((x - cx) * (x - cx) + (y - cy) * (y - cy) < radius * radius) return true;
    }
  }
  return false;
}

export function updatePlayer(player, level, input, dt) {
  let mx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let my = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  player.moving = mx !== 0 || my !== 0;
  player.sneaking = !!input.sneak && player.moving;

  if (player.moving) {
    const len = Math.hypot(mx, my);
    mx /= len;
    my /= len;
    player.dir = Math.atan2(my, mx);
    const speed = player.sneaking
      ? CONFIG.PLAYER_SNEAK_SPEED
      : CONFIG.PLAYER_WALK_SPEED;
    const radius = 13;
    const nx = player.x + mx * speed * dt;
    const ny = player.y + my * speed * dt;
    // Axis-separated movement: slide along a wall instead of sticking.
    if (!blockedAt(level, nx, player.y, radius)) player.x = nx;
    if (!blockedAt(level, player.x, ny, radius)) player.y = ny;
    player.walkCycle += dt * (player.sneaking ? 7 : 11);
    player.stealProgress = 0;
    player.stealing = null;
  }

  // Stealing: hold E beside a pedestal until the lift finishes.
  player.stealing = null;
  if (input.steal && !player.moving) {
    for (const relic of level.relics) {
      if (relic.taken) continue;
      const d = Math.hypot(relic.x - player.x, relic.y - player.y);
      if (d < CONFIG.STEAL_RANGE) {
        player.stealing = relic;
        player.stealProgress += dt / CONFIG.STEAL_SECONDS;
        if (player.stealProgress >= 1) {
          relic.taken = true;
          player.relics += 1;
          player.stealProgress = 0;
          player.stealing = null;
          return { type: "stole", relic };
        }
        break;
      }
    }
    if (!player.stealing) player.stealProgress = 0;
  } else {
    player.stealProgress = 0;
  }
  return null;
}

// Throw a coin toward a point. It flies, lands with a clink, and the
// ring it makes is what pulls guards over. Returns the coin or null.
export function throwCoin(player, targetX, targetY) {
  if (player.coins <= 0) return null;
  player.coins -= 1;
  const dx = targetX - player.x;
  const dy = targetY - player.y;
  const dist = Math.hypot(dx, dy);
  const range = Math.min(dist, CONFIG.COIN_THROW_RANGE);
  const nx = dist > 0 ? player.x + (dx / dist) * range : player.x + 40;
  const ny = dist > 0 ? player.y + (dy / dist) * range : player.y;
  return {
    x: player.x,
    y: player.y,
    fromX: player.x,
    fromY: player.y,
    toX: nx,
    toY: ny,
    flight: 0, // 0..1 along the arc
    landed: false,
    ring: 0, // seconds the clink ring has been visible
    heardBy: new Set(),
  };
}

export function updateCoin(coin, dt) {
  if (!coin.landed) {
    coin.flight = Math.min(1, coin.flight + dt / 0.28);
    const t = coin.flight;
    coin.x = coin.fromX + (coin.toX - coin.fromX) * t;
    coin.y = coin.fromY + (coin.toY - coin.fromY) * t;
    if (coin.flight >= 1) {
      coin.landed = true;
      coin.ring = 0.9;
    }
  } else if (coin.ring > 0) {
    coin.ring = Math.max(0, coin.ring - dt);
  }
}
