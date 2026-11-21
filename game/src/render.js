// Museum of Shadows — everything the eye sees, drawn on one canvas.
// The whole museum fits on a single 1280x800 screen: warm lamplight
// pools, gold relics, glass display cases, and the guards' vision
// cones laid over the floor so a still image already tells the story —
// where the thief is, what the guards can see, and where the exit is.
import { CONFIG } from "./config.js";

const { TILE, WIDTH, HEIGHT, COLORS } = CONFIG;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawFloor(ctx, level, time) {
  for (let ty = 0; ty < CONFIG.ROWS; ty++) {
    for (let tx = 0; tx < CONFIG.COLS; tx++) {
      const ch = level.grid[ty][tx];
      if (ch === "#") continue;
      ctx.fillStyle = (tx + ty) % 2 === 0 ? COLORS.floorDark : COLORS.floorLight;
      ctx.fillRect(tx * TILE, ty * TILE, TILE, TILE);
    }
  }
  // Warm lamplight pools along the grand hall.
  for (const [lx, ly] of [[320, 320], [640, 320], [960, 320], [640, 640]]) {
    const g = ctx.createRadialGradient(lx, ly, 10, lx, ly, 190);
    g.addColorStop(0, "rgba(232, 182, 76, 0.10)");
    g.addColorStop(1, "rgba(232, 182, 76, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(lx - 190, ly - 190, 380, 380);
  }
  void time;
}

function drawWalls(ctx, level) {
  for (let ty = 0; ty < CONFIG.ROWS; ty++) {
    for (let tx = 0; tx < CONFIG.COLS; tx++) {
      if (level.grid[ty][tx] !== "#") continue;
      const x = tx * TILE;
      const y = ty * TILE;
      ctx.fillStyle = COLORS.wall;
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = COLORS.wallTop;
      ctx.fillRect(x, y, TILE, 5);
      ctx.fillStyle = "rgba(232, 182, 76, 0.25)";
      ctx.fillRect(x, y + TILE - 2, TILE, 2);
    }
  }
}

function drawExit(ctx, level, allRelicsTaken, time) {
  const pulse = 0.55 + 0.35 * Math.sin(time * 3);
  for (const tile of level.exitTiles) {
    const x = tile.tx * TILE;
    const y = tile.ty * TILE;
    ctx.fillStyle = allRelicsTaken
      ? `rgba(57, 217, 138, ${0.55 + pulse * 0.35})`
      : "rgba(57, 217, 138, 0.20)";
    ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
    ctx.strokeStyle = COLORS.exit;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 3, y + 3, TILE - 6, TILE - 6);
  }
  // A lit EXIT sign above the doors, always readable.
  const cx = (level.exitTiles[0].tx + 1) * TILE;
  const cy = level.exitTiles[0].ty * TILE - 12;
  ctx.font = "bold 15px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = allRelicsTaken ? "#7dffa9" : "#57b98a";
  ctx.fillText(allRelicsTaken ? "EXIT — OPEN" : "EXIT — LOCKED", cx, cy);
}

function drawCases(ctx, level) {
  for (const c of level.cases) {
    const x = c.tx * TILE;
    const y = c.ty * TILE;
    ctx.fillStyle = "#20263f";
    ctx.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
    ctx.fillStyle = "rgba(62, 198, 198, 0.30)";
    ctx.fillRect(x + 7, y + 7, TILE - 14, TILE - 14);
    ctx.strokeStyle = "rgba(62, 198, 198, 0.85)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 7, y + 7, TILE - 14, TILE - 14);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.beginPath();
    ctx.moveTo(x + 10, y + 26);
    ctx.lineTo(x + 24, y + 12);
    ctx.stroke();
  }
}

