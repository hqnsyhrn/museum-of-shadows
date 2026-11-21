// Museum of Shadows — the eight night guards.
// Each guard walks a fixed patrol loop, sweeps a vision cone, and keeps
// a suspicion meter: spot the thief and suspicion climbs, lose sight of
// them and it cools. At 60 the guard gets suspicious and walks over to
// look; at 100 the guard raises the alarm and gives chase. A thrown
// coin sends the nearest guard to investigate the clink instead.
import { CONFIG } from "./config.js";
import { GUARD_ROUTES } from "./level.js";
import { lineBlocked, tileOf } from "./level.js";

function angleTo(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function createGuards(level) {
  return GUARD_ROUTES.map((route, i) => {
    const start = route[0];
    const next = route[1];
    return {
      id: i,
      route,
      wpIndex: 1,
      x: (start[0] + 0.5) * CONFIG.TILE,
      y: (start[1] + 0.5) * CONFIG.TILE,
      dir: angleTo(
        (start[0] + 0.5) * CONFIG.TILE,
        (start[1] + 0.5) * CONFIG.TILE,
        (next[0] + 0.5) * CONFIG.TILE,
        (next[1] + 0.5) * CONFIG.TILE,
      ),
      state: "patrol", // patrol | suspicious | alarm | investigate
      suspicion: 0,
      lastSeen: null,
      investigate: null,
      investigateTimer: 0,
      pauseTimer: 0,
      lookTimer: 0,
      bob: i * 1.7, // fixed per guard: the walk cycle stays deterministic
    };
  });
}

// True when the guard's cone and line of sight both reach the target.
export function guardCanSee(level, guard, x, y) {
  const dx = x - guard.x;
  const dy = y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > CONFIG.GUARD_VIEW_RANGE) return false;
  if (dist > 34) {
    const toTarget = Math.atan2(dy, dx);
    if (Math.abs(angleDiff(toTarget, guard.dir)) > CONFIG.GUARD_VIEW_HALF_ANGLE) {
      return false;
    }
  }
  return !lineBlocked(level, guard.x, guard.y, x, y);
}

function moveToward(guard, tx, ty, speed, dt) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return true;
  const step = Math.min(dist, speed * dt);
  guard.x += (dx / dist) * step;
  guard.y += (dy / dist) * step;
  guard.dir = Math.atan2(dy, dx);
  return dist - step < 2;
}

function patrolStep(guard, dt) {
  const target = guard.route[guard.wpIndex];
  const tx = (target[0] + 0.5) * CONFIG.TILE;
  const ty = (target[1] + 0.5) * CONFIG.TILE;
  if (moveToward(guard, tx, ty, CONFIG.GUARD_PATROL_SPEED, dt)) {
    guard.wpIndex = (guard.wpIndex + 1) % guard.route.length;
    guard.pauseTimer = 0.9; // linger at each corner, look around
  }
}

export function updateGuards(guards, level, player, coins, dt, events) {
  const anyAlarmBefore = guards.some((g) => g.state === "alarm");

  for (const guard of guards) {
    guard.bob += dt * 6;
    const sees = !player.hidden && guardCanSee(level, guard, player.x, player.y);

    if (sees) {
      const dist = Math.hypot(player.x - guard.x, player.y - guard.y);
      const closeness = 1 - dist / (CONFIG.GUARD_VIEW_RANGE * 1.15);
      const rate =
        CONFIG.SUSPICION_RATE *
        (0.45 + closeness) *
        (player.sneaking ? CONFIG.SUSPICION_SNEAK_FACTOR : 1);
      guard.suspicion = Math.min(CONFIG.SUSPICION_FULL, guard.suspicion + rate * dt);
      guard.lastSeen = { x: player.x, y: player.y };
    } else {
      guard.suspicion = Math.max(0, guard.suspicion - CONFIG.SUSPICION_DECAY * dt);
    }

    if (guard.suspicion >= CONFIG.SUSPICION_FULL) {
      if (guard.state !== "alarm") {
        guard.state = "alarm";
        events.push({ type: "alarm", guard });
      }
    } else if (guard.suspicion >= CONFIG.SUSPICION_ALARM) {
      if (guard.state === "patrol" || guard.state === "investigate") {
        guard.state = "suspicious";
      }
    } else if (guard.state === "suspicious" && guard.suspicion <= 2) {
      guard.state = "patrol";
    }

    // A fresh coin clink pulls a calm guard off patrol to investigate.
    if (guard.state === "patrol" || guard.state === "suspicious") {
      for (const coin of coins) {
        if (coin.landed && !coin.heardBy.has(guard.id)) {
          const d = Math.hypot(coin.x - guard.x, coin.y - guard.y);
          if (d < CONFIG.COIN_NOISE_RADIUS) {
            coin.heardBy.add(guard.id);
            guard.state = "investigate";
            guard.investigate = { x: coin.x, y: coin.y };
            guard.investigateTimer = CONFIG.COIN_INVESTIGATE_SECONDS;
            guard.suspicion = Math.max(guard.suspicion, 12);
            events.push({ type: "distracted", guard });
          }
        }
      }
    }

    switch (guard.state) {
      case "patrol": {
        if (guard.pauseTimer > 0) {
          guard.pauseTimer -= dt;
          guard.dir += Math.sin(guard.bob * 0.35) * dt * 0.9; // glance around
        } else {
          patrolStep(guard, dt);
        }
        break;
      }
      case "suspicious": {
        if (guard.lastSeen) {
          const arrived = moveToward(
            guard,
            guard.lastSeen.x,
            guard.lastSeen.y,
            CONFIG.GUARD_SUSPICIOUS_SPEED,
            dt,
          );
          if (arrived) {
            guard.lookTimer += dt;
            guard.dir += dt * 1.6; // scan the spot where the thief was
            if (guard.lookTimer > 2.2) {
              guard.lookTimer = 0;
              guard.state = "patrol";
            }
          }
        } else {
          guard.state = "patrol";
        }
        break;
      }
      case "alarm": {
        // Chase the last seen position; keep hunting while suspicion holds.
        const target = guard.lastSeen || { x: player.x, y: player.y };
        moveToward(guard, target.x, target.y, CONFIG.GUARD_CHASE_SPEED, dt);
        if (!sees && guard.suspicion < 25) {
          guard.state = "suspicious";
        }
        break;
      }
      case "investigate": {
        guard.investigateTimer -= dt;
        const arrived = moveToward(
          guard,
          guard.investigate.x,
          guard.investigate.y,
          CONFIG.GUARD_SUSPICIOUS_SPEED,
          dt,
        );
        if (arrived || guard.investigateTimer <= 0) {
          guard.lookTimer += dt;
          guard.dir += dt * 2.0;
          if (guard.lookTimer > 1.6 || guard.investigateTimer <= 0) {
            guard.lookTimer = 0;
            guard.investigate = null;
            guard.state = "patrol";
          }
        }
        break;
      }
      default:
        guard.state = "patrol";
    }
  }

  const anyAlarmNow = guards.some((g) => g.state === "alarm");
  return { alarmNow: anyAlarmNow, alarmStarted: !anyAlarmBefore && anyAlarmNow };
}

// A guard close enough to grab the thief ends the run.
export function guardCatchesPlayer(guards, player) {
  for (const guard of guards) {
    if (Math.hypot(guard.x - player.x, guard.y - player.y) < CONFIG.GUARD_CATCH_RADIUS) {
      return guard;
    }
  }
  return null;
}

export { tileOf };
