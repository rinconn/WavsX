import { createVinyl } from './vinyl.js';
import { createSynth } from './synth.js';
import { SONGS, STATES, coverArt, waveHeights, renderWave } from './data.js';

const $ = (s) => document.querySelector(s);
const wide = window.matchMedia('(min-width: 901px)').matches;

/* ---------- 1 · vinilo + sonido ---------- */
const pos = wide ? { cx: 0.7, cy: 0.48, size: 0.3 } : { cx: 0.5, cy: 0.3, size: 0.42 };
const hero = $('.hero');
hero.style.setProperty('--vx', `${pos.cx * 100}%`);
hero.style.setProperty('--vy', `${pos.cy * 100}%`);
const vinyl = createVinyl($('#vinyl'), pos);
const synth = createSynth({ bpm: 128 });
vinyl.setAudio(synth);

const playBtn = $('#deck-play');
async function toggle() {
  if (synth.playing) synth.stop();
  else await synth.start();
  const on = synth.playing;
  playBtn.setAttribute('aria-pressed', String(on));
  playBtn.setAttribute('aria-label', on ? 'Parar la demo' : 'Escuchar la demo');
  $('#deck-hint').textContent = on ? 'Sonando · 128 BPM' : 'Pulsa y escúchalo';
  $('#np-text').textContent = on ? 'Neón en la M-30 · demo en vivo' : '128 BPM · en reposo';
  document.body.classList.toggle('is-playing', on);
}
playBtn.addEventListener('click', toggle);
$('#vinyl').addEventListener('click', toggle);
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && e.target === document.body && window.scrollY < window.innerHeight) { e.preventDefault(); toggle(); }
});

/* subtítulo palabra a palabra */
document.querySelectorAll('[data-words]').forEach((el) => {
  const text = el.textContent.trim();
  el.setAttribute('aria-label', text);
  el.innerHTML = text.split(/\s+/)
    .map((w, i) => `<span class="w" aria-hidden="true" style="animation-delay:${0.5 + i * 0.045}s">${w} </span>`)
    .join('');
});

/* ---------- 2 · panel en 3D ---------- */
const mock = $('#mock');
const picks = [0, 3, 1, 9, 6, 11, 2, 7];
mock.innerHTML = `
  <div class="mock__side">
    <span class="logo" data-logo>wavsX</span>
    <span class="on">Canciones</span><span>Discos y EPs</span><span>Lanzamientos</span><span>Compartido</span>
  </div>
  <div class="mock__main">
    <div class="mock__top"><b>Tus canciones</b><span class="mock__search"></span><span class="mock__new">+ Nueva</span></div>
    <div class="mock__release"><div class="cover" style="background:${coverArt(SONGS[3])}"></div><div><span class="muted">Próximo lanzamiento</span><b>Cristal · 28 nov</b></div><strong class="num">15 días</strong></div>
    <div class="mock__grid">
      ${picks.map((i, n) => {
        const s = SONGS[i];
        const st = STATES[s.state];
        return `<div class="mcard">
          <div class="mcard__media"><div class="disc ${n === 0 ? 'mock-spin' : ''}" style="--label:${s.c2}"></div><div class="cover" style="background:${coverArt(s)}"></div></div>
          <b>${s.title}</b><span class="status" style="--c:${st.color}">${st.name}</span>
          <div class="wave" data-mw="${i}"></div>
        </div>`;
      }).join('')}
    </div>
  </div>`;
// el logo del mock: copia el del menú (logo.js ya se ejecutó antes)
const mark = document.querySelector('.nav .logo__mark');
if (mark) mock.querySelector('[data-logo]').prepend(mark.cloneNode(true));
picks.forEach((i, n) => renderWave(mock.querySelector(`[data-mw="${i}"]`), waveHeights(i * 1.9 + 0.7, 30, 14), n === 0 ? 0.4 : 0));

/* ---------- 3 · historia por pasos ---------- */
const steps = [...document.querySelectorAll('#steps li')];
const scenes = [...document.querySelectorAll('.scene')];
const STATUS = ['Demo · v1', 'Mezcla · v5', 'Mezcla · v5 · compartida', 'Lista para salir'];
$('#sc-cover').style.background = coverArt(SONGS[0]);
renderWave($('#story-wave'), waveHeights(3.1, 70, 96), 0.42);
let activeStep = 0;
function setStep(i) {
  if (i === activeStep) return;
  activeStep = i;
  steps.forEach((li, n) => li.classList.toggle('is-active', n === i));
  scenes.forEach((s, n) => s.classList.toggle('is-active', n === i));
  const st = $('#sc-status');
  st.textContent = STATUS[i];
  st.classList.toggle('is-ready', i === 3);
}

/* ---------- 4 · vinilo del cierre ---------- */
const v2 = createVinyl($('#vinyl2'), { cx: 0.5, cy: 0.98, size: 0.44, tilt: 1.3, follow: false, rings: 46 });
v2.setAudio(synth);

/* ---------- scroll ---------- */
const inside = $('.inside');
const story = $('.story');
const rail = $('#rail');
const clamp = (v) => Math.max(0, Math.min(1, v));
function progress(el) {
  const r = el.getBoundingClientRect();
  return clamp(-r.top / (r.height - window.innerHeight));
}
function onScroll() {
  mock.style.setProperty('--p', Math.min(1, progress(inside) * 1.6).toFixed(3));
  if (wide) {
    const p = progress(story);
    rail.style.width = `${p * 100}%`;
    setStep(Math.min(3, Math.floor(p * 4)));
  }
}
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll);
onScroll();
