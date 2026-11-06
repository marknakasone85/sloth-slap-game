// Cartoon enemies, props and pickups. Creatures are drawn with feet at (x, y).
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
  const angryEye = (ctx, C, x, y, r) => {
    ctx.fillStyle = C('#fff');
    el(ctx, x, y, r, r);
    ctx.fillStyle = C('#111');
    el(ctx, x + r * 0.35, y + r * 0.1, r * 0.5, r * 0.5);
    ctx.strokeStyle = C('#111');
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x - r, y - r - 2);
    ctx.lineTo(x + r, y - r * 0.4);
    ctx.stroke();
  };

  A.beetle = function (ctx, x, y, o) {
    const C = begin(ctx, x, y, o);
    const t = o.t || 0;
    ctx.strokeStyle = C('#222');
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      const k = Math.sin(t * 18 + i * 2) * 4;
      ctx.beginPath();
      ctx.moveTo(-12 + i * 12, -10);
      ctx.lineTo(-16 + i * 12 + k, 0);
      ctx.stroke();
    }
    ctx.fillStyle = C(o.color || '#3a7d44');
    el(ctx, 0, -18, 22, 14);
    ctx.strokeStyle = C('rgba(0,0,0,0.35)');
    ctx.beginPath(); ctx.moveTo(-4, -31); ctx.lineTo(-4, -5); ctx.stroke();
    ctx.fillStyle = C('#222');
    el(ctx, 20, -16, 9, 8);
    ctx.strokeStyle = C('#222');
    ctx.beginPath(); ctx.moveTo(24, -22); ctx.quadraticCurveTo(32, -34, 38, -30); ctx.stroke();
    angryEye(ctx, C, 22, -18, 3.5);
    ctx.restore();
  };

  A.bird = function (ctx, x, y, o) {
    const C = begin(ctx, x, y, o);
    const t = o.t || 0;
    const flap = Math.sin(t * 16) * 0.8;
    ctx.fillStyle = C(o.color || '#222');
    el(ctx, 0, -20, 20, 14);
    // wing
    ctx.save();
    ctx.translate(-4, -26);
    ctx.rotate(-0.4 + flap);
    ctx.fillStyle = C(o.wing || '#111');
    el(ctx, -12, 0, 16, 7);
    ctx.restore();
    // head
    ctx.fillStyle = C(o.color || '#222');
    el(ctx, 16, -32, 11, 11);
    ctx.fillStyle = C(o.belly || '#fff');
    el(ctx, 8, -16, 10, 8);
    // big comical beak
    ctx.fillStyle = C(o.beak || '#ff9f1c');
    ctx.beginPath();
    ctx.moveTo(22, -38);
    ctx.quadraticCurveTo(50, -36, 48, -26);
    ctx.quadraticCurveTo(36, -26, 22, -28);
    ctx.closePath();
    ctx.fill();
    angryEye(ctx, C, 18, -35, 3.5);
    ctx.restore();
  };

  A.crab = function (ctx, x, y, o) {
    const C = begin(ctx, x, y, o);
    const t = o.t || 0;
    const snap = Math.abs(Math.sin(t * 6)) * 0.5;
    ctx.strokeStyle = C('#b5302a');
    ctx.lineWidth = 4;
    for (let i = -1; i <= 1; i += 2) {
      for (let j = 0; j < 3; j++) {
        ctx.beginPath();
        ctx.moveTo(i * 10, -12);
        ctx.lineTo(i * (22 + j * 4), -2 + Math.sin(t * 20 + j) * 2);
        ctx.stroke();
      }
    }
    ctx.fillStyle = C(o.color || '#e63946');
    el(ctx, 0, -20, 26, 16);
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(side * 26, -30);
      ctx.fillStyle = C(o.color || '#e63946');
      el(ctx, side * 6, -6, 10, 8);
      ctx.fillStyle = C('#ffd6a5');
      ctx.beginPath();
      ctx.moveTo(side * 6, -6);
      ctx.lineTo(side * 18, -14 - snap * 10);
      ctx.lineTo(side * 18, -6 + snap * 6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.strokeStyle = C('#b5302a');
    ctx.beginPath(); ctx.moveTo(-6, -34); ctx.lineTo(-8, -44); ctx.moveTo(6, -34); ctx.lineTo(8, -44); ctx.stroke();
    angryEye(ctx, C, -8, -47, 4.5);
    angryEye(ctx, C, 8, -47, 4.5);
    if (o.hat === 'pirate') {
      ctx.fillStyle = C('#1d1d24');
      ctx.beginPath();
      ctx.moveTo(-26, -54);
      ctx.quadraticCurveTo(0, -84, 26, -54);
      ctx.quadraticCurveTo(0, -62, -26, -54);
      ctx.fill();
      ctx.fillStyle = C('#ffd23f');
      ctx.fillRect(-14, -62, 28, 3);
    }
    ctx.restore();
  };

  A.monkey = function (ctx, x, y, o) {
    const C = begin(ctx, x, y, o);
    const t = o.t || 0;
    const throwing = o.throwing || 0;
    const FUR = o.fur || '#6b3e1f', SKIN = o.face || '#e2b07a';
    ctx.strokeStyle = C(FUR);
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-18, -24);
    ctx.bezierCurveTo(-48, -20, -40, -70 + Math.sin(t * 4) * 6, -24, -66);
    ctx.stroke();
    ctx.fillStyle = C(FUR);
    el(ctx, -9, -8, 8, 10);
    el(ctx, 9, -8, 8, 10);
    el(ctx, 0, -34, 22, 26);
    ctx.fillStyle = C(SKIN);
    el(ctx, 4, -32, 13, 17);
    // arm
    ctx.save();
    ctx.translate(14, -46);
    ctx.rotate(throwing > 0 ? -2.2 + throwing * 2.5 : 0.9 + Math.sin(t * 5) * 0.2);
    ctx.fillStyle = C(FUR);
    ctx.beginPath(); ctx.roundRect(-4, -5, 30, 10, 5); ctx.fill();
    ctx.restore();
    // head
    ctx.fillStyle = C(FUR);
    el(ctx, 4, -72, 20, 19);
    el(ctx, -14, -74, 7, 8);
    ctx.fillStyle = C(SKIN);
    el(ctx, 9, -68, 14, 13);
    angryEye(ctx, C, 4, -74, 4);
    angryEye(ctx, C, 15, -74, 4);
    ctx.fillStyle = C('#3a2015');
    ctx.beginPath();
    ctx.arc(11, -62, 5, 0, Math.PI);
    ctx.fill();
    const hat = o.hat || (o.crown ? 'crown' : null);
    if (hat === 'chef') {
      ctx.fillStyle = C('#ffffff');
      ctx.fillRect(-10, -96, 28, 10);
      ctx.beginPath();
      ctx.ellipse(-4, -104, 10, 10, 0, 0, Math.PI * 2);
      ctx.ellipse(6, -108, 11, 11, 0, 0, Math.PI * 2);
      ctx.ellipse(15, -102, 9, 9, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (hat === 'helmet' || hat === 'general') {
      ctx.fillStyle = C(hat === 'general' ? '#3c4a22' : '#556b2f');
      ctx.beginPath();
      ctx.arc(4, -84, 22, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-20, -86, 48, 6);
      if (hat === 'general') {
        ctx.fillStyle = C('#ffd23f');
        SS.FX.star(ctx, 4, -96, 6);
        // medals
        ctx.fillStyle = C('#ffd23f');
        ctx.beginPath(); ctx.arc(-4, -44, 4, 0, Math.PI * 2); ctx.arc(6, -44, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = C('#e63946');
        ctx.fillRect(-7, -54, 6, 7); ctx.fillRect(3, -54, 6, 7);
      }
    }
    if (hat === 'crown') {
      ctx.fillStyle = C('#ffd23f');
      ctx.beginPath();
      ctx.moveTo(-10, -88); ctx.lineTo(-12, -104); ctx.lineTo(-2, -96); ctx.lineTo(5, -108);
      ctx.lineTo(12, -96); ctx.lineTo(22, -104); ctx.lineTo(18, -88);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  };

  A.coconut = function (ctx, x, y, o = {}) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((o.t || 0) * 10);
    ctx.fillStyle = '#5a3a1e';
    el(ctx, 0, 0, 11, 10);
    ctx.fillStyle = '#2d1b0e';
    el(ctx, -3, -3, 2, 2);
    el(ctx, 3, -3, 2, 2);
    el(ctx, 0, 2, 2, 2);
    ctx.restore();
  };

  A.note = function (ctx, x, y, o = {}) {
    ctx.save();
    ctx.translate(x, y + Math.sin((o.t || 0) * 12) * 4);
    ctx.fillStyle = o.color || '#c77dff';
    el(ctx, -6, 6, 8, 6, -0.4);
    el(ctx, 12, 2, 8, 6, -0.4);
    ctx.fillRect(0, -18, 3.5, 24);
    ctx.fillRect(18, -22, 3.5, 24);
    ctx.fillRect(0, -22, 21.5, 6);
    ctx.restore();
  };

  A.crate = function (ctx, x, y, o = {}) {
    ctx.save();
    ctx.translate(x, y);
    if (o.wobble) ctx.rotate(Math.sin(o.wobble * 40) * 0.08);
    const s = 44;
    ctx.fillStyle = o.flash ? '#fff' : '#c68642';
    ctx.fillRect(-s / 2, -s, s, s);
    ctx.strokeStyle = '#7a4a1e';
    ctx.lineWidth = 4;
    ctx.strokeRect(-s / 2 + 2, -s + 2, s - 4, s - 4);
    ctx.beginPath();
    ctx.moveTo(-s / 2 + 2, -s + 2); ctx.lineTo(s / 2 - 2, -2);
    ctx.moveTo(s / 2 - 2, -s + 2); ctx.lineTo(-s / 2 + 2, -2);
    ctx.stroke();
    ctx.restore();
  };

  A.gong = function (ctx, x, y, o = {}) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#5c3d2e';
    ctx.fillRect(-36, -120, 8, 120);
    ctx.fillRect(28, -120, 8, 120);
    ctx.fillRect(-40, -126, 80, 10);
    const swing = o.ring ? Math.sin(o.ring * 30) * 0.15 * o.ring : 0;
    ctx.translate(0, -112);
    ctx.rotate(swing);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-10, 18); ctx.moveTo(10, 0); ctx.lineTo(10, 18); ctx.stroke();
    ctx.fillStyle = o.done ? '#9a8a5a' : '#f2c14e';
    el(ctx, 0, 50, 30, 30);
    ctx.fillStyle = o.done ? '#7d6f48' : '#d4a017';
    el(ctx, 0, 50, 18, 18);
    if (!o.done) {
      ctx.fillStyle = '#fff';
      ctx.globalAlpha = 0.5 + Math.sin((o.t || 0) * 5) * 0.3;
      SS.UI.outlineText(ctx, 'SLAP ME', 0, 100, 16, '#fff', 'center');
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  };

  A.gate = function (ctx, x, y, h, o = {}) {
    ctx.save();
    ctx.translate(x, y);
    const lift = o.open || 0;
    ctx.fillStyle = '#4a3020';
    ctx.fillRect(-26, -h - 10, 52, 12);
    ctx.beginPath();
    ctx.rect(-26, -h, 52, h);
    ctx.clip();
    ctx.translate(0, -lift * h);
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = i % 2 ? '#8b5a2b' : '#7a4a22';
      ctx.fillRect(-24 + i * 12, -h, 11, h);
    }
    ctx.fillStyle = '#3b3b3b';
    ctx.fillRect(-26, -h * 0.75, 52, 6);
    ctx.fillRect(-26, -h * 0.3, 52, 6);
    ctx.restore();
  };

  A.banana = function (ctx, x, y, t = 0) {
    ctx.save();
    ctx.translate(x, y + Math.sin(t * 4) * 4);
    ctx.rotate(-0.4);
    ctx.fillStyle = '#ffe14d';
    ctx.strokeStyle = '#b8920f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -14, 14, 0.3, Math.PI - 0.3);
    ctx.arc(0, -22, 16, Math.PI - 0.5, 0.5, true);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  };

  A.hibiscus = function (ctx, x, y, t = 0) {
    ctx.save();
    ctx.translate(x, y + Math.sin(t * 4 + 1) * 4);
    ctx.rotate(t);
    ctx.fillStyle = '#ff4d8d';
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      el(ctx, Math.cos(a) * 8, Math.sin(a) * 8, 8, 6, a);
    }
    ctx.fillStyle = '#ffd23f';
    el(ctx, 0, 0, 4, 4);
    ctx.restore();
  };

  A.hammock = function (ctx, x, y, t = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#6b4226';
    ctx.fillRect(-90, -150, 12, 150);
    ctx.fillRect(78, -150, 12, 150);
    ctx.fillStyle = '#2d6a4f';
    el(ctx, -84, -160, 30, 18);
    el(ctx, 84, -160, 30, 18);
    const sway = Math.sin(t * 1.5) * 6;
    ctx.strokeStyle = '#e9c46a';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-78, -120);
    ctx.quadraticCurveTo(sway, -40, 78, -120);
    ctx.stroke();
    ctx.fillStyle = '#e76f51';
    ctx.beginPath();
    ctx.moveTo(-70, -116);
    ctx.quadraticCurveTo(sway, -30, 70, -116);
    ctx.quadraticCurveTo(sway, -60, -70, -116);
    ctx.fill();
    SS.UI.outlineText(ctx, 'NAP ZONE', 0, -180, 20, '#ffd23f', 'center');
    ctx.restore();
  };

  A.ammoBox = function (ctx, x, y, t = 0) {
    ctx.save();
    ctx.translate(x, y + Math.sin(t * 4 + 2) * 3);
    ctx.fillStyle = '#ffb703';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.roundRect(i * 7 - 2.5, -30, 5, 12, 2.5);
      ctx.fill();
    }
    ctx.fillStyle = '#556b2f';
    ctx.beginPath();
    ctx.roundRect(-15, -20, 30, 20, 3);
    ctx.fill();
    ctx.fillStyle = '#3c4a22';
    ctx.fillRect(-15, -20, 30, 4);
    SS.UI.text(ctx, 'AMMO', 0, -8, 9, '#ffd23f', 'center');
    ctx.restore();
  };

  // Grumpy surveillance drone (military base flyer)
  A.drone = function (ctx, x, y, o) {
    const C = begin(ctx, x, y, o);
    const t = o.t || 0;
    ctx.strokeStyle = C('#333');
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-26, -34); ctx.lineTo(26, -34);
    ctx.stroke();
    ctx.fillStyle = C('rgba(200,200,200,0.6)');
    for (const rx of [-26, 26]) {
      ctx.beginPath();
      ctx.ellipse(rx, -38, 18 * Math.abs(Math.cos(t * 40)) + 4, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = C('#5f6b6d');
    ctx.beginPath();
    ctx.roundRect(-18, -34, 36, 20, 6);
    ctx.fill();
    ctx.fillStyle = C(Math.floor(t * 4) % 2 ? '#ff4d6d' : '#7a1f2b');
    ctx.beginPath(); ctx.arc(-10, -28, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C('#222');
    ctx.beginPath(); ctx.arc(6, -12, 8, 0, Math.PI * 2); ctx.fill();
    angryEye(ctx, C, 7, -12, 4.5);
    ctx.restore();
  };

  // Dragon-dance costume dragon. o.trail = recent head positions (world coords).
  A.dragon = function (ctx, x, y, o) {
    const C = (c) => (o.flash ? '#ffffff' : c);
    const t = o.t || 0;
    const trail = o.trail || [];
    for (let i = trail.length - 1; i >= 1; i--) {
      if (i % 3 !== 0) continue;
      const p = trail[i];
      const r = 22 * (1 - i / (trail.length + 10));
      if ((i / 3) % 2 === 0) {
        // little dancer legs under the costume
        ctx.strokeStyle = C('#2b2b2b');
        ctx.lineWidth = 4;
        const k = Math.sin(t * 12 + i) * 6;
        ctx.beginPath();
        ctx.moveTo(p.x - 5, p.y + r * 0.6); ctx.lineTo(p.x - 7 + k, p.y + r + 18);
        ctx.moveTo(p.x + 5, p.y + r * 0.6); ctx.lineTo(p.x + 7 - k, p.y + r + 18);
        ctx.stroke();
      }
      ctx.fillStyle = C(i % 6 === 0 ? '#e63946' : '#ffb703');
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = C('#ffd23f');
      ctx.beginPath();
      ctx.moveTo(p.x - r * 0.5, p.y - r * 0.8);
      ctx.lineTo(p.x, p.y - r * 1.5);
      ctx.lineTo(p.x + r * 0.5, p.y - r * 0.8);
      ctx.fill();
    }
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(o.facing || 1, 1);
    ctx.fillStyle = C('#e63946');
    ctx.beginPath(); ctx.ellipse(0, 0, 40, 30, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(32, 6, 26, 18, 0, 0, Math.PI * 2); ctx.fill();
    // horns
    ctx.fillStyle = C('#ffd23f');
    ctx.beginPath(); ctx.moveTo(-14, -24); ctx.lineTo(-30, -56); ctx.lineTo(-2, -28); ctx.fill();
    ctx.beginPath(); ctx.moveTo(4, -28); ctx.lineTo(0, -60); ctx.lineTo(18, -26); ctx.fill();
    // jaw (flaps open and shut)
    const jaw = Math.abs(Math.sin(t * 6)) * 10;
    ctx.fillStyle = C('#b5302a');
    ctx.beginPath(); ctx.ellipse(34, 20 + jaw, 22, 8, 0.1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C('#ffffff');
    for (let k = 0; k < 4; k++) ctx.fillRect(18 + k * 9, 16, 5, 6);
    // eyes + whiskers
    ctx.fillStyle = C('#ffffff');
    ctx.beginPath(); ctx.ellipse(8, -6, 11, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C('#111');
    ctx.beginPath(); ctx.arc(12, -4, 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = C('#ffd23f');
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(52, 2); ctx.quadraticCurveTo(76, -6 + Math.sin(t * 5) * 8, 88, 10);
    ctx.moveTo(50, 12); ctx.quadraticCurveTo(70, 24 + Math.sin(t * 5 + 1) * 8, 84, 30);
    ctx.stroke();
    ctx.restore();
  };

  // Thrown things: pizza, peach, bubble, water balloon, cream pie, paper lantern.
  A.projectile = function (ctx, kind, x, y, t, dir = 1) {
    ctx.save();
    ctx.translate(x, y);
    if (kind === 'bullet') {
      ctx.scale(dir, 1);
      const g = ctx.createLinearGradient(-46, 0, 0, 0);
      g.addColorStop(0, 'rgba(255,210,63,0)');
      g.addColorStop(1, 'rgba(255,210,63,0.8)');
      ctx.fillStyle = g;
      ctx.fillRect(-46, -2, 46, 4);
      ctx.fillStyle = '#ffb703';
      ctx.beginPath();
      ctx.roundRect(-8, -4, 14, 8, 4);
      ctx.fill();
      ctx.fillStyle = '#fff3b0';
      ctx.fillRect(-4, -2, 8, 2);
    } else if (kind === 'pizza') {
      ctx.rotate(t * 8);
      ctx.fillStyle = '#f4c542';
      ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(12, 10); ctx.lineTo(-12, 10); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#c68642';
      ctx.fillRect(-13, 8, 26, 5);
      ctx.fillStyle = '#c0392b';
      el(ctx, -3, 2, 3, 3); el(ctx, 4, 5, 3, 3); el(ctx, 0, -5, 2.5, 2.5);
    } else if (kind === 'peach') {
      ctx.fillStyle = '#ffab91';
      el(ctx, 0, 0, 11, 10);
      ctx.fillStyle = '#ff7f6e';
      el(ctx, 3, 2, 6, 6);
      ctx.fillStyle = '#4caf50';
      el(ctx, 4, -11, 6, 3, -0.5);
    } else if (kind === 'bubble') {
      ctx.fillStyle = 'rgba(150,220,255,0.45)';
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, 13 + Math.sin(t * 10), 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff';
      el(ctx, -4, -5, 3, 2);
    } else if (kind === 'balloon') {
      ctx.rotate(Math.sin(t * 6) * 0.4);
      ctx.fillStyle = '#4cc9f0';
      ctx.beginPath(); ctx.ellipse(0, 0, 11, 13, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3a9fc2';
      ctx.fillRect(-2, 12, 4, 4);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      el(ctx, -4, -5, 3, 4);
    } else if (kind === 'pie') {
      ctx.rotate(t * 6);
      ctx.fillStyle = '#b0b0b0';
      ctx.beginPath(); ctx.ellipse(0, 3, 16, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff8e7';
      ctx.beginPath(); ctx.ellipse(0, -1, 14, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e63946';
      el(ctx, 0, -6, 3, 3);
    } else if (kind === 'lantern') {
      ctx.rotate(Math.sin(t * 5) * 0.3);
      ctx.fillStyle = '#e63946';
      el(ctx, 0, 0, 11, 14);
      ctx.fillStyle = '#ffd23f';
      ctx.fillRect(-6, -16, 12, 4);
      ctx.fillRect(-6, 12, 12, 4);
      ctx.globalAlpha = 0.5 + Math.sin(t * 12) * 0.3;
      ctx.fillStyle = '#fff3b0';
      el(ctx, 0, 0, 5, 8);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  };
})();
