[![make.fun](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/hqnsyhrn/museum-of-shadows/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/hqnsyhrn/museum-of-shadows/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)

# Museum of Shadows

A top-down stealth game for the [make.fun bounty "Make the best stealth game"](https://make.fun/bounty/best-stealth-game-20261121-1759). One night in a museum, three relics behind glass, eight guards on patrol — steal them all and reach the EXIT unseen.

## How to play

Open `game/index.html` in a desktop browser (or serve `game/` with any static server). No network, no build step, no install.

- **WASD / arrows** — move
- **SHIFT** — sneak: slow and quiet, much harder to spot
- **CLICK** — throw a coin; the clink pulls nearby guards toward it
- **R** — restart · **M** — mute

## The rules of the night

- **Vision cones** — gold when calm, amber when wary, red when hunting. A cone only sees you if you are inside it *and* no case or wall stands between you.
- **Light is danger** — lamplight fills a guard's suspicion meter fast; the dark floor between the pools barely fills it at all.
- **Suspicion is a meter, not a switch** — being glimpsed fills it, hiding drains it. Only a full meter turns a guard into a hunter, and a hunter who loses you searches your last seen spot, then calms down and returns to patrol. You can recover from almost being caught.
- **Running is loud** — your footsteps carry, and guards come to look. Sneak past, or spend a coin to send them the other way.
- **Patrols can be learned** — all eight guards walk fixed loops, drawn as dotted lines on the floor. Watch, wait, slip through the gaps.

Steal the Jade Scarab, the Moon Pearl and the Golden Ibis, then slip out the south door. Escape without ever being spotted for the perfect run.

## Sound

All sound is synthesized live with WebAudio — footsteps, coin clinks, relic chimes, the alarm sting. A guard's tread grows louder as he nears you: listen for it.

## Structure

- `main.ts` — the make.fun entrypoint: copies `game/` and `screenshots/` to the output dir and writes `dossier.json`
- `game/index.html` + `game/style.css` — the page and the HUD
- `game/src/main.js` — bootstrap, game loop, input, win/lose
- `game/src/level.js` — the museum: walls, cover, lamps, relics, exit, patrol routes
- `game/src/guards.js` — patrols, vision cones, suspicion, pursuit
- `game/src/player.js` — the thief: movement, sneak, noise, the thrown coin
- `game/src/render.js` — all canvas drawing
- `game/src/audio.js` — synthesized sound
- `game/src/ui.js` — HUD, suspicion meter, overlays
- `vendor/makefun-game.ts` — the kit's dossier library, copied unchanged

## Run the entrypoint

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

This writes `out/game/`, `out/screenshots/` and `out/dossier.json`. Run it twice: the bytes are identical.

## License

MIT. See [LICENSE](LICENSE).
