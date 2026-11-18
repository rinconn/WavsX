import { createField } from './field.js';
import { createDome } from './dome.js';
import { createScope } from './scope.js';
import { icon, sticker } from './icons.js';
import { waveHeights, renderWave } from './data.js';
import { smoothScroll } from './smooth.js';

const smooth = smoothScroll();

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const wide = window.matchMedia('(min-width: 901px)').matches;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* iconos propios en todos los [data-icon] */
$$('[data-icon]').forEach((el) => {
  el.innerHTML = icon(el.dataset.icon, 20);
});

/* ---------- 1 · hero: campo de vinilos ---------- */
// por defecto: ecualizador (d). Otras opciones: ?hero=a (vinilos), b (producto), c (cúpula)
const heroOpt = new URLSearchParams(location.search).get('hero') || 'd';
if (heroOpt === 'c' || heroOpt === 'd') {
  $('.hero').hidden = true;
  $('.heroC').hidden = false;
  if (heroOpt === 'c') { $('#wavefield').remove(); createDome($('#dome')); }
  else { $('#dome').remove(); createScope($('#wavefield')); }
  if ($('#heroC-wave')) renderWave($('#heroC-wave'), waveHeights(2.4, 90, 64), 0.42);
} else if (heroOpt === 'b') {
  $('.hero').hidden = true;
  $('.heroB').hidden = false;
  renderWave($('#heroB-wave'), waveHeights(2.4, 90, 88), 0.42);
} else {
  createField($('#field'), { horizon: wide ? 0.6 : 0.62 });
}

// subtítulo palabra a palabra
$$('[data-words]').forEach((el) => {
  const text = el.textContent.trim();
  el.setAttribute('aria-label', text);
  el.innerHTML = text.split(/\s+/)
    .map((w, i) => `<span class="w" aria-hidden="true" style="animation-delay:${0.5 + i * 0.045}s">${w} </span>`)
    .join('');
});

/* ---------- carrusel: se enciende lo que pasa bajo la cabeza de reproducción ---------- */
const mq = $('.marquee');
if (mq) {
  const io2 = new IntersectionObserver((entries) => {
    entries.forEach((e) => e.target.classList.toggle('on', e.isIntersecting));
  }, { root: mq, rootMargin: '0px -49% 0px -49%' });
  mq.querySelectorAll('.marquee__item').forEach((el) => io2.observe(el));
}

/* ---------- 2 · mesa: pestañas y paneles con vida (solo se anima el panel visible) ---------- */
const tabs = $$('.desk__tab'), panes = $$('.pane');
let cur = 0;
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const select = (i) => {
  cur = i;
  tabs.forEach((x, k) => x.classList.toggle('on', k === i));
  panes.forEach((p, k) => p.classList.toggle('on', k === i));
  lt0 = 0; tlI = -1; lyI = -1;
  if (i === 4) rsign();
};
tabs.forEach((t, i) => t.addEventListener('click', () => select(i)));

/* audio: espectrograma que desfila */
const spec = $('.spec');
let off = null;
if (spec) {
  const W = spec.width, H = spec.height, cw = 3, rh = 4;
  off = document.createElement('canvas'); off.width = W * 2; off.height = H;
  const g = off.getContext('2d');
  const n = (x, y) => { const v = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453; return v - Math.floor(v); };
  for (let x = 0; x < W * 2; x += cw) {
    const t = x / (W * 2), beat = Math.pow(Math.abs(Math.sin(t * Math.PI * 2 * 20)), 6);
    for (let y = 0; y < H; y += rh) {
      const f = 1 - y / H;
      let e = Math.exp(-f * 3.4) * (0.22 + 0.3 * beat) + n(x, y) * 0.2 * Math.exp(-f * 1.6);
      e += Math.exp(-Math.pow((f - (0.2 + 0.1 * Math.sin(t * Math.PI * 2 * 4))) * 14, 2)) * 0.3;
      e += Math.exp(-Math.pow((f - 0.62) * 22, 2)) * 0.25 * Math.abs(Math.sin(t * Math.PI * 2 * 10));
      g.fillStyle = `rgba(198,255,61,${Math.min(1, Math.max(0, (e - 0.14) * 1.15)).toFixed(2)})`;
      g.fillRect(x, y, cw, rh);
    }
  }
}

/* stems: vúmetros de segmentos, M/S que funcionan */
const strips = $$('.chan li');
const SEG = 18, lv = strips.map(() => 0), seg = [];
strips.forEach((li, k) => {
  const m = li.querySelector('.meter');
  m.innerHTML = '<i></i>'.repeat(SEG);
  seg.push([...m.children]);
  li.querySelector('.m').addEventListener('click', (e) => { e.currentTarget.classList.toggle('on'); mixState(); });
  li.querySelector('.s').addEventListener('click', (e) => { e.currentTarget.classList.toggle('on'); mixState(); });
});
function mixState() {
  const solo = strips.some((li) => li.querySelector('.s').classList.contains('on'));
  strips.forEach((li) => {
    const m = li.querySelector('.m').classList.contains('on'), s = li.querySelector('.s').classList.contains('on');
    li.classList.toggle('off', m || (solo && !s));
  });
}
mixState();

