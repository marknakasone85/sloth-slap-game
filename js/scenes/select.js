// Character select, then level select (campaign) or opponent/difficulty/stage (duel).
(function () {
  const UI = SS.UI;
  const I = SS.Input;
  const W = SS.W, H = SS.H;
  const CARD_W = 160, CARD_H = 230, GAP = 18;
  const START_X = (W - (CARD_W * 5 + GAP * 4)) / 2;
  const CARD_Y = 96;

  const STAGES = [
    { name: 'Jungle Arena', theme: 'jungle' },
    { name: 'Banana Beach', theme: 'beach' },
    { name: 'Temple Ruins', theme: 'temple' },
    { name: 'Volcano Pit', theme: 'volcano' },
    { name: 'Crab Cove', theme: 'cove' },
    { name: 'Pizza Piazza', theme: 'italy' },
    { name: 'Lantern Valley', theme: 'china' },
    { name: 'Army Base', theme: 'military' },
  ];

  const P1KEYS = { left: ['KeyA', 'Pad0Left'], right: ['KeyD', 'Pad0Right'], ok: ['KeyF', 'Space', 'Pad0A'], back: ['KeyG', 'Pad0B'] };
  const P2KEYS = { left: ['ArrowLeft', 'Pad1Left'], right: ['ArrowRight', 'Pad1Right'], ok: ['Comma', 'Enter', 'Numpad1', 'Pad1A'], back: ['Period', 'Pad1B'] };

  SS.SelectScene = class {
    constructor(opts) {
      this.mode = opts.mode;
      this.vsCpu = !!opts.vsCpu;
      this.t = 0;
      this.phase = 'char';
      const last = SS.Save.get('lastPicks', [0, 2]);
      this.cur = [last[0] % SS.CHARACTERS.length, last[1] % SS.CHARACTERS.length];
      this.locked = [false, false];
      this.menu = null;
    }

    enter() { SS.Audio.playMusic('menu'); }

    get twoPlayerPick() { return ((this.mode === 'duel' && !this.vsCpu) || this.mode === 'coop') && this.phase === 'char'; }
    get bothShown() { return this.mode === 'duel' || this.mode === 'coop'; }

    cardRect(i) { return { x: START_X + i * (CARD_W + GAP), y: CARD_Y, w: CARD_W, h: CARD_H }; }

    clickedCard() {
      const p = I.pointer;
      if (!p.pressed) return -1;
      for (let i = 0; i < SS.CHARACTERS.length; i++) {
        const r = this.cardRect(i);
        if (p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h) return i;
      }
      return -1;
    }

    update(dt) {
      this.t += dt;
      const n = SS.CHARACTERS.length;

      if (this.menu) {
        if (this.phase === 'level') this.checkCheat();
        if (SS.Menu.back()) { SS.Audio.select(); this.goBack(); return; }
        const item = this.menu.update(dt);
        if (item) item.act();
        return;
      }

      if (this.twoPlayerPick) {
        [P1KEYS, P2KEYS].forEach((k, p) => {
          if (I.anyHit(k.back)) {
            if (this.locked[p]) { this.locked[p] = false; SS.Audio.select(); }
          }
          if (this.locked[p]) return;
          if (I.anyHit(k.left)) { this.cur[p] = (this.cur[p] - 1 + n) % n; SS.Audio.select(); }
          if (I.anyHit(k.right)) { this.cur[p] = (this.cur[p] + 1) % n; SS.Audio.select(); }
          if (I.anyHit(k.ok)) { this.locked[p] = true; SS.Audio.confirm(); }
        });
        const c = this.clickedCard();
        if (c >= 0) {
          const p = !this.locked[0] ? 0 : !this.locked[1] ? 1 : -1;
          if (p >= 0) { this.cur[p] = c; this.locked[p] = true; SS.Audio.confirm(); }
        }
        if (I.anyHit(['Escape', 'Backspace'])) {
          SS.Engine.setScene(this.mode === 'coop' ? new SS.CampaignModeScene() : new SS.MenuScene());
          return;
        }
        if (this.locked[0] && this.locked[1]) {
          if (this.mode === 'coop') this.openLevelMenu();
          else this.openStageMenu();
        }
        return;
      }

      // Single chooser (P1 for campaign; P1 picks for the CPU too)
      const p = this.phase === 'cpuChar' ? 1 : 0;
      if (SS.Menu.left()) { this.cur[p] = (this.cur[p] - 1 + n) % n; SS.Audio.select(); }
      if (SS.Menu.right()) { this.cur[p] = (this.cur[p] + 1) % n; SS.Audio.select(); }
      const c = this.clickedCard();
      if (c >= 0) this.cur[p] = c;
      if (SS.Menu.back()) { SS.Audio.select(); this.goBack(); return; }
      if (c >= 0 || SS.Menu.confirm()) {
        SS.Audio.confirm();
        this.locked[p] = true;
        if (this.mode === 'campaign') this.openLevelMenu();
        else if (this.mode === 'host') {
          this.savePicks();
          SS.Engine.setScene(new SS.LobbyScene({ cid: SS.CHARACTERS[this.cur[0]].id }));
        }
        else if (this.phase === 'char') this.phase = 'cpuChar';
        else this.openDifficultyMenu();
      }
    }

    goBack() {
      if (this.menu) {
        this.menu = null;
        if (this.mode === 'campaign') { this.phase = 'char'; this.locked[0] = false; }
        else if (this.vsCpu && this.phase === 'stage') { this.openDifficultyMenu(); }
        else if (this.vsCpu) { this.phase = 'cpuChar'; this.locked[1] = false; }
        else { this.phase = 'char'; this.locked = [false, false]; }
        return;
      }
      if (this.phase === 'cpuChar') { this.phase = 'char'; this.locked[0] = false; return; }
      SS.Engine.setScene(this.mode === 'duel' ? new SS.MenuScene() : new SS.CampaignModeScene());
    }

    savePicks() { SS.Save.set('lastPicks', this.cur); }

    // Secret: type S-L-O-T-H on the map screen to unlock every map.
    checkCheat() {
      for (const code of Object.keys(SS.Input.pressed)) {
        if (!code.startsWith('Key')) continue;
        this.typed = ((this.typed || '') + code.slice(3)).slice(-5);
        if (this.typed === 'SLOTH') {
          SS.Save.set('unlocked', SS.LEVELS.length);
          SS.Audio.win();
          this.cheated = 2;
          this.openLevelMenu();
        }
      }
    }

    openLevelMenu() {
      this.phase = 'level';
      const unlocked = SS.Save.get('unlocked', 1);
      const best = SS.Save.get('best', {});
      this.menu = new SS.MenuList(SS.LEVELS.map((lv, i) => ({
        label: i < unlocked
          ? `${i + 1}. ${lv.name}${best[i] ? '   (best ' + best[i] + ')' : ''}`
          : `${i + 1}. ???  (locked)`,
        act: () => {
          if (i >= unlocked) { SS.Audio.hurt(); return; }
          this.savePicks();
          const cid = (k) => SS.CHARACTERS[this.cur[k]].id;
          SS.Engine.setScene(new SS.CampaignScene(this.mode === 'coop'
            ? { level: i, mode: 'coop', players: [{ id: 0, cid: cid(0), local: 'P1' }, { id: 1, cid: cid(1), local: 'P2' }] }
            : { charId: cid(0), level: i }));
        },
      })), W / 2, 152, { w: 480, h: 38, gap: 7 });
    }

    openDifficultyMenu() {
      this.phase = 'difficulty';
      this.menu = new SS.MenuList(SS.CPU_LEVELS.map((lv, i) => ({
        label: `CPU: ${lv.name}`,
        act: () => { this.cpuLevel = i; this.openStageMenu(); },
      })), W / 2, 220, { w: 360, h: 50, gap: 14 });
      this.menu.sel = SS.Save.get('cpuLevel', 1);
    }

    openStageMenu() {
      this.phase = 'stage';
      if (this.cpuLevel !== undefined) SS.Save.set('cpuLevel', this.cpuLevel);
      this.menu = new SS.MenuList(STAGES.map((s) => ({
        label: s.name,
        act: () => {
          this.savePicks();
          SS.Engine.setScene(new SS.DuelScene({
            p1: SS.CHARACTERS[this.cur[0]].id,
            p2: SS.CHARACTERS[this.cur[1]].id,
            vsCpu: this.vsCpu,
            cpuLevel: this.cpuLevel !== undefined ? this.cpuLevel : 1,
            theme: s.theme,
          }));
        },
      })), W / 2, 158, { w: 360, h: 37, gap: 6 });
    }

    // ------------------------------------------------------------------
    draw(ctx) {
      SS.Art.background(ctx, this.mode === 'duel' ? 'temple' : 'jungle', this.t * 20, this.t, 470);
      ctx.fillStyle = 'rgba(20,10,30,0.35)';
      ctx.fillRect(0, 0, W, H);

      if (this.menu) {
        const titles = { level: 'CHOOSE A MAP', difficulty: 'HOW GRUMPY IS THE CPU?', stage: 'CHOOSE A STAGE' };
        UI.outlineText(ctx, titles[this.phase] || '', W / 2, 118, 38, '#ffd23f', 'center');
        if (this.cheated > 0) {
          this.cheated -= 1 / 60;
          UI.outlineText(ctx, 'ALL MAPS UNLOCKED!', W / 2, 74, 26, '#00f5d4', 'center');
        }
        this.menu.draw(ctx);
        this.drawPickedSloths(ctx);
        UI.text(ctx, 'Esc = back', W / 2, H - 16, 14, '#ddd', 'center');
        return;
      }

      const title = this.mode === 'campaign' || this.mode === 'host' ? 'CHOOSE YOUR SLOTH'
        : this.mode === 'coop' ? 'CHOOSE YOUR SLOTHS'
        : this.phase === 'cpuChar' ? 'CHOOSE YOUR OPPONENT' : 'CHOOSE YOUR FIGHTERS';
      UI.outlineText(ctx, title, W / 2, 50, 40, '#ffd23f', 'center');

      SS.CHARACTERS.forEach((c, i) => this.drawCard(ctx, c, i));

      const showP2 = this.bothShown && (this.phase === 'cpuChar' || this.twoPlayerPick);
      this.drawDetails(ctx, SS.CHARACTERS[this.cur[0]], showP2 && this.phase !== 'cpuChar' ? 160 : W / 2, '#ffd23f', 'P1');
      if (this.twoPlayerPick) this.drawDetails(ctx, SS.CHARACTERS[this.cur[1]], W - 160, '#00f5d4', 'P2');
      if (this.phase === 'cpuChar') {
        this.drawDetails(ctx, SS.CHARACTERS[this.cur[1]], W / 2, '#ff4d6d', 'CPU');
      }

      const hint = this.twoPlayerPick
        ? 'P1: A/D + F    P2: ←/→ + ,    (Esc = back)'
        : '←/→ to choose, Enter to pick, Esc = back';
      UI.text(ctx, hint, W / 2, H - 16, 14, '#ddd', 'center');
    }

    drawCard(ctx, c, i) {
      const r = this.cardRect(i);
      const p1 = this.cur[0] === i && this.phase !== 'cpuChar';
      const p2 = this.cur[1] === i && (this.twoPlayerPick || this.phase === 'cpuChar');
      const hl = p1 || p2;
      UI.panel(ctx, r.x, r.y, r.w, r.h, hl ? 'rgba(80,50,110,0.95)' : 'rgba(43,25,61,0.8)');
      if (p1) this.outline(ctx, r, '#ffd23f', this.locked[0], 0);
      if (p2) this.outline(ctx, r, this.phase === 'cpuChar' ? '#ff4d6d' : '#00f5d4', this.locked[1], p1 ? 6 : 0);
      const bounce = hl ? Math.abs(Math.sin(this.t * 5)) * -6 : 0;
      ctx.save();
      ctx.beginPath();
      ctx.rect(r.x, r.y, r.w, r.h);
      ctx.clip();
      SS.Art.sloth(ctx, {
        x: r.x + r.w / 2 - 6, y: r.y + 175 + bounce, scale: 1.05 / Math.max(1, c.scale * 0.9), look: c.look,
        t: this.t + i, pose: hl ? 'win' : 'idle',
      });
      ctx.restore();
      UI.outlineText(ctx, c.name, r.x + r.w / 2, r.y + r.h - 32, 16, '#ffffff', 'center');
      UI.text(ctx, c.specialName, r.x + r.w / 2, r.y + r.h - 12, 11, '#9bf6ff', 'center');
    }

    outline(ctx, r, color, locked, inset) {
      ctx.strokeStyle = color;
      ctx.lineWidth = locked ? 6 : 3 + Math.sin(this.t * 8) * 1.5;
      ctx.beginPath();
      ctx.roundRect(r.x + inset - 2, r.y + inset - 2, r.w - inset * 2 + 4, r.h - inset * 2 + 4, 16);
      ctx.stroke();
      if (locked) UI.outlineText(ctx, 'READY!', r.x + r.w / 2, r.y + 18 + inset * 3, 18, color, 'center');
    }

    drawDetails(ctx, c, cx, color, tag) {
      const y = CARD_Y + CARD_H + 22;
      const w = this.twoPlayerPick ? 300 : 520;
      UI.panel(ctx, cx - w / 2, y, w, 130);
      UI.outlineText(ctx, `${tag}: ${c.name}`, cx, y + 20, 20, color, 'center');
      UI.text(ctx, '"' + c.quip + '"', cx, y + 46, this.twoPlayerPick ? 11 : 14, '#eeeeee', 'center');
      const stats = [['Speed', c.speed / 260], ['Power', c.power / 1.4], ['Health', c.hp / 135]];
      stats.forEach(([label, v], i) => {
        const sy = y + 72 + i * 18;
        UI.text(ctx, label, cx - w / 2 + 24, sy, 13, '#ffd23f');
        UI.bar(ctx, cx - w / 2 + 100, sy - 5, w - 130, 9, v, color);
      });
    }

    drawPickedSloths(ctx) {
      const a = SS.CHARACTERS[this.cur[0]];
      SS.Art.sloth(ctx, { x: 120, y: 470, look: a.look, scale: 1.2 * a.scale, t: this.t, pose: 'idle' });
      if (this.bothShown) {
        const b = SS.CHARACTERS[this.cur[1]];
        SS.Art.sloth(ctx, { x: W - 120, y: 470, facing: -1, look: b.look, scale: 1.2 * b.scale, t: this.t + 2, pose: 'idle' });
      }
    }
  };
})();
