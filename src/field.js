// Campo de vinilos: discos de partículas sobre un suelo en perspectiva.
// Modo "salvapantallas": de vez en cuando un disco se enciende con UN color,
// lanza un haz de luz hacia arriba y se apaga despacio; luego otro, con otro color.
// El disco que flota delante está en gris y también entra en el juego.

// el principal (--accent) sale la mitad de las veces; el resto acompañan
const SECONDARY = ['#C7A6FF', '#FFA8D2', '#FFD1A1', '#8FE3D0'];
const readAccent = () => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#8FA6FF';

const rgb = (hex) => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const css = (c, a) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a.toFixed(3)})`;
const GRAY = [214, 214, 222];

export function createField(canvas, options = {}) {
  const o = { horizon: 0.6, ...options };
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let accent = rgb(readAccent());
  const secondary = SECONDARY.map(rgb);
  window.addEventListener('accentchange', () => { accent = rgb(readAccent()); });

  function discTemplate(rings, density) {
    const pts = [];
    for (let k = 0; k < rings; k++) {
      const r = 0.28 + (k / (rings - 1)) * 0.72;
      const n = Math.round(10 + r * density);
      const off = Math.random() * 6.28;
      for (let j = 0; j < n; j++) pts.push({ r, k, a: off + (j / n) * 6.2832 });
    }
    return pts;
  }
  const dim = discTemplate(10, 52);
  const dimLabel = [];
  for (let k = 0; k < 3; k++) { const r = 0.08 + k * 0.07; const n = 8 + k * 6; for (let j = 0; j < n; j++) dimLabel.push({ r, a: (j / n) * 6.2832 }); }
  const front = discTemplate(26, 120);
  for (let k = 0; k < 5; k++) { const r = 0.06 + k * 0.045; const n = Math.round(8 + r * 90); for (let j = 0; j < n; j++) front.push({ r, a: (j / n) * 6.2832, label: true }); }

  const SP = 2.3, discs = [];
  for (let row = 0; row < 8; row++) {
    const z = 3.2 + row * SP;
    for (let col = -7; col <= 7; col++) {
      const x = col * SP + (row % 2 ? SP / 2 : 0);
      discs.push({ x, z, spin: Math.random() * 6.28, speed: 0.05 + Math.random() * 0.08 });
    }
  }
  const HERO = { x: 0, z: 3.2 + SP, hero: true };
  const hi = discs.findIndex((d) => Math.abs(d.x) < 0.01 && Math.abs(d.z - HERO.z) < 0.01);
  if (hi >= 0) discs.splice(hi, 1);

  // ---- luces: cuál se enciende, con qué color y cuándo ----
  const lights = [];          // { target, color, start, dur }
  let nextAt = 0.6, lastColor = -1, count = 0;
  function visibleDiscs(camX) {
    return discs.filter((d) => d.z < 15 && Math.abs(d.x - camX) < d.z * 0.9);
  }
  function spawn(t, camX) {
    count++;
    let color;
    if (count % 2 === 1) color = accent;
    else { let ci; do { ci = Math.floor(Math.random() * secondary.length); } while (ci === lastColor); lastColor = ci; color = secondary[ci]; }
    const pool = visibleDiscs(camX).filter((d) => !lights.some((l) => l.target === d));
    const target = count % 4 === 1 || !pool.length ? HERO : pool[Math.floor(Math.random() * pool.length)];
    if (lights.some((l) => l.target === target)) return;
    lights.push({ target, color, start: t, dur: 4.2 + Math.random() * 1.6 });
  }
  function level(target, t) {
    let best = 0, color = null;
    for (const l of lights) {
      if (l.target !== target) continue;
      const p = (t - l.start) / l.dur;
      if (p < 0 || p > 1) continue;
      const e = Math.sin(Math.PI * p) ** 2;          // sube suave, baja suave
      if (e > best) { best = e; color = l.color; }
    }
    return [best, color];
  }

  let w = 0, h = 0;
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const b = canvas.getBoundingClientRect();
    w = b.width; h = b.height;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  let mx = 0, tx = 0, my = 0, ty = 0;
  const onMove = (e) => { tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5; };
  let raf = 0, visible = true;

  function draw(t) {
    mx += (tx - mx) * 0.04; my += (ty - my) * 0.04;
    ctx.clearRect(0, 0, w, h);
    const f = Math.min(w, h * 1.8) * 0.62;
    const hy = h * o.horizon;
    const camH = 1.35 + my * 0.15;
    const camX = mx * 1.6;
    const R = 0.95;
    const project = (X, Y, Z) => { const s = f / Z; return [w / 2 + (X - camX) * s, hy + (camH - Y) * s, s]; };

    // programar luces
    if (!reduce) {
      for (let i = lights.length - 1; i >= 0; i--) if (t > lights[i].start + lights[i].dur) lights.splice(i, 1);
      if (t >= nextAt && lights.length < 3) { spawn(t, camX); nextAt = t + 1.5 + Math.random() * 1.2; }
    }

    // haces de luz (se pintan antes, con mezcla aditiva)
    ctx.globalCompositeOperation = 'lighter';
    const beams = discs.concat([HERO]);
    for (const d of beams) {
      const [e, c] = level(d, t);
      if (e < 0.01) continue;
      const y0 = d.hero ? 0.55 : 0;
      const [sx, sy, s] = project(d.x, y0, d.z);
      const rw = R * s * (d.hero ? 1.15 : 1);
      const top = Math.max(0, sy - h * (d.hero ? 0.75 : 0.55));
      const g = ctx.createLinearGradient(0, sy, 0, top);
      g.addColorStop(0, css(c, 0.2 * e));
      g.addColorStop(1, css(c, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(sx - rw, sy); ctx.lineTo(sx + rw, sy);
      ctx.lineTo(sx + rw * 0.35, top); ctx.lineTo(sx - rw * 0.35, top);
      ctx.closePath(); ctx.fill();
      // charco de luz en el suelo
      const [gx, gy, gs] = project(d.x, 0, d.z);
      const gr = ctx.createRadialGradient(gx, gy, 0, gx, gy, gs * 2);
      gr.addColorStop(0, css(c, 0.25 * e)); gr.addColorStop(1, css(c, 0));
      ctx.save(); ctx.translate(gx, gy); ctx.scale(1, 0.3); ctx.translate(-gx, -gy);
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(gx, gy, gs * 2, 0, 6.2832); ctx.fill(); ctx.restore();
    }
    ctx.globalCompositeOperation = 'source-over';

    // discos del suelo
    for (let i = discs.length - 1; i >= 0; i--) {
      const d = discs[i];
      const fade = Math.max(0, Math.min(1, (24 - d.z) / 18));
      if (fade <= 0) continue;
      const [e, c] = level(d, t);
      const col = e > 0 ? lerp(GRAY, c, e) : GRAY;
      const [cx0, cy0] = project(d.x, 0, d.z);
      if (cx0 < -R * f / d.z - 10 || cx0 > w + R * f / d.z + 10) continue;
      const rot = d.spin + t * (d.speed + e * 0.6);
      const bob = Math.sin(t * 0.8 + d.spin) * 0.03;
      // surcos: los de fuera un poco más tenues, como un vinilo de verdad
      let lastK = -1;
      for (const p of dim) {
        if (p.k !== lastK) { lastK = p.k; ctx.fillStyle = css(col, (0.07 + fade * 0.34) * (1 - Math.abs(p.r - 0.62) * 0.6) + e * 0.6); }
        const a = p.a + rot;
        const [sx, sy, s] = project(d.x + Math.cos(a) * p.r * R, bob, d.z + Math.sin(a) * p.r * R);
        if (sy > h + 4) continue;
        const sz = Math.max(0.7, s * 0.018 * (1 + e * 0.5));
        ctx.fillRect(sx - sz / 2, sy - sz / 2, sz, sz);
      }
      // etiqueta central
      const lab = e > 0 ? lerp([120, 120, 132], c, e) : [120, 120, 132];
      ctx.fillStyle = css(lab, 0.18 + fade * 0.3 + e * 0.5);
      for (const p of dimLabel) {
        const [sx, sy, s] = project(d.x + Math.cos(p.a + rot) * p.r * R, bob, d.z + Math.sin(p.a + rot) * p.r * R);
        const sz = Math.max(0.7, s * 0.02);
        ctx.fillRect(sx - sz / 2, sy - sz / 2, sz, sz);
      }
    }

    // disco que flota delante (gris; se enciende cuando le toca)
    const [eh, ch] = level(HERO, t);
    const lift = 0.55 + Math.sin(t * 1.1) * 0.05;
    const tilt = 0.55, ct = Math.cos(tilt), st = Math.sin(tilt);
    const rot = t * (0.35 + eh * 0.4);
    const phase = (t % (60 / 128)) / (60 / 128);
    const wf = phase * 1.2;
    for (const p of front) {
      const a = p.a + rot;
      const lx = Math.cos(a) * p.r * R * 1.15;
      const lz = Math.sin(a) * p.r * R * 1.15;
      const dw = p.r - wf;
      const wave = p.label ? 0 : Math.exp(-(dw * dw) / 0.008);
      const ly = wave * 0.06;
      const y2 = ly * ct + lz * st;
      const z2 = -ly * st + lz * ct;
      const [sx, sy, s] = project(HERO.x + lx, lift + y2, HERO.z + z2);
      const depth = 0.5 - z2 / (R * 2.3);
      let col = eh > 0 ? lerp(GRAY, ch, eh) : GRAY;
      if (p.label) col = eh > 0 ? lerp(accent, ch, eh) : accent;
      else if (wave > 0.15 && eh < 0.3) col = lerp(col, accent, Math.min(1, wave));
      const alpha = p.label ? 0.6 + eh * 0.4 : Math.min(1, 0.22 + depth * 0.5 + wave * 0.35 + eh * 0.25);
      ctx.fillStyle = css(col, alpha);
      const sz = Math.max(0.8, s * (p.label ? 0.03 : 0.022) * (1 + wave * 0.4));
      ctx.beginPath(); ctx.arc(sx, sy, sz / 2, 0, 6.2832); ctx.fill();
    }
  }

  function loop(ms) { if (visible) draw(ms / 1000); raf = requestAnimationFrame(loop); }
  resize();
  window.addEventListener('resize', resize);
  if (reduce) { draw(1); window.addEventListener('resize', () => draw(1)); }
  else {
    window.addEventListener('pointermove', onMove, { passive: true });
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);
    raf = requestAnimationFrame(loop);
  }
  return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); window.removeEventListener('pointermove', onMove); };
}
