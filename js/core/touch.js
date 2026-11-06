// On-screen touch buttons for phones and tablets.
//  * They turn on by themselves the first time the screen is touched and show only
//    during play (menus are tap-friendly already).
//  * They are drawn on a separate full-screen layer, anchored to the screen corners and
//    sized for thumbs, so on wide phones they sit mostly in the black bars beside the game.
//  * Each button acts like a key ("TouchSlap", "TouchLeft"...), so every mode understands them.
(function () {
  const I = SS.Input;
  const W = SS.W, H = SS.H;

  // Button sizes/positions are in "u" (thumb units, ~11% of the screen height), measured
  // from the bottom-left / bottom-right / top-right corner of the screen.
  const BUTTONS = [
    { id: 'Left', corner: 'bl', dx: 1.1, dy: 1.1, r: 1.1, icon: 'left' },
    { id: 'Right', corner: 'bl', dx: 3.5, dy: 1.1, r: 1.1, icon: 'right' },
    { id: 'Down', corner: 'bl', dx: 2.3, dy: 3.3, r: 0.8, icon: 'block', label: 'BLOCK' },
    { id: 'Slap', corner: 'br', dx: 1.3, dy: 1.3, r: 1.3, label: 'SLAP', color: '#ffd23f' },
    { id: 'Jump', corner: 'br', dx: 3.9, dy: 0.95, r: 0.95, label: 'JUMP', color: '#9bf6ff' },
    { id: 'Heavy', corner: 'br', dx: 1.1, dy: 3.9, r: 0.9, label: 'BIG', color: '#ff4d6d' },
    { id: 'Shoot', corner: 'br', dx: 3.3, dy: 3.1, r: 0.85, label: 'SHOOT', color: '#ffb703' },
    { id: 'Special', corner: 'br', dx: 5.9, dy: 0.8, r: 0.75, label: 'SUPER', color: '#00f5d4' },
    { id: 'Pause', corner: 'tr', dx: 0.6, dy: 0.6, r: 0.55, icon: 'pause' },
  ];

  const T = (SS.Touch = {
    enabled: false,
    userOff: false,          // switched off from the pause menu (this visit only)
    points: new Map(),       // pointerId -> { x, y } in screen (CSS) pixels
    buttons: BUTTONS,
    layer: null,
    isTouchDevice: typeof window !== 'undefined' && (('ontouchstart' in window) || (navigator.maxTouchPoints || 0) > 0),

    init(canvas) {
      this.canvas = canvas;
      // full-screen layer for the buttons; taps pass straight through to the game (menus)
      if (document.createElement) {
        const layer = document.createElement('canvas');
        layer.id = 'touchLayer';
        document.body.appendChild(layer);
        this.layer = layer;
      }
      const down = (e) => {
        if (e.pointerType !== 'touch') return;
        if (!this.enabled && !this.userOff) this.enabled = true;
        this.points.set(e.pointerId, { x: e.clientX, y: e.clientY });
      };
      window.addEventListener('pointerdown', down);
      window.addEventListener('pointermove', (e) => {
        if (this.points.has(e.pointerId)) this.points.set(e.pointerId, { x: e.clientX, y: e.clientY });
      });
      const up = (e) => this.points.delete(e.pointerId);
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', up);
      window.addEventListener('blur', () => this.points.clear());
      // iPhone/iPad: no pinch-zoom, double-tap zoom or long-press menus while playing
      document.addEventListener('gesturestart', (e) => e.preventDefault());
      document.addEventListener('dblclick', (e) => e.preventDefault());
      canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    },

    // Does the current screen want the buttons? (scenes opt in with wantsTouch())
    visible() {
      const s = SS.Engine.scene;
      return this.enabled && !!s && !!s.wantsTouch && s.wantsTouch() && !this.portrait();
    },

    portrait() { return window.innerHeight > window.innerWidth * 1.05; },

    // Button circles in screen pixels for the current screen size.
    layout() {
      const vw = window.innerWidth, vh = window.innerHeight;
      const u = Math.max(24, Math.min(vh * 0.11, vw * 0.075, 62));
      const pad = 10;
      return BUTTONS.map((b) => {
        const x = b.corner === 'bl' ? pad + b.dx * u : vw - pad - b.dx * u;
        const y = b.corner === 'tr' ? pad + b.dy * u : vh - pad - b.dy * u;
        return Object.assign({}, b, { x, y, r: b.r * u });
      });
    },

    held(b) {
      const reach = b.r * 1.25;
      for (const p of this.points.values()) {
        const dx = p.x - b.x, dy = p.y - b.y;
        if (dx * dx + dy * dy < reach * reach) return true;
      }
      return false;
    },

    // Called every frame by SS.Input.poll(): turns finger positions into virtual keys.
    poll() {
      const show = this.visible();
      const buttons = show ? this.layout() : BUTTONS;
      for (const b of buttons) {
        const code = 'Touch' + b.id;
        const now = show && this.held(b);
        if (now && !I.keys[code]) {
          I.pressed[code] = true;
          if (navigator.vibrate) { try { navigator.vibrate(8); } catch (e) { /* not supported */ } }
        }
        I.keys[code] = now;
      }
    },

    // Draw the buttons on their own layer (and the "turn sideways" hint on the game).
    // player = fighter-like object ({ canSpecial, ammo }) to light up SUPER / dim SHOOT
    draw(ctx, player) {
      if (this.enabled && this.portrait()) this.drawRotate(ctx);
      const layer = this.layer;
      if (!layer) return;
      const show = this.visible();
      if (!show) {
        if (this.drawn) { layer.getContext('2d').clearRect(0, 0, layer.width, layer.height); this.drawn = false; }
        return;
      }
      const dpr = window.devicePixelRatio || 1;
      const vw = window.innerWidth, vh = window.innerHeight;
      if (layer.width !== Math.round(vw * dpr) || layer.height !== Math.round(vh * dpr)) {
        layer.width = Math.round(vw * dpr);
        layer.height = Math.round(vh * dpr);
        layer.style.width = vw + 'px';
        layer.style.height = vh + 'px';
      }
      const c = layer.getContext('2d');
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, vw, vh);
      this.drawn = true;
      const t = SS.Engine.time;
      for (const b of this.layout()) {
        const down = !!I.keys['Touch' + b.id];
        let alpha = down ? 0.8 : 0.42;
        if (b.id === 'Shoot' && player && player.ammo <= 0) alpha *= 0.5;
        const ready = b.id === 'Special' && player && player.canSpecial;
        c.save();
        c.translate(b.x, b.y);
        const s = down ? 0.92 : 1;
        c.scale(s, s);
        c.globalAlpha = alpha;
        c.fillStyle = 'rgba(20,10,30,0.9)';
        c.beginPath(); c.arc(0, 0, b.r, 0, Math.PI * 2); c.fill();
        c.globalAlpha = Math.min(1, alpha + 0.35);
        c.lineWidth = ready ? 5 : 3;
        c.strokeStyle = ready && Math.floor(t * 4) % 2 === 0 ? '#ffffff' : (b.color || '#ffffff');
        c.beginPath(); c.arc(0, 0, b.r - 2, 0, Math.PI * 2); c.stroke();
        c.fillStyle = '#ffffff';
        const k = b.r / 50; // icon scale
        if (b.icon === 'left' || b.icon === 'right') {
          const d = b.icon === 'left' ? -1 : 1;
          c.beginPath();
          c.moveTo(d * 20 * k, 0); c.lineTo(-d * 12 * k, -20 * k); c.lineTo(-d * 12 * k, 20 * k);
          c.closePath(); c.fill();
        } else if (b.icon === 'pause') {
          c.fillRect(-6 * k * 1.6, -8 * k * 1.6, 4 * k * 1.6, 16 * k * 1.6);
          c.fillRect(2 * k * 1.6, -8 * k * 1.6, 4 * k * 1.6, 16 * k * 1.6);
        } else if (b.icon === 'block') {
          SS.Art.powerIcon(c, 'shield', 0, -b.r * 0.15, b.r * 0.42);
          SS.UI.text(c, b.label, 0, b.r * 0.5, Math.max(9, b.r * 0.3), '#ffffff', 'center');
        } else {
          const fs = Math.max(10, b.r * (b.label.length > 4 ? 0.36 : 0.42));
          SS.UI.outlineText(c, b.label, 0, 1, fs, '#ffffff', 'center');
        }
        c.restore();
      }
      c.globalAlpha = 1;
    },

    drawRotate(ctx) {
      ctx.fillStyle = 'rgba(20,10,30,0.92)';
      ctx.fillRect(0, 0, W, H);
      const t = SS.Engine.time;
      ctx.save();
      ctx.translate(W / 2, H / 2 - 40);
      ctx.rotate(Math.min(1, (t % 2.4) / 1.2) * -Math.PI / 2);
      ctx.strokeStyle = '#ffd23f';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.roundRect(-45, -80, 90, 160, 16);
      ctx.stroke();
      ctx.restore();
      SS.UI.outlineText(ctx, 'Turn your phone sideways to play!', W / 2, H / 2 + 110, 34, '#ffffff', 'center');
    },
  });

  // Pause-menu option. Phones/tablets: touch buttons ON/OFF (this visit only, never stuck off).
  // Computers: key hints -> touch buttons -> nothing.
  SS.onscreenLabel = (scene) => {
    if (T.isTouchDevice) return 'Touch buttons: ' + (T.enabled ? 'ON' : 'OFF');
    return 'On-screen controls: ' + (T.enabled ? 'TOUCH BUTTONS' : scene.showStrip ? 'KEY HINTS' : 'OFF');
  };
  SS.cycleOnscreen = (scene) => {
    if (T.isTouchDevice) {
      T.enabled = !T.enabled;
      T.userOff = !T.enabled;
      return;
    }
    if (T.enabled) {
      T.enabled = false;
      T.userOff = true;
      scene.showStrip = false;
    } else if (!scene.showStrip) {
      scene.showStrip = true;
    } else {
      T.enabled = true;
      T.userOff = false;
    }
    SS.Save.set('keyStrip', scene.showStrip);
  };
})();
