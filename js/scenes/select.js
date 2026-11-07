// Character select, then level select (campaign) or opponent/difficulty/stage (duel).
(function () {
  const UI = SS.UI;
  const I = SS.Input;
  const W = SS.W, H = SS.H;
  // sloth cards: rows of 6 (11 sloths = 2 rows)
  const CARD_W = 146, CARD_H = 146, GAP = 8, PER_ROW = 6, ROW_GAP = 8;
  const CARD_Y = 60;
  const DETAILS_Y = CARD_Y + 2 * CARD_H + ROW_GAP + 10;
  // stat bars: how far each stat fills its bar (the extremes are the fastest / strongest sloths)
  const STAT_BARS = [
    ['Speed', (c) => c.speed / 400],
    ['Slap speed', (c) => ((c.atk || 1) - 0.45) / 1.05],
    ['Power', (c) => c.power / 1.8],
    ['Health', (c) => c.hp / 150],
  ];
  SS.STAT_BARS = STAT_BARS;

  const STAGES = (SS.STAGES = [
    { name: 'Jungle Arena', theme: 'jungle' },
    { name: 'Banana Beach', theme: 'beach' },
    { name: 'Temple Ruins', theme: 'temple' },
    { name: 'Volcano Pit', theme: 'volcano' },
    { name: 'Crab Cove', theme: 'cove' },
    { name: 'Pizza Piazza', theme: 'italy' },
    { name: 'Lantern Valley', theme: 'china' },
    { name: 'Army Base', theme: 'military' },
    { name: 'Mount Snoozemore', theme: 'mountain' },
    { name: 'Castle Kerfuffle', theme: 'castle' },
    { name: 'Lava Lagoon', theme: 'lava' },
    { name: 'Jurassic Jog', theme: 'dino' },
    { name: 'Space (low gravity!)', theme: 'space', gravity: 0.55 },
    { name: 'Capitol Plaza', theme: 'dc' },
    { name: 'Pyramid Sands', theme: 'egypt' },
    { name: 'Crystal Cave (dark!)', theme: 'cave' },
    { name: 'Big Apple Street', theme: 'nyc' },
  ]);

  const P1KEYS = { left: ['KeyA', 'Pad0Left'], right: ['KeyD', 'Pad0Right'], up: ['KeyW', 'Pad0Up'], down: ['KeyS', 'Pad0Down'], ok: ['KeyF', 'Space', 'Pad0A'], back: ['KeyG', 'Pad0B'] };
  const P2KEYS = { left: ['ArrowLeft', 'Pad1Left'], right: ['ArrowRight', 'Pad1Right'], up: ['ArrowUp', 'Pad1Up'], down: ['ArrowDown', 'Pad1Down'], ok: ['Comma', 'Enter', 'Numpad1', 'Pad1A'], back: ['Period', 'Pad1B'] };
  const rowMove = (cur, d, n) => { const t = cur + d * PER_ROW; return t >= 0 && t < n ? t : cur; };

  // Little colored tag: FAST / POWER / BALANCED
  function roleChip(ctx, role, x, y) {
    if (!role) return;
    const w = role.length * 7.5 + 12;
    ctx.fillStyle = SS.ROLE_COLORS[role] || '#ffffff';
    ctx.beginPath();
    ctx.roundRect(x, y, w, 17, 8);
    ctx.fill();
    UI.text(ctx, role, x + w / 2, y + 9, 11, '#2b193d', 'center');
  }
  SS.UI.roleChip = roleChip;

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

    cardRect(i) {
      const n = SS.CHARACTERS.length;
      const row = Math.floor(i / PER_ROW);
      const inRow = Math.min(PER_ROW, n - row * PER_ROW);
      const startX = (W - (inRow * CARD_W + (inRow - 1) * GAP)) / 2;
      return { x: startX + (i % PER_ROW) * (CARD_W + GAP), y: CARD_Y + row * (CARD_H + ROW_GAP), w: CARD_W, h: CARD_H };
    }

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

      if (UI.backTapped()) { SS.Audio.select(); this.goBack(); return; }
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
          if (I.anyHit(k.up)) { this.cur[p] = rowMove(this.cur[p], -1, n); SS.Audio.select(); }
          if (I.anyHit(k.down)) { this.cur[p] = rowMove(this.cur[p], 1, n); SS.Audio.select(); }
          if (I.anyHit(k.ok)) { this.locked[p] = true; SS.Audio.confirm(); }
        });
        const c = this.clickedCard();
        if (c >= 0) {
          const p = !this.locked[0] ? 0 : !this.locked[1] ? 1 : -1;
          if (p >= 0) { this.cur[p] = c; this.locked[p] = true; SS.Audio.confirm(); }
        }
        if (I.anyHit(['Escape', 'Backspace'])) {
          SS.Engine.setScene(new SS.CampaignModeScene({ kind: this.mode === 'coop' ? 'campaign' : 'duel' }));
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
      if (SS.Menu.up()) { this.cur[p] = rowMove(this.cur[p], -1, n); SS.Audio.select(); }
      if (SS.Menu.down()) { this.cur[p] = rowMove(this.cur[p], 1, n); SS.Audio.select(); }
      const c = this.clickedCard();
      if (c >= 0) this.cur[p] = c;
      if (SS.Menu.back()) { SS.Audio.select(); this.goBack(); return; }
      if (c >= 0 || SS.Menu.confirm()) {
        SS.Audio.confirm();
        this.locked[p] = true;
        if (this.mode === 'campaign') this.openLevelMenu();
        else if (this.mode === 'host' || this.mode === 'hostBattle') {
          this.savePicks();
          SS.Engine.setScene(new SS.LobbyScene({
            cid: SS.CHARACTERS[this.cur[0]].id, mode: this.mode === 'hostBattle' ? 'battle' : 'campaign',
          }));
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
      SS.Engine.setScene(new SS.CampaignModeScene({ kind: this.mode === 'duel' || this.mode === 'hostBattle' ? 'duel' : 'campaign' }));
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
      // every map can be chosen; beaten maps show a check mark and the best score
      const best = SS.Save.get('best', {});
      this.menu = new SS.MenuList(SS.LEVELS.map((lv, i) => ({
        label: `${i + 1}. ${lv.name}${best[i] ? '  \u2713 ' + best[i] : ''}`,
        act: () => {
          this.savePicks();
          const cid = (k) => SS.CHARACTERS[this.cur[k]].id;
          SS.Engine.setScene(new SS.CampaignScene(this.mode === 'coop'
            ? { level: i, mode: 'coop', players: [{ id: 0, cid: cid(0), local: 'P1' }, { id: 1, cid: cid(1), local: 'P2' }] }
            : { charId: cid(0), level: i }));
        },
      })), W / 2, 146, { w: 296, h: 40, gap: 8, cols: 3, gapX: 12, fontSize: 14 });
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
            theme: s.theme, gravity: s.gravity, stageIndex: STAGES.indexOf(s),
          }));
        },
      })), W / 2, 150, { w: 280, h: 40, gap: 8, cols: 3, gapX: 14, fontSize: 16 });
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
        this.drawPickedSloths(ctx); // behind the buttons
        this.menu.draw(ctx);
        UI.text(ctx, 'Esc = back', W / 2, H - 16, 14, '#ddd', 'center');
        UI.backButton(ctx);
        return;
      }

      const title = this.mode === 'campaign' || this.mode === 'host' || this.mode === 'hostBattle' ? 'CHOOSE YOUR SLOTH'
        : this.mode === 'coop' ? 'CHOOSE YOUR SLOTHS'
        : this.phase === 'cpuChar' ? 'CHOOSE YOUR OPPONENT' : 'CHOOSE YOUR FIGHTERS';
      UI.outlineText(ctx, title, W / 2, 36, 36, '#ffd23f', 'center');

      SS.CHARACTERS.forEach((c, i) => this.drawCard(ctx, c, i));

      const showP2 = this.bothShown && (this.phase === 'cpuChar' || this.twoPlayerPick);
      this.drawDetails(ctx, SS.CHARACTERS[this.cur[0]], showP2 && this.phase !== 'cpuChar' ? 160 : W / 2, '#ffd23f', 'P1');
      if (this.twoPlayerPick) this.drawDetails(ctx, SS.CHARACTERS[this.cur[1]], W - 160, '#00f5d4', 'P2');
      if (this.phase === 'cpuChar') {
        this.drawDetails(ctx, SS.CHARACTERS[this.cur[1]], W / 2, '#ff4d6d', 'CPU');
      }

      const hint = this.twoPlayerPick
        ? 'P1: W/A/S/D + F    P2: arrows + ,    (Esc = back)'
        : 'Arrow keys to choose, Enter to pick (or tap a sloth), Esc = back';
      UI.text(ctx, hint, W / 2, H - 16, 14, '#ddd', 'center');
      UI.backButton(ctx);
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
        x: r.x + r.w / 2 - 6, y: r.y + 122 + bounce, scale: 0.72 / Math.max(1, c.scale * 0.9), look: c.look,
        t: this.t + i, pose: hl ? 'win' : 'idle',
      });
      ctx.restore();
      const locked = (p1 && this.locked[0]) || (p2 && this.locked[1]);
      if (!locked) roleChip(ctx, c.role, r.x + 6, r.y + 6);
      UI.outlineText(ctx, c.name, r.x + r.w / 2, r.y + r.h - 22, 13, '#ffffff', 'center');
      UI.text(ctx, c.specialName, r.x + r.w / 2, r.y + r.h - 8, 10, '#9bf6ff', 'center');
    }

    outline(ctx, r, color, locked, inset) {
      ctx.strokeStyle = color;
      ctx.lineWidth = locked ? 6 : 3 + Math.sin(this.t * 8) * 1.5;
      ctx.beginPath();
      ctx.roundRect(r.x + inset - 2, r.y + inset - 2, r.w - inset * 2 + 4, r.h - inset * 2 + 4, 16);
      ctx.stroke();
      if (locked) UI.outlineText(ctx, 'READY!', r.x + r.w / 2, r.y + 16 + inset * 3, 16, color, 'center');
    }

    drawDetails(ctx, c, cx, color, tag) {
      const y = DETAILS_Y;
      const two = this.twoPlayerPick;
      const w = two ? 300 : 560;
      UI.panel(ctx, cx - w / 2, y, w, 140);
      UI.outlineText(ctx, `${tag}: ${c.name}`, cx, y + 16, 18, color, 'center');
      if (!two) roleChip(ctx, c.role, cx + w / 2 - 84, y + 8);
      UI.text(ctx, '"' + c.quip + '"', cx, y + 36, two ? 10 : 13, '#eeeeee', 'center');
      STAT_BARS.forEach(([label, f], i) => {
        const sy = y + 55 + i * 15;
        UI.text(ctx, label, cx - w / 2 + 20, sy, 12, '#ffd23f');
        UI.bar(ctx, cx - w / 2 + 96, sy - 4, w - 120, 8, Math.max(0.06, Math.min(1, f(c))), SS.ROLE_COLORS[c.role] || color);
      });
      UI.text(ctx, c.trait || '', cx, y + 127, two ? 10 : 13, '#9bf6ff', 'center');
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
