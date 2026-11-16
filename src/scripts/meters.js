// Puente de medidores LED, como el de una mesa de mezclas (hero).
// Canales en parejas estéreo, cada uno una columna de segmentos rectangulares:
// los apagados se ven tenues, como LEDs reales. Abajo el color de --led, arriba
// segmentos más calientes y el último en rojo. Pico que se queda un momento.
// Al cargar hacen el barrido de encendido de una consola (suben todos y bajan).

export function createMeters(canvas) {
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const readLed = () => (getComputedStyle(canvas).getPropertyValue('--led').trim() || '255, 170, 60').split(',').map(Number);
  let led = readLed();

  let w = 0, h = 0, ch = 0, pitch = 0, cw = 0, x0 = 0, segs = 0, segH = 0, base = 0, lv = [], pk = [], hold = [], seeds = [];
  const sGap = 2;
  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const b = canvas.getBoundingClientRect();
    w = b.width; h = b.height;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    led = readLed();
    ch = w < 700 ? 24 : 56;
    const total = Math.min(w * 0.92, 1320);
    pitch = total / ch; cw = pitch * 0.5; x0 = (w - total) / 2;
    segs = w < 700 ? 26 : 36;
    base = h * 0.84;
    segH = (h * 0.62 - sGap * (segs - 1)) / segs;
    lv = new Array(ch).fill(0); pk = new Array(ch).fill(0); hold = new Array(ch).fill(0);
    seeds = Array.from({ length: ch }, () => Math.random() * 6.28);
  }

  const mix = (k) => `${Math.round(led[0] + (255 - led[0]) * k)},${Math.round(led[1] + (255 - led[1]) * k)},${Math.round(led[2] + (255 - led[2]) * k)}`;
  function colorOf(s) {
    const r = s / segs;
    if (s === segs - 1) return '255,64,56';          // clip
    if (r > 0.78) return mix(0.45);                   // zona caliente
    return led.join(',');
  }

  let raf = 0, visible = true, last = 0, t0 = -1;
  function draw(t) {
    const dt = Math.min(0.05, Math.max(0, t - last)); last = t;
    if (t0 < 0) t0 = t;
    const age = reduce ? 9 : t - t0;
    ctx.clearRect(0, 0, w, h);
    const kick = Math.pow(Math.max(0, Math.sin(t * Math.PI * 2 * 1.02)), 14);   // ~122 bpm
    const snare = Math.pow(Math.max(0, Math.sin(t * Math.PI * 1.02 + 1.6)), 30);

    for (let i = 0; i < ch; i++) {
      const band = i / ch, pair = seeds[i >> 1];
      let v = 0.14 + 0.32 * (0.5 + 0.5 * Math.sin(t * (1.1 + band * 2.4) + pair)) * (1 - band * 0.35)
        + kick * (1 - band) * 0.36 + snare * band * 0.3 + (i & 1) * 0.03 + Math.random() * 0.06;
      if (age < 1.6) v = Math.sin(Math.PI * Math.min(1, age / 1.6));            // barrido de encendido
      v = Math.min(1, v);
      lv[i] = v > lv[i] ? v : Math.max(v, lv[i] - dt * 1.4);                    // sube rápido, cae despacio
      if (lv[i] >= pk[i]) { pk[i] = lv[i]; hold[i] = 0.9; }
      else if ((hold[i] -= dt) < 0) pk[i] = Math.max(lv[i], pk[i] - dt * 0.5);

      const n = Math.round(lv[i] * segs), p = Math.min(segs - 1, Math.round(pk[i] * segs) - 1);
      const x = x0 + i * pitch + (pitch - cw) / 2 + (i & 1 ? -pitch * 0.1 : pitch * 0.1);
      for (let s = 0; s < segs; s++) {
        const y = base - (s + 1) * segH - s * sGap;
        const on = s < n || s === p;
        const col = colorOf(s);
        ctx.fillStyle = `rgba(${col},${on ? 0.92 : 0.06})`;
        ctx.fillRect(x, y, cw, segH);
        if (on && s < 10) {                                                       // reflejo en la mesa
          ctx.fillStyle = `rgba(${col},${0.14 * (1 - s / 10)})`;
          ctx.fillRect(x, base + s * (segH + sGap) + 6, cw, segH);
        }
      }
      if (n > 0) {                                                               // halo
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = `rgba(${led.join(',')},0.05)`;
        ctx.fillRect(x - 4, base - n * (segH + sGap) - 4, cw + 8, n * (segH + sGap) + 4);
        ctx.globalCompositeOperation = 'source-over';
      }
    }
  }

  function loop(ms) { if (visible) draw(ms / 1000); raf = requestAnimationFrame(loop); }
  resize();
  addEventListener('resize', () => { resize(); if (reduce) draw(9); });
  addEventListener('accentchange', () => { led = readLed(); });
  if (reduce) draw(9);
  else {
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);
    raf = requestAnimationFrame(loop);
  }
  return () => cancelAnimationFrame(raf);
}
