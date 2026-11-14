// Grenades (G), the big slap on K, weapon boxes (shotgun / rocket launcher / machine gun),
// boss bumps instead of pinning, and a boss on every map.
function camp(level, cid) {
  SS.Engine.setScene(new SS.CampaignScene({ charId: cid || 'sir', level: level || 0 }));
  var sc = scene(); sc.t = 3; frames(3);
  sc.enemies = sc.enemies.filter(function (e) { return e === sc.boss; }); // quiet map for the checks
  sc.pickups = [];
  sc.player.invuln = 999;
  return sc;
}
function beetlesAround(sc, xs) {
  return xs.map(function (x) { var e = sc.tagEnemy(new SS.Enemy('beetle', x)); sc.enemies.push(e); return e; });
}
function hurt(list) { return list.filter(function (e) { return e.hp < e.maxHp || !e.alive; }).length; }

// ---- keys ----
var sc = camp();
tap('KeyK'); frames(1);
check(sc.player.move && sc.player.move.kind === 'heavy', 'K does the big slap');
frames(40);
var g0 = sc.player.grenades;
tap('KeyG'); frames(1);
check(g0 === 3 && sc.player.move && sc.player.move.kind === 'grenade' && sc.player.grenades === 2, 'G throws a grenade (start with 3)');
frames(60);
tap('Quote'); frames(1);
check(sc.player.grenades === 1, "solo also throws with ' (the arrow-keys side)");
frames(60);

// ---- grenade: arcs out and blasts everyone nearby ----
sc = camp();
var p = sc.player, bs = beetlesAround(sc, [p.x + 380, p.x + 420, p.x + 470]);
bs.forEach(function (e) { e.cool = 99; e.d = Object.assign({}, e.d, { speed: 0 }); });
tap('KeyG'); frames(90);
check(hurt(bs) >= 2, 'a grenade lands about 400px away and blasts ' + hurt(bs) + '/3 beetles');
check(!sc.projectiles.some(function (pr) { return pr.kind === 'grenade'; }), 'the grenade is gone after it goes off');
sc.player.grenades = 0;
tap('KeyG'); frames(2);
check(sc.player.grenades === 0 && (!sc.player.move || sc.player.move.kind !== 'grenade'), 'no grenades left: nothing thrown');

// ---- grenade pickups: +2, never more than 10 ----
sc = camp(); p = sc.player;
sc.addPickup('grenade', p.x, sc.groundY - 6); frames(2);
check(p.grenades === 5, 'a grenade pickup gives +2 (3 -> 5)');
p.grenades = 10; sc.addPickup('grenade', p.x, sc.groundY - 6); frames(2);
check(p.grenades === SS.MAX_GRENADES && sc.pickups.some(function (k) { return k.type === 'grenade'; }), 'pouch full at 10: the pickup stays on the ground');
p.grenades = 9; frames(2);
check(p.grenades === 10 && !sc.pickups.some(function (k) { return k.type === 'grenade'; }), 'room for one more: tops up to 10');

// ---- weapon boxes ----
sc = camp(); p = sc.player;
check(p.weapon === 'pistol', 'every sloth starts with the pistol');
var got = {};
for (var i = 0; i < 40; i++) { p.weapon = 'pistol'; sc.addPickup('weapon', p.x, sc.groundY - 6); frames(1); got[p.weapon] = true; }
check(got.shotgun && got.rocket && got.lmg, '"?" weapon boxes give a shotgun, rocket launcher or machine gun');