$$('.st__play').forEach((b) => b.addEventListener('click', () => { const r = b.closest('.st'); $$('.st').forEach((x) => x.classList.toggle('on', x === r && !r.classList.contains('on'))); }));

/* portadas: cambian dentro de la app */
const cv = $('#cv'), cms = $$('.app__cover .m'), cvt = $('.app__cover .tag');
const CT = ['Foto', 'GIF · bucle', 'Vídeo · 0:08'];
const phv = $('.phone video'), stg = $('.stage');
const CAP = [['Foto · JPG o PNG', 'Hasta 3000 × 3000 px. Se ve igual de nítida en grande que en la lista.'], ['GIF · en bucle', 'Hasta 15 MB. Se mueve en la ficha de la canción y en las miniaturas.'], ['Vídeo · MP4 vertical 9:16', 'Pensado para stories y Reels. De 5 a 15 s, sin sonido y en bucle.']];
let covI = 0, covLast = 0, covLock = 0, playing = true;
const setCov = (n) => {
  covI = n; cv.dataset.k = n; stg.dataset.k = n; if (phv) { if (n === 2 && playing && !still) phv.play().catch(() => {}); else phv.pause(); } cvt.textContent = CT[n];
  cms.forEach((m, k) => m.classList.toggle('on', k === n));
  cms.forEach((m, k) => { if (m.tagName === 'VIDEO') { if (k === n && playing) m.play().catch(() => {}); else m.pause(); } });
  $$('.pane[data-i="2"] .amb__m').forEach((m, k) => { m.classList.toggle('on', k === n); if (m.tagName === 'VIDEO') { if (k === n && playing) m.play().catch(() => {}); else m.pause(); } });
  const bg = cms[n].tagName === 'VIDEO' ? `url(${cms[n].poster})` : getComputedStyle(cms[n]).backgroundImage;
  stg.style.setProperty('--lab', bg);
  const cp = $('#cap'); if (cp) cp.innerHTML = `<b>${CAP[n][0]}</b><span>${CAP[n][1]}</span>`; $$('.mini').forEach((m) => { m.style.backgroundImage = bg; });
  $$('.v').forEach((x, k) => x.classList.toggle('on', k === n));
  if (cv.animate && !still) cms[n].animate([{ opacity: 0, scale: '1.08' }, { opacity: 1, scale: '1' }], { duration: 550, easing: 'cubic-bezier(.2,.8,.2,1)' });
};
if (!still) {
  cv.addEventListener('pointermove', (e) => { const r = cv.getBoundingClientRect(); cv.style.setProperty('--ry', ((e.clientX - r.left) / r.width - .5) * 14 + 'deg'); cv.style.setProperty('--rx', (.5 - (e.clientY - r.top) / r.height) * 14 + 'deg'); });
  cv.addEventListener('pointerleave', () => { cv.style.setProperty('--rx', '0deg'); cv.style.setProperty('--ry', '0deg'); });
}
setCov(0);
$$('.v').forEach((b) => b.addEventListener('click', () => { setCov(+b.dataset.c); covLock = performance.now() + 9000; }));

/* formato de la portada (vitrina) */
$$('.fmts button').forEach((b) => b.addEventListener('click', () => { covLock = Infinity; stg.dataset.f = b.dataset.f; stg.classList.remove('lit'); void stg.offsetWidth; stg.classList.add('lit'); if (!still) $('.sleeve').animate([{ transform: 'scale(.88)', opacity: .3, filter: 'brightness(1.8)' }, { transform: 'none', opacity: 1, filter: 'brightness(1)' }], { duration: 480, easing: 'cubic-bezier(.34,1.56,.64,1)' }); $$('.fmts button').forEach((x) => x.classList.toggle('on', x === b)); }));

/* reproductor de la maqueta */
const plst = $('.stage'), plb = $('#plb'), pt = $('#pt'), pp = $('#pplay');
const TRK = [['Resiliencia', 304], ['Madrid a las cinco', 221], ['Cierra la puerta al salir', 268]];
let TOT = 304, ti = 0;
let pos = 72, fT = 0;
const drawPl = () => { plb.style.setProperty('--pr', (pos / TOT) * 100 + '%'); pt.textContent = fmt(pos); };
const seek = (v) => { pos = Math.max(0, Math.min(TOT - 1, v)); drawPl(); };
plb.addEventListener('click', (e) => { const r = plb.getBoundingClientRect(); seek(((e.clientX - r.left) / r.width) * TOT); });
plb.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') seek(pos + 5); if (e.key === 'ArrowLeft') seek(pos - 5); });
$('#pback').addEventListener('click', () => seek(pos - 15));
$('#pfwd').addEventListener('click', () => seek(pos + 15));
pp.addEventListener('click', () => { playing = !playing; pp.classList.toggle('paused', !playing); pp.setAttribute('aria-label', playing ? 'Pausa' : 'Reproducir'); plst.classList.toggle('paused', !playing); const av = $('video.amb__m'); if (av && cv.dataset.k === '2') { if (playing) av.play().catch(() => {}); else av.pause(); }
  if (phv) { if (playing && cv.dataset.k === '2' && !still) phv.play().catch(() => {}); else phv.pause(); } const vd = $('video.m'); if (vd && cv.dataset.k === '2') { if (playing) vd.play().catch(() => {}); else vd.pause(); } });
