// Campaign HUD + overlays, shared by the host/local game (campaign.js) and by
// Wi-Fi co-op guests (remote.js). Both build a small "view" object and pass it in.
//
// hud = {
//   t, coop, score, bananas, progress (0..1), boss: null | { name, frac },
//   gateHint, players: [ { tag, color, name, hp, mhp, meter, canSpecial, ammo, maxAmmo,
//                          ammoT, ammoRegen, powers, lucky, respawnT, ko, combo } ],
//   strips: [ { fighter, opts } ]   key-hint strips to draw (fighter = object keyStrip understands)
// }
(function () {
  const UI = SS.UI;
  const W = SS.W, H = SS.H;
  SS.PLAYER_COLORS = ['#ffd23f', '#00f5d4', '#ff4d8d', '#52e07a'];

  function soloPanel(ctx, hud, p) {
    UI.panel(ctx, 12, 10, 330, 96);
    UI.outlineText(ctx, p.name, 26, 28, 18, '#ffd23f');
    UI.bar(ctx, 26, 44, 220, 14, p.hp / p.mhp, p.hp / p.mhp > 0.3 ? '#52e07a' : '#ff4d6d');
    const full = p.canSpecial;
    UI.bar(ctx, 26, 66, 220, 9, p.meter / 100, full ? (Math.floor(hud.t * 6) % 2 ? '#00f5d4' : '#ffffff') : '#00b4d8');
    UI.text(ctx, full ? 'SPECIAL! (H / L)' : 'special', 256, 70, 11, full ? '#00f5d4' : '#aaa');
    UI.text(ctx, `${Math.ceil(p.hp)}`, 256, 51, 14, '#fff');
    UI.ammo(ctx, 26, 90, p);
    UI.powers(ctx, 356, 30, p, hud.t);
    if (p.combo >= 3) UI.outlineText(ctx, `${p.combo} SLAP COMBO!`, 26, 130, 22 + Math.min(14, p.combo), '#ff4d6d');
  }

  function coopPanel(ctx, hud, p, i) {
    const x = 12 + i * 236, w = 228;
    UI.panel(ctx, x, 8, w, 78);
    UI.outlineText(ctx, `${p.tag} ${p.name}`, x + 12, 24, 14, p.color);
    if (p.ko) {
      const msg = p.respawnT > 0 ? `snoozing... back in ${Math.ceil(p.respawnT)}` : 'snoozed!';
      UI.text(ctx, msg, x + 12, 48, 13, '#bde0fe');
    } else {
      UI.bar(ctx, x + 12, 37, 160, 10, p.hp / p.mhp, p.hp / p.mhp > 0.3 ? '#52e07a' : '#ff4d6d');
      UI.text(ctx, `${Math.ceil(p.hp)}`, x + 180, 42, 12, '#fff');
      const full = p.canSpecial;
      UI.bar(ctx, x + 12, 54, 160, 6, p.meter / 100, full ? (Math.floor(hud.t * 6) % 2 ? '#00f5d4' : '#ffffff') : '#00b4d8');
      if (full) UI.text(ctx, 'SPECIAL', x + 180, 57, 10, '#00f5d4');
      UI.ammo(ctx, x + 12, 72, p);
    }
    UI.powers(ctx, x + 16, 102, p, hud.t, 0.75);
  }

  SS.CampaignHUD = {
    draw(ctx, hud) {
      if (hud.coop) hud.players.forEach((p, i) => coopPanel(ctx, hud, p, i));
      else if (hud.players[0]) soloPanel(ctx, hud, hud.players[0]);

      // score + bananas + progress
      const prog = Math.max(0, Math.min(1, hud.progress));
      if (hud.coop) {
        // slim line on the ground strip so it never covers the sloths
        UI.outlineText(ctx, `TEAM SCORE ${hud.score}      BANANAS ${hud.bananas}`, W / 2, 482, 15, '#ffffff', 'center');
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(W / 2 - 120, 494, 240, 4);
        ctx.fillStyle = '#ffd23f';
        ctx.fillRect(W / 2 - 120, 494, 240 * prog, 4);
      } else {
        const sx = W - 232, sy = 10;
        UI.panel(ctx, sx, sy, 220, 58);
        UI.outlineText(ctx, `SCORE ${hud.score}`, sx + 110, sy + 18, 18, '#ffffff', 'center');
        SS.Art.banana(ctx, sx + 52, sy + 52, 0);
        UI.text(ctx, `x ${hud.bananas}`, sx + 72, sy + 40, 16, '#ffe14d');
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(sx + 122, sy + 38, 86, 5);
        ctx.fillStyle = '#ffd23f';
        ctx.fillRect(sx + 122, sy + 38, 86 * prog, 5);
      }

      if (hud.boss) {
        const by = hud.coop ? 128 : 104;
        UI.outlineText(ctx, hud.boss.name, W / 2, by, 20, '#ff4d6d', 'center');
        UI.bar(ctx, W / 2 - 200, by + 14, 400, 14, hud.boss.frac, '#ff4d6d');
      }
      if (hud.gateHint) {
        UI.outlineText(ctx, 'Gate closed! Slap the GONG to open it.', W / 2, hud.coop ? 170 : H - 62, 18, '#ffd23f', 'center');
      }
      for (const s of hud.strips) UI.keyStrip(ctx, s.fighter, hud.t, s.opts);
    },

    // o = { state, stateT, t, levelIndex, L, score, bananas, hpBonus, newBest, guest, hostMenu, showControls }
    overlays(ctx, o) {
      if (o.t < 2.6) {
        const a = o.t < 2 ? 1 : 1 - (o.t - 2) / 0.6;
        ctx.globalAlpha = Math.max(0, a);
        UI.panel(ctx, W / 2 - 300, 150, 600, 110);
        UI.outlineText(ctx, `MAP ${o.levelIndex + 1}: ${o.L.name.toUpperCase()}`, W / 2, 188, 34, '#ffd23f', 'center');
        UI.text(ctx, o.L.blurb, W / 2, 230, 17, '#ffffff', 'center');
        ctx.globalAlpha = 1;
      }
      const waiting = o.guest ? 'Waiting for the host to choose...' : '';
      if (o.state === 'paused') {
        UI.fade(ctx, 0.55);
        if (o.showControls) { UI.controlsPanel(ctx); return; }
        UI.outlineText(ctx, 'PAUSED', W / 2, 128, 54, '#ffd23f', 'center');
        UI.text(ctx, o.guest ? 'The host paused the game.' : 'The sloth appreciates the break.', W / 2, 166, 16, '#ddd', 'center');
      } else if (o.state === 'dead') {
        UI.fade(ctx, Math.min(0.6, o.stateT * 0.5));
        UI.outlineText(ctx, 'SNOOZED OUT!', W / 2, 180, 60, '#ff4d6d', 'center');
        UI.text(ctx, o.coop ? 'The whole team needs a nap.' : 'Even sloths need a nap sometimes.', W / 2, 228, 18, '#ffffff', 'center');
        if (waiting) UI.text(ctx, waiting, W / 2, 290, 18, '#9bf6ff', 'center');
      } else if (o.state === 'won') {
        UI.fade(ctx, Math.min(0.55, o.stateT * 0.5));
        UI.outlineText(ctx, 'NAP ACHIEVED!', W / 2, 120, 60, '#ffd23f', 'center');
        UI.text(ctx, `Score ${o.score}    Bananas ${o.bananas}    Health bonus +${o.hpBonus || 0}`, W / 2, 180, 20, '#fff', 'center');
        if (o.newBest) UI.outlineText(ctx, 'NEW BEST!', W / 2, 220, 26, '#00f5d4', 'center');
        if (o.levelIndex === SS.LEVELS.length - 1) {
          UI.text(ctx, 'You beat the campaign! The comfiest hammock is yours.', W / 2, 260, 18, '#ffd23f', 'center');
        }
        if (waiting) UI.text(ctx, waiting, W / 2, 310, 18, '#9bf6ff', 'center');
      }
    },
  };
})();
