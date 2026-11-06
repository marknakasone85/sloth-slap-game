// Slapdown Duel: 1v1 fighting mode, best of 3 rounds, vs a friend or the CPU.
(function () {
  const UI = SS.UI;
  const U = SS.U;
  const W = SS.W, H = SS.H;
  const ROUND_TIME = 60;
  const WINS_NEEDED = 2;

  SS.DuelScene = class {
    constructor(opts) {
      this.opts = opts;
      this.d1 = SS.charById(opts.p1);
      this.d2 = SS.charById(opts.p2);
      this.theme = opts.theme || 'jungle';
      this.groundY = SS.GROUND_Y;
      this.platforms = [];
      this.fx = new SS.FX();
      this.wins = [0, 0];
      this.round = 0;
      this.t = 0;
      this.cpu = opts.vsCpu ? new SS.CPU(opts.cpuLevel) : null;
      this.showStrip = SS.Save.get('keyStrip', true);
      this.startRound();
    }

    enter() { SS.Audio.playMusic('duel'); }

    startRound() {
      this.round++;
      const gun = { ammo: 3, ammoRegen: 3 };
      this.f1 = new SS.Fighter(this.d1, 290, Object.assign({ team: 'p1', facing: 1, autoFace: true }, gun));
      this.f2 = new SS.Fighter(this.d2, W - 290, Object.assign({ team: 'p2', facing: -1, autoFace: true }, gun));
      this.ghost = [1, 1];
      this.projectiles = [];
      this.timer = ROUND_TIME;
      this.state = 'intro';
      this.stateT = 0;
      this.menu = null;
      this.banner = null;
    }

    // ---------------- world interface ----------------
    bounds() { return { min: 20, max: W - 20 }; }
    targets(team) { return team === 'p1' ? [this.f2] : [this.f1]; }
    spawn(p) { this.projectiles.push(p); }
    faceTarget(f) { return f === this.f1 ? this.f2.x : this.f1.x; }
    floorBelow() { return this.groundY; }

    // ---------------- update ----------------
    update(dt) {
      this.t += dt;
      this.stateT += dt;
      this.fx.update(dt);

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
      let c1 = {}, c2 = {};
      if (fighting) {
        if (this.cpu) {
          c1 = SS.readControls(SS.Controls.SOLO);
          c2 = this.cpu.control(this.f2, this.f1, dt);
        } else {
          c1 = SS.readControls(SS.Controls.P1);
          c2 = SS.readControls(SS.Controls.P2);
        }
      }
      this.f1.update(dt, c1, this);
      this.f2.update(dt, c2, this);
      this.separate();
      for (const p of this.projectiles) p.update(dt, this);
      this.projectiles = this.projectiles.filter((p) => !p.dead);

      // trailing "ghost" health for juicy damage feedback
      [this.f1, this.f2].forEach((f, i) => {
        const frac = f.hp / f.maxHp;
        this.ghost[i] = frac < this.ghost[i] ? Math.max(frac, this.ghost[i] - dt * 0.4) : frac;
      });

      if (this.state === 'intro') {
        if (this.stateT > 0.1 && !this.banner) { this.banner = `ROUND ${this.round}`; SS.Audio.gong(); }
        if (this.stateT > 1.3 && this.banner !== 'SLAP!') { this.banner = 'SLAP!'; SS.Audio.bigSlap(); }
        if (this.stateT > 1.9) { this.state = 'fight'; this.stateT = 0; this.banner = null; }
      } else if (fighting) {
        this.timer -= dt;
        const ko1 = this.f1.state === 'ko', ko2 = this.f2.state === 'ko';
        if (ko1 || ko2) this.endRound(ko1 && ko2 ? -1 : ko2 ? 0 : 1, 'ko');
        else if (this.timer <= 0) {
          const a = this.f1.hp / this.f1.maxHp, b = this.f2.hp / this.f2.maxHp;
          this.endRound(Math.abs(a - b) < 0.001 ? -1 : a > b ? 0 : 1, 'time');
        }
      } else if (this.state === 'roundEnd') {
        if (this.stateT > 1.2 && this.roundWinner >= 0) {
          const w = this.roundWinner === 0 ? this.f1 : this.f2;
          if (w.state !== 'ko' && w.onGround) w.state = 'win';
        }
        if (this.stateT > 3) {
          if (this.wins[0] >= WINS_NEEDED || this.wins[1] >= WINS_NEEDED) this.endMatch();
          else this.startRound();
        }
      }
    }

    // keep fighters from walking through each other
    separate() {
      const a = this.f1, b = this.f2;
      if (a.state === 'ko' || b.state === 'ko') return;
      const minD = (a.w + b.w) * 0.42;
      const dx = b.x - a.x;
      const vertical = Math.abs(a.y - b.y) < Math.min(a.h, b.h) * 0.7;
      if (Math.abs(dx) < minD && vertical) {
        const push = (minD - Math.abs(dx)) / 2;
        const s = dx >= 0 ? 1 : -1;
        a.x = U.clamp(a.x - push * s, 20 + a.w / 2, W - 20 - a.w / 2);
        b.x = U.clamp(b.x + push * s, 20 + b.w / 2, W - 20 - b.w / 2);
      }
    }

    endRound(winner, how) {
      this.state = 'roundEnd';
      this.stateT = 0;
      this.roundWinner = winner;
      if (winner >= 0) this.wins[winner]++;
      const wf = winner === 0 ? this.f1 : winner === 1 ? this.f2 : null;
      if (how === 'time') this.banner = winner < 0 ? 'DRAW!' : 'TIME!';
      else if (wf && wf.hp >= wf.maxHp) this.banner = 'FLAWLESS SLAP!';
      else this.banner = winner < 0 ? 'DOUBLE SNOOZE!' : 'SLAPPED SILLY!';
      SS.Engine.freeze(0.25);
      this.fx.shake(18);
    }

    endMatch() {
      this.state = 'matchEnd';
      this.stateT = 0;
      this.matchWinner = this.wins[0] > this.wins[1] ? 0 : 1;
      const wf = this.matchWinner === 0 ? this.f1 : this.f2;
      const lf = this.matchWinner === 0 ? this.f2 : this.f1;
      wf.state = 'win';
      if (lf.state !== 'ko') lf.state = 'ko';
      this.banner = null;
      SS.Audio.win();
      this.menu = new SS.MenuList([
        { label: 'Rematch!', act: () => SS.Engine.setScene(new SS.DuelScene(this.opts)) },
        { label: 'Change Fighters', act: () => SS.Engine.setScene(new SS.SelectScene({ mode: 'duel', vsCpu: !!this.cpu })) },
        { label: 'Main Menu', act: () => SS.Engine.setScene(new SS.MenuScene()) },
      ], W / 2, 250, { w: 320, h: 48, gap: 12 });
    }

    pause() {
      this.prevState = this.state;
      this.state = 'paused';
      this.menu = new SS.MenuList([
        { label: 'Resume', act: () => { this.state = this.prevState; this.menu = null; } },
        { label: 'Controls', act: () => { this.showControls = true; } },
        {
          label: () => 'Key hints on screen: ' + (this.showStrip ? 'ON' : 'OFF'),
          act: () => { this.showStrip = !this.showStrip; SS.Save.set('keyStrip', this.showStrip); },
        },
        { label: 'Restart Match', act: () => SS.Engine.setScene(new SS.DuelScene(this.opts)) },
        { label: () => 'Sound: ' + (SS.Audio.muted ? 'OFF' : 'ON'), act: () => SS.Audio.toggleMute() },
        { label: 'Quit to Menu', act: () => SS.Engine.setScene(new SS.MenuScene()) },
      ], W / 2, 190, { w: 340, h: 40, gap: 8 });
    }

    // ---------------- draw ----------------
    draw(ctx) {
      const sh = this.fx.offset();
      SS.Art.background(ctx, this.theme, 400 + Math.sin(this.t * 0.2) * 40, this.t, this.groundY);
      ctx.save();
      ctx.translate(sh.x, sh.y);
      // draw the attacker on top so slaps read clearly
      const order = this.f1.state === 'attack' ? [this.f2, this.f1] : [this.f1, this.f2];
      for (const f of order) f.draw(ctx, this);
      for (const p of this.projectiles) p.draw(ctx);
      this.fx.draw(ctx);
      ctx.restore();

      this.drawHUD(ctx);
      if (this.showStrip && ['intro', 'fight', 'roundEnd'].includes(this.state)) this.drawKeyStrips(ctx);

      if (this.banner) {
        const age = this.state === 'intro' ? (this.banner === 'SLAP!' ? this.stateT - 1.3 : this.stateT - 0.1) : this.stateT;
        const s = age < 0.25 ? U.easeOutBack(Math.max(0, age) / 0.25) : 1;
        ctx.save();
        ctx.translate(W / 2, 220);
        ctx.scale(s, s);
        ctx.rotate(-0.05);
        UI.outlineText(ctx, this.banner, 0, 0, this.banner === 'SLAP!' ? 96 : 66, this.banner === 'SLAP!' ? '#ff4d6d' : '#ffd23f', 'center');
        ctx.restore();
      }

      if (this.state === 'matchEnd') {
        UI.fade(ctx, Math.min(0.5, this.stateT * 0.5));
        const wd = this.matchWinner === 0 ? this.d1 : this.d2;
        const who = this.cpu ? (this.matchWinner === 0 ? 'YOU WIN!' : 'CPU WINS!') : `PLAYER ${this.matchWinner + 1} WINS!`;
        UI.outlineText(ctx, who, W / 2, 150, 60, '#ffd23f', 'center');
        UI.text(ctx, `${wd.name} is the Supreme Slapper.`, W / 2, 200, 20, '#fff', 'center');
        this.menu.draw(ctx);
      }
      if (this.state === 'paused') {
        UI.fade(ctx, 0.55);
        if (this.showControls) { UI.controlsPanel(ctx); return; }
        UI.outlineText(ctx, 'PAUSED', W / 2, 150, 54, '#ffd23f', 'center');
        this.menu.draw(ctx);
      }
    }

    // Each player's keys along the bottom: one strip vs the CPU, two side-by-side for 2 players.
    drawKeyStrips(ctx) {
      if (this.cpu) {
        UI.keyStrip(ctx, this.f1, this.t, { tag: 'YOU', tagColor: '#ffd23f' });
        return;
      }
      UI.keyStrip(ctx, this.f1, this.t, { layout: 'p1', compact: true, x: 16, align: 'left', tag: 'P1', tagColor: '#ffd23f' });
      UI.keyStrip(ctx, this.f2, this.t, { layout: 'p2', compact: true, x: W - 16, align: 'right', tag: 'P2', tagColor: '#00f5d4' });
    }

    drawHUD(ctx) {
      const bw = 360;
      const sides = [
        { f: this.f1, d: this.d1, x: 30, flip: false, color: '#ffd23f', tag: this.cpu ? 'YOU' : 'P1' },
        { f: this.f2, d: this.d2, x: W - 30 - bw, flip: true, color: '#00f5d4', tag: this.cpu ? 'CPU' : 'P2' },
      ];
      sides.forEach((s, i) => {
        const frac = s.f.hp / s.f.maxHp;
        UI.bar(ctx, s.x, 22, bw, 22, frac, frac > 0.3 ? '#52e07a' : '#ff4d6d', s.flip, this.ghost[i]);
        const align = s.flip ? 'right' : 'left';
        const nx = s.flip ? s.x + bw : s.x;
        UI.outlineText(ctx, `${s.tag}  ${s.d.name}`, nx, 62, 18, s.color, align);
        const mx = s.flip ? s.x + bw - 200 : s.x;
        const full = s.f.canSpecial;
        UI.bar(ctx, mx, 78, 200, 8, s.f.meter / 100, full ? (Math.floor(this.t * 6) % 2 ? '#00f5d4' : '#fff') : '#00b4d8', s.flip);
        UI.ammo(ctx, s.flip ? s.x + bw : s.x, 100, s.f, s.flip ? 'right' : 'left');
        if (full) UI.text(ctx, 'SPECIAL READY', s.flip ? mx - 10 : mx + 210, 82, 12, '#00f5d4', s.flip ? 'right' : 'left');
        // round-win pips
        for (let k = 0; k < WINS_NEEDED; k++) {
          const px = s.flip ? s.x + bw - 250 - k * 22 : s.x + 250 + k * 22;
          ctx.fillStyle = k < this.wins[i] ? '#ffd23f' : 'rgba(255,255,255,0.25)';
          SS.FX.star(ctx, px, 62, 9);
        }
      });
      UI.panel(ctx, W / 2 - 38, 12, 76, 52);
      UI.outlineText(ctx, String(Math.max(0, Math.ceil(this.timer))), W / 2, 39, 32, this.timer < 10 ? '#ff4d6d' : '#ffffff', 'center');
    }
  };
})();
