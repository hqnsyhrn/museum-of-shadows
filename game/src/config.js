// Museum of Shadows — central tuning for the whole game.
// One place holds every number the other modules use, so the balance
// of patrol speed, vision and suspicion can be read at a glance.
export const CONFIG = {
  TILE: 40,
  COLS: 32,
  ROWS: 20,
  WIDTH: 1280,
  HEIGHT: 800,

  // Movement (pixels per second).
  PLAYER_WALK_SPEED: 150,
  PLAYER_SNEAK_SPEED: 84,
  GUARD_PATROL_SPEED: 58,
  GUARD_SUSPICIOUS_SPEED: 92,
  GUARD_CHASE_SPEED: 138,

  // Vision cones.
  GUARD_VIEW_RANGE: 235,
  GUARD_VIEW_HALF_ANGLE: 0.56, // radians, about 32 degrees each side
  GUARD_CATCH_RADIUS: 26,

  // Suspicion: 0 calm, 60 suspicious, 100 alarm.
  SUSPICION_FULL: 100,
  SUSPICION_ALARM: 60,
  SUSPICION_RATE: 95, // per second, point blank in the open
  SUSPICION_SNEAK_FACTOR: 0.45,
  SUSPICION_DECAY: 16, // per second while unseen
  ALERT_DECAY: 9,

  // The thief's tools.
  COINS_START: 5,
  COIN_THROW_RANGE: 270,
  COIN_NOISE_RADIUS: 250,
  COIN_INVESTIGATE_SECONDS: 4,
  STEAL_SECONDS: 0.9,
  STEAL_RANGE: 52,

  // Look.
  COLORS: {
    floorDark: "#141a2e",
    floorLight: "#182036",
    wall: "#2b3350",
    wallTop: "#3d4a73",
    gold: "#e8b64c",
    caseGlass: "#3ec6c6",
    relic: "#ffd76a",
    exit: "#39d98a",
    player: "#b388ff",
    guard: "#5b7bd5",
    coneCalm: "rgba(255, 214, 110, 0.20)",
    coneHot: "rgba(255, 90, 60, 0.30)",
    text: "#f2ead8",
    muted: "#9aa7c7",
  },
};
