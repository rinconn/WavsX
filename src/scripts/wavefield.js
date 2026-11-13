// Onda de sonido gigante (hero D).
// Ecualizador espejo de punta a punta. Cada barra es UNA línea con trazo
// punteado y extremos redondos (un solo trazo por barra, muy ligero). Un solo
// color: el pervinca de la marca; las puntas se aclaran y la cabeza de
// reproducción enciende las barras que pasa. Sobre cada barra flota un punto
// de pico blanco que cae despacio. El ratón levanta las barras cercanas.

function readRGB(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (v.startsWith('#')) {
    const n = parseInt(v.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  return fallback;
}

export function createWaveField(canvas, options = {}) {
  const o = { gap: 16, step: 6, dot: 2.6, ...options };
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let c = readRGB('--c1', [143, 166, 255]);
  addEventListener('accentchange', () => { c = readRGB('--c1', [143, 166, 255]); });

  let w = 0, h = 0, bars = 0, seeds = [], peaks = [];
  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 1.75);
    const b = canvas.getBoundingClientRect();
    w = b.width; h = b.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const gap = w < 700 ? 11 : o.gap;
    bars = Math.floor(w / gap);
    o._gap = w / bars;
    seeds = Array.from({ length: bars }, () => Math.random() * 6.28);
    peaks = new Array(bars).fill(0);
  }

  let px = -999;
  const onMove = (e) => { const b = canvas.getBoundingClientRect(); px = e.clientY - b.top > -80 ? e.clientX - b.left : -999; };

  const mix = (k) => `${Math.round(c[0] + (255 - c[0]) * k)},${Math.round(c[1] + (255 - c[1]) * k)},${Math.round(c[2] + (255 - c[2]) * k)}`;
  // dibuja una columna punteada de n puntos desde y0 hacia arriba (dir -1) o abajo (+1)
  function column(x, y0, n, dir, width, style, alpha) {
    if (n < 1) return;
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = style;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x, y0);
    ctx.lineTo(x, y0 + dir * (n - 1) * o.step);
    ctx.stroke();
  }

  let raf = 0, visible = true, last = 0;
  function draw(t) {
    const dt = Math.min(0.05, Math.max(0, t - last)); last = t;
    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = 'round';
    ctx.setLineDash([0, o.step]);

    const mid = h * 0.6;
    const maxH = h * 0.56;
    const beat = Math.pow(Math.max(0, Math.cos(t * 7.2)), 8) * 0.07;
    const head = ((t * 0.11) % 1.25 - 0.12) * w;
    const base = `rgb(${mix(0.05)})`;

    for (let i = 0; i < bars; i++) {
      const x = (i + 0.5) * o._gap;
      const u = x / w;
      const env = 0.18 + 0.82 * Math.pow(Math.sin(Math.PI * u), 1.6);
      const wave = 0.5 + 0.5 * Math.sin(u * 11 - t * 1.6 + seeds[i] * 0.25) * Math.sin(u * 4.3 + t * 0.7);
      const jit = 0.5 + 0.5 * Math.sin(t * 2.2 + seeds[i]);
      let a = env * (0.14 + 0.62 * wave * 0.8 + 0.24 * jit * wave + beat);
      let m = 0;
      if (px > -900) { const d = x - px; m = Math.exp(-(d * d) / 9000); a += m * 0.28; }
      a = Math.min(1, Math.max(0.03, a));

      const hd = x - head;
      const lit = Math.min(1, Math.exp(-(hd * hd) / 26000) + m * 0.9);
      const n = Math.max(1, Math.round((a * maxH) / o.step));
      const y0 = mid - 2;

      // halo (solo las barras encendidas, que son pocas)
      if (lit > 0.3) {
        ctx.globalCompositeOperation = 'lighter';
        column(x, y0, n, -1, o.dot * 2 + 7, `rgb(${c[0]},${c[1]},${c[2]})`, 0.07 * lit);
        ctx.globalCompositeOperation = 'source-over';
      }

      const w1 = o.dot * 2 * (1 + lit * 0.15);
      column(x, y0, n, -1, w1, base, 0.62 + lit * 0.38);           // cuerpo
      const tipN = Math.min(n, 4);                                  // punta clara
      column(x, y0 - (n - tipN) * o.step, tipN, -1, w1, `rgb(${mix(0.55 + lit * 0.3)})`, 0.95);
      column(x, mid + 2, n, 1, w1 * 0.9, base, 0.22 + lit * 0.12);  // reflejo

      // pico que cae despacio
      peaks[i] = Math.max(n, peaks[i] - dt * 12);
      const py = mid - 2 - Math.round(peaks[i] + 1.5) * o.step;
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(x, py, 2, 0, 6.2832); ctx.fill();
    }
    ctx.globalAlpha = 1;
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
