// Vinilo de partículas en <canvas>.
// Anillos de puntos inclinados que giran despacio. Cada pulso (128 BPM) lanza
// una onda desde el centro que levanta los puntos y los enciende con los
// colores de la paleta: c1 en el centro → c4 en el borde.

function hexToRgb(hex) {
  const n = parseInt(hex.trim().replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function readPalette() {
  const cs = getComputedStyle(document.documentElement);
  const out = [];
  for (let i = 1; i <= 4; i++) {
    const v = cs.getPropertyValue(`--c${i}`).trim();
    out.push(v.startsWith('#') ? hexToRgb(v) : [255, 138, 61]);
  }
  return out;
}

// color en la posición t (0–1) del degradado de 4 paradas
function mix(pal, t) {
  const x = Math.max(0, Math.min(0.9999, t)) * 3;
  const i = Math.floor(x), f = x - i;
  const a = pal[i], b = pal[i + 1];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
}

export function createVinyl(canvas, options = {}) {
  const o = {
    rings: 42,
    size: 0.46,
    cx: 0.5,
    cy: 0.55,
    tilt: 1.02,
    bpm: 128,
    speed: 0.14,
    follow: true,
    ...options
  };

  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // colores precalculados por anillo
  let ringRGB = [], labelRGB = '255,138,61';
  function buildColors() {
    const pal = readPalette();
    ringRGB = [];
    for (let k = 0; k < o.rings; k++) {
      const c = mix(pal, k / (o.rings - 1));
      ringRGB.push(c.map(Math.round));
    }
    labelRGB = pal[0].join(',');
  }
  buildColors();
  const onPalette = () => { buildColors(); if (reduce) draw(0.2); };
  window.addEventListener('accentchange', onPalette);

  const pts = [];
  for (let k = 0; k < o.rings; k++) {
    const r = 0.24 + (k / (o.rings - 1)) * 0.76;
    const n = Math.round(24 + r * 150);
    const off = Math.random() * Math.PI * 2;
    for (let j = 0; j < n; j++) {
      pts.push({ r, k, a: off + (j / n) * Math.PI * 2, jitter: (Math.random() - 0.5) * 0.006, big: Math.random() < 0.035 });
    }
  }
  for (let k = 0; k < 7; k++) {
    const r = 0.05 + k * 0.022;
    const n = Math.round(10 + r * 120);
    for (let j = 0; j < n; j++) pts.push({ r, k: -1, a: (j / n) * Math.PI * 2, label: true, jitter: 0 });
  }

  let w = 0, h = 0;
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const box = canvas.getBoundingClientRect();
    w = box.width; h = box.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  let mx = 0, my = 0, tx = 0, ty = 0;
  const onMove = (e) => { tx = e.clientX / window.innerWidth - 0.5; ty = e.clientY / window.innerHeight - 0.5; };
  const beat = 60 / o.bpm;
  let raf = 0, visible = true;

  function draw(t) {
    if (o.follow) { mx += (tx - mx) * 0.04; my += (ty - my) * 0.04; }
    ctx.clearRect(0, 0, w, h);

    const R = Math.min(w, h * 1.6) * o.size;
    const cx = w * o.cx + mx * 30, cy = h * o.cy + my * 20;
    const spin = t * o.speed;
    const tilt = o.tilt + my * 0.25;
    const cT = Math.cos(tilt), sT = Math.sin(tilt);
    const yaw = mx * 0.35, cY = Math.cos(yaw), sY = Math.sin(yaw);
    const phase = (t % beat) / beat;
    const fronts = [phase * 1.25, (phase + 1) * 1.25];

    for (const p of pts) {
      const a = p.a + spin;
      const r = p.r + p.jitter;
      const x = r * Math.cos(a);
      const z = r * Math.sin(a);

      let lift = 0, glow = 0;
      for (const f of fronts) {
        const d = r - f;
        const g = Math.exp(-(d * d) / 0.006);
        lift += g * 0.06 * (1.3 - f * 0.6);
        glow = Math.max(glow, g * (1.25 - f * 0.55));
      }
      const y = lift + 0.012 * Math.sin(t * 1.4 + r * 9);

      const x2 = x * cY - z * sY;
      const z2 = x * sY + z * cY;
      const y3 = y * cT - z2 * sT;
      const z3 = y * sT + z2 * cT;

      const persp = 1 / (1 - z3 * 0.22);
      const sx = cx + x2 * R * persp;
      const sy = cy - y3 * R * persp;
      if (sx < -8 || sx > w + 8 || sy < -8 || sy > h + 8) continue;

      const depth = (z3 + 1) / 2;
      const base = 0.16 + depth * 0.6;
      let size = (0.55 + depth * 1.25) * (p.big ? 1.8 : 1) * persp;

      if (p.label) {
        ctx.fillStyle = `rgba(${labelRGB},${(0.55 + depth * 0.45).toFixed(3)})`;
      } else {
        const c = ringRGB[p.k];
        // en reposo: blanco cálido teñido un poco del color de su anillo; con la onda: color pleno
        const tint = Math.min(1, 0.28 + glow);
        const rr = Math.round(242 + (c[0] - 242) * tint);
        const gg = Math.round(240 + (c[1] - 240) * tint);
        const bb = Math.round(246 + (c[2] - 246) * tint);
        ctx.fillStyle = `rgba(${rr},${gg},${bb},${Math.min(1, base + glow * 0.8).toFixed(3)})`;
        if (glow > 0.08) size *= 1 + glow * 0.6;
      }
      ctx.beginPath();
      ctx.arc(sx, sy, size, 0, 6.2832);
      ctx.fill();
    }
  }

  function loop(ms) {
    if (visible) draw(ms / 1000);
    raf = requestAnimationFrame(loop);
  }

  resize();
  window.addEventListener('resize', resize);
  if (reduce) {
    draw(0.2);
    window.addEventListener('resize', () => draw(0.2));
  } else {
    if (o.follow) window.addEventListener('pointermove', onMove, { passive: true });
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);
    raf = requestAnimationFrame(loop);
  }

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('accentchange', onPalette);
  };
}
