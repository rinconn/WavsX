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
  }
  // cada línea: fase, velocidad, amplitud relativa, grosor, opacidad, mezcla con blanco
  const LINES = [
    [0.0, 1.0, 1.0, 2.2, 1.0, 0.55],
    [1.7, 0.8, 0.75, 1.4, 0.7, 0.2],
    [3.1, 1.25, 0.55, 1.2, 0.55, 0],
    [4.4, 0.6, 0.38, 1, 0.4, 0]
  ];
  const mix = (k) => `${Math.round(led[0] + (255 - led[0]) * k)},${Math.round(led[1] + (255 - led[1]) * k)},${Math.round(led[2] + (255 - led[2]) * k)}`;

  let raf = 0, visible = true, t0 = -1;
  function draw(t) {
    if (t0 < 0) t0 = t;
    const age = reduce ? 9 : t - t0;
    ctx.clearRect(0, 0, w, h);
    const mid = h * 0.55, amp = h * 0.32;
    const kick = Math.pow(Math.max(0, Math.sin(t * Math.PI * 2 * 1.02)), 10);
    const reveal = Math.min(1, age / 1.8) * w;
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineJoin = ctx.lineCap = 'round';
    for (const [ph, sp, a, lw, op, wk] of LINES) {
      ctx.beginPath();
      for (let x = 0; x <= reveal; x += 3) {
        const u = x / w;
        const env = Math.pow(Math.sin(Math.PI * u), 1.4);           // se apaga en los bordes
        const y = mid + amp * a * env * (0.75 + kick * 0.35) * (
          0.55 * Math.sin(u * 9 + t * 1.3 * sp + ph) +
          0.3 * Math.sin(u * 23 - t * 2.1 * sp + ph * 2) +
          0.15 * Math.sin(u * 51 + t * 3.4 * sp));
        x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      const col = mix(wk);
      ctx.strokeStyle = `rgba(${led.join(',')},${0.12 * op})`; ctx.lineWidth = lw * 7; ctx.stroke();   // halo
      ctx.strokeStyle = `rgba(${col},${0.95 * op})`; ctx.lineWidth = lw; ctx.stroke();             // núcleo
    }
    ctx.globalCompositeOperation = 'source-over';
  }
  function loop(ms) { if (visible) draw(ms / 1000); raf = requestAnimationFrame(loop); }
  resize();
  addEventListener('resize', () => { resize(); if (reduce) draw(9); });
  if (reduce) draw(9);
  else {
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);
    raf = requestAnimationFrame(loop);
  }
  return () => cancelAnimationFrame(raf);
}
