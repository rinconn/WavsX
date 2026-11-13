// Campo de vinilos: muchos discos de partículas apagados sobre un suelo en
// perspectiva y uno solo encendido, flotando, girando y con brillo iridiscente
// (los 4 colores de la paleta). "Entre todas, tu canción."

function hexToRgb(hex) {
  const n = parseInt(hex.trim().replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function readPalette() {
  const cs = getComputedStyle(document.documentElement);
  return [1, 2, 3, 4].map((i) => {
    const v = cs.getPropertyValue(`--c${i}`).trim();
    return v.startsWith('#') ? hexToRgb(v) : [157, 180, 255];
  });
}
function mix(pal, t) {
  t = ((t % 1) + 1) % 1;                      // cíclico: c1→c2→c3→c4→c1
  const x = t * 4, i = Math.floor(x), f = x - i;
  const a = pal[i % 4], b = pal[(i + 1) % 4];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
}

export function createField(canvas, options = {}) {
  const o = { horizon: 0.5, ...options };
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let pal = readPalette();
  window.addEventListener('accentchange', () => { pal = readPalette(); });

  // plantilla de un disco apagado (pocos puntos) y del encendido (muchos)
  function discTemplate(rings, density) {
    const pts = [];
    for (let k = 0; k < rings; k++) {
      const r = 0.28 + (k / (rings - 1)) * 0.72;
      const n = Math.round(10 + r * density);
      const off = Math.random() * 6.28;
      for (let j = 0; j < n; j++) pts.push({ r, a: off + (j / n) * 6.2832 });
    }
    return pts;
  }
  const dim = discTemplate(6, 34);
  const lit = discTemplate(26, 120);
  const label = [];
  for (let k = 0; k < 5; k++) { const r = 0.06 + k * 0.045; const n = Math.round(8 + r * 90); for (let j = 0; j < n; j++) label.push({ r, a: (j / n) * 6.2832 }); }

  // rejilla de discos sobre el suelo (X lateral, Z profundidad)
  const SP = 2.3, discs = [];
  for (let row = 0; row < 9; row++) {
    const z = 3.2 + row * SP;
    for (let col = -7; col <= 7; col++) {
      const x = col * SP + (row % 2 ? SP / 2 : 0);
      discs.push({ x, z, spin: Math.random() * 6.28, speed: 0.05 + Math.random() * 0.08 });
    }
  }
  const HERO = { x: 0, z: 3.2 + 1 * SP };      // el encendido: segunda fila, centrado
  const heroIdx = discs.findIndex((d) => Math.abs(d.x - HERO.x) < 0.01 && Math.abs(d.z - HERO.z) < 0.01);
  if (heroIdx >= 0) discs.splice(heroIdx, 1);

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
    const f = Math.min(w, h * 1.8) * 0.62;      // focal
    const hy = h * o.horizon;                     // línea del horizonte
    const camH = 1.35 + my * 0.15;                // altura de cámara
    const camX = mx * 1.6;
    const R = 0.95;                               // radio de disco en el mundo

    const project = (X, Y, Z) => {
      const s = f / Z;
      return [w / 2 + (X - camX) * s, hy + (camH - Y) * s, s];
    };

    // discos apagados (de lejos a cerca)
    for (let i = discs.length - 1; i >= 0; i--) {
      const d = discs[i];
      const fade = Math.max(0, Math.min(1, (24 - d.z) / 18));
      if (fade <= 0) continue;
      const rot = d.spin + t * d.speed;
      ctx.fillStyle = `rgba(232,232,240,${(0.05 + fade * 0.28).toFixed(3)})`;
      for (const p of dim) {
        const a = p.a + rot;
        const [sx, sy, s] = project(d.x + Math.cos(a) * p.r * R, 0, d.z + Math.sin(a) * p.r * R);
        if (sx < -4 || sx > w + 4 || sy > h + 4) continue;
        const sz = Math.max(0.6, s * 0.016);
        ctx.fillRect(sx - sz / 2, sy - sz / 2, sz, sz);
      }
    }

    // reflejo de luz en el suelo bajo el disco encendido
    const [gx, gy, gs] = project(HERO.x, 0, HERO.z);
    const glowR = gs * 2.2;
    const shift = t * 0.05 + mx * 0.3;
    const gc = mix(pal, shift).map(Math.round).join(',');
    const grd = ctx.createRadialGradient(gx, gy, 0, gx, gy, glowR);
    grd.addColorStop(0, `rgba(${gc},0.22)`);
    grd.addColorStop(1, `rgba(${gc},0)`);
    ctx.fillStyle = grd;
    ctx.save(); ctx.translate(gx, gy); ctx.scale(1, 0.32); ctx.translate(-gx, -gy);
    ctx.beginPath(); ctx.arc(gx, gy, glowR, 0, 6.2832); ctx.fill(); ctx.restore();

    // disco encendido: flota, gira, inclinado hacia la cámara, onda a 128 BPM
    const lift = 0.55 + Math.sin(t * 1.1) * 0.05;
    const tilt = 0.55;                            // inclinación hacia nosotros
    const ct = Math.cos(tilt), st = Math.sin(tilt);
    const rot = t * 0.45;
    const phase = (t % (60 / 128)) / (60 / 128);
    const front = phase * 1.2;
    const all = lit.concat(label.map((p) => ({ ...p, label: true })));
    for (const p of all) {
      const a = p.a + rot;
      let lx = Math.cos(a) * p.r * R * 1.15;
      let lz = Math.sin(a) * p.r * R * 1.15;
      const dw = p.r - front;
      const wave = p.label ? 0 : Math.exp(-(dw * dw) / 0.008);
      let ly = wave * 0.07;
      // inclinar el disco (giro sobre el eje X)
      const y2 = ly * ct + lz * st;
      const z2 = -ly * st + lz * ct;
      const [sx, sy, s] = project(HERO.x + lx, lift + y2, HERO.z + z2);
      const depth = 0.5 - z2 / (R * 2.3);         // más brillo delante
      // color iridiscente: depende del ángulo del punto + el giro + el ratón
      const c = mix(pal, (a / 6.2832) * 0.9 + p.r * 0.35 + shift);
      const alpha = p.label ? 0.95 : Math.min(1, 0.3 + depth * 0.55 + wave * 0.5);
      ctx.fillStyle = `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${alpha.toFixed(3)})`;
      const sz = Math.max(0.8, s * (p.label ? 0.03 : 0.022) * (1 + wave * 0.5));
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
