[![Make.fun](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![Rank](https://make.fun/badge/best-stealth-game-20261121-1759/hqnsyhrn/museum-of-shadows/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![Reward](https://make.fun/badge/best-stealth-game-20261121-1759/hqnsyhrn/museum-of-shadows/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)

# Museum of Shadows — 3 relics, 8 guards, coin toss & the Sweeping Skylight

A night-museum stealth heist in true 3D isometric. One thief, one hall, one
job: steal the **Golden Scarab**, the **Jade Idol** and the **Crimson Crown**,
then reach the green EXIT unseen.

- **8 named wardens** patrol the hall — Corvin, Mirelle, Odo, Sable, Fen,
  Ilya, Bram and Nox — each with vision cones, a suspicion meter, a chase,
  and a search when they lose you. A near miss raises the alarm; a clean
  break lets it cool down.
- **The Sweeping Skylight** — the signature mechanic. A great beam from the
  glass roof circles the hall on a slow, learnable sweep. Stand in its pool
  of light and every warden spots you twice as fast; wait in shadow and you
  are hard to see. The sweep is the clock the heist runs on.
- **Coin toss distraction** — three coins. Throw one and every warden in
  earshot leaves their patrol to look at where it landed.
- **Sneak** — hold Shift to move slow and near-silent, and far harder to spot.
- **The museum itself** — gold-framed paintings, velvet rope barriers, brass
  plaques, wall lamps, a CLOSED banner, and a red carpet down the middle of
  the marble hall. Cover is real: pedestals, columns and walls block a
  warden's line of sight.

## Play

Open `game/index.html` in desktop Chrome (or `node serve.ts`, then
http://localhost:8080). No build step, no network — every file the game loads
sits under `game/`.

| Key | Action |
| --- | --- |
| WASD / arrows | Move |
| Shift | Sneak (slow, quiet, hard to see) |
| Space / click | Throw a coin |
| E | Steal a relic up close |
| R | Restart |

Steal all three relics, then reach the green EXIT. If a warden catches you,
the heist is over.

## Files

- `game/src/config.js` — the hall, the relics, the wardens, the skylight
- `game/src/projection.js` — isometric projection, tile to screen
- `game/src/level.js` — the map, solid ground, line of sight
- `game/src/skylight.js` — the sweeping beam and what it lights
- `game/src/guards.js` — patrols, vision cones, suspicion, chase, search
- `game/src/player.js` — the thief: move, sneak, coin, steal, exit
- `game/src/audio.js` — footsteps, coins and alarms, synthesized live
- `game/src/render.js` — the museum, the HUD rail, the banners
- `game/src/shots.js` — the four staged screenshot moments
- `game/src/main.js` — the game loop and input

## Hand in

`main.ts` (Node 22) copies `game/` and `screenshots/` to `/output` and writes
`/output/dossier.json` with the vendored make.fun library:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Built for the [make.fun best stealth game bounty](https://make.fun/bounty/best-stealth-game-20261121-1759).
