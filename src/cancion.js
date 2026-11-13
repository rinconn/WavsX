import { ICONS } from './data.js';

const $ = (sel) => document.querySelector(sel);

const VERSIONS = [
  { n: 'V1', short: 'Demo móvil', name: 'Demo voz (móvil)',        date: '02 SEP',    size: '4.1 MB' },
  { n: 'V2', short: 'Demo base',  name: 'Demo con base',           date: '19 SEP',    size: '38.0 MB' },
  { n: 'V3', short: 'Grabación',  name: 'Grabación final',         date: '14 OCT',    size: '40.6 MB' },
  { n: 'V4', short: 'Mezcla 1',   name: 'Mezcla 1',                date: '06 NOV',    size: '41.1 MB' },
  { n: 'V5', short: 'Mezcla 2',   name: 'Mezcla 2 · revisión voz', date: 'HOY 09:12', size: '41.3 MB' }
];

const FILES = [
  { name: 'Neon_M30_mezcla_v5.wav',    meta: '24-bit · 48 kHz · 41.3 MB', kind: 'wav' },
  { name: 'Neon_M30_stems_v5.zip',     meta: '12 pistas · 486 MB',        kind: 'zip' },
  { name: 'Neon_M30_instrumental.wav', meta: '24-bit · 48 kHz · 39.8 MB', kind: 'wav' },
  { name: 'Neon_M30_acapella.wav',     meta: '24-bit · 48 kHz · 18.2 MB', kind: 'wav' }
];

const CHECKS = ['Portada 3000 × 3000', 'Letra subida', 'Créditos y reparto', 'Stems exportados', 'Master final en WAV', 'ISRC y fecha de salida'];

const state = { version: 4, playing: false, checks: [true, true, true, true, false, false], dl: false };

const FILE_ICON = {
  wav: '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 10v4M8 6v12M12 3v18M16 7v10M20 10v4"/></svg>',
  zip: '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>'
};
const DOWNLOAD = '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v12M6 10l6 6 6-6M4 20h16"/></svg>';

/* ---------- versiones + forma de onda ---------- */
function renderVersions() {
  $('#versions').innerHTML = VERSIONS.map((v, i) =>
    `<button type="button" class="version" data-v="${i}" aria-pressed="${state.version === i}"><b>${v.n}</b><span>${v.short}</span></button>`
  ).join('');
  const cur = VERSIONS[state.version];
  $('#cur-version').textContent = `${cur.n} — ${cur.name}`;
  $('#cur-meta').textContent = `${cur.date} · ${cur.size}`;
}

function renderWave() {
  const n = 140;
  const seed = state.version * 2.3 + 0.9;
  let html = '';
  for (let i = 0; i < n; i++) {
    const env = state.version === 0 ? 0.55 : 0.75 + 0.25 * Math.sin((i / n) * Math.PI);
    const a = Math.abs(Math.sin(i * 0.41 + seed) * Math.cos(i * 0.13 + seed * 1.6));
    const h = Math.max(4, Math.round((10 + a * 90 + (Math.sin(i * 1.7 + seed) + 1) * 6) * env));
    html += `<span class="${i / n < 0.38 ? 'on' : ''}" style="height:${h}px"></span>`;
  }
  $('#wave').innerHTML = html;
}

function renderPlay() {
  const btn = $('#play');
  btn.innerHTML = state.playing ? ICONS.pause.replace(/16/g, '22') : ICONS.play.replace(/16/g, '22');
  btn.setAttribute('aria-label', state.playing ? 'Pausar' : 'Reproducir');
  $('#disc').classList.toggle('spin', state.playing);
}

/* ---------- archivos ---------- */
function renderFiles() {
  $('#files').innerHTML = FILES.map((f) => {
    const color = f.kind === 'zip' ? '#B49BFF' : 'var(--cyan)';
    const bg = f.kind === 'zip' ? 'rgba(139,124,255,0.12)' : 'rgba(61,245,255,0.1)';
    return `<li>
      <span class="files__ic" style="color:${color};background:${bg}">${FILE_ICON[f.kind]}</span>
      <div class="files__name"><span>${f.name}</span><span>${f.meta}</span></div>
      <button type="button" class="icon-btn icon-btn--ghost" aria-label="Descargar ${f.name}">${DOWNLOAD}</button>
    </li>`;
  }).join('');
}

/* ---------- checklist ---------- */
function renderChecks() {
  $('#checks').innerHTML = CHECKS.map((label, i) =>
    `<li><button type="button" class="check" data-check="${i}" aria-pressed="${state.checks[i]}">
      <span class="check__box" aria-hidden="true">${state.checks[i] ? ICONS.check : ''}</span>
      <span class="check__text">${label}</span></button></li>`
  ).join('');
  const done = state.checks.filter(Boolean).length;
  $('#check-count').textContent = `${done}/${CHECKS.length}`;
  $('#check-bar').style.width = `${Math.round((done / CHECKS.length) * 100)}%`;
}

/* ---------- eventos ---------- */
$('#versions').addEventListener('click', (e) => {
  const b = e.target.closest('[data-v]');
  if (!b) return;
  state.version = Number(b.dataset.v);
  renderVersions();
  renderWave();
});

$('#play').addEventListener('click', () => { state.playing = !state.playing; renderPlay(); });

$('#checks').addEventListener('click', (e) => {
  const b = e.target.closest('[data-check]');
  if (!b) return;
  const i = Number(b.dataset.check);
  state.checks[i] = !state.checks[i];
  renderChecks();
});

$('#copy').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText('https://' + $('#share-url').textContent); } catch { /* sin permiso de portapapeles */ }
  $('#copy').textContent = 'Copiado ✓';
  setTimeout(() => { $('#copy').textContent = 'Copiar'; }, 1800);
});

$('#dl').addEventListener('click', () => {
  state.dl = !state.dl;
  $('#dl').setAttribute('aria-pressed', state.dl);
});

renderVersions();
renderWave();
renderPlay();
renderFiles();
renderChecks();
