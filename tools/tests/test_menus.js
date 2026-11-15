// Menus, map choice, local co-op revive and the in-game "Choose Another Map".
frames(30);
check(sceneName() === 'Menu', 'starts on the title menu');
tap('Enter'); frames(3);
check(sceneName() === 'Mode(campaign)', 'Campaign opens the "how to play" menu');
tap('Enter'); frames(3);
check(sceneName() === 'Select(campaign,char)', 'Solo opens sloth select');
check(SS.CHARACTERS.length === 11, 'there are 11 sloths');

// every map can be chosen, even in a brand-new browser
localStorage.clear();
var sel = new SS.SelectScene({ mode: 'campaign' }); SS.Engine.setScene(sel); sel.openLevelMenu(); frames(2);
check(sel.menu.items.length === SS.LEVELS.length && SS.LEVELS.length === 17, 'map menu lists all 17 maps');
check(!sel.menu.items.some(function (i) { return /locked|\?\?\?/.test(label(i)); }), 'no map is locked');
sel.menu.items[16].act(); frames(2);
check(scene() instanceof SS.CampaignScene && scene().levelIndex === 16, 'picking map 17 starts it');

// in-game map switching (pause -> Choose Another Map)
SS.Engine.setScene(new SS.CampaignScene({ charId: 'flo', level: 2 })); var sc = scene(); sc.t = 3; frames(5);
tap('Escape');
check(sc.state === 'paused' && !!menuItem(sc.menu, 'Choose Another Map'), 'pause menu has Choose Another Map');
menuItem(sc.menu, 'Choose Another Map').act(); frames(1);
check(sc.mapPicker && sc.mapPicker.items.length === 17 && sc.mapPicker.sel === 2, 'map picker shows 17 maps, current one highlighted');
tap('Escape');
check(!sc.mapPicker && sc.state === 'paused', 'Esc closes the map picker');
menuItem(sc.menu, 'Choose Another Map').act(); sc.mapPicker.items[11].act(); frames(2);
check(scene().levelIndex === 11 && scene().slots[0].cid === 'flo', 'picking a map switches to it with the same sloth');
scene().win(); frames(80);
check(!!menuItem(scene().menu, 'Choose Another Map'), 'win screen has Choose Another Map');

// local 2-player co-op: partner revive, team wipe
SS.Engine.setScene(new SS.CampaignScene({ level: 0, players: [{ id: 0, cid: 'sir', local: 'P1' }, { id: 1, cid: 'sue', local: 'P2' }] }));
sc = scene(); frames(30);
sc.slots[1].f.takeHit({ dmg: 999, kbx: 0, kby: 0, stun: 0.1 }, sc); frames(60 * 6);
check(sc.slots[1].f.state !== 'ko' && sc.state === 'play', 'a snoozed co-op player comes back after 5 seconds');
sc.slots.forEach(function (s) { s.f.invuln = 0; s.f.takeHit({ dmg: 999, kbx: 0, kby: 0, stun: 0.1 }, sc); }); frames(150);
check(sc.state === 'dead' && !!sc.menu, 'whole team down -> SNOOZED OUT menu');

// Wi-Fi lobby map picker (host)
SS.Net.role = 'host'; SS.Net.status = 'connected'; SS.Net.code = '1234';
var lob = new SS.LobbyScene({ mode: 'campaign', resume: true, players: [{ id: 0, cid: 'sir', ready: true }] }); SS.Engine.setScene(lob); frames(2);
for (var k = 0; k < 16; k++) tap('ArrowRight');
check(lob.level === 16, 'lobby: arrow keys reach map 17');
tap('KeyM');
check(lob.picker && lob.picker.items.length === 17, 'lobby: M opens the full map list');
var bl = new SS.LobbyScene({ mode: 'battle', resume: true, players: [{ id: 0, cid: 'sir', ready: true }] }); SS.Engine.setScene(bl); frames(2);
tap('KeyC'); tap('KeyC');
check(bl.players.length === 3 && bl.players[1].cpu !== undefined, 'battle lobby: C adds CPU sloths');
SS.Net.role = null; SS.Net.status = 'off';

// Web version (artifact.html): same scripts as index.html, and Wi-Fi items explain instead of connecting
function scriptList(file) { var l = []; readFile(file).replace(/<script src="([^"]+)"/g, function (m, s) { l.push(s); return m; }); return l.join(','); }
check(scriptList('artifact.html') === scriptList('index.html'), 'artifact.html loads the same scripts as index.html');
location.protocol = 'https:'; window.SS_WEB_ONLY = true;
check(!SS.Net.available(), 'web version: Wi-Fi is switched off');
var wm = new SS.CampaignModeScene({ kind: 'duel' }); SS.Engine.setScene(wm); frames(2);
wm.tryHost('hostBattle'); var hostInfo = wm.info; wm.info = null; wm.tryJoin();
check(sceneName() === 'Mode(duel)' && hostInfo && /web version/.test(wm.info[1]), 'web version: Host/Join Wi-Fi show a message');
window.SS_WEB_ONLY = false;
// public web hosts (GitHub Pages) count as the web version; home addresses keep Wi-Fi
function wifiAt(host) { location.hostname = host; return SS.Net.available(); }
check(!wifiAt('marknakasone85.github.io') && SS.Net.webOnly(), 'GitHub Pages: Wi-Fi is switched off');
check(wifiAt('localhost') && wifiAt('192.168.0.5') && wifiAt('my-mac.local') && wifiAt('[::1]'), 'home addresses keep Wi-Fi on');
location.hostname = ''; location.protocol = 'file:';
check(!SS.Net.available() && !SS.Net.webOnly(), 'double-clicked index.html: Wi-Fi shows the sharing instructions');

