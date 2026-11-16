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
  lt0 = 0; tlI = -1;
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
const CT = ['Foto', 'Diseño', 'GIF · bucle', 'Vídeo · 0:08'];
let covI = 0, covLast = 0, covLock = 0;
const setCov = (n) => {
  covI = n; cv.dataset.k = n; cvt.textContent = CT[n];
  cms.forEach((m, k) => m.classList.toggle('on', k === n));
  const bg = getComputedStyle(cms[n]).backgroundImage; $$('.mini').forEach((m) => { m.style.backgroundImage = bg; });
  $$('.v').forEach((x, k) => x.classList.toggle('on', k === n));
  if (cv.animate && !still) cms[n].animate([{ opacity: 0, scale: '1.08' }, { opacity: 1, scale: '1' }], { duration: 550, easing: 'cubic-bezier(.2,.8,.2,1)' });
};
if (!still) {
  cv.addEventListener('pointermove', (e) => { const r = cv.getBoundingClientRect(); cv.style.setProperty('--ry', ((e.clientX - r.left) / r.width - .5) * 14 + 'deg'); cv.style.setProperty('--rx', (.5 - (e.clientY - r.top) / r.height) * 14 + 'deg'); });
  cv.addEventListener('pointerleave', () => { cv.style.setProperty('--rx', '0deg'); cv.style.setProperty('--ry', '0deg'); });
}
setCov(0);
$$('.v').forEach((b) => b.addEventListener('click', () => { setCov(+b.dataset.c); covLock = performance.now() + 9000; }));

/* letra */
const ls = $$('.l');
let lt0 = 0;
/* versiones */
const V = [
  ['v1', 'demo del móvil', '12 mar', 'Primera idea grabada con el móvil · 3:12 · 6 MB'],
  ['v3', 'maqueta con bajo', '28 mar', 'Entra el bajo y se cierra la estructura · 4:41 · 48 MB'],
  ['v5', 'mezcla con voz nueva', '2 jun', 'Voz regrabada en estudio · comentario de Marcos en 0:48'],
  ['v7', 'mezcla final', '19 sep', 'Aprobada por todos · 24-bit / 48 kHz · 5:04'],
  ['v9', 'master', 'hoy', 'Listo para distribuidora · -9,4 LUFS · 87 MB'],
];
const nodes = $('.tl__nodes');
if (nodes) nodes.innerHTML = V.map((v, i) => `<button type="button" class="tn" data-i="${i}"><b>${v[0]}</b><small>${v[2]}</small></button>`).join('');
let tlI = -1;
const setV = (i) => {
  tlI = i;
  $$('.tn').forEach((b, k) => { b.classList.toggle('on', k === i); b.classList.toggle('past', k < i); });
  $('.tl').style.setProperty('--w', (i / (V.length - 1)) * 100 + '%');
  const c = $('.tl__card');
  c.children[0].textContent = `${V[i][0]} · ${V[i][1]}`; c.children[1].textContent = V[i][3]; c.children[2].textContent = V[i][2];
};
$$('.tn').forEach((b) => b.addEventListener('click', () => { setV(+b.dataset.i); lt0 = performance.now() + 5000; }));
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
    if (t > covLock && t - covLast > 3800) { covLast = t; setCov((covI + 1) % 4); }
  } else if (cur === 3) {
    if (!lt0) lt0 = t;
    const e = (t - lt0) / 1000, i = Math.min(2, Math.floor(e / 3.4) % 3), f = Math.min(1, (e % 3.4) / 2.4);
    ls.forEach((el, k) => { el.classList.toggle('now', k === i); el.classList.toggle('done', k < i); el.style.setProperty('--f', k === i ? f * 100 + '%' : '0%'); });
    if (e > 10.2) lt0 = t;
  } else if (cur === 5 && !still) {
    if (!lt0) lt0 = t;
    if (t - lt0 > 2800) { lt0 = t; setV((tlI + 1) % V.length); }
  }
  requestAnimationFrame(frame);
};
if (spec) requestAnimationFrame(frame);

/* ---------- 3 · historia por pasos ---------- */
const steps = $$('#steps li');
steps.forEach((li) => {
  const [ic, text] = li.dataset.sticker.split('|');
  li.insertAdjacentHTML('afterbegin', sticker({ icon: ic, text, color: li.style.getPropertyValue('--sc'), size: 80 }));
});
const scenes = $$('.scene');
const dots = $$('#dots i');
const STAGE = [
  { status: 'Demo · v1', icon: 'subir', c: 1 },
  { status: 'Mezcla · v5', icon: 'versiones', c: 2 },
  { status: 'Mezcla · v5 · compartida', icon: 'escucha', c: 3 },
  { status: 'Lista para salir', icon: 'lanzar', c: 4 }
];
const stage = $('#stage');
renderWave($('#story-wave'), waveHeights(3.1, 70, 96), 0.42);
let active = -1;
function setStep(i) {
  if (i === active) return;
  active = i;
  steps.forEach((li, n) => li.classList.toggle('is-active', n === i));
  scenes.forEach((s, n) => s.classList.toggle('is-active', n === i));
  dots.forEach((d, n) => d.classList.toggle('on', n === i));
  const s = STAGE[i];
  $('#sc-status').textContent = s.status;
  $('#sc-badge').innerHTML = icon(s.icon, 20);
  stage.style.setProperty('--stage', `var(--c${s.c})`);
  stage.style.setProperty('--stage-rgb', `var(--c${s.c}-rgb)`);
}
setStep(0);
steps.forEach((li, n) => li.addEventListener('click', () => {
  if (!wide) return;
  const story = $('.story');
  const top = story.offsetTop + (story.offsetHeight - innerHeight) * ((n + 0.5) / 4);
  smooth.to(top);
}));

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
const story = $('.story');
const navLinks = $$('.nav__links a');
const sections = navLinks.map((a) => $(a.getAttribute('href')));
const clamp = (v) => Math.max(0, Math.min(1, v));
function onScroll() {
  const max = document.documentElement.scrollHeight - innerHeight;
  $('#read').style.setProperty('--read', (scrollY / max).toFixed(4));

  let here = -1;
  sections.forEach((sec, n) => { if (sec && sec.getBoundingClientRect().top < innerHeight * 0.5) here = n; });
  navLinks.forEach((a, n) => a.classList.toggle('is-here', n === here));

  if (wide) {
    const r = story.getBoundingClientRect();
    const p = clamp(-r.top / (r.height - innerHeight));
    setStep(Math.min(3, Math.floor(p * 4)));
  }
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