const setTrack = (i) => {
  ti = (i + TRK.length) % TRK.length; TOT = TRK[ti][1]; pos = 0;
  $('.stage__t b').textContent = TRK[ti][0]; $('.sz b').textContent = TRK[ti][0]; $('.pl__t span:last-child').textContent = fmt(TOT);
  drawPl();
};
$('#pnext').addEventListener('click', () => setTrack(ti + 1));
$('#pprev').addEventListener('click', () => { if (pos > 3) seek(0); else setTrack(ti - 1); });
drawPl();

/* letra */
/* letra: una frase gigante cada vez, con tres estilos */
const LY = [
  [12, 'Cruzo la M-30 con la ventanilla abajo', 'MR', '¿Y si ponemos «cristal» en vez de «ventanilla»?'],
  [18, 'y el neón me cuenta lo que no dices', '', ''],
  [24, 'suena otra vez la maqueta del verano', '', ''],
  [30, 'y yo sin saber si volver o seguir', '', ''],
  [36, 'Dame una luz verde, dame una razón', 'TÚ', 'Aquí entra el coro a dos voces.'],
  [42, 'que la noche es corta y no hay marcha atrás', '', ''],
  [50, 'Aparco en la acera donde me dejaste', '', ''],
  [56, 'con el motor encendido y la radio sin voz', 'MR', 'Esta me encanta. No la toques.'],
];
const LEND = 62, SECN = ['Verso 1', 'Verso 1', 'Verso 1', 'Verso 1', 'Estribillo', 'Estribillo', 'Verso 2', 'Verso 2'];
const lstage = $('#lstage'), lbig = $('#lbig');
const lS = LY.map((l) => l[0]);
const lend = (i) => (i + 1 < lS.length ? lS[i + 1] : LEND);
let LT = 12, lyI = -1, lyMode = 'fill', lyN = -1;
let lt0 = 0;
const lsegs = LY.map((l, i) => {
  const b = document.createElement('button');
  b.type = 'button'; b.setAttribute('aria-label', 'Ir a la frase ' + (i + 1));
  b.addEventListener('click', () => { LT = lS[i]; });
  $('#lseg').appendChild(b); return b;
});
$$('.lstyle button').forEach((b) => b.addEventListener('click', () => {
  lyMode = b.dataset.m; lstage.dataset.m = lyMode; lyN = -1; lyI = -1;
  $$('.lstyle button').forEach((x) => x.classList.toggle('on', x === b));
}));
/* reparto: tarjetas con firma */
const rcards = $('.rcards');
function rsign() { rcards.classList.remove('signed'); void rcards.offsetWidth; setTimeout(() => rcards.classList.add('signed'), 100); }
$('#rsign').addEventListener('click', rsign);

