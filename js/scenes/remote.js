// Wi-Fi co-op, guest side: draws what the host sends (~30x a second) and sends our
// button presses back. The host runs the real game, so everyone sees the same thing.
(function () {
  const UI = SS.UI;
  const W = SS.W, H = SS.H;
  const PRESS_KEYS = ['jumpP', 'slapP', 'heavyP', 'specialP', 'shootP'];

  SS.RemoteScene = class {
    constructor(opts) {
      this.t = 0;
      this.lastSeq = 0;
      this.snap = null;
      this.inSeq = 0;
      this.lastHeld = null;
      this.heartbeat = 0;
      this.menu = null;
      this.showControls = false;
      this.showStrip = SS.Save.get('keyStrip', true);
      this.ended = null;
      this.setLevel(opts.level || 0);
    }

    setLevel(i) {
      this.levelIndex = i;
      this.L = SS.LEVELS[i];
      this.groundY = SS.GROUND_Y;
      this.platforms = this.L.platforms || [];
      this.crates = this.L.crates.map((c) => new SS.Crate(c.x, c.loot));
      this.gongs = (this.L.gongs || []).map((g) => new SS.Gong(g.id, g.x));
      this.gates = (this.L.gates || []).map((g) => ({ id: g.id, x: g.x, opened: false, lift: 0 }));
      this.goalX = this.L.length - 160;
      this.players = {};
      this.enemies = new Map();
      this.pickups = [];
      this.proj = [];
      this.fx = new SS.FX();
      this.camX = this.camTarget = 0;
      SS.Audio.playMusic(this.L.music);
    }

    enter() {
      SS.Net.onMessage = (m) => this.onNet(m);
      SS.Audio.playMusic(this.L.music);
    }

    floorBelow(x, y) {
      let best = this.groundY;
      for (const p of this.platforms) {
        if (x > p.x - 10 && x < p.x + p.w + 10 && p.y >= y - 1 && p.y < best) best = p.y;
      }
      return best;
    }

    // ---------------- messages from the host ----------------
    onNet(m) {
      if (!m) return;
      if (m.t === 'hostLeft') { this.end(m.reason || 'The host ended the game.'); return; }
      if (m.t !== 'snap' || m.n <= this.lastSeq) return;
      this.lastSeq = m.n;
      if (m.lv !== this.levelIndex) this.setLevel(m.lv);
      this.snap = m;
      this.snapAt = performance.now();

      const seen = new Set();
      for (const p of m.pl) {
        seen.add(p.id);
        const cur = this.players[p.id];
        if (!cur || Math.abs(cur.x - p.x) > 220 || Math.abs(cur.y - p.y) > 220) {
          this.players[p.id] = Object.assign({}, p, { tx: p.x, ty: p.y });
        } else {
          const x = cur.x, y = cur.y;
          Object.assign(cur, p, { x, y, tx: p.x, ty: p.y });
        }
      }
      for (const id of Object.keys(this.players)) if (!seen.has(+id)) delete this.players[id];

      const ids = new Set();
      for (const [uid, type, x, y, facing, fl, alive, spin, thr, sleepy, et] of m.en) {
        ids.add(uid);
        let e = this.enemies.get(uid);
        if (!e) {
          e = new SS.Enemy(type, x, y);
          this.enemies.set(uid, e);
        }
        Object.assign(e, { tx: x, ty: y, facing, flash: fl ? 0.1 : 0, alive: !!alive, spin, throwing: thr, hurt: sleepy ? 1 : 0, t: et });
      }
      for (const uid of [...this.enemies.keys()]) if (!ids.has(uid)) this.enemies.delete(uid);

      m.cr.forEach(([alive, wobble, fl], i) => {
        const c = this.crates[i];
        if (c) Object.assign(c, { alive: !!alive, wobble, flash: fl ? 0.08 : 0 });
      });
      m.go.forEach(([done, ring], i) => { const g = this.gongs[i]; if (g) Object.assign(g, { done: !!done, ring }); });
      m.ga.forEach(([opened, lift], i) => { const g = this.gates[i]; if (g) Object.assign(g, { opened: !!opened, lift }); });
      this.pickups = m.pk.map(([type, x, y]) => new SS.Pickup(type, x, y));
      this.proj = m.pr.map(([kind, x, y, vx, vy]) => new SS.Projectile(kind, x, y, vx, vy, 'host', {}));
      this.camTarget = m.cam;
      SS.Sync.replay(this.fx, m);
    }

    end(reason) {
      this.ended = reason;
      SS.Net.leave();
      this.menu = new SS.MenuList([
        { label: 'Back to Menu', act: () => SS.Engine.setScene(new SS.MenuScene()) },
      ], W / 2, 300, { w: 300, h: 48 });
    }

    // ---------------- update ----------------
    update(dt) {
      this.t += dt;
      this.fx.update(dt);

      // glide toward the newest positions so movement looks smooth
      const k = 1 - Math.pow(0.0004, dt);
      for (const p of Object.values(this.players)) { p.x += (p.tx - p.x) * k; p.y += (p.ty - p.y) * k; }
      for (const e of this.enemies.values()) {
        if (Math.abs(e.tx - e.x) > 220) { e.x = e.tx; e.y = e.ty; }
        e.x += (e.tx - e.x) * k;
        e.y += (e.ty - e.y) * k;
        if (e.d.art === 'dragon' && e.alive) {
          e.trail.unshift({ x: e.x, y: e.y - 35 });
          if (e.trail.length > 54) e.trail.pop();
        }
      }
      for (const p of this.pickups) p.t = this.t + p.x * 0.013;
      this.camX += (this.camTarget - this.camX) * k;

      if (this.ended) {
        const item = this.menu.update(dt);
        if (item) item.act();
        return;
      }
      if (SS.Net.silence() > 25) { this.end('Lost the connection to the host.'); return; }

      if (this.showControls) {
        if (SS.Input.anyPressed()) { this.showControls = false; SS.Audio.select(); }
        return;
      }
      if (this.menu) {
        if (SS.Menu.pause()) { this.menu = null; return; }
        const item = this.menu.update(dt);
        if (item) item.act();
        return;
      }
      if (SS.Menu.pause()) { this.openMenu(); return; }

      this.sendInput(dt, SS.readControls(SS.Controls.SOLO));
    }

    sendInput(dt, c) {
      const presses = PRESS_KEYS.filter((k) => c[k]);
      const held = [c.left ? 1 : 0, c.right ? 1 : 0, c.down ? 1 : 0];
      const changed = !this.lastHeld || held.some((v, i) => v !== this.lastHeld[i]);
      this.heartbeat -= dt;
      if (presses.length || changed || this.heartbeat <= 0) {
        this.heartbeat = 0.5;
        this.lastHeld = held;
        SS.Net.send({ t: 'in', n: ++this.inSeq, l: held[0], r: held[1], d: held[2], p: presses }, 'host', true);
      }
    }

    openMenu() {
      this.sendInput(0, {}); // let go of everything while the menu is open
      this.menu = new SS.MenuList([
        { label: 'Back to the game', act: () => { this.menu = null; } },
        { label: 'Controls', act: () => { this.showControls = true; } },
        {
          label: () => 'Key hints on screen: ' + (this.showStrip ? 'ON' : 'OFF'),
          act: () => { this.showStrip = !this.showStrip; SS.Save.set('keyStrip', this.showStrip); },
        },
        { label: () => 'Blood: ' + (SS.Settings.blood ? 'ON' : 'OFF (confetti)'), act: () => SS.toggleBlood() },
        { label: () => 'Sound: ' + (SS.Audio.muted ? 'OFF' : 'ON'), act: () => SS.Audio.toggleMute() },
        { label: 'Leave Wi-Fi Game', act: () => { SS.Net.leave(); SS.Engine.setScene(new SS.MenuScene()); } },
      ], W / 2, 190, { w: 340, h: 40, gap: 8 });
    }

    // ---------------- draw ----------------
    draw(ctx) {
      const s = this.snap;
      if (!s) {
        SS.Art.background(ctx, this.L.theme, 0, this.t, this.groundY);
        UI.outlineText(ctx, 'Waiting for the host...', W / 2, H / 2, 30, '#ffffff', 'center');
        if (this.ended) { UI.text(ctx, this.ended, W / 2, H / 2 + 40, 16, '#ff4d6d', 'center'); this.menu.draw(ctx); }
        return;
      }
      const sh = this.fx.offset();
      SS.Art.background(ctx, this.L.theme, this.camX, this.t, this.groundY);
      ctx.save();
      ctx.translate(-Math.round(this.camX) + sh.x, sh.y);
      for (const pl of this.platforms) SS.drawPlatform(ctx, pl);
      this.fx.drawDecals(ctx);
      const bossAlive = s.bo && s.bo[3];
      if (!bossAlive) SS.Art.hammock(ctx, this.goalX + 60, this.groundY, this.t);
      for (const g of this.gongs) g.draw(ctx);
      for (const g of this.gates) SS.Art.gate(ctx, g.x, this.groundY, 200, { open: g.lift });
      for (const c of this.crates) c.draw(ctx);
      for (const p of this.pickups) p.draw(ctx);
      for (const e of this.enemies.values()) e.draw(ctx, this);
      const ps = Object.values(this.players).sort((a, b) => (b.st === 'ko') - (a.st === 'ko'));
      for (const p of ps) SS.Fighter.drawState(ctx, p, this);
      const ahead = Math.min(0.1, (performance.now() - this.snapAt) / 1000);
      for (const p of this.proj) {
        const x = p.x, y = p.y;
        p.x += p.vx * ahead; p.y += p.vy * ahead; // project fast bullets forward
        p.draw(ctx);
        p.x = x; p.y = y;
      }
      this.fx.draw(ctx);
      ctx.restore();

      const me = s.pl.find((p) => p.id === SS.Net.id);
      const alive = s.pl.filter((p) => p.st !== 'ko');
      const leadX = (alive.length ? alive : s.pl).reduce((m, p) => Math.max(m, p.x), 0);
      const strips = [];
      if (this.showStrip && me && s.st === 'play' && !this.menu) {
        strips.push({
          fighter: { move: me.mk ? { kind: me.mk } : null, state: me.st, onGround: !!me.og, canSpecial: !!me.cs, ammo: me.am },
          opts: { tag: `YOU (P${me.id + 1})`, tagColor: SS.PLAYER_COLORS[me.id % 4] },
        });
      }
      SS.CampaignHUD.draw(ctx, {
        t: this.t, coop: s.pl.length > 1, score: s.sc, bananas: s.ba, progress: leadX / this.goalX,
        boss: s.bo && s.bo[2] && s.bo[3] && this.L.boss ? { name: SS.ENEMY_TYPES[this.L.boss.type].name, frac: s.bo[0] / s.bo[1] } : null,
        gateHint: this.gates.some((g) => !g.opened && g.x > leadX && g.x - leadX < 160),
        players: s.pl.map((p) => ({
          tag: `P${p.id + 1}`, color: SS.PLAYER_COLORS[p.id % 4], name: SS.charById(p.cid).name,
          hp: p.hp, mhp: p.mhp, meter: p.me, canSpecial: !!p.cs, ammo: p.am, maxAmmo: p.mam, ammoT: p.amt,
          ammoRegen: p.amr, powers: p.pw, lucky: p.lk, respawnT: p.rt, ko: p.st === 'ko', combo: p.cb,
        })),
        strips,
      });
      SS.CampaignHUD.overlays(ctx, {
        state: s.st, stateT: s.stT, t: s.tm, levelIndex: this.levelIndex, L: this.L, score: s.sc, bananas: s.ba,
        hpBonus: s.hb, newBest: s.nb, coop: s.pl.length > 1, guest: true, showControls: false,
      });
      if (!me && !this.ended) UI.outlineText(ctx, 'Joining the team...', W / 2, 200, 26, '#ffffff', 'center');
      if (me && this.t < 6) UI.outlineText(ctx, `You are P${me.id + 1}`, W / 2, 200, 28, SS.PLAYER_COLORS[me.id % 4], 'center');
      if (SS.Net.silence() > 6 && !this.ended) UI.outlineText(ctx, 'Reconnecting to the host...', W / 2, 250, 24, '#ff4d6d', 'center');

      if (this.showControls) { UI.fade(ctx, 0.55); UI.controlsPanel(ctx); return; }
      if (this.menu) {
        UI.fade(ctx, 0.55);
        if (this.ended) {
          UI.outlineText(ctx, 'GAME OVER', W / 2, 200, 48, '#ffd23f', 'center');
          UI.text(ctx, this.ended, W / 2, 250, 18, '#ffffff', 'center');
        } else {
          UI.outlineText(ctx, 'MENU', W / 2, 130, 44, '#ffd23f', 'center');
          UI.text(ctx, 'The game keeps going for everyone else!', W / 2, 166, 15, '#dddddd', 'center');
        }
        this.menu.draw(ctx);
      }
    }
  };
})();
