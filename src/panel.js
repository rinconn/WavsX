import { SONGS, STATES, STATE_ORDER, coverArt, waveHeights, renderWave, ICONS } from './data.js';

const state = {
  filter: 'todas',
  query: '',
  sort: 'recent',
  playing: 0,      // índice en SONGS
  isPlaying: true
};

const $ = (sel) => document.querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- reloj de la barra de estado ---------- */
function tickClock() {
  const d = new Date();
  const day = d.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  $('#clock').textContent = `${day} · ${time}`.toUpperCase().replace(/\./g, '');
}

/* ---------- pipeline ---------- */
function renderPipeline() {
  const counts = STATE_ORDER.map((id) => ({ id, n: SONGS.filter((s) => s.state === id).length }));
  $('#pipe-bar').innerHTML = counts
    .map(({ id, n }) => `<span style="flex:${n};background:${STATES[id].color};box-shadow:0 0 10px ${STATES[id].color}66"></span>`)
    .join('');
  $('#pipe-bar').setAttribute('aria-label', 'Reparto por estado: ' + counts.map(({ id, n }) => `${n} ${STATES[id].name.toLowerCase()}`).join(', '));
  $('#pipe-legend').innerHTML = counts
    .map(({ id, n }) => `<span><i style="background:${STATES[id].color}"></i>${STATES[id].name} <span style="color:var(--muted)">${n}</span></span>`)
    .join('');
}

/* ---------- filtros ---------- */
function renderFilters() {
  const ids = ['todas', ...STATE_ORDER];
  $('#filters').innerHTML = ids.map((id) => {
    const name = id === 'todas' ? 'Todas' : STATES[id].name;
    const color = id === 'todas' ? 'var(--text)' : STATES[id].color;
    const n = id === 'todas' ? SONGS.length : SONGS.filter((s) => s.state === id).length;
    return `<button type="button" class="pill" data-filter="${id}" aria-pressed="${state.filter === id}" style="--c:${color}">
      <i class="dot" aria-hidden="true"></i>${name}<span class="pill__n">${n}</span></button>`;
  }).join('');
}

/* ---------- tarjetas ---------- */
function visibleSongs() {
  const q = state.query.trim().toLowerCase();
  let list = SONGS.map((s, i) => ({ ...s, i }));
  if (state.filter !== 'todas') list = list.filter((s) => s.state === state.filter);
  if (q) list = list.filter((s) => `${s.title} ${s.bpm} ${s.key} ${STATES[s.state].name}`.toLowerCase().includes(q));
  if (state.sort === 'title') list.sort((a, b) => a.title.localeCompare(b.title, 'es'));
  if (state.sort === 'bpm') list.sort((a, b) => a.bpm - b.bpm);
  if (state.sort === 'state') list.sort((a, b) => STATES[b.state].step - STATES[a.state].step);
  return list;
}

