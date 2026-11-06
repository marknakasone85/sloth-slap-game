// Solo difficulty check: a simple bot (never blocks or dodges) plays every map.
// Quick mode: one sloth per map (a different one each map). Full mode (run-tests.sh --full): every sloth on every map.
// The bot may use up to 5 checkpoint continues. A map counts as OK if the bot finishes it.
function runLevel(li, cid) {
  SS.Engine.setScene(new SS.CampaignScene({ charId: cid, level: li }));
  var sc = scene(), lastX = 0, stuck = 0, held = {}, deaths = 0, i;
  function set(code, on) { if (!!held[code] !== on) { key(code, on); held[code] = on; } }
  for (i = 0; i < 60 * 300 && (sc.state === 'play' || sc.state === 'dead'); i++) {
    if (sc.state === 'dead') { if (sc.menu && sc.checkpoint && deaths < 5) { deaths++; sc.respawn(); } else if (sc.menu) break; frames(1); continue; }
    var p = sc.player;
    var near = sc.targets('player').filter(function (t) {
      return t.alive && !t.done && Math.abs(t.x - p.x) < 95 && Math.abs((t.box.y + t.box.h / 2) - (p.y - p.h / 2)) < 110;
    });
    if (near.length) {
      var dir = near[0].x > p.x ? 'KeyD' : 'KeyA';
      set(dir, true); set(dir === 'KeyD' ? 'KeyA' : 'KeyD', false);
      set('KeyF', i % 12 < 2);
      set('KeyH', p.canSpecial && i % 20 === 0);
    } else {
      set('KeyA', false); set('KeyD', true); set('KeyF', false); set('KeyH', false);
      set('KeyR', i % 30 < 2 && sc.enemies.some(function (e) { return e.alive && e.x > p.x && e.x - p.x < 600 && Math.abs(e.y - p.y) < 60; }));
    }
    if (i % 60 === 0) { if (Math.abs(p.x - lastX) < 5) stuck++; lastX = p.x; }
    set('KeyW', stuck > 2 && i % 40 < 3);
    frames(1);
  }
  Object.keys(held).forEach(function (k) { if (held[k]) key(k, false); });
  frames(2);
  return { won: sc.state === 'won', deaths: deaths, secs: Math.round(i / 60) };
}
var FULL = typeof FULL_RUN !== 'undefined' && FULL_RUN;
var wins = 0, runs = 0, continues = 0;
for (var li = 0; li < SS.LEVELS.length; li++) {
  var cids = FULL ? SS.CHARACTERS.map(function (c) { return c.id; }) : [SS.CHARACTERS[li % SS.CHARACTERS.length].id];
  var mapWins = 0, mapDeaths = 0;
  cids.forEach(function (cid) { var r = runLevel(li, cid); runs++; continues += r.deaths; mapDeaths += r.deaths; if (r.won) { wins++; mapWins++; } });
  print('  map ' + (li + 1) + ' ' + SS.LEVELS[li].name + ': won ' + mapWins + '/' + cids.length + ', continues used ' + mapDeaths);
}
// the bot is dumb, so a couple of losses on boss maps are normal - fail only if it is clearly too hard
check(wins / runs >= 0.85, 'solo bot finished ' + wins + '/' + runs + ' runs using ' + continues + ' continues');
done('solo');