// keep your big gun: more "?" boxes and ammo boxes just add ammo (no limit)
sc = camp(); p = sc.player; p.giveWeapon('shotgun'); p.wAmmo = 3;
sc.addPickup('weapon', p.x, sc.groundY - 6); frames(2);
check(p.weapon === 'shotgun' && p.wAmmo === 3 + 8, '"?" box with a shotgun in hand: keep it, +8 shells (3 -> 11)');
sc.addPickup('weapon', p.x, sc.groundY - 6); frames(2);
check(p.weapon === 'shotgun' && p.wAmmo === 19, 'and again: no limit (19)');
p.giveWeapon('rocket'); p.wAmmo = 1; p.ammo = 0;
sc.addPickup('ammo', p.x, sc.groundY - 6); frames(2);
check(p.weapon === 'rocket' && p.wAmmo === 3 && p.ammo === p.maxAmmo, 'ammo box: +half a load for the big gun (rockets 1 -> 3) and a full pistol');
p.giveWeapon('lmg'); p.wAmmo = 5;
sc.addPickup('ammo', p.x, sc.groundY - 6); frames(2);
check(p.wAmmo === 35, 'ammo box: machine gun +30 (5 -> 35)');
p.weapon = 'pistol'; p.wAmmo = 0;
sc.addPickup('ammo', p.x, sc.groundY - 6); frames(2);
check(p.weapon === 'pistol' && p.wAmmo === 0, 'ammo box with only the pistol: just refills the pistol');
sc.addPickup('weapon', p.x, sc.groundY - 6); frames(2);
check(p.weapon !== 'pistol' && p.wAmmo === SS.WEAPONS[p.weapon].ammo, 'gun ran dry, back on the pistol: the next "?" box gives a new big gun (' + p.weapon + ')');

sc = camp(); p = sc.player; p.giveWeapon('shotgun');
tap('KeyR'); frames(2);
var pellets = sc.projectiles.filter(function (pr) { return pr.kind === 'pellet'; }).length;
check(pellets === 5 && p.wAmmo === SS.WEAPONS.shotgun.ammo - 1, 'shotgun: 5 pellets per shot, uses 1 shell');

sc = camp(); p = sc.player; bs = beetlesAround(sc, [p.x + 300, p.x + 330]);
bs.forEach(function (e) { e.cool = 99; e.d = Object.assign({}, e.d, { speed: 0 }); });
p.giveWeapon('rocket'); tap('KeyR'); frames(60);
check(hurt(bs) === 2 && p.wAmmo === SS.WEAPONS.rocket.ammo - 1, 'rocket launcher: one rocket blasts both beetles');

sc = camp(); p = sc.player; p.giveWeapon('lmg');
key('KeyR', true); frames(60); key('KeyR', false); frames(2);
var fired = SS.WEAPONS.lmg.ammo - p.wAmmo;
check(fired >= 9, 'machine gun: holding Shoot keeps firing (' + fired + ' shots in 1 second)');
p.wAmmo = 1; frames(30); tap('KeyR'); frames(20);
check(p.weapon === 'pistol', 'big gun out of ammo: back to the pistol');

// ---- boss bumps you clear instead of pinning you ----
function bossFight(level, block) {
  var c = camp(level); c.player.invuln = 0;
  c.gates.forEach(function (g) { g.opened = true; g.lift = 1; });
  c.player.x = c.arenaX + 160; frames(30);
  c.player.x = c.arenaX + 30; c.player.facing = 1; c.player.hp = c.player.maxHp = 9999;
  var b = c.boss; b.x = c.arenaX + 260; b.state = 'idle'; b.cool = 0.3; b.hurt = 0;
  b.d = Object.assign({}, b.d, { moves: ['charge'] });
  var hits = 0, overlapFrames = 0, hp = c.player.hp, worst = 0;
  for (var k = 0; k < 60 * 8; k++) {
    if (block) { key('KeyS', true); }
    frames(1);
    if (c.player.hp < hp - 0.01) { hits++; worst = Math.max(worst, hp - c.player.hp); }
    hp = c.player.hp;
    if (SS.U.overlap(b.box, c.player.box)) overlapFrames++;
  }
  if (block) key('KeyS', false);
  frames(2);
  return { hits: hits, overlap: overlapFrames / (60 * 8), worst: worst, boss: b };
}
var r = bossFight(3, false);
check(r.overlap < 0.25, 'Volcano boss vs a sloth at the arena wall: bumped clear, inside the boss only ' + Math.round(r.overlap * 100) + '% of the time');
r = bossFight(3, true);
check(r.worst < 3, 'blocking works against a boss bump (worst hit ' + r.worst.toFixed(1) + ' HP)');
// blocking a boss still works when it has walked past your guard (behind you)
sc = camp(3); p = sc.player; p.invuln = 0;
var boss = sc.boss; boss.x = p.x - 10; p.facing = 1; p.state = 'block';
var hp0 = p.hp;
var res = p.takeHit({ dmg: 14, kbx: -400, kby: -300, stun: 0.4, from: boss }, sc);
check(res === 'blocked' && hp0 - p.hp < 3, 'a boss hit from behind is blocked too');

