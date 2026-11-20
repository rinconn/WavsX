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

/* ---------- proceso: agujero de gusano que absorbe los archivos ---------- */
{
  const cv = $('.mv__dots'), cvr = $('.mv__cv');
  if (cv && cvr) {
    const ctx = cv.getContext('2d');
    const chips = $$('.mv__chips i').map((el, n) => ({
      el, a: Math.random() * 6.28, rx: 110 + Math.random() * 360, ry: 50 + Math.random() * 120,
      w: (0.00016 + Math.random() * 0.0002) * (n % 2 ? 1 : -1), sp: Math.random() * 3
    }));
    const P = Array.from({ length: 1000 }, () => ({ a: Math.random() * 6.28, r: 0.05 + Math.random() * 0.95, s: 0.5 + Math.random() * 1.2 }));
    let W = 0, H = 0, run = false, last = 0, bg = '9,9,11';
    const size = () => {
      const d = Math.min(devicePixelRatio || 1, 2);
      W = cv.clientWidth; H = cv.clientHeight; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
      bg = getComputedStyle(document.body).backgroundColor.replace('rgb(', '').replace(')', '');
      ctx.fillStyle = `rgb(${bg})`; ctx.fillRect(0, 0, W, H);
    };
    const ease = (x) => x * x * (3 - 2 * x);
    const draw = (t, dt) => {
      const ph = (t % 10000) / 10000;
      const k = ph < 0.3 ? 0 : ph < 0.46 ? ease((ph - 0.3) / 0.16) : ph < 0.56 ? 1 - (ph - 0.46) / 0.1 : 0;
      const cx = cvr.offsetLeft + cvr.offsetWidth / 2, cy = cvr.offsetTop + cvr.offsetWidth / 2;
      const Rx = W * 0.62, Ry = Rx * 0.5;
      ctx.fillStyle = `rgba(${bg},.24)`; ctx.fillRect(0, 0, W, H);
      const fade = ph < 0.05 ? ph / 0.05 : ph < 0.5 ? 1 : ph < 0.58 ? 1 - (ph - 0.5) / 0.08 : 0;
      for (const p of P) {
        p.a += dt * 0.00035 / (p.r + 0.14) * (1 + k * 2.2);
        p.r -= dt * (0.000014 + 0.00002 * (1 - p.r)) * (1 + k * 7);
        if (p.r < 0.05) { p.r = 1; p.a = Math.random() * 6.28; }
        const x = cx + Math.cos(p.a) * p.r * Rx, y = cy + Math.sin(p.a) * p.r * Ry;
        ctx.globalAlpha = Math.min(1, 0.2 + (1 - p.r) * 0.65 + k * 0.25) * fade;
        ctx.fillStyle = p.r < 0.3 ? '#E6FF94' : p.r < 0.65 ? '#C6FF3D' : '#5BE6B4';
        ctx.beginPath(); ctx.arc(x, y, (0.5 + (1 - p.r) * 1.2) * p.s, 0, 6.2832); ctx.fill();
      }
      ctx.globalAlpha = 1;
      const sc = Math.min(1.7, W / 1000);
      for (const c of chips) {
        c.a += dt * c.w * (1 + k * 14);
        const rr = 1 - k, wob = Math.sin(t * 0.0012 + c.sp) * 10;
        const x = cx + Math.cos(c.a) * c.rx * sc * rr, y = cy + Math.sin(c.a) * c.ry * rr + wob * rr;
        const depth = (Math.sin(c.a) + 1) / 2, vis = ph < 0.03 ? ph / 0.03 : ph < 0.44 ? 1 : ph < 0.47 ? 1 - (ph - 0.44) / 0.03 : 0;
        c.el.style.opacity = vis.toFixed(2);
        c.el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotate(${(c.a * 40 + Math.sin(t * 0.001 + c.sp) * 25).toFixed(1)}deg) scale(${((0.7 + depth * 0.5) * (1 - k * 0.8)).toFixed(2)})`;
      }
    };
    const loop = (t) => { if (!run) return; draw(t, Math.min(48, t - last)); last = t; requestAnimationFrame(loop); };
    size(); addEventListener('resize', size);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { for (let i = 0; i < 40; i++) draw(4800, 32); }
    else new IntersectionObserver(([e]) => { run = e.isIntersecting; if (run) { last = performance.now(); requestAnimationFrame(loop); } }).observe(cv);
  }
}

/* ---------- 4 · cierre: el WAV se convierte en canción ---------- */
{
  const d = $('#drop'), cv = $('#dropWave'), st = $('.drop__st');
  const N = 180, rnd = (i) => (Math.sin(i * 12.9898) * 43758.5453) % 1;
  let peaks = Array.from({ length: N }, (_, i) => { const t = i / N; return Math.min(1, (.3 + .55 * Math.abs(Math.sin(t * 9) * Math.sin(t * 2.3 + 1)) + .15 * Math.abs(rnd(i))) * (t < .05 ? t / .05 : 1)); });
  // pistas: tramos con sonido [inicio, fin] y carácter de cada una
  const plan = { 'Voz lead': [[.08, .3], [.36, .62], [.7, .96]], 'Coros': [[.36, .62], [.82, .96]], 'Gtr ac.': [[0, .34], [.64, .8]], 'Beat': [[.12, .62], [.66, 1]], '808': [[.12, .62], [.66, 1]] };
  const trks = [...d.querySelectorAll('.trk canvas')].map((c, k) => ({ c, col: getComputedStyle(c.parentNode).getPropertyValue('--k').trim(), segs: plan[c.dataset.r], k }));
  const sz = (c) => { c.width = c.clientWidth * 2; c.height = c.clientHeight * 2; return c.getContext('2d'); };
  const drawMain = (rev, play) => {
    const g = sz(cv), w = cv.width, h = cv.height, bw = w / N;
    for (let i = 0; i < N; i++) { if (i / N > rev) break; g.fillStyle = i / N < play ? '#C6FF3D' : 'rgba(198,255,61,.35)'; const a = Math.max(2, peaks[i] * h * .92); g.fillRect(i * bw + .5, (h - a) / 2, Math.max(1, bw - 1.5), a); }
  };
  const drawTrk = ({ c, col, segs, k }, rev) => {
    const g = sz(c), w = c.width, h = c.height, n = 120, bw = w / n;
    for (const [a0, a1] of segs) {
      if (a0 > rev) continue; const x0 = a0 * w + 2, x1 = Math.min(a1, rev) * w - 2;
      g.globalAlpha = .22; g.fillStyle = col; g.beginPath(); g.roundRect(x0, 2, x1 - x0, h - 4, 6); g.fill(); g.globalAlpha = 1;
      for (let i = Math.ceil(a0 * n); i < a1 * n && i / n <= rev; i++) {
        const t = i / n, pk = peaks[Math.floor(t * N)] || .3;
        let v = k === 3 ? (i % 4 === 0 ? .95 : i % 2 ? .25 : .5) : k === 4 ? (.55 + .2 * Math.sin(i * .8)) : pk * (.5 + .5 * Math.abs(Math.sin(i * (.5 + k * .3))));
        const a = Math.max(2, v * (h - 12)); g.fillStyle = col; g.fillRect(i * bw + 1, (h - a) / 2, Math.max(1, bw - 2.5), a);
      }
    }
  };
  // letra karaoke
  const lyr = ['Mirando arriba desde el mismo banco', 'la ciudad se apaga y yo sigo despierto', 'te busco entre luces que no son estrellas', 'tú tan lejos como Andrómeda', 'y yo aquí contando el tiempo'];
  const kp = $('.kar__prev'), kn = $('.kar__now'), kx = $('.kar__next');
  let li = -1;
  const setLine = (i, f) => {
    if (i !== li) { li = i; kp.textContent = lyr[i - 1] || ''; kx.textContent = lyr[i + 1] || ''; kn.innerHTML = lyr[i].split(' ').map(w => `<span>${w}</span>`).join(' '); }
    const ws = kn.children, on = Math.floor(f * (ws.length + 1)); for (let j = 0; j < ws.length; j++) ws[j].classList.toggle('on', j < on);
  };
  let timers = [], raf, played = false, playing = false, pos = 0;
  const loop = (t0) => {
    let last = performance.now();
    const step = (t) => {
      if (playing) pos = (pos + (t - last) / 26000) % 1; last = t;
      d.style.setProperty('--p', pos); drawMain(1, pos);
      const L = lyr.length, x = pos * L; setLine(Math.floor(x), x % 1);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  };
  const run = () => {
    timers.forEach(clearTimeout); cancelAnimationFrame(raf); playing = false; pos = 0; d.className = 'drop reveal is-in s1'; st.textContent = 'Subiendo…';
    setLine(0, 0); const t0 = performance.now();
    const step = (t) => {
      const e = t - t0; drawMain(Math.min(1, e / 1500), 0);
      const q = Math.min(1, Math.max(0, (e - 1700) / 1400)); trks.forEach(o => drawTrk(o, q));
      if (q < 1) raf = requestAnimationFrame(step); else { playing = true; d.classList.add('is-play'); loop(); }
    };
    raf = requestAnimationFrame(step);
    [2, 3, 4, 5, 6].forEach((k, i) => timers.push(setTimeout(() => d.classList.add('s' + k), 1500 + i * 600)));
    timers.push(setTimeout(() => { st.textContent = 'Guardada'; }, 4200));
  };
  drawMain(0, 0);
  new IntersectionObserver(([e]) => { if (e.isIntersecting && !played) { played = true; setTimeout(run, 600); } }, { threshold: .4 }).observe(d);
  $('.drop__play').addEventListener('click', () => { playing = !playing; d.classList.toggle('is-play', playing); });
  addEventListener('resize', () => trks.forEach(o => drawTrk(o, 1)));
  const load = async (f) => {
    if (!f) return;
    $('#dropName').textContent = f.name.replace(/\.[^.]+$/, ''); $('#dropMeta').textContent = (f.size / 1048576).toFixed(1) + ' MB';
    try {
      const buf = await new (window.AudioContext || window.webkitAudioContext)().decodeAudioData(await f.arrayBuffer());
      const ch = buf.getChannelData(0), z = Math.floor(ch.length / N); let mx = 0;
      peaks = Array.from({ length: N }, (_, i) => { let m = 0; for (let j = i * z; j < (i + 1) * z; j += 64) m = Math.max(m, Math.abs(ch[j])); mx = Math.max(mx, m); return m; }).map(v => v / (mx || 1));
      const s = Math.round(buf.duration); $('#dropMeta').textContent = (buf.sampleRate / 1000) + ' kHz · ' + Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
    } catch (_) {}
    played = true; run();
  };
  $('.drop__zone input').addEventListener('change', (e) => load(e.target.files[0]));
  d.addEventListener('dragover', (e) => { e.preventDefault(); d.classList.add('is-over'); });
  d.addEventListener('dragleave', () => d.classList.remove('is-over'));
  d.addEventListener('drop', (e) => { e.preventDefault(); d.classList.remove('is-over'); load(e.dataTransfer.files[0]); });
}

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
