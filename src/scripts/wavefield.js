// Onda de sonido gigante (hero D).
// Un ecualizador espejo de punta a punta: cada barra es una columna de puntos
// que crece desde la línea central. Viaja una onda lenta, hay un latido suave,
// una cabeza de reproducción pervinca barre de izquierda a derecha y el ratón
// levanta las barras que tiene cerca.

function accentRGB(name = '--c1', fallback = [143, 166, 255]) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (v.startsWith('#')) {
    const n = parseInt(v.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  return fallback;
}

export function createWaveField(canvas, options = {}) {
  const o = { gap: 13, step: 7, ...options };
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let acc = accentRGB(), accB = accentRGB('--c2', [199, 166, 255]);
  addEventListener('accentchange', () => { acc = accentRGB(); accB = accentRGB('--c2', [199, 166, 255]); });

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
    const [c1, c2] = [acc, accB];

    // luz suave sobre la línea central, siguiendo la cabeza
    const gl = ctx.createRadialGradient(head, mid, 0, head, mid, w * 0.22);
    gl.addColorStop(0, `rgba(${c1[0]},${c1[1]},${c1[2]},0.20)`);
    gl.addColorStop(1, `rgba(${c1[0]},${c1[1]},${c1[2]},0)`);
    ctx.fillStyle = gl;
    ctx.fillRect(0, mid - maxH, w, maxH * 2);

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
        const up = k / n;                                                 // 0 centro → 1 punta
        const fall = 1 - up;
        const size = (2.2 - up * 0.9) * (1 + lit * 0.4);
        const alpha = Math.min(1, 0.3 + 0.5 * fall + lit * 0.5);
        // degradado pervinca (centro) → lila (punta); en reposo, teñido y apagado
        const c = Math.min(1, up * 1.1);
        const tint = 0.45 + lit * 0.55;
        const white = (1 - tint) * 0.55 + lit * lit * 0.3;               // blanco que se mezcla
        const r = Math.round((c1[0] + (c2[0] - c1[0]) * c) * (1 - white) + 255 * white);
        const g = Math.round((c1[1] + (c2[1] - c1[1]) * c) * (1 - white) + 255 * white);
        const b = Math.round((c1[2] + (c2[2] - c1[2]) * c) * (1 - white) + 255 * white);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
        ctx.beginPath(); ctx.arc(x, mid - y, size, 0, 6.2832); ctx.fill();   // arriba
        ctx.globalAlpha = 0.4;
        ctx.beginPath(); ctx.arc(x, mid + y, size * 0.9, 0, 6.2832); ctx.fill(); // reflejo abajo
        ctx.globalAlpha = 1;
        if (lit > 0.2) {                                                  // halo de luz
          ctx.globalCompositeOperation = 'lighter';
          ctx.fillStyle = `rgba(${r},${g},${b},${(0.07 * lit).toFixed(3)})`;
          ctx.beginPath(); ctx.arc(x, mid - y, size * 3.4, 0, 6.2832); ctx.fill();
          ctx.globalCompositeOperation = 'source-over';
        }
      }
      // punto de la línea central
      ctx.fillStyle = `rgba(${c1[0]},${c1[1]},${c1[2]},${(0.4 + lit * 0.6).toFixed(3)})`;
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
