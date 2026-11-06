// Core engine: canvas scaling, game loop, scene switching, small utilities.
window.SS = window.SS || {};

(function () {
  const W = 960;
  const H = 540;
  SS.W = W;
  SS.H = H;

  // ---------- Utilities ----------
  SS.U = {
    clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
    lerp: (a, b, t) => a + (b - a) * t,
    rand: (a, b) => a + Math.random() * (b - a),
    randInt: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
    choice: (arr) => arr[Math.floor(Math.random() * arr.length)],
    overlap: (a, b) =>
      a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y,
    easeOutBack: (t) => {
      const c1 = 1.70158, c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },
  };

  // ---------- Save data (localStorage, never required) ----------
  SS.Save = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem('slothslap.' + key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (e) {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem('slothslap.' + key, JSON.stringify(value));
      } catch (e) { /* storage unavailable: ignore */ }
    },
  };

  // ---------- Engine ----------
  const E = (SS.Engine = {
    canvas: null,
    ctx: null,
    scene: null,
    pixel: 1,
    time: 0,
    hitstop: 0,
    last: 0,

    init() {
      this.canvas = document.getElementById('game');
      this.ctx = this.canvas.getContext('2d');
      this.resize();
      window.addEventListener('resize', () => this.resize());
      SS.Input.init(this.canvas);
      requestAnimationFrame((t) => this.loop(t));
    },

    resize() {
      const s = Math.min(window.innerWidth / W, window.innerHeight / H);
      const dpr = window.devicePixelRatio || 1;
      this.cssScale = s;
      this.canvas.style.width = Math.floor(W * s) + 'px';
      this.canvas.style.height = Math.floor(H * s) + 'px';
      this.canvas.width = Math.round(W * s * dpr);
      this.canvas.height = Math.round(H * s * dpr);
      this.pixel = (s * dpr);
    },

    setScene(scene) {
      if (this.scene && this.scene.exit) this.scene.exit();
      this.scene = scene;
      if (scene.enter) scene.enter();
    },

    // Freeze gameplay briefly on big hits for comic impact.
    freeze(seconds) {
      this.hitstop = Math.max(this.hitstop, seconds);
    },

    loop(ts) {
      const dt = Math.min(0.05, (ts - (this.last || ts)) / 1000);
      this.last = ts;
      this.time += dt;
      SS.Input.poll();

      const frozen = this.hitstop > 0;
      if (frozen) this.hitstop -= dt;

      const ctx = this.ctx;
      ctx.setTransform(this.pixel, 0, 0, this.pixel, 0, 0);

      if (this.scene) {
        if (!frozen) this.scene.update(dt);
        this.scene.draw(ctx);
      }

      if (!frozen) SS.Input.endFrame();
      requestAnimationFrame((t) => this.loop(t));
    },
  });
})();
