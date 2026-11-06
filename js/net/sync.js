// Wi-Fi co-op sync. The host runs the real game and ~30 times a second sends a
// "snapshot" of everything guests need to draw, plus the effects and sounds that
// happened since the last one (recorded here so guests can replay them).
(function () {
  const FX_METHODS = ['burst', 'text', 'gore', 'splat', 'feathers', 'shake', 'slapText'];
  const AUDIO_METHODS = ['tone', 'noise', 'wobble', 'slap', 'bigSlap', 'whiff', 'jump', 'land', 'hurt', 'block',
    'pickup', 'heal', 'gong', 'crate', 'special', 'snore', 'ko', 'win', 'shoot', 'emptyClick', 'ammo', 'powerUp',
    'funnyDeath', 'playMusic'];
  const MAX_EVENTS = 300;
  const r1 = (v) => Math.round(v * 10) / 10;
  const r2 = (v) => Math.round(v * 100) / 100;
  let depth = 0; // only record the outermost call (e.g. slapText calls text internally)

  const S = (SS.Sync = {
    capturing: false,
    buffer: { fx: [], au: [] },
    seq: 0,

    record(kind, name, args) {
      const list = this.buffer[kind];
      list.push([name, args]);
      if (list.length > MAX_EVENTS) list.shift();
    },

    wrap(obj, name, kind) {
      const orig = obj[name];
      obj[name] = function (...args) {
        const rec = S.capturing && depth === 0;
        depth++;
        try { return orig.apply(this, args); } finally {
          depth--;
          if (rec) S.record(kind, name, args);
        }
      };
    },

    // Make this FX instance's calls replayable on guests.
    wrapFX(fx) {
      for (const m of FX_METHODS) this.wrap(fx, m, 'fx');
      return fx;
    },

    installAudioHook() {
      if (this._audioHooked) return;
      this._audioHooked = true;
      for (const m of AUDIO_METHODS) this.wrap(SS.Audio, m, 'au');
    },

    takeBuffer() {
      const b = this.buffer;
      this.buffer = { fx: [], au: [] };
      return b;
    },

    // Guests: play back the host's effects and sounds locally.
    replay(fx, msg) {
      for (const [m, a] of msg.fx || []) if (FX_METHODS.includes(m)) fx[m](...a);
      for (const [m, a] of msg.au || []) if (AUDIO_METHODS.includes(m)) SS.Audio[m](...a);
    },

    snapshot(scene) {
      const b = this.takeBuffer();
      const powers = (p) => {
        const o = {};
        for (const k of Object.keys(p)) o[k] = r2(p[k]);
        return o;
      };
      return {
        t: 'snap', n: ++this.seq, lv: scene.levelIndex, st: scene.state, stT: r2(scene.stateT), tm: r2(scene.t),
        cam: r1(scene.camX), sc: scene.score, ba: scene.bananas, hb: scene.hpBonus || 0, nb: scene.newBest ? 1 : 0,
        bo: scene.boss ? [Math.max(0, Math.round(scene.boss.hp)), scene.boss.maxHp, scene.bossAwake ? 1 : 0, scene.boss.alive ? 1 : 0] : 0,
        pl: scene.slots.map((sl) => {
          const f = sl.f;
          return Object.assign(f.renderState(), {
            id: sl.id, hp: Math.max(0, Math.round(f.hp)), mhp: f.maxHp, me: Math.round(f.meter),
            am: f.ammo, mam: f.maxAmmo, amt: r2(f.ammoT), amr: f.ammoRegen, pw: powers(f.powers), lk: f.lucky,
            rt: r1(sl.respawnT), cb: f.combo, cs: f.canSpecial ? 1 : 0,
          });
        }),
        en: scene.enemies.map((e) => [e.uid, e.type, r1(e.x), r1(e.y), e.facing, e.flash > 0 ? 1 : 0, e.alive ? 1 : 0,
          r2(e.spin), r2(e.throwing || 0), e.hurt > 0.8 ? 1 : 0, r2(e.t), e.visualFlags()]),
        cr: scene.crates.map((c) => [c.alive ? 1 : 0, r2(c.wobble), c.flash > 0 ? 1 : 0]),
        go: scene.gongs.map((g) => [g.done ? 1 : 0, r2(g.ring)]),
        ga: scene.gates.map((g) => [g.opened ? 1 : 0, r2(g.lift)]),
        pk: scene.pickups.map((p) => [p.type, r1(p.x), r1(p.y)]),
        pr: scene.projectiles.map((p) => [p.kind, r1(p.x), r1(p.y), Math.round(p.vx), Math.round(p.vy)]),
        fx: b.fx, au: b.au,
      };
    },
  });
})();
