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
  ['v1', 'demo del móvil', '12 mar', 'Primera idea grabada con el móvil · 3:12 · 6 MB', 'Hierro', '3:12', '6 MB'],
  ['v3', 'maqueta con bajo', '28 mar', 'Entra el bajo y se cierra la estructura · 4:41 · 48 MB', 'Bronce', '4:41', '48 MB'],
  ['v5', 'mezcla con voz nueva', '2 jun', 'Voz regrabada en estudio · comentario de Marcos en 0:48', 'Plata', '5:02', '1 nota'],
  ['v7', 'mezcla final', '19 sep', 'Aprobada por todos · 24-bit / 48 kHz · 5:04', 'Oro', '5:04', '24-bit'],
  ['v9', 'master', 'hoy', 'Listo para distribuidora · -9,4 LUFS · 87 MB', 'Platino', '-9,4', 'LUFS'],
];
const nodes = $('.tl__nodes');
if (nodes) nodes.innerHTML = V.map((v, i) => `<button type="button" class="tn" data-i="${i}" style="--i:${i}" aria-label="${v[0]} · ${v[1]}"><span class="tk"><span class="tk__f"></span><span class="tk__b"><u>${v[4]}</u><strong>${v[5]}</strong><s>${v[6]}</s></span></span><b>${v[0]} · ${['demo','maqueta','mezcla','final','master'][i]}</b><small>${v[2]}</small></button>`).join('');
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
    if (t - lt0 > 5000) { lt0 = t; setV((tlI + 1) % V.length); }
  }
  fT = t;
  requestAnimationFrame(frame);
};
if (spec) requestAnimationFrame(frame);

