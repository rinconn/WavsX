// Onda de sonido gigante (hero D).
// Un ecualizador espejo de punta a punta: cada barra es una columna de puntos
// que crece desde la línea central. Cada barra tiene un solo color y el espectro
// va de pervinca (izquierda) a lila y a rosa (derecha). Sobre cada barra flota
// un punto de pico blanco que cae despacio, como en un medidor de verdad.
// Una cabeza de reproducción barre la onda y el ratón levanta las barras cercanas.

function readRGB(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (v.startsWith('#')) {
    const n = parseInt(v.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  return fallback;
}
const readPalette = () => [
  readRGB('--c1', [143, 166, 255]),
  readRGB('--c2', [199, 166, 255]),
  readRGB('--c3', [255, 168, 210])
];

// color del espectro en la posición u (0–1): c1 → c2 → c3
function spectrum(pal, u) {
  const x = Math.max(0, Math.min(0.9999, u)) * 2;
  const i = Math.floor(x), f = x - i;
  const a = pal[i], b = pal[i + 1];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
}

export function createWaveField(canvas, options = {}) {
  const o = { gap: 15, step: 5, ...options };
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let pal = readPalette();
  addEventListener('accentchange', () => { pal = readPalette(); });

  let w = 0, h = 0, bars = 0, seeds = [], peaks = [];
  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const b = canvas.getBoundingClientRect();
    w = b.width; h = b.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const gap = w < 700 ? 10 : o.gap;
    bars = Math.floor(w / gap);
    o._gap = w / bars;
    seeds = Array.from({ length: bars }, () => Math.random() * 6.28);
    peaks = new Array(bars).fill(0);
  }

  let px = -999;
  const onMove = (e) => { const b = canvas.getBoundingClientRect(); px = e.clientY - b.top > -80 ? e.clientX - b.left : -999; };

  let raf = 0, visible = true, last = 0;
  function draw(t) {
    const dt = Math.min(0.05, Math.max(0, t - last)); last = t;
    ctx.clearRect(0, 0, w, h);
    const mid = h * 0.6;
    const maxH = h * 0.56;
    const beat = Math.pow(Math.max(0, Math.cos(t * 7.2)), 8) * 0.07;     // latido
    const head = ((t * 0.11) % 1.25 - 0.12) * w;                          // cabeza de reproducción

    for (let i = 0; i < bars; i++) {
      const x = (i + 0.5) * o._gap;
      const u = x / w;                                                    // 0..1
      const env = 0.18 + 0.82 * Math.pow(Math.sin(Math.PI * u), 1.6);    // más alta en el centro
      const wave = 0.5 + 0.5 * Math.sin(u * 11 - t * 1.6 + seeds[i] * 0.25)
                       * Math.sin(u * 4.3 + t * 0.7);
      const jit = 0.5 + 0.5 * Math.sin(t * 2.2 + seeds[i]);
      let a = env * (0.14 + 0.62 * wave * 0.8 + 0.24 * jit * wave + beat);
      let m = 0;
      if (px > -900) { const d = x - px; m = Math.exp(-(d * d) / 9000); a += m * 0.28; }
      a = Math.min(1, Math.max(0.03, a));

      const hd = x - head;
      const lit = Math.min(1, Math.exp(-(hd * hd) / 26000) + m * 0.9);    // brillo de cabeza / ratón
      const n = Math.max(1, Math.round((a * maxH) / o.step));

      // pico que cae despacio
      peaks[i] = Math.max(n, peaks[i] - dt * 14);
      const pk = Math.round(peaks[i]) + 2;

      const col = spectrum(pal, u);                                       // un solo color por barra
      const cr = col[0], cg = col[1], cb = col[2];

      for (let k = 0; k < n; k++) {
        const y = k * o.step + 2;
        const up = k / n;                                                 // 0 centro → 1 punta
        const size = (2.9 - up * 1.0) * (1 + lit * 0.3);
        const alpha = Math.min(1, 0.5 + 0.4 * (1 - up) + lit * 0.35);
        // la punta se aclara hacia blanco; con luz, toda la barra se enciende
        const white = up * up * 0.35 + lit * lit * 0.3;
        const r = Math.round(cr * (1 - white) + 255 * white);
        const g = Math.round(cg * (1 - white) + 255 * white);
        const b = Math.round(cb * (1 - white) + 255 * white);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
        ctx.beginPath(); ctx.arc(x, mid - y, size, 0, 6.2832); ctx.fill();   // arriba
        ctx.globalAlpha = 0.38;
        ctx.beginPath(); ctx.arc(x, mid + y, size * 0.9, 0, 6.2832); ctx.fill(); // reflejo abajo
        ctx.globalAlpha = 1;
        if (lit > 0.25 && k % 2 === 0) {                                  // halo de luz
          ctx.globalCompositeOperation = 'lighter';
          ctx.fillStyle = `rgba(${cr | 0},${cg | 0},${cb | 0},${(0.08 * lit).toFixed(3)})`;
          ctx.beginPath(); ctx.arc(x, mid - y, size * 3.2, 0, 6.2832); ctx.fill();
          ctx.globalCompositeOperation = 'source-over';
        }
      }

      // punto de pico (blanco) y su reflejo
      const py = pk * o.step + 2;
      ctx.fillStyle = `rgba(255,255,255,${(0.75 + lit * 0.25).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(x, mid - py, 2.1, 0, 6.2832); ctx.fill();
      ctx.globalAlpha = 0.25;
      ctx.beginPath(); ctx.arc(x, mid + py, 1.9, 0, 6.2832); ctx.fill();
      ctx.globalAlpha = 1;

      // punto de la línea central
      ctx.fillStyle = `rgba(${cr | 0},${cg | 0},${cb | 0},${(0.5 + lit * 0.5).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(x, mid, 1.8 + lit, 0, 6.2832); ctx.fill();
    }
  }

  function loop(ms) {
    if (visible) draw(ms / 1000);
    raf = requestAnimationFrame(loop);
  }

  resize();
  addEventListener('resize', () => { resize(); if (reduce) draw(2); });
  if (reduce) {
    draw(2);
  } else {
    addEventListener('pointermove', onMove, { passive: true });
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);
    raf = requestAnimationFrame(loop);
  }
  return () => { cancelAnimationFrame(raf); removeEventListener('pointermove', onMove); };
}
