// Museum of Shadows — configuration: the hall, its relics, its wardens.
// One night museum, one heist: steal three relics and reach the green EXIT unseen.

export const TILE_W = 84;
export const TILE_H = 42;
export const VIEW_W = 1280;
export const VIEW_H = 720;

// The hall, 16 wide by 12 deep. '#' wall, '.' marble floor, 'P' display
// pedestal, 'C' column, 'R1'..'R3' relic pedestals, 'E' exit door, 'S' start.
export const MAP = [
  '################',
  '#......#.......#',
  '#......#.R1....#',
  '#......#.......#',
  '#..C.....C.....#',
  '#......P......E',
  '#.R2....P..P..#',
  '#......C.......#',
  '#.P.....#......#',
  '#......#.R3....#',
  '#.S....#...C...#',
  '################',
];

export const MAP_W = 16;
export const MAP_H = 12;

// The three relics: three different objects, three glows, three names.
export const RELICS = [
  { id: 'scarab', key: 'R1', name: 'GOLDEN SCARAB', color: '#ffc93c', glow: 'rgba(255,201,60,0.55)', tile: [9, 2] },
  { id: 'idol', key: 'R2', name: 'JADE IDOL', color: '#3ddc84', glow: 'rgba(61,220,132,0.55)', tile: [2, 6] },
  { id: 'crown', key: 'R3', name: 'CRIMSON CROWN', color: '#ff4d5e', glow: 'rgba(255,77,94,0.55)', tile: [9, 9] },
];

// Eight wardens, each with a name and a patrol route through the hall.
export const GUARDS = [
  { name: 'WARDEN CORVIN', route: [[2, 1], [6, 1], [6, 3], [2, 3]], speed: 1.5 },
  { name: 'WARDEN MIRELLE', route: [[9, 1], [13, 1], [13, 3], [9, 3]], speed: 1.4 },
  { name: 'WARDEN ODO', route: [[4, 4], [12, 4], [12, 5], [4, 5]], speed: 1.6 },
  { name: 'WARDEN SABLE', route: [[4, 6], [12, 7], [4, 7]], speed: 1.5 },
  { name: 'WARDEN FEN', route: [[9, 8], [13, 8], [13, 10], [9, 10]], speed: 1.4 },
  { name: 'WARDEN ILYA', route: [[2, 8], [5, 8], [5, 9], [2, 9]], speed: 1.5 },
  { name: 'WARDEN BRAM', route: [[7, 4], [7, 7]], speed: 1.7 },
  { name: 'WARDEN NOX', route: [[13, 5], [13, 9], [9, 9]], speed: 1.6 },
];

export const PLAYER_START = [2, 10];
export const EXIT_TILE = [14, 5];
export const COIN_COUNT = 3;
export const GUARD_COUNT = 8;
export const RELIC_COUNT = 3;

// The Sweeping Skylight: one great beam from the glass roof, circling the hall.
// Stand in it and every warden sees you far more easily.
export const SKYLIGHT = {
  center: [8, 5.5],
  radiusX: 5.2,
  radiusY: 2.6,
  poolRadius: 2.3,
  periodSec: 26,
};

// Warm wall lamps along the hall: small pools of light, same rule as the beam.
export const LAMPS = [[4, 1], [8, 1], [12, 1], [1, 5], [14, 8]];

export const COLORS = {
  floorA: '#b98a5a',
  floorB: '#a1764a',
  carpet: '#7e2f35',
  carpetEdge: '#d8a24a',
  wallNorth: '#8a5a3b',
  wallWest: '#6e4630',
  wallTrim: '#d8a24a',
  frameGold: '#e8b64c',
  pedestal: '#5d4030',
  pedestalTop: '#7a5238',
  column: '#c9b18a',
  exit: '#2fd47a',
  player: '#2b2f4a',
  guard: '#1d2f57',
  guardTrim: '#e8b64c',
  cone: 'rgba(255,205,80,0.44)',
  coneAlert: 'rgba(255,64,54,0.52)',
  hudBg: 'rgba(12,10,16,0.82)',
  hudGold: '#e8b64c',
  hudText: '#f3ead8',
  hudDim: '#b9a98c',
};
