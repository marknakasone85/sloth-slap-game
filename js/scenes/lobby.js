// Campaign "how do you want to play?" menu, plus the Wi-Fi co-op lobby (host) and join screen (guest).
(function () {
  const UI = SS.UI;
  const I = SS.Input;
  const W = SS.W, H = SS.H;
  const isLocalhost = () => ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);

  function bg(ctx, t) {
    SS.Art.background(ctx, 'jungle', t * 20, t, 470);
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
    UI.text(ctx, label, x, y + 38, 13, label === 'READY!' ? '#52e07a' : '#cccccc', 'center');
  }

  // ---------------------------------------------------------------- mode menu
  SS.CampaignModeScene = class {
    constructor() {
      this.t = 0;
      this.info = null;
      this.menu = new SS.MenuList([
        { label: 'Solo', act: () => SS.Engine.setScene(new SS.SelectScene({ mode: 'campaign' })) },
        { label: '2 Players (this computer)', act: () => SS.Engine.setScene(new SS.SelectScene({ mode: 'coop' })) },
        { label: 'Host Wi-Fi Game (2-4 players)', act: () => this.tryHost() },
        { label: 'Join Wi-Fi Game', act: () => this.tryJoin() },
        { label: 'Back', act: () => SS.Engine.setScene(new SS.MenuScene()) },
      ], W / 2, 190, { w: 400, h: 46, gap: 10 });
    }
    enter() { SS.Audio.playMusic('menu'); }

    tryHost() {
      if (!SS.Net.available() || !isLocalhost()) {
        this.info = [
          'To host a Wi-Fi game:',
          '1. Double-click share-on-network.command in the game folder.',
          '2. On THIS computer, open  http://localhost:8000  in your browser.',
          '3. Choose Campaign > Host Wi-Fi Game.',
        ];
        return;
      }
      SS.Engine.setScene(new SS.SelectScene({ mode: 'host' }));
    }

    tryJoin() {
      if (!SS.Net.available()) {
        this.info = [
          'To join a Wi-Fi game:',
          'Open the address shown in the HOST\'s sharing window',
          '(it looks like  http://192.168.1.23:8000 )',
          'then choose Campaign > Join Wi-Fi Game.',
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
      if (SS.Menu.back()) { SS.Engine.setScene(new SS.MenuScene()); return; }
      const item = this.menu.update(dt);
      if (item) item.act();
    }

    draw(ctx) {
      bg(ctx, this.t);
      UI.outlineText(ctx, 'CAMPAIGN', W / 2, 90, 54, '#ffd23f', 'center');
      UI.text(ctx, 'How many sloths are slapping today?', W / 2, 140, 18, '#ffffff', 'center');
      if (this.info) {
        UI.panel(ctx, 120, 200, W - 240, 200);
        this.info.forEach((line, i) => UI.text(ctx, line, W / 2, 240 + i * 34, i === 0 ? 22 : 17, i === 0 ? '#ffd23f' : '#ffffff', 'center'));
        UI.text(ctx, 'Press any key', W / 2, 380, 13, '#9bf6ff', 'center');
        return;
      }
      this.menu.draw(ctx);
      UI.text(ctx, 'Wi-Fi games: everyone must be on the same home Wi-Fi.', W / 2, H - 20, 13, '#dddddd', 'center');
    }
  };

  // ---------------------------------------------------------------- host lobby
  SS.LobbyScene = class {
    constructor(opts) {
      this.t = 0;
      this.players = [{ id: 0, cid: opts.cid, ready: true }];
      const unlocked = SS.Save.get('unlocked', 1);
      this.maxLevel = Math.min(unlocked, SS.LEVELS.length) - 1;
      this.level = 0;
      this.error = null;
      this.ready = false;
      this.syncT = 0;
    }

    enter() {
      SS.Audio.playMusic('menu');
      SS.Net.onMessage = (m, from) => this.onNet(m, from);
      SS.Net.host().then(() => { this.ready = true; this.broadcast(); })
        .catch((e) => { this.error = e.message; });
    }

    onNet(m, from) {
      if (!m) return;
      if (from === 'server') {
        if (m.t === 'joined') {
          this.players.push({ id: m.id, cid: null, ready: false });
          SS.Net.send({ t: 'welcome', inGame: false }, m.id, true);
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

    broadcast() {
      if (!this.ready) return;
      SS.Net.send({ t: 'lobby', level: this.level, players: this.players.map((p) => ({ id: p.id, cid: p.cid, ready: p.ready })) }, 'all', true);
    }

    start() {
      const ready = this.players.filter((p) => p.ready && p.cid);
      SS.Net.send({ t: 'start', level: this.level }, 'all', true);
      SS.Engine.setScene(new SS.CampaignScene({
        level: this.level, net: true,
        players: ready.map((p) => ({ id: p.id, cid: p.cid, local: p.id === 0 ? 'SOLO' : null })),
      }));
    }

    update(dt) {
      this.t += dt;
      if (SS.Menu.back()) {
        SS.Net.leave();
        SS.Engine.setScene(new SS.CampaignModeScene());
        return;
      }
      if (this.error || !this.ready) return;
      if (SS.Menu.left()) { this.level = Math.max(0, this.level - 1); SS.Audio.select(); this.broadcast(); }
      if (SS.Menu.right()) { this.level = Math.min(this.maxLevel, this.level + 1); SS.Audio.select(); this.broadcast(); }
      if (I.anyHit(['Enter', 'Pad0Start', 'Pad0A'])) { SS.Audio.confirm(); this.start(); return; }
      this.syncT += dt;
      if (this.syncT > 1) { this.syncT = 0; this.broadcast(); }
    }

    draw(ctx) {
      bg(ctx, this.t);
      UI.outlineText(ctx, 'WI-FI CO-OP LOBBY', W / 2, 44, 38, '#ffd23f', 'center');
      if (this.error) {
        UI.panel(ctx, 120, 160, W - 240, 160);
        UI.outlineText(ctx, 'Could not start the Wi-Fi game', W / 2, 200, 24, '#ff4d6d', 'center');
        UI.text(ctx, this.error, W / 2, 245, 16, '#ffffff', 'center');
        UI.text(ctx, 'Is the share-on-network window still open?  Esc = back', W / 2, 285, 14, '#cccccc', 'center');
        return;
      }
      if (!this.ready) {
        UI.text(ctx, 'Starting...', W / 2, 200, 20, '#ffffff', 'center');
        return;
      }
      UI.panel(ctx, W / 2 - 330, 70, 660, 92);
      UI.outlineText(ctx, `JOIN CODE:  ${SS.Net.code}`, W / 2, 98, 30, '#00f5d4', 'center');
      UI.text(ctx, `On the other computers open:  ${SS.Net.address}`, W / 2, 128, 15, '#ffffff', 'center');
      UI.text(ctx, 'then choose  Campaign > Join Wi-Fi Game  and type the code.', W / 2, 148, 13, '#cccccc', 'center');

      for (let i = 0; i < 4; i++) {
        const x = 150 + i * 220;
        const p = this.players.find((q) => q.id === i);
        const label = !p ? 'waiting for player...' : i === 0 ? 'HOST' : p.ready ? 'READY!' : 'choosing a sloth...';
        slothCard(ctx, x, 380, p && p.cid, `P${i + 1}`, SS.PLAYER_COLORS[i], i === 0 ? 'READY!' : label, this.t + i);
        if (i === 0) UI.text(ctx, 'you (host)', x, 432, 12, '#ffd23f', 'center');
      }
      const L = SS.LEVELS[this.level];
      UI.outlineText(ctx, `◀  MAP ${this.level + 1}: ${L.name}  ▶`, W / 2, 470, 22, '#ffffff', 'center');
      const waiting = this.players.some((p) => p.id !== 0 && !p.ready);
      UI.text(ctx, waiting ? 'Enter = start now (players still choosing can drop in later)   Esc = cancel'
        : 'Press Enter to start!   Esc = cancel', W / 2, H - 22, 15, '#9bf6ff', 'center');
    }
  };

  // ---------------------------------------------------------------- join (guest)
  SS.JoinScene = class {
    constructor() {
      this.t = 0;
      this.phase = 'code'; // code | connecting | pick | ready
      this.code = '';
      this.error = null;
      this.cur = SS.Save.get('lastPicks', [0, 2])[0] % SS.CHARACTERS.length;
      this.lobby = null;
      this.inGame = false;
      this.keys = [];
      for (let i = 0; i < 12; i++) {
        const label = i < 9 ? String(i + 1) : ['⌫', '0', 'OK'][i - 9];
        this.keys.push({ label, x: W / 2 - 96 + (i % 3) * 66, y: 250 + Math.floor(i / 3) * 56, w: 60, h: 48 });
      }
    }

    enter() {
      SS.Audio.playMusic('menu');
      SS.Net.onMessage = (m, from) => this.onNet(m, from);
    }

    onNet(m, from) {
      if (!m) return;
      if (m.t === 'hostLeft') { this.fail(m.reason || 'The host closed the game.'); return; }
      if (m.t === 'welcome') { this.inGame = !!m.inGame; this.phase = 'pick'; this.sendPick(false); }
      else if (m.t === 'lobby') this.lobby = m;
      else if (m.t === 'start') this.toGame(m.level);
      else if (m.t === 'snap' && (m.pl || []).some((p) => p.id === SS.Net.id)) this.toGame(m.lv, m);
    }

    toGame(level, firstSnap) {
      const scene = new SS.RemoteScene({ level });
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
      SS.Net.send({ t: 'pick', cid: SS.CHARACTERS[this.cur].id, ready }, 'host', true);
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
        SS.Engine.setScene(new SS.CampaignModeScene());
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
        if (SS.Menu.left()) { this.cur = (this.cur - 1 + n) % n; SS.Audio.select(); if (this.isReady) this.sendPick(false); }
        if (SS.Menu.right()) { this.cur = (this.cur + 1) % n; SS.Audio.select(); if (this.isReady) this.sendPick(false); }
        if (SS.Menu.confirm()) { SS.Audio.confirm(); this.sendPick(!this.isReady); }
        // taps: left/right side of the card to choose, the button to get ready
        const p = I.pointer;
        if (p.pressed && p.y > 120 && p.y < 390) {
          if (p.x < W / 2 - 60) { this.cur = (this.cur - 1 + n) % n; SS.Audio.select(); if (this.isReady) this.sendPick(false); }
          else if (p.x > W / 2 + 60) { this.cur = (this.cur + 1) % n; SS.Audio.select(); if (this.isReady) this.sendPick(false); }
        } else if (p.pressed && p.y >= 400 && p.y <= 440 && Math.abs(p.x - W / 2) < 190) {
          SS.Audio.confirm();
          this.sendPick(!this.isReady);
        }
      }
      if (SS.Net.active && SS.Net.silence() > 25) this.fail('Lost the connection to the host.');
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
      const me = SS.Net.id;
      UI.outlineText(ctx, `You are P${me + 1}`, W / 2, 96, 24, SS.PLAYER_COLORS[me % 4], 'center');
      const c = SS.CHARACTERS[this.cur];
      UI.panel(ctx, W / 2 - 170, 120, 340, 270);
      SS.Art.sloth(ctx, { x: W / 2, y: 330, look: c.look, scale: 1.3 / Math.max(1, c.scale), t: this.t, pose: this.isReady ? 'win' : 'idle' });
      UI.outlineText(ctx, `◀  ${c.name}  ▶`, W / 2, 360, 22, '#ffffff', 'center');
      UI.text(ctx, c.specialName, W / 2, 380, 13, '#9bf6ff', 'center');
      ctx.fillStyle = this.isReady ? 'rgba(82,224,122,0.25)' : '#ffd23f';
      ctx.beginPath();
      ctx.roundRect(W / 2 - 190, 400, 380, 40, 12);
      ctx.fill();
      UI.text(ctx, this.isReady ? 'READY! Waiting for the host... (tap to change)' : 'I\'m ready!  (Enter or tap)',
        W / 2, 421, 17, this.isReady ? '#52e07a' : '#2b193d', 'center');
      if (this.inGame) UI.text(ctx, 'A map is already being played - you will drop in next to your team.', W / 2, 448, 14, '#cccccc', 'center');
      if (this.lobby) {
        const L = SS.LEVELS[this.lobby.level];
        UI.text(ctx, `Players: ${this.lobby.players.length}/4     Map ${this.lobby.level + 1}: ${L ? L.name : ''}`, W / 2, 470, 15, '#ffffff', 'center');
      }
      UI.text(ctx, '←/→ (or tap the sides) choose sloth    Enter = ready    Esc = leave', W / 2, H - 18, 13, '#dddddd', 'center');
      UI.backButton(ctx);
    }
  };
})();