// ---- every map ends with a boss ----
var bad = [];
SS.LEVELS.forEach(function (L, i) {
  if (!L.boss) { bad.push((i + 1) + ' no boss'); return; }
  if (L.length < L.boss.x + 500) bad.push((i + 1) + ' arena too short');
  var lastGate = Math.max.apply(null, (L.gates || []).map(function (g) { return g.x; }).concat([0]));
  if (L.boss.x - 380 <= lastGate) bad.push((i + 1) + ' arena before the last gate');
  if (!SS.ENEMY_TYPES[L.boss.type]) bad.push((i + 1) + ' unknown boss');
});
var names = SS.LEVELS.map(function (L) { return L.boss && SS.ENEMY_TYPES[L.boss.type].name; });
check(!bad.length, 'every map has a boss with a proper arena' + (bad.length ? ': ' + bad.join(', ') : ''));
check(names.filter(function (n, i) { return names.indexOf(n) === i; }).length === SS.LEVELS.length, 'every boss is different (' + names.length + ' bosses)');
var newBosses = ['bigBeetle', 'greedyGull', 'scorpionQueen', 'bigCheese', 'blobzilla'], drawErr = null;
newBosses.forEach(function (t) {
  try { new SS.Enemy(t, 500).draw(SS.Engine.ctx, { groundY: SS.GROUND_Y }); } catch (e) { drawErr = t + ': ' + e; }
});
check(!drawErr, 'the 5 new bosses draw' + (drawErr ? ' (' + drawErr + ')' : ''));

