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
done('menus');