/* versiones */
const V = [
  ['v1', 'demo del móvil', '12 mar', 'Primera idea grabada con el móvil · 3:12 · 6 MB'],
  ['v3', 'maqueta con bajo', '28 mar', 'Entra el bajo y se cierra la estructura · 4:41 · 48 MB'],
  ['v5', 'mezcla con voz nueva', '2 jun', 'Voz regrabada en estudio · comentario de Marcos en 0:48'],
  ['v7', 'mezcla final', '19 sep', 'Aprobada por todos · 24-bit / 48 kHz · 5:04'],
  ['v9', 'master', 'hoy', 'Listo para distribuidora · -9,4 LUFS · 87 MB'],
];
const nodes = $('.tl__nodes');
if (nodes) nodes.innerHTML = V.map((v, i) => `<button type="button" class="tn" data-i="${i}" style="--i:${i}"><i></i><b>${v[0]}</b><em>${v[2]}</em><small>${v[1]}</small></button>`).join('');
const crate = $('#crate'), cfront = $('.crate__front');
if (crate) cfront.addEventListener('click', () => { const o = crate.classList.toggle('open'); cfront.setAttribute('aria-expanded', o); cfront.setAttribute('aria-label', o ? 'Cerrar la carpeta de versiones' : 'Abrir la carpeta de versiones'); });
let tlI = -1;
const setV = (i) => {
  tlI = i;
  $$('.tn').forEach((b, k) => { b.classList.toggle('on', k === i); b.classList.toggle('past', k < i); });
  $('.tl')?.style.setProperty('--w', (i / (V.length - 1)) * 100 + '%');
  const c = $('.tl__card');
  c.children[0].textContent = `${V[i][0]} · ${V[i][1]}`; c.children[1].textContent = V[i][3]; c.children[2].textContent = V[i][2];
  const vb = $('.vsel__btn span'); if (vb) vb.textContent = `${V[i][0]} · ${V[i][1]}`;
  $$('.vsel__list li').forEach((li, k) => li.setAttribute('aria-selected', k === i));
};
$$('.tn').forEach((b) => b.addEventListener('click', () => { setV(+b.dataset.i); lt0 = performance.now() + 5000; }));
const vsel = $('.vsel'), vbtn = $('.vsel__btn'), vlist = $('.vsel__list');
if (vsel) {
  vlist.innerHTML = V.map((v, i) => `<li role="option" tabindex="-1" data-i="${i}"><b>${v[0]}</b><span>${v[1]}</span><small>${v[2]}</small></li>`).join('');
  const vOpen = (o) => { vsel.classList.toggle('open', o); vbtn.setAttribute('aria-expanded', o); };
  vbtn.addEventListener('click', (e) => { e.stopPropagation(); vOpen(!vsel.classList.contains('open')); });
  vlist.addEventListener('click', (e) => { const li = e.target.closest('li'); if (!li) return; setV(+li.dataset.i); lt0 = performance.now() + 9000; vOpen(false); if (crate && !crate.classList.contains('open')) cfront.click(); });
  document.addEventListener('click', (e) => { if (!vsel.contains(e.target)) vOpen(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') vOpen(false); });
}
const eq = $('.eq');
if (eq) eq.innerHTML = Array.from({ length: 64 }, (_, k) => `<i style="--d:${(-(k * 0.37) % 1.6).toFixed(2)}s;--h:${(0.25 + Math.abs(Math.sin(k * 0.45)) * 0.75).toFixed(2)}"></i>`).join('');
setV(4);

let covAuto = 0;
const frame = (t) => {
  if (cur === 0 && off) {
    const g = spec.getContext('2d'), x = still ? 0 : ((t / 1000) * 46) % spec.width;
    g.clearRect(0, 0, spec.width, spec.height);
    g.drawImage(off, x, 0, spec.width, spec.height, 0, 0, spec.width, spec.height);
    $('#tc').textContent = fmt(48 + (t / 1000) % 256);
  } else if (cur === 1 && !still) {
    const beat = Math.pow(Math.abs(Math.sin(t / 1000 * 3.2)), 4);
    const base = [0.7, 0.55, 0.62, 0.5, 0.42], amp = [0.3, 0.15, 0.35, 0.25, 0.2];
    strips.forEach((li, k) => {
      const on = !li.classList.contains('off');
      const tgt = on ? base[k] + amp[k] * (k === 2 ? beat : Math.sin(t / 1000 * (2 + k) + k) * 0.5 + 0.5) * (0.6 + Math.random() * 0.4) : 0;
      lv[k] += (tgt - lv[k]) * 0.35;
      const lit = Math.round(lv[k] * SEG);
      seg[k].forEach((el, i) => { el.classList.toggle('on', i < lit); el.classList.toggle('hot', i >= SEG - 3); });
    });
  } else if (cur === 2 && !still) {
    if (playing && !still) { pos += Math.min(0.1, (t - fT) / 1000); if (pos >= TOT) setTrack(ti + 1); else drawPl(); }
    if (t > covLock && t - covLast > 3800) { covLast = t; setCov((covI + 1) % 2); }
  } else if (cur === 3) {
    const dt = Math.min(0.1, (t - fT) / 1000);
    if (!still) { LT += dt * 1.6; if (LT >= LEND) LT = 12; } else LT = 38.5;
    let i = 0; while (i + 1 < lS.length && lS[i + 1] <= LT) i++;
    const f = Math.max(0, Math.min(1, (LT - lS[i]) / (lend(i) - lS[i])));
    const words = LY[i][1].split(' ');
    if (i !== lyI) {
      lyI = i; lyN = -1;
      lsegs.forEach((b, k) => b.classList.toggle('done', k < i));
      $('#lct').textContent = fmt(lS[i]); $('#lsecn').textContent = SECN[i];
      lbig.classList.remove('in'); void lbig.offsetWidth; lbig.classList.add('in');
      if (lyMode === 'fill') lbig.textContent = LY[i][1];
      if (lyMode === 'words') lbig.innerHTML = words.map((w) => `<span class="w">${w}</span>`).join(' ');
      const nt = $('#lnote'); nt.classList.toggle('show', !!LY[i][2]);
      if (LY[i][2]) { nt.querySelector('i').textContent = LY[i][2]; nt.querySelector('b').textContent = LY[i][2] === 'MR' ? 'Marcos R.' : 'Tú'; nt.querySelector('span').textContent = LY[i][3]; }
    }
    lsegs[i].style.setProperty('--f', f * 100 + '%');
    if (!still) { const bt = Math.pow(Math.abs(Math.sin((t / 1000) * Math.PI * 1.6)), 6); lbig.style.transform = `scale(${1 + 0.016 * bt})`; $('#lbt').style.opacity = 0.25 + 0.75 * bt; }
    const g = Math.min(1, f / 0.97);
    if (lyMode === 'fill') lbig.style.setProperty('--f', g * 100 + '%');
    else if (lyMode === 'words') {
      const wl = words.map((w) => w.length + 2), tot = wl.reduce((x, y) => x + y, 0);
      let acc = 0; const st = wl.map((x) => { const r = acc / tot; acc += x; return r; });
      const n = st.filter((x) => x <= g).length;
      if (n !== lyN) { lyN = n; $$('#lbig .w').forEach((w, k) => { w.classList.toggle('on', k < n - 1); w.classList.toggle('cur', k === n - 1); }); }
    }
    else { const n = Math.ceil(g * LY[i][1].length); if (n !== lyN) { lyN = n; lbig.innerHTML = `<span class="r">${LY[i][1].slice(0, n)}</span><span class="car"></span><span class="h">${LY[i][1].slice(n)}</span>`; } }
  } else if (cur === 5 && !still) {
    if (!lt0) lt0 = t;
    if (t - lt0 > 2800) { lt0 = t; setV((tlI + 1) % V.length); }
  }
  fT = t;
  requestAnimationFrame(frame);
};
if (spec) requestAnimationFrame(frame);

/* ---------- proceso: agujero que se abre, se traga los archivos y escupe la canción ---------- */
{
  const cv = $('.mv__dots'), cvr = $('.mv__cv');
  if (cv && cvr) {
    const ctx = cv.getContext('2d'), CYC = 12000;
    const chips = $$('.mv__chips i').map((el, n, all) => ({ el, a0: (n / all.length) * 6.283, ring: n % 2 ? 1 : 0.74, sp: n * 1.7 }));
    const subs = $$('.mv__go li'), caps = $$('.mv__cap span');
    const ORB = [3.75, 2.5, 5.65, 0.65];
    const bolts = subs.map(() => ({ t: -1e9, m: [], br: [], fl: 1, hit: 0, p: [], nx: 0, s0: 0 }));
    let SP = [];
    const mid = (A, Bp, off, gens) => { let p = [A, Bp]; for (let g = 0; g < gens; g++) { const n = [p[0]]; for (let i = 1; i < p.length; i++) n.push([(p[i - 1][0] + p[i][0]) / 2, (p[i - 1][1] + p[i][1]) / 2 + (Math.random() * 2 - 1) * off], p[i]); p = n; off *= 0.55; } return p; };
    const P = Array.from({ length: 760 }, () => ({ a: Math.random() * 6.283, r: 0.12 + Math.random() * 0.88, s: 0.6 + Math.random() }));
    let W = 0, H = 0, run = false, last = 0, T = 0;
    const size = () => {
      const d = Math.min(devicePixelRatio || 1, 2);
      W = cv.clientWidth; H = cv.clientHeight; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
    };
    const cl = (v) => (v < 0 ? 0 : v > 1 ? 1 : v), seg = (ph, a, b) => cl((ph - a) / (b - a));
    const eo = (x) => 1 - (1 - x) ** 3, ei = (x) => x * x * x;
    const back = (x) => 1 + 2.7 * (x - 1) ** 3 + 1.7 * (x - 1) ** 2;
    const line = (pts) => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.stroke(); };
    const draw = (T, dt) => {
      const ph = (T % CYC) / CYC, mob = W < 860, s = mob ? 0.38 : 1;
      const cx = W / 2, cy = cvr.offsetTop + cvr.offsetWidth / 2;
      const ho = ph < 0.08 ? eo(ph / 0.08) : ph < 0.52 ? 1 : ph < 0.555 ? 1 + 0.35 * Math.sin(seg(ph, 0.52, 0.555) * Math.PI) : 1 - eo(seg(ph, 0.555, 0.66));
      const pull = seg(ph, 0.3, 0.5) * (1 - seg(ph, 0.52, 0.56)), out = seg(ph, 0.94, 0.99);
      ctx.clearRect(0, 0, W, H);
      /* disco de partículas y agujero */
      if (ho > 0.01) {
        const Rx = Math.min(W * 0.42, 470) * ho, Ry = Rx * 0.34, hr = (mob ? 24 : 34) * ho;
        for (const p of P) {
          p.a += dt * 0.0005 / (p.r + 0.15) * (1 + pull * 3);
          p.r -= dt * 0.00003 * (1 + pull * 7);
          if (p.r < 0.1) { p.r = 1; p.a = Math.random() * 6.283; }
        }
        const dots = (front) => {
          for (const p of P) {
            const sn = Math.sin(p.a); if (sn > 0 !== front) continue;
            const b = p.a - 0.06 - pull * 0.1;
            ctx.globalAlpha = Math.min(1, ho) * (0.3 + (1 - p.r) * 0.7);
            ctx.strokeStyle = p.r < 0.3 ? '#E6FF94' : p.r < 0.8 ? '#C6FF3D' : '#8EF05A';
            ctx.lineWidth = p.s * (0.7 + (1 - p.r) * 1.2);
            ctx.beginPath(); ctx.moveTo(cx + Math.cos(b) * p.r * Rx, cy + Math.sin(b) * p.r * Ry); ctx.lineTo(cx + Math.cos(p.a) * p.r * Rx, cy + sn * p.r * Ry); ctx.stroke();
          }
        };
        ctx.globalCompositeOperation = 'lighter'; dots(false); ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, hr * 2);
        g.addColorStop(0, '#000'); g.addColorStop(0.5, '#000'); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, hr * 2, 0, 6.283); ctx.fill();
        ctx.globalAlpha = 0.8 * Math.min(1, ho); ctx.strokeStyle = '#E6FF94'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(cx, cy, hr, 0, 6.283); ctx.stroke();
        ctx.globalCompositeOperation = 'lighter'; dots(true); ctx.globalCompositeOperation = 'source-over';
      }
      /* onda al escupir */
      const sw = seg(ph, 0.535, 0.64);
      if (sw > 0 && sw < 1) { const R = 40 + eo(sw) * W * 0.4; ctx.globalAlpha = (1 - sw) * 0.6; ctx.strokeStyle = '#C6FF3D'; ctx.lineWidth = 0.5 + 2 * (1 - sw); ctx.beginPath(); ctx.ellipse(cx, cy, R, R * 0.45, 0, 0, 6.283); ctx.stroke(); }
      /* archivos: flotan en órbita y entran en espiral uno detrás de otro */
      const Rc = Math.min(W * 0.4, 440), Ryc = Math.min(H * 0.34, 140), rot = T * 0.00012, vin = seg(ph, 0.03, 0.11);
      chips.forEach((c, n) => {
        const st = 0.3 + n * 0.011, u = ei(seg(ph, st, st + 0.09)), a = c.a0 + rot + u * 4.5, r = c.ring * (1 - u);
        const x = cx + Math.cos(a) * r * Rc, y = cy + Math.sin(a) * r * Ryc + Math.sin(T * 0.0013 + c.sp) * 8 * (1 - u);
        const depth = (Math.sin(a) + 1) / 2;
        c.el.style.opacity = (ph > st + 0.09 ? 0 : vin * (u > 0.75 ? (1 - u) / 0.25 : 1)).toFixed(2);
        c.el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotate(${(Math.sin(T * 0.001 + c.sp) * 12 + u * 540).toFixed(1)}deg) scale(${((0.75 + depth * 0.35) * (0.6 + 0.4 * vin) * (1 - u * 0.85)).toFixed(3)})`;
      });
      /* sale la canción */
      const cu = seg(ph, 0.54, 0.62);
      cvr.style.opacity = (Math.min(1, cu * 3) * (1 - out)).toFixed(2);
      cvr.style.transform = `scale(${(cu ? back(cu) : 0).toFixed(3)}) rotate(${((1 - eo(cu)) * -14).toFixed(1)}deg)`;
      /* pompas de plataformas que orbitan en 3D alrededor de la canción, unidas por rayos vivos */
      const br = mob ? 46 : 60, ORX = Math.min(W * (mob ? 0.36 : 0.31), 430), ORY = mob ? 170 : 150;
      ctx.globalCompositeOperation = 'lighter';
      subs.forEach((li, i) => {
        const L = 0.63 + i * 0.035, u = seg(ph, L, L + 0.07), e = eo(u), B = bolts[i];
        const a = ORB[i] + (ph - 0.63) * CYC * 0.00005, front = (Math.sin(a) + 1) / 2;
        const ox = Math.cos(a) * ORX * e, oy = (Math.sin(a) * ORY - 14 + Math.sin(T * 0.0017 + i * 1.9) * 6) * e;
        const wob = Math.sin(T * 0.005 + i * 2.1) * 0.035, sc = (0.25 + 0.75 * back(u)) * (0.78 + 0.3 * front) * (1 + B.hit * 0.07);
        li.style.opacity = (Math.min(1, u * 4) * (1 - out) * (0.55 + 0.45 * front)).toFixed(2);
        li.style.zIndex = front > 0.5 ? 3 : 1;
        li.style.transform = `translate(${ox.toFixed(1)}px,${oy.toFixed(1)}px) scale(${(sc * (1 + wob)).toFixed(3)},${(sc * (1 - wob)).toFixed(3)})`;
        li.style.setProperty('--hit', B.hit.toFixed(2));
        B.hit = Math.max(0, B.hit - dt / 600);
        if (!u || out >= 1) return;
        const len = Math.hypot(ox, oy) || 1, k = Math.max(0, len - br * sc) / len, D = len * k, nx = -oy / len, ny = ox / len;
        const strike = 1 - seg(ph, L, L + 0.1);
        if (T - B.t > (strike > 0.1 ? 35 : 55 + Math.random() * 60)) {
          B.t = T; B.m = mid([0, 0], [1, 0], D * (0.08 + strike * 0.12), 5);
          B.br = []; for (let q = 0; q < 2 + (strike > 0.1 ? 2 : 0); q++) { const s0 = B.m[6 + ((Math.random() * 18) | 0)], r = 0.12 + Math.random() * 0.25, sd = Math.random() < 0.5 ? -1 : 1; B.br.push(mid(s0, [s0[0] + r, s0[1] + sd * r * D * 0.5], D * 0.05, 3)); }
          B.fl = Math.random() < 0.12 ? 1.5 : 0.6 + Math.random() * 0.4;
        }
        const map = (arr) => arr.map(([f, o]) => [cx + ox * k * f + nx * o, cy + oy * k * f + ny * o]);
        const M = map(B.m), I = (1 - out) * B.fl * (0.45 + 0.55 * front) * (1 + strike);
        ctx.strokeStyle = '#C6FF3D'; ctx.lineWidth = 12; ctx.globalAlpha = 0.05 * I; line(M);
        ctx.lineWidth = 4; ctx.globalAlpha = 0.16 * I; line(M);
        ctx.strokeStyle = '#F4FFD8'; ctx.lineWidth = 1.3; ctx.globalAlpha = Math.min(1, 0.8 * I); line(M);
        ctx.strokeStyle = '#C6FF3D'; ctx.lineWidth = 0.9; for (const r of B.br) { ctx.globalAlpha = 0.45 * I; line(map(r)); }
        /* pulsos de energía que viajan hasta la pompa */
        if (T > B.nx) { B.p.push(0); B.nx = T + 700 + Math.random() * 900; }
        B.p = B.p.filter((f) => f < 1);
        B.p.forEach((f, q) => {
          const nf = f + dt * 0.0017; B.p[q] = nf;
          const j = Math.min(M.length - 1, Math.floor(nf * (M.length - 1))), [x, y] = M[j];
          const g = ctx.createRadialGradient(x, y, 0, x, y, 14); g.addColorStop(0, 'rgba(244,255,216,.95)'); g.addColorStop(0.3, 'rgba(198,255,61,.5)'); g.addColorStop(1, 'rgba(198,255,61,0)');
          ctx.globalAlpha = 1 - out; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 14, 0, 6.283); ctx.fill();
          if (nf >= 1) { B.hit = 1; for (let z = 0; z < 12; z++) { const an = Math.random() * 6.283, v = 0.08 + Math.random() * 0.2; SP.push({ x: cx + ox * k, y: cy + oy * k, vx: Math.cos(an) * v, vy: Math.sin(an) * v, l: 1 }); } }
        });
        if (strike > 0.9 && !B.s0) { B.s0 = 1; B.hit = 1; }
        if (strike < 0.5) B.s0 = 0;
      });
      /* chispas al impactar */
      ctx.strokeStyle = '#E6FF94'; ctx.lineWidth = 1.2;
      SP = SP.filter((p) => (p.l -= dt / 450) > 0);
      for (const p of SP) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += dt * 0.0002; ctx.globalAlpha = p.l * (1 - out); ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 30, p.y - p.vy * 30); ctx.stroke(); }
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      /* rótulos */
      const co = [seg(ph, 0, 0.04) * (1 - seg(ph, 0.3, 0.34)), seg(ph, 0.34, 0.38) * (1 - seg(ph, 0.55, 0.59)), seg(ph, 0.62, 0.67) * (1 - out)];
      caps.forEach((el, i) => { el.style.opacity = co[i].toFixed(2); });
    };
    const loop = (t) => { if (!run) return; const dt = Math.min(48, t - last); last = t; T += dt; draw(T, dt); requestAnimationFrame(loop); };
    size(); addEventListener('resize', size);
    if (still) draw(CYC * 0.86, 0);
    else new IntersectionObserver(([e]) => { const was = run; run = e.isIntersecting; if (run && !was) { T = 0; last = performance.now(); requestAnimationFrame(loop); } }).observe(cv);
  }
}

/* ---------- 4 · cartel ON AIR ---------- */
new IntersectionObserver(([e]) => {
  if (e.isIntersecting) $('.onair').classList.add('is-on');
}, { threshold: 0.45 }).observe($('.onair'));

/* ---------- aparición al hacer scroll ---------- */
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
}, { threshold: 0.15 });
$$('.reveal').forEach((el, i) => {
  el.style.transitionDelay = `${(i % 3) * 0.08}s`;
  io.observe(el);
});

/* ---------- scroll: progreso de lectura, sección activa del menú y pasos ---------- */
const navLinks = $$('.nav__links a');
const sections = navLinks.map((a) => $(a.getAttribute('href')));
const clamp = (v) => Math.max(0, Math.min(1, v));
function onScroll() {
  const max = document.documentElement.scrollHeight - innerHeight;
  $('#read').style.setProperty('--read', (scrollY / max).toFixed(4));

  let here = -1;
  sections.forEach((sec, n) => { if (sec && sec.getBoundingClientRect().top < innerHeight * 0.5) here = n; });
  navLinks.forEach((a, n) => a.classList.toggle('is-here', n === here));
}
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll);
onScroll();

/* ---------- estudio a oscuras: piloto "en el aire" ---------- */
{
  const room = $('.heroC');
  room?.querySelectorAll('[data-air]').forEach((a) => {
    const on = () => room.classList.add('is-air'), off = () => room.classList.remove('is-air');
    a.addEventListener('pointerenter', on); a.addEventListener('focus', on);
    a.addEventListener('pointerleave', off); a.addEventListener('blur', off);
  });
}

/* ---------- separadores: forma de onda que se "reproduce" al entrar en pantalla ---------- */
document.querySelectorAll('.ledline').forEach((el, k) => {
  const hs = waveHeights(1.3 + k * 2.1, 180, 24);
  el.classList.add('wave');
  renderWave(el, hs, 0);
  el.querySelectorAll('span').forEach((s, i) => s.style.setProperty('--i', i));
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    el.querySelectorAll('span').forEach((s) => s.classList.add('on'));
    io.disconnect();
  }, { threshold: 1 });
  io.observe(el);
});

/* enlaces internos (#como, #producto…) con el mismo deslizamiento */
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a || a.getAttribute('href').length < 2) return;
  const t = document.querySelector(a.getAttribute('href'));
  if (!t) return;
  e.preventDefault();
  smooth.to(t.getBoundingClientRect().top + scrollY - 20);
});

/* fondo de versiones: disco de puntos con surcos y una onda que sale del centro */
(() => {
  const cv = $('.globe'); if (!cv) return;
  const g = cv.getContext('2d'), P = [];
  for (let k = 0; k < 34; k++) {
    const r = 0.22 + (k / 33) * 0.78, n = Math.round(40 + r * 150);
    for (let j = 0; j < n; j++) P.push([r, (j / n) * 6.283 + Math.random() * 0.03, 0.5 + Math.pow(Math.random(), 3) * 1.8]);
  }
  let W = 0, H = 0, dpr = 1, rot = 0, tm = 0, tx = 0, ty = 0, mx = 0, my = 0, vis = false, raf = 0, last = 0;
  const size = () => { dpr = Math.min(2, devicePixelRatio || 1); W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; };
  const draw = () => {
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    const R = Math.min(W * 0.46, 420), cx = W / 2 + tx * 40, cy = H * 0.74 + ty * 20, sq = 0.3 + ty * 0.06;
    for (const [r, a0, s] of P) {
      const a = a0 + rot, x = Math.cos(a) * r, z = Math.sin(a) * r;
      const px = cx + x * R, py = cy + z * R * sq;
      if (py < -4 || py > H + 4) continue;
      const wave = Math.max(0, Math.sin(r * 18 - tm * 2.2)), front = (z + 1) / 2;
      g.globalAlpha = 0.1 + front * 0.35 + wave * 0.45;
      g.fillStyle = wave > 0.85 ? '#E6FF94' : r < 0.5 ? '#5BE6B4' : '#C6FF3D';
      g.beginPath(); g.arc(px, py, s * (0.6 + front * 0.6) + wave * 0.9, 0, 6.283); g.fill();
    }
  };
  const loop = (t) => { raf = 0; if (!vis) return; const dt = Math.min(50, t - (last || t)); last = t; rot += dt * 0.00009; tm += dt * 0.001; tx += (mx - tx) * 0.05; ty += (my - ty) * 0.05; draw(); raf = requestAnimationFrame(loop); };
  const start = () => { if (still) { draw(); return; } if (!raf) { last = 0; raf = requestAnimationFrame(loop); } };
  size(); draw();
  addEventListener('resize', () => { size(); draw(); });
  const art = cv.parentElement;
  art.addEventListener('pointermove', (e) => { const r = art.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width - 0.5; my = (e.clientY - r.top) / r.height - 0.5; });
  art.addEventListener('pointerleave', () => { mx = 0; my = 0; });
  new IntersectionObserver((es) => { vis = es[0].isIntersecting && cv.offsetParent !== null; if (vis) { size(); start(); } }, { threshold: 0.05 }).observe(art);
  new MutationObserver(() => { if (cv.offsetParent !== null) { vis = true; size(); start(); } else vis = false; }).observe(cv.closest('.pane'), { attributes: true, attributeFilter: ['class'] });
})();
