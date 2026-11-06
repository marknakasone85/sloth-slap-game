// Headless test harness for The Sloth Slap Game (runs in macOS JavaScriptCore, no browser).
// It fakes just enough of the browser (canvas, window, storage, input events), loads every
// game script in the order index.html lists them, and gives tests a few helpers.
// Run via:  tools/run-tests.sh   (from the game folder)
var noop = function () { return undefined; };
function makeCtx() {
  var store = {};
  return new Proxy(store, {
    get: function (t, p) {
      if (p in t) return t[p];
      if (p === 'createLinearGradient' || p === 'createRadialGradient') return function () { return { addColorStop: noop }; };
      if (p === 'measureText') return function () { return { width: 10 }; };
      return noop;
    },
    set: function (t, p, v) { t[p] = v; return true; },
  });
}
var listeners = {};
var canvas = {
  style: {}, width: 0, height: 0,
  getContext: function () { return makeCtx(); },
  addEventListener: function (n, f) { (listeners['c_' + n] = listeners['c_' + n] || []).push(f); },
  getBoundingClientRect: function () { return { left: 0, top: 0, width: 960, height: 540 }; },
};
var rafCb = null;
var now = 0;
var window = this;
window.innerWidth = 960; window.innerHeight = 540; window.devicePixelRatio = 1;
window.addEventListener = function (n, f) { (listeners[n] = listeners[n] || []).push(f); };
window.requestAnimationFrame = function (f) { rafCb = f; };
window.CanvasRenderingContext2D = function () {}; CanvasRenderingContext2D.prototype.roundRect = noop;
var document = { getElementById: function () { return canvas; }, addEventListener: noop, hidden: false };
var Worker = function () { this.terminate = noop; };
var EventSource = function () { this.readyState = 1; this.close = noop; }; // Wi-Fi stream (not used offline)
var fetch = function () { return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve({}); } }); };
var URL = { createObjectURL: function () { return ''; } };
var Blob = function () {};
var performance = { now: function () { return now; } };
var location = { protocol: 'file:', hostname: '', host: '' };
var navigator = { getGamepads: function () { return []; } };
var localStorage = { _d: {}, getItem: function (k) { return k in this._d ? this._d[k] : null; }, setItem: function (k, v) { this._d[k] = String(v); }, clear: function () { this._d = {}; } };
function setInterval() { return 1; }
function clearInterval() {}
function fire(n, ev) { (listeners[n] || []).forEach(function (f) { f(ev); }); }

// load the game exactly like the browser does (script order from index.html)
readFile('index.html').replace(/<script src="([^"]+)"/g, function (m, src) { load(src); return m; });
fire('load', {});

// ---------- helpers ----------
function frames(n, each) { for (var i = 0; i < n; i++) { if (each) each(i); now += 16.67; rafCb(now); } }
function key(code, down) { fire(down ? 'keydown' : 'keyup', { code: code, repeat: false, preventDefault: noop }); }
function tap(code) { key(code, true); frames(1); key(code, false); frames(1); }
function touch(type, id, x, y) { fire('pointer' + type, { pointerType: 'touch', pointerId: id, clientX: x, clientY: y, preventDefault: noop }); }
function scene() { return SS.Engine.scene; }
function sceneName() {
  var s = scene();
  return s instanceof SS.MenuScene ? 'Menu' : s instanceof SS.CampaignModeScene ? 'Mode(' + s.kind + ')'
    : s instanceof SS.SelectScene ? 'Select(' + s.mode + ',' + s.phase + ')' : s instanceof SS.CampaignScene ? 'Campaign'
    : s instanceof SS.DuelScene ? 'Duel' : s instanceof SS.LobbyScene ? 'Lobby' : s instanceof SS.JoinScene ? 'Join' : '?';
}
function label(item) { return typeof item.label === 'function' ? item.label() : item.label; }
function menuItem(menu, text) { return menu.items.find(function (i) { return label(i) === text; }); }

var PASSED = 0, FAILED = 0;
function check(ok, what) {
  if (ok) PASSED++; else FAILED++;
  print((ok ? '  PASS  ' : '  FAIL  ') + what);
}
function done(name) { print(name + ': ' + PASSED + ' passed, ' + FAILED + ' failed'); }
