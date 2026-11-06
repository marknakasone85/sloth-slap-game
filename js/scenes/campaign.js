// Campaign: side-scrolling slap-'em-up through a map, ending at the nap hammock.
(function () {
  const UI = SS.UI;
  const U = SS.U;
  const W = SS.W, H = SS.H;

  SS.CampaignScene = class {
    constructor(opts) {
      this.opts = opts;
      this.levelIndex = opts.level;
      this.L = SS.LEVELS[opts.level];
      this.def = SS.charById(opts.charId);
      this.groundY = SS.GROUND_Y;
      this.fx = new SS.FX();
      this.platforms = this.L.platforms || [];
      this.t = 0;
      this.camX = 0;
      this.score = 0;
      this.bananas = 0;
      this.state = 'play'; // play | paused | dead | won
      this.stateT = 0;
      this.menu = null;
      this.showControls = false;
      this.showStrip = SS.Save.get('keyStrip', true);

      this.player = new SS.Fighter(this.def, 120, { team: 'player', mercy: 0.6 });
      this.enemies = this.L.enemies.map((e) => new SS.Enemy(e.type, e.x, e.y));
      this.crates = this.L.crates.map((c) => new SS.Crate(c.x, c.loot));
      this.gongs = (this.L.gongs || []).map((g) => new SS.Gong(g.id, g.x));
      this.gates = (this.L.gates || []).map((g) => ({ id: g.id, x: g.x, opened: false, lift: 0 }));
      this.pickups = (this.L.pickups || []).map((p) => new SS.Pickup(p.type, p.x, p.y));
      this.projectiles = [];
      this.goalX = this.L.length - 160;
      this.boss = null;
      if (this.L.boss) {
        this.boss = new SS.Enemy(this.L.boss.type, this.L.boss.x, this.L.boss.y);
        this.enemies.push(this.boss);
        this.arenaX = this.L.boss.x - 380;
      }
      this.bossAwake = false;
    }

    enter() { SS.Audio.playMusic(this.L.music); }

    // ---------------- world interface used by fighters/enemies ----------------
    limitsFor(x) {
      let min = 0, max = this.L.length;
      for (const g of this.gates) {
        if (g.opened) continue;
        if (g.x > x) max = Math.min(max, g.x - 26);
        else min = Math.max(min, g.x + 26);
      }
      return { min, max };
    }
    bounds(f) {
      const b = this.limitsFor(f.x);
      b.min = Math.max(b.min, this.camX - 10);
      if (this.bossAwake && this.boss.alive) b.min = Math.max(b.min, this.arenaX);
      return b;
    }
    enemyBounds(e) { const b = this.limitsFor(e.x); return { min: b.min + 20, max: b.max - 20 }; }
    targets(team) {
      if (team === 'enemy') return [this.player];
      return this.enemies.filter((e) => e.alive).concat(this.crates.filter((c) => c.alive), this.gongs);
    }
    spawn(p) { this.projectiles.push(p); }
    faceTarget(f) {
      let best = null, bd = 700;
      for (const e of this.enemies) {
        if (!e.alive) continue;
        const d = Math.abs(e.x - f.x);
        if (d < bd) { bd = d; best = e.x; }
      }
      return best;
    }
    floorBelow(x, y) {
      let best = this.groundY;
      for (const p of this.platforms) {
        if (x > p.x - 10 && x < p.x + p.w + 10 && p.y >= y - 1 && p.y < best) best = p.y;
      }
      return best;
    }
    onHit(attacker, target, hit, result) {
      if (result === 'hit' && attacker === this.player && !target.isProp) this.score += 10;
    }
    onEnemyKilled(e) {
      this.score += e.d.score;
      if (e === this.boss) {
        this.fx.text(e.x, e.y - 220, e.d.defeatText || `${e.d.name} DEFEATED!`, '#ffd23f', 36);
        this.fx.shake(20);
        SS.Audio.win();
      }
    }
    addPickup(type, x, y) { this.pickups.push(new SS.Pickup(type, x, y)); }
    openGate(id) {
      for (const g of this.gates) {
        if (g.id !== id) continue;
        g.opened = true;
        this.checkpoint = Math.max(this.checkpoint || 0, g.x + 60);
      }
    }

    // ---------------- update ----------------
    update(dt) {
      this.t += dt;
      this.stateT += dt;
      this.fx.update(dt);

      if (this.showControls) {
        if (SS.Input.anyPressed()) { this.showControls = false; SS.Audio.select(); }
        return;
      }
      if (this.menu) {
        if (this.state === 'paused' && SS.Menu.pause()) { this.resume(); return; }
        // Short delay so mashing slap doesn't instantly pick a menu item.
        if (this.state !== 'won' || this.stateT > 1.0) {
          const item = this.menu.update(dt);
          if (item) item.act();
        }
        if (this.state === 'paused') return;
      } else if (this.state === 'play' && SS.Menu.pause()) {
        this.pause();
        return;
      }

      const p = this.player;
      const ctrl = this.state === 'play' ? SS.readControls(SS.Controls.SOLO) : {};
      p.update(dt, ctrl, this);
      if (this.state === 'play') p.meter = Math.min(100, p.meter + dt * 3);

      for (const e of this.enemies) {
        if (e.alive && (e.x < this.camX - 300 || e.x > this.camX + W + 300)) continue;
        if (e === this.boss && !this.bossAwake) continue;
        e.update(dt, this, p);
      }
      this.enemies = this.enemies.filter((e) => e.alive || e.dying > 0);
      for (const c of this.crates) c.update(dt);
      for (const g of this.gongs) g.update(dt);
      for (const g of this.gates) if (g.opened) g.lift = Math.min(1, g.lift + dt * 1.5);
      for (const pr of this.projectiles) pr.update(dt, this);
      this.projectiles = this.projectiles.filter((pr) => !pr.dead);

      for (const pk of this.pickups) {
        pk.update(dt);
        if (!pk.taken && U.overlap(pk.box, p.box) && p.state !== 'ko') {
          pk.taken = true;
          if (pk.type === 'ammo') {
            p.ammo = p.maxAmmo;
            SS.Audio.ammo();
            this.fx.text(pk.x, pk.y - 40, 'AMMO FULL!', '#ffb703', 20);
          } else if (pk.type === 'banana') {
            this.bananas++;
            this.score += 50;
            SS.Audio.pickup();
            this.fx.text(pk.x, pk.y - 40, '+50', '#ffe14d', 20);
          } else {
            p.heal(30);
            SS.Audio.heal();
            this.fx.text(pk.x, pk.y - 40, '+30 HP', '#ff4d8d', 22);
          }
        }
      }
      this.pickups = this.pickups.filter((pk) => !pk.taken);

      // Boss arena
      if (this.boss && !this.bossAwake && p.x > this.arenaX + 100) {
        this.bossAwake = true;
        this.fx.text(this.boss.x - 100, 200, `${this.boss.d.name} APPEARS!`, '#ff4d6d', 34);
        SS.Audio.gong();
        SS.Audio.playMusic('duel');
      }

      // Camera
      let target = p.x - W * 0.38;
      if (this.bossAwake && this.boss.alive) target = Math.max(target, this.arenaX);
      target = U.clamp(target, 0, this.L.length - W);
      this.camX = U.lerp(this.camX, target, 1 - Math.pow(0.001, dt));

      // Win / lose
      const goalOpen = !this.boss || !this.boss.alive;
      if (this.state === 'play' && goalOpen && p.x > this.goalX - 40) this.win();
      if (this.state === 'play' && p.state === 'ko') {
        this.state = 'dead';
        this.stateT = 0;
      }
      if (this.state === 'dead' && this.stateT > 1.8 && !this.menu) {
        const items = [];
        if (this.checkpoint) items.push({ label: 'Continue from Checkpoint', act: () => this.respawn() });
        items.push(
          { label: 'Restart Map', act: () => this.restart() },
          { label: 'Choose Map', act: () => this.toSelect() },
          { label: 'Main Menu', act: () => SS.Engine.setScene(new SS.MenuScene()) },
        );
        this.menu = new SS.MenuList(items, W / 2, 270, { w: 340, h: 46, gap: 10 });
      }
    }

    win() {
      this.state = 'won';
      this.stateT = 0;
      const p = this.player;
      p.state = 'win';
      p.vx = 0;
      SS.Audio.win();
      this.hpBonus = Math.round(p.hp / p.maxHp * 500);
      this.score += this.hpBonus;
      const unlocked = SS.Save.get('unlocked', 1);
      SS.Save.set('unlocked', Math.max(unlocked, Math.min(SS.LEVELS.length, this.levelIndex + 2)));
      const best = SS.Save.get('best', {});
      if (!best[this.levelIndex] || this.score > best[this.levelIndex]) {
        best[this.levelIndex] = this.score;
        SS.Save.set('best', best);
        this.newBest = true;
      }
      const items = [];
      if (this.levelIndex + 1 < SS.LEVELS.length) {
        items.push({
          label: 'Next Map', act: () => SS.Engine.setScene(new SS.CampaignScene({ charId: this.def.id, level: this.levelIndex + 1 })),
        });
      }
      items.push({ label: 'Play Again', act: () => this.restart() });
      items.push({ label: 'Main Menu', act: () => SS.Engine.setScene(new SS.MenuScene()) });
      this.menu = new SS.MenuList(items, W / 2, 300, { w: 300, h: 46, gap: 10 });
    }

    pause() {
      this.state = 'paused';
      this.menu = new SS.MenuList([
        { label: 'Resume', act: () => this.resume() },
        { label: 'Controls', act: () => { this.showControls = true; } },
        {
          label: () => 'Key hints on screen: ' + (this.showStrip ? 'ON' : 'OFF'),
          act: () => { this.showStrip = !this.showStrip; SS.Save.set('keyStrip', this.showStrip); },
        },
        { label: () => 'Blood: ' + (SS.Settings.blood ? 'ON' : 'OFF (confetti)'), act: () => SS.toggleBlood() },
        { label: 'Restart Map', act: () => this.restart() },
        { label: () => 'Sound: ' + (SS.Audio.muted ? 'OFF' : 'ON'), act: () => SS.Audio.toggleMute() },
        { label: 'Quit to Menu', act: () => SS.Engine.setScene(new SS.MenuScene()) },
      ], W / 2, 184, { w: 340, h: 38, gap: 6 });
    }
    resume() { this.state = 'play'; this.menu = null; }

    // Come back at the last opened gate with full health (costs some score).
    respawn() {
      const p = new SS.Fighter(this.def, this.checkpoint, { team: 'player', mercy: 0.6 });
      p.invuln = 1.5;
      p.meter = 50;
      this.player = p;
      this.projectiles = [];
      this.score = Math.max(0, this.score - 300);
      this.camX = U.clamp(p.x - W * 0.38, 0, this.L.length - W);
      this.state = 'play';
      this.menu = null;
      this.fx.text(p.x, p.y - 160, 'BACK FROM THE NAP!', '#ffd23f', 28);
    }
    restart() { SS.Engine.setScene(new SS.CampaignScene(this.opts)); }
    toSelect() {
      const s = new SS.SelectScene({ mode: 'campaign' });
      SS.Engine.setScene(s);
      s.openLevelMenu();
    }

    // ---------------- draw ----------------
    draw(ctx) {
      const sh = this.fx.offset();
      SS.Art.background(ctx, this.L.theme, this.camX, this.t, this.groundY);

      ctx.save();
      ctx.translate(-Math.round(this.camX) + sh.x, sh.y);

      for (const pl of this.platforms) this.drawPlatform(ctx, pl);
      this.fx.drawDecals(ctx);
      if (!this.boss || !this.boss.alive) SS.Art.hammock(ctx, this.goalX + 60, this.groundY, this.t);
      for (const g of this.gongs) g.draw(ctx);
      for (const g of this.gates) SS.Art.gate(ctx, g.x, this.groundY, 200, { open: g.lift });
      for (const c of this.crates) c.draw(ctx);
      for (const pk of this.pickups) pk.draw(ctx);
      for (const e of this.enemies) e.draw(ctx, this);
      this.player.draw(ctx, this);
      for (const pr of this.projectiles) pr.draw(ctx);
      this.fx.draw(ctx);
      ctx.restore();

      this.drawHUD(ctx);

      if (this.t < 2.6) this.drawIntro(ctx);
      if (this.state === 'paused') {
        UI.fade(ctx, 0.55);
        if (this.showControls) { UI.controlsPanel(ctx); return; }
        UI.outlineText(ctx, 'PAUSED', W / 2, 128, 54, '#ffd23f', 'center');
        UI.text(ctx, 'The sloth appreciates the break.', W / 2, 166, 16, '#ddd', 'center');
      } else if (this.state === 'dead') {
        UI.fade(ctx, Math.min(0.6, this.stateT * 0.5));
        UI.outlineText(ctx, 'SNOOZED OUT!', W / 2, 180, 60, '#ff4d6d', 'center');
        UI.text(ctx, 'Even sloths need a nap sometimes.', W / 2, 228, 18, '#ffffff', 'center');
      } else if (this.state === 'won') {
        UI.fade(ctx, Math.min(0.55, this.stateT * 0.5));
        UI.outlineText(ctx, 'NAP ACHIEVED!', W / 2, 120, 60, '#ffd23f', 'center');
        UI.text(ctx, `Score ${this.score}    Bananas ${this.bananas}    Health bonus +${this.hpBonus}`, W / 2, 180, 20, '#fff', 'center');
        if (this.newBest) UI.outlineText(ctx, 'NEW BEST!', W / 2, 220, 26, '#00f5d4', 'center');
        if (this.levelIndex === SS.LEVELS.length - 1) {
          UI.text(ctx, 'You beat the campaign! The comfiest hammock is yours.', W / 2, 260, 18, '#ffd23f', 'center');
        }
      }
      if (this.menu) this.menu.draw(ctx);
    }

    drawPlatform(ctx, p) {
      ctx.fillStyle = '#6b4226';
      ctx.beginPath();
      ctx.roundRect(p.x, p.y, p.w, 16, 8);
      ctx.fill();
      ctx.fillStyle = '#52b788';
      for (let x = p.x + 10; x < p.x + p.w; x += 34) {
        ctx.beginPath();
        ctx.ellipse(x, p.y + 2, 14, 6, -0.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    drawIntro(ctx) {
      const a = this.t < 2 ? 1 : 1 - (this.t - 2) / 0.6;
      ctx.globalAlpha = Math.max(0, a);
      UI.panel(ctx, W / 2 - 300, 150, 600, 110);
      UI.outlineText(ctx, `MAP ${this.levelIndex + 1}: ${this.L.name.toUpperCase()}`, W / 2, 188, 34, '#ffd23f', 'center');
      UI.text(ctx, this.L.blurb, W / 2, 230, 17, '#ffffff', 'center');
      ctx.globalAlpha = 1;
    }

    drawHUD(ctx) {
      const p = this.player;
      UI.panel(ctx, 12, 10, 330, 96);
      UI.outlineText(ctx, this.def.name, 26, 28, 18, '#ffd23f');
      UI.bar(ctx, 26, 44, 220, 14, p.hp / p.maxHp, p.hp / p.maxHp > 0.3 ? '#52e07a' : '#ff4d6d');
      const full = p.canSpecial;
      UI.bar(ctx, 26, 66, 220, 9, p.meter / 100, full ? (Math.floor(this.t * 6) % 2 ? '#00f5d4' : '#ffffff') : '#00b4d8');
      UI.text(ctx, full ? 'SPECIAL! (H / L)' : 'special', 256, 70, 11, full ? '#00f5d4' : '#aaa');
      UI.text(ctx, `${Math.ceil(p.hp)}`, 256, 51, 14, '#fff');
      UI.ammo(ctx, 26, 90, p);

      UI.panel(ctx, W - 232, 10, 220, 58);
      UI.outlineText(ctx, `SCORE ${this.score}`, W - 122, 28, 18, '#ffffff', 'center');
      SS.Art.banana(ctx, W - 180, 62, 0);
      UI.text(ctx, `x ${this.bananas}`, W - 160, 50, 16, '#ffe14d');
      // progress toward the hammock
      const prog = U.clamp(p.x / this.goalX, 0, 1);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(W - 110, 48, 86, 5);
      ctx.fillStyle = '#ffd23f';
      ctx.fillRect(W - 110, 48, 86 * prog, 5);

      if (p.combo >= 3) {
        UI.outlineText(ctx, `${p.combo} SLAP COMBO!`, 26, 130, 22 + Math.min(14, p.combo), '#ff4d6d');
      }

      if (this.bossAwake && this.boss.alive) {
        UI.outlineText(ctx, this.boss.d.name, W / 2, 104, 20, '#ff4d6d', 'center');
        UI.bar(ctx, W / 2 - 200, 118, 400, 14, this.boss.hp / this.boss.maxHp, '#ff4d6d');
      }

      // Hint the player when a gate blocks the path
      const g = this.gates.find((gt) => !gt.opened && gt.x > p.x && gt.x - p.x < 160);
      if (g) UI.outlineText(ctx, 'Gate closed! Slap the GONG to open it.', W / 2, H - 62, 18, '#ffd23f', 'center');
      if (this.showStrip && this.state === 'play') UI.keyStrip(ctx, p, this.t);
    }
  };
})();
