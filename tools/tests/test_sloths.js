// Sloth stats feel different (speed vs power), plus the Gorilla and Athlete sloths.
var D = 1 / 60;
var C = SS.CHARACTERS;
check(C.length === 11, 'there are 11 sloths');
check(C.every(function (c) { return SS.ROLE_COLORS[c.role] && c.trait && c.atk > 0; }), 'every sloth has a role (FAST/POWER/BALANCED), a trait and a slap speed');
var speeds = C.map(function (c) { return c.speed; }), powers = C.map(function (c) { return c.power; });
check(Math.max.apply(null, speeds) / Math.min.apply(null, speeds) >= 2.5, 'fastest sloth is 2.5x+ faster than the slowest');
check(Math.max.apply(null, powers) / Math.min.apply(null, powers) >= 2.5, 'strongest sloth hits 2.5x+ harder than the weakest');

// Step one fighter (and the projectiles) by hand, without the scene's own update.
function duel(a, b) { SS.Engine.setScene(new SS.DuelScene({ p1: a, p2: b, theme: 'jungle' })); return scene(); }
function step(w, f, ctrl, n) {
  for (var i = 0; i < n; i++) {
    f.update(D, ctrl || {}, w);
    w.projectiles.forEach(function (p) { p.update(D, w); });
    w.projectiles = w.projectiles.filter(function (p) { return !p.dead; });
  }
}
function slapTime(cid) {
  var d = duel(cid, 'sir'), f = d.f1, n = 0;
  f.startMove('slap');
  while (f.state === 'attack' && n < 200) { step(d, f, {}, 1); n++; }
  return n * D;
}
var tz = slapTime('zane'), tg = slapTime('gainz'), ts = slapTime('sir');
check(tz < ts && ts < tg && tg / tz > 1.8, 'slap speed: Zane ' + tz.toFixed(2) + 's < Sir ' + ts.toFixed(2) + 's < Gainz ' + tg.toFixed(2) + 's');

function slapDamage(cid, move) {
  var d = duel(cid, 'sir'), f = d.f1, t = d.f2;
  t.x = f.x + 70; f.facing = 1;
  f.startMove(move || 'slap');
  step(d, f, {}, 40);
  return 100 - t.hp;
}
var dz = slapDamage('zane'), dg = slapDamage('gainz');
check(dg >= 10 && dz >= 4 && dg / dz > 2.4, 'slap damage: Gainz ' + dg.toFixed(1) + ' vs Zane ' + dz.toFixed(1));

// Gorilla super armor: small hits hurt but don't stop him; big slaps still do.
var d = duel('zane', 'gainz'), g = d.f2;
var r = g.takeHit({ dmg: 6, kbx: 220, kby: -140, stun: 0.3, from: d.f1 }, d);
check(r === 'hit' && g.hp < 150 && g.state !== 'hurt', 'Gorilla Gainz shrugs off a small slap (still loses health)');
g.invuln = 0;
g.takeHit({ dmg: 13, kbx: 520, kby: -340, stun: 0.5, big: true, from: d.f1 }, d);
check(g.state === 'hurt', 'a BIG slap still knocks Gorilla Gainz back');
var s = duel('zane', 'sir').f2;
s.takeHit({ dmg: 6, kbx: 220, kby: -140, stun: 0.3, from: scene().f1 }, scene());
check(s.state === 'hurt', 'other sloths still flinch from small slaps');

// Athlete double jump
function airJump(cid) {
  var d = duel(cid, 'sir'), f = d.f1;
  step(d, f, { jumpP: true }, 1); step(d, f, {}, 20);
  var before = f.vy;
  step(d, f, { jumpP: true }, 1);
  return { before: before, after: f.vy, onGround: f.onGround };
}
var jz = airJump('zane'), js = airJump('sir');
check(jz.after < 0 && jz.before > jz.after, 'Zippy Zane can jump again in mid-air');
check(js.after > -100 || js.after > js.before - 50, 'other sloths cannot double jump');