function drawRelics(ctx, level, time) {
  for (const relic of level.relics) {
    if (relic.taken) {
      // Empty pedestal: a velvet cushion with a dust outline.
      ctx.fillStyle = "#33202e";
      ctx.beginPath();
      ctx.arc(relic.x, relic.y, 11, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    const glow = 0.5 + 0.4 * Math.sin(time * 2.4 + relic.index * 2);
    const g = ctx.createRadialGradient(relic.x, relic.y, 2, relic.x, relic.y, 34);
    g.addColorStop(0, `rgba(255, 215, 106, ${0.55 * glow + 0.25})`);
    g.addColorStop(1, "rgba(255, 215, 106, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(relic.x - 34, relic.y - 34, 68, 68);
    // Pedestal + golden diamond relic.
    ctx.fillStyle = "#3a3049";
    ctx.fillRect(relic.x - 12, relic.y + 4, 24, 12);
    ctx.fillStyle = COLORS.relic;
    ctx.beginPath();
    ctx.moveTo(relic.x, relic.y - 14);
    ctx.lineTo(relic.x + 9, relic.y - 2);
    ctx.lineTo(relic.x, relic.y + 8);
    ctx.lineTo(relic.x - 9, relic.y - 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.beginPath();
    ctx.moveTo(relic.x, relic.y - 14);
    ctx.lineTo(relic.x + 9, relic.y - 2);
    ctx.lineTo(relic.x, relic.y - 2);
    ctx.closePath();
    ctx.fill();
  }
}

function drawPatrolPaths(ctx, guards) {
  ctx.save();
  ctx.setLineDash([2, 9]);
  ctx.strokeStyle = "rgba(154, 167, 199, 0.20)";
  ctx.lineWidth = 1.5;
  for (const guard of guards) {
    ctx.beginPath();
    guard.route.forEach(([tx, ty], i) => {
      const x = (tx + 0.5) * TILE;
      const y = (ty + 0.5) * TILE;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();
  }
  ctx.restore();
}

function drawVisionCone(ctx, guard) {
  const range = CONFIG.GUARD_VIEW_RANGE;
  const half = CONFIG.GUARD_VIEW_HALF_ANGLE;
  const hot = guard.state === "alarm";
  const warm = guard.state === "suspicious" || guard.state === "investigate";
  const g = ctx.createRadialGradient(guard.x, guard.y, 8, guard.x, guard.y, range);
  if (hot) {
    g.addColorStop(0, "rgba(255, 70, 50, 0.42)");
    g.addColorStop(1, "rgba(255, 70, 50, 0.05)");
  } else if (warm) {
    g.addColorStop(0, "rgba(255, 170, 60, 0.34)");
    g.addColorStop(1, "rgba(255, 170, 60, 0.05)");
  } else {
    g.addColorStop(0, "rgba(255, 214, 110, 0.26)");
    g.addColorStop(1, "rgba(255, 214, 110, 0.03)");
  }
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.arc(guard.x, guard.y, range, guard.dir - half, guard.dir + half);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = hot
    ? "rgba(255, 90, 60, 0.5)"
    : "rgba(255, 214, 110, 0.35)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(
    guard.x + Math.cos(guard.dir - half) * range,
    guard.y + Math.sin(guard.dir - half) * range,
  );
  ctx.arc(guard.x, guard.y, range, guard.dir - half, guard.dir + half);
  ctx.lineTo(
    guard.x + Math.cos(guard.dir + half) * range,
    guard.y + Math.sin(guard.dir + half) * range,
  );
  ctx.stroke();
}

function drawGuard(ctx, guard, time) {
  const bob = Math.sin(guard.bob) * 1.5;
  // Body: navy uniform, brass buttons, a cap.
  ctx.fillStyle = "#1d2440";
  ctx.beginPath();
  ctx.arc(guard.x, guard.y + bob * 0.3, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.guard;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y + bob * 0.3, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e8b64c";
  ctx.beginPath();
  ctx.arc(guard.x, guard.y + bob * 0.3, 3.5, 0, Math.PI * 2);
  ctx.fill();
  // Facing tick.
  ctx.strokeStyle = "#dfe6ff";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.lineTo(
    guard.x + Math.cos(guard.dir) * 17,
    guard.y + Math.sin(guard.dir) * 17,
  );
  ctx.stroke();
  // Suspicion bar + mark above the head.
  if (guard.suspicion > 4) {
    const w = 26;
    const x = guard.x - w / 2;
    const y = guard.y - 26;
    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    ctx.fillRect(x, y, w, 5);
    ctx.fillStyle =
      guard.suspicion >= CONFIG.SUSPICION_ALARM ? "#ff5a3c" : "#ffc93c";
    ctx.fillRect(x, y, (w * guard.suspicion) / 100, 5);
  }
  if (guard.state === "alarm") {
    drawMark(ctx, guard.x, guard.y - 38, "!", "#ff5a3c");
  } else if (guard.state === "suspicious" || guard.state === "investigate") {
    drawMark(ctx, guard.x, guard.y - 38, "?", "#ffc93c");
  }
  void time;
}

function drawMark(ctx, x, y, text, color) {
  ctx.font = "bold 20px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.beginPath();
  ctx.arc(x, y, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.fillText(text, x, y + 1);
}

function drawCoins(ctx, coins, time) {
  for (const coin of coins) {
    if (!coin.landed) {
      // Mid-flight: a small spinning gold dot with a shadow arc.
      const lift = Math.sin(coin.flight * Math.PI) * 14;
      ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
      ctx.beginPath();
      ctx.ellipse(coin.x, coin.y + 4, 6, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = COLORS.gold;
      ctx.beginPath();
      ctx.arc(coin.x, coin.y - lift, 4.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = COLORS.gold;
      ctx.beginPath();
      ctx.arc(coin.x, coin.y, 4, 0, Math.PI * 2);
      ctx.fill();
      if (coin.ring > 0) {
        const progress = 1 - coin.ring / 0.9;
        ctx.strokeStyle = `rgba(232, 182, 76, ${0.8 * (1 - progress)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(coin.x, coin.y, 8 + progress * 46, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }
  void time;
}

function drawPlayer(ctx, player, time) {
  const crouch = player.sneaking ? 0.82 : 1;
  const bob = player.moving ? Math.sin(player.walkCycle) * 1.6 : 0;
  const r = 12 * crouch;
  // Hooded thief: deep violet cloak, pale hood, glinting eyes.
  ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
  ctx.beginPath();
  ctx.ellipse(player.x, player.y + 10, 11, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#4b2e83";
  ctx.beginPath();
  ctx.arc(player.x, player.y + bob * 0.3, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.arc(player.x, player.y + bob * 0.3 - 2, r * 0.62, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f2ead8";
  ctx.beginPath();
  ctx.arc(player.x - 3.4, player.y + bob * 0.3 - 3, 1.6, 0, Math.PI * 2);
  ctx.arc(player.x + 3.4, player.y + bob * 0.3 - 3, 1.6, 0, Math.PI * 2);
  ctx.fill();
  // Facing tick.
  ctx.strokeStyle = "rgba(242, 234, 216, 0.8)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.lineTo(
    player.x + Math.cos(player.dir) * (r + 5),
    player.y + Math.sin(player.dir) * (r + 5),
  );
  ctx.stroke();
  // Steal progress ring.
  if (player.stealing && player.stealProgress > 0) {
    ctx.strokeStyle = "rgba(255, 215, 106, 0.9)";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 20, -Math.PI / 2, -Math.PI / 2 + player.stealProgress * Math.PI * 2);
    ctx.stroke();
    ctx.font = "bold 12px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffd76a";
    ctx.fillText("LIFTING…", player.x, player.y - 28);
  }
  void time;
}

function drawHud(ctx, state) {
  const { player, level } = state;
  ctx.fillStyle = "rgba(8, 10, 22, 0.82)";
  ctx.fillRect(0, 0, WIDTH, 46);
  ctx.fillStyle = "rgba(232, 182, 76, 0.35)";
  ctx.fillRect(0, 46, WIDTH, 1);

  // Relics: three diamonds, filled gold once stolen.
  ctx.font = "bold 14px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = COLORS.text;
  ctx.fillText("RELICS", 16, 24);
  level.relics.forEach((relic, i) => {
    const x = 84 + i * 30;
    const y = 23;
    ctx.fillStyle = relic.taken ? COLORS.relic : "rgba(154, 167, 199, 0.35)";
    ctx.beginPath();
    ctx.moveTo(x, y - 8);
    ctx.lineTo(x + 8, y);
    ctx.lineTo(x, y + 8);
    ctx.lineTo(x - 8, y);
    ctx.closePath();
    ctx.fill();
  });
  ctx.fillStyle = COLORS.muted;
  ctx.fillText(`${player.relics} / 3`, 178, 24);

  // Coins.
  ctx.fillStyle = COLORS.gold;
  ctx.beginPath();
  ctx.arc(262, 23, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.text;
  ctx.fillText(`× ${player.coins}`, 274, 24);
  ctx.fillStyle = COLORS.muted;
  ctx.font = "12px system-ui, sans-serif";
  ctx.fillText("SPACE / CLICK — throw", 306, 24);

  // Alert meter.
  const ax = 560;
  ctx.fillStyle = COLORS.text;
  ctx.font = "bold 14px system-ui, sans-serif";
  ctx.fillText("ALERT", ax, 24);
  ctx.fillStyle = "rgba(154, 167, 199, 0.25)";
  roundRect(ctx, ax + 52, 14, 170, 18, 4);
  ctx.fill();
  const alertW = (170 * Math.min(100, state.alert)) / 100;
  ctx.fillStyle =
    state.alert >= 60 ? "#ff5a3c" : state.alert >= 25 ? "#ffc93c" : "#39d98a";
  if (alertW > 0) {
    roundRect(ctx, ax + 52, 14, alertW, 18, 4);
    ctx.fill();
  }

  // Timer.
  const t = Math.floor(state.elapsed);
  const mm = String(Math.floor(t / 60)).padStart(2, "0");
  const ss = String(t % 60).padStart(2, "0");
  ctx.fillStyle = COLORS.text;
  ctx.font = "bold 16px system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(`${mm}:${ss}`, WIDTH - 16, 24);
  ctx.textAlign = "left";

  // Objective line, bottom-left.
  ctx.font = "13px system-ui, sans-serif";
  ctx.fillStyle = "rgba(242, 234, 216, 0.85)";
  const objective =
    player.relics < 3
      ? `Steal the relics — ${player.relics}/3 — then reach the green EXIT unseen.`
      : "All relics stolen — reach the green EXIT!";
  ctx.fillText(objective, 16, HEIGHT - 14);
  ctx.textAlign = "right";
  ctx.fillStyle = COLORS.muted;
  ctx.fillText("WASD move · SHIFT sneak · E lift relic · P pause", WIDTH - 16, HEIGHT - 14);
  ctx.textAlign = "left";
}

function drawTitle(ctx, state) {
  ctx.fillStyle = "rgba(6, 8, 18, 0.50)";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.textAlign = "center";
  ctx.fillStyle = COLORS.gold;
  ctx.font = "bold 64px Georgia, serif";
  ctx.fillText("MUSEUM OF SHADOWS", WIDTH / 2, 250);
  ctx.fillStyle = COLORS.text;
  ctx.font = "20px Georgia, serif";
  ctx.fillText("A night-museum stealth heist", WIDTH / 2, 292);
  ctx.font = "16px system-ui, sans-serif";
  ctx.fillStyle = COLORS.muted;
  ctx.fillText("Steal all 3 relics and reach the green EXIT — unseen.", WIDTH / 2, 330);
  ctx.fillStyle = COLORS.text;
  ctx.font = "15px system-ui, sans-serif";
  ctx.fillText("WASD / arrows — move      SHIFT — sneak      E — lift a relic", WIDTH / 2, 392);
  ctx.fillText("SPACE or CLICK — throw a coin to distract a guard", WIDTH / 2, 418);
  ctx.fillText("8 guards patrol with vision cones · display cases block their sight", WIDTH / 2, 444);
  const blink = 0.6 + 0.4 * Math.sin(state.time * 3);
  ctx.fillStyle = `rgba(255, 215, 106, ${blink})`;
  ctx.font = "bold 22px system-ui, sans-serif";
  ctx.fillText("CLICK OR PRESS ENTER TO BEGIN", WIDTH / 2, 510);
  ctx.textAlign = "left";
}

function drawPanel(ctx, title, lines, accent) {
  const w = 560;
  const h = 120 + lines.length * 30;
  const x = (WIDTH - w) / 2;
  const y = (HEIGHT - h) / 2;
  ctx.fillStyle = "rgba(6, 8, 18, 0.88)";
  roundRect(ctx, x, y, w, h, 14);
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 14);
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.fillStyle = accent;
  ctx.font = "bold 44px Georgia, serif";
  ctx.fillText(title, WIDTH / 2, y + 66);
  ctx.fillStyle = COLORS.text;
  ctx.font = "16px system-ui, sans-serif";
  lines.forEach((line, i) => ctx.fillText(line, WIDTH / 2, y + 108 + i * 30));
  ctx.textAlign = "left";
}

function drawEnd(ctx, state) {
  ctx.fillStyle = "rgba(6, 8, 18, 0.55)";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  if (state.phase === "win") {
    const t = Math.floor(state.elapsed);
    const rating =
      state.alarmsRaised === 0
        ? "GHOST — never spotted"
        : state.alarmsRaised <= 2
          ? "SHADOW — barely a whisper"
          : "SMASH-AND-GRAB — loud, but rich";
    drawPanel(
      ctx,
      "ESCAPED!",
      [
        `All 3 relics out the door in ${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`,
        `Alarms raised: ${state.alarmsRaised} · Coins left: ${state.player.coins}`,
        rating,
        "Press R to run it again",
      ],
      "#39d98a",
    );
  } else if (state.phase === "busted") {
    drawPanel(
      ctx,
      "BUSTED!",
      [
        "A guard grabbed you under the lamplight.",
        `Relics stolen: ${state.player.relics} / 3`,
        "Press R to try again",
      ],
      "#ff5a3c",
    );
  }
}

export function render(ctx, state) {
  const { level, guards, player, coins } = state;
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  drawFloor(ctx, level, state.time);
  drawPatrolPaths(ctx, guards);
  drawExit(ctx, level, player.relics >= 3, state.time);
  // Vision cones go under the cover: a case between guard and thief
  // hides the cone the way it hides the thief.
  for (const guard of guards) drawVisionCone(ctx, guard);
  drawCases(ctx, level);
  drawRelics(ctx, level, state.time);
  drawCoins(ctx, coins, state.time);
  drawWalls(ctx, level);
  for (const guard of guards) drawGuard(ctx, guard, state.time);
  if (state.phase !== "title") drawPlayer(ctx, player, state.time);
  // Night vignette.
  const v = ctx.createRadialGradient(
    WIDTH / 2, HEIGHT / 2, HEIGHT * 0.45,
    WIDTH / 2, HEIGHT / 2, HEIGHT * 0.95,
  );
  v.addColorStop(0, "rgba(4, 6, 14, 0)");
  v.addColorStop(1, "rgba(4, 6, 14, 0.5)");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  // Alarm edge pulse.
  if (state.alert > 25) {
    const pulse = 0.10 + 0.10 * Math.sin(state.time * 5);
    ctx.strokeStyle = `rgba(255, 90, 60, ${pulse + state.alert / 500})`;
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, WIDTH - 10, HEIGHT - 10);
  }
  drawHud(ctx, state);
  if (state.phase === "title") drawTitle(ctx, state);
  if (state.phase === "paused") {
    ctx.fillStyle = "rgba(6, 8, 18, 0.6)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.textAlign = "center";
    ctx.fillStyle = COLORS.text;
    ctx.font = "bold 40px Georgia, serif";
    ctx.fillText("PAUSED", WIDTH / 2, HEIGHT / 2);
    ctx.font = "16px system-ui, sans-serif";
    ctx.fillText("Press P to keep sneaking", WIDTH / 2, HEIGHT / 2 + 36);
    ctx.textAlign = "left";
  }
  if (state.phase === "win" || state.phase === "busted") drawEnd(ctx, state);
}
