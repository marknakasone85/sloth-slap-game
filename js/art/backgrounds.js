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

  Object.assign(THEMES, {
    mountain: {
      sky: ['#8ecae6', '#eef6fb'], far: '#9db4c8', mid: '#2d6a4f',
      ground: '#7d8597', top: '#f8fbff', deco: 'pine', orb: '#ffffff', farStyle: 'snowpeaks', snow: true,
    },
    castle: {
      sky: ['#2b2d52', '#c06c84'], far: '#4a4e7a', mid: '#6c6f80',
      ground: '#55565f', top: '#6b8f5e', deco: 'castle', orb: '#f8f4e3', farStyle: 'castle', bricks: true,
    },
    lava: {
      sky: ['#1a0b0b', '#8c2f1b'], far: '#3a1512', mid: '#2a100e',
      ground: '#2b1d1d', top: '#ff7b00', deco: 'lavafall', orb: '#ff9f1c', farStyle: 'volcanoes',
      lava: true, embers: true, noClouds: true,
    },
    dino: {
      sky: ['#f6bd60', '#fdf0d5'], far: '#8a9a5b', mid: '#386641',
      ground: '#7f5539', top: '#6a994e', deco: 'fern', orb: '#fff3b0', farStyle: 'volcanoes',
    },
    space: {
      sky: ['#05060f', '#1b1f3b'], far: '#2a2f55', mid: '#5c677d',
      ground: '#3d4457', top: '#9aa5b8', deco: 'station', orb: '#c77dff', farStyle: 'stars',
      noClouds: true, metal: true, noOrb: true,
    },
  });

  Object.assign(THEMES, {
    dc: {
      sky: ['#9fd3f5', '#f2f8fc'], far: '#e4e8ee', mid: '#f3f1ec',
      ground: '#b9a88f', top: '#7cb342', deco: 'dc', orb: '#fff6b0', farStyle: 'monuments',
    },
    egypt: {
      sky: ['#ffb347', '#ffe8b0'], far: '#d9a55b', mid: '#c98f45',
      ground: '#e9c46a', top: '#f2d18b', deco: 'egypt', orb: '#fff1a8', farStyle: 'pyramids',
    },
    cave: {
      sky: ['#140d1d', '#2a1f36'], far: '#251b30', mid: '#3a2d47',
      ground: '#3a3040', top: '#5c4d63', deco: 'crystal', farStyle: 'stalactites',
      noClouds: true, noOrb: true, dark: 0.62,
    },
    nyc: {
      sky: ['#2b2d52', '#ff9e7a'], far: '#3a3f63', mid: '#7a4b3a',
      ground: '#38383e', top: '#9a9aa2', deco: 'nyc', orb: '#ffd6a5', farStyle: 'skyline', street: true,
    },
  });

  // ---------- Washington DC ----------
  function dc(ctx, x, base, h, i, t) {
    const k = i % 3;
    if (k === 0) {
      // cherry blossom tree
      ctx.fillStyle = '#5a3a2a';
      ctx.fillRect(x - 6, base - h * 0.55, 12, h * 0.55);
      ctx.fillStyle = '#ffb7c5';
      for (const [dx, dy, r] of [[-30, -0.62, 32], [24, -0.66, 30], [0, -0.8, 34], [-12, -0.55, 24], [30, -0.5, 22]]) {
        ctx.beginPath(); ctx.arc(x + dx, base + h * dy, r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#ff8fab';
      for (let p = 0; p < 4; p++) {
        const py = base - h * 0.4 + ((t * 30 + p * 40 + i * 17) % (h * 0.4));
        ctx.fillRect(x - 30 + p * 18 + Math.sin(t * 2 + p) * 6, py, 4, 3);
      }
    } else if (k === 1) {
      // white columned building
      const w = 150, bh = h * 0.6;
      ctx.fillStyle = '#e6e2da';
      ctx.fillRect(x - w / 2 - 10, base - 14, w + 20, 14);
      ctx.fillStyle = '#f3f1ec';
      ctx.fillRect(x - w / 2, base - bh, w, bh - 14);
      ctx.beginPath(); ctx.moveTo(x - w / 2 - 10, base - bh); ctx.lineTo(x, base - bh - 36); ctx.lineTo(x + w / 2 + 10, base - bh); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#d6d1c6';
      for (let c = 0; c < 6; c++) ctx.fillRect(x - w / 2 + 10 + c * 25, base - bh + 8, 9, bh - 26);
    } else {
      // lamp post + bench
      ctx.fillStyle = '#2b2b2b';
      ctx.fillRect(x - 3, base - 110, 6, 110);
      ctx.fillStyle = '#fff3b0';
      ctx.beginPath(); ctx.arc(x, base - 116, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#5c3d2e';
      ctx.fillRect(x + 20, base - 30, 60, 6);
      ctx.fillRect(x + 20, base - 46, 60, 5);
      ctx.fillStyle = '#2b2b2b';
      ctx.fillRect(x + 24, base - 24, 4, 24); ctx.fillRect(x + 72, base - 24, 4, 24);
    }
  }

  // ---------- Egypt ----------
  function egypt(ctx, x, base, h, i, t) {
    const k = i % 3;
    if (k === 0) {
      // obelisk with a golden tip and simple carvings
      ctx.fillStyle = '#d4a35f';
      ctx.beginPath(); ctx.moveTo(x - 16, base); ctx.lineTo(x - 11, base - h); ctx.lineTo(x + 11, base - h); ctx.lineTo(x + 16, base); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffd23f';
      ctx.beginPath(); ctx.moveTo(x - 11, base - h); ctx.lineTo(x, base - h - 22); ctx.lineTo(x + 11, base - h); ctx.fill();
      ctx.fillStyle = 'rgba(120,70,20,0.45)';
      for (let y = base - h + 24; y < base - 20; y += 26) {
        ctx.fillRect(x - 5, y, 10, 3);
        ctx.beginPath(); ctx.arc(x, y + 12, 4, 0, Math.PI * 2); ctx.fill();
      }
    } else if (k === 1) {
      palm(ctx, x, base, h, '#2a9d8f', t);
    } else {
      // sandstone columns with a lintel
      ctx.fillStyle = '#c98f45';
      ctx.fillRect(x - 50, base - h * 0.7, 22, h * 0.7);
      ctx.fillRect(x + 28, base - h * 0.7, 22, h * 0.7);
      ctx.fillStyle = '#b77d36';
      ctx.fillRect(x - 60, base - h * 0.7 - 18, 120, 18);
      ctx.fillStyle = 'rgba(42,157,143,0.6)';
      ctx.fillRect(x - 60, base - h * 0.7 - 12, 120, 4);
    }
  }

  // ---------- Crystal cave ----------
  function crystal(ctx, x, base, h, i, t) {
    const k = i % 3;
    if (k === 0 || k === 2) {
      const col = k === 0 ? [0, 245, 212] : [199, 125, 255];
      const glow = 0.25 + Math.sin(t * 2 + i) * 0.1;
      ctx.fillStyle = `rgba(${col.join(',')},${glow})`;
      ctx.beginPath(); ctx.arc(x, base - 40, 70, 0, Math.PI * 2); ctx.fill();
      for (const [dx, ch, cw, rot] of [[-20, 0.5, 14, -0.3], [0, 0.75, 18, 0], [22, 0.45, 13, 0.35], [10, 0.3, 10, 0.6]]) {
        ctx.save();
        ctx.translate(x + dx, base);
        ctx.rotate(rot);
        ctx.fillStyle = `rgb(${col.join(',')})`;
        ctx.beginPath(); ctx.moveTo(-cw / 2, 0); ctx.lineTo(-cw / 2, -h * ch * 0.8); ctx.lineTo(0, -h * ch); ctx.lineTo(cw / 2, -h * ch * 0.8); ctx.lineTo(cw / 2, 0); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.fillRect(-cw / 2 + 2, -h * ch * 0.75, 3, h * ch * 0.6);
        ctx.restore();
      }
    } else {
      // glowing mushrooms + a stalagmite
      ctx.fillStyle = '#4a3b57';
      ctx.beginPath(); ctx.moveTo(x - 30, base); ctx.lineTo(x - 6, base - h * 0.7); ctx.lineTo(x + 18, base); ctx.fill();
      for (const [dx, s] of [[34, 1], [54, 0.7], [18, 0.55]]) {
        ctx.fillStyle = '#e8e0d0';
        ctx.fillRect(x + dx - 3 * s, base - 30 * s, 6 * s, 30 * s);
        ctx.fillStyle = `rgba(155,246,255,${0.7 + Math.sin(t * 3 + dx) * 0.2})`;
        ctx.beginPath(); ctx.ellipse(x + dx, base - 30 * s, 16 * s, 9 * s, 0, Math.PI, 0); ctx.fill();
      }
    }
  }

  // ---------- New York City ----------
  function nyc(ctx, x, base, h, i, t) {
    const k = i % 4;
    if (k === 0 || k === 1) {
      // brownstone (k=0) or pizza shop with an awning (k=1)
      const w = 130, bh = h * 0.9;
      ctx.fillStyle = k === 0 ? '#7a4b3a' : '#8c5a44';
      ctx.fillRect(x - w / 2, base - bh, w, bh);
      ctx.fillStyle = '#5c3528';
      ctx.fillRect(x - w / 2 - 4, base - bh - 8, w + 8, 10);
      for (let wy = base - bh + 18; wy < base - 70; wy += 42) {
        for (let wx = x - w / 2 + 14; wx < x + w / 2 - 20; wx += 38) {
          ctx.fillStyle = hash(wx * 7 + wy + i) > 0.45 ? '#ffd166' : '#2b2d42';
          ctx.fillRect(wx, wy, 20, 26);
        }
      }
      if (k === 1) {
        for (let s = 0; s < 8; s++) {
          ctx.fillStyle = s % 2 ? '#ffffff' : '#e63946';
          ctx.fillRect(x - w / 2 + s * (w / 8), base - 70, w / 8, 18);
        }
        ctx.fillStyle = '#2b2d42';
        ctx.fillRect(x - 40, base - 52, 80, 52);
        SS.UI.outlineText(ctx, 'PIZZA', x, base - 84, 15, '#ffd23f', 'center');
      } else {
        // stoop steps
        ctx.fillStyle = '#6a3f30';
        for (let s = 0; s < 4; s++) ctx.fillRect(x - 20 - s * 4, base - 8 - s * 8, 40 + s * 8, 8);
      }
    } else if (k === 2) {
      // hot dog cart
      ctx.fillStyle = '#c0c0c8';
      ctx.fillRect(x - 40, base - 50, 80, 34);
      ctx.fillStyle = '#e63946';
      ctx.fillRect(x - 40, base - 40, 80, 6);
      ctx.fillStyle = '#2b2b2b';
      ctx.beginPath(); ctx.arc(x - 26, base - 10, 10, 0, Math.PI * 2); ctx.arc(x + 26, base - 10, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(x - 2, base - 110, 4, 60);
      for (let s = 0; s < 6; s++) {
        ctx.fillStyle = s % 2 ? '#ffd23f' : '#3a86ff';
        ctx.beginPath(); ctx.moveTo(x, base - 112); ctx.lineTo(x - 50 + s * 16.6, base - 90); ctx.lineTo(x - 50 + (s + 1) * 16.6, base - 90); ctx.fill();
      }
      SS.UI.text(ctx, 'HOT DOGS', x, base - 30, 9, '#2b2b2b', 'center');
    } else {
      // street lamp + fire hydrant
      ctx.fillStyle = '#2b2b2b';
      ctx.fillRect(x - 3, base - 150, 6, 150);
      ctx.fillRect(x - 3, base - 150, 34, 5);
      ctx.fillStyle = '#fff3b0';
      ctx.beginPath(); ctx.arc(x + 30, base - 142, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e63946';
      ctx.fillRect(x + 50, base - 30, 18, 30);
      ctx.beginPath(); ctx.arc(x + 59, base - 30, 9, Math.PI, 0); ctx.fill();
      ctx.fillRect(x + 44, base - 22, 30, 6);
    }
  }

  // Darkness with soft holes of light (cave). lights = [{ x, y, r }] in screen coordinates.
  let darkCanvas = null;
  SS.Art.darkness = function (ctx, lights, alpha) {
    if (typeof document === 'undefined' || !document.createElement) return;
    if (!darkCanvas) {
      darkCanvas = document.createElement('canvas');
      darkCanvas.width = W;
      darkCanvas.height = H;
    }
    const c = darkCanvas.getContext('2d');
    c.globalCompositeOperation = 'source-over';
    c.clearRect(0, 0, W, H);
    c.fillStyle = `rgba(6,3,14,${alpha})`;
    c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = 'destination-out';
    for (const l of lights) {
      const g = c.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r);
      g.addColorStop(0, 'rgba(0,0,0,1)');
      g.addColorStop(0.55, 'rgba(0,0,0,0.75)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g;
      c.beginPath(); c.arc(l.x, l.y, l.r, 0, Math.PI * 2); c.fill();
    }
    c.globalCompositeOperation = 'source-over';
    ctx.drawImage(darkCanvas, 0, 0, W, H);
  };
  SS.Art.isDark = (theme) => !!(THEMES[theme] && THEMES[theme].dark);
  SS.Art.darkAlpha = (theme) => (THEMES[theme] && THEMES[theme].dark) || 0;

  // ---------- Mountain ----------
  function pine(ctx, x, base, h, c) {
    ctx.fillStyle = '#4a2c17';
    ctx.fillRect(x - 6, base - h * 0.3, 12, h * 0.3);
    for (let i = 0; i < 3; i++) {
      const w = 60 - i * 14, y = base - h * 0.25 - i * h * 0.24;
      ctx.fillStyle = c;
      ctx.beginPath(); ctx.moveTo(x - w, y); ctx.lineTo(x, y - h * 0.38); ctx.lineTo(x + w, y); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#f8fbff';
      ctx.beginPath(); ctx.moveTo(x - w * 0.35, y - h * 0.25); ctx.lineTo(x, y - h * 0.38); ctx.lineTo(x + w * 0.35, y - h * 0.25); ctx.closePath(); ctx.fill();
    }
  }

  // ---------- Castle ----------
  function castle(ctx, x, base, h, i, t) {
    if (i % 2 === 0) {
      ctx.fillStyle = '#6c6f80';
      ctx.fillRect(x - 34, base - h, 68, h);
      for (let k = 0; k < 4; k++) ctx.fillRect(x - 34 + k * 20, base - h - 14, 12, 14);
      ctx.fillStyle = '#2b2d52';
      ctx.beginPath(); ctx.arc(x, base - h + 40, 9, Math.PI, 0); ctx.rect(x - 9, base - h + 40, 18, 18); ctx.fill();
      ctx.fillStyle = i % 4 === 0 ? '#e63946' : '#3a86ff';
      ctx.beginPath(); ctx.moveTo(x - 16, base - h + 70); ctx.lineTo(x + 16, base - h + 70); ctx.lineTo(x + 16, base - h + 130); ctx.lineTo(x, base - h + 116); ctx.lineTo(x - 16, base - h + 130); ctx.fill();
      ctx.fillStyle = '#ffd23f';
      SS.FX.star(ctx, x, base - h + 92, 8);
    } else {
      ctx.fillStyle = '#5d606f';
      ctx.fillRect(x - 70, base - h * 0.55, 140, h * 0.55);
      for (let k = 0; k < 7; k++) ctx.fillRect(x - 70 + k * 21, base - h * 0.55 - 10, 12, 10);
      // flickering torch
      ctx.fillStyle = '#5c3d2e';
      ctx.fillRect(x - 3, base - h * 0.35, 6, 18);
      const fl = 1 + Math.sin(t * 20 + i) * 0.2;
      ctx.fillStyle = '#ff7b00';
      ctx.beginPath(); ctx.ellipse(x, base - h * 0.35 - 6, 6 * fl, 10 * fl, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd23f';
      ctx.beginPath(); ctx.ellipse(x, base - h * 0.35 - 4, 3, 5, 0, 0, Math.PI * 2); ctx.fill();
    }
  }

  // ---------- Lava cave ----------
  function lavafall(ctx, x, base, h, i, t) {
    ctx.fillStyle = '#2a100e';
    ctx.beginPath(); ctx.moveTo(x - 50, base); ctx.lineTo(x - 30, base - h); ctx.lineTo(x + 30, base - h - 20); ctx.lineTo(x + 50, base); ctx.closePath(); ctx.fill();
    if (i % 2 === 0) {
      const g = ctx.createLinearGradient(0, base - h, 0, base);
      g.addColorStop(0, '#ffd23f'); g.addColorStop(1, '#ff4d00');
      ctx.fillStyle = g;
      const wob = Math.sin(t * 4 + i) * 3;
      ctx.fillRect(x - 8 + wob, base - h, 16, h);
      ctx.fillStyle = 'rgba(255,123,0,0.25)';
      ctx.beginPath(); ctx.ellipse(x, base - 4, 46, 12, 0, 0, Math.PI * 2); ctx.fill();
    }
  }

  // ---------- Dinosaur times ----------
  function fern(ctx, x, base, h, i, t) {
    ctx.fillStyle = '#6b4226';
    ctx.fillRect(x - 7, base - h * 0.6, 14, h * 0.6);
    ctx.fillStyle = i % 2 ? '#386641' : '#4f772d';
    const sway = Math.sin(t * 1.3 + i) * 0.1;
    for (let k = 0; k < 7; k++) {
      ctx.save();
      ctx.translate(x, base - h * 0.6);
      ctx.rotate(-Math.PI + (k / 6) * Math.PI + sway);
      ctx.beginPath(); ctx.ellipse(48, 0, 52, 9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }

  // ---------- Space station ----------
  function station(ctx, x, base, h, i, t) {
    ctx.fillStyle = '#4a5468';
    ctx.fillRect(x - 60, base - h, 120, h);
    ctx.fillStyle = '#5c677d';
    ctx.fillRect(x - 60, base - h, 120, 10);
    if (i % 2 === 0) {
      // porthole with stars and a planet outside
      ctx.fillStyle = '#05060f';
      ctx.beginPath(); ctx.arc(x, base - h * 0.6, 34, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      for (let k = 0; k < 6; k++) ctx.fillRect(x - 24 + hash(i * 9 + k) * 48, base - h * 0.6 - 24 + hash(i * 5 + k) * 48, 2, 2);
      ctx.fillStyle = '#4cc9f0';
      ctx.beginPath(); ctx.arc(x + 12, base - h * 0.6 + 10, 10, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#9aa5b8';
      ctx.lineWidth = 6;
      ctx.beginPath(); ctx.arc(x, base - h * 0.6, 34, 0, Math.PI * 2); ctx.stroke();
    } else {
      // console with blinking lights
      ctx.fillStyle = '#2b3245';
      ctx.fillRect(x - 46, base - h * 0.55, 92, 50);
      for (let k = 0; k < 8; k++) {
        ctx.fillStyle = Math.floor(t * 3 + k * 1.7 + i) % 3 === 0 ? '#52e07a' : k % 2 ? '#ff4d6d' : '#ffd23f';
        ctx.fillRect(x - 38 + (k % 4) * 22, base - h * 0.55 + 10 + Math.floor(k / 4) * 18, 10, 8);
      }
    }
  }

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
    if (style === 'monuments') {
      // lawn horizon with a domed building and a tall monument, far away
      ctx.fillStyle = '#9ccc65';
      ctx.fillRect(0, groundY - 40, W, 40);
      const off = camX * 0.1;
      for (let x = -(off % 1100) + 240; x < W + 600; x += 1100) {
        ctx.fillStyle = '#eef1f5';
        ctx.fillRect(x - 160, groundY - 120, 320, 80);
        ctx.fillRect(x - 60, groundY - 160, 120, 40);
        ctx.beginPath(); ctx.arc(x, groundY - 160, 54, Math.PI, 0); ctx.fill();
        ctx.fillRect(x - 6, groundY - 236, 12, 26);
        ctx.fillStyle = '#d6dbe3';
        for (let c = -140; c <= 140; c += 28) ctx.fillRect(x + c, groundY - 116, 8, 70);
        // tall obelisk monument
        ctx.fillStyle = '#e8ebf0';
        const mx = x + 470;
        ctx.beginPath(); ctx.moveTo(mx - 16, groundY - 40); ctx.lineTo(mx - 10, groundY - 330); ctx.lineTo(mx, groundY - 350); ctx.lineTo(mx + 10, groundY - 330); ctx.lineTo(mx + 16, groundY - 40); ctx.fill();
      }
      return;
    }
    if (style === 'pyramids') {
      const off = camX * 0.12;
      for (let x = -(off % 800) - 100; x < W + 800; x += 800) {
        for (const [dx, ph] of [[0, 250], [230, 190], [400, 140]]) {
          const px = x + dx;
          ctx.fillStyle = '#e0b46e';
          ctx.beginPath(); ctx.moveTo(px - ph * 1.1, groundY); ctx.lineTo(px, groundY - ph); ctx.lineTo(px + ph * 1.1, groundY); ctx.fill();
          ctx.fillStyle = '#c4934e';
          ctx.beginPath(); ctx.moveTo(px, groundY - ph); ctx.lineTo(px + ph * 1.1, groundY); ctx.lineTo(px + ph * 0.25, groundY); ctx.fill();
        }
      }
      // sand dunes in front
      ctx.fillStyle = '#e9c46a';
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      for (let x = 0; x <= W; x += 20) ctx.lineTo(x, groundY - 30 - Math.sin((x + camX * 0.3) * 0.01) * 18);
      ctx.lineTo(W, groundY);
      ctx.fill();
      return;
    }
    if (style === 'stalactites') {
      const off = camX * 0.3;
      ctx.fillStyle = '#1e1529';
      ctx.fillRect(0, 0, W, 50);
      for (let i = Math.floor(off / 70) - 1; i < Math.floor(off / 70) + W / 70 + 2; i++) {
        const x = i * 70 - off + hash(i) * 30, len = 40 + hash(i + 3) * 110;
        ctx.fillStyle = hash(i + 9) > 0.5 ? '#2b2035' : '#33263f';
        ctx.beginPath(); ctx.moveTo(x - 18, 40); ctx.lineTo(x, 40 + len); ctx.lineTo(x + 18, 40); ctx.fill();
      }
      // far rock wall
      ctx.fillStyle = th.far;
      ctx.beginPath(); ctx.moveTo(0, groundY);
      for (let x = 0; x <= W; x += 30) ctx.lineTo(x, groundY - 90 - hash(Math.floor((x + camX * 0.15) / 30)) * 60);
      ctx.lineTo(W, groundY); ctx.fill();
      return;
    }
    if (style === 'skyline') {
      for (let layer = 0; layer < 2; layer++) {
        const off = camX * (0.1 + layer * 0.12), sp = 70;
        const first = Math.floor(off / sp) - 1;
        for (let i = first; i < first + W / sp + 3; i++) {
          const x = i * sp - off;
          const bh = (layer ? 130 : 210) + hash(i * 5 + layer) * (layer ? 120 : 200) + (i % 17 === 0 && !layer ? 160 : 0);
          ctx.fillStyle = layer ? '#4a4f78' : '#323659';
          ctx.fillRect(x, groundY - bh, sp - 6, bh);
          if (i % 17 === 0 && !layer) { // a famous-looking spire
            ctx.beginPath(); ctx.moveTo(x + 10, groundY - bh); ctx.lineTo(x + 32, groundY - bh - 70); ctx.lineTo(x + 54, groundY - bh); ctx.fill();
          }
          ctx.fillStyle = layer ? 'rgba(255,209,102,0.7)' : 'rgba(255,209,102,0.45)';
          for (let wy = groundY - bh + 10; wy < groundY - 10; wy += 16) {
            for (let wx = 6; wx < sp - 12; wx += 12) if (hash(i * 31 + wx + wy) > 0.55) ctx.fillRect(x + wx, wy, 5, 7);
          }
        }
      }
      return;
    }
    if (style === 'stars') {
      for (let i = 0; i < 90; i++) {
        const x = ((hash(i) * 2400 - camX * 0.05) % W + W) % W, y = hash(i + 300) * (groundY - 60);
        ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * (1 + hash(i + 7) * 2) + i));
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, y, hash(i + 50) < 0.15 ? 3 : 2, hash(i + 50) < 0.15 ? 3 : 2);
      }
      ctx.globalAlpha = 1;
      // ringed planet
      const px = 760 - camX * 0.02, py = 110;
      ctx.fillStyle = '#c77dff';
      ctx.beginPath(); ctx.arc(px, py, 48, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.beginPath(); ctx.arc(px - 14, py - 14, 22, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#ffd6a5';
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.ellipse(px, py, 84, 18, -0.3, 0, Math.PI * 2); ctx.stroke();
      // station trusses
      ctx.strokeStyle = th.far;
      ctx.lineWidth = 6;
      const off = camX * 0.25;
      for (let x = -(off % 160); x < W + 160; x += 160) {
        ctx.beginPath(); ctx.moveTo(x, groundY - 150); ctx.lineTo(x + 80, groundY - 90); ctx.lineTo(x + 160, groundY - 150); ctx.stroke();
      }
      ctx.beginPath(); ctx.moveTo(0, groundY - 150); ctx.lineTo(W, groundY - 150); ctx.stroke();
      return;
    }
    if (style === 'snowpeaks' || style === 'volcanoes') {
      for (let layer = 0; layer < 2; layer++) {
        const par = 0.1 + layer * 0.12, sp = style === 'volcanoes' ? 320 : 200;
        const off = camX * par, first = Math.floor(off / sp) - 1;
        for (let i = first; i < first + W / sp + 3; i++) {
          const x = i * sp - off + hash(i + layer * 30) * 70;
          const ph = (style === 'volcanoes' ? 170 : 210) + hash(i * 3 + layer) * 120 - layer * 50;
          const w = style === 'volcanoes' ? 150 : 110;
          ctx.fillStyle = layer ? th.far : 'rgba(255,255,255,0.35)';
          if (layer === 0) ctx.fillStyle = style === 'volcanoes' ? 'rgba(120,60,40,0.35)' : '#c9d8e6';
          ctx.beginPath();
          if (style === 'volcanoes') {
            ctx.moveTo(x - w, groundY); ctx.lineTo(x - 22, groundY - ph); ctx.lineTo(x + 22, groundY - ph); ctx.lineTo(x + w, groundY);
          } else {
            ctx.moveTo(x - w, groundY); ctx.lineTo(x, groundY - ph); ctx.lineTo(x + w, groundY);
          }
          ctx.closePath(); ctx.fill();
          if (style === 'snowpeaks') {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.moveTo(x - w * 0.28, groundY - ph * 0.72); ctx.lineTo(x, groundY - ph);
            ctx.lineTo(x + w * 0.28, groundY - ph * 0.72); ctx.lineTo(x + 8, groundY - ph * 0.78); ctx.lineTo(x - 6, groundY - ph * 0.7);
            ctx.closePath(); ctx.fill();
          } else if (layer === 1) {
            // smoke puffs
            for (let k = 0; k < 3; k++) {
              const sy = ((t * 18 + k * 40 + i * 13) % 120);
              ctx.fillStyle = `rgba(90,80,80,${0.5 - sy / 260})`;
              ctx.beginPath(); ctx.arc(x + Math.sin(t + k) * 10, groundY - ph - 10 - sy, 14 + sy * 0.15, 0, Math.PI * 2); ctx.fill();
            }
          }
        }
      }
      return;
    }
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
    if (style === 'castle') {
      // a big castle on the far hills
      const off = camX * 0.12;
      for (let x = -(off % 900) + 200; x < W + 400; x += 900) {
        ctx.fillStyle = '#3a3d66';
        ctx.fillRect(x - 120, groundY - 250, 240, 120);
        for (const tx of [-130, -40, 50, 130]) {
          ctx.fillRect(x + tx - 18, groundY - 300, 36, 170);
          ctx.beginPath(); ctx.moveTo(x + tx - 24, groundY - 300); ctx.lineTo(x + tx, groundY - 345); ctx.lineTo(x + tx + 24, groundY - 300); ctx.fill();
        }
        ctx.fillStyle = '#ffd23f';
        for (const wx of [-60, 0, 60]) ctx.fillRect(x + wx - 5, groundY - 220, 10, 16);
      }
    } else if (style === 'cypress') {
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

    if (!th.noOrb) {
      ctx.fillStyle = th.orb;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(780, 90, 46, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // drifting clouds
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    for (let i = 0; i < 5 && !th.noClouds; i++) {
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
      else if (th.deco === 'pine') pine(ctx, x, groundY, h, th.mid);
      else if (th.deco === 'castle') castle(ctx, x, groundY, h * 0.9, i, t);
      else if (th.deco === 'lavafall') lavafall(ctx, x, groundY, h, i, t);
      else if (th.deco === 'fern') fern(ctx, x, groundY, h * 0.8, i, t);
      else if (th.deco === 'station') station(ctx, x, groundY, h * 0.8, i, t);
      else if (th.deco === 'dc') dc(ctx, x, groundY, h, i, t);
      else if (th.deco === 'egypt') egypt(ctx, x, groundY, h, i, t);
      else if (th.deco === 'crystal') crystal(ctx, x, groundY, h * 0.8, i, t);
      else if (th.deco === 'nyc') nyc(ctx, x, groundY, h, i, t);
      else rock(ctx, x, groundY, h * 0.8, th.mid);
    }

    // ground
    ctx.fillStyle = th.ground;
    ctx.fillRect(0, groundY, W, H - groundY);
    ctx.fillStyle = th.top;
    ctx.fillRect(0, groundY - 4, W, 14);
    for (let x = -((camX) % 24); x < W && !th.metal; x += 24) {
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
    if (th.street) {
      // sidewalk + road with yellow lane dashes and a crosswalk now and then
      ctx.fillStyle = '#7a7a82';
      ctx.fillRect(0, groundY + 10, W, 8);
      ctx.fillStyle = '#ffd23f';
      for (let x = -(camX % 70); x < W; x += 70) ctx.fillRect(x, groundY + 46, 36, 5);
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      const cw = 1400, cx = -(camX % cw) + 600;
      for (let k = 0; k < 7; k++) ctx.fillRect(cx + k * 16, groundY + 24, 9, 56);
    }
    if (th.bricks) {
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      for (let row = 0; row < 4; row++) {
        const oy = groundY + 16 + row * 20;
        ctx.fillRect(0, oy, W, 2);
        for (let x = -((camX + row * 24) % 48); x < W; x += 48) ctx.fillRect(x, oy, 2, 20);
      }
    }
    if (th.metal) {
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      for (let x = -(camX % 80); x < W; x += 80) ctx.fillRect(x, groundY + 6, 2, H - groundY);
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      for (let x = -(camX % 80); x < W; x += 80) { ctx.fillRect(x + 8, groundY + 18, 4, 4); ctx.fillRect(x + 68, groundY + 18, 4, 4); }
      // hazard stripes
      for (let x = -(camX % 40); x < W; x += 40) {
        ctx.fillStyle = '#ffd23f';
        ctx.beginPath(); ctx.moveTo(x, groundY + 4); ctx.lineTo(x + 20, groundY + 4); ctx.lineTo(x + 10, groundY + 12); ctx.lineTo(x - 10, groundY + 12); ctx.fill();
      }
    }
    if (th.snow || th.embers) {
      for (let i = 0; i < 60; i++) {
        const sp = 20 + hash(i) * 40;
        const fx = ((hash(i + 5) * 1400 + Math.sin(t + i) * 20 - camX * 0.6) % W + W) % W;
        let fy = th.snow ? (hash(i + 9) * H + t * sp) % H : H - ((hash(i + 9) * H + t * sp * 1.5) % H);
        ctx.fillStyle = th.snow ? 'rgba(255,255,255,0.85)' : `rgba(255,${120 + Math.floor(hash(i) * 100)},0,0.8)`;
        ctx.beginPath(); ctx.arc(fx, fy, th.snow ? 2 + hash(i + 2) * 2 : 1.5 + hash(i + 2) * 1.5, 0, Math.PI * 2); ctx.fill();
      }
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
