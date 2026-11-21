# Museum of Shadows

[![make.fun](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/hqnsyhrn/museum-of-shadows/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/hqnsyhrn/museum-of-shadows/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)

A night-museum stealth heist for the [make.fun bounty "Make the best stealth game"](https://make.fun/bounty/best-stealth-game-20261121-1759) — $50, top 10 paid.

You are the thief. Slip into the museum after dark, lift all 3 relics — the Golden Scarab, the Jade Mask, the Star Sapphire — and reach the green EXIT unseen. Eight guards walk fixed patrols with vision cones; display cases block their sight, so cover is real. Get spotted and suspicion climbs: a guard who grows suspicious comes to look, and a guard who is sure raises the alarm and gives chase. Throw a coin to pull a guard away from your path. Get grabbed and the run is over.

## Play

Open `game/index.html` from any static server — no build step, no network requests, everything is drawn on canvas with plain JavaScript:

```sh
python3 -m http.server 8080 --directory game
# then open http://localhost:8080
```

| Key | Action |
| --- | --- |
| WASD / arrows | Move |
| SHIFT | Sneak (slower, harder to spot) |
| E (hold) | Lift a relic off its pedestal |
| SPACE or CLICK | Throw a coin to distract a guard |
| P | Pause |
| R | Retry after being busted or escaping |

The exit stays locked until all 3 relics are stolen. Finish with zero alarms raised for a GHOST rating.

## How it is built

- `game/index.html` + `game/style.css` — the page and its chrome.
- `game/src/config.js` — every tuning number in one place.
- `game/src/level.js` — the museum map, relics, cases, exit, guard routes.
- `game/src/guards.js` — patrol AI, vision cones, line of sight, suspicion, alarm, investigation.
- `game/src/player.js` — movement, collision, sneaking, coin throws, stealing.
- `game/src/render.js` — all canvas drawing: floor, cones, cover, HUD, title and end screens.
- `game/src/audio.js` — small synthesised sounds (WebAudio, no files).
- `game/src/shots.js` — the four staged moments under `screenshots/`.
- `game/src/main.js` — the loop, input, and state machine.
- `main.ts` — the hand-in program (Node 22, standard library only): copies `game/` and `screenshots/` to the output directory and writes `dossier.json` with `buildDossier` from `vendor/makefun-game.ts` (the kit's copy, unchanged).

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Screenshots are real renders of the game's own code in a desktop browser: the title over a living museum, a near-miss behind a display case, a full alarm chase, and the clean getaway.

## License

MIT. See [LICENSE](LICENSE).