// ---- controls are shown everywhere ----
var seen = [], origText = SS.UI.text;
SS.UI.text = function (ctx, str) { seen.push(String(str)); return origText.apply(SS.UI, arguments); };
['wasd', 'arrows', 'pad', 'p1', 'p2'].forEach(function (l) { SS.UI.keyStrip(SS.Engine.ctx, sc.player, 0, { layout: l }); });
var strip = seen.join('|');
SS.UI.controlsPanel(SS.Engine.ctx);
var panel = seen.join('|');
SS.UI.text = origText;
check(/\|G\|grenade/.test(strip) && /\|'\|grenade/.test(strip) && /LT\|grenade/.test(strip) && /\|K\|big slap/.test(strip), 'key hints show G / \' / LT = grenade and K = big slap');
check(/Grenade\|G\|' \(quote\)\|LT/.test(panel) && /Big Slap\|K\|/.test(panel), 'Pause > Controls lists Grenade (G, \', LT) and Big Slap on K');
var tb = {}; SS.Touch.layout().forEach(function (b) { tb[b.id] = b; });
var clash = [];
SS.Touch.layout().forEach(function (a) {
  SS.Touch.layout().forEach(function (b) {
    if (a.id < b.id && a.corner === b.corner && Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r) clash.push(a.id + '/' + b.id);
  });
});
check(!!tb.Grenade && !clash.length, 'touch GRENADE button, no buttons overlap' + (clash.length ? ': ' + clash.join(', ') : ''));

// ---- Wi-Fi: the guest sees grenades / big guns ----
SS.Engine.setScene(new SS.CampaignScene({ level: 1, net: true, players: [{ id: 0, cid: 'sir', local: null }, { id: 1, cid: 'sue', local: null }] }));
var host = scene(), guest = new SS.RemoteScene({ level: 1 }); SS.Net.id = 1; frames(3);
host.slots[1].f.giveWeapon('rocket');
host.netInput(1, { n: 1, l: 0, r: 0, d: 0, s: 0, p: ['grenadeP'] }); frames(10);
var snap = JSON.parse(JSON.stringify(SS.Sync.snapshot(host)));
var me = snap.pl.find(function (q) { return q.id === 1; });
var gErr = null;
try { guest.onNet(snap); guest.update(1 / 30); guest.draw(SS.Engine.ctx); } catch (e) { gErr = '' + e; }
check(me && me.wp === 'rocket' && me.gr === 2 && !gErr, 'Wi-Fi player throws a grenade; guest sees rockets + 2 grenades' + (gErr ? ' ERROR ' + gErr : ''));
host.netInput(1, { n: 2, l: 0, r: 0, d: 0, s: 1, p: [] });
host.slots[1].f.giveWeapon('lmg'); frames(30);
check(host.slots[1].f.wAmmo < SS.WEAPONS.lmg.ammo - 3, 'Wi-Fi player holding Shoot keeps the machine gun firing');

// ---- duels: weapon boxes parachute in from the sky ----
SS.Engine.setScene(new SS.DuelScene({ p1: 'sir', p2: 'chonk', vsCpu: false, theme: 'jungle' }));
var d = scene(); frames(130);
check(d.state === 'fight' && d.pickups.length === 0 && d.dropT > 3, 'duel: no weapon box at the start of a round, the first one comes after a few seconds');
d.dropT = 0; frames(2);
var drop = d.pickups[0];
check(drop && drop.type === 'weapon' && drop.fall && drop.y < 60, 'duel: a "?" weapon box parachutes in from the sky');
drop.x = (d.f1.x + d.f2.x) / 2; // land it between the two sloths (it drops at a random spot)
frames(60 * 5);
check(drop.fall === false && Math.abs(drop.y - (d.groundY - 6)) < 1 && !drop.taken, 'it lands on the ground (nobody touched it)');
var snapD = JSON.parse(JSON.stringify(SS.Sync.duelSnapshot(d)));
var gd = new SS.RemoteDuelScene(), gdErr = null;
try { gd.onNet(snapD); gd.update(1 / 30); gd.draw(SS.Engine.ctx); } catch (e) { gdErr = '' + e; }
check(snapD.pk.length === 1 && gd.pickups.length === 1 && !gdErr, 'Wi-Fi guests see the box' + (gdErr ? ' ERROR ' + gdErr : ''));
d.f1.x = drop.x; frames(2);
check(d.f1.weapon !== 'pistol' && d.pickups.length === 0, 'walking into it gives a big gun (' + d.f1.weapon + ')');
var duelGun = d.f1.weapon, duelAmmo = d.f1.wAmmo;
d.dropT = 0; frames(2); d.pickups[0].fall = false; d.pickups[0].y = d.groundY - 6; d.pickups[0].x = d.f1.x; frames(2);
check(d.f1.weapon === duelGun && d.f1.wAmmo === duelAmmo + SS.WEAPONS[duelGun].ammo, 'duel: a second box keeps the gun and adds a full load');
d.dropT = 0; frames(2); d.dropT = 0; frames(2); d.dropT = 0; frames(2);
check(d.pickups.length === 2, 'never more than 2 boxes waiting at once');
d.f2.hp = 0; d.f2.knockOut(d); frames(60 * 5);
check(d.round === 2 && d.pickups.length === 0 && d.f1.weapon === 'pistol', 'next round: boxes cleared, everyone back to the pistol');
done('weapons');
