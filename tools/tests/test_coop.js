// Wi-Fi co-op campaign: 3 sloths on every map, driven through the same "button press"
// messages Wi-Fi players send. Every snapshot goes through JSON into a guest view that draws it.
function runCoop(li) {
  var cids = ['sir', 'chonk', 'flo'];
  SS.Engine.setScene(new SS.CampaignScene({ level: li, net: true, players: cids.map(function (c, i) { return { id: i, cid: c, local: null }; }) }));
  var sc = scene(), guest = new SS.RemoteScene({ level: li });
  SS.Net.id = 1; guest.enter(); SS.Net.onMessage = null;
  var seq = 0, err = null, maxBytes = 0, i;
  for (i = 0; i < 60 * 300 && sc.state !== 'won'; i++) {
    if (sc.state === 'dead') { if (sc.menu && sc.checkpoint) sc.respawn(); else if (sc.menu) break; }
    sc.slots.forEach(function (sl, k) {
      var f = sl.f;
      var near = sc.targets('player').filter(function (t) { return t.alive && !t.done && Math.abs(t.x - f.x) < 95 && Math.abs((t.box.y + t.box.h / 2) - (f.y - f.h / 2)) < 110; });
      var right = near.length ? near[0].x > f.x : true;
      var p = [];
      if (near.length && (i + k * 4) % 12 === 0) p.push('slapP');
      if (!near.length && (i + k * 7) % 30 === 0) p.push('shootP');
      if (f.canSpecial && near.length) p.push('specialP');
      if ((i + k * 13) % 90 === 0) p.push('jumpP');
      sc.netInput(sl.id, { n: ++seq, l: right ? 0 : 1, r: right ? 1 : 0, d: 0, p: p });
    });
    frames(1);
    if (i % 2 === 0) {
      var txt = JSON.stringify(SS.Sync.snapshot(sc));
      maxBytes = Math.max(maxBytes, txt.length);
      try { guest.onNet(JSON.parse(txt)); guest.update(1 / 30); guest.draw(SS.Engine.ctx); } catch (e) { if (!err) err = '' + e; }
    }
  }
  check(sc.state === 'won' && !err, 'map ' + (li + 1) + ' ' + SS.LEVELS[li].name + ': 3-player co-op won in ' + Math.round(i / 60) +
    's, guest view OK, biggest update ' + (maxBytes / 1024).toFixed(1) + ' KB' + (err ? ' ERROR: ' + err : ''));
}
for (var li = 0; li < SS.LEVELS.length; li++) runCoop(li);
done('co-op');