// ---- key hints along the bottom (computers): every move, in full words, matching the real keys ----
var ACTIONS = ['move', 'jump', 'crouch', 'slap', 'big slap', 'special', 'shoot', 'grenade', 'pause'];
var FIELD = { move: ['left', 'right'], jump: ['up'], crouch: ['down'], slap: ['slap'], 'big slap': ['heavy'], special: ['special'], shoot: ['shoot'], grenade: ['grenade'] };
var CODE = { A: 'KeyA', D: 'KeyD', W: 'KeyW', S: 'KeyS', F: 'KeyF', K: 'KeyK', H: 'KeyH', R: 'KeyR', G: 'KeyG', J: 'KeyJ', L: 'KeyL', P: 'KeyP', Esc: 'Escape',
  '←': 'ArrowLeft', '→': 'ArrowRight', '↑': 'ArrowUp', '↓': 'ArrowDown', ',': 'Comma', '.': 'Period', '/': 'Slash', ';': 'Semicolon', "'": 'Quote' };
var SCHEME = { wasd: SS.Controls.SOLO, arrows: SS.Controls.SOLO, p1: SS.Controls.P1, p2: SS.Controls.P2 };
var wrongKeys = [];
Object.keys(SS.UI.KEY_LAYOUTS).forEach(function (l) {
  var items = SS.UI.KEY_LAYOUTS[l];
  if (items.map(function (it) { return it[1]; }).join('|') !== ACTIONS.join('|')) wrongKeys.push(l + ': not all 9 actions');
  if (!SCHEME[l]) return;
  items.forEach(function (it) {
    it[0].forEach(function (k, i) {
      var code = CODE[k];
      var ok = it[1] === 'pause' ? (code === 'Escape' || code === 'KeyP') : SCHEME[l][FIELD[it[1]][Math.min(i, FIELD[it[1]].length - 1)]].indexOf(code) >= 0;
      if (!ok) wrongKeys.push(l + ' ' + k + ' ' + it[1]);
    });
  });
});
check(!wrongKeys.length, 'key hints show all 9 actions in full words, with the keys that really do them' + (wrongKeys.length ? ': ' + wrongKeys.join(', ') : ''));
var kctx = SS.Engine.ctx, dummy = { move: null, state: 'idle', onGround: true, ammo: 3, grenades: 2 };
kctx.measureText = function (str) { var m = /(\d+)px/.exec(kctx.font || ''); return { width: String(str).length * (m ? +m[1] : 12) * 0.62 }; };
var two = SS.UI.keyStrips(kctx, [{ player: dummy, layout: 'p1', tag: 'P1' }, { player: dummy, layout: 'p2', tag: 'P2' }], 0);
var one = SS.UI.keyStrip(kctx, dummy, 0, { layout: 'pad', tag: 'YOU (P4)' });
delete kctx.measureText;
var fits = function (b) { return b.x >= 0 && b.x + b.w <= SS.W && b.y + b.h <= SS.H && b.size >= 12; };
check(fits(two) && fits(one) && two.h > one.h, 'key hints fit on the screen with big enough letters (two players: two rows, ' + two.size + 'px)');
var rowsSeen = [], origRows = SS.UI.keyStrips;
SS.UI.keyStrips = function (c, rows) { rowsSeen.push(rows.map(function (r) { return (r.tag || '-') + ':' + (r.layout || 'auto'); }).join(',')); return origRows.apply(SS.UI, arguments); };
SS.Engine.setScene(new SS.CampaignScene({ level: 1, players: [{ id: 0, cid: 'sir', local: 'P1' }, { id: 1, cid: 'sue', local: 'P2' }] })); frames(3);
var coopRows = rowsSeen.pop();
SS.Engine.setScene(new SS.DuelScene({ p1: 'sir', p2: 'chonk', vsCpu: false, theme: 'jungle' })); frames(3);
var duelRows = rowsSeen.pop();
SS.Engine.setScene(new SS.DuelScene({ p1: 'sir', p2: 'chonk', vsCpu: true, cpuLevel: 1, theme: 'jungle' })); frames(3);
var cpuRows = rowsSeen.pop();
SS.Engine.setScene(new SS.CampaignScene({ charId: 'sir', level: 0 })); frames(3);
var soloRows = rowsSeen.pop();
SS.UI.keyStrips = origRows;
check(coopRows === 'P1:p1,P2:p2' && duelRows === 'P1:p1,P2:p2' && cpuRows === 'YOU:auto' && soloRows === '-:auto',
  'key hints: a row per player for 2 players on one keyboard (co-op and duel), one row otherwise (' + [coopRows, duelRows, cpuRows, soloRows].join(' / ') + ')');
var ks = scene();
SS.cycleOnscreen(ks); SS.cycleOnscreen(ks); // key hints -> touch buttons -> off
var offNow = !ks.showStrip && !SS.Touch.enabled;
SS.Engine.setScene(new SS.CampaignScene({ charId: 'sir', level: 0 })); frames(2);
check(offNow && !scene().showStrip && SS.Save.get('keyStrip', 'never saved') === 'never saved', 'Pause > On-screen controls: OFF lasts for this visit only (never saved)');
SS.cycleOnscreen(scene());
check(scene().showStrip && !SS.keyHintsOff, 'key hints switch back on');
SS.Touch.userOff = false;

done('menus');
