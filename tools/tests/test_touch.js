// Phone/tablet touch buttons.
localStorage._d['slothslap.touchPref'] = '"off"'; // old saved setting that used to switch them off for good
function B() { var o = {}; SS.Touch.layout().forEach(function (b) { o[b.id] = b; }); return o; }
SS.Engine.setScene(new SS.CampaignScene({ charId: 'sir', level: 0 })); var sc = scene(); sc.t = 3; frames(5);
var b = B();
touch('down', 1, b.Slap.x, b.Slap.y); frames(2);
check(SS.Touch.enabled && sc.player.move && sc.player.move.kind === 'slap', 'first touch turns buttons on (old "off" ignored) and SLAP slaps');
touch('up', 1, 0, 0); frames(30);
var x0 = sc.player.x; touch('down', 2, b.Right.x, b.Right.y); frames(40);
touch('down', 3, b.Shoot.x, b.Shoot.y); frames(2);
check(sc.player.x - x0 > 50 && sc.player.move && sc.player.move.kind === 'shoot', 'hold RIGHT + second finger SHOOT');
touch('up', 3, 0, 0); touch('move', 2, b.Left.x, b.Left.y); frames(30);
check(sc.player.vx < 0, 'sliding a finger onto LEFT turns around'); touch('up', 2, 0, 0); frames(10);
touch('down', 4, b.Down.x, b.Down.y); frames(3); check(sc.player.state === 'block', 'BLOCK'); touch('up', 4, 0, 0); frames(3);
touch('down', 5, b.Jump.x, b.Jump.y); frames(3); check(!sc.player.onGround, 'JUMP'); touch('up', 5, 0, 0); frames(60);
touch('down', 8, b.Grenade.x, b.Grenade.y); frames(2);
check(sc.player.move && sc.player.move.kind === 'grenade' && sc.player.grenades === 2, 'GRENADE throws a grenade');
touch('up', 8, 0, 0); frames(60);
touch('down', 6, b.Pause.x, b.Pause.y); frames(2); touch('up', 6, 0, 0); frames(2);
check(sc.state === 'paused', 'PAUSE button');
SS.Touch.isTouchDevice = true;
var item = sc.menu.items.find(function (i) { return /Touch buttons/.test(label(i)); });
check(!!item && label(item) === 'Touch buttons: ON', 'phone pause menu shows Touch buttons: ON');
item.act(); check(label(item) === 'Touch buttons: OFF', 'tap -> OFF'); item.act();
sc.resume(); frames(2);
SS.Touch.enabled = false; SS.Touch.userOff = false; touch('down', 7, 50, 50); touch('up', 7, 0, 0); frames(2);
check(SS.Touch.enabled, 'a new visit always turns them back on');
window.innerWidth = 390; window.innerHeight = 844; var t0 = sc.t; frames(20);
check(!SS.Touch.visible() && sc.t === t0, 'upright phone: buttons hidden and the game waits');
window.innerWidth = 844; window.innerHeight = 390; frames(2);
check(SS.Touch.visible(), 'sideways phone: buttons visible');
window.innerWidth = 960; window.innerHeight = 540; SS.Touch.isTouchDevice = false;
done('touch');
