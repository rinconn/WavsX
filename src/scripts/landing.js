import { createField } from './field.js';
import { createDome } from './dome.js';
import { createWaveField } from './wavefield.js';
import { icon, sticker } from './icons.js';
import { waveHeights, renderWave } from './data.js';

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const wide = window.matchMedia('(min-width: 901px)').matches;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* iconos propios en todos los [data-icon] */
$$('[data-icon]').forEach((el) => {
  const big = el.classList.contains('keep__ico');
  el.innerHTML = icon(el.dataset.icon, big ? 26 : 20);
});

/* ---------- 1 · hero: campo de vinilos ---------- */
const heroOpt = new URLSearchParams(location.search).get('hero');
if (heroOpt === 'c' || heroOpt === 'd') {
  $('.hero').hidden = true;
  $('.heroC').hidden = false;
  if (heroOpt === 'c') { $('#wavefield').remove(); createDome($('#dome')); }
  else { $('#dome').remove(); createWaveField($('#wavefield')); }
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

/* ---------- 2 · foco que sigue al ratón en las tarjetas ---------- */
$$('.keep').forEach((card) => {
  card.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
});

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
  window.scrollTo({ top, behavior: 'smooth' });
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
