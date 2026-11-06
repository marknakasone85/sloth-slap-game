// Wi-Fi battle, guest side: draws the host's Slapdown Duel and sends our button presses.
(function () {
  const UI = SS.UI;
  const W = SS.W, H = SS.H;

  SS.RemoteDuelScene = class {
    constructor() {
      this.t = 0;
      this.lastSeq = 0;
      this.snap = null;
      this.players = {};
      this.proj = [];
      this.fx = new SS.FX();
      this.groundY = SS.GROUND_Y;
      this.input = {};
      this.menu = null;
      this.ended = null;
      this.showControls = false;
      this.showStrip = SS.Save.get('keyStrip', true);
    }

    enter() {
      SS.Net.onMessage = (m) => this.onNet(m);
      SS.Audio.playMusic('duel');
    }

    floorBelow() { return this.groundY; }

    onNet(m) {
      if (!m) return;
      if (m.t === 'hostLeft') { this.end(m.reason || 'The host ended the battle.'); return; }
      if (m.t === 'toLobby') { SS.Engine.setScene(new SS.JoinScene({ rejoin: true })); return; }
      if (m.t !== 'snap') return;
      if (m.k !== 'duel') { // host switched to a campaign map
        const scene = new SS.RemoteScene({ level: m.lv });
        SS.Engine.setScene(scene);
        scene.onNet(m);
        return;
      }
      if (m.n <= this.lastSeq) return;
      this.lastSeq = m.n;
      this.snap = m;
      this.snapAt = performance.now();
      const seen = new Set();
      for (const p of m.pl) {
        seen.add(p.id);
        const cur = this.players[p.id];
        if (!cur || Math.abs(cur.x - p.x) > 220) this.players[p.id] = Object.assign({}, p, { tx: p.x, ty: p.y });
        else {
          const x = cur.x, y = cur.y;
          Object.assign(cur, p, { x, y, tx: p.x, ty: p.y });
        }
      }
      for (const id of Object.keys(this.players)) if (!seen.has(+id)) delete this.players[id];
      this.proj = m.pr.map(([kind, x, y, vx, vy]) => new SS.Projectile(kind, x, y, vx, vy, 'host', {}));
      SS.Sync.replay(this.fx, m);
    }

    end(reason) {
      this.ended = reason;
      SS.Net.leave();
      this.menu = new SS.MenuList([
        { label: 'Back to Menu', act: () => SS.Engine.setScene(new SS.MenuScene()) },
      ], W / 2, 300, { w: 300, h: 48 });
    }

    openMenu() {
      SS.Sync.sendInput(this.input, 0, {}); // let go of everything
      this.menu = new SS.MenuList([
        { label: 'Back to the battle', act: () => { this.menu = null; } },
        { label: 'Controls', act: () => { this.showControls = true; } },
        { label: () => SS.onscreenLabel(this), act: () => SS.cycleOnscreen(this) },
        { label: () => 'Sound: ' + (SS.Audio.muted ? 'OFF' : 'ON'), act: () => SS.Audio.toggleMute() },
        { label: 'Leave Wi-Fi Battle', act: () => { SS.Net.leave(); SS.Engine.setScene(new SS.MenuScene()); } },
      ], W / 2, 190, { w: 340, h: 40, gap: 8 });
    }

    me() { return this.snap && this.snap.pl.find((p) => p.id === SS.Net.id); }
    wantsTouch() { return !!this.snap && !this.menu && !this.ended && !this.showControls && ['intro', 'fight', 'roundEnd'].includes(this.snap.st); }
    touchPlayer() { const me = this.me(); return me ? { canSpecial: !!me.cs, ammo: me.am } : null; }

    update(dt) {
      this.t += dt;
      this.fx.update(dt);
      const k = 1 - Math.pow(0.0004, dt);
      for (const p of Object.values(this.players)) { p.x += (p.tx - p.x) * k; p.y += (p.ty - p.y) * k; }

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
      SS.Sync.sendInput(this.input, dt, SS.readControls(SS.Controls.SOLO));
    }

    draw(ctx) {
      const s = this.snap;
      if (!s) {
        SS.Art.background(ctx, 'jungle', 0, this.t, this.groundY);
        UI.outlineText(ctx, 'Waiting for the battle to start...', W / 2, H / 2, 28, '#ffffff', 'center');
        if (this.ended) { UI.text(ctx, this.ended, W / 2, H / 2 + 40, 16, '#ff4d6d', 'center'); this.menu.draw(ctx); }
        return;
      }
      const sh = this.fx.offset();
      SS.Art.background(ctx, s.th, 400 + Math.sin(this.t * 0.2) * 40, this.t, this.groundY);
      ctx.save();
      ctx.translate(sh.x, sh.y);
      const ps = Object.values(this.players).sort((a, b) => (a.st === 'attack') - (b.st === 'attack'));
      for (const p of ps) SS.Fighter.drawState(ctx, p, this);
      const ahead = Math.min(0.1, (performance.now() - this.snapAt) / 1000);
      for (const p of this.proj) {
        const x = p.x, y = p.y;
        p.x += p.vx * ahead; p.y += p.vy * ahead;
        p.draw(ctx);
        p.x = x; p.y = y;
      }
      this.fx.draw(ctx);
      ctx.restore();

      SS.DuelHUD.draw(ctx, {
        t: this.t, timer: s.timer,
        sides: s.pl.map((p) => ({
          tag: p.tag, color: p.tc, name: SS.charById(p.cid).name, hp: p.hp, mhp: p.mhp, ghost: p.gh,
          meter: p.me, canSpecial: !!p.cs, ammo: p.am, maxAmmo: p.mam, ammoT: p.amt, ammoRegen: p.amr,
          wins: p.wins, ko: p.st === 'ko',
        })),
      });
      const me = this.me();
      if (me && this.showStrip && !SS.Touch.enabled && !this.menu && ['intro', 'fight', 'roundEnd'].includes(s.st)) {
        UI.keyStrip(ctx, { move: me.mk ? { kind: me.mk } : null, state: me.st, onGround: !!me.og, canSpecial: !!me.cs, ammo: me.am },
          this.t, { tag: `YOU (${me.tag})`, tagColor: me.tc });
      }
      SS.DuelHUD.banner(ctx, s.bn, s.ba);
      if (!me && !this.ended) UI.outlineText(ctx, 'You will jump in next round!', W / 2, 170, 24, '#9bf6ff', 'center');
      if (me && this.t < 5 && s.st === 'intro') UI.outlineText(ctx, `You are ${me.tag}`, W / 2, 160, 26, me.tc, 'center');
      if (SS.Net.silence() > 6 && !this.ended) UI.outlineText(ctx, 'Reconnecting to the host...', W / 2, 300, 24, '#ff4d6d', 'center');

      if (s.st === 'matchEnd') {
        SS.DuelHUD.matchEnd(ctx, s.ttl, s.sub, s.stT);
        UI.text(ctx, 'Waiting for the host: rematch or back to the lobby...', W / 2, 260, 16, '#9bf6ff', 'center');
      }
      if (s.st === 'paused' && !this.menu) {
        UI.fade(ctx, 0.5);
        UI.outlineText(ctx, 'PAUSED', W / 2, 150, 54, '#ffd23f', 'center');
        UI.text(ctx, 'The host paused the battle.', W / 2, 190, 16, '#ddd', 'center');
      }
      if (this.showControls) { UI.fade(ctx, 0.55); UI.controlsPanel(ctx); return; }
      if (this.menu) {
        UI.fade(ctx, 0.55);
        if (this.ended) {
          UI.outlineText(ctx, 'BATTLE OVER', W / 2, 200, 48, '#ffd23f', 'center');
          UI.text(ctx, this.ended, W / 2, 250, 18, '#ffffff', 'center');
        } else {
          UI.outlineText(ctx, 'MENU', W / 2, 130, 44, '#ffd23f', 'center');
          UI.text(ctx, 'The battle keeps going for everyone else!', W / 2, 166, 15, '#dddddd', 'center');
        }
        this.menu.draw(ctx);
      }
    }
  };
})();
