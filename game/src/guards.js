// Museum of Shadows — guards: patrols, vision cones, suspicion and pursuit.
// A guard lives in one of four states: patrol, suspicious, alerted, search.
// Suspicion is a meter, not a switch: being seen fills it, hiding drains it,
// and only a full meter turns a guard into a hunter. That is the recovery.

import { hasLineOfSight, pointInLight } from './level.js';

export const VISION_RANGE = 195;
export const VISION_HALF_ANGLE = Math.PI / 5.2; // ~35 degrees each side
export const PATROL_SPEED = 58;
export const CHASE_SPEED = 118;
export const SEARCH_SPEED = 82;
export const CATCH_DISTANCE = 26;

const SUSPICION_DECAY = 26; // per second while unseen
const ALERT_LOSE_SIGHT_TIME = 2.5; // seconds unseen before an alerted guard gives up the chase
const SEARCH_TIME = 6; // seconds a guard hunts the last seen spot before returning

export class Guard {
  constructor(route, index) {
    this.name = route.name;
    this.waypoints = route.waypoints;
    this.targetIndex = 1 % this.waypoints.length;
    const [sx, sy] = this.waypoints[0];
    this.x = sx;
    this.y = sy;
    this.facing = 0;
    this.state = 'patrol'; // patrol | suspicious | alerted | search
    this.suspicion = 0; // 0..100, full means alerted
    this.lastSeen = null; // {x, y} where the player was last spotted
    this.loseSightTimer = 0;
    this.searchTimer = 0;
    this.noiseTarget = null; // {x, y} a noise to investigate
    this.index = index;
    this.stepPhase = Math.random() * Math.PI * 2;
  }

  /** Where the guard is walking to right now. */
  currentTarget() {
    if (this.state === 'alerted' && this.lastSeen) return this.lastSeen;
    if ((this.state === 'suspicious' || this.state === 'search') && this.noiseTarget) return this.noiseTarget;
    if (this.state === 'search' && this.lastSeen) return this.lastSeen;
    return this.waypoints[this.targetIndex];
  }

  speed() {
    if (this.state === 'alerted') return CHASE_SPEED;
    if (this.state === 'search' || this.state === 'suspicious') return SEARCH_SPEED;
    return PATROL_SPEED;
  }

  /** Can this guard see the player right now? Cone, range and line of sight. */
  canSee(player) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > VISION_RANGE) return false;
    let angle = Math.atan2(dy, dx) - this.facing;
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    if (Math.abs(angle) > VISION_HALF_ANGLE) return false;
    return hasLineOfSight(this.x, this.y, player.x, player.y);
  }

  /** How fast suspicion fills while the player is seen. Light, distance and
   *  the player's speed all matter: a sprinting thief in a lamp pool is
   *  spotted in a blink, a sneaking one in the dark barely at all. */
  detectionRate(player, dist) {
    let rate = 62;
    rate *= 1 - (dist / VISION_RANGE) * 0.55; // closer is worse
    if (pointInLight(player.x, player.y)) rate *= 1.55;
    else rate *= 0.5; // darkness is your friend
    if (player.sneaking) rate *= 0.55;
    if (player.running) rate *= 1.25;
    return rate;
  }

  /** A noise (running feet, a thrown coin) draws a guard to investigate. */
  hearNoise(x, y) {
    if (this.state === 'alerted') return;
    this.noiseTarget = { x, y };
    if (this.state === 'patrol') this.state = 'suspicious';
  }

  update(dt, player, onCaught) {
    const sees = this.canSee(player);
    if (sees) {
      const dist = Math.hypot(player.x - this.x, player.y - this.y);
      this.suspicion = Math.min(100, this.suspicion + this.detectionRate(player, dist) * dt);
      this.lastSeen = { x: player.x, y: player.y };
      this.loseSightTimer = 0;
      if (this.suspicion >= 100 && this.state !== 'alerted') {
        this.state = 'alerted';
        this.noiseTarget = null;
      }
    } else {
      this.suspicion = Math.max(0, this.suspicion - SUSPICION_DECAY * dt);
      if (this.state === 'alerted') {
        this.loseSightTimer += dt;
        if (this.loseSightTimer >= ALERT_LOSE_SIGHT_TIME) {
          this.state = 'search';
          this.searchTimer = SEARCH_TIME;
        }
      } else if (this.state === 'suspicious' && this.suspicion <= 0 && !this.noiseTarget) {
        this.state = 'patrol';
      }
    }

    if (this.state === 'search') {
      this.searchTimer -= dt;
      if (this.searchTimer <= 0) {
        this.state = 'patrol';
        this.noiseTarget = null;
        this.lastSeen = null;
      }
    }

    // Walk toward the current target.
    const target = this.currentTarget();
    const dx = target[0] - this.x;
    const dy = target[1] - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 4) {
      const step = Math.min(dist, this.speed() * dt);
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
      this.facing = Math.atan2(dy, dx);
      this.stepPhase += dt * this.speed() * 0.09;
    } else if (this.state === 'patrol') {
      this.targetIndex = (this.targetIndex + 1) % this.waypoints.length;
    } else if (this.state === 'suspicious' || this.state === 'search') {
      // Reached the spot to check: look around, then give up.
      this.facing += dt * 1.4;
      if (this.noiseTarget && this.state === 'suspicious') this.noiseTarget = null;
    }

    // Caught: an alerted guard that reaches the player ends the night.
    if (this.state === 'alerted' && Math.hypot(player.x - this.x, player.y - this.y) < CATCH_DISTANCE) {
      onCaught(this);
    }
  }

  /** Cone colour reads the state at a glance: gold calm, amber wary, red hunt. */
  coneColor() {
    if (this.state === 'alerted') return '255, 70, 70';
    if (this.state === 'suspicious' || this.state === 'search') return '242, 169, 76';
    return '242, 201, 76';
  }

  mark() {
    if (this.state === 'alerted') return '!';
    if (this.state === 'suspicious' || this.state === 'search') return '?';
    return null;
  }
}

/** Build the eight guards from the level's patrol routes. */
export function createGuards(routes) {
  return routes.map((route, i) => new Guard(route, i));
}
