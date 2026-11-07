// A sloth fighter. Used by the player in the campaign and by both sides in duels.
//
// A "world" object (provided by the scene) must implement:
//   world.groundY, world.fx, world.platforms
//   world.bounds(fighter) -> { min, max }          horizontal limits
//   world.targets(team)   -> slappable things       each has box, alive, takeHit(hit)
//   world.spawn(projectile)
//   world.faceTarget(fighter) -> x to face, or null
//   world.onHit(attacker, target, hit, result)     optional (score, meter...)
(function () {
  const U = SS.U;
  const GRAV = 1900;
  const REST = SS.Art.SLOTH_REST;
  const SPECIAL_COST = 100;
  SS.POWER_TIME = 12; // seconds a power-up lasts

  const MOVES = {
    slap: { startup: 0.07, active: 0.09, recover: 0.14, dmg: 6, kbx: 220, kby: -140, reach: 64, stun: 0.28, wind: -1.3, swing: 0.35 },
    heavy: { startup: 0.24, active: 0.1, recover: 0.3, dmg: 13, kbx: 520, kby: -340, reach: 72, stun: 0.5, wind: -2.7, swing: 0.45, big: true },
  };

  const approach = (v, target, amt) => (v < target ? Math.min(target, v + amt) : Math.max(target, v - amt));
  const ARMOR_MAX = 12; // super armor shrugs off hits weaker than this (that aren't big slaps)

  // Slap timings for one sloth: fast sloths (atk > 1) wind up and recover quicker.
  function movesFor(def) {
    const k = def.atk || 1;
    const out = {};
    for (const [name, m] of Object.entries(MOVES)) {
      out[name] = Object.assign({}, m, { startup: m.startup / k, active: m.active / k, recover: m.recover / k });
    }
    return out;
  }

  SS.Fighter = class {
    constructor(def, x, opts = {}) {
      this.def = def;
      this.moves = movesFor(def);
      this.airJumps = def.airJumps || 0;
      this.x = x;
      this.y = opts.y !== undefined ? opts.y : SS.GROUND_Y;
      this.vx = 0;
      this.vy = 0;
      this.facing = opts.facing || 1;
      this.team = opts.team || 'player';
      this.autoFace = !!opts.autoFace;
      this.mercy = opts.mercy || 0; // brief invulnerability after being hit (campaign)
      // Gun: limited ammo that slowly refills.
      this.maxAmmo = opts.maxAmmo || 6;
      this.ammo = opts.ammo !== undefined ? opts.ammo : this.maxAmmo;
      this.ammoRegen = opts.ammoRegen || 2.5;
      this.ammoT = 0;
      this.gunT = 0;
      this.muzzleT = 0;
      // Power-ups: name -> seconds left. lucky = extra lives (Lucky Banana).
      this.powers = {};
      this.lucky = 0;
      this.hp = def.hp;
      this.maxHp = def.hp;
      this.meter = 0;
      this.state = 'idle';
      this.move = null;
      this.onGround = true;
      this.hitstun = 0;
      this.sleep = 0;
      this.invuln = 0;
      this.flash = 0;
      this.walk = 0;
      this.t = Math.random() * 10;
      this.w = 52 * def.scale;
      this.h = 112 * def.scale;
      this.hitList = new Set();
      this.combo = 0;
      this.comboT = 0;
      this.alive = true;
    }

    get box() {
      return { x: this.x - this.w / 2, y: this.y - this.h, w: this.w, h: this.h };
    }
    get canSpecial() { return this.meter >= SPECIAL_COST; }

    powerUp(type) {
      if (type === 'lucky') this.lucky++;
      else this.powers[type] = SS.POWER_TIME;
    }

    // ------------------------------------------------------------------
    update(dt, ctrl, world) {
      this.t += dt;
      this.flash -= dt;
      this.invuln -= dt;
      this.comboT -= dt;
      if (this.comboT <= 0) this.combo = 0;
      this.gunT -= dt;
      this.muzzleT -= dt;
      for (const k of Object.keys(this.powers)) {
        this.powers[k] -= dt;
        if (this.powers[k] <= 0) delete this.powers[k];
      }
      if (this.ammo < this.maxAmmo && this.state !== 'ko') {
        this.ammoT += dt;
        if (this.ammoT >= this.ammoRegen) { this.ammoT = 0; this.ammo++; }
      }

      if (this.state === 'ko' || this.state === 'win') {
        this.vx *= Math.pow(0.05, dt);
        this.physics(dt, world);
        return;
      }

      if (this.sleep > 0) {
        this.sleep -= dt;
        this.state = 'sleep';
        if (!this.frozen && Math.random() < dt * 1.5) world.fx.text(this.x + 20, this.y - this.h - 10, 'Zzz', '#bde0fe', 22);
        if (this.sleep <= 0) { this.state = 'idle'; this.frozen = false; }
        this.vx = approach(this.vx, 0, 1500 * dt);
        this.physics(dt, world);
        return;
      }

      if (this.state === 'hurt') {
        this.hitstun -= dt;
        if (this.onGround) this.vx = approach(this.vx, 0, 1400 * dt);
        if (this.hitstun <= 0) this.state = 'idle';
        this.physics(dt, world);
        return;
      }

      ctrl = ctrl || {};
      if (this.state === 'attack') {
        this.updateMove(dt, ctrl, world);
      } else {
        const dir = (ctrl.right ? 1 : 0) - (ctrl.left ? 1 : 0);
        if (ctrl.down && this.onGround) {
          this.state = 'block';
          this.vx = approach(this.vx, 0, 2500 * dt);
        } else {
          this.state = 'idle';
          // fast sloths also get going (and stop) quicker
          const accel = (this.onGround ? 2600 : 1400) * U.clamp(this.def.speed / 200, 0.8, 2);
          const speed = this.def.speed * (this.powers.coffee ? 1.6 : 1);
          this.vx = approach(this.vx, dir * speed, accel * (this.powers.coffee ? 1.6 : 1) * dt);
          if (dir && !this.autoFace) this.facing = dir;
        }
        if (ctrl.jumpP && this.onGround && this.state !== 'block') {
          this.vy = -this.def.jump * (this.powers.coffee ? 1.12 : 1);
          this.onGround = false;
          SS.Audio.jump();
        } else if (ctrl.jumpP && !this.onGround && this.airJumps > 0) {
          // double jump (athlete sloth)
          this.airJumps--;
          this.vy = -this.def.jump * 0.85 * (this.powers.coffee ? 1.12 : 1);
          SS.Audio.jump();
          world.fx.burst(this.x, this.y, '#ffffff', 8, 160);
        }
        if (ctrl.slapP) this.startMove('slap');
        else if (ctrl.heavyP) this.startMove('heavy');
        else if (ctrl.specialP && this.canSpecial) this.startSpecial(world);
        else if (ctrl.shootP) this.tryShoot(world);
      }

      if (this.autoFace && this.state !== 'attack') {
        const tx = world.faceTarget(this);
        if (tx !== null && Math.abs(tx - this.x) > 4) this.facing = tx > this.x ? 1 : -1;
      }

      if (Math.abs(this.vx) > 20 && this.onGround) this.walk += dt * Math.abs(this.vx) * 0.06;
      this.physics(dt, world);
    }

    physics(dt, world) {
      const prevY = this.y;
      this.vy += GRAV * (world.gravity || 1) * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      const wasGround = this.onGround;
      this.onGround = false;

      if (this.y >= world.groundY) {
        this.y = world.groundY;
        this.vy = 0;
        this.onGround = true;
      } else if (this.vy > 0 && world.platforms) {
        for (const p of world.platforms) {
          if (prevY <= p.y + 1 && this.y >= p.y && this.x > p.x - 10 && this.x < p.x + p.w + 10) {
            this.y = p.y;
            this.vy = 0;
            this.onGround = true;
            break;
          }
        }
      }
      if (this.onGround && !wasGround) this.onLand(world);

      const b = world.bounds(this);
      this.x = U.clamp(this.x, b.min + this.w / 2, b.max - this.w / 2);
    }

    onLand(world) {
      this.airJumps = this.def.airJumps || 0;
      if (this.move && this.move.kind === 'bellyflop' && this.move.phase === 'air') {
        this.move.phase = 'impact';
        this.move.t = 0;
        SS.Audio.bigSlap();
        world.fx.shake(16);
        world.fx.burst(this.x, this.y, '#d4a373', 24, 380);
        world.fx.text(this.x, this.y - this.h - 20, 'BELLY FLOP!', '#ff4d6d', 38);
        this.hitList.clear();
        this.doHits(world, { x: this.x - 170, y: this.y - 70, w: 340, h: 80 },
          { dmg: 18, kbx: 420, kby: -560, stun: 0.7, big: true }, true);
      }
    }

    // ------------------------------------------------------------------
    startMove(name) {
      this.state = 'attack';
      this.move = { kind: name, def: this.moves[name], t: 0 };
      this.hitList.clear();
      if (this.onGround) this.vx *= 0.3;
    }

    tryShoot(world) {
      if (this.powers.rapid) { this.startMove('shoot'); return; } // unlimited ammo
      if (this.ammo <= 0) {
        SS.Audio.emptyClick();
        world.fx.text(this.x, this.y - this.h - 10, '*click* out of ammo!', '#cccccc', 16);
        return;
      }
      this.ammo--;
      this.startMove('shoot');
    }

    fireBullet(world) {
      const s = this.def.scale;
      const mx = this.x + this.facing * (12 + 44 + 44) * s;
      const my = this.y - (62 + 9) * s;
      // Bullet starts at the body (not the muzzle) so point-blank enemies still get hit.
      world.spawn(new SS.Projectile('bullet', this.x + this.facing * 20 * s, my, this.facing * 950, 0, this.team,
        { dmg: 5, stun: 0.18, kbx: 150, kby: -70, props: true, life: 0.75 }));
      this.muzzleT = 0.07;
      this.gunT = 0.6;
      this.vx -= this.facing * 70; // recoil
      SS.Audio.shoot();
      world.fx.text(mx + this.facing * 20, my - 22, SS.U.choice(['BANG!', 'PEW!', 'BLAM!']), '#ffd23f', 18);
      world.fx.shake(2);
    }

    startSpecial(world) {
      this.meter -= SPECIAL_COST;
      this.state = 'attack';
      this.move = { kind: this.def.special, t: 0, phase: 'start', fired: false };
      this.hitList.clear();
      SS.Audio.special();
      world.fx.text(this.x, this.y - this.h - 30, this.def.specialName + '!', '#00f5d4', 24);
    }

    // Attack hitbox in front of the sloth.
    reachBox(reach) {
      const r = reach * this.def.scale;
      const top = this.y - this.h * 0.9;
      return {
        x: this.facing > 0 ? this.x : this.x - r - this.w * 0.2,
        y: top, w: r + this.w * 0.2, h: this.h * 0.75,
      };
    }

    doHits(world, box, h, omni = false) {
      let landed = false;
      for (const target of world.targets(this.team)) {
        if (!target.alive || this.hitList.has(target)) continue;
        if (!U.overlap(box, target.box)) continue;
        this.hitList.add(target);
        const dir = omni ? (target.x >= this.x ? 1 : -1) : this.facing;
        const sup = this.powers.superslap ? 1 : 0;
        const dmg = h.dmg * this.def.power * (sup ? 2 : 1);
        const kb = Math.sqrt(this.def.power); // strong sloths send things flying further
        const hit = {
          dmg, kbx: h.kbx * dir * kb * (sup ? 1.5 : 1), kby: h.kby * Math.sqrt(kb) * (sup ? 1.3 : 1), stun: h.stun, sleep: h.sleep || 0,
          big: !!h.big, from: this, dir,
        };
        const result = target.takeHit(hit, world);
        if (result === 'miss') continue; // can't be hurt right now (e.g. underground, just respawned)
        landed = true;
        if (result !== 'blocked') {
          this.meter = Math.min(SPECIAL_COST, this.meter + (h.big ? 16 : 10));
          this.combo++;
          this.comboT = 1.2;
          const cx = (box.x + box.w / 2 + target.x) / 2;
          const cy = target.box.y + target.box.h * 0.35;
          world.fx.burst(cx, cy, h.big ? '#ff4d6d' : '#ffd23f', h.big ? 18 : 10);
          world.fx.slapText(cx, cy - 30, h.big);
          world.fx.shake(h.big ? 10 : 4);
          SS.Engine.freeze(h.big ? 0.09 : 0.04);
          if (h.big) SS.Audio.bigSlap(); else SS.Audio.slap();
        }
        if (world.onHit) world.onHit(this, target, hit, result);
      }
      return landed;
    }

    updateMove(dt, ctrl, world) {
      const m = this.move;
      m.t += dt;
      if (this.onGround && m.kind !== 'dash' && m.kind !== 'sprint') this.vx = approach(this.vx, 0, 1800 * dt);

      const finish = () => { this.state = 'idle'; this.move = null; };

      if (m.kind === 'shoot') {
        if (!m.fired && m.t >= 0.04) { m.fired = true; this.fireBullet(world); }
        if (m.t > (this.powers.rapid ? 0.1 : 0.22)) finish();
      } else if (m.kind === 'slap' || m.kind === 'heavy') {
        const d = m.def;
        if (m.t >= d.startup && m.t < d.startup + d.active) {
          if (!m.swung) { m.swung = true; if (!this.doHits(world, this.reachBox(d.reach), d)) SS.Audio.whiff(); }
          else this.doHits(world, this.reachBox(d.reach), d);
        }
        if (m.t >= d.startup + d.active + d.recover) finish();
      } else if (m.kind === 'flurry') {
        const windows = [0.1, 0.24, 0.38];
        windows.forEach((w0, i) => {
          if (m.t >= w0 && m.t < w0 + 0.07) {
            if (m.win !== i) { m.win = i; this.hitList.clear(); SS.Audio.whiff(); }
            const last = i === windows.length - 1;
            this.doHits(world, this.reachBox(70), last
              ? { dmg: 10, kbx: 560, kby: -380, stun: 0.6, big: true }
              : { dmg: 6, kbx: 90, kby: -60, stun: 0.35 });
          }
        });
        if (m.t > 0.65) finish();
      } else if (m.kind === 'dash') {
        if (m.t < 0.08) this.vx = 0;
        else if (m.t < 0.4) {
          this.vx = this.facing * 820;
          this.invuln = 0.05;
          if (Math.random() < 0.6) world.fx.burst(this.x - this.facing * 30, this.y - 20, '#ffffff', 1, 60);
          this.doHits(world, this.reachBox(40), { dmg: 15, kbx: 560, kby: -360, stun: 0.6, big: true });
        } else {
          this.vx = approach(this.vx, 0, 3000 * dt);
          if (m.t > 0.6) finish();
        }
      } else if (m.kind === 'bellyflop') {
        if (m.phase === 'start' && m.t > 0.12) {
          m.phase = 'air';
          this.vy = -760;
          this.vx = this.facing * 260;
          this.onGround = false;
          SS.Audio.jump();
        } else if (m.phase === 'impact' && m.t > 0.3) finish();
        else if (m.phase === 'air' && m.t > 2.5) finish(); // safety
      } else if (m.kind === 'lullaby') {
        if (!m.fired && m.t > 0.2) {
          m.fired = true;
          world.spawn(new SS.Projectile('note', this.x + this.facing * 40, this.y - this.h * 0.6,
            this.facing * 430, 0, this.team, { dmg: 6, sleep: 1.8, stun: 0.2, kbx: 60, kby: -60 }));
          SS.Audio.snore();
        }
        if (m.t > 0.5) finish();
      } else if (m.kind === 'barrage') {
        // soldier: lob three banana bombs that explode where they land
        if (!m.fired && m.t > 0.25) {
          m.fired = true;
          for (let i = 0; i < 3; i++) {
            world.spawn(new SS.Projectile('bananaBomb', this.x + this.facing * 30, this.y - this.h * 0.75,
              this.facing * (260 + i * 140), -520 - i * 40, this.team,
              { dmg: 10, stun: 0.5, kbx: 320, kby: -360, big: true, gravity: 1100, explode: 90 }));
          }
          world.fx.text(this.x, this.y - this.h - 40, 'INCOMING!', '#ffd23f', 26);
        }
        if (m.t > 0.6) finish();
      } else if (m.kind === 'missiles') {
        // wizard: three sparkly missiles that chase the nearest enemy
        if (!m.fired && m.t > 0.25) {
          m.fired = true;
          for (let i = 0; i < 3; i++) {
            world.spawn(new SS.Projectile('magic', this.x + this.facing * 30, this.y - this.h * 0.8,
              this.facing * 240, -220 + i * 220, this.team,
              { dmg: 7, stun: 0.35, kbx: 160, kby: -160, homing: true, life: 2.4 }));
          }
          world.fx.text(this.x, this.y - this.h - 40, 'ABRACA-SLAP!', '#e0aaff', 26);
        }
        if (m.t > 0.6) finish();
      } else if (m.kind === 'cannon') {
        // pirate: one huge cannonball straight ahead
        if (!m.fired && m.t > 0.22) {
          m.fired = true;
          world.spawn(new SS.Projectile('cannonball', this.x + this.facing * 40, this.y - this.h * 0.5,
            this.facing * 720, 0, this.team, { dmg: 17, stun: 0.6, kbx: 620, kby: -400, big: true, life: 1.3 }));
          this.vx = -this.facing * 260;
          SS.Audio.bigSlap();
          world.fx.shake(10);
          world.fx.text(this.x + this.facing * 60, this.y - this.h - 20, 'KA-BOOM!', '#ff4d6d', 30);
        }
        if (m.t > 0.6) finish();
      } else if (m.kind === 'freeze') {
        // ice sloth: an ice shard that freezes whoever it hits
        if (!m.fired && m.t > 0.2) {
          m.fired = true;
          world.spawn(new SS.Projectile('ice', this.x + this.facing * 40, this.y - this.h * 0.6,
            this.facing * 500, 0, this.team, { dmg: 6, sleep: 2.0, freeze: true, stun: 0.2, kbx: 60, kby: -60, life: 1.6 }));
          SS.Audio.tone(1400, 0.3, 'sine', 0.2, 2400);
        }
        if (m.t > 0.5) finish();
      } else if (m.kind === 'quake') {
        // gorilla: pound the chest (can't be stopped), then smash the ground -
        // shockwaves roll out both ways along the floor
        if (m.phase === 'start') {
          this.invuln = Math.max(this.invuln, 0.05);
          const beat = Math.floor(m.t / 0.12);
          if (beat !== m.beat && beat < 4) {
            m.beat = beat;
            SS.Audio.tone(beat % 2 ? 140 : 110, 0.1, 'square', 0.25, 70);
            world.fx.text(this.x + (beat % 2 ? 26 : -26), this.y - this.h - 16 - beat * 10, beat % 2 ? 'OOH!' : 'OOH OOH!', '#ffd23f', 20);
            world.fx.shake(3);
          }
          if (m.t > 0.5) { m.phase = 'smash'; m.t = 0; }
        } else {
          m.airT = (m.airT || 0) + dt;
          if (!this.onGround && m.airT < 1) { this.vy = Math.max(this.vy, 900); m.t = 0; } // slam down first
          else if (!m.fired && m.t > 0.06) {
            m.fired = true;
            SS.Audio.bigSlap();
            world.fx.shake(18);
            world.fx.burst(this.x, this.y, '#b08968', 30, 420);
            world.fx.text(this.x, this.y - this.h - 30, 'GROUND POUND!', '#ff4d6d', 34);
            this.hitList.clear();
            this.doHits(world, { x: this.x - 110, y: this.y - 90, w: 220, h: 100 },
              { dmg: 10, kbx: 300, kby: -520, stun: 0.6, big: true }, true);
            for (const d of [-1, 1]) {
              world.spawn(new SS.Projectile('quake', this.x + d * 50, this.y - 14, d * 560, 0, this.team,
                { dmg: 12, stun: 0.6, kbx: 260, kby: -520, big: true, pierce: true, props: true, life: 0.9 }));
            }
          }
          if (m.t > 0.4) finish();
        }
      } else if (m.kind === 'sprint') {
        // athlete: zoom forward, skid and turn, zoom back - hits everyone on the way, twice
        const leg = m.t < 0.08 ? 0 : m.t < 0.36 ? 1 : m.t < 0.46 ? 'skid' : m.t < 0.74 ? 2 : 'stop';
        if (leg === 0) this.vx = 0;
        else if (leg === 1 || leg === 2) {
          if (m.leg !== leg) { m.leg = leg; this.hitList.clear(); SS.Audio.whiff(); }
          this.vx = this.facing * 1150;
          this.invuln = 0.05;
          if (Math.random() < 0.7) world.fx.burst(this.x - this.facing * 30, this.y - 10, '#ffffff', 1, 80);
          this.doHits(world, this.reachBox(40), { dmg: 12, kbx: 380, kby: -420, stun: 0.55, big: true });
        } else if (leg === 'skid') {
          this.vx = approach(this.vx, 0, 12000 * dt);
          if (!m.turned) {
            m.turned = true;
            this.facing = -this.facing;
            world.fx.text(this.x, this.y - this.h - 20, 'ZOOM!', '#9ef01a', 26);
            world.fx.burst(this.x, this.y, '#d4a373', 10, 200);
          }
        } else {
          this.vx = approach(this.vx, 0, 4000 * dt);
          if (m.t > 0.85) finish();
        }
      } else if (m.kind === 'coconuts') {
        if (!m.fired && m.t > 0.3) {
          m.fired = true;
          const tx = world.faceTarget(this);
          const cx = tx !== null ? tx : this.x + this.facing * 200;
          for (let i = -1; i <= 1; i++) {
            world.spawn(new SS.Projectile('coconut', cx + i * 70, -40 - Math.abs(i) * 80,
              0, 200, this.team, { dmg: 9, stun: 0.5, kbx: 200, kby: -300, big: true, gravity: 900 }));
          }
          world.fx.text(this.x, this.y - this.h - 40, 'BY ROYAL DECREE!', '#ffd23f', 26);
        }
        if (m.t > 0.65) finish();
      }
    }

    // ------------------------------------------------------------------
    takeHit(hit, world) {
      if (this.state === 'ko' || this.invuln > 0) return 'miss';
      if (this.powers.shield) {
        this.vx = hit.kbx * 0.2;
        SS.Audio.tone(300, 0.2, 'sine', 0.3, 700);
        world.fx.burst(this.x, this.y - this.h * 0.5, '#4cc9f0', 8, 200);
        world.fx.text(this.x, this.y - this.h - 10, 'BOING! (shielded)', '#9bf6ff', 18);
        return 'blocked';
      }
      const facingAttacker = hit.from ? (hit.from.x - this.x) * this.facing > 0 : true;
      if (this.state === 'block' && facingAttacker && !hit.sleep) {
        this.hp -= hit.dmg * 0.12;
        this.vx = hit.kbx * 0.35;
        SS.Audio.block();
        world.fx.burst(this.x + this.facing * 26, this.y - this.h * 0.6, '#9bf6ff', 6, 150);
        world.fx.text(this.x, this.y - this.h - 10, 'BLOCKED', '#9bf6ff', 18);
        if (this.hp <= 0) this.knockOut(world);
        return 'blocked';
      }
      if (this.def.armor && !hit.big && !hit.sleep && hit.dmg < ARMOR_MAX) {
        // super armor: it hurts, but it doesn't stop this sloth
        this.hp -= hit.dmg;
        this.vx += hit.kbx * 0.15 / this.def.weight;
        this.flash = 0.1;
        this.meter = Math.min(SPECIAL_COST, this.meter + 6);
        SS.Audio.hurt();
        if (Math.random() < 0.35) world.fx.text(this.x, this.y - this.h - 10, U.choice(['*shrug*', 'TICKLES!', 'IS THAT ALL?']), '#ffd23f', 18);
        if (this.mercy) this.invuln = this.mercy;
        if (this.hp <= 0) this.knockOut(world);
        return 'hit';
      }
      this.hp -= hit.dmg;
      this.vx = hit.kbx / this.def.weight;
      this.vy = hit.kby / this.def.weight;
      this.onGround = false;
      this.flash = 0.1;
      this.meter = Math.min(SPECIAL_COST, this.meter + 6);
      this.move = null;
      if (hit.sleep) {
        this.sleep = hit.sleep;
        this.frozen = !!hit.freeze;
        this.state = 'sleep';
      } else {
        this.state = 'hurt';
        this.hitstun = hit.stun;
      }
      SS.Audio.hurt();
      if (this.mercy) this.invuln = this.mercy;
      if (this.hp <= 0) this.knockOut(world);
      return 'hit';
    }

    knockOut(world) {
      if (this.lucky > 0) {
        // Lucky Banana: pop right back up!
        this.lucky--;
        this.hp = this.maxHp * 0.5;
        this.state = 'idle';
        this.move = null;
        this.sleep = 0;
        this.invuln = 2;
        this.vy = -500;
        SS.Audio.win();
        world.fx.burst(this.x, this.y - this.h * 0.5, '#ffd23f', 30, 400);
        world.fx.text(this.x, this.y - this.h - 30, 'LUCKY BANANA! BACK UP!', '#ffd23f', 28);
        return;
      }
      this.hp = 0;
      this.state = 'ko';
      this.sleep = 0;
      this.move = null;
      this.vy = -420;
      this.vx = (this.vx >= 0 ? 1 : -1) * 260;
      SS.Audio.ko();
      world.fx.shake(14);
    }

    heal(n) { this.hp = Math.min(this.maxHp, this.hp + n); }

    // ------------------------------------------------------------------
    armAngle() {
      const m = this.move;
      if (!m) return undefined;
      if (m.kind === 'slap' || m.kind === 'heavy') {
        const d = m.def;
        if (m.t < d.startup) return U.lerp(REST, d.wind, m.t / d.startup);
        if (m.t < d.startup + d.active) return U.lerp(d.wind, d.swing, (m.t - d.startup) / d.active);
        return U.lerp(d.swing, REST, Math.min(1, (m.t - d.startup - d.active) / d.recover));
      }
      if (m.kind === 'shoot') return -0.05 - Math.max(0, 1 - Math.abs(m.t - 0.06) / 0.08) * 0.35; // recoil kick
      if (m.kind === 'flurry') return -1.0 + Math.sin(m.t * 45) * 1.3;
      if (m.kind === 'dash' || m.kind === 'sprint') return 0.05;
      if (m.kind === 'bellyflop') return -2.4;
      if (m.kind === 'quake') {
        if (m.phase === 'start') return Math.floor(m.t / 0.12) % 2 ? 1.9 : 0.9; // pounding the chest
        return m.fired ? 1.35 : -2.5; // fist up, then SMASH
      }
      return -1.6 + Math.sin(m.t * 20) * 0.4;
    }

    isSwinging() {
      const m = this.move;
      if (!m) return false;
      if (m.def) return m.t >= m.def.startup && m.t < m.def.startup + m.def.active + 0.05;
      return m.kind === 'flurry' || m.kind === 'dash' || m.kind === 'sprint';
    }

    // Everything needed to draw this sloth, as a small plain object.
    // The host draws from it directly, and sends it to Wi-Fi co-op players.
    renderState() {
      const pose = this.state === 'ko' ? 'ko'
        : this.state === 'win' ? 'win'
        : this.state === 'sleep' ? 'sleep'
        : this.state === 'hurt' ? 'hurt'
        : this.state === 'block' ? 'block'
        : !this.onGround ? 'jump'
        : Math.abs(this.vx) > 20 && this.state !== 'attack' ? 'walk'
        : 'idle';
      const busy = ['hurt', 'ko', 'sleep', 'block', 'win'].includes(this.state);
      const arm = this.armAngle();
      const r2 = (v) => Math.round(v * 100) / 100;
      return {
        cid: this.def.id, x: Math.round(this.x * 10) / 10, y: Math.round(this.y * 10) / 10, f: this.facing,
        pose, t: r2(this.t), walk: r2(this.walk), arm: arm === undefined ? null : r2(arm),
        sl: this.isSwinging() ? 1 : 0,
        mo: this.state === 'attack' ? 'open' : this.state === 'hurt' ? 'ouch' : 0,
        fl: this.flash > 0 ? 1 : 0,
        sq: this.move && this.move.kind === 'bellyflop' && this.move.phase === 'impact' ? 0.25 : 0,
        gun: !busy && (this.move ? this.move.kind === 'shoot' : this.gunT > 0) ? 1 : 0,
        mz: this.muzzleT > 0 ? 1 : 0,
        hide: this.invuln > 0.1 && Math.floor(this.t * 20) % 2 === 0 ? 1 : 0,
        ps: r2(this.powers.shield || 0), ss: this.powers.superslap ? 1 : 0, co: this.powers.coffee ? 1 : 0,
        vx: Math.round(this.vx), mk: this.move ? this.move.kind : 0, st: this.state, og: this.onGround ? 1 : 0,
        tag: this.tag || 0, tc: this.tagColor || 0,
        fr: this.frozen && this.state === 'sleep' ? 1 : 0,
      };
    }

    draw(ctx, world) { SS.Fighter.drawState(ctx, this.renderState(), world); }

    static drawState(ctx, s, world) {
      const def = SS.charById(s.cid);
      const h = 112 * def.scale, w = 52 * def.scale;
      const floor = world.floorBelow ? world.floorBelow(s.x, s.y) : world.groundY;
      SS.Art.shadow(ctx, s.x, floor, 34 * def.scale * Math.max(0.4, 1 - (floor - s.y) / 400));
      if (s.tag && s.pose !== 'ko') {
        // co-op marker: who is who
        const ty = s.y - 158 * def.scale - 10 + Math.sin(s.t * 4) * 3; // above hats and crowns
        ctx.fillStyle = s.tc;
        ctx.beginPath();
        ctx.moveTo(s.x - 7, ty + 8); ctx.lineTo(s.x + 7, ty + 8); ctx.lineTo(s.x, ty + 16);
        ctx.fill();
        SS.UI.outlineText(ctx, s.tag, s.x, ty - 2, 15, s.tc, 'center');
      }
      if (s.hide) return;
      if (s.ss) {
        // angry red aura
        ctx.fillStyle = `rgba(255,77,109,${0.18 + Math.sin(s.t * 10) * 0.08})`;
        ctx.beginPath();
        ctx.ellipse(s.x, s.y - h * 0.5, w * 0.95, h * 0.62, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      if (s.mk === 'sprint' && Math.abs(s.vx) > 500) {
        // athlete special: blurry after-images
        ctx.save();
        for (let i = 3; i >= 1; i--) {
          ctx.globalAlpha = 0.12 * (4 - i);
          SS.Art.sloth(ctx, { x: s.x - Math.sign(s.vx) * i * 30, y: s.y, facing: s.f, scale: def.scale, look: def.look, t: s.t, pose: 'walk', walk: s.walk + i });
        }
        ctx.restore();
      }
      const zoom = Math.abs(s.vx) > 260 && (s.st === 'idle' || s.st === 'attack');
      if ((s.co && Math.abs(s.vx) > 40) || zoom) {
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 3;
        for (let i = 0; i < 3; i++) {
          const ly = s.y - h * (0.25 + i * 0.25);
          const lx = s.x - Math.sign(s.vx) * (w * 0.6 + i * 6);
          ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx - Math.sign(s.vx) * 26, ly); ctx.stroke();
        }
      }
      SS.Art.sloth(ctx, {
        gun: !!s.gun, muzzle: !!s.mz,
        x: s.x + (s.co ? SS.U.rand(-1.2, 1.2) : 0), y: s.y,
        facing: s.f, scale: def.scale, look: def.look,
        t: s.t, pose: s.pose, walk: s.walk, arm: s.arm === null ? undefined : s.arm,
        slapping: !!s.sl, mouth: s.mo || undefined, flash: !!s.fl, squash: s.sq,
      });
      if (s.fr) {
        // frozen in an ice block
        ctx.fillStyle = 'rgba(155,246,255,0.45)';
        ctx.strokeStyle = 'rgba(230,250,255,0.9)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(s.x - w * 0.85, s.y - h * 1.05, w * 1.7, h * 1.08, 10);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillRect(s.x - w * 0.6, s.y - h * 0.95, 6, h * 0.5);
      }
      if (s.ps && (s.ps > 2 || Math.floor(s.t * 8) % 2 === 0)) {
        const r = h * 0.62 + Math.sin(s.t * 6) * 3;
        ctx.fillStyle = 'rgba(76,201,240,0.18)';
        ctx.strokeStyle = 'rgba(155,246,255,0.85)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(s.x, s.y - h * 0.5, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath();
        ctx.ellipse(s.x - r * 0.4, s.y - h * 0.5 - r * 0.5, r * 0.18, r * 0.1, -0.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  // ---------- Projectiles (DJ notes, coconuts, monkey throws) ----------
  const PROJ_WORD = { quake: 'RUMBLE!', bullet: 'POW!', note: 'LULLABY!', magic: 'ZAP!', ice: 'FROZEN!', cannonball: 'KABOOM!', bananaBomb: 'KA-SPLAT!', pizza: 'SPLAT!', pie: 'SPLAT!', balloon: 'SPLOOSH!', bubble: 'POP!', peach: 'BONK!', lantern: 'FWUMP!' };
  const PROJ_COLOR = { bullet: '#ffd23f', pizza: '#f4c542', pie: '#fff8e7', balloon: '#4cc9f0', bubble: '#bde0fe', peach: '#ffab91', lantern: '#e63946' };
  SS.Projectile = class {
    constructor(kind, x, y, vx, vy, team, hit) {
      this.kind = kind;
      this.x = x; this.y = y; this.vx = vx; this.vy = vy;
      this.team = team;
      this.hit = hit;
      this.gravity = hit.gravity || 0;
      this.life = hit.life || 3;
      this.t = 0;
      this.dead = false;
      this.hitList = new Set();
    }
    get box() { return { x: this.x - 14, y: this.y - 14, w: 28, h: 28 }; }

    update(dt, world) {
      this.t += dt;
      this.life -= dt;
      if (this.hit.homing) {
        // steer toward the nearest enemy
        let best = null, bd = Infinity;
        for (const tg of world.targets(this.team)) {
          if (!tg.alive || tg.isProp) continue;
          const b = tg.box;
          const d = Math.hypot(tg.x - this.x, b.y + b.h / 2 - this.y);
          if (d < bd) { bd = d; best = tg; }
        }
        if (best) {
          const b = best.box;
          const dx = best.x - this.x, dy = b.y + b.h / 2 - this.y, dd = Math.hypot(dx, dy) || 1;
          const k = Math.min(1, dt * 4);
          this.vx += ((dx / dd) * 520 - this.vx) * k;
          this.vy += ((dy / dd) * 520 - this.vy) * k;
        }
      }
      this.vy += this.gravity * (world.gravity || 1) * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      if (this.life <= 0) this.dead = true;
      if (this.kind === 'magic' || this.kind === 'ice') this.y = Math.min(this.y, world.groundY - 12);
      if (this.y >= world.groundY - 8 && !['note', 'magic', 'ice', 'quake'].includes(this.kind)) {
        this.dead = true;
        if (this.hit.explode) {
          // banana bomb: splash everyone nearby
          for (const tg of world.targets(this.team)) {
            if (!tg.alive || (tg.isProp && !this.hit.props)) continue;
            if (Math.abs(tg.x - this.x) < this.hit.explode && Math.abs(tg.y - world.groundY) < 70) {
              const dir = tg.x >= this.x ? 1 : -1;
              tg.takeHit({ dmg: this.hit.dmg, kbx: this.hit.kbx * dir, kby: this.hit.kby, stun: this.hit.stun, big: true, from: this, dir }, world);
            }
          }
          world.fx.burst(this.x, world.groundY - 10, '#ffe14d', 22, 340);
          world.fx.text(this.x, world.groundY - 70, 'KA-SPLAT!', '#ffd23f', 26);
          world.fx.shake(8);
          SS.Audio.bigSlap();
          return;
        }
        world.fx.burst(this.x, world.groundY - 6, PROJ_COLOR[this.kind] || '#8d6e4a', 8, 160);
        SS.Audio.crate();
        return;
      }
      for (const target of world.targets(this.team)) {
        if (!target.alive || (target.isProp && !this.hit.props) || this.hitList.has(target)) continue;
        if (!U.overlap(this.box, target.box)) continue;
        this.hitList.add(target);
        const dir = this.vx !== 0 ? Math.sign(this.vx) : (target.x >= this.x ? 1 : -1);
        const h = this.hit;
        const res = target.takeHit({
          dmg: h.dmg, kbx: (h.kbx || 100) * dir, kby: h.kby || -100, stun: h.stun || 0.3,
          sleep: h.sleep || 0, freeze: !!h.freeze, big: !!h.big, from: this, dir,
        }, world);
        if (res !== 'miss') {
          world.fx.burst(this.x, this.y, this.kind === 'note' ? '#c77dff' : '#ffd23f', 12);
          world.fx.text(this.x, this.y - 30, PROJ_WORD[this.kind] || 'BONK!', '#fff', 26);
          SS.Audio.slap();
          world.fx.shake(this.kind === 'bullet' ? 3 : 6);
          if (h.pierce) continue; // shockwaves roll on through everyone
          this.dead = true;
          break;
        }
      }
    }

    draw(ctx) {
      if (this.kind === 'note') SS.Art.note(ctx, this.x, this.y, { t: this.t });
      else if (this.kind === 'coconut') SS.Art.coconut(ctx, this.x, this.y, { t: this.t });
      else SS.Art.projectile(ctx, this.kind, this.x, this.y, this.t, Math.sign(this.vx) || 1);
    }
  };
})();
