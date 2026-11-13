// Cúpula de partículas (hero C).
// Una esfera enorme de puntos que sube desde el borde inferior y gira despacio.
// Ondas de sonido la recorren de arriba abajo: levantan los puntos y los
// encienden en el color principal. El ratón también los enciende al pasar.

function accentRGB() {
  const v = getComputedStyle(document.documentElement).getPropertyValue('--c1').trim();
  if (v.startsWith('#')) {
    const n = parseInt(v.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  return [143, 166, 255];
}

export function createDome(canvas, options = {}) {
  const o = { count: 3200, speed: 0.07, ...options };
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let acc = accentRGB();
  window.addEventListener('accentchange', () => { acc = accentRGB(); });

  // puntos repartidos con la espiral de Fibonacci
  const pts = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < o.count; i++) {
    const y = 1 - (i / (o.count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const a = i * golden;
    pts.push({ x0: Math.cos(a) * r, y, z0: Math.sin(a) * r, big: Math.random() < 0.05, s: 0.7 + Math.random() * 0.9 });
  }

  let w = 0, h = 0;
  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const b = canvas.getBoundingClientRect();
    w = b.width; h = b.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  let px = -999, py = -999;
  const onMove = (e) => { const b = canvas.getBoundingClientRect(); px = e.clientX - b.left; py = e.clientY - b.top; };
  const onLeave = () => { px = py = -999; };

  let raf = 0, visible = true;
  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    const R = Math.min(w * 0.46, h * 1.05);
    const cx = w / 2, cy = h * 0.97 + R * 0.28;
    const spin = t * o.speed;
    const cs = Math.cos(spin), sn = Math.sin(spin);
    const front = (t * 0.32) % 1.9;           // frente de onda 1 (recorre y de 1 a -1)
    const fronts = [1 - front * 1.4, 1 - ((front + 0.95) % 1.9) * 1.4];

    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const x = p.x0 * cs - p.z0 * sn;
      const z = p.x0 * sn + p.z0 * cs;
      let g = 0;
      for (let k = 0; k < 2; k++) { const d = p.y - fronts[k]; g = Math.max(g, Math.exp(-(d * d) / 0.012)); }
      const rr = 1 + g * 0.045;
      const sx = cx + x * R * rr;
      const sy = cy - p.y * R * rr;
      if (sy > h + 4 || sy < -4) continue;

      let m = 0;
      if (px > -900) { const dx = sx - px, dy = sy - py; m = Math.exp(-(dx * dx + dy * dy) / 9000); }
      const glow = Math.min(1, g + m);

      const depth = (z + 1) / 2;                 // 0 detrás · 1 delante
      const alpha = (z > 0 ? 0.22 + depth * 0.7 : 0.05 + depth * 0.18) + glow * 0.5;
      const size = (p.big ? 2.6 : p.s * (0.6 + depth * 0.8)) * (1 + glow * 0.7);

      const t2 = Math.min(1, glow * 1.1);
      const r = Math.round(243 + (acc[0] - 243) * t2);
      const gC = Math.round(241 + (acc[1] - 241) * t2);
      const b = Math.round(246 + (acc[2] - 246) * t2);
      ctx.fillStyle = `rgba(${r},${gC},${b},${Math.min(1, alpha).toFixed(3)})`;
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
  addEventListener('resize', () => { resize(); if (reduce) draw(1.2); });
  if (reduce) {
    draw(1.2);
  } else {
    addEventListener('pointermove', onMove, { passive: true });
    canvas.addEventListener('pointerleave', onLeave);
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);
    raf = requestAnimationFrame(loop);
  }
  return () => { cancelAnimationFrame(raf); removeEventListener('pointermove', onMove); };
}
