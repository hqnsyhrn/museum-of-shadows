// Museum of Shadows — guard patrols, vision cones, suspicion and chase AI.
(function () {
  "use strict";
  var CFG = window.MOS_CONFIG;
  var LV = window.MOS_LEVEL;

  function makeGuard(def, index) {
    var route = def.route.map(function (p) { return { x: p[0] + 0.5, y: p[1] + 0.5 }; });
    var g = {
      index: index,
      route: route,
      leg: 0,
      x: route[0].x, y: route[0].y,
      facing: 0,
      speed: def.speed,
      pause: def.pause,
      wait: 0,
      state: "patrol", // patrol | curious | investigate | chase
      suspicion: 0,
      target: null, // {x, y} last seen / heard point
      lastSeen: 0, // seconds since the player was last visible
      alertFlash: 0,
    };
    g.facing = Math.atan2(route[1].y - route[0].y, route[1].x - route[0].x);
    return g;
  }

  function makeGuards() {
    return CFG.GUARDS.map(function (d, i) { return makeGuard(d, i); });
  }

  function dist(ax, ay, bx, by) {
    var dx = bx - ax, dy = by - ay;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function angleDiff(a, b) {
    var d = a - b;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return d;
  }

  // Can this guard see the player right now? Inside the cone, in range,
  // with a clear line of sight.
  function seesPlayer(level, guard, player) {
    var d = dist(guard.x, guard.y, player.x, player.y);
    if (d > CFG.VISION.range) return 0;
    var ang = Math.atan2(player.y - guard.y, player.x - guard.x);
    if (Math.abs(angleDiff(ang, guard.facing)) > CFG.VISION.halfAngle) return 0;
    if (!LV.hasLineOfSight(level, guard.x, guard.y, player.x, player.y)) return 0;
    // Closeness 1 at point blank, 0 at the edge of the cone.
    return 1 - d / CFG.VISION.range;
  }

  // The vision cone as a floor polygon: a fan of rays, each stopped by the
  // first wall or pedestal it hits, so the cone wraps around cover.
  function conePolygon(level, guard) {
    var pts = [{ x: guard.x, y: guard.y }];
    var n = CFG.VISION.rays;
    for (var i = 0; i <= n; i++) {
      var a = guard.facing - CFG.VISION.halfAngle + (2 * CFG.VISION.halfAngle * i) / n;
      var dx = Math.cos(a), dy = Math.sin(a);
      var len = LV.castRay(level, guard.x, guard.y, dx, dy, CFG.VISION.range);
      pts.push({ x: guard.x + dx * len, y: guard.y + dy * len });
    }
    return pts;
  }

  function stepToward(level, guard, tx, ty, speed, dt) {
    var dx = tx - guard.x, dy = ty - guard.y;
    var d = Math.sqrt(dx * dx + dy * dy);
    if (d < 0.02) return true;
    var step = Math.min(d, speed * dt);
    var nx = guard.x + (dx / d) * step;
    var ny = guard.y + (dy / d) * step;
    guard.facing = Math.atan2(dy, dx);
    if (!LV.isWall(level, nx, guard.y) && !solidTile(level, nx, guard.y)) guard.x = nx;
    if (!LV.isWall(level, guard.x, ny) && !solidTile(level, guard.x, ny)) guard.y = ny;
    return d - step < 0.05;
  }

  function solidTile(level, x, y) {
    var t = LV.tileAt(level, x, y);
    return t === "P" || t === "R";
  }

  function updateGuard(level, guard, player, dt, now, events) {
    var vis = seesPlayer(level, guard, player);
    if (vis > 0) {
      guard.lastSeen = 0;
      guard.target = { x: player.x, y: player.y };
      var rate = CFG.SUSPICION.riseFar + (CFG.SUSPICION.riseNear - CFG.SUSPICION.riseFar) * vis;
      if (player.sneaking) rate *= CFG.SUSPICION.sneakFactor;
      var before = guard.suspicion;
      guard.suspicion = Math.min(100, guard.suspicion + rate * dt);
      if (guard.suspicion >= CFG.SUSPICION.alertAt && before < CFG.SUSPICION.alertAt) {
        guard.state = "chase";
        guard.alertFlash = 1;
        events.push({ type: "spotted", guard: guard.index });
      } else if (guard.suspicion >= CFG.SUSPICION.curiousAt && guard.state === "patrol") {
        guard.state = "curious";
      }
    } else {
      guard.lastSeen += dt;
      guard.suspicion = Math.max(0, guard.suspicion - CFG.SUSPICION.decay * dt);
      if (guard.state === "chase" && guard.lastSeen > CFG.GUARD.loseSight) {
        guard.state = "investigate"; // sweep the last seen spot, then give up
      }
    }
    if (guard.alertFlash > 0) guard.alertFlash = Math.max(0, guard.alertFlash - dt * 1.5);

    if (guard.state === "chase") {
      var caught = stepToward(level, guard, player.x, player.y, CFG.GUARD.chaseSpeed, dt);
      if (dist(guard.x, guard.y, player.x, player.y) < CFG.GUARD.catchDist) {
        events.push({ type: "caught", guard: guard.index });
      }
      return;
    }
    if (guard.state === "investigate" || guard.state === "curious") {
      if (guard.target) {
        var arrived = stepToward(level, guard, guard.target.x, guard.target.y, guard.speed * 1.35, dt);
        if (arrived) {
          guard.wait += dt;
          // Look around for a moment, then head back to the route.
          guard.facing += dt * 1.8;
          if (guard.wait > 2.2) {
            guard.state = "patrol";
            guard.wait = 0;
            guard.target = null;
            guard.suspicion = Math.min(guard.suspicion, 40);
          }
        }
      } else {
        guard.state = "patrol";
      }
      return;
    }
    // Patrol: walk the route, pausing at each waypoint to look around.
    if (guard.wait > 0) {
      guard.wait -= dt;
      guard.facing += Math.sin(now * 1.4 + guard.index) * dt * 0.9;
      if (guard.wait <= 0) guard.leg = (guard.leg + 1) % guard.route.length;
      return;
    }
    var next = guard.route[(guard.leg + 1) % guard.route.length];
    var done = stepToward(level, guard, next.x, next.y, guard.speed, dt);
    if (done) guard.wait = guard.pause;
  }

  // A thrown coin clinks: every guard close enough walks over to look.
  function hearCoin(guards, x, y) {
    for (var i = 0; i < guards.length; i++) {
      var g = guards[i];
      if (g.state === "chase") continue;
      if (dist(g.x, g.y, x, y) <= CFG.GUARD.hearRadius) {
        g.state = "investigate";
        g.target = { x: x, y: y };
        g.wait = 0;
        g.suspicion = Math.max(g.suspicion, 25);
      }
    }
  }

  function updateGuards(level, guards, player, dt, now, events) {
    for (var i = 0; i < guards.length; i++) updateGuard(level, guards[i], player, dt, now, events);
  }

  window.MOS_GUARDS = {
    makeGuards: makeGuards,
    conePolygon: conePolygon,
    updateGuards: updateGuards,
    hearCoin: hearCoin,
    seesPlayer: seesPlayer,
  };
})();
