// Procedural cartoon sloth. Drawn facing right with feet at (x, y).
// Options:
//  look: { fur, furDark, face, mask, belly, accessory, accent }
//  facing (1|-1), scale, t (time), pose ('idle'|'walk'|'jump'|'hurt'|'ko'|'block'|'sleep'|'win')
//  arm / backArm: shoulder angles in radians (0 = pointing forward, PI/2 = down)
//  walk: walk-cycle phase, mouth: 'smile'|'open'|'ouch'|'grin', flash: true for hit-flash
SS.Art = SS.Art || {};

(function () {
  const REST = Math.PI / 2 - 0.15;

  function ellipse(ctx, x, y, rx, ry, rot = 0) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
    ctx.fill();
  }

  // Cartoon pistol held in the hand at the end of the arm (arm-local coords).
  function drawGun(ctx, len, gun) {
    const C = gun.C;
    const x = len - 4;
    ctx.fillStyle = C('#34343f');
    ctx.beginPath();
    ctx.roundRect(x, -14, 36, 11, 3);
    ctx.fill();
    ctx.fillRect(x + 30, -12, 10, 6);             // barrel
    ctx.fillStyle = C('#55556a');
    ctx.fillRect(x + 2, -14, 30, 3);              // slide highlight
    ctx.fillStyle = C(gun.color);
    ctx.fillRect(x + 4, -8, 20, 3);               // accent stripe in the sloth's color
    ctx.fillStyle = C('#2a2a33');
    ctx.beginPath();
    ctx.roundRect(x + 1, -5, 10, 15, 3);          // grip
    ctx.fill();
    if (gun.flash) {
      ctx.fillStyle = '#ffd23f';
      SS.FX.star(ctx, x + 50, -9, 14);
      ctx.fillStyle = '#fff3b0';
      SS.FX.star(ctx, x + 48, -9, 7);
    }
  }

  function drawArm(ctx, sx, sy, angle, fur, dark, claw, len, slapping, gun) {
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(angle);
    if (slapping) {
      // motion streaks
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(0, 0, len + 6 + i * 6, -1.3, -0.25 - i * 0.1);
        ctx.stroke();
      }
    }
    ctx.fillStyle = fur;
    ctx.beginPath();
    ctx.roundRect(-4, -7, len, 14, 7);
    ctx.fill();
    ctx.fillStyle = dark;
    ellipse(ctx, len - 2, 0, 9, 8);
    // three long goofy claws
    ctx.strokeStyle = claw;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(len + 4, i * 4.5);
      ctx.quadraticCurveTo(len + 14, i * 5 + 2, len + 13, i * 5 + 9);
      ctx.stroke();
    }
    if (gun) drawGun(ctx, len, gun);
    ctx.restore();
  }

  function eyes(ctx, o, C) {
    const L = o.look;
    const t = o.t || 0;
    const blink = (t % 3.7) < 0.12;
    const ex = [5, 21];
    ctx.lineCap = 'round';
    for (let i = 0; i < 2; i++) {
      const x = ex[i], y = -91;
      if (o.pose === 'hurt' || o.pose === 'ko') {
        ctx.strokeStyle = C('#2a1a10');
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x - 3.5, y - 3.5); ctx.lineTo(x + 3.5, y + 3.5);
        ctx.moveTo(x + 3.5, y - 3.5); ctx.lineTo(x - 3.5, y + 3.5);
        ctx.stroke();
      } else if (o.pose === 'sleep' || blink) {
        ctx.strokeStyle = C('#2a1a10');
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(x, y - 1, 4, 0.2, Math.PI - 0.2);
        ctx.stroke();
      } else if (L.accessory !== 'shades') {
        ctx.fillStyle = C('#ffffff');
        ellipse(ctx, x, y, 5, 5.5);
        ctx.fillStyle = C('#1a0f08');
        ellipse(ctx, x + 1.6, y + 0.5, 2.8, 3.2);
        ctx.fillStyle = C('#ffffff');
        ellipse(ctx, x + 2.4, y - 1, 1, 1);
      }
    }
  }

  function mouth(ctx, o, C) {
    const m = o.mouth || (o.pose === 'win' ? 'grin' : 'smile');
    ctx.strokeStyle = C('#3a2015');
    ctx.fillStyle = C('#3a2015');
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    if (m === 'open') {
      ellipse(ctx, 14, -76, 6, 5);
      ctx.fillStyle = C('#ff7a8a');
      ellipse(ctx, 14, -73.5, 3.5, 2);
    } else if (m === 'ouch') {
      ctx.beginPath();
      ctx.moveTo(7, -76);
      for (let i = 1; i <= 4; i++) ctx.lineTo(7 + i * 3.5, -76 + (i % 2 ? -2.5 : 0));
      ctx.stroke();
    } else if (m === 'grin') {
      ctx.beginPath();
      ctx.arc(14, -80, 7.5, 0.1, Math.PI - 0.1);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = C('#ffffff');
      ctx.fillRect(9, -80, 10, 2.5);
    } else {
      ctx.beginPath();
      ctx.arc(14, -81, 6, 0.25, Math.PI - 0.25);
      ctx.stroke();
    }
  }

  function accessory(ctx, o, C) {
    const L = o.look;
    const acc = L.accessory;
    const ac = L.accent || '#e63946';
    if (acc === 'tophat') {
      ctx.fillStyle = C('#1d1d24');
      ctx.fillRect(-14, -118, 42, 6);
      ctx.fillRect(-6, -146, 26, 30);
      ctx.fillStyle = C(ac);
      ctx.fillRect(-6, -124, 26, 6);
    } else if (acc === 'shades') {
      ctx.fillStyle = C('#111');
      ctx.beginPath();
      ctx.roundRect(-3, -97, 14, 10, 4);
      ctx.roundRect(15, -97, 14, 10, 4);
      ctx.fill();
      ctx.fillRect(9, -95, 8, 2.5);
      ctx.fillStyle = C('rgba(120,200,255,0.7)');
      ctx.fillRect(0, -95, 4, 2);
      ctx.fillRect(18, -95, 4, 2);
      // headphones
      ctx.strokeStyle = C(ac);
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(8, -92, 28, Math.PI * 1.05, Math.PI * 1.95);
      ctx.stroke();
      ctx.fillStyle = C(ac);
      ellipse(ctx, -18, -88, 6, 10);
    } else if (acc === 'crown') {
      ctx.fillStyle = C('#ffd23f');
      ctx.beginPath();
      ctx.moveTo(-8, -110); ctx.lineTo(-10, -128); ctx.lineTo(0, -118); ctx.lineTo(8, -132);
      ctx.lineTo(16, -118); ctx.lineTo(26, -128); ctx.lineTo(24, -110);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = C(ac);
      ellipse(ctx, 8, -116, 3, 3);
    } else if (acc === 'headband') {
      ctx.fillStyle = C(ac);
      ctx.beginPath();
      ctx.roundRect(-18, -108, 52, 8, 3);
      ctx.fill();
      const flap = Math.sin((o.t || 0) * 10) * 4;
      ctx.beginPath();
      ctx.moveTo(-16, -106);
      ctx.lineTo(-34, -112 + flap);
      ctx.lineTo(-32, -100 + flap);
      ctx.closePath();
      ctx.fill();
    } else if (acc === 'bow') {
      ctx.fillStyle = C(ac);
      ctx.beginPath();
      ctx.moveTo(14, -114);
      ctx.lineTo(0, -124); ctx.lineTo(2, -106);
      ctx.closePath();
      ctx.moveTo(14, -114);
      ctx.lineTo(28, -124); ctx.lineTo(26, -106);
      ctx.closePath();
      ctx.fill();
      ellipse(ctx, 14, -115, 4, 4);
    } else if (acc === 'helmet') {
      ctx.fillStyle = C(ac);
      ctx.beginPath();
      ctx.arc(8, -96, 30, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = C('#ffffff');
      ctx.fillRect(4, -126, 8, 30);
    }
  }

  SS.Art.sloth = function (ctx, o) {
    const L = o.look;
    const C = (c) => (o.flash ? '#ffffff' : c);
    const t = o.t || 0;
    const s = o.scale || 1;
    const pose = o.pose || 'idle';

    ctx.save();
    ctx.translate(o.x, o.y);
    ctx.scale((o.facing || 1) * s, s);

    if (pose === 'ko') {
      ctx.translate(0, -30);
      ctx.rotate(-Math.PI / 2);
    } else if (pose === 'jump') {
      ctx.scale(0.92, 1.08);
    } else if (pose === 'hurt') {
      ctx.rotate(-0.15);
    } else {
      const breathe = 1 + Math.sin(t * 2.5) * 0.02;
      ctx.scale(1 / breathe, breathe);
    }
    if (o.squash) ctx.scale(1 + o.squash, 1 - o.squash);

    const walk = o.walk || 0;
    const lift1 = pose === 'walk' ? Math.max(0, Math.sin(walk)) * 7 : 0;
    const lift2 = pose === 'walk' ? Math.max(0, -Math.sin(walk)) * 7 : 0;
    const bodyBob = pose === 'walk' ? Math.abs(Math.sin(walk)) * -3 : 0;

    // Back arm
    let back = o.backArm !== undefined ? o.backArm : REST + 0.25 + Math.sin(t * 2) * 0.05;
    if (pose === 'block') back = -0.9;
    if (pose === 'win') back = -2.2 + Math.sin(t * 8) * 0.3;
    drawArm(ctx, -8, -62 + bodyBob, back, C(L.furDark), C(L.furDark), C('#f4e7c5'), 40, false);

    // Legs
    ctx.fillStyle = C(L.furDark);
    ellipse(ctx, -12, -11 - lift1, 11, 13);
    ellipse(ctx, 12, -11 - lift2, 11, 13);
    ctx.strokeStyle = C('#f4e7c5');
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    for (const [lx, ly] of [[-12, -lift1], [12, -lift2]]) {
      ctx.beginPath();
      ctx.moveTo(lx + 2, ly - 2); ctx.lineTo(lx + 9, ly + 1);
      ctx.moveTo(lx - 3, ly - 1); ctx.lineTo(lx + 3, ly + 2);
      ctx.stroke();
    }

    ctx.translate(0, bodyBob);

    // Body
    ctx.fillStyle = C(L.fur);
    ellipse(ctx, 0, -45, 32, 40);
    ctx.fillStyle = C(L.belly);
    ellipse(ctx, 7, -40, 20, 27);
    // shaggy fur strokes
    ctx.strokeStyle = C(L.furDark);
    ctx.lineWidth = 2;
    for (const [fx, fy] of [[-20, -60], [-24, -40], [-18, -22], [-10, -72], [22, -64]]) {
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(fx - 4, fy + 8);
      ctx.stroke();
    }

    // Head
    ctx.fillStyle = C(L.fur);
    ellipse(ctx, 8, -90, 27, 25);
    // messy tuft
    ctx.beginPath();
    ctx.moveTo(-6, -108);
    ctx.lineTo(-2, -122); ctx.lineTo(5, -111); ctx.lineTo(10, -124); ctx.lineTo(15, -111);
    ctx.lineTo(22, -119); ctx.lineTo(22, -106);
    ctx.closePath();
    ctx.fill();

    // Face
    ctx.fillStyle = C(L.face);
    ellipse(ctx, 13, -87, 22, 17);
    ctx.fillStyle = C(L.mask);
    ellipse(ctx, 3, -89, 9, 5.5, 0.55);
    ellipse(ctx, 23, -89, 9, 5.5, -0.55);
    ctx.fillStyle = C('rgba(255,120,140,0.45)');
    ellipse(ctx, 0, -80, 4.5, 3);
    ellipse(ctx, 27, -80, 4.5, 3);

    eyes(ctx, o, C);
    ctx.fillStyle = C('#2a1a10');
    ellipse(ctx, 14, -85, 4.5, 3.2);
    mouth(ctx, o, C);
    accessory(ctx, o, C);

    // Front arm (the slapping one)
    let arm = o.arm !== undefined ? o.arm : REST + Math.sin(t * 2 + 1) * 0.05;
    if (pose === 'block') arm = -1.2;
    if (pose === 'ko') arm = REST + 0.6;
    if (pose === 'win') arm = -2.0 + Math.sin(t * 8 + 1) * 0.3;
    if (pose === 'jump' && o.arm === undefined) arm = -0.6;
    const gun = o.gun ? { color: L.accent || '#e63946', flash: o.muzzle, C } : null;
    if (gun) arm = o.arm !== undefined ? o.arm : -0.05;
    drawArm(ctx, 12, -62, arm, C(L.fur), C(L.furDark), C('#f4e7c5'), 44, o.slapping, gun);

    ctx.restore();
  };

  SS.Art.SLOTH_REST = REST;

  // Soft ground shadow
  SS.Art.shadow = function (ctx, x, y, w) {
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(x, y, w, w * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
  };
})();
