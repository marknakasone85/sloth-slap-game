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
      UI.panel(ctx, 110, 134, W - 220, 392);
      UI.outlineText(ctx, 'HOW TO SLAP', W / 2, 162, 30, '#ffd23f', 'center');
      const rows = [
        ['', 'Player 1', 'Player 2', 'Gamepad'],
        ['Move', 'A / D', '← / →', 'D-pad / stick'],
        ['Jump (Zane: 2x)', 'W', '↑', 'A'],
        ['Crouch + block (hold)', 'S', '↓', 'Down / LB'],
        ['Slap', 'F', ', (comma)', 'X'],
        ['Big Slap', 'K', '. (period)', 'Y'],
        ['Special', 'H', '/ (slash)', 'B'],
        ['Shoot', 'R', '; (semicolon)', 'RB / RT'],
        ['Grenade', 'G', "' (quote)", 'LT'],
        ['Pause', 'Esc / P', 'Esc / P', 'Start'],
      ];
      rows.forEach((r, i) => {
        const y = 196 + i * 24;
        const col = i === 0 ? '#9bf6ff' : '#ffffff';
        UI.text(ctx, r[0], 150, y, 17, '#ffd23f');
        UI.text(ctx, r[1], 400, y, 17, col, 'center');
        UI.text(ctx, r[2], 570, y, 17, col, 'center');
        UI.text(ctx, r[3], 735, y, 17, col, 'center');
      });
      UI.text(ctx, "Solo also accepts arrows + J (slap) / K (big slap) / L (special) / ; (shoot) / ' (grenade).", W / 2, 446, 14, '#cccccc', 'center');
      UI.text(ctx, 'Crouch + Shoot = low shots for small critters. Up to 10 grenades. "?" boxes hold big guns.', W / 2, 466, 14, '#cccccc', 'center');
      UI.text(ctx, 'Special needs a full blue meter. Phones & tablets: touch buttons appear when you tap.', W / 2, 486, 14, '#cccccc', 'center');
      UI.text(ctx, 'Press any key to go back.', W / 2, 508, 13, '#9bf6ff', 'center');
    },

    // Which key does what, for every move, along the bottom edge (computers; phones get touch
    // buttons). Lights up the move the sloth is doing, glows when the special is ready and greys
    // out an empty gun or grenade pouch.
    //  KEY_LAYOUTS: 'wasd' | 'arrows' | 'pad' (one player: follows the keys in use) and
    //  'p1' | 'p2' (two players on one keyboard).
    KEY_LAYOUTS: {
      wasd: [[['A', 'D'], 'move'], [['W'], 'jump'], [['S'], 'crouch'], [['F'], 'slap'], [['K'], 'big slap'], [['H'], 'special'], [['R'], 'shoot'], [['G'], 'grenade'], [['Esc'], 'pause']],
      arrows: [[['←', '→'], 'move'], [['↑'], 'jump'], [['↓'], 'crouch'], [['J'], 'slap'], [['K'], 'big slap'], [['L'], 'special'], [[';'], 'shoot'], [["'"], 'grenade'], [['Esc'], 'pause']],
      pad: [[['◀', '▶'], 'move'], [['A'], 'jump'], [['LB'], 'crouch'], [['X'], 'slap'], [['Y'], 'big slap'], [['B'], 'special'], [['RB'], 'shoot'], [['LT'], 'grenade'], [['Start'], 'pause']],
      p1: [[['A', 'D'], 'move'], [['W'], 'jump'], [['S'], 'crouch'], [['F'], 'slap'], [['K'], 'big slap'], [['H'], 'special'], [['R'], 'shoot'], [['G'], 'grenade'], [['Esc'], 'pause']],
      p2: [[['←', '→'], 'move'], [['↑'], 'jump'], [['↓'], 'crouch'], [[','], 'slap'], [['.'], 'big slap'], [['/'], 'special'], [[';'], 'shoot'], [["'"], 'grenade'], [['P'], 'pause']],
    },

    // One row per player on this computer. Two rows (two players on one keyboard) are lined up
    // in columns, so each move sits right above the other player's key for it.
    //  rows: [{ player, layout, tag, tagColor }]
    //   player: a fighter, or an object with the same fields (move, state, onGround, canSpecial,
    //           ammo, weapon, wAmmo, grenades); layout: see KEY_LAYOUTS; tag: e.g. 'P1'
    // Returns the box it drew in ({ x, y, w, h, size }).
    keyStrips(ctx, rows, t) {
      const lines = rows.map((r) => ({ r, items: UI.KEY_LAYOUTS[r.layout || SS.Input.lastDevice] || UI.KEY_LAYOUTS.wasd }));
      const n = Math.max(...lines.map((l) => l.items.length));
      let fs = 14, capW, gap, tagW, cols, total;
      const measure = () => {
        ctx.font = `bold ${fs}px ${FONT}`;
        capW = (k) => Math.max(fs + 8, ctx.measureText(k).width + 10);
        gap = Math.round(fs * 1.1);
        tagW = Math.max(0, ...lines.map((l) => (l.r.tag ? ctx.measureText(l.r.tag).width + 12 : 0)));
        cols = [];
        for (let c = 0; c < n; c++) {
          cols[c] = Math.max(0, ...lines.map((l) => {
            const it = l.items[c];
            return it ? it[0].reduce((s, k) => s + capW(k) + 3, 0) + 2 + ctx.measureText(it[1]).width : 0;
          }));
        }
        total = tagW + cols.reduce((s, w) => s + w, 0) + gap * (n - 1);
      };
      measure();
      while (total > SS.W - 36 && fs > 10) { fs--; measure(); } // as big as fits on the screen
      const rowH = fs + 13;
      const x0 = Math.round((SS.W - total) / 2);
      const yLast = SS.H - 6 - rowH / 2;
      const box = { x: x0 - 10, y: yLast - (lines.length - 0.5) * rowH - 3, w: total + 20, h: lines.length * rowH + 6, size: fs };
      ctx.fillStyle = 'rgba(20,10,30,0.72)';
      ctx.beginPath();
      ctx.roundRect(box.x, box.y, box.w, box.h, 12);
      ctx.fill();
      lines.forEach((l, i) => {
        const y = yLast - (lines.length - 1 - i) * rowH;
        const p = l.r.player;
        const kind = p.move ? p.move.kind : null;
        const active = {
          slap: kind === 'slap', 'big slap': kind === 'heavy',
          special: kind && kind !== 'slap' && kind !== 'heavy' && kind !== 'shoot' && kind !== 'grenade',
          shoot: kind === 'shoot', grenade: kind === 'grenade',
          crouch: p.state === 'block' || !!(p.move && p.move.low), jump: !p.onGround && p.state !== 'ko',
        };
        let x = x0;
        if (l.r.tag) UI.text(ctx, l.r.tag, x, y, fs, l.r.tagColor || '#ffd23f');
        x += tagW;
        l.items.forEach(([keys, label], c) => {
          const start = x;
          const ready = label === 'special' && p.canSpecial;
          const empty = (label === 'shoot' && UI.shotsLeft(p) <= 0) || (label === 'grenade' && p.grenades <= 0);
          const on = active[label];
          const glow = ready && Math.floor(t * 4) % 2 === 0;
          for (const k of keys) {
            const w = capW(k), ch = fs + 8;
            ctx.fillStyle = on ? '#ffd23f' : glow ? '#00f5d4' : empty ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.92)';
            ctx.beginPath();
            ctx.roundRect(x, y - ch / 2, w, ch, 5);
            ctx.fill();
            ctx.fillStyle = 'rgba(0,0,0,0.25)';
            ctx.fillRect(x + 2, y + ch / 2 - 3, w - 4, 2);
            UI.text(ctx, k, x + w / 2, y, fs, '#2b193d', 'center');
            x += w + 3;
          }
          UI.text(ctx, label, x + 2, y, fs, on ? '#ffd23f' : ready ? '#00f5d4' : empty ? '#999999' : '#ffffff');
          x = start + cols[c] + gap;
        });
      });
      return box;
    },

    // A single player's row (see keyStrips). opts: { layout, tag, tagColor }
    keyStrip(ctx, player, t, opts = {}) {
      return UI.keyStrips(ctx, [Object.assign({ player }, opts)], t);
    },

    // Shots left in the gun in hand (pistol ammo, or the big gun's ammo).
    shotsLeft(f) { return f.weapon && f.weapon !== 'pistol' ? f.wAmmo : f.ammo; },

    // The gun: a row of bullet icons for the pistol (+ refill progress), or the big gun's name and
    // shots left. Then the grenades. (align 'right' grows leftward from x.)
    ammo(ctx, x, y, f, align = 'left') {
      const right = align === 'right';
      const sign = right ? -1 : 1;
      let edge; // where the gun part ends
      const big = f.weapon && f.weapon !== 'pistol' ? SS.WEAPONS[f.weapon] : null;
      if (big) {
        const label = `${big.short} ${f.wAmmo}`;
        ctx.font = `bold 12px ${FONT}`;
        const w = ctx.measureText(label).width + 12;
        const bx = right ? x - w : x;
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath(); ctx.roundRect(bx, y - 8, w, 16, 8); ctx.fill();
        UI.text(ctx, label, bx + w / 2, y, 12, big.color, 'center');
        edge = x + sign * w;
      } else {
        const step = 13;
        const total = f.maxAmmo * step;
        const sx = right ? x - total : x;
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
        const label = f.ammo > 0 ? 'ammo' : 'reloading...';
        UI.text(ctx, label, right ? sx - 8 : sx + total + 6, y, 11, f.ammo > 0 ? '#ffb703' : '#aaa', right ? 'right' : 'left');
        ctx.font = `bold 11px ${FONT}`;
        edge = right ? sx - 8 - ctx.measureText(label).width : sx + total + 6 + ctx.measureText(label).width;
      }
      if (f.grenades === undefined) return;
      const gx = edge + sign * 16;
      ctx.globalAlpha = f.grenades > 0 ? 1 : 0.4;
      SS.Art.grenade(ctx, gx, y + 1, 5);
      UI.text(ctx, `x${f.grenades}`, gx + sign * 8, y, 11, '#9ef01a', right ? 'right' : 'left');
      ctx.globalAlpha = 1;
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

    // Wi-Fi games: join code + address at the top of the screen (so anyone can rejoin any time).
    // net = { code, address, lost }
    netStrip(ctx, net) {
      const parts = [['WI-FI GAME', '#ffffff'], ['   JOIN CODE: ', '#9bf6ff'], [String(net.code), '#ffd23f'], [`   ${net.address}`, '#9bf6ff']];
      if (net.lost) parts.push(['   reconnecting...', '#ff4d6d']);
      ctx.font = `bold 13px ${FONT}`;
      const widths = parts.map(([txt]) => ctx.measureText(txt).width);
      const total = widths.reduce((a, b) => a + b, 0);
      let x = (SS.W - total) / 2;
      ctx.fillStyle = 'rgba(20,10,30,0.85)';
      ctx.beginPath();
      ctx.roundRect(x - 14, 2, total + 28, 20, 10);
      ctx.fill();
      parts.forEach(([txt, color], i) => {
        UI.text(ctx, txt, x, 12, 13, color);
        x += widths[i];
      });
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
      this.cols = opts.cols || 1;       // 2+ = a grid (arrow keys move in all directions)
      this.gapX = opts.gapX || 20;
      this.fontSize = opts.fontSize || 22;
      this.sel = 0;
      this.t = 0;
    }

    rect(i) {
      const c = i % this.cols, r = Math.floor(i / this.cols);
      const total = this.cols * this.w + (this.cols - 1) * this.gapX;
      return { x: this.x - total / 2 + c * (this.w + this.gapX), y: this.y + r * (this.h + this.gap), w: this.w, h: this.h };
    }

    // Returns the chosen item (or null).
    update(dt) {
      this.t += dt;
      const n = this.items.length;
      if (this.cols > 1) {
        const c = this.cols;
        let s = this.sel;
        if (SS.Menu.up() && s - c >= 0) s -= c;
        if (SS.Menu.down() && s + c < n) s += c;
        if (SS.Menu.left() && s % c > 0) s--;
        if (SS.Menu.right() && s % c < c - 1 && s + 1 < n) s++;
        if (s !== this.sel) { this.sel = s; SS.Audio.select(); }
      } else {
        if (SS.Menu.up()) { this.sel = (this.sel - 1 + n) % n; SS.Audio.select(); }
        if (SS.Menu.down()) { this.sel = (this.sel + 1) % n; SS.Audio.select(); }
      }
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
        UI.text(ctx, label, r.x + r.w / 2, r.y + r.h / 2 + bob + 1, this.fontSize, on ? '#2b193d' : '#ffffff', 'center');
      });
    }
  };
})();
