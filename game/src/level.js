// Museum of Shadows — the museum grid: walls, cover, relics, exit, lamps.
(function () {
  "use strict";
  var CFG = window.MOS_CONFIG;

  function buildLevel() {
    var rows = CFG.MAP;
    var h = rows.length;
    var w = rows[0].length;
    var walls = [];
    var pedestals = [];
    var lamps = [];
    var exit = null;
    var start = { x: 2.5, y: 10.5 };
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var ch = rows[y][x];
        if (ch === "#") walls.push({ x: x, y: y });
        else if (ch === "P") pedestals.push({ x: x, y: y, relic: null });
        else if (ch === "R") pedestals.push({ x: x, y: y, relic: null });
        else if (ch === "L") lamps.push({ x: x + 0.5, y: y + 0.5 });
        else if (ch === "E") exit = { x: x + 0.5, y: y + 0.5 };
        else if (ch === "S") start = { x: x + 0.5, y: y + 0.5 };
      }
    }
    var relics = CFG.RELICS.map(function (r) {
      var ped = null;
      for (var i = 0; i < pedestals.length; i++) {
        if (pedestals[i].x === r.x && pedestals[i].y === r.y) ped = pedestals[i];
      }
      var relic = { id: r.id, name: r.name, x: r.x + 0.5, y: r.y + 0.5, gem: r.gem, glow: r.glow, taken: false };
      if (ped) ped.relic = relic;
      return relic;
    });
    return { w: w, h: h, walls: walls, pedestals: pedestals, lamps: lamps, exit: exit, start: start, relics: relics };
  }

  function tileAt(level, x, y) {
    var tx = Math.floor(x), ty = Math.floor(y);
    if (tx < 0 || ty < 0 || tx >= level.w || ty >= level.h) return "#";
    return CFG.MAP[ty][tx];
  }

  function isWall(level, x, y) {
    return tileAt(level, x, y) === "#";
  }

  // A tile blocks a guard's line of sight: walls always, pedestals too —
  // crouching behind a display case is real cover.
  function blocksSight(level, x, y) {
    var t = tileAt(level, x, y);
    return t === "#" || t === "P" || t === "R";
  }

  // Line of sight between two floor points, sampled finely. True when the
  // whole segment stays clear of sight-blocking tiles.
  function hasLineOfSight(level, x0, y0, x1, y1) {
    var dx = x1 - x0, dy = y1 - y0;
    var dist = Math.sqrt(dx * dx + dy * dy);
    var steps = Math.max(1, Math.ceil(dist / 0.12));
    for (var i = 1; i < steps; i++) {
      var t = i / steps;
      if (blocksSight(level, x0 + dx * t, y0 + dy * t)) return false;
    }
    return true;
  }

  // Move a circle (radius r) through the grid, sliding along walls.
  function moveCircle(level, pos, dx, dy, r) {
    var nx = pos.x + dx;
    if (!hitsWall(level, nx, pos.y, r)) pos.x = nx;
    var ny = pos.y + dy;
    if (!hitsWall(level, pos.x, ny, r)) pos.y = ny;
  }

  function hitsWall(level, x, y, r) {
    // Test the four corners of the circle's bounding box against walls
    // and pedestals (both are solid to walk through).
    var pts = [[x - r, y - r], [x + r, y - r], [x - r, y + r], [x + r, y + r],
               [x, y - r], [x, y + r], [x - r, y], [x + r, y]];
    for (var i = 0; i < pts.length; i++) {
      var t = tileAt(level, pts[i][0], pts[i][1]);
      if (t === "#" || t === "P" || t === "R") return true;
    }
    return false;
  }

  // Distance along a ray from (x,y) in direction (dx,dy) until it hits a
  // sight-blocking tile, capped at maxDist. Used to shape vision cones.
  function castRay(level, x, y, dx, dy, maxDist) {
    var step = 0.15;
    var d = step;
    while (d < maxDist) {
      if (blocksSight(level, x + dx * d, y + dy * d)) return d;
      d += step;
    }
    return maxDist;
  }

  window.MOS_LEVEL = {
    buildLevel: buildLevel,
    tileAt: tileAt,
    isWall: isWall,
    blocksSight: blocksSight,
    hasLineOfSight: hasLineOfSight,
    moveCircle: moveCircle,
    castRay: castRay,
  };
})();
