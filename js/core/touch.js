// On-screen touch buttons for phones and tablets.
// They turn on by themselves the first time the screen is touched, and only show
// during play (menus are already tap-friendly). Each button acts like a key
// ("TouchSlap", "TouchLeft"...), so every mode understands them without changes.
(function () {
  const I = SS.Input;
  const W = SS.W, H = SS.H;

  // x, y, r in game coordinates (960 x 540). Left thumb: move/block. Right thumb: actions.
  const BUTTONS = [
    { id: 'Left', x: 78, y: 455, r: 50, icon: 'left' },
    { id: 'Right', x: 196, y: 455, r: 50, icon: 'right' },
    { id: 'Down', x: 137, y: 352, r: 36, icon: 'block', label: 'BLOCK' },
    { id: 'Slap', x: 868, y: 448, r: 56, label: 'SLAP', color: '#ffd23f' },
    { id: 'Jump', x: 748, y: 478, r: 42, label: 'JUMP', color: '#9bf6ff' },
    { id: 'Heavy', x: 902, y: 330, r: 40, label: 'BIG', color: '#ff4d6d' },
    { id: 'Shoot', x: 782, y: 356, r: 38, label: 'SHOOT', color: '#ffb703' },
    { id: 'Special', x: 652, y: 492, r: 34, label: 'SUPER', color: '#00f5d4' },
    { id: 'Pause', x: W / 2, y: H - 22, r: 18, icon: 'pause' },
  ];

  const T = (SS.Touch = {
    enabled: false,
    points: new Map(), // pointerId -> { x, y }
    buttons: BUTTONS,

    init(canvas) {
      const toLocal = (e) => {
        const r = canvas.getBoundingClientRect();
        return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
      };
      canvas.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'touch') {
          if (!this.enabled && SS.Save.get('touchPref', 'auto') !== 'off') this.enabled = true;
          this.points.set(e.pointerId, toLocal(e));
        }
      });
      canvas.addEventListener('pointermove', (e) => {
        if (this.points.has(e.pointerId)) this.points.set(e.pointerId, toLocal(e));
      });
      const up = (e) => this.points.delete(e.pointerId);
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', up);
      window.addEventListener('blur', () => this.points.clear());
      // stop long-press menus / text selection on phones
      canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    },

    // Does the current screen want the buttons? (scenes opt in with wantsTouch())
    visible() {
      const s = SS.Engine.scene;
      return this.enabled && !!s && !!s.wantsTouch && s.wantsTouch() && !this.portrait();
    },

    portrait() { return window.innerHeight > window.innerWidth * 1.05; },

    held(b) {
      for (const p of this.points.values()) {
        const dx = p.x - b.x, dy = p.y - b.y;
        if (dx * dx + dy * dy < (b.r * 1.3) * (b.r * 1.3)) return true;
      }
      return false;
    },

    // Called every frame by SS.Input.poll(): turns finger positions into virtual keys.
    poll() {
      const show = this.visible();
      for (const b of BUTTONS) {
        const code = 'Touch' + b.id;
        const now = show && this.held(b);
        if (now && !I.keys[code]) {
          I.pressed[code] = true;
          if (navigator.vibrate) { try { navigator.vibrate(8); } catch (e) { /* not supported */ } }
        }
        I.keys[code] = now;
      }
    },

    // player = fighter-like object ({ canSpecial, ammo }) to light up SUPER / dim SHOOT
    draw(ctx, player) {
      if (this.enabled && this.portrait()) return this.drawRotate(ctx);
      if (!this.visible()) return;
      const t = SS.Engine.time;
      for (const b of BUTTONS) {
        const down = !!I.keys['Touch' + b.id];
        let alpha = down ? 0.75 : 0.38;
        if (b.id === 'Shoot' && player && player.ammo <= 0) alpha *= 0.5;
        const ready = b.id === 'Special' && player && player.canSpecial;
        ctx.save();
        ctx.translate(b.x, b.y);
        const s = down ? 0.92 : 1;
        ctx.scale(s, s);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = 'rgba(20,10,30,0.9)';
        ctx.beginPath(); ctx.arc(0, 0, b.r, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = Math.min(1, alpha + 0.35);
        ctx.lineWidth = ready ? 5 : 3;
        ctx.strokeStyle = ready && Math.floor(t * 4) % 2 === 0 ? '#ffffff' : (b.color || '#ffffff');
        ctx.beginPath(); ctx.arc(0, 0, b.r - 2, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#ffffff';
        if (b.icon === 'left' || b.icon === 'right') {
          const d = b.icon === 'left' ? -1 : 1;
          ctx.beginPath();
          ctx.moveTo(d * 20, 0); ctx.lineTo(-d * 12, -20); ctx.lineTo(-d * 12, 20);
          ctx.closePath(); ctx.fill();
        } else if (b.icon === 'pause') {
          ctx.fillRect(-6, -8, 4, 16);
          ctx.fillRect(2, -8, 4, 16);
        } else if (b.icon === 'block') {
          SS.Art.powerIcon(ctx, 'shield', 0, -6, 16);
          SS.UI.text(ctx, b.label, 0, 18, 11, '#ffffff', 'center');
        } else {
          SS.UI.outlineText(ctx, b.label, 0, 1, b.r > 50 ? 20 : b.label.length > 4 ? 13 : 15, '#ffffff', 'center');
        }
        ctx.restore();
      }
      ctx.globalAlpha = 1;
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

  // On-screen controls setting shared by all game screens: key hints -> touch buttons -> off
  SS.onscreenLabel = (scene) => 'On-screen controls: ' + (T.enabled ? 'TOUCH BUTTONS' : scene.showStrip ? 'KEY HINTS' : 'OFF');
  SS.cycleOnscreen = (scene) => {
    if (T.enabled) {
      T.enabled = false;
      scene.showStrip = false;
      SS.Save.set('touchPref', 'off');
    } else if (!scene.showStrip) {
      scene.showStrip = true;
    } else {
      T.enabled = true;
      SS.Save.set('touchPref', 'auto');
    }
    SS.Save.set('keyStrip', scene.showStrip);
  };
})();
