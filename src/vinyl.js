// Vinilo de partículas en <canvas>.
// Un disco hecho de anillos de puntos, inclinado y girando. En cada pulso (BPM)
// sale una onda desde el centro que levanta los puntos y los ilumina en neón.

export function createVinyl(canvas, options = {}) {
  const o = {
    rings: 42,
    color: '242,242,245',
    accent: '198,255,61',
    size: 0.46,      // radio del disco respecto al lado menor
    cx: 0.5,         // centro (fracción del ancho)
    cy: 0.55,        // centro (fracción del alto)
    tilt: 1.02,      // inclinación en radianes (0 = visto de frente)
    bpm: 128,
    ...options
  };

  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // puntos: anillos concéntricos del 0.24 al 1 (la zona < 0.2 es la etiqueta)
  const pts = [];
  for (let k = 0; k < o.rings; k++) {
    const r = 0.24 + (k / (o.rings - 1)) * 0.76;
    const n = Math.round(24 + r * 150);
    const off = Math.random() * Math.PI * 2;
    for (let j = 0; j < n; j++) {
      pts.push({ r, a: off + (j / n) * Math.PI * 2, jitter: (Math.random() - 0.5) * 0.006, big: Math.random() < 0.035 });
    }
  }
  // etiqueta central en neón
  for (let k = 0; k < 7; k++) {
    const r = 0.05 + k * 0.022;
    const n = Math.round(10 + r * 120);
    for (let j = 0; j < n; j++) pts.push({ r, a: (j / n) * Math.PI * 2, label: true, jitter: 0 });
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
    mx += (tx - mx) * 0.04;
    my += (ty - my) * 0.04;
    ctx.clearRect(0, 0, w, h);

    const R = Math.min(w, h * 1.6) * o.size;
    const cx = w * o.cx + mx * 30, cy = h * o.cy + my * 20;
    const spin = t * 0.35;
    const tilt = o.tilt + my * 0.25;
    const cT = Math.cos(tilt), sT = Math.sin(tilt);
    const yaw = mx * 0.35, cY = Math.cos(yaw), sY = Math.sin(yaw);

    // dos ondas a la vez: la del pulso actual y la anterior
    const phase = (t % beat) / beat;
    const fronts = [phase * 1.25, (phase + 1) * 1.25];

    for (const p of pts) {
      const a = p.a + spin;
      const r = p.r + p.jitter;
      let x = r * Math.cos(a);
      let z = r * Math.sin(a);

      // altura: ondas que viajan hacia fuera + respiración suave
      let lift = 0, glow = 0;
      for (const f of fronts) {
        const d = r - f;
        const g = Math.exp(-(d * d) / 0.006);
        lift += g * 0.07 * (1.3 - f * 0.6);
        glow = Math.max(glow, g * (1.25 - f * 0.55));
      }
      const y = lift + 0.012 * Math.sin(t * 1.4 + r * 9);

      // giro lateral con el ratón
      const x2 = x * cY - z * sY;
      const z2 = x * sY + z * cY;
      // inclinación
      const y3 = y * cT - z2 * sT;
      const z3 = y * sT + z2 * cT;

      const persp = 1 / (1 - z3 * 0.22);
      const sx = cx + x2 * R * persp;
      const sy = cy - y3 * R * persp;
      if (sx < -8 || sx > w + 8 || sy < -8 || sy > h + 8) continue;

      const depth = (z3 + 1) / 2;
      const base = 0.18 + depth * 0.62;
      let size = (0.55 + depth * 1.25) * (p.big ? 1.8 : 1) * persp;

      if (p.label) {
        ctx.fillStyle = `rgba(${o.accent},${(0.55 + depth * 0.45).toFixed(3)})`;
      } else if (glow > 0.08) {
        ctx.fillStyle = `rgba(${o.accent},${Math.min(1, base + glow).toFixed(3)})`;
        size *= 1 + glow * 0.6;
      } else {
        ctx.fillStyle = `rgba(${o.color},${base.toFixed(3)})`;
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
    window.addEventListener('pointermove', onMove, { passive: true });
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);
    raf = requestAnimationFrame(loop);
  }

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    window.removeEventListener('pointermove', onMove);
  };
}
