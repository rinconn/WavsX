import { ICONS } from './data.js';

const $ = (s) => document.querySelector(s);

const VERSIONS = [
  { n: 'v1', name: 'Demo móvil', date: '2 sep',     size: '4,1 MB' },
  { n: 'v2', name: 'Demo base',  date: '19 sep',    size: '38 MB' },
  { n: 'v3', name: 'Grabación',  date: '14 oct',    size: '40,6 MB' },
  { n: 'v4', name: 'Mezcla 1',   date: '6 nov',     size: '41,1 MB' },
  { n: 'v5', name: 'Mezcla 2',   date: 'hoy 9:12',  size: '41,3 MB' }
];

const FILES = [
  { name: 'Neon_M30_mezcla_v5.wav',    meta: '24-bit · 48 kHz · 41,3 MB' },
  { name: 'Neon_M30_stems_v5.zip',     meta: '12 pistas · 486 MB' },
  { name: 'Neon_M30_instrumental.wav', meta: '24-bit · 48 kHz · 39,8 MB' },
  { name: 'Neon_M30_acapella.wav',     meta: '24-bit · 48 kHz · 18,2 MB' }
];

const CHECKS = ['Portada 3000 × 3000', 'Letra subida', 'Créditos y reparto', 'Stems exportados', 'Master final en WAV', 'ISRC y fecha de salida'];
const TOTAL = 204; // 3:24 en segundos

const state = { version: 4, playing: false, progress: 0.38, checks: [true, true, true, true, false, false], dl: false };

const ICON_AUDIO = '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 10v4M8 6v12M12 3v18M16 7v10M20 10v4"/></svg>';
const ICON_DL = '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v12M6 10l6 6 6-6M4 20h16"/></svg>';

const fmt = (sec) => `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')}`;

/* ---------- versiones ---------- */
function renderVersions() {
  $('#versions').innerHTML = VERSIONS.map((v, i) =>
    `<button type="button" class="tab" data-v="${i}" aria-pressed="${state.version === i}"><b>${v.n}</b>${v.name}</button>`
  ).join('');
  const v = VERSIONS[state.version];
  $('#ver-meta').textContent = `${v.n} · ${v.date} · ${v.size}`;
}

/* ---------- forma de onda ---------- */
let heights = [];
function buildWave() {
  const n = 150, seed = state.version * 2.3 + 0.9;
  heights = [];
  for (let i = 0; i < n; i++) {
    const env = state.version === 0 ? 0.55 : 0.72 + 0.28 * Math.sin((i / n) * Math.PI);
    const a = Math.abs(Math.sin(i * 0.41 + seed) * Math.cos(i * 0.13 + seed * 1.6));
    heights.push(Math.max(4, Math.round((10 + a * 82 + (Math.sin(i * 1.7 + seed) + 1) * 5) * env)));
  }
}
function paintWave() {
  $('#wave').innerHTML = heights.map((h, i) => `<span class="${i / heights.length < state.progress ? 'on' : ''}" style="height:${h}px"></span>`).join('');
  $('#now').textContent = fmt(TOTAL * state.progress);
}

function renderPlay() {
  $('#play').innerHTML = state.playing ? ICONS.pause(22) : ICONS.play(22);
  $('#play').setAttribute('aria-label', state.playing ? 'Pausar' : 'Reproducir');
  $('#disc').classList.toggle('spin', state.playing);
}

/* ---------- archivos ---------- */
$('#files').innerHTML = FILES.map((f) => `
  <li>
    <span class="files__ic">${ICON_AUDIO}</span>
    <div class="files__name"><b>${f.name}</b><small class="num">${f.meta}</small></div>
    <button type="button" class="icon-btn" aria-label="Descargar ${f.name}">${ICON_DL}</button>
  </li>`).join('');

/* ---------- checklist ---------- */
function renderChecks() {
  $('#checks').innerHTML = CHECKS.map((label, i) => `
    <li><button type="button" class="check" data-c="${i}" aria-pressed="${state.checks[i]}">
      <span class="check__box" aria-hidden="true">${state.checks[i] ? ICONS.check : ''}</span>
      <span class="check__text">${label}</span></button></li>`).join('');
  const done = state.checks.filter(Boolean).length;
  $('#count').textContent = `${done} de ${CHECKS.length}`;
  $('#bar').style.width = `${(done / CHECKS.length) * 100}%`;
}

/* ---------- eventos ---------- */
$('#versions').addEventListener('click', (e) => {
  const b = e.target.closest('[data-v]');
  if (!b) return;
  state.version = Number(b.dataset.v);
  renderVersions(); buildWave(); paintWave();
});
$('#play').addEventListener('click', () => { state.playing = !state.playing; renderPlay(); });
$('#wave').addEventListener('click', (e) => {
  const r = e.currentTarget.getBoundingClientRect();
  state.progress = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
  paintWave();
});
$('#checks').addEventListener('click', (e) => {
  const b = e.target.closest('[data-c]');
  if (!b) return;
  const i = Number(b.dataset.c);
  state.checks[i] = !state.checks[i];
  renderChecks();
});
$('#copy').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText('https://' + $('#url').textContent); } catch { /* sin permiso */ }
  $('#copy').textContent = 'Copiado';
  setTimeout(() => { $('#copy').textContent = 'Copiar'; }, 1600);
});
$('#dl').addEventListener('click', () => { state.dl = !state.dl; $('#dl').setAttribute('aria-pressed', state.dl); });

setInterval(() => {
  if (!state.playing) return;
  state.progress = state.progress >= 1 ? 0 : state.progress + 1 / (TOTAL * 4);
  paintWave();
}, 250);

renderVersions(); buildWave(); paintWave(); renderPlay(); renderChecks();
