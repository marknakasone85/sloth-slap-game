// Shared drawing helpers and a keyboard/mouse/touch friendly menu list.
(function () {
  const FONT = '"Arial Rounded MT Bold", "Arial Black", "Trebuchet MS", sans-serif';

  const UI = (SS.UI = {
    FONT,

    outlineText(ctx, str, x, y, size, color = '#fff', align = 'left', outline = '#2b193d') {
      ctx.font = `bold ${size}px ${FONT}`;
      ctx.textAlign = align;
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.lineWidth = Math.max(3, size / 5);
      ctx.strokeStyle = outline;
      ctx.strokeText(str, x, y);
      ctx.fillStyle = color;
      ctx.fillText(str, x, y);
    },

    text(ctx, str, x, y, size, color = '#fff', align = 'left') {
      ctx.font = `bold ${size}px ${FONT}`;
      ctx.textAlign = align;
      ctx.textBaseline = 'middle';
      ctx.fillStyle = color;
      ctx.fillText(str, x, y);
    },

    panel(ctx, x, y, w, h, color = 'rgba(43,25,61,0.82)') {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 16);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 3;
      ctx.stroke();
    },

    // Health/meter bar. flip = drains toward the right (for player 2 side).
    bar(ctx, x, y, w, h, frac, color, flip = false, ghost = null) {
      frac = SS.U.clamp(frac, 0, 1);
      ctx.fillStyle = '#2b193d';
      ctx.beginPath();
      ctx.roundRect(x - 3, y - 3, w + 6, h + 6, 6);
      ctx.fill();
      ctx.fillStyle = '#5a4870';
      ctx.fillRect(x, y, w, h);
      if (ghost !== null) {
        ctx.fillStyle = '#ffffff';
        const gw = w * SS.U.clamp(ghost, 0, 1);
        ctx.fillRect(flip ? x + w - gw : x, y, gw, h);
      }
      ctx.fillStyle = color;
      const fw = w * frac;
      ctx.fillRect(flip ? x + w - fw : x, y, fw, h);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(flip ? x + w - fw : x, y, fw, h * 0.35);
    },

    // Full controls page (title menu, pause menus).
    controlsPanel(ctx) {
      const W = SS.W;
      UI.panel(ctx, 110, 150, W - 220, 360);
      UI.outlineText(ctx, 'HOW TO SLAP', W / 2, 180, 30, '#ffd23f', 'center');
      const rows = [
        ['', 'Player 1', 'Player 2', 'Gamepad'],
        ['Move', 'A / D', '← / →', 'D-pad / stick'],
        ['Jump', 'W', '↑', 'A'],
        ['Block (hold)', 'S', '↓', 'Down / LB'],
        ['Slap', 'F', ', (comma)', 'X'],
        ['Big Slap', 'G', '. (period)', 'Y'],
        ['Special', 'H', '/ (slash)', 'B'],
        ['Shoot', 'R', '; (semicolon)', 'RB / RT'],
        ['Pause', 'Esc / P', 'Esc / P', 'Start'],
      ];
      rows.forEach((r, i) => {
        const y = 216 + i * 27;
        const col = i === 0 ? '#9bf6ff' : '#ffffff';
        UI.text(ctx, r[0], 150, y, 17, '#ffd23f');
        UI.text(ctx, r[1], 400, y, 17, col, 'center');
        UI.text(ctx, r[2], 570, y, 17, col, 'center');
        UI.text(ctx, r[3], 735, y, 17, col, 'center');
      });
      UI.text(ctx, 'Solo campaign also accepts arrows + J (slap) / K (big slap) / L (special) / ; (shoot).', W / 2, 464, 14, '#cccccc', 'center');
      UI.text(ctx, 'Special needs a full blue meter. Phones & tablets: touch buttons appear when you tap.', W / 2, 484, 14, '#cccccc', 'center');
      UI.text(ctx, 'Press any key to go back.', W / 2, 502, 13, '#9bf6ff', 'center');
    },

    // Key-hint strip along the bottom edge. Lights up the move the sloth is doing.
    //  opts.layout: 'wasd' | 'arrows' | 'pad' (solo, follows the keys in use) or 'p1' | 'p2' (duel)
    //  opts.x + opts.align ('left'|'right') to place it; centered otherwise
    //  opts.compact: short labels, no pause key (for two strips side by side)
    //  opts.tag / opts.tagColor: e.g. 'P1' in the player's color
    keyStrip(ctx, player, t, opts = {}) {
      const LAYOUTS = {
        wasd: [[['A', 'D'], 'move'], [['W'], 'jump'], [['S'], 'block'], [['F'], 'slap'], [['G'], 'big slap'], [['H'], 'special'], [['R'], 'shoot'], [['Esc'], 'pause']],
        arrows: [[['←', '→'], 'move'], [['↑'], 'jump'], [['↓'], 'block'], [['J'], 'slap'], [['K'], 'big slap'], [['L'], 'special'], [[';'], 'shoot'], [['Esc'], 'pause']],
        pad: [[['◀', '▶'], 'move'], [['A'], 'jump'], [['LB'], 'block'], [['X'], 'slap'], [['Y'], 'big slap'], [['B'], 'special'], [['RB'], 'shoot'], [['Start'], 'pause']],
        p1: [[['A', 'D'], 'move'], [['W'], 'jump'], [['S'], 'block'], [['F'], 'slap'], [['G'], 'big slap'], [['H'], 'special'], [['R'], 'shoot']],
        p2: [[['←', '→'], 'move'], [['↑'], 'jump'], [['↓'], 'block'], [[','], 'slap'], [['.'], 'big slap'], [['/'], 'special'], [[';'], 'shoot']],
      };
      const SHORT = { 'big slap': 'big', special: 'spec', move: '' };
      const compact = !!opts.compact;
      let items = LAYOUTS[opts.layout || SS.Input.lastDevice] || LAYOUTS.wasd;
      if (compact) items = items.filter(([, label]) => label !== 'pause');
      const kind = player.move ? player.move.kind : null;
      const active = {
        slap: kind === 'slap', 'big slap': kind === 'heavy',
        special: kind && kind !== 'slap' && kind !== 'heavy' && kind !== 'shoot',
        shoot: kind === 'shoot',
        block: player.state === 'block', jump: !player.onGround && player.state !== 'ko',
      };
      const fs = compact ? 11 : 12;
      const font = `bold ${fs}px ${FONT}`;
      ctx.font = font;
      const capW = (k) => Math.max(compact ? 16 : 20, ctx.measureText(k).width + (compact ? 8 : 10));
      const gap = compact ? 6 : 14;
      const shown = (label) => (compact && SHORT[label] !== undefined ? SHORT[label] : label);
      const tagW = opts.tag ? ctx.measureText(opts.tag).width + 10 : 0;
      let total = tagW;
      for (const [keys, label] of items) {
        for (const k of keys) total += capW(k) + 3;
        total += ctx.measureText(shown(label)).width + 5 + gap;
      }
      total -= gap;
      const y = SS.H - 20;
      let x = opts.x === undefined ? (SS.W - total) / 2 : opts.align === 'right' ? opts.x - total : opts.x;
      ctx.fillStyle = 'rgba(20,10,30,0.55)';
      ctx.beginPath();
      ctx.roundRect(x - 10, y - 14, total + 20, 28, 14);
      ctx.fill();
      if (opts.tag) {
        UI.text(ctx, opts.tag, x, y, fs, opts.tagColor || '#ffd23f');
        x += tagW;
      }
      for (const [keys, label] of items) {
        const ready = label === 'special' && player.canSpecial;
        const empty = label === 'shoot' && player.ammo <= 0;
        const on = active[label];
        const glow = ready && Math.floor(t * 4) % 2 === 0;
        for (const k of keys) {
          const w = capW(k);
          ctx.fillStyle = on ? '#ffd23f' : glow ? '#00f5d4' : empty ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.88)';
          ctx.beginPath();
          ctx.roundRect(x, y - 10, w, 20, 5);
          ctx.fill();
          ctx.fillStyle = 'rgba(0,0,0,0.25)';
          ctx.fillRect(x + 2, y + 7, w - 4, 2);
          UI.text(ctx, k, x + w / 2, y, fs, '#2b193d', 'center');
          x += w + 3;
        }
        x += 2;
        const text = shown(label);
        UI.text(ctx, text, x, y, fs, on ? '#ffd23f' : ready ? '#00f5d4' : empty ? '#999999' : '#ffffff');
        ctx.font = font;
        x += ctx.measureText(text).width + gap + 3;
      }
    },

    // Row of bullet icons showing the fighter's ammo (+ refill progress).
    ammo(ctx, x, y, f, align = 'left') {
      const step = 13;
      const total = f.maxAmmo * step;
      const sx = align === 'right' ? x - total : x;
      for (let i = 0; i < f.maxAmmo; i++) {
        const full = i < f.ammo;
        ctx.fillStyle = full ? '#ffb703' : 'rgba(255,255,255,0.18)';
        ctx.beginPath();
        ctx.roundRect(sx + i * step, y - 6, 7, 12, 3.5);
        ctx.fill();
        if (!full && i === f.ammo) {
          ctx.fillStyle = 'rgba(255,183,3,0.6)';
          const fh = 12 * (f.ammoT / f.ammoRegen);
          ctx.fillRect(sx + i * step, y + 6 - fh, 7, fh);
        }
      }
      UI.text(ctx, f.ammo > 0 ? 'ammo' : 'reloading...', align === 'right' ? sx - 8 : sx + total + 6, y, 11,
        f.ammo > 0 ? '#ffb703' : '#aaa', align === 'right' ? 'right' : 'left');
    },

    // Active power-ups as round icons with a countdown ring (+ Lucky Banana lives).
    powers(ctx, x, y, f, t, size = 1) {
      const list = Object.keys(f.powers || {}).map((k) => [k, f.powers[k] / SS.POWER_TIME]);
      for (let i = 0; i < (f.lucky || 0); i++) list.push(['lucky', 1]);
      list.forEach(([type, frac], i) => {
        const cx = x + i * 40 * size;
        const c = SS.Art.POWER_COLORS[type];
        if (frac < 0.2 && Math.floor(t * 6) % 2 === 0) return; // blink when almost over
        ctx.fillStyle = 'rgba(43,25,61,0.85)';
        ctx.beginPath(); ctx.arc(cx, y, 17 * size, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = c;
        ctx.lineWidth = 4 * size;
        ctx.beginPath(); ctx.arc(cx, y, 15 * size, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac); ctx.stroke();
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.arc(cx, y, 11 * size, 0, Math.PI * 2); ctx.fill();
        SS.Art.powerIcon(ctx, type, cx, y, 9 * size);
      });
    },

    // "Back" button for touch screens (phones have no Esc key). Shown only in touch mode.
    BACK_RECT: { x: 12, y: 12, w: 96, h: 38 },
    backButton(ctx) {
      if (!SS.Touch.enabled) return;
      const r = UI.BACK_RECT;
      ctx.fillStyle = 'rgba(43,25,61,0.85)';
      ctx.beginPath();
      ctx.roundRect(r.x, r.y, r.w, r.h, 12);
      ctx.fill();
      UI.text(ctx, '\u25C0 Back', r.x + r.w / 2, r.y + r.h / 2 + 1, 16, '#ffffff', 'center');
    },
    backTapped() {
      const p = SS.Input.pointer, r = UI.BACK_RECT;
      return SS.Touch.enabled && p.pressed && p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
    },

    // Fade overlay helper
    fade(ctx, a) {
      if (a <= 0) return;
      ctx.fillStyle = `rgba(20,10,30,${Math.min(1, a)})`;
      ctx.fillRect(0, 0, SS.W, SS.H);
    },
  });

  // A vertical menu of buttons. Keyboard, gamepad, mouse and touch all work.
  SS.MenuList = class {
    constructor(items, x, y, opts = {}) {
      this.items = items;
      this.x = x;
      this.y = y;
      this.w = opts.w || 320;
      this.h = opts.h || 52;
      this.gap = opts.gap || 14;
      this.sel = 0;
      this.t = 0;
    }

    rect(i) {
      return { x: this.x - this.w / 2, y: this.y + i * (this.h + this.gap), w: this.w, h: this.h };
    }

    // Returns the chosen item (or null).
    update(dt) {
      this.t += dt;
      const n = this.items.length;
      if (SS.Menu.up()) { this.sel = (this.sel - 1 + n) % n; SS.Audio.select(); }
      if (SS.Menu.down()) { this.sel = (this.sel + 1) % n; SS.Audio.select(); }
      const p = SS.Input.pointer;
      for (let i = 0; i < n; i++) {
        const r = this.rect(i);
        const inside = p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
        if (inside && (p.pressed || p.down) && this.sel !== i) { this.sel = i; }
        if (inside && p.pressed) { SS.Audio.confirm(); return this.items[i]; }
      }
      if (SS.Menu.confirm()) { SS.Audio.confirm(); return this.items[this.sel]; }
      return null;
    }

    draw(ctx) {
      this.items.forEach((item, i) => {
        const r = this.rect(i);
        const on = i === this.sel;
        const bob = on ? Math.sin(this.t * 6) * 3 : 0;
        ctx.fillStyle = on ? '#ffd23f' : 'rgba(43,25,61,0.85)';
        ctx.beginPath();
        ctx.roundRect(r.x, r.y + bob, r.w, r.h, 14);
        ctx.fill();
        ctx.strokeStyle = on ? '#2b193d' : 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 3;
        ctx.stroke();
        const label = typeof item.label === 'function' ? item.label() : item.label;
        UI.text(ctx, label, r.x + r.w / 2, r.y + r.h / 2 + bob + 1, 22, on ? '#2b193d' : '#ffffff', 'center');
      });
    }
  };
})();
