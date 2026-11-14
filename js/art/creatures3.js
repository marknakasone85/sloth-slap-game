// Even more cartoon creatures: squirrel, goose, scorpion, mummy, spider, mole,
// pizza rat, taxi - plus acorns, feathers, scarabs, spit and hot dogs.
// Creatures are drawn with feet at (x, y), facing right unless o.facing = -1.
(function () {
  const A = SS.Art;
  const el = (ctx, x, y, rx, ry, rot = 0) => {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
    ctx.fill();
  };
  const begin = (ctx, x, y, o) => {
    ctx.save();
    ctx.translate(x, y);
    const s = o.scale || 1;
    ctx.scale((o.facing || 1) * s, s);
    return (c) => (o.flash ? '#ffffff' : c);
  };
  const angryEye = (ctx, C, x, y, r, iris = '#111') => {
    ctx.fillStyle = C('#fff');
    el(ctx, x, y, r, r);
    ctx.fillStyle = C(iris);
    el(ctx, x + r * 0.35, y + r * 0.1, r * 0.5, r * 0.5);
    ctx.strokeStyle = C('#111');
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x - r, y - r - 2);
    ctx.lineTo(x + r, y - r * 0.4);
    ctx.stroke();
  };
  const crown = (ctx, C, x, y, w) => {
    ctx.fillStyle = C('#ffd23f');
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y);
    ctx.lineTo(x - w / 2 - 2, y - 14); ctx.lineTo(x - w / 4, y - 7); ctx.lineTo(x, y - 18);
    ctx.lineTo(x + w / 4, y - 7); ctx.lineTo(x + w / 2 + 2, y - 14); ctx.lineTo(x + w / 2, y);
    ctx.closePath();
    ctx.fill();
  };

  // ---------------- acorn-throwing squirrel ----------------
  A.squirrel = function (ctx, x, y, o) {
    const C = begin(ctx, x, y, o);
    const t = o.t || 0;
    const fur = o.color || '#9a7b62';
    ctx.fillStyle = C('#b89a80');
    el(ctx, -20, -38 + Math.sin(t * 6) * 2, 13, 24, -0.4);
    ctx.fillStyle = C(fur);
    el(ctx, -6, -4, 9, 5);
    el(ctx, 0, -22, 14, 17);
    ctx.fillStyle = C('#efe2d0');
    el(ctx, 5, -20, 7, 11);
    ctx.fillStyle = C(fur);
    el(ctx, 10, -44, 11, 10);
    el(ctx, 5, -55, 4, 6, -0.3);
    ctx.fillStyle = C('#3a2a1e');
    el(ctx, 20, -42, 2.5, 2);
    angryEye(ctx, C, 13, -46, 3.2);
    if (o.throwing > 0) {
      ctx.fillStyle = C('#8d5a2b');
      el(ctx, 16, -32 - o.throwing * 14, 5, 6);
    }
    ctx.restore();
  };

  // ---------------- grumpy goose ----------------
  A.goose = function (ctx, x, y, o) {
    const C = begin(ctx, x, y, o);
    const t = o.t || 0;
    const step = Math.sin(t * (o.charging ? 26 : 9)) * 5;
    ctx.strokeStyle = C('#f08a24');
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-4, -16); ctx.lineTo(-6 + step, 0); ctx.moveTo(6, -16); ctx.lineTo(8 - step, 0); ctx.stroke();
    ctx.fillStyle = C(o.color || '#8a7f72');
    el(ctx, 0, -28, 26, 15, -0.1);
    ctx.fillStyle = C('#5e554b');
    el(ctx, -6, -30, 16, 8, -0.2);
    ctx.fillStyle = C('#efe8dc');
    el(ctx, 8, -20, 12, 7);
    // long black neck: straight up normally, stretched forward when charging
    ctx.strokeStyle = C('#1d1d1d');
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    const hx = o.charging ? 46 : 26, hy = o.charging ? -40 : -66;
    ctx.beginPath(); ctx.moveTo(18, -34); ctx.quadraticCurveTo(o.charging ? 34 : 18, o.charging ? -40 : -56, hx, hy); ctx.stroke();
    ctx.fillStyle = C('#1d1d1d');
    el(ctx, hx, hy, 9, 7);
    ctx.fillStyle = C('#ffffff');
    el(ctx, hx - 1, hy + 3, 5, 3);
    ctx.fillStyle = C('#3a3a3a');
    ctx.beginPath(); ctx.moveTo(hx + 6, hy - 3); ctx.lineTo(hx + 20, hy + 1); ctx.lineTo(hx + 6, hy + 4); ctx.fill();
    angryEye(ctx, C, hx + 2, hy - 3, 2.8, '#b5302a');
    if (o.charging) {
      ctx.strokeStyle = C('rgba(255,255,255,0.8)');
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(hx + 22, hy, 6 + i * 6, -0.6, 0.6); ctx.stroke(); }
    }
    if (o.crown) crown(ctx, C, hx, hy - 8, 16);
    ctx.restore();
  };

  // ---------------- scorpion ----------------
  A.scorpion = function (ctx, x, y, o) {
    const C = begin(ctx, x, y, o);
    const t = o.t || 0;
    const c = o.color || '#c98a2c', dark = '#8a5a14';
    const snap = Math.abs(Math.sin(t * 6)) * 0.5;
    ctx.strokeStyle = C(dark);
    ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++) {
      const lx = -14 + i * 9, k = Math.sin(t * 18 + i) * 3;
      ctx.beginPath(); ctx.moveTo(lx, -10); ctx.lineTo(lx - 6 + k, 0); ctx.stroke();
    }
    ctx.fillStyle = C(c);
    el(ctx, 0, -14, 22, 10);
    // tail arching over the back with a stinger
    ctx.strokeStyle = C(c);
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    const sway = Math.sin(t * 4) * 4;
    ctx.beginPath(); ctx.moveTo(-18, -16); ctx.bezierCurveTo(-44, -30, -36, -62, -8 + sway, -58); ctx.stroke();
    ctx.fillStyle = C('#4a2c0a');
    ctx.beginPath(); ctx.moveTo(-8 + sway, -64); ctx.lineTo(4 + sway, -56); ctx.lineTo(-8 + sway, -52); ctx.fill();
    // pincers
    ctx.fillStyle = C(c);
    el(ctx, 26, -16, 8, 6);
    ctx.beginPath(); ctx.moveTo(30, -18); ctx.lineTo(42, -26 - snap * 8); ctx.lineTo(40, -14); ctx.fill();
    ctx.beginPath(); ctx.moveTo(30, -14); ctx.lineTo(42, -6 + snap * 6); ctx.lineTo(40, -16); ctx.fill();
    angryEye(ctx, C, 14, -20, 3);
    if (o.crown) crown(ctx, C, 10, -22, 14);
    ctx.restore();
  };

  // ---------------- mummy ----------------
  A.mummy = function (ctx, x, y, o) {
    const C = begin(ctx, x, y, o);
    const t = o.t || 0;
    const wrap = o.color || '#e9dcc0', line = '#b9a988';
    const sh = Math.sin(t * 4) * 4;
    ctx.fillStyle = C(wrap);
    ctx.beginPath(); ctx.roundRect(-12 + sh * 0.3, -40, 10, 40, 4); ctx.roundRect(2 - sh * 0.3, -40, 10, 40, 4); ctx.fill();
    ctx.beginPath(); ctx.roundRect(-18, -86, 36, 50, 12); ctx.fill();
    // arms stretched forward, zombie-style
    ctx.beginPath(); ctx.roundRect(4, -80 + sh * 0.2, 40, 10, 5); ctx.roundRect(4, -66 - sh * 0.2, 36, 10, 5); ctx.fill();
    el(ctx, 2, -100, 15, 15);
    ctx.strokeStyle = C(line);
    ctx.lineWidth = 2;
    for (let yy = -94; yy < -4; yy += 9) { ctx.beginPath(); ctx.moveTo(-18, yy); ctx.lineTo(18, yy + 4); ctx.stroke(); }
    // loose bandage flapping
    ctx.strokeStyle = C(wrap);
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(-14, -60); ctx.quadraticCurveTo(-30, -50 + sh, -38, -36 - sh); ctx.stroke();
    ctx.fillStyle = C('#1d1d1d');
    ctx.fillRect(-4, -104, 18, 7);
    ctx.fillStyle = C(o.eyes || '#ffd23f');
    el(ctx, 2, -100, 2.5, 2.5);
    el(ctx, 10, -100, 2.5, 2.5);
    if (o.crown) {
      // pharaoh headdress
      ctx.fillStyle = C('#3a6ea5');
      ctx.beginPath(); ctx.moveTo(-18, -110); ctx.lineTo(20, -112); ctx.lineTo(24, -84); ctx.lineTo(-24, -82); ctx.closePath(); ctx.fill();
      ctx.fillStyle = C('#ffd23f');
      for (let k = 0; k < 4; k++) ctx.fillRect(-20 + k * 11, -110, 5, 26);
      crown(ctx, C, 2, -112, 22);
    }
    ctx.restore();
  };

  // ---------------- cave spider (dangles on a thread) ----------------
  A.spider = function (ctx, x, y, o) {
    ctx.strokeStyle = 'rgba(230,230,240,0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x, y - 600); ctx.lineTo(x, y - 30); ctx.stroke();
    const C = begin(ctx, x, y, o);
    const t = o.t || 0;
    const c = o.color || '#3d2c55';
    ctx.strokeStyle = C(c);
    ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++) {
      const k = Math.sin(t * 10 + i) * 4;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(s * 6, -22);
        ctx.quadraticCurveTo(s * (20 + i * 3), -36 + i * 6 + k, s * (26 + i * 2), -10 + i * 4);
        ctx.stroke();
      }
    }
    ctx.fillStyle = C(c);
    el(ctx, 0, -24, 14, 13);
    el(ctx, 0, -38, 9, 8);
    ctx.fillStyle = C('#ff4d6d');
    for (const [ex, ey] of [[-4, -40], [4, -40], [-2, -35], [2, -35]]) el(ctx, ex, ey, 2, 2);
    ctx.restore();
  };

  // ---------------- giant mole (miner's hard hat) ----------------
  A.mole = function (ctx, x, y, o) {
    if (o.burrowed) {
      // just a moving mound of dirt
      ctx.fillStyle = '#7f5539';
      ctx.beginPath(); ctx.ellipse(x, y, 46 * (o.scale || 1) * 0.6, 16, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#5c3b25';
      for (let i = -2; i <= 2; i++) el(ctx, x + i * 12, y - 6 - Math.abs(Math.sin((o.t || 0) * 12 + i)) * 10, 4, 4);
      return;
    }
    const C = begin(ctx, x, y, o);
    const t = o.t || 0;
    ctx.fillStyle = C('#6b4a3a');
    el(ctx, 0, -38, 42, 38);
    ctx.fillStyle = C('#8d6b58');
    el(ctx, 6, -30, 26, 26);
    // big digging claws
    ctx.fillStyle = C('#f2c9b6');
    for (const s of [-1, 1]) {
      el(ctx, s * 34 + 10, -20, 12, 9, s * 0.4);
      ctx.strokeStyle = C('#f8f1ea');
      ctx.lineWidth = 3;
      for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(s * 34 + 18, -20 + k * 5); ctx.lineTo(s * 34 + 28, -18 + k * 6); ctx.stroke(); }
    }
    ctx.fillStyle = C('#ff8fa3');
    el(ctx, 30, -52, 9, 7);
    ctx.fillStyle = C('#1d1d1d');
    el(ctx, 16, -62, 3, 2);
    el(ctx, 26, -63, 3, 2);
    ctx.strokeStyle = C('#1d1d1d');
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(10, -68); ctx.lineTo(20, -65); ctx.moveTo(22, -67); ctx.lineTo(31, -69); ctx.stroke();
    // hard hat + headlamp
    ctx.fillStyle = C('#ffd23f');
    ctx.beginPath(); ctx.arc(4, -70, 26, Math.PI, 0); ctx.fill();
    ctx.fillRect(-26, -72, 60, 6);
    ctx.fillStyle = C('#fff3b0');
    el(ctx, 26, -82, 6, 6);
    ctx.fillStyle = `rgba(255,243,176,${0.25 + Math.sin(t * 3) * 0.1})`;
    ctx.beginPath(); ctx.moveTo(30, -86); ctx.lineTo(120, -110); ctx.lineTo(120, -54); ctx.lineTo(30, -78); ctx.fill();
    if (o.crown) crown(ctx, C, 4, -96, 24);
    ctx.restore();
  };

  // ---------------- pizza rat ----------------
  A.rat = function (ctx, x, y, o) {
    const C = begin(ctx, x, y, o);
    const t = o.t || 0;
    const run = Math.sin(t * 22) * 4;
    ctx.strokeStyle = C('#e8a0a8');
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-20, -12); ctx.quadraticCurveTo(-40, -6 + run, -48, -20); ctx.stroke();
    ctx.fillStyle = C(o.color || '#7d7d85');
    el(ctx, -2, -14, 22, 12);
    el(ctx, 18, -20, 11, 9);
    ctx.fillStyle = C('#e8a0a8');
    el(ctx, 12, -30, 5, 6);
    el(ctx, 30, -19, 3, 3);
    ctx.strokeStyle = C('#5e5e66');
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-10, -4); ctx.lineTo(-12 + run, 0); ctx.moveTo(8, -4); ctx.lineTo(10 - run, 0); ctx.stroke();
    angryEye(ctx, C, 20, -24, 3);
    // the famous slice of pizza
    ctx.save();
    ctx.translate(32, -16);
    ctx.rotate(0.5);
    ctx.fillStyle = C('#f4c542');
    ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(9, 8); ctx.lineTo(-9, 8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = C('#c0392b');
    el(ctx, -2, 3, 2, 2); el(ctx, 3, 5, 2, 2);
    ctx.restore();
    if (o.crown) crown(ctx, C, 16, -30, 14);
    ctx.restore();
  };

  // ---------------- angry taxi ----------------
  A.taxi = function (ctx, x, y, o) {
    const C = begin(ctx, x, y, o);
    const t = o.t || 0;
    ctx.fillStyle = C('#ffd23f');
    ctx.beginPath(); ctx.roundRect(-52, -44, 104, 30, 8); ctx.fill();
    ctx.beginPath(); ctx.roundRect(-30, -66, 60, 26, 10); ctx.fill();
    ctx.fillStyle = C('#9bf6ff');
    ctx.fillRect(-24, -60, 22, 16);
    ctx.fillRect(4, -60, 22, 16);
    angryEye(ctx, C, 15, -52, 5);
    ctx.fillStyle = C('#1d1d1d');
    for (let k = 0; k < 8; k++) ctx.fillRect(-48 + k * 12, -30, 6, 5);
    ctx.fillStyle = C('#ffffff');
    ctx.fillRect(-12, -76, 24, 10);
    SS.UI.text(ctx, 'TAXI', 0, -71, 8, '#1d1d1d', 'center');
    ctx.fillStyle = C('#fff3b0');
    el(ctx, 50, -32, 4, 5);
    ctx.fillStyle = C('#222');
    for (const wx of [-32, 32]) {
      el(ctx, wx, -12, 12, 12);
      ctx.fillStyle = C('#888');
      el(ctx, wx, -12, 5, 5);
      ctx.fillStyle = C('#222');
    }
    if (o.charging) {
      ctx.strokeStyle = C('rgba(255,255,255,0.7)');
      ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-60 - i * 6, -44 + i * 10); ctx.lineTo(-86 - i * 6, -44 + i * 10); ctx.stroke(); }
      SS.UI.outlineText(ctx, Math.floor(t * 4) % 2 ? 'HONK!' : 'BEEP!', 0, -96, 13, '#ffffff', 'center');
    }
    ctx.restore();
  };

  // ---------------- spitting camel ----------------
  A.camel = function (ctx, x, y, o) {
    const C = begin(ctx, x, y, o);
    const t = o.t || 0;
    const c = o.color || '#c9a26b', dark = '#a17d4b';
    const step = Math.sin(t * 6) * 4;
    ctx.strokeStyle = C(dark);
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    for (const [lx, k] of [[-20, 1], [-10, -1], [14, 1], [24, -1]]) {
      ctx.beginPath(); ctx.moveTo(lx, -34); ctx.lineTo(lx + step * k, 0); ctx.stroke();
    }
    ctx.fillStyle = C(c);
    el(ctx, 0, -44, 32, 16);
    el(ctx, -6, -60, 14, 12);
    el(ctx, 8, -58, 11, 10);
    ctx.strokeStyle = C(c);
    ctx.lineWidth = 11;
    ctx.beginPath(); ctx.moveTo(26, -48); ctx.quadraticCurveTo(40, -64, 38, -84); ctx.stroke();
    ctx.fillStyle = C(c);
    el(ctx, 44, -88, 13, 8);
    el(ctx, 36, -96, 4, 5);
    ctx.fillStyle = C('#7a5a35');
    el(ctx, 54, -86, 3, 2);
    angryEye(ctx, C, 42, -92, 3);
    if (o.throwing > 0) {
      ctx.fillStyle = C('rgba(190,230,255,0.9)');
      el(ctx, 58 + o.throwing * 6, -84, 4, 3);
    }
    ctx.restore();
  };

  // ---------------- more thrown things ----------------
  const baseProjectile = A.projectile;
  A.projectile = function (ctx, kind, x, y, t, dir = 1) {
    if (kind === 'quake') {
      // gorilla ground-pound shockwave: a rolling wall of dust and rocks
      // (animated from x, so it also moves on Wi-Fi guests' screens)
      const ph = x * 0.06;
      ctx.fillStyle = 'rgba(214,180,130,0.55)';
      el(ctx, x - dir * 14, y + 6, 40, 16);
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x - dir * 4, y + 14, 24, Math.PI * 1.08, Math.PI * 1.92);
      ctx.stroke();
      ctx.fillStyle = '#7a5c3e';
      for (let i = 0; i < 5; i++) {
        const px = x - dir * i * 11;
        const py = y + 10 - Math.abs(Math.sin(ph + i * 1.3)) * 30 * (1 - i * 0.15);
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(ph + i);
        ctx.fillRect(-5, -4, 10, 8);
        ctx.restore();
      }
    } else if (kind === 'acorn') {
      ctx.fillStyle = '#8d5a2b'; el(ctx, x, y + 2, 7, 8);
      ctx.fillStyle = '#5c3b1e'; el(ctx, x, y - 5, 8, 4);
    } else if (kind === 'feather') {
      ctx.save(); ctx.translate(x, y); ctx.rotate(t * 5);
      ctx.fillStyle = '#efe8dc'; el(ctx, 0, 0, 12, 4);
      ctx.strokeStyle = '#8a7f72'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(12, 0); ctx.stroke();
      ctx.restore();
    } else if (kind === 'scarab') {
      ctx.save(); ctx.translate(x, y); ctx.rotate(t * 8);
      ctx.fillStyle = '#2a9d8f'; el(ctx, 0, 0, 9, 11);
      ctx.fillStyle = '#ffd23f'; ctx.fillRect(-1, -11, 2, 22);
      ctx.restore();
    } else if (kind === 'spit') {
      ctx.fillStyle = 'rgba(190,230,255,0.85)'; el(ctx, x, y, 8, 6);
      ctx.fillStyle = 'rgba(255,255,255,0.9)'; el(ctx, x - 2, y - 2, 2, 2);
    } else if (kind === 'bananaBomb') {
      ctx.save(); ctx.translate(x, y); ctx.rotate(t * 8);
      ctx.fillStyle = '#ffe14d';
      ctx.beginPath(); ctx.arc(0, -6, 12, 0.3, Math.PI - 0.3); ctx.arc(0, -12, 14, Math.PI - 0.5, 0.5, true); ctx.closePath(); ctx.fill();
      ctx.restore();
      ctx.fillStyle = Math.floor(t * 20) % 2 ? '#ff7b00' : '#ffd23f';
      SS.FX.star(ctx, x + 8, y - 12, 5);
    } else if (kind === 'magic') {
      ctx.fillStyle = 'rgba(199,125,255,0.35)'; el(ctx, x, y, 14, 14);
      ctx.fillStyle = '#e0aaff'; SS.FX.star(ctx, x, y, 9 + Math.sin(t * 20) * 2);
      ctx.fillStyle = '#ffffff'; el(ctx, x, y, 3, 3);
    } else if (kind === 'ice') {
      ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1);
      ctx.fillStyle = 'rgba(155,246,255,0.5)'; ctx.fillRect(-30, -3, 22, 6);
      ctx.fillStyle = '#bde0fe';
      ctx.beginPath(); ctx.moveTo(-10, -8); ctx.lineTo(14, 0); ctx.lineTo(-10, 8); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.fillRect(-6, -2, 10, 2);
      ctx.restore();
    } else if (kind === 'hotdog') {
      ctx.save(); ctx.translate(x, y); ctx.rotate(t * 7);
      ctx.fillStyle = '#f4c27a'; ctx.beginPath(); ctx.roundRect(-14, -5, 28, 10, 5); ctx.fill();
      ctx.fillStyle = '#b5452f'; ctx.beginPath(); ctx.roundRect(-16, -3, 32, 6, 3); ctx.fill();
      ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-10, 0);
      for (let i = -10; i <= 10; i += 5) ctx.lineTo(i, i % 10 ? -2 : 2);
      ctx.stroke();
      ctx.restore();
    } else {
      baseProjectile(ctx, kind, x, y, t, dir);
    }
  };
})();
