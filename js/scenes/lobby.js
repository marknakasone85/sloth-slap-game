// "How do you want to play?" menus (Campaign / Slapdown Duel), the Wi-Fi lobby
// (host: co-op campaign or battle) and the join screen (guest).
(function () {
  const UI = SS.UI;
  const I = SS.Input;
  const W = SS.W, H = SS.H;
  const MAX_PLAYERS = 4;
  const isLocalhost = () => ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  const webOnly = () => !!window.SS_WEB_ONLY; // the web (artifact) version has no Wi-Fi play
  const WEB_ONLY_INFO = [
    'Wi-Fi games need the home version',
    'This web version has no Wi-Fi play. On the computer with the',
    'game folder, double-click share-on-network.command, then',
    'everyone opens the address its window shows.',
  ];

  function bg(ctx, t, theme = 'jungle') {
    SS.Art.background(ctx, theme, t * 20, t, 470);
    ctx.fillStyle = 'rgba(20,10,30,0.45)';
    ctx.fillRect(0, 0, W, H);
  }

  function slothCard(ctx, x, y, cid, tag, color, label, t) {
    UI.panel(ctx, x - 90, y - 150, 180, 200);
    if (cid) {
      const c = SS.charById(cid);
      SS.Art.sloth(ctx, { x, y, look: c.look, scale: 0.95, t, pose: 'idle' });
      UI.outlineText(ctx, c.name, x, y + 18, 14, '#fff', 'center');
    } else {
      UI.outlineText(ctx, '?', x, y - 60, 60, 'rgba(255,255,255,0.4)', 'center');
    }
    UI.outlineText(ctx, tag, x, y - 132, 18, color, 'center');
    UI.text(ctx, label, x, y + 38, 13, label === 'READY!' || label === 'CPU' ? '#52e07a' : '#cccccc', 'center');
  }

  // ---------------------------------------------------------------- mode menus
  // kind: 'campaign' or 'duel'
  SS.CampaignModeScene = class {
    constructor(opts = {}) {
      this.kind = opts.kind || 'campaign';
      this.t = 0;
      this.info = null;
      const go = (s) => () => SS.Engine.setScene(s());
      const items = this.kind === 'duel' ? [
        { label: 'vs CPU', act: go(() => new SS.SelectScene({ mode: 'duel', vsCpu: true })) },
        { label: '2 Players (this computer)', act: go(() => new SS.SelectScene({ mode: 'duel', vsCpu: false })) },
        { label: 'Host Wi-Fi Battle (2-4 players)', act: () => this.tryHost('hostBattle') },
        { label: 'Join Wi-Fi Battle', act: () => this.tryJoin() },
        { label: 'Back', act: go(() => new SS.MenuScene()) },
      ] : [
        { label: 'Solo', act: go(() => new SS.SelectScene({ mode: 'campaign' })) },
        { label: '2 Players (this computer)', act: go(() => new SS.SelectScene({ mode: 'coop' })) },
        { label: 'Host Wi-Fi Game (2-4 players)', act: () => this.tryHost('host') },
        { label: 'Join Wi-Fi Game', act: () => this.tryJoin() },
        { label: 'Back', act: go(() => new SS.MenuScene()) },
      ];
      this.menu = new SS.MenuList(items, W / 2, 190, { w: 400, h: 46, gap: 10 });
    }
    enter() { SS.Audio.playMusic('menu'); }

    tryHost(mode) {
      if (webOnly()) { this.info = WEB_ONLY_INFO; return; }
      if (!SS.Net.available() || !isLocalhost()) {
        const where = this.kind === 'duel' ? 'Slapdown Duel > Host Wi-Fi Battle' : 'Campaign > Host Wi-Fi Game';
        this.info = [
          'To host a Wi-Fi game:',
          '1. Double-click share-on-network.command in the game folder.',
          '2. On THIS computer, open  http://localhost:8000  in your browser.',
          `3. Choose ${where}.`,
        ];
        return;
      }
      SS.Engine.setScene(new SS.SelectScene({ mode }));
    }

    tryJoin() {
      if (webOnly()) { this.info = WEB_ONLY_INFO; return; }
      if (!SS.Net.available()) {
        this.info = [
          'To join a Wi-Fi game:',
          'Open the address shown in the HOST\'s sharing window',
          '(it looks like  http://192.168.1.23:8000 )',
          'then choose Join Wi-Fi Game / Join Wi-Fi Battle.',
        ];
        return;
      }
      SS.Engine.setScene(new SS.JoinScene());
    }

    update(dt) {
      this.t += dt;
      if (this.info) {
        if (I.anyPressed()) { this.info = null; SS.Audio.select(); }
        return;
      }
      if (SS.Menu.back() || UI.backTapped()) { SS.Engine.setScene(new SS.MenuScene()); return; }
      const item = this.menu.update(dt);
      if (item) item.act();
    }

    draw(ctx) {
      bg(ctx, this.t, this.kind === 'duel' ? 'temple' : 'jungle');
      const duel = this.kind === 'duel';
      UI.outlineText(ctx, duel ? 'SLAPDOWN DUEL' : 'CAMPAIGN', W / 2, 90, 54, '#ffd23f', 'center');
      UI.text(ctx, duel ? 'Who wants to get slapped?' : 'How many sloths are slapping today?', W / 2, 140, 18, '#ffffff', 'center');
      if (this.info) {
        UI.panel(ctx, 120, 200, W - 240, 200);
        this.info.forEach((line, i) => UI.text(ctx, line, W / 2, 240 + i * 34, i === 0 ? 22 : 17, i === 0 ? '#ffd23f' : '#ffffff', 'center'));
        UI.text(ctx, 'Press any key', W / 2, 380, 13, '#9bf6ff', 'center');
        return;
      }
      this.menu.draw(ctx);
      UI.text(ctx, webOnly() ? 'Wi-Fi games only work from the home version, not this web version.'
        : 'Wi-Fi games: everyone must be on the same home Wi-Fi.', W / 2, H - 20, 13, '#dddddd', 'center');
      UI.backButton(ctx);
    }
  };

  // ---------------------------------------------------------------- host lobby
  // opts: { mode: 'campaign' | 'battle', cid } new game
  //       { mode, resume: true, players, level | stage }  back from a game (same join code)
  SS.LobbyScene = class {
    constructor(opts) {
      this.mode = opts.mode || 'campaign';
      this.t = 0;
      this.players = opts.resume ? opts.players.map((p) => Object.assign({}, p)) : [{ id: 0, cid: opts.cid, ready: true }];
      if (opts.resume) for (const p of this.players) if (p.id !== 0 && p.cpu === undefined) p.ready = false;
      this.maxLevel = SS.LEVELS.length - 1; // every map can be chosen
      this.level = Math.min(opts.level || 0, this.maxLevel);
      this.picker = null;
      this.stage = opts.stage || 0;
      this.resume = !!opts.resume;
      this.error = null;
      this.stopped = opts.stopped || null; // this window stopped hosting (another window took over)
      this.ready = false;
      this.syncT = 0;
    }

    get battle() { return this.mode === 'battle'; }

    enter() {
      SS.Audio.playMusic('menu');
      if (this.stopped) { this.error = this.stopped; return; }
      SS.Net.onMessage = (m, from) => this.onNet(m, from);
      if (this.resume && SS.Net.role === 'host') { this.ready = true; this.broadcast(); return; }
      SS.Net.host().then(() => { this.ready = true; this.broadcast(); })
        .catch((e) => { this.error = e.message; });
    }

    onNet(m, from) {
      if (!m) return;
      if (from === 'server') {
        if (m.t === 'joined') {
          if (this.players.length >= MAX_PLAYERS) this.removeCpu(); // a real player beats a CPU
          this.players.push({ id: m.id, cid: null, ready: false });
          SS.Net.send({ t: 'welcome', inGame: false, mode: this.mode }, m.id, true);
          SS.Audio.confirm();
        } else if (m.t === 'left') {
          this.players = this.players.filter((p) => p.id !== m.id);
        }
        this.broadcast();
        return;
      }
      if (m.t === 'pick') {
        const p = this.players.find((q) => q.id === from);
        if (p && SS.CHARACTERS.some((c) => c.id === m.cid)) {
          p.cid = m.cid;
          p.ready = !!m.ready;
          if (p.ready) SS.Audio.select();
          this.broadcast();
        }
      }
    }

    addCpu() {
      if (!this.battle || this.players.length >= MAX_PLAYERS) return;
      let id = 10;
      while (this.players.some((p) => p.id === id)) id++;
      this.players.push({ id, cid: SS.U.choice(SS.CHARACTERS).id, ready: true, cpu: 1 });
      SS.Audio.confirm();
      this.broadcast();
    }
    removeCpu() {
      const idx = this.players.map((p) => p.cpu !== undefined).lastIndexOf(true);
      if (idx >= 0) { this.players.splice(idx, 1); SS.Audio.select(); this.broadcast(); }
    }

    // Full list of maps (co-op) or stages (battle) to pick from.
    openPicker() {
      SS.Audio.select();
      const best = SS.Save.get('best', {});
      const items = this.battle
        ? SS.STAGES.map((st, i) => ({ label: st.name, act: () => { this.stage = i; this.picker = null; this.broadcast(); } }))
        : SS.LEVELS.map((lv, i) => ({
          label: `${i + 1}. ${lv.name}${best[i] ? '  \u2713' : ''}`,
          act: () => { this.level = i; this.picker = null; this.broadcast(); },
        }));
      this.picker = new SS.MenuList(items, W / 2, 112, { w: 290, h: 40, gap: 8, cols: 3, gapX: 12, fontSize: 15 });
      this.picker.sel = this.battle ? this.stage : this.level;
    }

    broadcast() {
      if (!this.ready) return;
      SS.Net.send({
        t: 'lobby', mode: this.mode, level: this.level,
        place: this.battle ? SS.STAGES[this.stage].name : `Map ${this.level + 1}: ${SS.LEVELS[this.level].name}`,
        players: this.players.map((p) => ({ id: p.id, cid: p.cid, ready: p.ready, cpu: p.cpu !== undefined })),
      }, 'all', true);
    }

    start() {
      const ready = this.players.filter((p) => p.ready && p.cid);
      if (this.battle) {
        if (ready.length < 2) { this.warn = 'You need at least 2 sloths. Wait for a friend or press C to add a CPU.'; this.warnT = 4; SS.Audio.hurt(); return; }
        const st = SS.STAGES[this.stage];
        SS.Net.send({ t: 'start', mode: 'battle' }, 'all', true);
        SS.Engine.setScene(new SS.DuelScene({
          net: true, theme: st.theme, gravity: st.gravity, stageIndex: this.stage,
          players: ready.map((p) => ({ id: p.id, cid: p.cid, local: p.id === 0 ? 'SOLO' : null, cpu: p.cpu })),
        }));
        return;
      }
      SS.Net.send({ t: 'start', mode: 'campaign', level: this.level }, 'all', true);
      SS.Engine.setScene(new SS.CampaignScene({
        level: this.level, net: true,
        players: ready.map((p) => ({ id: p.id, cid: p.cid, local: p.id === 0 ? 'SOLO' : null })),
      }));
    }

    update(dt) {
      this.t += dt;
      this.warnT = (this.warnT || 0) - dt;
      if (SS.Menu.back() || UI.backTapped()) {
        SS.Net.leave();
        SS.Engine.setScene(new SS.CampaignModeScene({ kind: this.battle ? 'duel' : 'campaign' }));
        return;
      }
      if (this.error || !this.ready) return;
      if (this.picker) {
        if (SS.Menu.back() || I.hit('KeyM')) { this.picker = null; return; }
        const item = this.picker.update(dt);
        if (item) item.act();
        return;
      }
      SS.Net.maintain(dt, () => {
        this.players = this.players.filter((p) => p.id === 0 || p.cpu !== undefined);
        this.broadcast();
      });
      const count = this.battle ? SS.STAGES.length : this.maxLevel + 1;
      const change = (d) => {
        if (this.battle) this.stage = (this.stage + d + count) % count;
        else this.level = Math.max(0, Math.min(this.maxLevel, this.level + d));
        SS.Audio.select();
        this.broadcast();
      };
      if (SS.Menu.left()) change(-1);
      if (SS.Menu.right()) change(1);
      if (I.hit('KeyM')) { this.openPicker(); return; }
      // click / tap: the arrows change the map, the name opens the full list
      const p = I.pointer;
      if (p.pressed && p.y > 450 && p.y < 492) {
        if (p.x < W / 2 - 190) change(-1);
        else if (p.x > W / 2 + 190) change(1);
        else { this.openPicker(); return; }
      }
      if (I.hit('KeyC')) this.addCpu();
      if (I.hit('KeyX')) this.removeCpu();
      if (I.anyHit(['Enter', 'Pad0Start', 'Pad0A'])) { SS.Audio.confirm(); this.start(); return; }
      this.syncT += dt;
      if (this.syncT > 1) { this.syncT = 0; this.broadcast(); }
    }

    draw(ctx) {
      const st = SS.STAGES[this.stage];
      bg(ctx, this.t, this.battle ? st.theme : 'jungle');
      UI.outlineText(ctx, this.battle ? 'WI-FI BATTLE LOBBY' : 'WI-FI CO-OP LOBBY', W / 2, 44, 38, '#ffd23f', 'center');
      if (this.error) {
        UI.panel(ctx, 120, 160, W - 240, 160);
        UI.outlineText(ctx, this.stopped ? 'This window stopped hosting' : 'Could not start the Wi-Fi game', W / 2, 200, 24, '#ff4d6d', 'center');
        UI.text(ctx, this.error, W / 2, 245, 16, '#ffffff', 'center');
        UI.text(ctx, this.stopped ? 'Only one window can host. Play in the newest one.  Esc = back' : 'Is the share-on-network window still open?  Esc = back', W / 2, 285, 14, '#cccccc', 'center');
        return;
      }
      if (!this.ready) {
        UI.text(ctx, 'Starting...', W / 2, 200, 20, '#ffffff', 'center');
        return;
      }
      UI.panel(ctx, W / 2 - 330, 70, 660, 92);
      UI.outlineText(ctx, `JOIN CODE:  ${SS.Net.code}`, W / 2, 98, 30, '#00f5d4', 'center');
      UI.text(ctx, `On the other computers or phones open:  ${SS.Net.address}`, W / 2, 128, 15, '#ffffff', 'center');
      UI.text(ctx, `then choose  ${this.battle ? 'Slapdown Duel > Join Wi-Fi Battle' : 'Campaign > Join Wi-Fi Game'}  and type the code.`, W / 2, 148, 13, '#cccccc', 'center');

      for (let i = 0; i < MAX_PLAYERS; i++) {
        const x = 150 + i * 220;
        const p = this.players[i];
        const label = !p ? (this.battle ? 'waiting... (C = add CPU)' : 'waiting for player...')
          : p.id === 0 ? 'READY!' : p.cpu !== undefined ? 'CPU' : p.ready ? 'READY!' : 'choosing a sloth...';
        // battles number sloths by lobby order (like in the fight); co-op by player slot
        const n = this.battle || !p ? i : p.id;
        slothCard(ctx, x, 380, p && p.cid, `P${n + 1}`, SS.PLAYER_COLORS[n % 4], label, this.t + i);
        if (p && p.id === 0) UI.text(ctx, 'you (host)', x, 432, 12, '#ffd23f', 'center');
      }
      const place = this.battle ? `STAGE: ${st.name}` : `MAP ${this.level + 1}: ${SS.LEVELS[this.level].name}`;
      ctx.fillStyle = 'rgba(43,25,61,0.85)';
      ctx.beginPath(); ctx.roundRect(W / 2 - 300, 452, 600, 38, 12); ctx.fill();
      ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 2; ctx.stroke();
      UI.outlineText(ctx, '◀', W / 2 - 280, 471, 22, '#ffd23f', 'center');
      UI.outlineText(ctx, '▶', W / 2 + 280, 471, 22, '#ffd23f', 'center');
      UI.outlineText(ctx, place, W / 2, 471, 21, '#ffffff', 'center');
      if (this.picker) {
        UI.fade(ctx, 0.92);
        UI.outlineText(ctx, this.battle ? 'CHOOSE A STAGE' : 'CHOOSE A MAP', W / 2, 80, 34, '#ffd23f', 'center');
        this.picker.draw(ctx);
        UI.text(ctx, 'Enter / click to choose    Esc = close', W / 2, H - 22, 14, '#9bf6ff', 'center');
        return;
      }
      if (this.warnT > 0) UI.outlineText(ctx, this.warn, W / 2, 500, 15, '#ff4d6d', 'center');
      const waiting = this.players.some((p) => p.id !== 0 && p.cpu === undefined && !p.ready);
      const extra = this.battle ? '   C/X = add/remove CPU' : '';
      UI.text(ctx, (waiting ? 'Enter = start now (others can jump in later)' : 'Press Enter to start!') +
        `   \u2190/\u2192 or M = choose ${this.battle ? 'stage' : 'map'}` + extra + '   Esc = cancel', W / 2, H - 22, 13, '#9bf6ff', 'center');
    }
  };

  // ---------------------------------------------------------------- join (guest)
  // opts.rejoin: already connected (the host went back to the lobby) - just pick and get ready again
  SS.JoinScene = class {
    constructor(opts = {}) {
      this.t = 0;
      this.phase = opts.rejoin && SS.Net.active ? 'pick' : 'code'; // code | connecting | pick
      this.code = '';
      this.error = null;
      this.cur = SS.Save.get('lastPicks', [0, 2])[0] % SS.CHARACTERS.length;
      this.lobby = null;
      this.inGame = false;
      this.mode = null;
      this.keys = [];
      for (let i = 0; i < 12; i++) {
        const label = i < 9 ? String(i + 1) : ['⌫', '0', 'OK'][i - 9];
        this.keys.push({ label, x: W / 2 - 96 + (i % 3) * 66, y: 250 + Math.floor(i / 3) * 56, w: 60, h: 48 });
      }
      if (this.phase === 'pick') this.isReady = false;
    }

    enter() {
      SS.Audio.playMusic('menu');
      SS.Net.onMessage = (m, from) => this.onNet(m, from);
      if (this.phase === 'pick') this.sendPick(false);
    }

    onNet(m) {
      if (!m) return;
      if (m.t === 'hostLeft') {
        if (m.rehost && this.phase === 'pick') { SS.Net.status = 'closed'; return; } // host reconnecting: rejoin
        this.fail(m.reason || 'The host closed the game.');
        return;
      }
      if (m.t === 'welcome') { this.inGame = !!m.inGame; this.mode = m.mode || this.mode; this.phase = 'pick'; this.sendPick(false); }
      else if (m.t === 'lobby') { this.lobby = m; this.mode = m.mode; }
      else if (m.t === 'start') this.toGame(m.mode, m.level);
      else if (m.t === 'snap' && (m.pl || []).some((p) => p.id === SS.Net.id)) this.toGame(m.k === 'duel' ? 'battle' : 'campaign', m.lv, m);
    }

    toGame(mode, level, firstSnap) {
      const scene = mode === 'battle' ? new SS.RemoteDuelScene() : new SS.RemoteScene({ level: level || 0 });
      SS.Engine.setScene(scene);
      if (firstSnap) scene.onNet(firstSnap);
    }

    fail(msg) {
      SS.Net.leave();
      this.error = msg;
      this.phase = 'code';
      this.code = '';
    }

    sendPick(ready) {
      this.isReady = ready;
      SS.Net.myCid = SS.CHARACTERS[this.cur].id; // remembered for automatic rejoins
      SS.Net.send({ t: 'pick', cid: SS.Net.myCid, ready }, 'host', true);
    }

    tryJoin() {
      if (this.code.length !== 4) return;
      this.phase = 'connecting';
      this.error = null;
      SS.Net.join(this.code).then(() => { /* wait for the host's welcome */ })
        .catch((e) => { this.phase = 'code'; this.error = e.message; this.code = ''; });
    }

    typeDigit(d) {
      if (this.code.length < 4) { this.code += d; SS.Audio.select(); }
    }

    update(dt) {
      this.t += dt;
      if (UI.backTapped() || (SS.Menu.back() && !(this.phase === 'code' && I.hit('Backspace') && this.code))) {
        SS.Net.leave();
        SS.Engine.setScene(new SS.MenuScene());
        return;
      }
      if (this.phase === 'code') {
        for (let d = 0; d <= 9; d++) if (I.hit('Digit' + d) || I.hit('Numpad' + d)) this.typeDigit(String(d));
        if (I.hit('Backspace')) this.code = this.code.slice(0, -1);
        const p = I.pointer;
        if (p.pressed) {
          for (const k of this.keys) {
            if (p.x < k.x || p.x > k.x + k.w || p.y < k.y || p.y > k.y + k.h) continue;
            if (k.label === 'OK') this.tryJoin();
            else if (k.label === '⌫') this.code = this.code.slice(0, -1);
            else this.typeDigit(k.label);
          }
        }
        if (I.anyHit(['Enter', 'NumpadEnter'])) this.tryJoin();
      } else if (this.phase === 'pick') {
        const n = SS.CHARACTERS.length;
        const pick = (d) => { this.cur = (this.cur + d + n) % n; SS.Audio.select(); if (this.isReady) this.sendPick(false); };
        if (SS.Menu.left()) pick(-1);
        if (SS.Menu.right()) pick(1);
        if (SS.Menu.confirm()) { SS.Audio.confirm(); this.sendPick(!this.isReady); }
        // taps: left/right side of the card to choose, the button to get ready
        const p = I.pointer;
        if (p.pressed && p.y > 120 && p.y < 390) {
          if (p.x < W / 2 - 60) pick(-1);
          else if (p.x > W / 2 + 60) pick(1);
        } else if (p.pressed && p.y >= 400 && p.y <= 440 && Math.abs(p.x - W / 2) < 190) {
          SS.Audio.confirm();
          this.sendPick(!this.isReady);
        }
      }
      if (this.phase === 'pick') {
        SS.Net.maintain(dt, () => this.sendPick(this.isReady));
        this.lostT = SS.Net.lost ? (this.lostT || 0) + dt : 0;
        if (this.lostT > 90) this.fail('Could not reconnect to the host.');
      }
    }

    // Side panel next to the sloth card: FAST/POWER/BALANCED, stat bars and the sloth's trait.
    drawStats(ctx, c, x, y) {
      const w = 236;
      UI.panel(ctx, x, y, w, 270);
      if (UI.roleChip) UI.roleChip(ctx, c.role, x + 12, y + 12);
      (SS.STAT_BARS || []).forEach(([label, f], i) => {
        const sy = y + 50 + i * 38;
        UI.text(ctx, label, x + 14, sy, 13, '#ffd23f');
        UI.bar(ctx, x + 14, sy + 10, w - 28, 10, Math.max(0.06, Math.min(1, f(c))), SS.ROLE_COLORS[c.role] || '#ffd23f');
      });
      // trait, wrapped onto short lines
      const lines = [];
      for (const word of (c.trait || '').split(' ')) {
        if (lines.length && (lines[lines.length - 1] + ' ' + word).length <= 30) lines[lines.length - 1] += ' ' + word;
        else lines.push(word);
      }
      lines.slice(0, 3).forEach((ln, i) => UI.text(ctx, ln, x + w / 2, y + 210 + i * 17, 13, '#9bf6ff', 'center'));
    }

    draw(ctx) {
      bg(ctx, this.t);
      UI.outlineText(ctx, 'JOIN A WI-FI GAME', W / 2, 50, 38, '#ffd23f', 'center');
      if (this.phase === 'code' || this.phase === 'connecting') {
        UI.text(ctx, 'Type the 4-digit join code shown on the host\'s screen:', W / 2, 110, 17, '#ffffff', 'center');
        for (let i = 0; i < 4; i++) {
          const x = W / 2 - 108 + i * 56;
          UI.panel(ctx, x, 140, 48, 64);
          UI.outlineText(ctx, this.code[i] || '', x + 24, 174, 34, '#00f5d4', 'center');
        }
        for (const k of this.keys) {
          ctx.fillStyle = k.label === 'OK' ? '#ffd23f' : 'rgba(43,25,61,0.85)';
          ctx.beginPath();
          ctx.roundRect(k.x, k.y, k.w, k.h, 10);
          ctx.fill();
          UI.text(ctx, k.label, k.x + k.w / 2, k.y + k.h / 2, 20, k.label === 'OK' ? '#2b193d' : '#ffffff', 'center');
        }
        if (this.phase === 'connecting') UI.text(ctx, 'Connecting...', W / 2, 488, 18, '#9bf6ff', 'center');
        if (this.error) UI.outlineText(ctx, this.error, W / 2, 488, 16, '#ff4d6d', 'center');
        UI.text(ctx, 'Enter = join    Esc = back', W / 2, H - 18, 13, '#dddddd', 'center');
        UI.backButton(ctx);
        return;
      }
      const what = this.mode === 'battle' ? 'BATTLE' : this.mode === 'campaign' ? 'CO-OP' : '';
      const idx = this.lobby ? this.lobby.players.findIndex((p) => p.id === SS.Net.id) : -1;
      const me = this.mode === 'battle' && idx >= 0 ? idx : SS.Net.id;
      UI.outlineText(ctx, `You are P${me + 1}${what ? '  -  ' + what : ''}`, W / 2, 96, 24, SS.PLAYER_COLORS[me % 4], 'center');
      const c = SS.CHARACTERS[this.cur];
      UI.panel(ctx, W / 2 - 170, 120, 340, 270);
      SS.Art.sloth(ctx, { x: W / 2, y: 330, look: c.look, scale: 1.3 / Math.max(1, c.scale), t: this.t, pose: this.isReady ? 'win' : 'idle' });
      this.drawStats(ctx, c, W / 2 + 182, 120);
      UI.outlineText(ctx, `◀  ${c.name}  ▶`, W / 2, 360, 22, '#ffffff', 'center');
      UI.text(ctx, c.specialName, W / 2, 380, 13, '#9bf6ff', 'center');
      ctx.fillStyle = this.isReady ? 'rgba(82,224,122,0.25)' : '#ffd23f';
      ctx.beginPath();
      ctx.roundRect(W / 2 - 190, 400, 380, 40, 12);
      ctx.fill();
      UI.text(ctx, this.isReady ? 'READY! Waiting for the host... (tap to change)' : 'I\'m ready!  (Enter or tap)',
        W / 2, 421, 17, this.isReady ? '#52e07a' : '#2b193d', 'center');
      if (this.inGame) {
        UI.text(ctx, this.mode === 'battle' ? 'A battle is going on - you will jump in at the next round.'
          : 'A map is already being played - you will drop in next to your team.', W / 2, 452, 14, '#cccccc', 'center');
      }
      if (this.lobby) {
        UI.text(ctx, `Players: ${this.lobby.players.length}/4     ${this.lobby.place || ''}`, W / 2, 474, 15, '#ffffff', 'center');
      }
      if (SS.Net.lost) UI.outlineText(ctx, 'Connection lost - rejoining automatically...', W / 2, 496, 16, '#ff4d6d', 'center');
      UI.text(ctx, '←/→ (or tap the sides) choose sloth    Enter = ready    Esc = leave', W / 2, H - 18, 13, '#dddddd', 'center');
      UI.backButton(ctx);
    }
  };
})();