function cardHTML(s) {
  const st = STATES[s.state];
  const on = state.playing === s.i && state.isPlaying;
  const segs = STATE_ORDER.map((_, k) => `<span class="${k <= st.step ? 'on' : ''} ${k === st.step ? 'cur' : ''}"></span>`).join('');
  const num = String(s.i + 1).padStart(2, '0');
  return `
  <article class="card" style="--c:${st.color}">
    <div class="card__art">
      <div class="card__slide"><div class="disc ${on ? 'spin' : ''}" style="--label:${s.c2}" aria-hidden="true"></div></div>
      <div class="cover" style="background:${coverArt(s.art, s.c1, s.c2)}">
        <div class="scan"></div>
        <span class="mono card__trk">TRK ${num}</span>
        <button type="button" class="card__play ${on ? 'is-on' : ''}" data-play="${s.i}" aria-label="${on ? 'Pausar' : 'Reproducir'} ${esc(s.title)}">${on ? ICONS.pause : ICONS.play}</button>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:6px">
      <div class="card__row">
        <a class="card__title" href="/cancion.html">${esc(s.title)}</a>
        <span class="badge"><i class="dot" aria-hidden="true"></i>${st.label}</span>
      </div>
      <span class="card__meta">${s.bpm} BPM · ${s.key} · ${s.dur}</span>
    </div>
    <div class="wave ${on ? 'glow' : ''}" data-wave="${s.i}" style="height:30px" aria-hidden="true"></div>
    <div class="segs" role="img" aria-label="Estado ${st.name}, paso ${st.step + 1} de 6">${segs}</div>
    <div class="chips">
      <span class="chip">WAV ${s.wav}</span>
      <span class="chip">STEMS ${s.stems || '—'}</span>
      <span class="chip">IMG ${s.img || '—'}</span>
      <span class="chip">V${s.v}</span>
    </div>
    <div class="card__foot">
      <span class="mono" style="font-size:11px;color:var(--muted)">EDIT. ${s.edited}</span>
      <button type="button" class="icon-btn icon-btn--ghost" aria-label="Más opciones de ${esc(s.title)}" style="height:32px">${ICONS.dots}</button>
    </div>
  </article>`;
}

function renderGrid() {
  const list = visibleSongs();
  $('#grid').innerHTML = list.map(cardHTML).join('');
  list.forEach((s) => {
    const on = state.playing === s.i && state.isPlaying;
    renderWave(document.querySelector(`[data-wave="${s.i}"]`), waveHeights(s.i * 1.9 + 0.7, 40, 30), on ? 0.38 : 1);
  });
  $('#shown').textContent = list.length;
  $('#empty').hidden = list.length > 0;
}

/* ---------- reproductor lateral ---------- */
function renderNowPlaying() {
  const s = SONGS[state.playing];
  const st = STATES[s.state];
  $('#np-thumb').style.background = coverArt(s.art, s.c1, s.c2);
  $('#np-thumb').style.boxShadow = `0 0 18px ${s.c2}66`;
  $('#np-title').textContent = s.title;
  $('#np-meta').textContent = `${st.label} · v${s.v} · ${s.bpm} BPM`;
  $('#np-dur').textContent = s.dur;
  renderWave($('#np-wave'), waveHeights(state.playing * 1.9 + 0.7, 48, 34), 0.38);
  const btn = $('#np-play');
  btn.innerHTML = state.isPlaying ? ICONS.pause : ICONS.play;
  btn.setAttribute('aria-label', state.isPlaying ? 'Pausar' : 'Reproducir');
}

function render() {
  renderFilters();
  renderGrid();
  renderNowPlaying();
}

/* ---------- eventos ---------- */
$('#filters').addEventListener('click', (e) => {
  const b = e.target.closest('[data-filter]');
  if (!b) return;
  state.filter = b.dataset.filter;
  render();
});

$('#grid').addEventListener('click', (e) => {
  const b = e.target.closest('[data-play]');
  if (!b) return;
  const i = Number(b.dataset.play);
  if (state.playing === i) state.isPlaying = !state.isPlaying;
  else { state.playing = i; state.isPlaying = true; }
  render();
});

$('#search').addEventListener('input', (e) => { state.query = e.target.value; renderGrid(); });
$('#sort').addEventListener('change', (e) => { state.sort = e.target.value; renderGrid(); });

$('#np-play').addEventListener('click', () => { state.isPlaying = !state.isPlaying; render(); });
$('#np-prev').addEventListener('click', () => { state.playing = (state.playing - 1 + SONGS.length) % SONGS.length; state.isPlaying = true; render(); });
$('#np-next').addEventListener('click', () => { state.playing = (state.playing + 1) % SONGS.length; state.isPlaying = true; render(); });

// ⌘K / Ctrl+K enfoca el buscador
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); $('#search').focus(); }
});

tickClock();
setInterval(tickClock, 30_000);
renderPipeline();
render();