/* ---------- proceso: el caos real (mensajes, enlaces caducados, nombres imposibles) se ordena ---------- */
{
  const st = $('.mv__stage'), ms = $$('.mv__mess .mx');
  if (st && ms.length && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // un solo reloj de 10 s: cada pieza entra a su ritmo y todas se recogen a la vez hacia la portada
    const T = 10000, n = ms.length;
    const go = () => {
      ms.forEach((el, i) => {
        const d = .02 + i / n * .28, tr = (x, y, r, k) => `translate(${x}, ${y}) rotate(${r}) scale(${k})`;
        const X = 'calc(var(--x) * var(--s))', Y = 'calc(var(--y) * var(--s))';
        el.animate([
          { offset: 0, opacity: 0, transform: tr(X, Y, 'var(--r)', .85) },
          { offset: d, opacity: 0, transform: tr(X, Y, 'var(--r)', .85) },
          { offset: d + .025, opacity: 1, transform: tr(X, Y, 'var(--r)', 1.04), easing: 'ease-out' },
          { offset: d + .04, opacity: 1, transform: tr(X, Y, 'var(--r)', 1) },
          { offset: .355, opacity: 1, transform: tr(X, Y, 'var(--r)', 1), easing: 'cubic-bezier(.6,0,.9,.4)' },
          { offset: .43, opacity: 0, transform: tr('0px', '-30px', '0deg', .15) },
          { offset: 1, opacity: 0, transform: tr('0px', '-30px', '0deg', .15) }
        ], { duration: T, iterations: Infinity });
      });
      // portada, plataformas y textos (animaciones CSS) arrancan en el mismo instante
      st.parentElement.getAnimations({ subtree: true }).forEach((an) => { an.currentTime = 0; });
    };
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { go(); io.disconnect(); } }, { threshold: .3 });
    io.observe(st);
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
  const lyr = ['Mirando arriba desde el mismo banco', 'la ciudad se apaga y yo sigo despierto', 'te busco entre luces que no son estrellas', 'trazos en la pared que nadie borra', 'y yo aquí contando el tiempo'];
  const kp = $('.kar__prev'), kn = $('.kar__now'), kx = $('.kar__next');
  let li = -1;
  const setLine = (i, f) => {
    if (i !== li) { li = i; kp.textContent = lyr[i - 1] || ''; kx.textContent = lyr[i + 1] || ''; kn.innerHTML = lyr[i].split(' ').map(w => `<span>${w}</span>`).join(' '); }
    const ws = kn.children, on = Math.floor(f * (ws.length + 1)); for (let j = 0; j < ws.length; j++) ws[j].classList.toggle('on', j < on);
  };
  let timers = [], raf, played = false, playing = false, pos = 0, vis = false;
  const loop = (t0) => {
    let last = performance.now();
    const step = (t) => {
      if (!vis) { last = t; raf = requestAnimationFrame(step); return; }
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
  new IntersectionObserver(([e]) => { vis = e.isIntersecting; if (e.intersectionRatio >= .4 && !played) { played = true; setTimeout(run, 600); } }, { threshold: [0, .4] }).observe(d);
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
/* precios: mensual/anual, luz que sigue al cursor dentro de la tarjeta y fondo de ondas */
{
  const sec = $('#precios');
  if (sec) {
    const bill = $('.bill'), btns = [...bill.querySelectorAll('button')];
    const place = (b) => { bill.style.setProperty('--x', b.offsetLeft + 'px'); bill.style.setProperty('--w', b.offsetWidth + 'px'); };
    place(btns[0]); addEventListener('resize', () => place(bill.querySelector('.on')));
    btns.forEach((b) => b.addEventListener('click', () => {
      btns.forEach((x) => x.classList.toggle('on', x === b)); place(b);
      const k = b.dataset.b;
      sec.querySelectorAll('.plan__price b').forEach((n) => { n.classList.add('flip'); setTimeout(() => { n.textContent = n.dataset[k]; n.classList.remove('flip'); }, 180); });
      sec.querySelectorAll('.plan__bill').forEach((n) => { n.textContent = n.dataset[k]; });
    }));
    sec.querySelectorAll('.plan').forEach((c) => c.addEventListener('pointermove', (e) => {
      const r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }));
  }
}

/* foto a sangre: se desplaza un poco más lenta que el scroll */
{
  for (const sh of document.querySelectorAll('.wall')) { const im = sh.querySelector('.wall__img');
  if (im && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let on = false;
    const tick = () => { if (!on) return; const r = sh.getBoundingClientRect(), k = (r.top + r.height / 2 - innerHeight / 2) / innerHeight; im.style.transform = `translateY(${(k * -6).toFixed(2)}%)`; requestAnimationFrame(tick); };
    new IntersectionObserver(([e]) => { on = e.isIntersecting; if (on) requestAnimationFrame(tick); }).observe(sh);
  } }
}

/* franja del gato: progreso del scroll mientras está fijada */
{
  const sh = document.querySelector('.shot'), tc = sh && sh.querySelector('.shot__tc');
  // letras sueltas que caen una a una según avanza el scroll
  const tp = sh && sh.querySelector('.shot__txt p');
  if (tp) {
    const lines = tp.innerHTML.split(/<br\s*\/?>/i).map(l => [...l.replace(/<[^>]+>/g, '')]), n = lines.flat().length; let i = 0;
    tp.setAttribute('aria-label', tp.textContent);
    const ch = c => `<span class="ch" style="--d:${(i++ / n * .38).toFixed(3)};--r:${((i * 37) % 31) - 15}">${c}</span>`;
    tp.innerHTML = lines.map(l => l.join('').split(' ').map(w => `<span class="w" aria-hidden="true">${[...w].map(ch).join('')}</span>`).join(' ')).join('<br>');
  }
  // galaxia: todo se pinta en un solo canvas a partir de un vídeo (más ligero que el gif).
  // Late sola con los golpes reales del tema (ENV: graves a 30 fps, 0-9); al tocarla suena de verdad.
  const ENV = '22333445542222222222222222222222222222222222222222222222222222476555554349854445443222222222389544545532222222222796444545422222222226974445554222222222249855544222245555532232222222222222222795784322222279732222223222222222222222222259754444555555532222232222222223544445775885444444555554322223222222222257555555559645543225985555532232222222222222223884884322222379632222223222222222576555557579754454555555556555332222222222222223864985222222265555444454443222222365544444479655453222256555422332223232223322224974964222222489522222223222232222222222222279544445555555432222322222222223544445865965444444455553222223222222222376555555488455542237965555422322222222222222225975964322222599522222223222222223665555567488644445455555565654322222222222222225856974222222365555444454442222222454444333366444432222243333222222222222222222222';
  const au = sh && sh.querySelector('.shot__au'), btn = sh && sh.querySelector('.shot__play');
  const art = sh && sh.querySelector('.shot__art'), cv = sh && sh.querySelector('.shot__cv'), vid = sh && sh.querySelector('.shot__vid');
  const bars = btn ? btn.querySelectorAll('.shot__eq i') : [];
  let an = null, fd, playing = false, bass = 0, avg = 0, lastKick = 0, t0 = performance.now(), idleT = 0;
  const waves = []; let fr = 0, lastTc = '';
  const fmt = (t) => `00:${String(t / 60 | 0).padStart(2, '0')}:${String(t % 60 | 0).padStart(2, '0')}`;
  const toggle = () => {
    if (!an) {
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      an = ac.createAnalyser(); an.fftSize = 512; an.smoothingTimeConstant = .7;
      ac.createMediaElementSource(au).connect(an); an.connect(ac.destination);
      fd = new Uint8Array(an.frequencyBinCount); an.ac = ac;
    }
    an.ac.resume();
    if (au.paused) { au.currentTime = idleT; au.play(); sh.classList.add('heard'); } else au.pause();
  };
  if (btn) btn.addEventListener('click', toggle);
  if (art) art.addEventListener('click', toggle);
  if (au) {
    au.addEventListener('play', () => { playing = true; btn.setAttribute('aria-pressed', 'true'); btn.querySelector('.shot__lbl').textContent = 'Pausa'; });
    au.addEventListener('pause', () => { playing = false; t0 = performance.now() - au.currentTime * 1000; btn.setAttribute('aria-pressed', 'false'); btn.querySelector('.shot__lbl').textContent = 'Escuchar'; });
  }
  // lienzos: principal (S px), estrellas teñidas a media resolución y halo a 1/8 (desenfoque barato al ampliarlo)
  const S = 720, x = cv && cv.getContext('2d', { alpha: true });
  const mk = (n) => { const c = document.createElement('canvas'); c.width = c.height = n; return [c, c.getContext('2d')]; };
  const [tc2, tx] = mk(S / 2), [hc, hx] = mk(S / 8), [gc, gx] = mk(S / 2);
  { const g = gx.createRadialGradient(S * .31, S * .295, 0, S * .31, S * .295, S * .3);
    g.addColorStop(0, '#F2FFC2'); g.addColorStop(.22, '#C6FF3D'); g.addColorStop(.5, '#8EF05A'); g.addColorStop(1, '#5BE6B4');
    gx.fillStyle = g; gx.fillRect(0, 0, S / 2, S / 2); }
  const CX = S * .62, CY = S * .59;
  const [vc, vx] = mk(S);                                           // borde redondo suave, se calcula una vez
  { const g = vx.createRadialGradient(S / 2, S / 2, S * .36, S / 2, S / 2, S * .5); g.addColorStop(0, '#000'); g.addColorStop(1, 'rgba(0,0,0,0)'); vx.fillStyle = g; vx.fillRect(0, 0, S, S); }
  const ring = (r0, r1) => { x.beginPath(); x.arc(CX, CY, r1, 0, 6.283); if (r0 > 0) x.arc(CX, CY, r0, 0, 6.283, true); x.clip(); };
  const draw = (p) => {
    const o = Math.min(1, p * 2);
    let lo = 0;
    if (playing && an) {
      an.getByteFrequencyData(fd); for (let i = 1; i < 5; i++) lo += fd[i]; lo /= 4 * 255; idleT = au.currentTime;
    } else if (p > .45) {
      idleT = ((performance.now() - t0) / 1000) % 28;
      lo = +ENV[Math.min(ENV.length - 1, idleT * 30 | 0)] / 9 * .9;
    }
    bass = Math.min(1, Math.max(lo * lo * 1.2, bass * .88));
    avg = avg * .95 + lo * .05;
    if (lo > avg * 1.18 && lo > .35 && performance.now() - lastKick > 220) { lastKick = performance.now(); waves.push({ t: 0, p: Math.min(1, .5 + lo) }); if (waves.length > 3) waves.shift(); }
    if (++fr % 3 === 0) bars.forEach((b, k) => { b.style.transform = `scaleY(${(.2 + (playing && an ? fd[1 + k * 6] / 255 : lo * (1 - k * .2)) * .8).toFixed(2)})`; });

    x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; x.imageSmoothingEnabled = false;
    x.clearRect(0, 0, S, S);
    if (vid.readyState >= 2) x.drawImage(vid, 0, 0, S, S);
    for (let k = waves.length - 1; k >= 0; k--) { waves[k].t += .011; if (waves[k].t >= 1) waves.splice(k, 1); }
    if (waves.length || bass > .03) {
      tx.globalCompositeOperation = 'source-over'; tx.drawImage(vid, 0, 0, S / 2, S / 2);
      tx.globalCompositeOperation = 'multiply'; tx.drawImage(gc, 0, 0);        // negro sigue negro, las estrellas toman el color
      hx.clearRect(0, 0, S / 8, S / 8); hx.drawImage(tc2, 0, 0, S / 8, S / 8);
      x.globalCompositeOperation = 'lighter';
      const lit = (a) => { x.globalAlpha = a; x.imageSmoothingEnabled = false; x.drawImage(tc2, 0, 0, S, S); x.imageSmoothingEnabled = true; x.globalAlpha = a * .9; x.drawImage(hc, 0, 0, S, S); };
      for (const wv of waves) {
        const e = 1 - Math.pow(1 - wv.t, 2.4), R = 8 + e * S * .62, bw = S * (.02 + e * .08);
        x.save(); ring(Math.max(0, R - bw), R + bw); lit((1 - wv.t) * wv.p); x.restore();
      }
      if (bass > .03) { x.save(); ring(0, S * (.03 + bass * .08)); lit(bass); x.restore(); }
    }
    // apertura desde la mano + borde suave redondo
    x.globalCompositeOperation = 'destination-in'; x.globalAlpha = 1;
    if (o < 1) {                                                      // la apertura solo cuesta mientras se abre
      const rr = Math.max(1, o * S * .9), g1 = x.createRadialGradient(CX, CY, rr * .82, CX, CY, rr);
      g1.addColorStop(0, '#000'); g1.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g1; x.fillRect(0, 0, S, S);
    }
    x.drawImage(vc, 0, 0);
  };
  if (sh && cv && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    cv.width = cv.height = S; art.classList.add('cvon');
    let on = false, last = -1, top = 0, span = 1;
    const measure = () => { top = sh.getBoundingClientRect().top + scrollY; span = Math.max(1, sh.offsetHeight - innerHeight); };
    measure(); addEventListener('resize', measure); addEventListener('load', measure);
    const tick = () => {
      if (!on) return;
      const p = Math.min(1, Math.max(0, (scrollY - top) / span));        // sin leer el layout en cada fotograma
      if (Math.abs(p - last) > .0005) { last = p; sh.style.setProperty('--p', p.toFixed(4)); }
      draw(p);
      const t = fmt(70.5 + idleT); if (t !== lastTc) { lastTc = t; tc.textContent = t; }
      requestAnimationFrame(tick);
    };
    new IntersectionObserver(([e]) => {
      on = e.isIntersecting;
      if (on) { measure(); vid.play().catch(() => {}); requestAnimationFrame(tick); } else { vid.pause(); if (au) au.pause(); }
    }).observe(sh);
  }
}

/* separadores: regla de compases, como la línea de tiempo de un DAW */
const rulerNames = ['Producto', 'Cómo funciona', 'Precios', 'Empezar'];
document.querySelectorAll('.ledline').forEach((el, k) => {
  el.className = 'ruler';
  el.innerHTML = `<b>${String(k + 2).padStart(2, '0')}</b><i><u></u></i><em>${rulerNames[k] || ''}</em>`;
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add('go'); io.disconnect(); } }, { threshold: 1 });
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




