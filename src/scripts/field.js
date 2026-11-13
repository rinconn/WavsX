// Campo de vinilos (hero).
// Discos de partículas sobre un suelo en perspectiva. Cada pocos segundos uno se
// enciende con un color: lanza un haz de luz, le salen un ecualizador y notas
// musicales, y su portada sube flotando por el haz con el título. Luego se apaga.

import { SONGS, STATES } from './data.js';

const SECONDARY = ['#C7A6FF', '#FFA8D2', '#FFD1A1', '#8FE3D0'];
const readAccent = () => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#8FA6FF';
const rgb = (hex) => { const n = parseInt(hex.replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const css = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${Math.max(0, Math.min(1, a)).toFixed(3)})`;
const GRAY = [214, 214, 222];
const LABEL_GRAY = [120, 120, 132];
const GLYPHS = ['♪', '♫', '♩', '♬'];
const TITLES = SONGS.map((s) => ({ title: s.title, state: STATES[s.state].name }));

export function createField(canvas, options = {}) {
  const o = { horizon: 0.6, ...options };
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let accent = rgb(readAccent());
  const secondary = SECONDARY.map(rgb);
  window.addEventListener('accentchange', () => { accent = rgb(readAccent()); });
  const font = getComputedStyle(document.body).fontFamily;

  // plantillas de disco: puntos agrupados por surco (k) para pintar por lotes
  function template(rings, density, inner = 0.28) {
    const pts = [];
    for (let k = 0; k < rings; k++) {
      const r = inner + (k / (rings - 1)) * (1 - inner);
      const n = Math.round(10 + r * density);
      const off = Math.random() * 6.28;
      for (let j = 0; j < n; j++) pts.push({ r, k, a: off + (j / n) * 6.2832 });
    }
    return pts;
  }
  const dim = template(10, 52);
  const dimLabel = template(3, 14, 0.08).map((p) => ({ ...p, r: p.r * 0.24 }));
  const front = template(20, 110);
  const frontLabel = template(5, 60, 0.2).map((p) => ({ ...p, r: p.r * 0.24 }));

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

  /* ---------- luces ---------- */
  const lights = [];   // { target, color, start, dur, song, noteAcc }
  const notes = [];    // { x, y, vx, vy, born, life, color, glyph, size }
  let nextAt = 0.8, lastColor = -1, count = 0, songIdx = Math.floor(Math.random() * TITLES.length);
  function spawn(t, camX) {
    count++;
    let color;
    if (count % 2 === 1) color = accent;
    else { let ci; do { ci = Math.floor(Math.random() * secondary.length); } while (ci === lastColor); lastColor = ci; color = secondary[ci]; }
    const pool = discs.filter((d) => d.z < 12 && Math.abs(d.x - camX) < d.z * 0.75 && !lights.some((l) => l.target === d));
    const target = count % 3 === 1 || !pool.length ? HERO : pool[Math.floor(Math.random() * pool.length)];
    if (lights.some((l) => l.target === target)) return;
    songIdx = (songIdx + 1) % TITLES.length;
    lights.push({ target, color, start: t, dur: 5 + Math.random() * 1.5, song: TITLES[songIdx], noteAcc: 0 });
  }
  const env = (l, t) => { const p = (t - l.start) / l.dur; return p < 0 || p > 1 ? 0 : Math.sin(Math.PI * p) ** 2; };
  function level(target, t) {
    for (const l of lights) if (l.target === target) { const e = env(l, t); if (e > 0) return [e, l.color]; }
    return [0, null];
  }

  /* ---------- tamaño ---------- */
  let w = 0, h = 0;
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const b = canvas.getBoundingClientRect();
    w = b.width; h = b.height;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // movimiento de cámara mínimo y suavizado por tiempo (sin sacudidas)
  let mx = 0, my = 0, tx = 0, ty = 0, last = 0;
  const onMove = (e) => { tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5; };
  let raf = 0, visible = true;

  function roundRect(x, y, ww, hh, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + ww, y, x + ww, y + hh, r); ctx.arcTo(x + ww, y + hh, x, y + hh, r);
    ctx.arcTo(x, y + hh, x, y, r); ctx.arcTo(x, y, x + ww, y, r); ctx.closePath();
  }

  function draw(t) {
    const dt = last ? Math.min(0.05, t - last) : 0.016;
    last = t;
    const k = 1 - Math.exp(-dt * 2.5);
    mx += (tx - mx) * k; my += (ty - my) * k;

    ctx.clearRect(0, 0, w, h);
    const f = Math.min(w, h * 1.8) * 0.62;
    const hy = h * o.horizon;
    const camH = 1.35 + my * 0.06;
    const camX = mx * 0.3;
    const R = 0.95;
    const project = (X, Y, Z) => { const s = f / Z; return [w / 2 + (X - camX) * s, hy + (camH - Y) * s, s]; };

    if (!reduce) {
      for (let i = lights.length - 1; i >= 0; i--) if (t > lights[i].start + lights[i].dur) lights.splice(i, 1);
      if (t >= nextAt && lights.length < 3) { spawn(t, camX); nextAt = t + 1.6 + Math.random() * 1.2; }
    }

    // posición en pantalla de cada luz (para haces, portada, ecualizador y notas)
    const lift = 0.55 + Math.sin(t * 1.1) * 0.05;
    const active = lights.map((l) => {
      const d = l.target;
      const [sx, sy, s] = project(d.x, d.hero ? lift : 0, d.z);
      return { l, e: env(l, t), sx, sy, s, rw: R * s * (d.hero ? 1.15 : 1), hero: !!d.hero };
    }).filter((a) => a.e > 0.005);

    /* haces de luz + charco en el suelo (aditivo) */
    ctx.globalCompositeOperation = 'lighter';
    for (const a of active) {
      const c = a.l.color;
      const top = Math.max(0, a.sy - h * (a.hero ? 0.75 : 0.55));
      const g = ctx.createLinearGradient(0, a.sy, 0, top);
      g.addColorStop(0, css(c, 0.2 * a.e)); g.addColorStop(1, css(c, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(a.sx - a.rw, a.sy); ctx.lineTo(a.sx + a.rw, a.sy);
      ctx.lineTo(a.sx + a.rw * 0.35, top); ctx.lineTo(a.sx - a.rw * 0.35, top);
      ctx.closePath(); ctx.fill();
      const [gx, gy, gs] = project(a.l.target.x, 0, a.l.target.z);
      const gr = ctx.createRadialGradient(gx, gy, 0, gx, gy, gs * 2);
      gr.addColorStop(0, css(c, 0.25 * a.e)); gr.addColorStop(1, css(c, 0));
      ctx.save(); ctx.translate(gx, gy); ctx.scale(1, 0.3); ctx.translate(-gx, -gy);
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(gx, gy, gs * 2, 0, 6.2832); ctx.fill(); ctx.restore();
    }
    ctx.globalCompositeOperation = 'source-over';

    /* discos del suelo (lote por surco: un fillStyle por surco) */
    for (let i = discs.length - 1; i >= 0; i--) {
      const d = discs[i];
      const fade = Math.max(0, Math.min(1, (24 - d.z) / 18));
      const [cx0] = project(d.x, 0, d.z);
      const span = R * f / d.z + 10;
      if (fade <= 0 || cx0 < -span || cx0 > w + span) continue;
      const [e, c] = level(d, t);
      const col = e > 0 ? lerp(GRAY, c, e) : GRAY;
      const rot = d.spin + t * (d.speed + e * 0.6);
      const bob = Math.sin(t * 0.8 + d.spin) * 0.03;
      let lastK = -1;
      for (const p of dim) {
        if (p.k !== lastK) { lastK = p.k; ctx.fillStyle = css(col, (0.07 + fade * 0.34) * (1 - Math.abs(p.r - 0.62) * 0.6) + e * 0.6); }
        const a = p.a + rot;
        const [sx, sy, s] = project(d.x + Math.cos(a) * p.r * R, bob, d.z + Math.sin(a) * p.r * R);
        const sz = Math.max(0.7, s * 0.018 * (1 + e * 0.5));
        ctx.fillRect(sx - sz / 2, sy - sz / 2, sz, sz);
      }
      ctx.fillStyle = css(e > 0 ? lerp(LABEL_GRAY, c, e) : LABEL_GRAY, 0.18 + fade * 0.3 + e * 0.5);
      for (const p of dimLabel) {
        const [sx, sy, s] = project(d.x + Math.cos(p.a + rot) * p.r * R, bob, d.z + Math.sin(p.a + rot) * p.r * R);
        const sz = Math.max(0.7, s * 0.02);
        ctx.fillRect(sx - sz / 2, sy - sz / 2, sz, sz);
      }
    }

    /* disco delantero (lote por surco + globalAlpha por profundidad) */
    const [eh, ch] = level(HERO, t);
    const tilt = 0.55, ct = Math.cos(tilt), st = Math.sin(tilt);
    const rot = t * (0.35 + eh * 0.4);
    const wf = ((t % (60 / 128)) / (60 / 128)) * 1.2;
    const base = eh > 0 ? lerp(GRAY, ch, eh) : GRAY;
    const drawFront = (pts, isLabel) => {
      let lastK = -1, wave = 0;
      for (const p of pts) {
        if (p.k !== lastK) {
          lastK = p.k;
          const dw = p.r - wf;
          wave = isLabel ? 0 : Math.exp(-(dw * dw) / 0.008);
          let col = base;
          if (isLabel) col = eh > 0 ? lerp(accent, ch, eh) : accent;
          else if (wave > 0.15 && eh < 0.3) col = lerp(base, accent, Math.min(1, wave));
          ctx.fillStyle = css(col);
        }
        const a = p.a + rot;
        const lx = Math.cos(a) * p.r * R * 1.15;
        const lz = Math.sin(a) * p.r * R * 1.15;
        const ly = wave * 0.06;
        const y2 = ly * ct + lz * st;
        const z2 = -ly * st + lz * ct;
        const [sx, sy, s] = project(HERO.x + lx, lift + y2, HERO.z + z2);
        const depth = 0.5 - z2 / (R * 2.3);
        ctx.globalAlpha = isLabel ? 0.6 + eh * 0.4 : Math.min(1, 0.22 + depth * 0.5 + wave * 0.35 + eh * 0.25);
        const sz = Math.max(1, s * (isLabel ? 0.026 : 0.02) * (1 + wave * 0.4));
        ctx.fillRect(sx - sz / 2, sy - sz / 2, sz, sz);
      }
      ctx.globalAlpha = 1;
    };
    drawFront(front, false);
    drawFront(frontLabel, true);

    /* ecualizador, notas y portada de cada disco encendido */
    for (const a of active) {
      const c = a.l.color;
      const p = (t - a.l.start) / a.l.dur;
      const unit = Math.max(0.5, Math.min(1.6, a.s / 160));       // escala según cercanía

      // ecualizador encima del disco
      const bars = 9, bw = 5 * unit, gap = 3 * unit;
      const eqY = a.sy - (a.hero ? a.rw * 0.55 : 6 * unit);
      const x0 = a.sx - (bars * bw + (bars - 1) * gap) / 2;
      ctx.fillStyle = css(c, 0.85 * a.e);
      for (let i = 0; i < bars; i++) {
        const v = 0.25 + 0.75 * Math.abs(Math.sin(t * 6 + i * 1.7) * Math.cos(t * 3.3 + i * 0.9));
        const bh = v * 34 * unit * a.e;
        ctx.fillRect(x0 + i * (bw + gap), eqY - bh, bw, bh);
      }

      // notas que suben por el haz
      a.l.noteAcc += dt * 5 * a.e;
      while (a.l.noteAcc > 1) {
        a.l.noteAcc -= 1;
        notes.push({
          x: a.sx + (Math.random() - 0.5) * a.rw * 1.2, y: eqY - 10 * unit,
          vx: (Math.random() - 0.5) * 14, vy: -(30 + Math.random() * 30) * unit,
          born: t, life: 2 + Math.random(), color: c,
          glyph: GLYPHS[(Math.random() * GLYPHS.length) | 0], size: (14 + Math.random() * 8) * unit
        });
      }

      // portada que sube por el haz con el título
      if (a.hero || a.s > 70) {
        const size = Math.min(96, Math.max(46, a.s * 0.42)) * (a.hero ? 1.15 : 1);
        const rise = (a.hero ? h * 0.42 : h * 0.3) * (0.15 + p * 0.85);
        const cx = a.sx, cy = eqY - 40 * unit - rise;
        ctx.save();
        ctx.globalAlpha = a.e;
        ctx.translate(cx, cy);
        ctx.rotate(Math.sin(t * 1.2 + a.l.start) * 0.04);
        roundRect(-size / 2, -size / 2, size, size, size * 0.12);
        ctx.fillStyle = css(c); ctx.fill();
        ctx.save(); ctx.clip();
        ctx.fillStyle = 'rgba(9,9,11,0.92)';
        ctx.beginPath(); ctx.arc(-size * 0.14, -size * 0.1, size * 0.27, 0, 6.2832); ctx.fill();
        ctx.fillStyle = 'rgba(9,9,11,0.35)';
        ctx.fillRect(-size / 2, size * 0.18, size, size * 0.32);
        ctx.restore();
        ctx.fillStyle = 'rgba(243,241,246,0.95)';
        ctx.font = `700 ${Math.round(size * 0.15)}px ${font}`;
        ctx.textAlign = 'center';
        ctx.fillText(a.l.song.title, 0, size / 2 + size * 0.22);
        ctx.fillStyle = css(c, 0.95);
        ctx.font = `600 ${Math.round(size * 0.12)}px ${font}`;
        ctx.fillText(a.l.song.state, 0, size / 2 + size * 0.38);
        ctx.restore();
      }
    }

    // mover y pintar notas
    ctx.textAlign = 'center';
    for (let i = notes.length - 1; i >= 0; i--) {
      const n = notes[i];
      const age = (t - n.born) / n.life;
      if (age >= 1) { notes.splice(i, 1); continue; }
      n.x += (n.vx + Math.sin((t + n.born) * 3) * 10) * dt;
      n.y += n.vy * dt;
      ctx.fillStyle = css(n.color, Math.sin(Math.PI * age) * 0.9);
      ctx.font = `600 ${Math.round(n.size)}px ${font}`;
      ctx.fillText(n.glyph, n.x, n.y);
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
