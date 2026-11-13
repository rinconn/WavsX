// Esfera de partículas en <canvas>. Gira despacio, sigue un poco al ratón
// y "late" al tempo indicado (por defecto 128 BPM).

export function createSphere(canvas, options = {}) {
  const o = {
    count: 1600,
    color: '14,14,14',
    radius: 0.42,      // fracción del lado menor
    centerY: 0.6,      // fracción del alto
    bpm: 128,
    ...options
  };

  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // puntos repartidos uniformemente (espiral de Fibonacci)
  const pts = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < o.count; i++) {
    const y = 1 - (i / (o.count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = golden * i;
    pts.push({ x: Math.cos(th) * r, y, z: Math.sin(th) * r, big: Math.random() < 0.05 ? 1.9 : 1, seed: Math.random() * 6.28 });
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

    const R = Math.min(w, h * 1.5) * o.radius;
    const cx = w / 2, cy = h * o.centerY;
    const phase = (t % beat) / beat;
    const kick = Math.exp(-phase * 7) * 0.03;           // golpe en cada pulso
    const ry = t * 0.1 + mx * 0.9;
    const rx = -0.32 + my * 0.35;
    const cY = Math.cos(ry), sY = Math.sin(ry), cX = Math.cos(rx), sX = Math.sin(rx);

    for (const p of pts) {
      let x = p.x * cY + p.z * sY;
      let z = -p.x * sY + p.z * cY;
      const y = p.y * cX - z * sX;
      z = p.y * sX + z * cX;

      const wobble = 1 + 0.022 * Math.sin(t * 1.5 + p.y * 5 + p.seed * 0.4) + kick * (0.6 + 0.4 * Math.sin(p.seed));
      const persp = 1 + z * 0.12;
      const sx = cx + x * R * wobble * persp;
      const sy = cy + y * R * wobble * persp;
      if (sx < -10 || sx > w + 10 || sy < -10 || sy > h + 10) continue;

      const d = (z + 1) / 2;                              // 0 detrás · 1 delante
      const size = (0.45 + d * d * 2.3) * p.big;
      ctx.fillStyle = `rgba(${o.color},${(0.12 + d * 0.88).toFixed(3)})`;
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
    draw(0);
    window.addEventListener('resize', () => draw(0));
  } else {
    window.addEventListener('pointermove', onMove, { passive: true });
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(canvas);
    raf = requestAnimationFrame(loop);
  }

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    window.removeEventListener('pointermove', onMove);
  };
}
