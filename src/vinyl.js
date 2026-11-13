// Vinilo de partículas en <canvas>.
// Anillos de puntos inclinados que giran. En reposo late suave a 128 BPM.
// Con audio (synth) gira como un plato, cada anillo sube con su frecuencia
// (graves en el centro, agudos fuera) y el bombo lanza una onda de neón.

function readAccent() {
  const v = getComputedStyle(document.documentElement).getPropertyValue('--accent-rgb').trim();
  return v || '198, 255, 61';
}

export function createVinyl(canvas, options = {}) {
  const o = {
    rings: 42,
    color: '242, 242, 245',
    size: 0.46,
    cx: 0.5,
    cy: 0.55,
    tilt: 1.02,
    bpm: 128,
    follow: true,     // seguir al ratón
    ...options
  };

  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let accent = readAccent();
  const onAccent = () => { accent = readAccent(); };
  window.addEventListener('accentchange', onAccent);

  const pts = [];
  for (let k = 0; k < o.rings; k++) {
    const r = 0.24 + (k / (o.rings - 1)) * 0.76;
    const n = Math.round(24 + r * 150);
    const off = Math.random() * Math.PI * 2;
    for (let j = 0; j < n; j++) {
      pts.push({ r, k, a: off + (j / n) * Math.PI * 2, jitter: (Math.random() - 0.5) * 0.006, big: Math.random() < 0.035 });
    }
  }
  for (let k = 0; k < 7; k++) {
    const r = 0.05 + k * 0.022;
    const n = Math.round(10 + r * 120);
    for (let j = 0; j < n; j++) pts.push({ r, k: -1, a: (j / n) * Math.PI * 2, label: true, jitter: 0 });
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
  let audio = null;
  let angle = 0, speed = 0.12, last = 0, energy = 0;
  const ringLevel = new Float32Array(o.rings);
  let raf = 0, visible = true;

  function draw(t) {
    const dt = Math.min(0.05, last ? t - last : 0.016);
    last = t;
    if (o.follow) { mx += (tx - mx) * 0.04; my += (ty - my) * 0.04; }

    // datos de audio
    const lv = audio && audio.levels();
    const ap = audio && audio.beatPhase();
    const live = !!lv;
    speed += ((live ? 0.9 : 0.12) - speed) * 0.025;   // arranca/frena como un plato
    angle += speed * dt;

    let bassNow = 0;
    if (live) {
      for (let k = 0; k < o.rings; k++) {
        const bin = Math.min(100, Math.floor(1 + Math.pow(k / o.rings, 1.6) * 90));
        const v = lv[bin] / 255;
        ringLevel[k] += (v * v - ringLevel[k]) * 0.35;
      }
      bassNow = (lv[1] + lv[2] + lv[3]) / 765;
    } else {
      for (let k = 0; k < o.rings; k++) ringLevel[k] *= 0.92;
    }
    energy += ((live ? bassNow : 0) - energy) * 0.2;

    ctx.clearRect(0, 0, w, h);
    const R = Math.min(w, h * 1.6) * o.size * (1 + energy * 0.04);
    const cx = w * o.cx + mx * 30, cy = h * o.cy + my * 20;
    const tilt = o.tilt + my * 0.25;
    const cT = Math.cos(tilt), sT = Math.sin(tilt);
    const yaw = mx * 0.35, cY = Math.cos(yaw), sY = Math.sin(yaw);

    const phase = ap !== null && ap !== undefined ? ap : (t % beat) / beat;
    const fronts = [phase * 1.25, (phase + 1) * 1.25];
    const waveAmp = live ? 0.11 : 0.05;

    for (const p of pts) {
      const a = p.a + angle;
      const r = p.r + p.jitter;
      const x = r * Math.cos(a);
      const z = r * Math.sin(a);

      let lift = 0, glow = 0;
      for (const f of fronts) {
        const d = r - f;
        const g = Math.exp(-(d * d) / 0.006);
        lift += g * waveAmp * (1.3 - f * 0.6);
        glow = Math.max(glow, g * (1.25 - f * 0.55));
      }
      const lvl = p.k >= 0 ? ringLevel[p.k] : 0;
      lift += lvl * 0.14 * (0.6 + 0.4 * Math.sin(a * 3 + t * 2));
      glow = Math.max(glow, lvl * 0.9);
      const y = lift + 0.012 * Math.sin(t * 1.4 + r * 9);

      const x2 = x * cY - z * sY;
      const z2 = x * sY + z * cY;
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
        ctx.fillStyle = `rgba(${accent},${(0.55 + depth * 0.45).toFixed(3)})`;
        size *= 1 + energy * 0.5;
      } else if (glow > 0.08) {
        ctx.fillStyle = `rgba(${accent},${Math.min(1, base + glow).toFixed(3)})`;
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
    window.addEventListener('accentchange', () => draw(0.2));
  } else {
    if (o.follow) window.addEventListener('pointermove', onMove, { passive: true });
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);
    raf = requestAnimationFrame(loop);
  }

  return {
    setAudio(a) { audio = a; },
    destroy() {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('accentchange', onAccent);
    }
  };
}
