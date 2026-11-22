// Screenshot staging: four frozen moments of one heist, each a real frame of
// the running game — no text screens, no title card, gameplay in every shot.
// The cover is the wide mid-heist view; the others are the near miss, the
// chase, and the escape.

export function stageShot(state, name) {
  const { player, guards, sky } = state;
  const setGuard = (i, x, y, facing, suspicion, gstate) => {
    const g = guards[i];
    g.x = x;
    g.y = y;
    g.facing = facing;
    g.suspicion = suspicion;
    g.state = gstate;
    g.pause = 0;
  };
  const face = (fx, fy, tx, ty) => Math.atan2(ty - fy, tx - fx);

  if (name === 'cover' || name === '1-start') {
    state.time = 96;
    player.x = 8.5;
    player.y = 6.5;
    player.stolen = ['scarab'];
    player.coins = 3;
    sky.time = 6.2;
    setGuard(0, 4.5, 2.5, face(4.5, 2.5, 6.5, 2.5), 12, 'patrol');
    setGuard(1, 11.5, 1.5, face(11.5, 1.5, 9.5, 2.5), 0, 'patrol');
    setGuard(2, 6.5, 4.5, face(6.5, 4.5, 8.5, 5.5), 34, 'suspicious');
    setGuard(3, 10.5, 6.5, face(10.5, 6.5, 8.5, 6.5), 0, 'patrol');
    setGuard(4, 12.5, 9.5, face(12.5, 9.5, 10.5, 9.5), 0, 'patrol');
    setGuard(5, 3.5, 8.5, face(3.5, 8.5, 3.5, 6.5), 8, 'patrol');
    setGuard(6, 7.5, 5.5, face(7.5, 5.5, 7.5, 7.5), 0, 'patrol');
    setGuard(7, 13.5, 7.5, face(13.5, 7.5, 11.5, 7.5), 0, 'patrol');
    state.message = null;
  } else if (name === 'relic' || name === '2-near-miss') {
    // The thief, crouched by the Jade Idol, as Warden Fen's cone sweeps in.
    state.time = 41;
    player.x = 3.4;
    player.y = 6.5;
    player.sneaking = true;
    player.stolen = [];
    player.coins = 3;
    sky.time = 14.8;
    setGuard(0, 5.5, 1.5, face(5.5, 1.5, 3.5, 2.5), 0, 'patrol');
    setGuard(1, 12.5, 2.5, face(12.5, 2.5, 10.5, 2.5), 0, 'patrol');
    setGuard(2, 8.5, 4.5, face(8.5, 4.5, 6.5, 5.5), 0, 'patrol');
    setGuard(3, 6.5, 7.5, face(6.5, 7.5, 4.5, 6.5), 0, 'patrol');
    setGuard(4, 11.5, 8.5, face(11.5, 8.5, 11.5, 10.5), 0, 'patrol');
    setGuard(5, 4.6, 7.8, face(4.6, 7.8, 3.4, 6.5), 28, 'suspicious');
    setGuard(6, 7.5, 6.5, face(7.5, 6.5, 7.5, 4.5), 0, 'patrol');
    setGuard(7, 13.5, 6.5, face(13.5, 6.5, 13.5, 8.5), 0, 'patrol');
    state.message = null;
    state.nearRelic = { id: 'idol', name: 'JADE IDOL', color: '#3ddc84' };
  } else if (name === 'spotted' || name === '3-chase') {
    // Spotted: Warden Corvin is on the thief, cones red, alarm up.
    state.time = 133;
    player.x = 6.5;
    player.y = 5.5;
    player.stolen = ['scarab', 'idol'];
    player.coins = 2;
    sky.time = 21.4;
    setGuard(0, 5.2, 4.6, face(5.2, 4.6, 6.5, 5.5), 100, 'chase');
    setGuard(1, 10.5, 2.5, face(10.5, 2.5, 8.5, 3.5), 61, 'suspicious');
    setGuard(2, 9.5, 4.5, face(9.5, 4.5, 6.5, 5.5), 74, 'suspicious');
    setGuard(3, 11.5, 6.5, face(11.5, 6.5, 9.5, 6.5), 0, 'patrol');
    setGuard(4, 12.5, 8.5, face(12.5, 8.5, 12.5, 10.5), 0, 'patrol');
    setGuard(5, 2.5, 8.5, face(2.5, 8.5, 4.5, 8.5), 0, 'patrol');
    setGuard(6, 7.5, 7.5, face(7.5, 7.5, 6.5, 5.5), 40, 'suspicious');
    setGuard(7, 13.5, 5.5, face(13.5, 5.5, 11.5, 5.5), 0, 'patrol');
    state.message = 'SPOTTED BY WARDEN CORVIN — BREAK LINE OF SIGHT!';
  } else if (name === 'escape' || name === '4-escape') {
    // All three relics in the bag, one dash to the green EXIT.
    state.time = 187;
    player.x = 13.2;
    player.y = 6.2;
    player.stolen = ['scarab', 'idol', 'crown'];
    player.coins = 1;
    sky.time = 3.1;
    setGuard(0, 3.5, 2.5, face(3.5, 2.5, 5.5, 2.5), 0, 'patrol');
    setGuard(1, 11.5, 1.5, face(11.5, 1.5, 13.5, 2.5), 18, 'patrol');
    setGuard(2, 8.5, 4.5, face(8.5, 4.5, 10.5, 5.5), 5, 'patrol');
    setGuard(3, 9.5, 7.5, face(9.5, 7.5, 11.5, 7.5), 0, 'patrol');
    setGuard(4, 12.5, 9.5, face(12.5, 9.5, 10.5, 9.5), 0, 'patrol');
    setGuard(5, 3.5, 9.5, face(3.5, 9.5, 3.5, 7.5), 0, 'patrol');
    setGuard(6, 7.5, 4.5, face(7.5, 4.5, 7.5, 6.5), 0, 'patrol');
    setGuard(7, 13.5, 8.5, face(13.5, 8.5, 13.5, 6.5), 22, 'patrol');
    state.message = null;
  }
  state.frozen = true;
  state.phase = 'playing';
}
