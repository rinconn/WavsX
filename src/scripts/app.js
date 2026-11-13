import { SONGS, STATES, STATE_ORDER, coverArt, waveHeights, renderWave, ICONS } from './data.js';

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const state = { filter: 'todas', query: '', sort: 'recent', current: 0, playing: false, progress: 0.38 };

/* saludo según la hora */
const h = new Date().getHours();
$('#hello').textContent = `${h < 14 ? 'Buenos días' : h < 21 ? 'Buenas tardes' : 'Buenas noches'}, Kairo`;
$('#release-cover').style.background = coverArt(SONGS[3]);

/* ---------- filtros ---------- */
function renderTabs() {
  const ids = ['todas', ...STATE_ORDER];
  $('#tabs').innerHTML = ids.map((id) => {
    const n = id === 'todas' ? SONGS.length : SONGS.filter((s) => s.state === id).length;
    const dot = id === 'todas' ? '' : `<i style="--c:${STATES[id].color}"></i>`;
    return `<button type="button" class="tab" data-filter="${id}" aria-pressed="${state.filter === id}">${dot}${id === 'todas' ? 'Todas' : STATES[id].name}<span class="num">${n}</span></button>`;
  }).join('');
}

/* ---------- tarjetas ---------- */
function list() {
  const q = state.query.trim().toLowerCase();
  let out = SONGS.map((s, i) => ({ ...s, i }));
  if (state.filter !== 'todas') out = out.filter((s) => s.state === state.filter);
  if (q) out = out.filter((s) => `${s.title} ${s.bpm} ${s.key} ${STATES[s.state].name}`.toLowerCase().includes(q));
  if (state.sort === 'title') out.sort((a, b) => a.title.localeCompare(b.title, 'es'));
  if (state.sort === 'bpm') out.sort((a, b) => a.bpm - b.bpm);
  if (state.sort === 'state') out.sort((a, b) => STATES[b.state].step - STATES[a.state].step);
  return out;
}

function card(s, k) {
  const st = STATES[s.state];
  const on = state.current === s.i && state.playing;
  const steps = STATE_ORDER.map((_, n) => `<span class="${n <= st.step ? 'on' : ''}"></span>`).join('');
  return `
  <article class="card" style="animation-delay:${Math.min(k, 12) * 0.04}s">
    <div class="card__media">
      <div class="card__disc"><div class="disc ${on ? 'spin' : ''}" style="--label:${s.c2 === '#0A0A0D' || s.c2 === '#16161B' ? s.c1 : s.c2}"></div></div>
      <div class="cover" style="background:${coverArt(s)}"></div>
      <a class="card__link" href="/cancion" tabindex="-1" aria-hidden="true"></a>
      <button type="button" class="play card__play ${on ? 'is-on' : ''}" data-play="${s.i}" aria-label="${on ? 'Pausar' : 'Reproducir'} ${esc(s.title)}">${on ? ICONS.pause(18) : ICONS.play(18)}</button>
    </div>
    <div class="card__body">
      <div class="card__row">
        <h3 class="card__title"><a href="/cancion">${esc(s.title)}</a></h3>
        <button type="button" class="icon-btn" aria-label="Más opciones de ${esc(s.title)}" style="width:32px;height:32px">${ICONS.dots}</button>
      </div>
      <div class="card__meta"><span class="status" style="--c:${st.color}">${st.name}</span><span class="num">${s.bpm} BPM</span><span>${s.key}</span><span class="num">${s.dur}</span></div>
      <div class="wave" data-wave="${s.i}" aria-hidden="true"></div>
      <div class="card__foot"><span>v${s.v} · ${s.files} archivos · ${s.edited}</span><span class="steps" style="--c:${st.color}" role="img" aria-label="Paso ${st.step + 1} de 6">${steps}</span></div>
    </div>
  </article>`;
}

function renderGrid(animate = false) {
  const songs = list();
  $('#grid').classList.toggle('no-anim', !animate);
  $('#grid').innerHTML = songs.map(card).join('');
  songs.forEach((s) => {
    const on = state.current === s.i;
    renderWave($(`[data-wave="${s.i}"]`), waveHeights(s.i * 1.9 + 0.7, 44, 22), on ? state.progress : 0);
  });
  $('#empty').hidden = songs.length > 0;
}

/* ---------- reproductor ---------- */
function renderPlayer() {
  const s = SONGS[state.current];
  $('#p-cover').style.background = coverArt(s);
  $('#p-title').textContent = s.title;
  $('#p-sub').textContent = `${STATES[s.state].name} · v${s.v}`;
  $('#p-dur').textContent = s.dur;
  const [m, sec] = s.dur.split(':').map(Number);
  const now = Math.round((m * 60 + sec) * state.progress);
  $('#p-now').textContent = `${Math.floor(now / 60)}:${String(now % 60).padStart(2, '0')}`;
  renderWave($('#p-wave'), waveHeights(state.current * 1.9 + 0.7, 90, 32), state.progress);
  $('#p-play').innerHTML = state.playing ? ICONS.pause(18) : ICONS.play(18);
  $('#p-play').setAttribute('aria-label', state.playing ? 'Pausar' : 'Reproducir');
}

function play(i) {
  if (state.current === i) state.playing = !state.playing;
  else { state.current = i; state.playing = true; state.progress = 0; }
  renderGrid();
  renderPlayer();
}

/* avance simulado mientras "suena" */
setInterval(() => {
  if (!state.playing) return;
  state.progress = Math.min(1, state.progress + 0.004);
  if (state.progress >= 1) { state.current = (state.current + 1) % SONGS.length; state.progress = 0; renderGrid(); }
  renderPlayer();
  const w = $(`[data-wave="${state.current}"]`);
  if (w) renderWave(w, waveHeights(state.current * 1.9 + 0.7, 44, 22), state.progress);
}, 250);

/* ---------- eventos ---------- */
$('#tabs').addEventListener('click', (e) => {
  const b = e.target.closest('[data-filter]');
  if (!b) return;
  state.filter = b.dataset.filter;
  renderTabs();
  renderGrid(true);
});
$('#grid').addEventListener('click', (e) => {
  const b = e.target.closest('[data-play]');
  if (b) play(Number(b.dataset.play));
});
$('#search').addEventListener('input', (e) => { state.query = e.target.value; renderGrid(true); });
$('#sort').addEventListener('change', (e) => { state.sort = e.target.value; renderGrid(true); });
$('#p-play').addEventListener('click', () => play(state.current));
$('#p-prev').addEventListener('click', () => { state.current = (state.current - 1 + SONGS.length) % SONGS.length; state.progress = 0; state.playing = true; renderGrid(); renderPlayer(); });
$('#p-next').addEventListener('click', () => { state.current = (state.current + 1) % SONGS.length; state.progress = 0; state.playing = true; renderGrid(); renderPlayer(); });
$('#p-wave').addEventListener('click', (e) => {
  const r = e.currentTarget.getBoundingClientRect();
  state.progress = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
  renderPlayer();
  renderGrid();
});
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); $('#search').focus(); }
});

renderTabs();
renderGrid(true);
renderPlayer();
