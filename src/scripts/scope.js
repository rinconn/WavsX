// Onda de osciloscopio del hero: varias líneas finas y luminosas en el color
// de --led que se cruzan y respiran con un pulso de ~122 bpm. Al cargar se
// dibujan de izquierda a derecha, como una señal que entra.

export function createScope(canvas) {
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const readLed = () => (getComputedStyle(canvas).getPropertyValue('--led').trim() || '168, 112, 255').split(',').map(Number);
  let led = readLed();
  let w = 0, h = 0;
  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const b = canvas.getBoundingClientRect();
    w = b.width; h = b.height;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    led = readLed();
    main = new Float32Array(Math.ceil(w / 4) + 2);
  }
  // cada línea: fase, velocidad, amplitud relativa, grosor, opacidad, mezcla con blanco
  const LINES = [
    [0.0, 1.0, 1.0, 2.2, 1.0, 0.55],
    [1.7, 0.8, 0.75, 1.4, 0.7, 0.2],
    [3.1, 1.25, 0.55, 1.2, 0.55, 0],
    [4.4, 0.6, 0.38, 1, 0.4, 0]
  ];
  const mix = (k) => `${Math.round(led[0] + (255 - led[0]) * k)},${Math.round(led[1] + (255 - led[1]) * k)},${Math.round(led[2] + (255 - led[2]) * k)}`;

  let raf = 0, visible = true, t0 = -1, main = new Float32Array(1);
  function draw(t) {
    if (t0 < 0) t0 = t;
    const age = reduce ? 9 : t - t0;
    ctx.clearRect(0, 0, w, h);
    const mid = h * 0.55, amp = h * 0.32;
    // la onda va "tocando" una canción que nunca se repite igual:
    // energía por secciones (estrofa tranquila / subidón), frecuencias que derivan,
    // corcheas en las partes fuertes y un silencio antes del golpe cada 16 tiempos
    const beat = t * 1.02, bi = Math.floor(beat), bf = beat - bi;
    const energy = Math.min(1, Math.max(0.15, 0.6 + 0.4 * Math.sin(t * 0.19) * Math.sin(t * 0.071 + 1.3) + 0.25 * Math.sin(t * 0.43)));
    const pulse = (f) => Math.exp(-f * 9);
    const gap = bi % 16 === 15;                                     // se corta antes del golpe
    const drop = bi % 16 === 0 ? 1.6 : 1;                           // y vuelve con más fuerza
    let kick = gap ? 0 : pulse(bf) * drop;
    if (energy > 0.7 && !gap) kick = Math.max(kick, pulse((bf + 0.5) % 1) * 0.6);   // corcheas
    if (bi % 8 === 6 && bf > 0.75) kick = Math.max(kick, pulse(bf - 0.75) * 0.8);  // contratiempo
    const lvl = (gap ? 0.25 + 0.75 * (1 - bf) * 0.3 : 1) * (0.45 + energy * 0.75);
    const f1 = 9 + 4 * Math.sin(t * 0.13), f2 = 23 + 9 * Math.sin(t * 0.09 + 2), f3 = 51 + 22 * Math.sin(t * 0.053);
    const center = 0.5 + 0.22 * Math.sin(t * 0.11);
    const reveal = Math.min(1, age / 1.8) * w;
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineJoin = ctx.lineCap = 'round';
    const STEP = 4, n = Math.floor(reveal / STEP) + 1;
    LINES.forEach(([ph, sp, a, lw, op, wk], li) => {
      const ys = li === 0 ? main : null;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const x = i * STEP, u = x / w;
        const env = Math.pow(Math.sin(Math.PI * u), 1.4) * (0.55 + 0.45 * Math.exp(-((u - center) ** 2) * 9));   // bordes apagados, el pico se pasea
        const y = mid + amp * a * env * lvl * (0.7 + kick * 0.6) * (
          0.55 * Math.sin(u * f1 + t * 1.3 * sp + ph) +
          0.3 * Math.sin(u * f2 - t * 2.1 * sp + ph * 2) +
          0.15 * energy * Math.sin(u * f3 + t * 3.4 * sp) +
          kick * 0.12 * Math.sin(u * 160 + t * 47 + ph));          // chisporroteo eléctrico en cada golpe
        if (ys) ys[i] = y;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      const col = mix(wk);
      ctx.strokeStyle = `rgba(${led.join(',')},${(0.12 + Math.min(kick, 1.2) * 0.22) * op})`; ctx.lineWidth = lw * (7 + Math.min(kick, 1.2) * 6); ctx.stroke();   // halo que se abre con el golpe
      ctx.strokeStyle = `rgba(${col},${0.95 * op})`; ctx.lineWidth = lw; ctx.stroke();                                        // núcleo
    });
    // destellos que viajan por la línea principal, como señal que pasa
    if (age > 1.8) for (let k = 0; k < 3; k++) {
      const c = ((t * (0.18 + k * 0.05) + k / 3) % 1) * w, len = 90;
      const i0 = Math.max(1, Math.floor((c - len) / STEP)), i1 = Math.min(n - 1, Math.ceil((c + len) / STEP));
      if (i1 <= i0) continue;
      const g = ctx.createLinearGradient(c - len, 0, c + len, 0);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,.95)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath(); ctx.moveTo(i0 * STEP, main[i0]);
      for (let i = i0 + 1; i <= i1; i++) ctx.lineTo(i * STEP, main[i]);
      ctx.strokeStyle = `rgba(${led.join(',')},.35)`; ctx.lineWidth = 10; ctx.stroke();
      ctx.strokeStyle = g; ctx.lineWidth = 2.6; ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
  }
  function loop(ms) { draw(ms / 1000); raf = visible ? requestAnimationFrame(loop) : 0; }
  resize();
  addEventListener('resize', () => { resize(); if (reduce) draw(9); });
  if (reduce) draw(9);
  else {
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(loop); }).observe(canvas);
    raf = requestAnimationFrame(loop);
  }
  return () => cancelAnimationFrame(raf);
}
