// More cartoon creatures: boxing kangaroo, mountain goat, bat, blob, raptor,
// pterodactyl, T-Rex, UFO, the time machine, and extra thrown things.
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
  const bubbleHelmet = (ctx, C, x, y, r) => {
    ctx.fillStyle = C('rgba(190,230,255,0.25)');
    el(ctx, x, y, r, r);
    ctx.strokeStyle = C('rgba(220,245,255,0.9)');
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = C('rgba(255,255,255,0.7)');
    el(ctx, x - r * 0.4, y - r * 0.45, r * 0.2, r * 0.12, -0.6);
  };

  // ---------------- boxing kangaroo ----------------
  A.kangaroo = function (ctx, x, y, o) {
    const C = begin(ctx, x, y, o);
    const t = o.t || 0;
    const fur = o.color || '#c8874f', belly = o.belly || '#ecc79c';
    const punch = o.punch || 0;
    // tail
    ctx.fillStyle = C(fur);
    el(ctx, -30, -20, 30, 8, 0.45);
    // legs + big feet
    ctx.fillStyle = C(fur);
    el(ctx, -4, -24, 17, 21, -0.3);
    el(ctx, 8, -4, 24, 6, o.air ? 0.4 : 0);
    // body
    el(ctx, 2, -54, 18, 30, 0.15);
    ctx.fillStyle = C(belly);
    el(ctx, 9, -50, 10, 20, 0.15);
    // head, snout, ears
    ctx.fillStyle = C(fur);
    el(ctx, 12, -92, 14, 12);
    el(ctx, 26, -88, 11, 7);
    el(ctx, 2, -112, 5, 14, -0.25);
    el(ctx, 12, -114, 5, 14, 0.1);
    ctx.fillStyle = C('#5a3a20');
    el(ctx, 35, -89, 3, 2.5);
    angryEye(ctx, C, 16, -95, 4);
    // back glove, front glove (punches forward)
    ctx.strokeStyle = C(fur);
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(6, -68); ctx.lineTo(16, -60); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(14, -70); ctx.lineTo(24 + punch * 26, -66 + Math.sin(t * 8) * (punch ? 0 : 2)); ctx.stroke();
    ctx.fillStyle = C('#d62828');
    el(ctx, 18, -58, 9, 8);
    el(ctx, 30 + punch * 26, -66, 11, 10);
    ctx.fillStyle = C('#ffffff');
    ctx.fillRect(22 + punch * 26, -72, 4, 12);
    if (o.crown) crown(ctx, C, 9, -118, 22);
    if (o.helmet) bubbleHelmet(ctx, C, 16, -98, 26);
    ctx.restore();
  };

  // ---------------- mountain goat ----------------
  A.goat = function (ctx, x, y, o) {
    const C = begin(ctx, x, y, o);
    const t = o.t || 0;
    const run = o.charging ? Math.sin(t * 30) * 5 : 0;
    ctx.strokeStyle = C('#4a4a4a');
    ctx.lineWidth = 5;
    for (const [lx, k] of [[-16, 1], [-8, -1], [10, 1], [18, -1]]) {
      ctx.beginPath(); ctx.moveTo(lx, -24); ctx.lineTo(lx + run * k, 0); ctx.stroke();
    }
    ctx.fillStyle = C(o.color || '#f1f1ec');
    el(ctx, 0, -34, 27, 16);
    el(ctx, -26, -42, 6, 4, -0.6);
    const hy = o.charging ? -36 : -48, hx = o.charging ? 32 : 26;
    el(ctx, hx, hy, 11, 9);
    ctx.fillStyle = C('#ddd6c8');
    ctx.beginPath(); ctx.moveTo(hx + 2, hy + 6); ctx.lineTo(hx + 6, hy + 16); ctx.lineTo(hx + 9, hy + 5); ctx.fill();
    ctx.strokeStyle = C('#8a6a43');
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(hx - 6, hy - 6, 8, Math.PI * 1.1, Math.PI * 2.2); ctx.stroke();
    ctx.beginPath(); ctx.arc(hx + 1, hy - 8, 7, Math.PI * 1.1, Math.PI * 2.2); ctx.stroke();
    angryEye(ctx, C, hx + 3, hy - 2, 3.5, '#6b4f12');
    ctx.restore();
  };

  // ---------------- bat ----------------
  A.bat = function (ctx, x, y, o) {
    const C = begin(ctx, x, y, o);
    const t = o.t || 0;
    const flap = Math.sin(t * 22);
    const c = o.color || '#3d2c55';
    ctx.fillStyle = C(c);
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(0, -30);
      ctx.lineTo(side * 30, -38 - flap * 14);
      ctx.lineTo(side * 24, -26 - flap * 6);
      ctx.lineTo(side * 16, -30 - flap * 4);
      ctx.lineTo(side * 8, -22);
      ctx.closePath();
      ctx.fill();
    }
    el(ctx, 0, -28, 10, 11);
    ctx.beginPath(); ctx.moveTo(-6, -36); ctx.lineTo(-8, -46); ctx.lineTo(-2, -38); ctx.fill();
    ctx.beginPath(); ctx.moveTo(6, -36); ctx.lineTo(8, -46); ctx.lineTo(2, -38); ctx.fill();
    ctx.fillStyle = C(o.eyes || '#ff4d6d');
    el(ctx, -3.5, -30, 2.5, 2.5);
    el(ctx, 3.5, -30, 2.5, 2.5);
    ctx.fillStyle = C('#fff');
    ctx.fillRect(-3, -24, 2, 3);
    ctx.fillRect(1, -24, 2, 3);
    ctx.restore();
  };

  // ---------------- blob (lava blob / alien) ----------------
  A.blob = function (ctx, x, y, o) {
    const C = begin(ctx, x, y, o);
    const t = o.t || 0;
    const sq = Math.sin(t * 7) * 0.13;
    const c = o.color || '#ff7b00';
    if (o.alien) {
      ctx.strokeStyle = C(c);
      ctx.lineWidth = 3;
      for (const s of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(s * 8, -30); ctx.lineTo(s * 14, -46 + Math.sin(t * 5 + s) * 3); ctx.stroke();
        ctx.fillStyle = C('#ffd23f');
        el(ctx, s * 14, -47 + Math.sin(t * 5 + s) * 3, 4, 4);
      }
    }
    ctx.fillStyle = C(c);
    ctx.beginPath();
    ctx.ellipse(0, -18 * (1 - sq), 25 * (1 + sq), 18 * (1 - sq), 0, Math.PI, 0);
    ctx.lineTo(25 * (1 + sq), 0);
    ctx.lineTo(-25 * (1 + sq), 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = C('rgba(255,255,255,0.35)');
    el(ctx, -9, -24, 6, 4, -0.5);
    if (o.glow) {
      ctx.fillStyle = C('rgba(255,210,63,0.5)');
      el(ctx, 4, -8, 10, 4);
    }
    angryEye(ctx, C, -6, -20, 4.5);
    angryEye(ctx, C, 8, -20, 4.5);
    ctx.strokeStyle = C('#2b193d');
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(2, -8, 5, 0.2, Math.PI - 0.2); ctx.stroke();
    if (o.crown) crown(ctx, C, 0, -34 * (1 - sq), 18);
    ctx.restore();
  };

  // ---------------- raptor ----------------
  A.raptor = function (ctx, x, y, o) {
    const C = begin(ctx, x, y, o);
    const t = o.t || 0;
    const c = o.color || '#6a994e', dark = '#3f6b2c';
    const run = Math.sin(t * (o.charging ? 28 : 10)) * 6;
    ctx.strokeStyle = C(dark);
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-4, -30); ctx.lineTo(-8 + run, -2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(6, -30); ctx.lineTo(4 - run, -2); ctx.stroke();
    ctx.fillStyle = C(c);
    ctx.beginPath();
    ctx.moveTo(-18, -42); ctx.lineTo(-60, -50 + Math.sin(t * 6) * 4); ctx.lineTo(-18, -30);
    ctx.closePath(); ctx.fill();
    el(ctx, 0, -38, 24, 13, o.charging ? 0.15 : -0.1);
    ctx.fillStyle = C(dark);
    for (let i = -12; i <= 8; i += 10) ctx.fillRect(i, -50, 4, 9);
    ctx.fillStyle = C(c);
    el(ctx, 26, -58, 15, 9, 0.1);
    ctx.fillStyle = C('#ffffff');
    for (let i = 0; i < 4; i++) {
      ctx.beginPath(); ctx.moveTo(24 + i * 5, -52); ctx.lineTo(26 + i * 5, -47); ctx.lineTo(28 + i * 5, -52); ctx.fill();
    }
    ctx.strokeStyle = C(dark);
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(16, -40); ctx.lineTo(22, -34); ctx.stroke();
    angryEye(ctx, C, 28, -61, 3.5, '#b5302a');
    ctx.restore();
  };

  // ---------------- pterodactyl ----------------
  A.ptero = function (ctx, x, y, o) {
    const C = begin(ctx, x, y, o);
    const t = o.t || 0;
    const flap = Math.sin(t * 12);
    const c = o.color || '#c77d5c';
    ctx.fillStyle = C(c);
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(-2, -30);
      ctx.lineTo(side * 40 - 2, -34 - flap * 18);
      ctx.lineTo(side * 10 - 2, -22);
      ctx.closePath();
      ctx.fill();
    }
    el(ctx, 0, -28, 14, 8);
    el(ctx, 16, -36, 9, 7);
    ctx.beginPath(); ctx.moveTo(22, -38); ctx.lineTo(48, -34); ctx.lineTo(22, -32); ctx.fill();
    ctx.beginPath(); ctx.moveTo(10, -40); ctx.lineTo(-6, -50); ctx.lineTo(12, -36); ctx.fill();
    angryEye(ctx, C, 17, -38, 3);
    ctx.restore();
  };

  // ---------------- Tiny-Arms Rex ----------------
  A.trex = function (ctx, x, y, o) {
    const C = begin(ctx, x, y, o);
    const t = o.t || 0;
    const c = o.color || '#4f9d69', dark = '#2d6a4f', belly = '#a7d7a0';
    const step = Math.sin(t * 5) * 6;
    ctx.fillStyle = C(dark);
    el(ctx, -18, -34, 18, 34, 0.15);
    el(ctx, -16 + step, -4, 26, 9);
    ctx.fillStyle = C(c);
    ctx.beginPath();
    ctx.moveTo(-40, -110); ctx.quadraticCurveTo(-120, -80, -150, -40 + Math.sin(t * 3) * 8);
    ctx.quadraticCurveTo(-100, -70, -40, -60);
    ctx.closePath(); ctx.fill();
    el(ctx, 0, -95, 52, 45, -0.2);
    ctx.fillStyle = C(belly);
    el(ctx, 16, -82, 26, 30, -0.2);
    ctx.fillStyle = C(c);
    el(ctx, 14, -34, 18, 34, -0.1);
    el(ctx, 18 - step, -4, 26, 9);
    // big head with chomping jaw
    const jaw = Math.abs(Math.sin(t * 4)) * 14;
    el(ctx, 58, -150, 44, 26, -0.1);
    ctx.fillStyle = C(dark);
    el(ctx, 66, -122 + jaw * 0.5, 38, 10 + jaw * 0.3, 0.05);
    ctx.fillStyle = C('#ffffff');
    for (let i = 0; i < 7; i++) {
      ctx.beginPath(); ctx.moveTo(40 + i * 9, -132); ctx.lineTo(44 + i * 9, -124); ctx.lineTo(48 + i * 9, -132); ctx.fill();
    }
    angryEye(ctx, C, 62, -160, 7, '#b5302a');
    ctx.fillStyle = C(dark);
    el(ctx, 96, -158, 3, 2);
    // the famous tiny arms, flailing
    ctx.strokeStyle = C(c);
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    const wave = Math.sin(t * 14) * 0.6;
    ctx.save(); ctx.translate(40, -98); ctx.rotate(0.6 + wave);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(14, 0); ctx.stroke();
    ctx.restore();
    if (o.crown) crown(ctx, C, 58, -172, 30);
    ctx.restore();
  };

  // ---------------- UFO ----------------
  A.ufo = function (ctx, x, y, o) {
    const C = begin(ctx, x, y, o);
    const t = o.t || 0;
    if (o.beam) {
      ctx.fillStyle = 'rgba(155,246,255,0.18)';
      ctx.beginPath(); ctx.moveTo(-20, -20); ctx.lineTo(20, -20); ctx.lineTo(44, 60); ctx.lineTo(-44, 60); ctx.fill();
    }
    ctx.fillStyle = C('rgba(190,230,255,0.55)');
    ctx.beginPath(); ctx.arc(0, -36, 20, Math.PI, 0); ctx.fill();
    ctx.fillStyle = C('#7cd63b');
    el(ctx, 0, -38, 9, 10);
    angryEye(ctx, C, 3, -40, 3.5);
    ctx.fillStyle = C('#b8c0cc');
    el(ctx, 0, -26, 46, 12);
    ctx.fillStyle = C('#8a93a3');
    el(ctx, 0, -22, 30, 6);
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = C(Math.floor(t * 6 + i) % 2 ? '#ffd23f' : '#ff4d6d');
      el(ctx, -35 + i * 14, -26, 3, 3);
    }
    if (o.crown) crown(ctx, C, 0, -56, 16);
    ctx.restore();
  };

  // ---------------- time machine portal (map 12 decoration) ----------------
  A.timeMachine = function (ctx, x, y, t) {
    ctx.save();
    ctx.translate(x, y - 95);
    for (let i = 5; i > 0; i--) {
      ctx.fillStyle = `hsla(${(t * 80 + i * 40) % 360},80%,${45 + i * 6}%,0.8)`;
      ctx.beginPath(); ctx.arc(0, 0, i * 13, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = '#ffd23f';
    ctx.lineWidth = 8;
    ctx.beginPath(); ctx.arc(0, 0, 72, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#ffd23f';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + t * 0.5;
      ctx.fillRect(Math.cos(a) * 80 - 4, Math.sin(a) * 80 - 4, 8, 8);
    }
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(t * 3) * 40, Math.sin(t * 3) * 40); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#5c3d2e';
    ctx.fillRect(x - 60, y - 10, 120, 10);
    SS.UI.outlineText(ctx, 'TIME MACHINE', x, y - 196, 18, '#ffd23f', 'center');
  };

  // ---------------- more thrown things ----------------
  const baseProjectile = A.projectile;
  A.projectile = function (ctx, kind, x, y, t, dir = 1) {
    if (kind === 'snowball') {
      ctx.fillStyle = '#ffffff'; el(ctx, x, y, 11, 11);
      ctx.fillStyle = '#d6e4f0'; el(ctx, x + 3, y + 3, 6, 5);
    } else if (kind === 'cannonball') {
      ctx.fillStyle = '#222'; el(ctx, x, y, 12, 12);
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; el(ctx, x - 4, y - 4, 3, 3);
    } else if (kind === 'glove') {
      ctx.save(); ctx.translate(x, y); ctx.rotate(t * 9);
      ctx.fillStyle = '#d62828'; el(ctx, 0, 0, 12, 10);
      ctx.fillStyle = '#fff'; ctx.fillRect(-14, -5, 5, 10);
      ctx.restore();
    } else if (kind === 'rock') {
      ctx.save(); ctx.translate(x, y); ctx.rotate(t * 6);
      ctx.fillStyle = '#8d8478';
      ctx.beginPath(); ctx.moveTo(-11, -4); ctx.lineTo(-4, -11); ctx.lineTo(9, -7); ctx.lineTo(11, 5); ctx.lineTo(0, 11); ctx.lineTo(-10, 6); ctx.closePath(); ctx.fill();
      ctx.restore();
    } else if (kind === 'goo') {
      ctx.fillStyle = '#7cd63b'; el(ctx, x, y, 10, 12 + Math.sin(t * 15) * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; el(ctx, x - 3, y - 4, 3, 2);
    } else if (kind === 'fireball') {
      ctx.fillStyle = '#ff7b00'; el(ctx, x, y, 12, 12);
      ctx.fillStyle = '#ffd23f'; el(ctx, x, y, 6, 6);
    } else {
      baseProjectile(ctx, kind, x, y, t, dir);
    }
  };
})();
