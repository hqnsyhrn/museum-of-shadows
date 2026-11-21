// Museum of Shadows — game loop, input, states and HUD.
(function () {
  "use strict";
  var CFG = window.MOS_CONFIG;
  var PR = window.MOS_PROJ;
  var LV = window.MOS_LEVEL;
  var GD = window.MOS_GUARDS;
  var PL = window.MOS_PLAYER;
  var RD = window.MOS_RENDER;
  var AU = window.MOS_AUDIO;
  var SH = window.MOS_SHOTS;

  var canvas, ctx;
  var state;
  var input = { up: false, down: false, left: false, right: false, sneak: false, steal: false, throwCoin: false, throwX: 0, throwY: 0 };
  var mouse = { x: 0, y: 0 };
  var toastTimer = null;
  var lastTs = 0;
  var shotMode = null;

  function newGame() {
    var level = LV.buildLevel();
    return {
      level: level,
      guards: GD.makeGuards(),
      player: PL.makePlayer(level),
      mode: "title", // title | playing | caught | win
      elapsed: 0,
      alarm: false,
      message: "",
    };
  }

  function el(id) { return document.getElementById(id); }

  function fmtTime(s) {
    var m = Math.floor(s / 60), ss = Math.floor(s % 60);
    return (m < 10 ? "0" : "") + m + ":" + (ss < 10 ? "0" : "") + ss;
  }

  function showToast(text, ms) {
    var t = el("toast");
    t.textContent = text;
    t.classList.add("show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, ms || 2400);
  }

  function updateHud() {
    var p = state.player;
    var relicDots = "";
    for (var i = 0; i < 3; i++) {
      relicDots += '<span class="relic' + (i < p.relics ? " got" : "") + '">' + (i < p.relics ? "◆" : "◇") + "</span>";
    }
    el("relics").innerHTML = relicDots;
    el("relic-count").textContent = p.relics + " / 3 relics";
    el("coins").textContent = "◉ × " + p.coins;
    el("timer").textContent = fmtTime(state.elapsed);
    var maxS = 0;
    for (var i = 0; i < state.guards.length; i++) maxS = Math.max(maxS, state.guards[i].suspicion);
    var bar = el("suspicion-fill");
    bar.style.width = Math.round(maxS) + "%";
    bar.className = "fill" + (maxS >= 80 ? " hot" : maxS >= 55 ? " warm" : "");
    el("suspicion-label").textContent = maxS >= 100 ? "SPOTTED!" : maxS >= 55 ? "SUSPICIOUS" : "UNSEEN";
    document.body.classList.toggle("alarm", state.alarm);
    var obj = p.relics >= 3
      ? "All relics stolen — reach the green EXIT!"
      : "Steal the 3 relics, then reach the EXIT unseen.";
    el("objective").textContent = obj;
  }

  function setOverlay(which) {
    el("overlay-title").classList.toggle("hidden", which !== "title");
    el("overlay-end").classList.toggle("hidden", which !== "end");
    if (which === "end") {
      var win = state.mode === "win";
      el("end-title").textContent = win ? "CLEAN GETAWAY" : "CAUGHT!";
      el("end-title").className = win ? "win" : "lose";
      el("end-text").textContent = win
        ? "All three relics, and not a single guard saw you leave. The museum never knew you were there."
        : "A guard caught you under the lamps. The relics stay in their cases — this time.";
      el("end-stats").textContent = "Relics " + state.player.relics + " / 3   ·   Time " + fmtTime(state.elapsed);
      el("end-button").textContent = win ? "Play again" : "Try again";
    }
  }

  function startGame() {
    state.mode = "playing";
    setOverlay(null);
    showToast("Stay out of the yellow cones. Hold E at a glowing relic to steal it.", 3200);
  }

  function endGame(win) {
    state.mode = win ? "win" : "caught";
    setOverlay("end");
    if (win) AU.win(); else AU.caught();
  }

  function handleEvents(events) {
    for (var i = 0; i < events.length; i++) {
      var e = events[i];
      if (e.type === "spotted") {
        state.alarm = true;
        AU.alert();
        showToast("SPOTTED! Run — break line of sight!", 2200);
      } else if (e.type === "caught") {
        endGame(false);
      } else if (e.type === "stolen") {
        AU.steal();
        showToast(e.relic.name + " stolen! (" + state.player.relics + " / 3)", 2200);
      } else if (e.type === "coin-thrown") {
        AU.coin();
      } else if (e.type === "coin-landed") {
        AU.clink();
        GD.hearCoin(state.guards, e.x, e.y);
        showToast("Clink! A guard goes to look.", 1600);
      }
    }
  }

  function tick(ts) {
    var dt = Math.min(0.05, (ts - lastTs) / 1000 || 0.016);
    lastTs = ts;
    var now = ts / 1000;
    if (state.mode === "playing") {
      state.elapsed += dt;
      var events = [];
      PL.updatePlayer(state.level, state.player, input, dt, events);
      GD.updateGuards(state.level, state.guards, state.player, dt, now, events);
      handleEvents(events);
      state.alarm = false;
      for (var i = 0; i < state.guards.length; i++) {
        if (state.guards[i].state === "chase") { state.alarm = true; break; }
      }
      if (state.player.relics >= 3 && PL.atExit(state.level, state.player)) endGame(true);
      updateHud();
    }
    RD.drawWorld(ctx, canvas, state, now);
    if (state.mode !== "caught" && state.mode !== "win") requestAnimationFrame(tick);
    else RD.drawWorld(ctx, canvas, state, now);
  }

  // Screen point -> floor tile coords (z = 0 plane).
  function screenToWorld(sx, sy) {
    var rect = canvas.getBoundingClientRect();
    var px = (sx - rect.left) * (canvas.width / rect.width);
    var py = (sy - rect.top) * (canvas.height / rect.height);
    var cam = PR.camera;
    var a = (px - cam.ox) / (0.8660254 * cam.scale);
    var b = (py - cam.oy) / cam.scale;
    var sum = 2 * b; // x + y
    return { x: (a + sum) / 2, y: (sum - a) / 2 };
  }

  function bindInput() {
    var keyMap = {
      KeyW: "up", ArrowUp: "up",
      KeyS: "down", ArrowDown: "down",
      KeyA: "left", ArrowLeft: "left",
      KeyD: "right", ArrowRight: "right",
      ShiftLeft: "sneak", ShiftRight: "sneak",
      KeyE: "steal",
    };
    window.addEventListener("keydown", function (ev) {
      if (keyMap[ev.code] !== undefined) {
        input[keyMap[ev.code]] = true;
        ev.preventDefault();
      }
      if (ev.code === "KeyC" && state.mode === "playing") {
        var w = screenToWorld(mouse.x, mouse.y);
        input.throwX = Math.max(0.5, Math.min(state.level.w - 0.5, w.x));
        input.throwY = Math.max(0.5, Math.min(state.level.h - 0.5, w.y));
        input.throwCoin = true;
      }
      if (ev.code === "Enter" || ev.code === "Space") {
        if (state.mode === "title") startGame();
        else if (state.mode === "caught" || state.mode === "win") restart();
      }
      if (ev.code === "KeyR" && (state.mode === "caught" || state.mode === "win")) restart();
    });
    window.addEventListener("keyup", function (ev) {
      if (keyMap[ev.code] !== undefined) input[keyMap[ev.code]] = false;
    });
    canvas.addEventListener("mousemove", function (ev) { mouse.x = ev.clientX; mouse.y = ev.clientY; });
    canvas.addEventListener("click", function (ev) {
      if (state.mode !== "playing") return;
      var w = screenToWorld(ev.clientX, ev.clientY);
      input.throwX = Math.max(0.5, Math.min(state.level.w - 0.5, w.x));
      input.throwY = Math.max(0.5, Math.min(state.level.h - 0.5, w.y));
      input.throwCoin = true;
    });
    el("start-button").addEventListener("click", startGame);
    el("end-button").addEventListener("click", restart);
  }

  function restart() {
    state = newGame();
    if (shotMode) {
      var overlay = SH.applyShot(state, shotMode);
      state.mode = "playing";
      if (overlay === "title") { state.mode = "title"; setOverlay("title"); }
      else if (overlay === "win") { state.mode = "win"; setOverlay("end"); }
      else setOverlay(null);
      updateHud();
      RD.drawWorld(ctx, canvas, state, 1.0);
      return;
    }
    state.mode = "title";
    setOverlay("title");
    updateHud();
    RD.drawWorld(ctx, canvas, state, 1.0);
  }

  function init() {
    canvas = el("game");
    ctx = canvas.getContext("2d");
    state = newGame();
    var q = new URLSearchParams(window.location.search);
    shotMode = q.get("shot");
    PR.fitCamera(canvas.width, canvas.height, state.level.w, state.level.h, 1.2);
    bindInput();
    if (shotMode) {
      var overlay = SH.applyShot(state, shotMode);
      state.mode = "playing";
      if (overlay === "title") { state.mode = "title"; setOverlay("title"); }
      else if (overlay === "win") { state.mode = "win"; setOverlay("end"); }
      else setOverlay(null);
      updateHud();
      // One fixed frame: deterministic, no animation loop.
      RD.drawWorld(ctx, canvas, state, 1.0);
      document.title = "Museum of Shadows — " + shotMode;
      return;
    }
    setOverlay("title");
    updateHud();
    requestAnimationFrame(function (ts) { lastTs = ts; requestAnimationFrame(tick); });
  }

  window.addEventListener("DOMContentLoaded", init);
})();
