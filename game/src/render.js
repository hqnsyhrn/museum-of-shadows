// Museum of Shadows — draws the museum: marble floor, solid walls and
// pedestals, glowing relics, vision cones, the thief and the guards,
// then the night lighting. Painter's order: floor first, then everything
// standing on it sorted from far to near.
(function () {
  "use strict";
  var CFG = window.MOS_CONFIG;
  var PR = window.MOS_PROJ;
  var LV = window.MOS_LEVEL;
  var GD = window.MOS_GUARDS;

  function depthKey(x, y) { return x + y; }

  function drawFloor(ctx, level) {
    for (var y = 0; y < level.h; y++) {
      for (var x = 0; x < level.w; x++) {
        var ch = CFG.MAP[y][x];
        if (ch === "#") continue;
        var a = PR.project(x, y, 0), b = PR.project(x + 1, y, 0);
        var c = PR.project(x + 1, y + 1, 0), d = PR.project(x, y + 1, 0);
        PR.poly(ctx, [a, b, c, d], (x + y) % 2 === 0 ? CFG.COLORS.floorA : CFG.COLORS.floorB);
        // Marble vein on alternating tiles.
        if ((x * 7 + y * 13) % 5 === 0) {
          ctx.beginPath();
          ctx.moveTo((a.x + d.x) / 2, (a.y + d.y) / 2);
          ctx.lineTo((b.x + c.x) / 2, (b.y + c.y) / 2);
          ctx.strokeStyle = "rgba(255,255,255,0.05)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
    // Red carpet runner down the middle gallery.
    var carpet = [
      PR.project(8.4, 1, 0), PR.project(9.6, 1, 0),
      PR.project(9.6, 11, 0), PR.project(8.4, 11, 0),
    ];
    PR.poly(ctx, carpet, CFG.COLORS.carpet);
    ctx.beginPath();
    ctx.moveTo(carpet[0].x, carpet[0].y);
    ctx.lineTo(carpet[3].x, carpet[3].y);
    ctx.moveTo(carpet[1].x, carpet[1].y);
    ctx.lineTo(carpet[2].x, carpet[2].y);
    ctx.strokeStyle = CFG.COLORS.carpetEdge;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Exit mat: a bright green threshold in front of the door.
    var e = level.exit;
    var m = [
      PR.project(e.x - 0.9, e.y - 0.4, 0), PR.project(e.x + 0.9, e.y - 0.4, 0),
      PR.project(e.x + 0.9, e.y + 0.4, 0), PR.project(e.x - 0.9, e.y + 0.4, 0),
    ];
    PR.poly(ctx, m, "rgba(57,255,136,0.35)");
  }

  // Border walls are solid boxes. The far (north/west) walls stand tall so
  // the gallery feels enclosed; the near (south/east) walls are low rims,
  // so they never hide the thief, the exit or the relics in front of them.
  function drawWall(ctx, level, w) {
    var tall = w.y < level.h - 1 && w.x < level.w - 1;
    var h = tall ? 0.9 : 0.35;
    PR.drawBox(ctx, w.x, w.y, w.x + 1, w.y + 1, h,
      CFG.COLORS.wallTop, CFG.COLORS.wallLeft, CFG.COLORS.wallRight);
  }

  function drawRelicGem(ctx, relic, now) {
    var p = PR.project(relic.x, relic.y, 0.78);
    var s = PR.camera.scale;
    var r = Math.max(4, s * 0.16);
    var pulse = 1 + Math.sin(now * 3 + relic.x) * 0.12;
    // Glow halo.
    var g = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, r * 3.2);
    g.addColorStop(0, relic.glow);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r * 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    // Faceted gem: a small diamond with a bright top facet.
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - r * pulse);
    ctx.lineTo(p.x + r * 0.8, p.y);
    ctx.lineTo(p.x, p.y + r * 0.7);
    ctx.lineTo(p.x - r * 0.8, p.y);
    ctx.closePath();
    ctx.fillStyle = relic.gem;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - r * pulse);
    ctx.lineTo(p.x + r * 0.8, p.y);
    ctx.lineTo(p.x, p.y);
    ctx.closePath();
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function drawPedestal(ctx, ped, now) {
    PR.drawBox(ctx, ped.x + 0.06, ped.y + 0.06, ped.x + 0.94, ped.y + 0.94, 0.55,
      CFG.COLORS.pedestalTop, CFG.COLORS.pedestalLeft, CFG.COLORS.pedestalRight);
    if (ped.relic && !ped.relic.taken) drawRelicGem(ctx, ped.relic, now);
  }

  function drawExit(ctx, level, now) {
    var e = level.exit;
    // A tall glowing doorway set into the south wall.
    var glow = 0.5 + Math.sin(now * 2.4) * 0.2;
    var p0 = PR.project(e.x - 0.8, e.y + 0.5, 0);
    var p1 = PR.project(e.x + 0.8, e.y + 0.5, 0);
    var p2 = PR.project(e.x + 0.8, e.y + 0.5, 1.15);
    var p3 = PR.project(e.x - 0.8, e.y + 0.5, 1.15);
    var g = ctx.createLinearGradient(p0.x, p0.y, p2.x, p2.y);
    g.addColorStop(0, "rgba(57,255,136," + (0.25 + glow * 0.3) + ")");
    g.addColorStop(1, "rgba(57,255,136,0.85)");
    PR.poly(ctx, [p0, p1, p2, p3], g);
    ctx.strokeStyle = CFG.COLORS.exitGlow;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y); ctx.lineTo(p3.x, p3.y);
    ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
    ctx.moveTo(p3.x, p3.y); ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }

  // The EXIT label rides above everything standing, so a pedestal in
  // front of the door never hides it.
  function drawExitLabel(ctx, level, now) {
    var e = level.exit;
    var lp = PR.project(e.x, e.y + 0.5, 1.45);
    ctx.font = "bold " + Math.max(11, PR.camera.scale * 0.32) + "px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillStyle = CFG.COLORS.exitGlow;
    ctx.fillText("EXIT", lp.x, lp.y);
  }

  function drawCone(ctx, level, guard) {
    var pts = GD.conePolygon(level, guard);
    var alert = guard.state === "chase";
    var world = pts.map(function (p) { return PR.project(p.x, p.y, 0.02); });
    PR.poly(ctx, world, alert ? CFG.COLORS.coneAlert : CFG.COLORS.coneCalm);
    ctx.beginPath();
    ctx.moveTo(world[0].x, world[0].y);
    for (var i = 1; i < world.length; i++) ctx.lineTo(world[i].x, world[i].y);
    ctx.closePath();
    ctx.strokeStyle = alert ? CFG.COLORS.coneAlertEdge : CFG.COLORS.coneEdge;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  function drawCoin(ctx, coin) {
    var z = coin.landed ? 0.06 : 0.35 + Math.sin(coin.t * Math.PI) * 0.5;
    var p = PR.project(coin.x, coin.y, z);
    var r = Math.max(3, PR.camera.scale * 0.11);
    ctx.fillStyle = "#ffd34d";
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#a67c00";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.beginPath();
    ctx.arc(p.x - r * 0.3, p.y - r * 0.3, r * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawLighting(ctx, canvas, level, player, now) {
    // Warm lamp pools.
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (var i = 0; i < level.lamps.length; i++) {
      var l = level.lamps[i];
      var p = PR.project(l.x, l.y, 0.1);
      var r = PR.camera.scale * 2.6;
      var g = ctx.createRadialGradient(p.x, p.y, 4, p.x, p.y, r);
      g.addColorStop(0, "rgba(255, 190, 90, 0.20)");
      g.addColorStop(1, "rgba(255, 190, 90, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    // The thief's little lantern glow.
    var pp = PR.project(player.x, player.y, 0.3);
    var pr = PR.camera.scale * 2.0;
    var pg = ctx.createRadialGradient(pp.x, pp.y, 4, pp.x, pp.y, pr);
    pg.addColorStop(0, "rgba(120, 220, 200, 0.14)");
    pg.addColorStop(1, "rgba(120, 220, 200, 0)");
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.arc(pp.x, pp.y, pr, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Night vignette: dark at the edges, clear in the middle.
    var vg = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) * 0.32,
      canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) * 0.75);
    vg.addColorStop(0, "rgba(4,6,16,0)");
    vg.addColorStop(1, "rgba(4,6,16,0.55)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function drawWorld(ctx, canvas, state, now) {
    var level = state.level;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#0a0d18";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawFloor(ctx, level);
    drawExit(ctx, level, now);
    // Vision cones lie on the floor, under the figures but over the tiles.
    for (var gi = 0; gi < state.guards.length; gi++) drawCone(ctx, level, state.guards[gi]);
    // Everything standing, far to near by (x + y) depth.
    var items = [];
    for (var wi = 0; wi < level.walls.length; wi++) {
      var w = level.walls[wi];
      items.push({ k: depthKey(w.x, w.y), f: drawWallItem, w: w, level: level });
    }
    for (var pi = 0; pi < level.pedestals.length; pi++) {
      var ped = level.pedestals[pi];
      items.push({ k: depthKey(ped.x, ped.y), f: drawPedestalItem, p: ped });
    }
    for (var ci = 0; ci < state.guards.length; ci++) {
      var g = state.guards[ci];
      items.push({ k: depthKey(g.x, g.y), f: drawGuardItem, g: g });
    }
    items.push({ k: depthKey(state.player.x, state.player.y), f: drawPlayerItem, p: state.player });
    items.sort(function (a, b) { return a.k - b.k; });
    for (var ii = 0; ii < items.length; ii++) items[ii].f(ctx, items[ii], state, now);
    drawExitLabel(ctx, level, now);
    if (state.player.coin) drawCoin(ctx, state.player.coin);
    drawLighting(ctx, canvas, level, state.player, now);
  }

  function drawWallItem(ctx, item) {
    drawWall(ctx, item.level, item.w);
  }

  function drawPedestalItem(ctx, item, state, now) {
    drawPedestal(ctx, item.p, now);
  }

  function drawGuardItem(ctx, item, state, now) {
    var g = item.g;
    PR.drawShadow(ctx, g.x, g.y, 0.42, 0.3, 0.45);
    var bob = Math.sin(now * 5 + g.index * 2) * 0.02;
    PR.drawFigure(ctx, g.x, g.y + bob * 0.2, {
      height: 1.05, width: 0.30,
      body: g.state === "chase" ? "#7a1f1f" : CFG.COLORS.guardBody,
      trim: CFG.COLORS.guardTrim, skin: CFG.COLORS.guardSkin,
      hat: true, facing: g.facing,
    });
    // "!" or "?" above the head while suspicious or chasing.
    if (g.suspicion > CFG.SUSPICION.curiousAt || g.state === "chase") {
      var hp = PR.project(g.x, g.y, 1.45);
      ctx.font = "bold " + Math.max(13, PR.camera.scale * 0.4) + "px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillStyle = g.state === "chase" ? "#ff5040" : "#ffd34d";
      ctx.fillText(g.state === "chase" ? "!" : "?", hp.x, hp.y);
    }
    // Suspicion arc over the guard.
    if (g.suspicion > 2) {
      var ap = PR.project(g.x, g.y, 1.28);
      var ar = Math.max(6, PR.camera.scale * 0.22);
      ctx.beginPath();
      ctx.arc(ap.x, ap.y, ar, -Math.PI / 2, -Math.PI / 2 + (g.suspicion / 100) * Math.PI * 2);
      ctx.strokeStyle = g.suspicion > 80 ? "#ff5040" : "#ffd34d";
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }

  function drawPlayerItem(ctx, item, state, now) {
    var p = item.p;
    PR.drawShadow(ctx, p.x, p.y, 0.4, 0.28, 0.5);
    var crouch = p.sneaking ? 0.88 : 1;
    var sway = p.moving ? Math.sin(p.walkPhase) * 0.03 : 0;
    PR.drawFigure(ctx, p.x + sway * 0.3, p.y, {
      height: 1.0 * crouch, width: 0.28,
      body: CFG.COLORS.thiefCloak, trim: CFG.COLORS.thiefTrim,
      skin: CFG.COLORS.thiefSkin, hood: true, facing: p.facing,
    });
    // Steal progress ring above the thief.
    if (p.stealTarget && p.stealProgress > 0) {
      var sp = PR.project(p.x, p.y, 1.35);
      var sr = Math.max(7, PR.camera.scale * 0.24);
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sr, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sr, -Math.PI / 2, -Math.PI / 2 + p.stealProgress * Math.PI * 2);
      ctx.strokeStyle = "#ffd34d";
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }

  window.MOS_RENDER = { drawWorld: drawWorld };
})();
