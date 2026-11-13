// Onda de sonido gigante (hero D).
// Un ecualizador espejo de punta a punta: cada barra es una columna de puntos
// que crece desde la línea central. Viaja una onda lenta, hay un latido suave,
// una cabeza de reproducción pervinca barre de izquierda a derecha y el ratón
// levanta las barras que tiene cerca.

function accentRGB() {
  const v = getComputedStyle(document.documentElement).getPropertyValue('--c1').trim();
  if (v.startsWith('#')) {
    const n = parseInt(v.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  return [143, 166, 255];
}

export function createWaveField(canvas, options = {}) {
  const o = { gap: 13, step: 7, ...options };
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let acc = accentRGB();
  addEventListener('accentchange', () => { acc = accentRGB(); });

  let w = 0, h = 0, bars = 0, seeds = [];
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
  }

  let px = -999;
  const onMove = (e) => { const b = canvas.getBoundingClientRect(); px = e.clientY - b.top > -80 ? e.clientX - b.left : -999; };

  let raf = 0, visible = true;
  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    const mid = h * 0.58;
    const maxH = h * 0.5;
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

      const hd = Math.abs(x - head);
      const lit = Math.min(1, Math.exp(-(hd * hd) / 26000) + m * 0.9);    // brillo de cabeza / ratón
      const n = Math.max(1, Math.round((a * maxH) / o.step));

      for (let k = 0; k < n; k++) {
        const y = k * o.step + 2;
        const fall = 1 - k / (n + 2);                                     // se apaga hacia la punta
        const size = (2.1 - k / n * 0.9) * (1 + lit * 0.35);
        const alpha = Math.min(1, (0.2 + 0.55 * fall) + lit * 0.45);
        const tt = lit * (0.4 + 0.6 * fall);
        const r = Math.round(243 + (acc[0] - 243) * tt);
        const g = Math.round(241 + (acc[1] - 241) * tt);
        const b = Math.round(246 + (acc[2] - 246) * tt);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
        ctx.beginPath(); ctx.arc(x, mid - y, size, 0, 6.2832); ctx.fill();   // arriba
        ctx.globalAlpha = 0.45;
        ctx.beginPath(); ctx.arc(x, mid + y, size * 0.9, 0, 6.2832); ctx.fill(); // reflejo abajo
        ctx.globalAlpha = 1;
      }
      // punto de la línea central
      ctx.fillStyle = `rgba(${acc[0]},${acc[1]},${acc[2]},${(0.35 + lit * 0.65).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(x, mid, 1.6 + lit * 0.9, 0, 6.2832); ctx.fill();
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
