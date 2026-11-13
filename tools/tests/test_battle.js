// Slapdown Duel: classic 1v1 and Wi-Fi battles (2-4 sloths), with the guest view drawing every snapshot.
var seq = 0;
function botInput(d, slot, bot) {
  var c = bot.control(slot.f, d.opponentOf(slot.f), 1 / 60);
  var p = ['jumpP', 'slapP', 'heavyP', 'specialP', 'shootP'].filter(function (k) { return c[k]; });
  d.onNet({ t: 'in', n: ++seq, l: c.left ? 1 : 0, r: c.right ? 1 : 0, d: c.down ? 1 : 0, p: p }, slot.id);
}
function runBattle(players, hook) {
  SS.Engine.setScene(new SS.DuelScene({ net: true, theme: 'castle', stageIndex: 9, players: players }));
  var d = scene(), guest = new SS.RemoteDuelScene(); SS.Net.id = 1;
  var bots = {}; players.forEach(function (p) { if (p.cpu === undefined) bots[p.id] = new SS.CPU(2); });
  var err = null, i, fin = { host: 0, slow: false, guest: false, snaps: 0 };
  // the guest gets exactly the snapshots the host sends (with their effects and sounds)
  var sent = [], send = SS.Net.send;
  SS.Net.send = function (m) { if (m && m.t === 'snap') sent.push(JSON.stringify(m)); return send.apply(SS.Net, arguments); };
  for (i = 0; i < 60 * 60 * 8 && d.state !== 'matchEnd'; i++) {
    d.slots.forEach(function (s) { if (bots[s.id]) botInput(d, s, bots[s.id]); });
    if (hook) hook(d, i);
    var had = !!d.fx.fin;
    frames(1);
    if (d.fx.fin && !had) fin.host++;
    if (SS.Engine.slowT > 0) fin.slow = true;
    while (sent.length) {
      fin.snaps++;
      try { guest.onNet(JSON.parse(sent.shift())); guest.update(1 / 30); guest.draw(SS.Engine.ctx); }
      catch (e) { if (!err) err = '' + e; }
      if (guest.fx.fin) fin.guest = true;
    }
  }
  SS.Net.send = send;
  return { d: d, err: err, fin: fin };
}
var r = runBattle([{ id: 0, cid: 'sir', local: null }, { id: 1, cid: 'sue', local: null }, { id: 10, cid: 'chonk', cpu: 2 }, { id: 11, cid: 'dj', cpu: 1 }]);
check(r.d.state === 'matchEnd' && !!r.d.matchWinner, '4-sloth free-for-all plays to a winner (' + (r.d.matchWinner ? r.d.matchTitle() : '-') + ')');
check(!r.err, 'guest battle view draws every snapshot' + (r.err ? ': ' + r.err : ''));
check(r.fin.host >= 1 && r.fin.slow && r.fin.guest, 'knockout finisher: slow motion + zoom on the host, replayed for the guest (' + r.fin.host + ' finishers in ' + r.d.round + ' rounds)');
check(SS.Engine.slowT <= 0 && Math.abs(SS.Engine.unscaled(1 / 60) - 1 / 60) < 1e-9, 'slow motion is over by the end of the match');
SS.Engine.slowmo(1, 0.25);
check(Math.abs(SS.Engine.unscaled(0.25 / 60) - 1 / 60) < 1e-9, 'Wi-Fi snapshots keep real time during slow motion');
SS.Engine.setScene(new SS.CampaignScene({ charId: 'sir', level: 3 })); var bc = scene(); frames(5);
bc.boss.hp = 0; bc.boss.alive = false; bc.onEnemyKilled(bc.boss); frames(20);
check(!!bc.fx.fin && bc.fx.fin.big && SS.Engine.slowT > 0, 'beating a boss plays the big slow-motion finisher');
frames(150);
check(!bc.fx.fin && SS.Engine.slowT <= 0, 'the boss finisher ends by itself');
// a boss charging past a sloth at the arena's left wall used to run off-screen and get stuck there for good
var escaped = [];
SS.LEVELS.forEach(function (L, lv) {
  if (!L.boss || SS.ENEMY_TYPES[L.boss.type].behavior !== 'boss') return;
  SS.Engine.setScene(new SS.CampaignScene({ charId: 'sir', level: lv })); var c = scene(); frames(2);
  c.gates.forEach(function (g) { g.opened = true; g.lift = 1; });
  c.player.x = c.arenaX + 160; frames(30);
  var b = c.boss; c.player.invuln = 99;
  b.x = c.arenaX + 120; b.hurt = 0; b.cool = 99; b.state = 'charge'; b.stateT = 0; b.chargeDir = -1;
  for (var i = 0; i < 150; i++) { c.player.x = c.arenaX + 10; frames(1); }
  if (!c.bossAwake || b.x - b.d.w / 2 < c.camX - 2) escaped.push(L.name);
});
check(!escaped.length, 'a charging boss stays inside its arena on every boss map' + (escaped.length ? ': escaped on ' + escaped.join(', ') : ''));
r = runBattle([{ id: 0, cid: 'sarge', local: null }, { id: 1, cid: 'wizzy', local: null }, { id: 10, cid: 'clawbeard', cpu: 2 }, { id: 11, cid: 'flo', cpu: 2 }]);
check(r.d.state === 'matchEnd' && !r.err, 'battle with the 4 newest sloths (bombs, homing missiles, cannon, freeze)');
var leftOk = false;
r = runBattle([{ id: 0, cid: 'queen', local: null }, { id: 1, cid: 'sue', local: null }, { id: 2, cid: 'dj', local: null }], function (d, i) {
  if (i === 600) { d.onNet({ t: 'left', id: 2 }, 'server'); leftOk = d.slots.length === 2; }
});
check(leftOk && r.d.state === 'matchEnd', 'a player leaving mid-battle: sloth removed, battle continues');
var joinedNext = false;
r = runBattle([{ id: 0, cid: 'sir', local: null }, { id: 1, cid: 'chonk', local: null }], function (d, i) {
  if (i === 120) d.onNet({ t: 'pick', cid: 'queen', ready: true }, 2);
  if (d.round === 2 && d.slots.length === 3) joinedNext = true;
});
check(joinedNext, 'a late joiner jumps in at the next round');
SS.Net.role = 'host'; SS.Net.status = 'connected'; scene().backToLobby(); frames(3);
check(scene() instanceof SS.LobbyScene && scene().players.length === 3, 'Back to Lobby keeps the players');
SS.Net.role = null; SS.Net.status = 'off';
SS.Engine.setScene(new SS.DuelScene({ p1: 'sir', p2: 'chonk', vsCpu: true, cpuLevel: 2, theme: 'space', gravity: 0.55 }));
var dl = scene(), bot = new SS.CPU(2), orig = SS.readControls;
SS.readControls = function () { return bot.control(dl.f1, dl.f2, 1 / 60); };
var k = 0; while (dl.state !== 'matchEnd' && k < 60 * 60 * 6) { frames(1); k++; }
SS.readControls = orig;
check(dl.state === 'matchEnd' && dl.slots.map(function (s) { return dl.tagOf(s); }).join('/') === 'YOU/CPU', 'classic 1v1 vs CPU (low-gravity space stage)');
done('battle');
