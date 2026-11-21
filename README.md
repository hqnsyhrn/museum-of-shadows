# Museum of Shadows

[![make.fun](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/hqnsyhrn/museum-of-shadows/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/hqnsyhrn/museum-of-shadows/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)

A night-museum stealth heist for the [best stealth game bounty](https://make.fun/bounty/best-stealth-game-20261121-1759) on make.fun. Slip through the dark galleries after closing time, lift the three relics — the Golden Mask, the Jade Idol and the Star Sapphire — and reach the green exit door without ever being seen.

## How to play

Open `game/index.html` in a desktop browser (or serve `game/` with any static server). No network needed — everything is local.

- **Move:** WASD or arrow keys. **Sneak:** hold Shift (slower, much harder to spot).
- **Steal:** stand beside a glowing relic pedestal and hold **E** until the lift finishes.
- **Distract:** press **C** or click the floor to toss a coin — nearby guards walk over to investigate the clink.
- **Win:** steal all three relics, then reach the glowing green exit.
- **Lose:** a guard who fully spots you gives chase. If he catches you, the heist is over.

## The stealth

Eight guards patrol fixed routes through the galleries, each sweeping a bright vision cone across the marble floor. Walls and display pedestals block their sight — crouch behind cover, watch the cones, and move when a guard turns away. The suspicion meter fills while you are inside a cone in plain sight (faster up close, slower while sneaking) and drains when you break line of sight. At full suspicion a guard shouts, his cone turns red, and he runs you down.

## The look

The museum is rendered with a hand-written 3D projection: an angled camera, solid extruded geometry with real height — walls, pedestals, columns and the thief and guards themselves — directional face shading, floor shadows, warm lamp pools and a night vignette. No 3D library, no network assets; the projection, shading and lighting code is all in `game/src/projection.js` and `game/src/render.js`.

## Layout

- `main.ts` — the make.fun hand-in program: copies `game/` and `screenshots/` to the output directory and writes `dossier.json`.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.
- `game/index.html` — the game page (canvas + HUD).
- `game/src/config.js` — tuning, colours and the museum map.
- `game/src/projection.js` — the angled 3D camera, box drawing and shading.
- `game/src/level.js` — the museum grid: walls, cover, relics, exit, lamps.
- `game/src/guards.js` — guard patrols, vision cones, suspicion and chase AI.
- `game/src/player.js` — the thief: movement, collision, coin throws, stealing.
- `game/src/render.js` — draws the whole museum, figures, cones and night light.
- `game/src/audio.js` — small WebAudio blips (coin, alert, lift, win).
- `game/src/shots.js` — fixed demo states for the screenshots.
- `game/src/main.js` — game loop, input, states and HUD.
- `screenshots/` — four real renders of this game running in a browser.
