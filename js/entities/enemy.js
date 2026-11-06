// Campaign enemies + slappable props (crates, gongs) + pickups.
(function () {
  const U = SS.U;
  const GRAV = 1900;

  const BIRD = { art: 'bird', behavior: 'flyer', hp: 10, speed: 130, w: 50, h: 40, dmg: 8, score: 150 };
  const TYPES = {
    beetle: { art: 'beetle', behavior: 'walker', hp: 12, speed: 75, w: 46, h: 34, dmg: 8, score: 100 },
    toucan: Object.assign({}, BIRD, { colors: { color: '#222', wing: '#111', belly: '#fff6a5', beak: '#ff9f1c' } }),
    seagull: Object.assign({}, BIRD, { colors: { color: '#eeeeee', wing: '#9e9e9e', belly: '#ffffff', beak: '#ffb703' } }),
    parrot: Object.assign({}, BIRD, { hp: 14, speed: 160, colors: { color: '#e63946', wing: '#3a86ff', belly: '#ffd23f', beak: '#333' } }),
    crab: { art: 'crab', behavior: 'crab', hp: 22, speed: 90, w: 64, h: 46, dmg: 9, score: 200, leash: 380 },
    monkey: { art: 'monkey', behavior: 'thrower', hp: 18, speed: 110, w: 46, h: 92, dmg: 7, score: 250, leash: 260 },
    pigeon: Object.assign({}, BIRD, { colors: { color: '#8d8fa8', wing: '#5f6178', belly: '#c3c5d6', beak: '#3a3a3a' } }),
    crane: Object.assign({}, BIRD, { hp: 14, speed: 160, colors: { color: '#f5f5f5', wing: '#222', belly: '#ffffff', beak: '#d4a017' } }),
    drone: { art: 'drone', behavior: 'flyer', hp: 14, speed: 150, w: 56, h: 44, dmg: 9, score: 200 },
    // monkey variants (same "keep distance and throw" brain, different looks and snacks)
    chef: { art: 'monkey', behavior: 'thrower', hp: 18, speed: 110, w: 46, h: 92, dmg: 7, score: 250, leash: 260,
      projectile: 'pizza', colors: { hat: 'chef' } },
    goldMonkey: { art: 'monkey', behavior: 'thrower', hp: 20, speed: 130, w: 46, h: 92, dmg: 7, score: 250, leash: 280,
      projectile: 'peach', colors: { fur: '#d4943a', face: '#9ad0e0' } },
    soldier: { art: 'monkey', behavior: 'thrower', hp: 22, speed: 110, w: 46, h: 92, dmg: 8, score: 300, leash: 260,
      projectile: 'balloon', colors: { fur: '#5a4632', hat: 'helmet' } },

    // ---- bosses ----
    kingBonkers: {
      art: 'monkey', behavior: 'boss', boss: true, hp: 280, speed: 150, w: 84, h: 175, dmg: 14, score: 3000,
      scale: 1.9, crown: true, name: 'KING BONKERS', weight: 3, moves: ['volley', 'slam', 'charge'],
      projectile: 'coconut', defeatText: 'KING BONKERS IS BONKED!',
    },
    bigPinchy: {
      art: 'crab', behavior: 'boss', boss: true, hp: 300, speed: 170, w: 150, h: 110, dmg: 14, score: 3000,
      scale: 2.4, name: 'BIG PINCHY THE SUPER CRAB', weight: 3, moves: ['charge', 'slam', 'volley', 'charge'],
      projectile: 'bubble', colors: { color: '#ff5d3a', hat: 'pirate' }, defeatText: 'BIG PINCHY GOT PINCHED!',
    },
    dragon: {
      art: 'dragon', behavior: 'dragon', boss: true, hp: 230, speed: 240, w: 90, h: 70, dmg: 12, score: 3500,
      name: 'THE DANCING DRAGON', weight: 4, projectile: 'lantern', defeatText: 'THE DRAGON TAKES A BOW!',
    },
    generalBonkers: {
      art: 'monkey', behavior: 'boss', boss: true, hp: 320, speed: 165, w: 90, h: 180, dmg: 15, score: 5000,
      scale: 1.95, name: 'GENERAL BONKERS', weight: 3, moves: ['volley', 'charge', 'slam'],
      projectile: 'pie', colors: { fur: '#5e3a1c', hat: 'general' }, defeatText: 'GENERAL BONKERS SURRENDERS!',
    },
  };
  SS.ENEMY_TYPES = TYPES;

  // How each kind of enemy splatters and what silly noise it makes when it goes down.
  const GORE = {
    beetle: { blood: '#7cd63b', sound: 'squish', word: 'SQUISH!' },
    bird: { blood: '#d62828', sound: 'squawk', word: 'SQUAWK!', feathers: true },
    crab: { blood: '#3a86ff', sound: 'bloop', word: 'BLOOP!' },
    monkey: { blood: '#d62828', sound: 'ook', word: 'OOK OOK!' },
    drone: { blood: 'oil', sound: 'bzzt', word: 'BZZT!' },
    dragon: { blood: 'confetti', sound: 'kazoo', word: 'TA-DAAA!' },
  };
  const goreFor = (d) => GORE[d.art] || GORE.monkey;

  SS.Enemy = class {
    constructor(type, x, y) {
      const d = (this.d = TYPES[type]);
      this.type = type;
      this.x = x;
      this.homeX = x;
      this.homeY = y !== undefined ? y : SS.GROUND_Y;
      this.y = this.homeY;
      this.vx = 0; this.vy = 0;
      this.hp = d.hp; this.maxHp = d.hp;
      this.facing = -1;
      this.alive = true;
      this.dying = 0;
      this.hurt = 0;
      this.flash = 0;
      this.cool = U.rand(0.5, 1.5);
      this.state = 'idle';
      this.stateT = 0;
      this.t = Math.random() * 10;
      this.spin = 0;
      this.isBoss = !!d.boss;
      this.trail = [];
      this.team = 'enemy';
    }

    get box() {
      return { x: this.x - this.d.w / 2, y: this.y - this.d.h, w: this.d.w, h: this.d.h };
    }

    takeHit(hit, world) {
      if (!this.alive) return 'miss';
      this.hp -= hit.dmg;
      this.flash = 0.1;
      this.hurt = this.isBoss ? 0.15 : hit.big ? 0.6 : 0.35;
      const w = this.d.weight || 1;
      this.vx = hit.kbx / w;
      if (this.d.behavior !== 'flyer' && this.d.behavior !== 'dragon') this.vy = hit.kby / w;
      this.state = 'idle';
      if (hit.sleep) this.hurt = hit.sleep;
      const g = goreFor(this.d);
      const cy = this.y - this.d.h * 0.55;
      world.fx.gore(this.x, cy, g.blood, hit.big ? 9 : 4, world.groundY);
      if (g.feathers) world.fx.feathers(this.x, cy, (this.d.colors && this.d.colors.color) || '#ddd', 2);
      if (this.hp <= 0) {
        world.fx.gore(this.x, cy, g.blood, this.isBoss ? 60 : 24, world.groundY);
        world.fx.splat(this.x, world.groundY, g.blood, this.isBoss ? 60 : 26);
        if (g.feathers) world.fx.feathers(this.x, cy, (this.d.colors && this.d.colors.color) || '#ddd', 12);
        world.fx.text(this.x + 30, cy - 40, g.word, '#ffffff', 26);
        SS.Audio.funnyDeath(g.sound);
        if (this.isBoss) SS.Audio.funnyDeath('boss');
        this.alive = false;
        this.dying = 1.2;
        this.vx = hit.dir * U.rand(500, 700);
        this.vy = -U.rand(600, 800);
        world.fx.text(this.x, this.y - this.d.h - 20, '+' + this.d.score, '#ffd23f', 24);
        if (world.onEnemyKilled) world.onEnemyKilled(this);
      }
      return 'hit';
    }

    update(dt, world, player) {
      this.t += dt;
      this.flash -= dt;
      if (this.d.art === 'dragon' && this.alive) {
        this.trail.unshift({ x: this.x, y: this.y - 35 });
        if (this.trail.length > 54) this.trail.pop();
      }
      if (!this.alive) {
        // comic launch off-screen while spinning
        this.dying -= dt;
        this.spin += dt * 14;
        this.vy += GRAV * dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        return;
      }
      const dx = player.x - this.x;
      const dist = Math.abs(dx);
      if (this.hurt > 0) {
        this.hurt -= dt;
        this.vx *= Math.pow(0.02, dt);
      } else {
        this.cool -= dt;
        this.stateT += dt;
        this.think(dt, world, player, dx, dist);
      }
      this.physics(dt, world);
    }

    physics(dt, world) {
      if (this.d.behavior === 'flyer' || this.d.behavior === 'dragon') {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        return;
      }
      this.vy += GRAV * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      if (this.y >= world.groundY) { this.y = world.groundY; this.vy = 0; }
      const b = world.enemyBounds ? world.enemyBounds(this) : null;
      if (b) this.x = U.clamp(this.x, b.min, b.max);
      // stay near home so enemies don't all gang up in one spot
      if (this.d.leash && this.alive) this.x = U.clamp(this.x, this.homeX - this.d.leash, this.homeX + this.d.leash);
    }

    contact(world, player, mult = 1) {
      if (this.cool > 0 || player.state === 'ko') return;
      if (U.overlap(this.box, player.box)) {
        player.takeHit({
          dmg: this.d.dmg * mult, kbx: Math.sign(player.x - this.x || 1) * 320, kby: -260,
          stun: 0.4, from: this,
        }, world);
        this.cool = 1.0;
      }
    }

    think(dt, world, player, dx, dist) {
      const d = this.d;
      const dir = Math.sign(dx) || 1;
      if (d.behavior !== 'thrower' || dist > 100) this.facing = dir;

      if (d.behavior === 'walker') {
        this.vx = dist < 520 ? dir * d.speed : 0;
        this.contact(world, player);
      } else if (d.behavior === 'flyer') {
        if (this.state === 'swoop') {
          this.vx = this.swoopDir * d.speed * 2.4;
          this.vy = Math.cos(this.stateT * 2.6) * 380;
          this.contact(world, player);
          if (this.stateT > 1.2) { this.state = 'idle'; this.cool = 1.6; }
        } else {
          this.vy = (this.homeY + Math.sin(this.t * 2) * 25 - this.y) * 3;
          this.vx = dist < 600 ? dir * d.speed * 0.4 : 0;
          if (dist < 330 && this.cool <= 0) {
            this.state = 'swoop'; this.stateT = 0; this.swoopDir = dir;
            SS.Audio.tone(900, 0.25, 'square', 0.06, 500);
          }
        }
      } else if (d.behavior === 'crab') {
        if (this.state === 'pinch') {
          this.vx = 0;
          if (this.stateT > 0.35 && !this.pinched) {
            this.pinched = true;
            const reach = { x: this.facing > 0 ? this.x : this.x - 80, y: this.y - 50, w: 80, h: 50 };
            if (U.overlap(reach, player.box)) {
              player.takeHit({ dmg: d.dmg, kbx: this.facing * 380, kby: -300, stun: 0.45, from: this }, world);
              world.fx.text(player.x, player.y - player.h - 10, 'PINCH!', '#ff4d6d', 24);
            }
          }
          if (this.stateT > 0.8) { this.state = 'idle'; this.cool = 1.2; }
        } else {
          // sideways shuffle toward the player
          this.vx = dist < 560 ? dir * d.speed * (0.6 + Math.abs(Math.sin(this.t * 3))) : 0;
          if (dist < 75 && this.cool <= 0) { this.state = 'pinch'; this.stateT = 0; this.pinched = false; }
        }
      } else if (d.behavior === 'thrower') {
        if (dist > 600) { this.vx = 0; return; }
        this.facing = dir;
        const want = 280;
        this.vx = dist < want - 40 ? -dir * d.speed : dist > want + 60 ? dir * d.speed : 0;
        this.throwing = Math.max(0, (this.throwing || 0) - dt * 3);
        const onScreen = world.camX === undefined ||
          (this.x > world.camX + 30 && this.x < world.camX + SS.W - 30);
        if (this.cool <= 0 && onScreen) {
          this.throwArc(world, player, 0);
          this.cool = U.rand(2.0, 3.0);
        }
        this.contact(world, player);
      } else if (d.behavior === 'boss') {
        this.bossThink(dt, world, player, dx, dist, dir);
      } else if (d.behavior === 'dragon') {
        this.dragonThink(dt, world, player, dx, dir);
      }
    }

    throwArc(world, player, spread) {
      this.throwing = 1;
      const t = 0.9;
      const tx = player.x + spread;
      const vx = (tx - this.x) / t;
      const startY = this.y - this.d.h * 0.8;
      const vy = (player.y - 40 - startY - 0.5 * 900 * t * t) / t;
      world.spawn(new SS.Projectile(this.d.projectile || 'coconut', this.x, startY, vx, vy, 'enemy',
        { dmg: this.d.boss ? 8 : this.d.dmg, stun: 0.4, kbx: 220, kby: -220, gravity: 900 }));
      SS.Audio.whiff();
    }

    bossThink(dt, world, player, dx, dist, dir) {
      const d = this.d;
      this.throwing = Math.max(0, (this.throwing || 0) - dt * 3);
      const enraged = this.hp < this.maxHp * 0.4;
      if (this.state === 'idle') {
        this.vx = dir * d.speed * (enraged ? 1.3 : 0.8);
        this.contact(world, player, 1);
        if (this.cool <= 0) {
          const moves = d.moves || ['volley', 'slam', 'charge'];
          this.state = moves[Math.floor(Math.random() * moves.length)];
          this.stateT = 0;
          this.vx = 0;
          if (this.state === 'charge') {
            this.chargeDir = dir;
            world.fx.text(this.x, this.y - d.h - 20, d.art === 'crab' ? 'SNIP SNAP!' : 'OOK OOK!', '#ff4d6d', 30);
          }
        }
      } else if (this.state === 'volley') {
        this.vx = 0;
        const shots = enraged ? 5 : 3;
        const n = Math.floor(this.stateT / 0.3);
        if (n > (this.shots || 0) && n <= shots) {
          this.shots = n;
          this.throwArc(world, player, U.rand(-90, 90));
        }
        if (this.stateT > shots * 0.3 + 0.5) this.endBossMove(enraged);
      } else if (this.state === 'slam') {
        if (this.stateT < 0.05 && this.y >= world.groundY - 1) {
          this.vy = -900;
          this.vx = dx * 1.1;
        }
        if (this.stateT > 0.2 && this.y >= world.groundY - 1 && !this.slammed) {
          this.slammed = true;
          this.vx = 0;
          SS.Audio.bigSlap();
          world.fx.shake(18);
          world.fx.burst(this.x, this.y, '#9c4a2f', 26, 400);
          if (player.onGround && Math.abs(player.x - this.x) < 230) {
            player.takeHit({ dmg: d.dmg, kbx: dir * 450, kby: -500, stun: 0.6, from: this }, world);
          }
        }
        if (this.stateT > 1.4) this.endBossMove(enraged);
      } else if (this.state === 'charge') {
        this.vx = this.stateT < 0.5 ? 0 : this.chargeDir * d.speed * 3.2;
        this.contact(world, player, 1.2);
        if (this.stateT > 1.6) this.endBossMove(enraged);
      }
    }

    // Flies above the arena, swoops low across the ground, and drops paper lanterns.
    dragonThink(dt, world, player, dx, dir) {
      const d = this.d;
      const enraged = this.hp < this.maxHp * 0.4;
      // Fly over the whole boss arena (from just before its spawn point to the end of the map).
      const minX = this.homeX - 340;
      const maxX = (world.limitsFor ? world.limitsFor(this.x).max : this.homeX + 600) - 60;
      const hoverY = this.homeY;
      const lowY = world.groundY - 8;
      this.facing = this.vx !== 0 ? Math.sign(this.vx) : dir;
      if (this.state === 'idle') {
        const tx = U.clamp(player.x + Math.sin(this.t * 0.8) * 160, minX, maxX);
        this.vx = U.clamp((tx - this.x) * 1.5, -d.speed, d.speed);
        this.vy = (hoverY + Math.sin(this.t * 3) * 30 - this.y) * 3;
        if (this.cool <= 0) {
          this.state = Math.random() < 0.55 ? 'swoop' : 'drop';
          this.stateT = 0;
          this.shots = 0;
          this.swoopDir = dir;
          if (this.state === 'swoop') world.fx.text(this.x, this.y - 90, 'WHOOSH!', '#ffd23f', 30);
        }
      } else if (this.state === 'swoop') {
        if (this.stateT < 0.7) {
          // dive toward a point beside the player
          const tx = U.clamp(player.x - this.swoopDir * 260, minX, maxX);
          this.vx = (tx - this.x) * 3;
          this.vy = (lowY - this.y) * 4;
        } else if (this.stateT < 2.1) {
          this.vx = this.swoopDir * d.speed * (enraged ? 1.9 : 1.5);
          this.vy = (lowY - this.y) * 6;
          this.contact(world, player, 1);
        } else {
          // the dancers inside the costume need a breather: free slaps!
          this.state = 'rest';
          this.stateT = 0;
          world.fx.text(this.x, this.y - 100, 'HUFF... PUFF...', '#bde0fe', 26);
        }
      } else if (this.state === 'rest') {
        this.vx *= Math.pow(0.01, dt);
        this.vy = (lowY - this.y) * 6;
        if (Math.random() < dt * 3) world.fx.text(this.x + U.rand(-30, 30), this.y - 90, 'pant', '#ffffff', 16);
        if (this.stateT > (enraged ? 1.3 : 1.9)) this.endBossMove(enraged);
      } else if (this.state === 'drop') {
        this.vx = U.clamp((player.x - this.x) * 2, -d.speed, d.speed);
        this.vy = (hoverY - 20 - this.y) * 3;
        const shots = enraged ? 5 : 3;
        const n = Math.floor(this.stateT / 0.45);
        if (n > this.shots && n <= shots) {
          this.shots = n;
          world.spawn(new SS.Projectile('lantern', this.x, this.y - 20, U.rand(-60, 60), 0, 'enemy',
            { dmg: 8, stun: 0.4, kbx: 200, kby: -220, gravity: 700 }));
        }
        if (this.stateT > shots * 0.45 + 0.6) this.endBossMove(enraged);
      }
      if (this.x < minX) { this.x = minX; this.vx = Math.abs(this.vx); this.swoopDir = 1; }
      if (this.x > maxX) { this.x = maxX; this.vx = -Math.abs(this.vx); this.swoopDir = -1; }
    }

    endBossMove(enraged) {
      this.state = 'idle';
      this.stateT = 0;
      this.shots = 0;
      this.slammed = false;
      this.cool = enraged ? U.rand(0.7, 1.2) : U.rand(1.4, 2.2);
    }

    draw(ctx, world) {
      const d = this.d;
      if (this.alive && d.behavior !== 'flyer') SS.Art.shadow(ctx, this.x, world.groundY, d.w * 0.6);
      ctx.save();
      if (!this.alive) {
        ctx.translate(this.x, this.y - d.h / 2);
        ctx.rotate(this.spin);
        ctx.translate(-this.x, -(this.y - d.h / 2));
      }
      const o = Object.assign({
        t: this.t, facing: this.facing, flash: this.flash > 0, scale: d.scale || 1,
        crown: d.crown, throwing: this.throwing,
      }, d.colors || {});
      if (d.art === 'dragon') {
        o.trail = this.alive ? this.trail : [];
        SS.Art.dragon(ctx, this.x, this.y - 35, o);
      } else {
        SS.Art[d.art](ctx, this.x, this.y, o);
      }
      if (this.alive && this.hurt > 0.8) {
        SS.UI.outlineText(ctx, 'Zzz', this.x + 10, this.y - d.h - 10 - Math.sin(this.t * 4) * 5, 20, '#bde0fe', 'center');
      }
      ctx.restore();
    }
  };

  // ---------- Props ----------
  SS.Crate = class {
    constructor(x, loot) {
      this.x = x; this.y = SS.GROUND_Y; this.loot = loot;
      this.hp = 2; this.alive = true; this.isProp = true; this.wobble = 0; this.flash = 0;
    }
    get box() { return { x: this.x - 22, y: this.y - 44, w: 44, h: 44 }; }
    takeHit(hit, world) {
      this.hp -= 1;
      this.wobble = 0.3;
      this.flash = 0.08;
      SS.Audio.crate();
      if (this.hp <= 0) {
        this.alive = false;
        world.fx.burst(this.x, this.y - 22, '#c68642', 16, 300);
        world.fx.text(this.x, this.y - 60, 'CRUNCH!', '#ffd23f', 26);
        if (this.loot !== 'none') world.addPickup(this.loot, this.x, this.y - 30);
        world.addPickup('ammo', this.x + 34, this.y - 4);
      }
      return 'hit';
    }
    update(dt) { this.wobble = Math.max(0, this.wobble - dt); this.flash -= dt; }
    draw(ctx) { if (this.alive) SS.Art.crate(ctx, this.x, this.y, { wobble: this.wobble, flash: this.flash > 0 }); }
  };

  SS.Gong = class {
    constructor(id, x) {
      this.id = id; this.x = x; this.y = SS.GROUND_Y;
      this.alive = true; this.isProp = true; this.done = false; this.ring = 0; this.t = 0;
    }
    get box() { return { x: this.x - 32, y: this.y - 100, w: 64, h: 70 }; }
    takeHit(hit, world) {
      this.ring = 1;
      SS.Audio.gong();
      world.fx.shake(8);
      if (!this.done) {
        this.done = true;
        world.fx.text(this.x, this.y - 150, 'GONNNG! GATE OPEN!', '#ffd23f', 28);
        world.openGate(this.id);
      }
      return 'hit';
    }
    update(dt) { this.t += dt; this.ring = Math.max(0, this.ring - dt * 0.6); }
    draw(ctx) { SS.Art.gong(ctx, this.x, this.y, { ring: this.ring, done: this.done, t: this.t }); }
  };

  SS.Pickup = class {
    constructor(type, x, y) {
      this.type = type; this.x = x; this.y = y; this.t = Math.random() * 5; this.taken = false;
    }
    get box() { return { x: this.x - 16, y: this.y - 36, w: 32, h: 36 }; }
    update(dt) { this.t += dt; }
    draw(ctx) {
      if (this.taken) return;
      if (this.type === 'banana') SS.Art.banana(ctx, this.x, this.y, this.t);
      else if (this.type === 'ammo') SS.Art.ammoBox(ctx, this.x, this.y, this.t);
      else SS.Art.hibiscus(ctx, this.x, this.y - 16, this.t);
    }
  };
})();
