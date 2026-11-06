// Procedural parallax backgrounds for each map theme.
(function () {
  const W = SS.W, H = SS.H;
  const hash = (i) => {
    const v = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
    return v - Math.floor(v);
  };

  const THEMES = {
    jungle: {
      sky: ['#79d0f2', '#d4f5c9'], far: '#5aa874', mid: '#2d6a4f',
      ground: '#7a4b2a', top: '#52b788', deco: 'tree', orb: '#fff6b0',
    },
    beach: {
      sky: ['#ff9f80', '#ffe7b8'], far: '#3d8fc4', mid: '#2a9d8f',
      ground: '#f2d18b', top: '#e9c46a', deco: 'palm', orb: '#fff1a8', sea: true,
    },
    temple: {
      sky: ['#2e2352', '#b0558f'], far: '#4b3b6e', mid: '#33264d',
      ground: '#5e503f', top: '#6a994e', deco: 'ruin', orb: '#f4f1de',
    },
    volcano: {
      sky: ['#3b1d1d', '#e76f51'], far: '#5a2a27', mid: '#3a1c1a',
      ground: '#3d2b2b', top: '#9c4a2f', deco: 'rock', orb: '#ffb703', lava: true,
    },
    cove: {
      sky: ['#5b3f8c', '#ff9a8b'], far: '#2b6cb0', mid: '#1f7a6d',
      ground: '#e9c88a', top: '#d9b26a', deco: 'palm', orb: '#ffd6a5', sea: true,
    },
    italy: {
      sky: ['#6ec6ff', '#fff1d6'], far: '#8fb573', mid: '#e8b07a',
      ground: '#a89f91', top: '#c9bfae', deco: 'italy', orb: '#fff6b0', farStyle: 'cypress', cobble: true,
    },
    china: {
      sky: ['#9fd8c4', '#ffd3e0'], far: '#6b8f71', mid: '#b23a48',
      ground: '#6d4c41', top: '#7cb342', deco: 'pagoda', orb: '#ffffff', farStyle: 'peaks',
    },
    military: {
      sky: ['#8fa3b8', '#e3e8ea'], far: '#7a8c62', mid: '#556b2f',
      ground: '#8a7f5a', top: '#6b6b3a', deco: 'base', orb: '#fffbe6', farStyle: 'fence',
    },
  };

  // ---------- Italy ----------
  function italy(ctx, x, base, h, i) {
    if (i % 5 === 0) {
      // a famous-looking leaning tower
      ctx.save();
      ctx.translate(x, base);
      ctx.rotate(0.09);
      ctx.fillStyle = '#f3efe6';
      ctx.fillRect(-26, -h - 40, 52, h + 40);
      ctx.fillStyle = '#d8d0c0';
      for (let k = 0; k < 7; k++) {
        const y = -h - 40 + k * ((h + 40) / 7);
        ctx.fillRect(-28, y, 56, 4);
        for (let a = -18; a <= 18; a += 12) {
          ctx.beginPath();
          ctx.arc(a, y + 14, 4, Math.PI, 0);
          ctx.rect(a - 4, y + 14, 8, 8);
          ctx.fill();
        }
      }
      ctx.restore();
      return;
    }
    const walls = ['#f4c27a', '#e8a87c', '#f6d6a8', '#d98e73', '#f2b5a0'];
    const w = 80 + hash(i + 3) * 50;
    const bh = h * 0.75;
    ctx.fillStyle = walls[Math.floor(hash(i + 11) * walls.length)];
    ctx.fillRect(x - w / 2, base - bh, w, bh);
    ctx.fillStyle = '#c0563b';
    ctx.beginPath();
    ctx.moveTo(x - w / 2 - 8, base - bh);
    ctx.lineTo(x, base - bh - 26);
    ctx.lineTo(x + w / 2 + 8, base - bh);
    ctx.closePath();
    ctx.fill();
    for (let wy = base - bh + 18; wy < base - 40; wy += 40) {
      for (let wx = x - w / 2 + 14; wx < x + w / 2 - 20; wx += 30) {
        ctx.fillStyle = '#3d3d55';
        ctx.fillRect(wx + 4, wy, 12, 20);
        ctx.fillStyle = '#2e7d4f';
        ctx.fillRect(wx - 2, wy, 6, 20);
        ctx.fillRect(wx + 16, wy, 6, 20);
      }
    }
  }

  // ---------- China ----------
  function pagoda(ctx, x, base, h, i, t) {
    if (i % 3 === 1) {
      // bamboo clump
      for (let k = 0; k < 4; k++) {
        const bx = x - 24 + k * 16;
        const bh = h * (0.8 + hash(i * 7 + k) * 0.5);
        ctx.fillStyle = k % 2 ? '#5c9e45' : '#4a8a3a';
        ctx.fillRect(bx, base - bh, 7, bh);
        ctx.fillStyle = '#3b6e2e';
        for (let j = base - 30; j > base - bh; j -= 34) ctx.fillRect(bx - 1, j, 9, 3);
        ctx.fillStyle = '#6fbf4f';
        ctx.beginPath();
        ctx.ellipse(bx + 14, base - bh + 20, 14, 4, -0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }
    const tiers = 3 + (i % 2);
    let y = base;
    let w = 90;
    for (let k = 0; k < tiers; k++) {
      const th = 34;
      ctx.fillStyle = '#b23a48';
      ctx.fillRect(x - w / 2 + 10, y - th, w - 20, th);
      ctx.fillStyle = '#ffd23f';
      ctx.fillRect(x - 6, y - th + 8, 12, th - 8);
      y -= th;
      // curved roof with upturned corners
      ctx.fillStyle = '#2d4a3e';
      ctx.beginPath();
      ctx.moveTo(x - w / 2 - 14, y - 6);
      ctx.quadraticCurveTo(x - w / 2, y + 2, x - w / 2 + 8, y);
      ctx.lineTo(x + w / 2 - 8, y);
      ctx.quadraticCurveTo(x + w / 2, y + 2, x + w / 2 + 14, y - 6);
      ctx.lineTo(x + w / 2 - 12, y - 16);
      ctx.lineTo(x - w / 2 + 12, y - 16);
      ctx.closePath();
      ctx.fill();
      y -= 16;
      w *= 0.8;
    }
    ctx.fillStyle = '#ffd23f';
    ctx.fillRect(x - 2, y - 24, 4, 24);
    // hanging lantern
    const sway = Math.sin(t * 2 + i) * 4;
    ctx.strokeStyle = '#3d2b1f';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + 50, base - 100);
    ctx.lineTo(x + 50 + sway, base - 80);
    ctx.stroke();
    ctx.fillStyle = '#e63946';
    ctx.beginPath();
    ctx.ellipse(x + 50 + sway, base - 68, 10, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd23f';
    ctx.fillRect(x + 46 + sway, base - 56, 8, 4);
  }

  // ---------- Military base ----------
  function base(ctx, x, gy, h, i) {
    const kind = i % 4;
    if (kind === 0) {
      // watchtower
      ctx.fillStyle = '#5b4a32';
      ctx.fillRect(x - 30, gy - h, 6, h);
      ctx.fillRect(x + 24, gy - h, 6, h);
      ctx.fillRect(x - 30, gy - h * 0.5, 60, 5);
      ctx.fillStyle = '#556b2f';
      ctx.fillRect(x - 36, gy - h - 40, 72, 40);
      ctx.fillStyle = '#3c4a22';
      ctx.fillRect(x - 42, gy - h - 50, 84, 12);
      ctx.fillStyle = '#2b2b2b';
      ctx.fillRect(x - 24, gy - h - 32, 48, 14);
    } else if (kind === 1) {
      // camo tent
      ctx.fillStyle = '#6b7b3a';
      ctx.beginPath();
      ctx.moveTo(x - 70, gy);
      ctx.lineTo(x, gy - 90);
      ctx.lineTo(x + 70, gy);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#4a5629';
      for (const [cx, cy] of [[-30, -20], [10, -45], [30, -15], [-5, -15]]) {
        ctx.beginPath();
        ctx.ellipse(x + cx, gy + cy, 12, 7, 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#2b2b2b';
      ctx.beginPath();
      ctx.moveTo(x - 14, gy);
      ctx.lineTo(x, gy - 40);
      ctx.lineTo(x + 14, gy);
      ctx.fill();
    } else if (kind === 2) {
      // hangar
      ctx.fillStyle = '#7d8a8c';
      ctx.beginPath();
      ctx.arc(x, gy, 90, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#5f6b6d';
      ctx.fillRect(x - 40, gy - 60, 80, 60);
      ctx.strokeStyle = '#4a5557';
      ctx.lineWidth = 2;
      for (let k = -30; k <= 30; k += 15) {
        ctx.beginPath(); ctx.moveTo(x + k, gy - 60); ctx.lineTo(x + k, gy); ctx.stroke();
      }
    } else {
      // flag with a sleepy "Zzz" emblem + sandbags
      ctx.fillStyle = '#444';
      ctx.fillRect(x, gy - h - 20, 4, h + 20);
      ctx.fillStyle = '#ffd23f';
      ctx.fillRect(x + 4, gy - h - 20, 54, 34);
      SS.UI.text(ctx, 'Zzz', x + 31, gy - h - 3, 16, '#2b193d', 'center');
      ctx.fillStyle = '#b8a77a';
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 4 - r; c++) {
          ctx.beginPath();
          ctx.ellipse(x - 50 + c * 26 + r * 13, gy - 8 - r * 14, 14, 8, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  function farLayer(ctx, th, camX, t, groundY) {
    const style = th.farStyle || 'hills';
    ctx.fillStyle = th.far;
    if (style === 'peaks') {
      // misty karst mountains
      for (let layer = 0; layer < 2; layer++) {
        const par = 0.1 + layer * 0.12;
        ctx.fillStyle = layer ? th.far : '#9cb8a4';
        const sp = 150;
        const off = camX * par;
        const first = Math.floor(off / sp) - 1;
        for (let i = first; i < first + W / sp + 3; i++) {
          const x = i * sp - off + hash(i + layer * 50) * 60;
          const ph = 180 + hash(i * 3 + layer) * 140 - layer * 40;
          ctx.beginPath();
          ctx.moveTo(x - 70, groundY);
          ctx.bezierCurveTo(x - 70, groundY - ph, x - 30, groundY - ph - 30, x, groundY - ph);
          ctx.bezierCurveTo(x + 30, groundY - ph - 30, x + 70, groundY - ph, x + 70, groundY);
          ctx.fill();
        }
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fillRect(0, groundY - 90 + layer * 30, W, 40);
      }
      return;
    }
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    for (let x = 0; x <= W; x += 20) {
      const wx = x + camX * 0.2;
      ctx.lineTo(x, groundY - 140 - Math.sin(wx * 0.006) * 50 - Math.sin(wx * 0.017) * 20);
    }
    ctx.lineTo(W, groundY);
    ctx.fill();
    if (style === 'cypress') {
      ctx.fillStyle = '#3d5a3a';
      const sp = 70, off = camX * 0.2, first = Math.floor(off / sp) - 1;
      for (let i = first; i < first + W / sp + 3; i++) {
        if (hash(i) < 0.45) continue;
        const x = i * sp - off;
        const wx = x + camX * 0.2;
        const y = groundY - 140 - Math.sin(wx * 0.006) * 50 - Math.sin(wx * 0.017) * 20;
        ctx.beginPath();
        ctx.ellipse(x, y - 26, 8, 30, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (style === 'fence') {
      const off = camX * 0.35;
      ctx.strokeStyle = 'rgba(70,70,70,0.7)';
      ctx.lineWidth = 2;
      const fy = groundY - 60;
      ctx.beginPath();
      ctx.moveTo(0, fy); ctx.lineTo(W, fy);
      ctx.moveTo(0, fy + 20); ctx.lineTo(W, fy + 20);
      ctx.moveTo(0, fy + 40); ctx.lineTo(W, fy + 40);
      for (let x = -(off % 80); x < W; x += 80) { ctx.moveTo(x, fy - 10); ctx.lineTo(x, groundY); }
      ctx.stroke();
      // barbed wire loops
      ctx.strokeStyle = 'rgba(70,70,70,0.6)';
      for (let x = -(off % 24); x < W; x += 24) {
        ctx.beginPath();
        ctx.arc(x, fy - 12, 6, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }
  SS.THEMES = THEMES;

  function tree(ctx, x, base, h, c) {
    ctx.fillStyle = '#4a2c17';
    ctx.fillRect(x - 8, base - h, 16, h);
    ctx.fillStyle = c;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(x + (i - 1) * 26, base - h - 10 + (i === 1 ? -18 : 0), 42, 30, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // hanging vine
    ctx.strokeStyle = '#40916c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 30, base - h);
    ctx.quadraticCurveTo(x + 40, base - h * 0.6, x + 32, base - h * 0.35);
    ctx.stroke();
  }

  function palm(ctx, x, base, h, c, t) {
    ctx.strokeStyle = '#8d6e4a';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(x, base);
    ctx.quadraticCurveTo(x + 30, base - h * 0.5, x + 20, base - h);
    ctx.stroke();
    ctx.fillStyle = c;
    const sway = Math.sin(t * 1.2 + x) * 0.08;
    for (let i = 0; i < 6; i++) {
      ctx.save();
      ctx.translate(x + 20, base - h);
      ctx.rotate((i / 6) * Math.PI * 2 + sway);
      ctx.beginPath();
      ctx.ellipse(36, 0, 40, 9, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function ruin(ctx, x, base, h, c) {
    ctx.fillStyle = c;
    ctx.fillRect(x - 22, base - h, 44, h);
    ctx.fillRect(x - 30, base - h - 14, 60, 14);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    for (let i = 0; i < 4; i++) ctx.fillRect(x - 22, base - h + i * (h / 4), 44, 3);
    ctx.fillStyle = '#40916c';
    ctx.beginPath();
    ctx.ellipse(x - 20, base - h - 10, 18, 9, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function rock(ctx, x, base, h, c) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(x - 40, base);
    ctx.lineTo(x - 20, base - h);
    ctx.lineTo(x + 8, base - h * 0.8);
    ctx.lineTo(x + 40, base);
    ctx.closePath();
    ctx.fill();
  }

  SS.Art.background = function (ctx, themeName, camX, t, groundY) {
    const th = THEMES[themeName] || THEMES.jungle;

    const g = ctx.createLinearGradient(0, 0, 0, groundY);
    g.addColorStop(0, th.sky[0]);
    g.addColorStop(1, th.sky[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = th.orb;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(780, 90, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // drifting clouds
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    for (let i = 0; i < 5; i++) {
      const cx = ((i * 260 - camX * 0.08 + t * 8) % (W + 300) + W + 300) % (W + 300) - 150;
      const cy = 60 + hash(i) * 90;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 60, 18, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 30, cy - 12, 36, 18, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // far hills / sea
    if (th.sea) {
      ctx.fillStyle = th.far;
      ctx.fillRect(0, groundY - 120, W, 120);
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 8; i++) {
        const wx = ((i * 140 - camX * 0.2 + t * 20) % (W + 140) + W + 140) % (W + 140) - 70;
        ctx.beginPath();
        ctx.arc(wx, groundY - 80 + (i % 3) * 25, 14, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();
      }
    } else {
      farLayer(ctx, th, camX, t, groundY);
    }

    // mid-ground decorations
    const spacing = 230;
    const off = camX * 0.5;
    const first = Math.floor(off / spacing) - 1;
    for (let i = first; i < first + W / spacing + 3; i++) {
      const x = i * spacing - off + hash(i) * 80;
      const h = 150 + hash(i + 99) * 110;
      if (th.deco === 'tree') tree(ctx, x, groundY, h, th.mid);
      else if (th.deco === 'palm') palm(ctx, x, groundY, h, th.mid, t);
      else if (th.deco === 'ruin') ruin(ctx, x, groundY, h * 0.8, th.mid);
      else if (th.deco === 'italy') italy(ctx, x, groundY, h, i);
      else if (th.deco === 'pagoda') pagoda(ctx, x, groundY, h * 0.9, i, t);
      else if (th.deco === 'base') base(ctx, x, groundY, h * 0.7, i);
      else rock(ctx, x, groundY, h * 0.8, th.mid);
    }

    // ground
    ctx.fillStyle = th.ground;
    ctx.fillRect(0, groundY, W, H - groundY);
    ctx.fillStyle = th.top;
    ctx.fillRect(0, groundY - 4, W, 14);
    for (let x = -((camX) % 24); x < W; x += 24) {
      ctx.beginPath();
      ctx.arc(x + 12, groundY + 8, 10, 0, Math.PI);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    const s2 = 90;
    const f2 = Math.floor(camX / s2) - 1;
    for (let i = f2; i < f2 + W / s2 + 3; i++) {
      const x = i * s2 - camX + hash(i + 7) * 40;
      ctx.beginPath();
      ctx.ellipse(x, groundY + 40 + hash(i) * 30, 8, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (th.cobble) {
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      for (let row = 0; row < 4; row++) {
        const oy = groundY + 22 + row * 18;
        for (let x = -((camX + row * 13) % 30); x < W; x += 30) {
          ctx.beginPath();
          ctx.ellipse(x, oy, 12, 6, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    if (th.lava) {
      ctx.fillStyle = '#ff7b00';
      ctx.globalAlpha = 0.25 + Math.sin(t * 3) * 0.1;
      ctx.fillRect(0, H - 30, W, 30);
      ctx.globalAlpha = 1;
    }
  };
})();
