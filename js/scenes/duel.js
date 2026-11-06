// Slapdown Duel: best of 3 rounds.
//  * One computer: 1v1 vs a friend or the CPU.
//  * Wi-Fi battle: 2-4 sloths (people and/or CPUs), free-for-all - the last sloth
//    standing wins the round. This computer hosts; others join with the code.
(function () {
  const UI = SS.UI;
  const U = SS.U;
  const W = SS.W, H = SS.H;
  const ROUND_TIME = 60;
  const WINS_NEEDED = 2;
  const SNAP_RATE = 1 / 30;
  const PRESS_KEYS = ['jumpP', 'slapP', 'heavyP', 'specialP', 'shootP'];

  // ---------------------------------------------------------------- HUD (shared with Wi-Fi guests)
  // side = { tag, color, name, hp, mhp, ghost, meter, canSpecial, ammo, maxAmmo, ammoT, ammoRegen, wins, ko }
  SS.DuelHUD = {
    draw(ctx, m) {
      if (m.sides.length === 2) this.classic(ctx, m);
      else this.compact(ctx, m);
    },

    classic(ctx, m) {
      const bw = 360;
      m.sides.forEach((s, i) => {
        const flip = i === 1;
        const x = flip ? W - 30 - bw : 30;
        const frac = s.hp / s.mhp;
        UI.bar(ctx, x, 22, bw, 22, frac, frac > 0.3 ? '#52e07a' : '#ff4d6d', flip, s.ghost);
        const nx = flip ? x + bw : x;
        UI.outlineText(ctx, `${s.tag}  ${s.name}`, nx, 62, 18, s.color, flip ? 'right' : 'left');
        const mx = flip ? x + bw - 200 : x;
        UI.bar(ctx, mx, 78, 200, 8, s.meter / 100, s.canSpecial ? (Math.floor(m.t * 6) % 2 ? '#00f5d4' : '#fff') : '#00b4d8', flip);
        UI.ammo(ctx, flip ? x + bw : x, 100, s, flip ? 'right' : 'left');
        if (s.canSpecial) UI.text(ctx, 'SPECIAL READY', flip ? mx - 10 : mx + 210, 82, 12, '#00f5d4', flip ? 'right' : 'left');
        for (let k = 0; k < WINS_NEEDED; k++) {
          const px = flip ? x + bw - 250 - k * 22 : x + 250 + k * 22;
          ctx.fillStyle = k < s.wins ? '#ffd23f' : 'rgba(255,255,255,0.25)';
          SS.FX.star(ctx, px, 62, 9);
        }
      });
      UI.panel(ctx, W / 2 - 38, 12, 76, 52);
      UI.outlineText(ctx, String(Math.max(0, Math.ceil(m.timer))), W / 2, 39, 32, m.timer < 10 ? '#ff4d6d' : '#ffffff', 'center');
    },

    compact(ctx, m) {
      m.sides.forEach((s, i) => {
        const x = 12 + i * 236, w = 228;
        UI.panel(ctx, x, 8, w, 80);
        UI.outlineText(ctx, `${s.tag} ${s.name}`, x + 12, 24, 14, s.color);
        for (let k = 0; k < WINS_NEEDED; k++) {
          ctx.fillStyle = k < s.wins ? '#ffd23f' : 'rgba(255,255,255,0.25)';
          SS.FX.star(ctx, x + w - 40 + k * 20, 24, 8);
        }
        if (s.ko) {
          UI.text(ctx, 'SLAPPED OUT!', x + 12, 50, 14, '#ff4d6d');
        } else {
          const frac = s.hp / s.mhp;
          UI.bar(ctx, x + 12, 38, 170, 11, frac, frac > 0.3 ? '#52e07a' : '#ff4d6d', false, s.ghost);
          UI.text(ctx, `${Math.ceil(s.hp)}`, x + 190, 44, 12, '#fff');
          UI.bar(ctx, x + 12, 56, 170, 6, s.meter / 100, s.canSpecial ? (Math.floor(m.t * 6) % 2 ? '#00f5d4' : '#ffffff') : '#00b4d8');
          if (s.canSpecial) UI.text(ctx, 'SPECIAL', x + 190, 59, 10, '#00f5d4');
          UI.ammo(ctx, x + 12, 74, s);
        }
      });
      UI.panel(ctx, W / 2 - 34, 94, 68, 40);
      UI.outlineText(ctx, String(Math.max(0, Math.ceil(m.timer))), W / 2, 115, 26, m.timer < 10 ? '#ff4d6d' : '#ffffff', 'center');
    },

    banner(ctx, text, age) {
      if (!text) return;
      const s = age < 0.25 ? U.easeOutBack(Math.max(0, age) / 0.25) : 1;
      ctx.save();
      ctx.translate(W / 2, 230);
      ctx.scale(s, s);
      ctx.rotate(-0.05);
      const big = text === 'SLAP!';
      UI.outlineText(ctx, text, 0, 0, big ? 96 : text.length > 16 ? 48 : 66, big ? '#ff4d6d' : '#ffd23f', 'center');
      ctx.restore();
    },

    matchEnd(ctx, title, subtitle, stateT) {
      UI.fade(ctx, Math.min(0.5, stateT * 0.5));
      UI.outlineText(ctx, title, W / 2, 150, 60, '#ffd23f', 'center');
      UI.text(ctx, subtitle, W / 2, 200, 20, '#fff', 'center');
    },
  };

  // ---------------------------------------------------------------- the match
  SS.DuelScene = class {
    // opts: { p1, p2, vsCpu, cpuLevel, theme, gravity }                    one computer
    //       { net: true, players: [{ id, cid, local, cpu }], theme, gravity }  Wi-Fi battle host
    //         local = 'SOLO' | 'P1' | 'P2' (keys here), null = Wi-Fi player; cpu = CPU level (0-2)
    constructor(opts) {
      this.opts = opts;
      this.net = !!opts.net;
      this.theme = opts.theme || 'jungle';
      this.gravity = opts.gravity || 1;
      this.groundY = SS.GROUND_Y;
      this.platforms = [];
      this.fx = new SS.FX();
      if (this.net) { SS.Sync.wrapFX(this.fx); SS.Sync.installAudioHook(); }
      const list = opts.players || [
        { id: 0, cid: opts.p1, local: opts.vsCpu ? 'SOLO' : 'P1' },
        { id: 1, cid: opts.p2, local: opts.vsCpu ? null : 'P2', cpu: opts.vsCpu ? (opts.cpuLevel !== undefined ? opts.cpuLevel : 1) : undefined },
      ];
      this.slots = list.map((p) => this.makeSlot(p));
      this.pending = [];
      this.round = 0;
      this.t = 0;
      this.syncT = 0;
      this.showStrip = SS.Save.get('keyStrip', true);
      this.startRound();
    }

    makeSlot(p) {
      return {
        id: p.id, cid: p.cid, def: SS.charById(p.cid), local: p.local || null,
        cpuLevel: p.cpu, cpu: p.cpu !== undefined && p.cpu !== null ? new SS.CPU(p.cpu) : null,
        wins: 0, held: {}, presses: {}, inSeq: 0, ghost: 1, f: null,
      };
    }

    get f1() { return this.slots[0].f; }
    get f2() { return this.slots[1] ? this.slots[1].f : null; }
    get wins() { return this.slots.map((s) => s.wins); }
    get vsCpu() { return !this.net && this.slots.some((s) => s.cpu); }
    currentPlayers() { return this.slots.map((s) => ({ id: s.id, cid: s.cid, local: s.local, cpu: s.cpuLevel })); }

    tagOf(s) {
      if (!this.net && this.vsCpu) return s.cpu ? 'CPU' : 'YOU';
      return `P${this.slots.indexOf(s) + 1}`;
    }
    colorOf(s) { return SS.PLAYER_COLORS[this.slots.indexOf(s) % 4]; }

    enter() {
      SS.Audio.playMusic('duel');
      if (this.net) SS.Net.onMessage = (m, from) => this.onNet(m, from);
    }

    startRound() {
      // sloths who joined mid-match jump in now
      for (const p of this.pending) {
        if (this.slots.length < 4 && !this.slots.some((s) => s.id === p.id)) this.slots.push(this.makeSlot(p));
      }
      this.pending = [];
      this.round++;
      const n = this.slots.length;
      const gun = { ammo: 3, ammoRegen: 3 };
      this.slots.forEach((s, i) => {
        const x = n === 2 ? (i === 0 ? 290 : W - 290) : 150 + i * ((W - 300) / Math.max(1, n - 1));
        s.f = new SS.Fighter(s.def, x, Object.assign({ team: 'd' + s.id, facing: x < W / 2 ? 1 : -1, autoFace: true }, gun));
        s.ghost = 1;
        s.held = {};
        s.presses = {};
      });
      this.projectiles = [];
      this.timer = ROUND_TIME + (n > 2 ? 15 : 0);
      this.state = 'intro';
      this.stateT = 0;
      this.menu = null;
      this.banner = null;
      this.bannerAt = 0;
    }

    setBanner(text) { this.banner = text; this.bannerAt = this.stateT; }

    // ---------------- world interface ----------------
    bounds() { return { min: 20, max: W - 20 }; }
    targets(team) { return this.slots.filter((s) => s.f.team !== team && s.f.state !== 'ko').map((s) => s.f); }
    spawn(p) { this.projectiles.push(p); }
    opponentOf(f) {
      let best = null, bd = Infinity;
      for (const s of this.slots) {
        const o = s.f;
        if (o === f) continue;
        const d = Math.abs(o.x - f.x) + (o.state === 'ko' ? 5000 : 0);
        if (d < bd) { bd = d; best = o; }
      }
      return best;
    }
    faceTarget(f) { const o = this.opponentOf(f); return o ? o.x : null; }
    floorBelow() { return this.groundY; }

    controlsFor(s, dt) {
      if (s.cpu) return s.cpu.control(s.f, this.opponentOf(s.f), dt);
      if (s.local) return SS.readControls(SS.Controls[s.local]);
      const c = Object.assign({ left: false, right: false, down: false }, s.held, s.presses);
      s.presses = {};
      return c;
    }

    // ---------------- Wi-Fi messages (host side) ----------------
    onNet(m, from) {
      if (!m) return;
      if (from === 'server') {
        if (m.t === 'joined') {
          SS.Net.send({ t: 'welcome', inGame: true, mode: 'battle' }, m.id, true);
          this.fx.text(W / 2, 170, `A new player is joining...`, '#9bf6ff', 22);
        } else if (m.t === 'left') {
          const s = this.slots.find((q) => q.id === m.id);
          this.pending = this.pending.filter((p) => p.id !== m.id);
          if (s && this.slots.length > 1) {
            this.slots = this.slots.filter((q) => q !== s);
            this.fx.text(s.f.x, s.f.y - 150, `${s.def.name} left the battle`, '#cccccc', 20);
          }
        }
        return;
      }
      if (m.t === 'in') {
        const s = this.slots.find((q) => q.id === from);
        if (!s) return;
        if (m.n > s.inSeq) { s.inSeq = m.n; s.held = { left: !!m.l, right: !!m.r, down: !!m.d }; }
        for (const k of m.p || []) if (PRESS_KEYS.includes(k)) s.presses[k] = true;
      } else if (m.t === 'pick' && m.ready && !this.slots.some((s) => s.id === from) && !this.pending.some((p) => p.id === from)) {
        if (this.slots.length + this.pending.length >= 4) return;
        this.pending.push({ id: from, cid: m.cid, local: null });
        this.fx.text(W / 2, 170, `${SS.charById(m.cid).name} joins next round!`, '#9bf6ff', 22);
      }
    }

    // ---------------- update ----------------
    update(dt) {
      this.t += dt;
      this.stateT += dt;
      this.fx.update(dt);
      if (this.net) SS.Sync.capturing = true;
      try { this.step(dt); } finally { if (this.net) SS.Sync.capturing = false; }
      if (this.net && SS.Engine.scene === this) {
        this.syncT += dt;
        if (this.syncT >= SNAP_RATE) { this.syncT = 0; SS.Net.send(SS.Sync.duelSnapshot(this)); }
      }
    }

    step(dt) {
      if (this.showControls) {
        if (SS.Input.anyPressed()) { this.showControls = false; SS.Audio.select(); }
        return;
      }
      if (this.state === 'paused') {
        if (SS.Menu.pause()) { this.state = this.prevState; this.menu = null; return; }
        const item = this.menu.update(dt);
        if (item) item.act();
        return;
      }
      if (this.menu && this.stateT > 0.8) {
        const item = this.menu.update(dt);
        if (item) { item.act(); return; }
      }
      if ((this.state === 'fight' || this.state === 'intro') && SS.Menu.pause()) {
        this.pause();
        return;
      }

      const fighting = this.state === 'fight';
      for (const s of this.slots) {
        const c = fighting ? this.controlsFor(s, dt) : (s.presses = {}, {});
        s.f.update(dt, c, this);
      }
      this.separate();
      for (const p of this.projectiles) p.update(dt, this);
      this.projectiles = this.projectiles.filter((p) => !p.dead);

      // trailing "ghost" health for juicy damage feedback
      for (const s of this.slots) {
        const frac = s.f.hp / s.f.maxHp;
        s.ghost = frac < s.ghost ? Math.max(frac, s.ghost - dt * 0.4) : frac;
      }

      if (this.state === 'intro') {
        if (this.stateT > 0.1 && !this.banner) { this.setBanner(`ROUND ${this.round}`); SS.Audio.gong(); }
        if (this.stateT > 1.3 && this.banner !== 'SLAP!') { this.setBanner('SLAP!'); SS.Audio.bigSlap(); }
        if (this.stateT > 1.9) { this.state = 'fight'; this.stateT = 0; this.banner = null; }
      } else if (fighting) {
        this.timer -= dt;
        const standing = this.slots.filter((s) => s.f.state !== 'ko');
        if (standing.length <= 1) {
          this.endRound(standing.length ? standing[0] : null, 'ko');
        } else if (this.timer <= 0) {
          const frac = (s) => s.f.hp / s.f.maxHp;
          const sorted = standing.slice().sort((a, b) => frac(b) - frac(a));
          const tie = Math.abs(frac(sorted[0]) - frac(sorted[1])) < 0.001;
          this.endRound(tie ? null : sorted[0], 'time');
        }
      } else if (this.state === 'roundEnd') {
        if (this.stateT > 1.2 && this.roundWinner) {
          const w = this.roundWinner.f;
          if (w.state !== 'ko' && w.onGround) w.state = 'win';
        }
        if (this.stateT > 3) {
          if (this.slots.some((s) => s.wins >= WINS_NEEDED)) this.endMatch();
          else this.startRound();
        }
      }
    }

    // keep fighters from walking through each other
    separate() {
      const fs = this.slots.map((s) => s.f).filter((f) => f.state !== 'ko');
      for (let i = 0; i < fs.length; i++) {
        for (let j = i + 1; j < fs.length; j++) {
          const a = fs[i], b = fs[j];
          const minD = (a.w + b.w) * 0.42;
          const dx = b.x - a.x;
          const vertical = Math.abs(a.y - b.y) < Math.min(a.h, b.h) * 0.7;
          if (Math.abs(dx) < minD && vertical) {
            const push = (minD - Math.abs(dx)) / 2;
            const sgn = dx >= 0 ? 1 : -1;
            a.x = U.clamp(a.x - push * sgn, 20 + a.w / 2, W - 20 - a.w / 2);
            b.x = U.clamp(b.x + push * sgn, 20 + b.w / 2, W - 20 - b.w / 2);
          }
        }
      }
    }

    endRound(winner, how) {
      this.state = 'roundEnd';
      this.stateT = 0;
      this.roundWinner = winner;
      if (winner) winner.wins++;
      if (how === 'time') this.setBanner(winner ? 'TIME!' : 'DRAW!');
      else if (winner && winner.f.hp >= winner.f.maxHp) this.setBanner('FLAWLESS SLAP!');
      else if (!winner) this.setBanner('EVERYBODY SNOOZES!');
      else if (this.slots.length > 2) this.setBanner(`${this.tagOf(winner)} WINS THE ROUND!`);
      else this.setBanner('SLAPPED SILLY!');
      SS.Engine.freeze(0.25);
      this.fx.shake(18);
    }

    endMatch() {
      this.state = 'matchEnd';
      this.stateT = 0;
      const winner = this.slots.reduce((a, b) => (b.wins > a.wins ? b : a));
      this.matchWinner = winner;
      for (const s of this.slots) {
        if (s === winner) s.f.state = 'win';
        else if (s.f.state !== 'ko') s.f.state = 'ko';
      }
      this.banner = null;
      SS.Audio.win();
      const items = [{ label: 'Rematch!', act: () => this.rematch() }];
      if (this.net) {
        items.push({ label: 'Back to Lobby', act: () => this.backToLobby() });
        items.push({ label: 'End Wi-Fi Battle', act: () => this.quit() });
      } else {
        items.push({ label: 'Change Fighters', act: () => SS.Engine.setScene(new SS.SelectScene({ mode: 'duel', vsCpu: this.vsCpu })) });
        items.push({ label: 'Main Menu', act: () => this.quit() });
      }
      this.menu = new SS.MenuList(items, W / 2, 250, { w: 320, h: 48, gap: 12 });
    }

    matchTitle() {
      const w = this.matchWinner;
      if (!w) return '';
      if (!this.net && this.vsCpu) return w.cpu ? 'CPU WINS!' : 'YOU WIN!';
      return `${this.tagOf(w)} WINS!`;
    }

    rematch() {
      SS.Engine.setScene(new SS.DuelScene(Object.assign({}, this.opts, this.net ? { players: this.currentPlayers() } : {})));
    }

    backToLobby() {
      SS.Net.send({ t: 'toLobby' }, 'all', true);
      SS.Engine.setScene(new SS.LobbyScene({
        mode: 'battle', resume: true, stage: this.opts.stageIndex || 0,
        players: this.slots.map((s) => ({ id: s.id, cid: s.cid, ready: true, cpu: s.cpuLevel })),
      }));
    }

    quit() {
      if (this.net) SS.Net.leave();
      SS.Engine.setScene(new SS.MenuScene());
    }

    pause() {
      this.prevState = this.state;
      this.state = 'paused';
      this.menu = new SS.MenuList([
        { label: 'Resume', act: () => { this.state = this.prevState; this.menu = null; } },
        { label: 'Controls', act: () => { this.showControls = true; } },
        { label: () => SS.onscreenLabel(this), act: () => SS.cycleOnscreen(this) },
        this.net ? { label: 'Back to Lobby', act: () => this.backToLobby() }
          : { label: 'Restart Match', act: () => this.rematch() },
        { label: () => 'Sound: ' + (SS.Audio.muted ? 'OFF' : 'ON'), act: () => SS.Audio.toggleMute() },
        { label: this.net ? 'End Wi-Fi Battle' : 'Quit to Menu', act: () => this.quit() },
      ], W / 2, 190, { w: 340, h: 40, gap: 8 });
    }

    // ---------------- draw ----------------
    hudModel() {
      return {
        t: this.t, timer: this.timer,
        sides: this.slots.map((s) => {
          const f = s.f;
          return {
            tag: this.tagOf(s), color: this.colorOf(s), name: s.def.name, hp: f.hp, mhp: f.maxHp, ghost: s.ghost,
            meter: f.meter, canSpecial: f.canSpecial, ammo: f.ammo, maxAmmo: f.maxAmmo, ammoT: f.ammoT,
            ammoRegen: f.ammoRegen, wins: s.wins, ko: f.state === 'ko',
          };
        }),
      };
    }

    bannerAge() {
      if (this.state === 'intro') return this.stateT - this.bannerAt;
      return this.stateT - (this.bannerAt || 0);
    }

    wantsTouch() { return ['intro', 'fight', 'roundEnd'].includes(this.state) && !this.showControls; }
    touchPlayer() { const s = this.slots.find((q) => q.local); return s ? s.f : null; }

    draw(ctx) {
      const sh = this.fx.offset();
      SS.Art.background(ctx, this.theme, 400 + Math.sin(this.t * 0.2) * 40, this.t, this.groundY);
      ctx.save();
      ctx.translate(sh.x, sh.y);
      // markers above sloths in battles with 3+ or over Wi-Fi; attackers drawn on top
      const markers = this.net || this.slots.length > 2;
      const order = this.slots.slice().sort((a, b) => (a.f.state === 'attack') - (b.f.state === 'attack'));
      for (const s of order) {
        s.f.tag = markers ? this.tagOf(s) : null;
        s.f.tagColor = this.colorOf(s);
        s.f.draw(ctx, this);
      }
      for (const p of this.projectiles) p.draw(ctx);
      this.fx.draw(ctx);
      ctx.restore();
      if (SS.Art.isDark(this.theme)) {
        const lights = this.slots.map((s) => ({ x: s.f.x, y: s.f.y - s.f.h * 0.55, r: 240 }))
          .concat(this.projectiles.map((p) => ({ x: p.x, y: p.y, r: 60 })));
        SS.Art.darkness(ctx, lights, SS.Art.darkAlpha(this.theme));
      }

      SS.DuelHUD.draw(ctx, this.hudModel());
      if (this.showStrip && ['intro', 'fight', 'roundEnd'].includes(this.state)) this.drawKeyStrips(ctx);
      SS.DuelHUD.banner(ctx, this.banner, this.bannerAge());
      if (this.net && this.state === 'intro' && this.round === 1) {
        UI.outlineText(ctx, `Wi-Fi battle - join code ${SS.Net.code}`, W / 2, 150, 15, '#9bf6ff', 'center');
      }

      if (this.state === 'matchEnd') {
        SS.DuelHUD.matchEnd(ctx, this.matchTitle(), `${this.matchWinner.def.name} is the Supreme Slapper.`, this.stateT);
        this.menu.draw(ctx);
      }
      if (this.state === 'paused') {
        UI.fade(ctx, 0.55);
        if (this.showControls) { UI.controlsPanel(ctx); return; }
        UI.outlineText(ctx, 'PAUSED', W / 2, 150, 54, '#ffd23f', 'center');
        this.menu.draw(ctx);
      }
    }

    // Each local player's keys along the bottom.
    drawKeyStrips(ctx) {
      if (SS.Touch.enabled) return; // the touch buttons are the controls
      const locals = this.slots.filter((s) => s.local);
      if (locals.length === 1) {
        UI.keyStrip(ctx, locals[0].f, this.t, { tag: this.tagOf(locals[0]), tagColor: this.colorOf(locals[0]) });
        return;
      }
      locals.forEach((s, i) => UI.keyStrip(ctx, s.f, this.t, {
        layout: s.local === 'P2' ? 'p2' : 'p1', compact: true, x: i === 0 ? 16 : W - 16,
        align: i === 0 ? 'left' : 'right', tag: this.tagOf(s), tagColor: this.colorOf(s),
      }));
    }
  };
})();
