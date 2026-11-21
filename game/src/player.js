// Museum of Shadows — the thief: movement, coin throws, stealing relics.
(function () {
  "use strict";
  var CFG = window.MOS_CONFIG;
  var LV = window.MOS_LEVEL;

  function makePlayer(level) {
    return {
      x: level.start.x, y: level.start.y,
      facing: -Math.PI / 2,
      sneaking: false,
      moving: false,
      coins: CFG.PLAYER.coins,
      relics: 0,
      stealTarget: null,
      stealProgress: 0,
      coin: null, // flying coin {x, y, tx, ty, t} or a landed coin {x, y, t}
      walkPhase: 0,
    };
  }

  function updatePlayer(level, player, input, dt, events) {
    var mx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    var my = (input.down ? 1 : 0) - (input.up ? 1 : 0);
    player.sneaking = !!input.sneak;
    player.moving = mx !== 0 || my !== 0;
    if (player.moving) {
      var len = Math.sqrt(mx * mx + my * my);
      var speed = player.sneaking ? CFG.PLAYER.sneakSpeed : CFG.PLAYER.walkSpeed;
      player.facing = Math.atan2(my / len, mx / len);
      LV.moveCircle(level, player, (mx / len) * speed * dt, (my / len) * speed * dt, CFG.PLAYER.radius);
      player.walkPhase += dt * (player.sneaking ? 6 : 10);
      player.stealProgress = 0;
      player.stealTarget = null;
    }
    // Stealing: hold E beside a relic pedestal to lift it.
    if (input.steal) {
      var relic = nearestRelic(level, player);
      if (relic) {
        player.stealTarget = relic;
        player.stealProgress += dt / CFG.STEAL_TIME;
        if (player.stealProgress >= 1) {
          relic.taken = true;
          player.relics += 1;
          player.stealProgress = 0;
          player.stealTarget = null;
          events.push({ type: "stolen", relic: relic });
        }
      } else {
        player.stealTarget = null;
        player.stealProgress = 0;
      }
    } else {
      player.stealTarget = null;
      player.stealProgress = 0;
    }
    // Coin throw: click (or C) tosses a coin toward a floor point.
    if (input.throwCoin && player.coins > 0 && !player.coin) {
      player.coins -= 1;
      player.coin = { x: player.x, y: player.y, tx: input.throwX, ty: input.throwY, t: 0, landed: false };
      events.push({ type: "coin-thrown" });
    }
    input.throwCoin = false;
    if (player.coin) {
      var c = player.coin;
      if (!c.landed) {
        c.t += dt * 2.2;
        if (c.t >= 1) {
          c.t = 1;
          c.landed = true;
          c.rest = 0;
          events.push({ type: "coin-landed", x: c.tx, y: c.ty });
        }
        c.x = player.x + (c.tx - player.x) * c.t;
        c.y = player.y + (c.ty - player.y) * c.t;
      } else {
        c.rest += dt;
        if (c.rest > 6) player.coin = null;
      }
    }
  }

  function nearestRelic(level, player) {
    var best = null, bestD = 1.6;
    for (var i = 0; i < level.relics.length; i++) {
      var r = level.relics[i];
      if (r.taken) continue;
      var dx = r.x - player.x, dy = r.y - player.y;
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d < bestD) { bestD = d; best = r; }
    }
    return best;
  }

  function atExit(level, player) {
    var e = level.exit;
    var dx = e.x - player.x, dy = e.y - player.y;
    return Math.sqrt(dx * dx + dy * dy) < 0.9;
  }

  window.MOS_PLAYER = {
    makePlayer: makePlayer,
    updatePlayer: updatePlayer,
    nearestRelic: nearestRelic,
    atExit: atExit,
  };
})();
