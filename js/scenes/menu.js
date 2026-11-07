// Title screen with an animated slap demo, main menu and a controls page.
(function () {
  const UI = SS.UI;
  const W = SS.W, H = SS.H;

  SS.MenuScene = class {
    constructor() {
      this.t = 0;
      this.showHelp = false;
      this.fx = new SS.FX();
      this.slapT = 1.5;
      this.slapper = 0;
      this.menu = new SS.MenuList([
        { label: 'Campaign', go: () => new SS.CampaignModeScene({ kind: 'campaign' }) },
        { label: 'Slapdown Duel', go: () => new SS.CampaignModeScene({ kind: 'duel' }) },
        { label: 'How to Play', help: true },
        { label: () => 'Sound: ' + (SS.Audio.muted ? 'OFF' : 'ON'), mute: true },
      ], W / 2, 222, { w: 360, h: 50, gap: 12 });
    }

    enter() { SS.Audio.playMusic('menu'); }

    update(dt) {
      this.t += dt;
      this.fx.update(dt);

      // Demo: the two title sloths take turns slapping each other.
      this.slapT -= dt;
      if (this.slapT <= 0) {
        this.slapT = 1.6;
        this.slapper = 1 - this.slapper;
        this.slapAnim = 0;
      }
      if (this.slapAnim !== undefined) {
        this.slapAnim += dt;
        if (this.slapAnim > 0.18 && !this.slapHit) {
          this.slapHit = true;
          const x = this.slapper === 0 ? 180 : W - 180;
          this.fx.slapText(x, 330, Math.random() < 0.3);
          this.fx.burst(x, 380, '#ffd23f', 8);
          SS.Audio.slap();
        }
        if (this.slapAnim > 0.6) { this.slapAnim = undefined; this.slapHit = false; }
      }

      if (this.showHelp) {
        if (SS.Input.anyPressed()) {
          this.showHelp = false;
          SS.Audio.select();
        }
        return;
      }

      const item = this.menu.update(dt);
      if (item) {
        if (item.help) this.showHelp = true;
        else if (item.mute) SS.Audio.toggleMute();
        else SS.Engine.setScene(item.go());
      }
    }

    demoArm(who) {
      if (this.slapAnim === undefined || this.slapper !== who) return undefined;
      const a = this.slapAnim;
      if (a < 0.12) return SS.U.lerp(SS.Art.SLOTH_REST, -2.4, a / 0.12);
      if (a < 0.22) return SS.U.lerp(-2.4, 0.3, (a - 0.12) / 0.1);
      return SS.U.lerp(0.3, SS.Art.SLOTH_REST, Math.min(1, (a - 0.22) / 0.3));
    }

    draw(ctx) {
      SS.Art.background(ctx, 'jungle', this.t * 30, this.t, 470);

      const c = SS.CHARACTERS;
      const hurt0 = this.slapAnim !== undefined && this.slapper === 1 && this.slapAnim > 0.18 && this.slapAnim < 0.5;
      const hurt1 = this.slapAnim !== undefined && this.slapper === 0 && this.slapAnim > 0.18 && this.slapAnim < 0.5;
      SS.Art.shadow(ctx, 110, 470, 38);
      SS.Art.shadow(ctx, W - 110, 470, 38);
      SS.Art.sloth(ctx, {
        x: 110, y: 470, facing: 1, scale: 1.3, look: c[0].look, t: this.t,
        arm: this.demoArm(0), pose: hurt0 ? 'hurt' : 'idle', slapping: this.slapper === 0 && this.slapAnim > 0.1,
      });
      SS.Art.sloth(ctx, {
        x: W - 110, y: 470, facing: -1, scale: 1.3, look: c[2].look, t: this.t + 1,
        arm: this.demoArm(1), pose: hurt1 ? 'hurt' : 'idle', slapping: this.slapper === 1 && this.slapAnim > 0.1,
      });
      this.fx.draw(ctx);

      // Title
      if (this.showHelp) { this.drawHelp(ctx); return; }
      const wob = Math.sin(this.t * 2) * 0.03;
      ctx.save();
      ctx.translate(W / 2, 110);
      ctx.rotate(wob);
      UI.outlineText(ctx, 'THE', 0, -52, 30, '#ffffff', 'center');
      UI.outlineText(ctx, 'SLOTH SLAP', 0, 0, 78, '#ffd23f', 'center', '#2b193d');
      const titleHalf = ctx.measureText('SLOTH SLAP').width / 2; // measured in the 78px title font
      UI.outlineText(ctx, '™', titleHalf + 3, -26, 24, '#ffd23f', 'left'); // trademark (switch to ® only once registered)
      UI.outlineText(ctx, 'GAME', 0, 62, 44, '#ff4d6d', 'center');
      ctx.restore();

      this.menu.draw(ctx);

      UI.text(ctx, 'Arrows/WASD + Enter, or click / tap', W / 2, H - 14, 13, 'rgba(255,255,255,0.7)', 'center');
      UI.text(ctx, 'Sloth Slap™ © 2026 Mark A. Nakasone', W - 10, H - 14, 11, 'rgba(255,255,255,0.55)', 'right');
    }

    drawHelp(ctx) {
      SS.UI.controlsPanel(ctx);
    }
  };
})();
