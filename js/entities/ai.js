// CPU opponent for Slapdown Duel. Produces the same controller state a player would.
(function () {
  const U = SS.U;
  const LEVELS = [
    { name: 'Sleepy', think: 0.42, block: 0.15, aggression: 0.45 },
    { name: 'Grumpy', think: 0.24, block: 0.4, aggression: 0.65 },
    { name: 'Savage', think: 0.12, block: 0.7, aggression: 0.85 },
  ];
  SS.CPU_LEVELS = LEVELS;

  SS.CPU = class {
    constructor(level = 1) {
      this.cfg = LEVELS[level] || LEVELS[1];
      this.timer = 0;
      this.hold = { left: false, right: false, down: false };
      this.blockT = 0;
    }

    control(me, opp, dt) {
      const ctrl = { left: false, right: false, down: false, jumpP: false, slapP: false, heavyP: false, specialP: false, shootP: false };
      if (!opp || opp.state === 'ko' || me.state === 'ko') return ctrl;

      this.timer -= dt;
      this.blockT -= dt;
      const dx = opp.x - me.x;
      const dist = Math.abs(dx);
      const toward = dx > 0 ? 'right' : 'left';
      const away = dx > 0 ? 'left' : 'right';

      // React to incoming attacks (limited by skill).
      const threatened = opp.state === 'attack' && dist < 150;
      if (threatened && this.blockT <= 0 && Math.random() < this.cfg.block * dt * 12) {
        this.blockT = 0.35;
        this.hold = { left: false, right: false, down: true };
      }
      if (this.blockT > 0) {
        ctrl.down = true;
        return ctrl;
      }

      if (this.timer <= 0) {
        this.timer = this.cfg.think * U.rand(0.7, 1.3);
        this.hold = { left: false, right: false, down: false };
        const aggressive = Math.random() < this.cfg.aggression;

        if (me.canSpecial && this.goodSpecialRange(me.def.special, dist)) {
          ctrl.specialP = true;
        } else if (dist > 240 && me.ammo > 0 && Math.random() < 0.35 + this.cfg.aggression * 0.3) {
          ctrl.shootP = true;
        } else if (dist < 85 * me.def.scale + 10) {
          if (aggressive) {
            if (Math.random() < 0.65) ctrl.slapP = true;
            else ctrl.heavyP = true;
          } else {
            this.hold[away] = true;
          }
        } else if (dist < 260) {
          this.hold[toward] = aggressive || Math.random() < 0.5;
          if (!this.hold[toward]) this.hold[away] = Math.random() < 0.3;
          if (Math.random() < 0.12) ctrl.jumpP = true;
        } else {
          this.hold[toward] = true;
          if (Math.random() < 0.05) ctrl.jumpP = true;
        }
      }
      ctrl.left = this.hold.left;
      ctrl.right = this.hold.right;
      return ctrl;
    }

    goodSpecialRange(special, dist) {
      switch (special) {
        case 'flurry': return dist < 95;
        case 'dash': return dist > 90 && dist < 380;
        case 'bellyflop': return dist < 220;
        case 'lullaby': return dist > 120;
        case 'coconuts': return true;
        case 'barrage': return dist > 140 && dist < 460;
        case 'missiles': return true;
        case 'cannon': return dist < 520;
        case 'freeze': return dist > 110;
        default: return dist < 120;
      }
    }
  };
})();
