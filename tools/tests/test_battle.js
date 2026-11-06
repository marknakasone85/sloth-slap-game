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
  var err = null, i;
  for (i = 0; i < 60 * 60 * 8 && d.state !== 'matchEnd'; i++) {
    d.slots.forEach(function (s) { if (bots[s.id]) botInput(d, s, bots[s.id]); });
    if (hook) hook(d, i);
    frames(1);
    if (i % 2 === 0) {
      try { guest.onNet(JSON.parse(JSON.stringify(SS.Sync.duelSnapshot(d)))); guest.update(1 / 30); guest.draw(SS.Engine.ctx); }
      catch (e) { if (!err) err = '' + e; }
    }
  }
  return { d: d, err: err };
}
var r = runBattle([{ id: 0, cid: 'sir', local: null }, { id: 1, cid: 'sue', local: null }, { id: 10, cid: 'chonk', cpu: 2 }, { id: 11, cid: 'dj', cpu: 1 }]);
check(r.d.state === 'matchEnd' && !!r.d.matchWinner, '4-sloth free-for-all plays to a winner (' + (r.d.matchWinner ? r.d.matchTitle() : '-') + ')');
check(!r.err, 'guest battle view draws every snapshot' + (r.err ? ': ' + r.err : ''));
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