// Gorilla special: shockwaves roll both ways and hit through several enemies
SS.Engine.setScene(new SS.CampaignScene({ charId: 'gainz', level: 0 }));
var cs = scene(), gf = cs.slots[0].f;
cs.enemies = [new SS.Enemy('beetle', gf.x + 220), new SS.Enemy('beetle', gf.x + 300), new SS.Enemy('beetle', gf.x - 250)];
cs.crates = []; cs.gongs = [];
gf.meter = 100; gf.facing = 1; gf.startSpecial(cs);
var quakes = 0, spawn = cs.spawn.bind(cs);
cs.spawn = function (p) { if (p.kind === 'quake') quakes++; spawn(p); };
step(cs, gf, {}, 90);
var hurt = cs.enemies.filter(function (e) { return e.hp < e.maxHp || !e.alive; }).length;
check(quakes === 2 && hurt === 3, 'Chest-Pound Quake: 2 shockwaves hit all 3 beetles (left and right, through each other)');

// Athlete special: zooms there and back, hitting on both passes
d = duel('zane', 'sir'); var z = d.f1, t = d.f2;
z.x = 200; t.x = 420; z.facing = 1; t.mercy = 0;
z.meter = 100; z.startSpecial(d);
var x0 = z.x, far = 0, hits = 0, last = t.hp;
for (var i = 0; i < 70; i++) {
  step(d, z, {}, 1); t.update(D, {}, d);
  if (t.hp < last) { hits++; last = t.hp; }
  far = Math.max(far, z.x - x0);
}
check(far > 250 && Math.abs(z.x - x0) < far - 150 && hits >= 1 && z.state !== 'attack', 'Lightning Lap zooms out ' + Math.round(far) + 'px and back, hitting ' + hits + 'x');

// Flyers stay one-hit even for the weakest slap
SS.Engine.setScene(new SS.CampaignScene({ charId: 'zane', level: 0 }));
cs = scene(); var zf = cs.slots[0].f;
var bird = new SS.Enemy('parrot', zf.x + 45, zf.y - 60);
cs.enemies = [bird]; cs.crates = []; cs.gongs = [];
zf.facing = 1; zf.startMove('slap');
step(cs, zf, {}, 20);
check(!bird.alive, 'Zippy Zane knocks out a flyer with one light slap');

// Battle with the new sloths (CPU) and a Wi-Fi guest drawing every snapshot
SS.Engine.setScene(new SS.DuelScene({ net: true, theme: 'jungle', stageIndex: 0, players: [
  { id: 10, cid: 'gainz', cpu: 2 }, { id: 11, cid: 'zane', cpu: 2 }, { id: 12, cid: 'chonk', cpu: 1 }, { id: 13, cid: 'sue', cpu: 1 }] }));
var bd = scene(), guest = new SS.RemoteDuelScene(), err = null, specials = {};
SS.Net.id = 1;
for (i = 0; i < 60 * 60 * 8 && bd.state !== 'matchEnd'; i++) {
  bd.slots.forEach(function (sl) { if (sl.f.move && sl.f.move.kind) specials[sl.f.move.kind] = 1; if (sl.f.meter < 100 && i % 120 === 0) sl.f.meter = 100; });
  frames(1);
  if (i % 2 === 0) {
    try { guest.onNet(JSON.parse(JSON.stringify(SS.Sync.duelSnapshot(bd)))); guest.update(1 / 30); guest.draw(SS.Engine.ctx); }
    catch (e) { if (!err) err = '' + e; }
  }
}
check(bd.state === 'matchEnd' && specials.quake && specials.sprint, 'CPU battle with Gainz and Zane plays to the end and both use their specials');
check(!err, 'Wi-Fi guest view draws the new sloths and shockwaves' + (err ? ': ' + err : ''));

// Select screens fit all 11 sloths
var sel = new SS.SelectScene({ mode: 'campaign' }); SS.Engine.setScene(sel); frames(2);
var rLast = sel.cardRect(5), r10 = sel.cardRect(10);
check(rLast.x + rLast.w <= SS.W && sel.cardRect(0).x >= 0 && r10.y > rLast.y && r10.y + r10.h < SS.H - 140, '11 sloth cards fit in 2 rows of 6');
var drawErr = null;
try {
  sel.draw(SS.Engine.ctx);
  var two = new SS.SelectScene({ mode: 'duel' }); SS.Engine.setScene(two); frames(2); two.draw(SS.Engine.ctx);
  var js2 = new SS.JoinScene({}); js2.phase = 'pick'; js2.cur = 9; js2.draw(SS.Engine.ctx);
} catch (e) { drawErr = '' + e; }
check(!drawErr, 'sloth select, 2-player select and phone join screens draw' + (drawErr ? ': ' + drawErr : ''));
done('sloths');
