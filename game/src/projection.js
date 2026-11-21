// Museum of Shadows — the angled 3D camera and solid-geometry drawing.
// Hand-written oblique projection: world (x, y) is the museum floor in
// tiles, z is height above the floor. Nothing here comes from a library.
(function () {
  "use strict";
  var COS = 0.8660254; // cos(30 deg)
  var SIN = 0.5; // sin(30 deg)

  // Camera fitted to the canvas once the level size is known.
  var cam = { scale: 30, ox: 0, oy: 0 };

  function fitCamera(canvasW, canvasH, worldW, worldH, maxZ) {
    // Screen span of the floor diamond plus the tallest wall above it.
    var spanX = (worldW + worldH) * COS;
    var spanY = (worldW + worldH) * SIN + maxZ;
    var s = Math.min((canvasW - 36) / spanX, (canvasH - 30) / spanY);
    cam.scale = s;
    cam.ox = canvasW / 2 - ((worldW - worldH) * COS * s) / 2;
    cam.oy = 20 + maxZ * s - (worldW * SIN * s) / 2 + (worldH * SIN * s) / 2;
    // oy is tuned so the diamond sits centred: recompute from corners.
    var top = project(0, 0, maxZ).y;
    var bottom = project(worldW, worldH, 0).y;
    var mid = (top + bottom) / 2;
    cam.oy += canvasH / 2 - mid;
  }

  // World (x, y in tiles, z in tiles of height) -> screen pixels.
  function project(x, y, z) {
    var s = cam.scale;
    return {
      x: cam.ox + (x - y) * COS * s,
      y: cam.oy + (x + y) * SIN * s - z * s,
    };
  }

  function projectPt(x, y, z) {
    return project(x, y, z);
  }

  // Shade a hex colour by a factor (0.5 darker, 1.15 lighter).
  function shade(hex, f) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    r = Math.max(0, Math.min(255, Math.round(r * f)));
    g = Math.max(0, Math.min(255, Math.round(g * f)));
    b = Math.max(0, Math.min(255, Math.round(b * f)));
    return "rgb(" + r + "," + g + "," + b + ")";
  }

  function poly(ctx, pts, fill) {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  }

  // Draw a solid box standing on the floor: footprint (x0,y0)-(x1,y1) in
  // tiles, height h in tiles. Top face is lit, the two visible sides are
  // shaded darker, so the block reads as real 3D geometry.
  function drawBox(ctx, x0, y0, x1, y1, h, top, left, right) {
    var a = project(x0, y0, 0), b = project(x1, y0, 0);
    var c = project(x1, y1, 0), d = project(x0, y1, 0);
    var aT = project(x0, y0, h), bT = project(x1, y0, h);
    var cT = project(x1, y1, h), dT = project(x0, y1, h);
    // The two sides facing the camera: south-east (b-c) and south-west (d-c).
    poly(ctx, [d, c, cT, dT], right);
    poly(ctx, [b, c, cT, bT], left);
    poly(ctx, [aT, bT, cT, dT], top);
    // Thin bright rim on the top edge facing the lamps.
    ctx.beginPath();
    ctx.moveTo(bT.x, bT.y);
    ctx.lineTo(cT.x, cT.y);
    ctx.lineTo(dT.x, dT.y);
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Soft floor shadow: a dark ellipse under a figure, offset toward the
  // lamp light so the figure looks planted on the marble.
  function drawShadow(ctx, x, y, rx, ry, alpha) {
    var p = project(x, y, 0);
    ctx.beginPath();
    ctx.ellipse(p.x + 4, p.y + 2, rx * cam.scale * 0.5, ry * cam.scale * 0.32, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0," + alpha + ")";
    ctx.fill();
  }

  // A standing figure built from solid parts: boots, a tall torso block
  // with a shaded side, shoulders, head and a hat or hood. Height in tiles.
  function drawFigure(ctx, x, y, opt) {
    var s = cam.scale;
    var h = opt.height; // total height in tiles
    var w = opt.width; // half-width in tiles
    var p = project(x, y, 0);
    var top = project(x, y, h);
    var bodyW = w * s * 0.9;
    var bodyH = h * s * 0.72;
    // Legs / boots: two short dark blocks at the base.
    ctx.fillStyle = shade(opt.body, 0.45);
    ctx.fillRect(p.x - bodyW * 0.55, p.y - bodyH * 0.22, bodyW * 0.42, bodyH * 0.22);
    ctx.fillRect(p.x + bodyW * 0.13, p.y - bodyH * 0.22, bodyW * 0.42, bodyH * 0.22);
    // Torso: a vertical slab, lit on its left edge, dark on its right.
    var grad = ctx.createLinearGradient(p.x - bodyW / 2, 0, p.x + bodyW / 2, 0);
    grad.addColorStop(0, shade(opt.body, 1.25));
    grad.addColorStop(0.55, opt.body);
    grad.addColorStop(1, shade(opt.body, 0.55));
    ctx.fillStyle = grad;
    var torsoTop = p.y - bodyH;
    ctx.beginPath();
    ctx.moveTo(p.x - bodyW / 2, p.y - bodyH * 0.18);
    ctx.lineTo(p.x - bodyW * 0.42, torsoTop);
    ctx.lineTo(p.x + bodyW * 0.42, torsoTop);
    ctx.lineTo(p.x + bodyW / 2, p.y - bodyH * 0.18);
    ctx.closePath();
    ctx.fill();
    // Trim stripe across the chest.
    if (opt.trim) {
      ctx.strokeStyle = opt.trim;
      ctx.lineWidth = Math.max(1.5, s * 0.045);
      ctx.beginPath();
      ctx.moveTo(p.x - bodyW * 0.44, p.y - bodyH * 0.52);
      ctx.lineTo(p.x + bodyW * 0.44, p.y - bodyH * 0.52);
      ctx.stroke();
    }
    // Head: a shaded sphere with a cap brim or a hood.
    var headR = Math.max(3, w * s * 0.42);
    var headY = torsoTop - headR * 0.9;
    var hg = ctx.createRadialGradient(p.x - headR * 0.35, headY - headR * 0.35, headR * 0.1, p.x, headY, headR);
    hg.addColorStop(0, shade(opt.skin, 1.25));
    hg.addColorStop(1, shade(opt.skin, 0.75));
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.arc(p.x, headY, headR, 0, Math.PI * 2);
    ctx.fill();
    if (opt.hat) {
      // Peaked cap: dark dome + brim pointing along the facing angle.
      ctx.fillStyle = shade(opt.body, 0.6);
      ctx.beginPath();
      ctx.arc(p.x, headY - headR * 0.25, headR * 1.05, Math.PI, 0);
      ctx.fill();
      var fx = Math.cos(opt.facing || 0), fy = Math.sin(opt.facing || 0);
      ctx.beginPath();
      ctx.ellipse(p.x + fx * headR * 0.7, headY + headR * 0.15 + fy * headR * 0.25, headR * 0.9, headR * 0.32, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (opt.hood) {
      // Hood: dark cloth over the head with a gold rim.
      ctx.fillStyle = shade(opt.body, 0.7);
      ctx.beginPath();
      ctx.arc(p.x, headY - headR * 0.15, headR * 1.25, Math.PI * 0.95, Math.PI * 2.05);
      ctx.fill();
      ctx.strokeStyle = opt.trim || "#ffd34d";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(p.x, headY, headR * 0.95, Math.PI * 1.08, Math.PI * 1.92);
      ctx.stroke();
    }
    return { x: p.x, y: top.y };
  }

  window.MOS_PROJ = {
    fitCamera: fitCamera,
    project: project,
    projectPt: projectPt,
    shade: shade,
    poly: poly,
    drawBox: drawBox,
    drawShadow: drawShadow,
    drawFigure: drawFigure,
    camera: cam,
  };
})();
