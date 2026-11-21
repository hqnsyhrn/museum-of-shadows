// Museum of Shadows — fixed demo states for the screenshots.
// ?shot=start | play | chase | win — each one deterministic: fixed guard
// and thief positions, no randomness, so a screenshot is reproducible.
(function () {
  "use strict";
  var CFG = window.MOS_CONFIG;

  function placeGuard(guards, i, x, y, facing, state, suspicion) {
    var g = guards[i];
    g.x = x; g.y = y; g.facing = facing;
    g.state = state || "patrol";
    g.suspicion = suspicion || 0;
    g.wait = 0;
    g.target = null;
  }

  // state: the live game state; mode: one of start/play/chase/win.
  // Returns the overlay title to show, or null for plain play.
  function applyShot(state, mode) {
    var guards = state.guards;
    var player = state.player;
    if (mode === "start") {
      // Title view: the thief at the door, guards on patrol, cones sweeping.
      player.x = 3.5; player.y = 10.5; player.facing = -Math.PI / 2;
      placeGuard(guards, 0, 8.5, 1.5, 0, "patrol", 0);
      placeGuard(guards, 1, 1.5, 6.5, Math.PI / 2, "patrol", 0);
      placeGuard(guards, 2, 8.5, 5.5, 0, "patrol", 0);
      placeGuard(guards, 3, 16.5, 5.5, -Math.PI / 2, "patrol", 0);
      placeGuard(guards, 4, 9.5, 8.5, Math.PI, "patrol", 0);
      placeGuard(guards, 5, 8.5, 3.5, 0, "patrol", 0);
      placeGuard(guards, 6, 8.5, 10.5, Math.PI, "patrol", 0);
      placeGuard(guards, 7, 9.5, 4.5, Math.PI / 2, "patrol", 0);
      return "title";
    }
    if (mode === "play") {
      // Near miss: the thief crouched behind the Jade Idol pedestal, one
      // guard's cone sweeping past, suspicion half full, mask already taken.
      state.level.relics[0].taken = true;
      player.relics = 1;
      player.x = 13.0; player.y = 6.0; player.facing = Math.PI; player.sneaking = true;
      placeGuard(guards, 0, 8.5, 1.5, 0.5, "patrol", 0);
      placeGuard(guards, 1, 1.5, 6.5, Math.PI / 2, "patrol", 0);
      placeGuard(guards, 2, 6.5, 5.5, 0, "patrol", 0);
      placeGuard(guards, 3, 15.5, 5.2, Math.PI * 0.85, "curious", 58);
      guards[3].target = { x: 13.0, y: 6.0 };
      placeGuard(guards, 4, 9.5, 8.5, Math.PI, "patrol", 0);
      placeGuard(guards, 5, 5.5, 3.5, 0, "patrol", 0);
      placeGuard(guards, 6, 8.5, 10.5, Math.PI, "patrol", 0);
      placeGuard(guards, 7, 9.5, 6.8, -Math.PI / 2, "patrol", 0);
      state.elapsed = 87;
      return null;
    }
    if (mode === "chase") {
      // Spotted: two guards chasing the thief as he sprints for the exit
      // with all three relics, alarm red.
      state.level.relics[0].taken = true;
      state.level.relics[1].taken = true;
      state.level.relics[2].taken = true;
      player.relics = 3;
      player.x = 13.8; player.y = 9.6; player.facing = 0.3;
      placeGuard(guards, 0, 8.5, 1.5, 0, "patrol", 0);
      placeGuard(guards, 1, 1.5, 6.5, Math.PI / 2, "patrol", 0);
      placeGuard(guards, 2, 10.8, 8.2, 0.9, "chase", 100);
      placeGuard(guards, 3, 16.5, 5.5, -Math.PI / 2, "patrol", 0);
      placeGuard(guards, 4, 12.6, 6.8, 1.2, "chase", 100);
      placeGuard(guards, 5, 8.5, 3.5, 0, "patrol", 0);
      placeGuard(guards, 6, 10.5, 10.5, 0.3, "chase", 100);
      placeGuard(guards, 7, 9.5, 4.5, Math.PI / 2, "patrol", 0);
      state.elapsed = 214;
      state.alarm = true;
      return null;
    }
    if (mode === "win") {
      // Clean getaway: all three relics, the thief stepping through the exit.
      state.level.relics[0].taken = true;
      state.level.relics[1].taken = true;
      state.level.relics[2].taken = true;
      player.relics = 3;
      player.x = 15.2; player.y = 10.2; player.facing = Math.PI / 2;
      placeGuard(guards, 0, 8.5, 1.5, 0, "patrol", 0);
      placeGuard(guards, 1, 1.5, 6.5, Math.PI / 2, "patrol", 0);
      placeGuard(guards, 2, 8.5, 5.5, 0, "patrol", 0);
      placeGuard(guards, 3, 16.5, 5.5, -Math.PI / 2, "patrol", 0);
      placeGuard(guards, 4, 9.5, 8.5, Math.PI, "patrol", 0);
      placeGuard(guards, 5, 8.5, 3.5, 0, "patrol", 0);
      placeGuard(guards, 6, 8.5, 10.5, Math.PI, "patrol", 0);
      placeGuard(guards, 7, 9.5, 4.5, Math.PI / 2, "patrol", 0);
      state.elapsed = 248;
      return "win";
    }
    return null;
  }

  window.MOS_SHOTS = { applyShot: applyShot };
})();
