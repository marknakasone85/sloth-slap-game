// Campaign: side-scrolling slap-'em-up through a map, ending at the nap hammock.
// Supports 1 player, 2 players on one computer, and Wi-Fi co-op (this computer hosts, up to 4).
(function () {
  const U = SS.U;
  const UI = SS.UI;
  const W = SS.W;
  const RESPAWN_TIME = 5;     // seconds before a snoozed co-op player pops back in
  const SNAP_RATE = 1 / 30;   // Wi-Fi updates per second sent to guests
  const PRESS_KEYS = ['jumpP', 'slapP', 'heavyP', 'specialP', 'shootP'];

  SS.CampaignScene = class {
    // opts: { level, charId }                         solo
    //       { level, players: [{ id, cid, local }] }   local co-op / Wi-Fi host
    //         local = 'SOLO' | 'P1' | 'P2' (keys on this computer) or null (a Wi-Fi player)
    //       net: true when this computer is hosting a Wi-Fi game
    constructor(opts) {
      this.opts = opts;
      this.levelIndex = opts.level;
      this.L = SS.LEVELS[opts.level];
      this.net = !!opts.net;
      this.groundY = SS.GROUND_Y;
      this.gravity = this.L.gravity || 1; // space station = low gravity
      this.fx = new SS.FX();
      if (this.net) { SS.Sync.wrapFX(this.fx); SS.Sync.installAudioHook(); }
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
      this.syncT = 0;
      this.uid = 0;

      this.slots = [];
      const players = opts.players || [{ id: 0, cid: opts.charId, local: 'SOLO' }];
      players.forEach((pl, i) => this.addSlot(pl, 120 + i * 45));

      this.enemies = this.L.enemies.map((e) => this.tagEnemy(new SS.Enemy(e.type, e.x, e.y)));
      this.crates = this.L.crates.map((c) => new SS.Crate(c.x, c.loot));
      this.gongs = (this.L.gongs || []).map((g) => new SS.Gong(g.id, g.x));
      this.gates = (this.L.gates || []).map((g) => ({ id: g.id, x: g.x, opened: false, lift: 0 }));
      this.pickups = (this.L.pickups || []).map((p) => new SS.Pickup(p.type, p.x, p.y));
      this.projectiles = [];
      this.goalX = this.L.length - 160;
      this.boss = null;
      if (this.L.boss) {
        this.boss = this.tagEnemy(new SS.Enemy(this.L.boss.type, this.L.boss.x, this.L.boss.y));
        this.enemies.push(this.boss);
        this.arenaX = this.L.boss.x - 380;
      }
      this.bossAwake = false;
      this.placeHelpers();
      // More sloths = tougher enemies, so co-op stays a challenge.
      const n = players.length;
      if (n > 1) {
        for (const e of this.enemies) {
          if (e.d.behavior === 'flyer' || e.d.behavior === 'dangler') continue; // flyers stay one-hit
          const k = e.isBoss ? 1 + 0.5 * (n - 1) : 1 + 0.35 * (n - 1);
          e.hp = e.maxHp = Math.round(e.maxHp * k);
        }
      }
    }

    // ---------------- players ----------------
    get coop() { return this.slots.length > 1; }
    get fighters() { return this.slots.map((s) => s.f); }
    get player() { return this.slots[0].f; }
    aliveFighters() { return this.fighters.filter((f) => f.state !== 'ko'); }
    leader() {
      const alive = this.aliveFighters();
      const list = alive.length ? alive : this.fighters;
      return list.reduce((a, b) => (b.x > a.x ? b : a));
    }
    nearestFighter(x) {
      const alive = this.aliveFighters();
      const list = alive.length ? alive : this.fighters;
      return list.reduce((a, b) => (Math.abs(b.x - x) < Math.abs(a.x - x) ? b : a));
    }
    currentPlayers() { return this.slots.map((s) => ({ id: s.id, cid: s.cid, local: s.local })); }

    addSlot(pl, x) {
      const slot = {
        id: pl.id, cid: pl.cid, def: SS.charById(pl.cid), local: pl.local || null,
        respawnT: 0, waiting: false, held: {}, presses: {}, inSeq: 0,
      };
      this.slots.push(slot);
      this.spawnFighter(slot, x);
      return slot;
    }

    spawnFighter(slot, x, hpFrac = 1) {
      const f = new SS.Fighter(slot.def, x, { team: 'player', mercy: 0.8 });
      f.hp = f.maxHp * hpFrac;
      f.tagColor = SS.PLAYER_COLORS[slot.id % 4];
      slot.f = f;
      slot.respawnT = 0;
      slot.waiting = false;
      return f;
    }

    controlsFor(slot) {
      if (slot.local) return SS.readControls(SS.Controls[slot.local]);
      const c = Object.assign({ left: false, right: false, down: false }, slot.held, slot.presses);
      slot.presses = {};
      return c;
    }

    // A Wi-Fi player's buttons: held keys from the newest message, every press counts.
    netInput(id, m) {
      const slot = this.slots.find((s) => s.id === id);
      if (!slot) return;
      if (m.n > slot.inSeq) {
        slot.inSeq = m.n;
        slot.held = { left: !!m.l, right: !!m.r, down: !!m.d };
      }
      for (const k of m.p || []) if (PRESS_KEYS.includes(k)) slot.presses[k] = true;
    }

    tagEnemy(e) { e.uid = ++this.uid; return e; }

    // Hearts right after every gate (where you respawn) and before the boss,
    // plus two power-up bubbles per map (a different pair on each map).
    placeHelpers() {
      const add = (type, x) => this.pickups.push(new SS.Pickup(type, x, this.groundY - 6));
      for (const g of this.gates) add('heart', g.x + 140);
      if (this.boss) add('heart', this.arenaX - 120);
      const types = SS.POWER_TYPES;
      [0.3, 0.62].forEach((f, i) => {
        let x = this.L.length * f;
        for (const g of this.gates.concat(this.gongs)) if (Math.abs(g.x - x) < 90) x += 160;
        add(types[(this.levelIndex * 2 + i) % types.length], x);
      });
    }

    enter() {
      SS.Audio.playMusic(this.L.music);
      if (this.net) SS.Net.onMessage = (m, from) => this.onNet(m, from);
    }

    // The Wi-Fi connection came back with the same code: friends rejoin and drop in again.
    onRehosted() {
      this.slots = this.slots.filter((s) => s.local);
      this.fx.text(this.leader().x, 200, `Wi-Fi is back! Friends rejoin automatically (code ${SS.Net.code})`, '#9bf6ff', 20);
    }

    // ---------------- Wi-Fi messages (host side) ----------------
    onNet(m, from) {
      if (!m) return;
      if (from === 'server') {
        if (m.t === 'joined') {
          SS.Net.send({ t: 'welcome', inGame: true, level: this.levelIndex }, m.id, true);
          this.fx.text(this.leader().x, 200, `P${m.id + 1} is joining...`, SS.PLAYER_COLORS[m.id % 4], 22);
        } else if (m.t === 'left') {
          const slot = this.slots.find((s) => s.id === m.id);
          if (slot) {
            this.slots = this.slots.filter((s) => s !== slot);
            this.fx.text(slot.f.x, slot.f.y - 140, `P${m.id + 1} left the game`, '#cccccc', 22);
          }
        }
        return;
      }
      if (m.t === 'in') this.netInput(from, m);
      else if (m.t === 'pick' && m.ready && !this.slots.some((s) => s.id === from) && this.slots.length < 4) {
        // drop-in: appear next to the group
        const lead = this.leader();
        const slot = this.addSlot({ id: from, cid: m.cid, local: null }, lead.x - 50);
        slot.f.invuln = 2;
        this.fx.text(slot.f.x, slot.f.y - 150, `P${from + 1} JOINED!`, SS.PLAYER_COLORS[from % 4], 28);
        SS.Audio.powerUp();
      }
    }

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
      if (this.coop) {
        // everyone shares one screen
        b.min = Math.max(b.min, this.camX + 15);
        b.max = Math.min(b.max, this.camX + W - 15);
      }
      if (this.bossAwake && this.boss.alive) b.min = Math.max(b.min, this.arenaX);
      return b;
    }
    enemyBounds(e) {
      const b = this.limitsFor(e.x);
      const min = b.min + 20;
      // a fighting boss stays inside its arena (a charge used to carry it off-screen, where it got stuck)
      if (e === this.boss && this.bossAwake) return { min: Math.max(min, this.arenaX + e.d.w / 2), max: b.max - 20 };
      return { min, max: b.max - 20 };
    }
    targets(team) {
      if (team === 'enemy') return this.aliveFighters();
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
      if (result === 'hit' && !target.isProp && this.fighters.includes(attacker)) this.score += 10;
    }
    onEnemyKilled(e) {
      this.score += e.d.score;
      if (e === this.boss) {
        this.fx.text(e.x, e.y - 220, e.d.defeatText || `${e.d.name} DEFEATED!`, '#ffd23f', 36);
        this.fx.shake(20);
        this.fx.finisher(e.x, e.y - e.d.h * 0.5, true); // boss knockout in slow motion
        SS.Engine.slowmo(1.5, 0.25);
        SS.Audio.finisher();
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
      if (this.net) SS.Sync.capturing = true;
      try {
        this.step(dt);
      } finally {
        if (this.net) SS.Sync.capturing = false;
      }
      const realDt = SS.Engine.unscaled(dt); // Wi-Fi keeps real pace during slow motion
      if (this.net) SS.Net.maintain(realDt, () => this.onRehosted());
      if (this.net && SS.Engine.scene === this) {
        this.syncT += realDt;
        if (this.syncT >= SNAP_RATE) {
          this.syncT = 0;
          SS.Net.send(SS.Sync.snapshot(this));
        }
      }
    }

    step(dt) {
      if (this.showControls) {
        if (SS.Input.anyPressed()) { this.showControls = false; SS.Audio.select(); }
        return;
      }
      if (this.mapPicker) {
        if (SS.Menu.back()) { this.mapPicker = null; SS.Audio.select(); return; }
        const item = this.mapPicker.update(dt);
        if (item) item.act();
        return;
      }
      if (this.menu) {
        if (this.state === 'paused' && SS.Menu.pause()) { this.resume(); return; }
        // Short delay so mashing slap doesn't instantly pick a menu item.
        if (this.state !== 'won' || this.stateT > 1.0) {
          const item = this.menu.update(dt);
          if (item) { item.act(); if (SS.Engine.scene !== this) return; }
        }
        if (this.state === 'paused') return;
      } else if (this.state === 'play' && SS.Menu.pause()) {
        this.pause();
        return;
      }

      for (const slot of this.slots) {
        const ctrl = this.state === 'play' ? this.controlsFor(slot) : {};
        slot.f.update(dt, ctrl, this);
        if (this.state === 'play') slot.f.meter = Math.min(100, slot.f.meter + dt * 3);
      }
      this.updateRevives(dt);

      for (const e of this.enemies) {
        if (e === this.boss && !this.bossAwake) continue;
        // far-off enemies wait, but an awake boss always keeps fighting (so it can never get stuck off-screen)
        if (e.alive && e !== this.boss && (e.x < this.camX - 300 || e.x > this.camX + W + 300)) continue;
        e.update(dt, this, this.nearestFighter(e.x));
      }
      this.enemies = this.enemies.filter((e) => e.alive || e.dying > 0);
      for (const c of this.crates) c.update(dt);
      for (const g of this.gongs) g.update(dt);
      for (const g of this.gates) if (g.opened) g.lift = Math.min(1, g.lift + dt * 1.5);
      for (const pr of this.projectiles) pr.update(dt, this);
      this.projectiles = this.projectiles.filter((pr) => !pr.dead);

      const alive = this.aliveFighters();
      for (const pk of this.pickups) {
        pk.update(dt);
        if (pk.taken) continue;
        const f = alive.find((a) => U.overlap(pk.box, a.box));
        if (f) this.collect(pk, f);
      }
      this.pickups = this.pickups.filter((pk) => !pk.taken);

      // Boss arena
      if (this.boss && !this.bossAwake && this.leader().x > this.arenaX + 100) {
        this.bossAwake = true;
        this.fx.text(this.boss.x - 100, 200, `${this.boss.d.name} APPEARS!`, '#ff4d6d', 34);
        SS.Audio.gong();
        SS.Audio.playMusic('duel');
        for (const f of this.fighters) if (f.x < this.arenaX + 20) f.x = this.arenaX + 60; // bring stragglers along
      }

      // Camera: follow the player (solo) or the middle of the group (co-op)
      let target;
      if (this.coop) {
        const list = alive.length ? alive : this.fighters;
        target = list.reduce((s, f) => s + f.x, 0) / list.length - W / 2;
      } else {
        target = this.player.x - W * 0.38;
      }
      if (this.bossAwake && this.boss.alive) target = Math.max(target, this.arenaX);
      target = U.clamp(target, 0, this.L.length - W);
      this.camX = U.lerp(this.camX, target, 1 - Math.pow(0.001, dt));

      // Win / lose
      const goalOpen = !this.boss || !this.boss.alive;
      if (this.state === 'play' && goalOpen && alive.some((f) => f.x > this.goalX - 40)) this.win();
      if (this.state === 'play' && alive.length === 0) {
        this.state = 'dead';
        this.stateT = 0;
      }
      if (this.state === 'dead' && this.stateT > 1.8 && !this.menu) {
        const items = [];
        if (this.checkpoint) items.push({ label: 'Continue from Checkpoint', act: () => this.respawn() });
        items.push({ label: 'Restart Map', act: () => this.restart() });
        items.push({ label: 'Choose Another Map', act: () => this.openMapPicker() });
        if (this.net) items.push({ label: 'Back to Lobby', act: () => this.backToLobby() });
        items.push({ label: this.net ? 'End Wi-Fi Game' : 'Main Menu', act: () => this.quit() });
        this.menu = new SS.MenuList(items, W / 2, 262, { w: 340, h: 42, gap: 8 });
      }
    }

    // Co-op: a snoozed sloth pops back in next to a teammate after a few seconds.
    updateRevives(dt) {
      if (!this.coop || this.state !== 'play') return;
      const alive = this.aliveFighters();
      if (!alive.length) return;
      for (const slot of this.slots) {
        if (slot.f.state !== 'ko') continue;
        if (!slot.waiting) {
          slot.waiting = true;
          slot.respawnT = RESPAWN_TIME;
          this.fx.text(slot.f.x, slot.f.y - 120, `P${slot.id + 1} snoozed! Back in ${RESPAWN_TIME}...`, '#bde0fe', 20);
          continue;
        }
        slot.respawnT -= dt;
        if (slot.respawnT <= 0) {
          const mate = alive[Math.floor(Math.random() * alive.length)];
          const f = this.spawnFighter(slot, mate.x - 50 * mate.facing, 0.5);
          f.y = mate.y - 60;
          f.vy = -300;
          f.onGround = false;
          f.invuln = 2;
          this.fx.text(f.x, f.y - 140, `P${slot.id + 1} IS BACK!`, SS.PLAYER_COLORS[slot.id % 4], 26);
          SS.Audio.powerUp();
        }
      }
    }

    collect(pk, f) {
      pk.taken = true;
      if (pk.type === 'heart') {
        f.heal(50);
        SS.Audio.heal();
        this.fx.text(pk.x, pk.y - 50, '+50 HP', '#ff4d6d', 24);
      } else if (pk.type === 'leaf') {
        f.heal(10);
        SS.Audio.pickup();
        this.fx.text(pk.x, pk.y - 40, 'leafy snack +10', '#52e07a', 18);
      } else if (SS.POWER_TYPES.includes(pk.type)) {
        f.powerUp(pk.type);
        SS.Audio.powerUp();
        this.fx.burst(pk.x, pk.y - 24, SS.Art.POWER_COLORS[pk.type], 20, 300);
        this.fx.text(pk.x, pk.y - 70, SS.POWER_NAMES[pk.type], SS.Art.POWER_COLORS[pk.type], 26);
      } else if (pk.type === 'ammo') {
        f.ammo = f.maxAmmo;
        SS.Audio.ammo();
        this.fx.text(pk.x, pk.y - 40, 'AMMO FULL!', '#ffb703', 20);
      } else if (pk.type === 'banana') {
        this.bananas++;
        this.score += 50;
        SS.Audio.pickup();
        this.fx.text(pk.x, pk.y - 40, '+50', '#ffe14d', 20);
      } else {
        f.heal(30);
        SS.Audio.heal();
        this.fx.text(pk.x, pk.y - 40, '+30 HP', '#ff4d8d', 22);
      }
    }

    win() {
      this.state = 'won';
      this.stateT = 0;
      const fs = this.fighters;
      for (const f of fs) { f.state = 'win'; f.vx = 0; }
      SS.Audio.win();
      this.hpBonus = Math.round((fs.reduce((s, f) => s + Math.max(0, f.hp) / f.maxHp, 0) / fs.length) * 500);
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
      if (this.levelIndex + 1 < SS.LEVELS.length) items.push({ label: 'Next Map', act: () => this.goLevel(this.levelIndex + 1) });
      items.push({ label: 'Choose Another Map', act: () => this.openMapPicker() });
      items.push({ label: 'Play Again', act: () => this.restart() });
      if (this.net) items.push({ label: 'Back to Lobby', act: () => this.backToLobby() });
      items.push({ label: this.net ? 'End Wi-Fi Game' : 'Main Menu', act: () => this.quit() });
      this.menu = new SS.MenuList(items, W / 2, 290, { w: 320, h: 40, gap: 7 });
    }

    pause() {
      this.state = 'paused';
      this.menu = new SS.MenuList([
        { label: 'Resume', act: () => this.resume() },
        { label: 'Choose Another Map', act: () => this.openMapPicker() },
        { label: 'Controls', act: () => { this.showControls = true; } },
        { label: () => SS.onscreenLabel(this), act: () => SS.cycleOnscreen(this) },
        { label: () => 'Blood: ' + (SS.Settings.blood ? 'ON' : 'OFF (confetti)'), act: () => SS.toggleBlood() },
        { label: 'Restart Map', act: () => this.restart() },
        { label: () => 'Sound: ' + (SS.Audio.muted ? 'OFF' : 'ON'), act: () => SS.Audio.toggleMute() },
        { label: this.net ? 'End Wi-Fi Game' : 'Quit to Menu', act: () => this.quit() },
      ], W / 2, 182, { w: 340, h: 34, gap: 5 });
    }
    resume() { this.state = 'play'; this.menu = null; }

    // Full list of all maps; picking one starts it with the same players (Wi-Fi guests follow).
    openMapPicker() {
      SS.Audio.select();
      const best = SS.Save.get('best', {});
      this.mapPicker = new SS.MenuList(SS.LEVELS.map((lv, i) => ({
        label: `${i + 1}. ${lv.name}${best[i] ? '  \u2713' : ''}`,
        act: () => this.goLevel(i),
      })), W / 2, 112, { w: 290, h: 40, gap: 8, cols: 3, gapX: 12, fontSize: 15 });
      this.mapPicker.sel = this.levelIndex;
    }

    // Everyone comes back at the last opened gate with full health (costs some score).
    respawn() {
      this.slots.forEach((slot, i) => {
        const f = this.spawnFighter(slot, this.checkpoint + i * 45);
        f.invuln = 1.5;
        f.meter = 50;
      });
      this.projectiles = [];
      this.score = Math.max(0, this.score - 300);
      const lead = this.leader();
      this.camX = U.clamp(lead.x - (this.coop ? W / 2 : W * 0.38), 0, this.L.length - W);
      this.state = 'play';
      this.menu = null;
      this.fx.text(lead.x, lead.y - 160, 'BACK FROM THE NAP!', '#ffd23f', 28);
    }
    goLevel(i) {
      SS.Engine.setScene(new SS.CampaignScene(Object.assign({}, this.opts, { level: i, players: this.currentPlayers() })));
    }
    restart() { this.goLevel(this.levelIndex); }
    backToLobby() {
      SS.Net.send({ t: 'toLobby' }, 'all', true);
      SS.Engine.setScene(new SS.LobbyScene({
        mode: 'campaign', resume: true, level: Math.min(this.levelIndex + (this.state === 'won' ? 1 : 0), SS.LEVELS.length - 1),
        players: this.slots.map((s) => ({ id: s.id, cid: s.cid, ready: true })),
      }));
    }
    quit() {
      if (this.net) SS.Net.leave();
      SS.Engine.setScene(new SS.MenuScene());
    }
    toSelect() {
      const coop = this.slots.length > 1;
      const s = new SS.SelectScene({ mode: coop ? 'coop' : 'campaign' });
      const idx = (cid) => SS.CHARACTERS.findIndex((c) => c.id === cid);
      s.cur = [idx(this.slots[0].cid), coop ? idx(this.slots[1].cid) : s.cur[1]];
      SS.Engine.setScene(s);
      s.openLevelMenu();
    }

    // touch buttons: only while actually playing
    wantsTouch() { return this.state === 'play' && !this.menu && !this.showControls; }
    touchPlayer() { const s = this.slots.find((x) => x.local); return s ? s.f : null; }

    // ---------------- draw ----------------
    hudModel() {
      const lead = this.leader();
      const players = this.slots.map((s) => {
        const f = s.f;
        return {
          tag: `P${s.id + 1}`, color: SS.PLAYER_COLORS[s.id % 4], name: s.def.name,
          hp: f.hp, mhp: f.maxHp, meter: f.meter, canSpecial: f.canSpecial, ammo: f.ammo, maxAmmo: f.maxAmmo,
          ammoT: f.ammoT, ammoRegen: f.ammoRegen, powers: f.powers, lucky: f.lucky,
          respawnT: s.respawnT, ko: f.state === 'ko', combo: f.combo,
        };
      });
      const strips = [];
      if (this.showStrip && this.state === 'play' && !SS.Touch.enabled) {
        const locals = this.slots.filter((s) => s.local);
        if (locals.length === 1) strips.push({ fighter: locals[0].f, opts: {} });
        else {
          locals.forEach((s, i) => strips.push({
            fighter: s.f,
            opts: {
              layout: s.local === 'P2' ? 'p2' : 'p1', compact: true, x: i === 0 ? 16 : W - 16,
              align: i === 0 ? 'left' : 'right', tag: `P${s.id + 1}`, tagColor: SS.PLAYER_COLORS[s.id % 4],
            },
          }));
        }
      }
      return {
        t: this.t, coop: this.coop, players, score: this.score, bananas: this.bananas,
        net: this.net ? SS.Net.hudInfo() : null,
        progress: lead.x / this.goalX,
        boss: this.bossAwake && this.boss.alive ? { name: this.boss.d.name, frac: this.boss.hp / this.boss.maxHp } : null,
        gateHint: !!this.gates.find((gt) => !gt.opened && gt.x > lead.x && gt.x - lead.x < 160),
        strips,
      };
    }

    draw(ctx) {
      const sh = this.fx.offset();
      ctx.save();
      this.fx.camera(ctx, this.camX); // finisher zoom
      SS.Art.background(ctx, this.L.theme, this.camX, this.t, this.groundY);

      ctx.save();
      ctx.translate(-Math.round(this.camX) + sh.x, sh.y);
      for (const pl of this.platforms) SS.drawPlatform(ctx, pl);
      SS.drawProps(ctx, this.L, this.groundY, this.t);
      this.fx.drawDecals(ctx);
      if (!this.boss || !this.boss.alive) SS.Art.hammock(ctx, this.goalX + 60, this.groundY, this.t);
      for (const g of this.gongs) g.draw(ctx);
      for (const g of this.gates) SS.Art.gate(ctx, g.x, this.groundY, 200, { open: g.lift });
      for (const c of this.crates) c.draw(ctx);
      for (const pk of this.pickups) pk.draw(ctx);
      for (const e of this.enemies) e.draw(ctx, this);
      // snoozed sloths underneath, everyone else on top; co-op shows P1..P4 markers
      const order = this.slots.slice().sort((a, b) => (a.f.state === 'ko') - (b.f.state === 'ko')).reverse();
      for (const s of order) {
        s.f.tag = this.coop ? `P${s.id + 1}` : null;
        s.f.draw(ctx, this);
      }
      for (const pr of this.projectiles) pr.draw(ctx);
      this.fx.draw(ctx);
      ctx.restore();
      if (SS.Art.isDark(this.L.theme)) {
        // cave: light only around the sloths (and their shots)
        const lights = this.fighters.map((f) => ({ x: f.x - this.camX, y: f.y - f.h * 0.55, r: 230 }))
          .concat(this.projectiles.map((p) => ({ x: p.x - this.camX, y: p.y, r: 60 })));
        SS.Art.darkness(ctx, lights, SS.Art.darkAlpha(this.L.theme));
      }
      ctx.restore();
      this.fx.drawFinisher(ctx, this.camX);

      SS.CampaignHUD.draw(ctx, this.hudModel());
      SS.CampaignHUD.overlays(ctx, {
        state: this.state, stateT: this.stateT, t: this.t, levelIndex: this.levelIndex, L: this.L,
        score: this.score, bananas: this.bananas, hpBonus: this.hpBonus, newBest: this.newBest,
        coop: this.coop, guest: false, showControls: this.showControls,
      });
      if (this.menu && !this.showControls && !this.mapPicker) this.menu.draw(ctx);
      if (this.mapPicker) {
        UI.fade(ctx, 0.92);
        UI.outlineText(ctx, 'CHOOSE A MAP', W / 2, 74, 36, '#ffd23f', 'center');
        this.mapPicker.draw(ctx);
        UI.text(ctx, (this.net ? 'Everyone in the Wi-Fi game moves to the map you pick.   ' : '') +
          'Arrow keys + Enter, or click / tap a map.   Esc = back', W / 2, SS.H - 24, 14, '#9bf6ff', 'center');
      }
    }
  };

  // Map decorations such as the time machine (shared with the Wi-Fi guest view)
  SS.drawProps = function (ctx, L, groundY, t) {
    for (const p of L.props || []) {
      if (p.type === 'timeMachine') SS.Art.timeMachine(ctx, p.x, groundY, t);
    }
  };

  // Wooden branch platform (shared with the Wi-Fi guest view)
  SS.drawPlatform = function (ctx, p) {
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
  };
})();
