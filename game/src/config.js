// Museum of Shadows — tuning, colours and the museum floor plan.
// One character per tile. '#' wall, '.' marble floor, 'P' display pedestal
// (cover that blocks sight), 'R' relic pedestal, 'S' thief start,
// 'E' exit door, 'L' warm wall lamp.
(function () {
  "use strict";
  window.MOS_CONFIG = {
    TILE: 64,
    MAP: [
      "##################",
      "#....P.....P...L.#",
      "#.P....R......P..#",
      "#.....P....P.....#",
      "#..P......P...R..#",
      "#....P......P....#",
      "#.P.....P....P...#",
      "#......P...P.....#",
      "#..P.....R....P..#",
      "#....P......P..L.#",
      "#..S..........E..#",
      "##################",
    ],
    RELICS: [
      { id: "mask", name: "Golden Mask", x: 7, y: 2, gem: "#ffd34d", glow: "#ffae00" },
      { id: "idol", name: "Jade Idol", x: 14, y: 4, gem: "#4dff88", glow: "#00c853" },
      { id: "sapphire", name: "Star Sapphire", x: 8, y: 8, gem: "#5db9ff", glow: "#2979ff" },
    ],
    // Eight guards, each patrolling a loop of floor tiles (tile coords).
    GUARDS: [
      { route: [[2, 1], [15, 1]], speed: 1.5, pause: 1.2 },
      { route: [[1, 3], [1, 9]], speed: 1.4, pause: 1.0 },
      { route: [[4, 5], [13, 5]], speed: 1.7, pause: 0.8 },
      { route: [[16, 2], [16, 8]], speed: 1.5, pause: 1.0 },
      { route: [[3, 8], [14, 8]], speed: 1.6, pause: 0.9 },
      { route: [[5, 3], [12, 3]], speed: 1.5, pause: 1.1 },
      { route: [[3, 10], [14, 10]], speed: 1.8, pause: 0.7 },
      { route: [[9, 2], [9, 7]], speed: 1.4, pause: 1.3 },
    ],
    PLAYER: { walkSpeed: 3.4, sneakSpeed: 1.8, radius: 0.30, coins: 5 },
    VISION: { range: 5.4, halfAngle: 0.62, rays: 26 },
    SUSPICION: { riseNear: 95, riseFar: 42, sneakFactor: 0.45, decay: 26, alertAt: 100, curiousAt: 55 },
    GUARD: { chaseSpeed: 2.9, catchDist: 0.55, hearRadius: 6.5, loseSight: 3.0 },
    STEAL_TIME: 1.1,
    COLORS: {
      floorA: "#3a3f52", floorB: "#343947", carpet: "#7a1f2b", carpetEdge: "#c9a227",
      wallTop: "#5d5470", wallLeft: "#453d57", wallRight: "#332d42",
      pedestalTop: "#6b5a44", pedestalLeft: "#4a3d2d", pedestalRight: "#382e21",
      guardBody: "#2b4a7a", guardTrim: "#d8c27a", guardSkin: "#e8b98a",
      thiefCloak: "#123f3a", thiefTrim: "#ffd34d", thiefSkin: "#e8c39a",
      coneCalm: "rgba(255, 214, 90, 0.30)", coneEdge: "rgba(255, 214, 90, 0.55)",
      coneAlert: "rgba(255, 64, 48, 0.38)", coneAlertEdge: "rgba(255, 64, 48, 0.65)",
      exitGlow: "#39ff88", gold: "#ffd34d",
    },
  };
})();
