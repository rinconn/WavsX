// Datos de ejemplo hasta que haya backend.

// Los estados van de gris claro a negro conforme la canción se acerca a salir.
// "Lista" es el único que usa el acento.
export const STATES = {
  idea:     { name: 'Idea',     color: '#CFCFC9', step: 0 },
  demo:     { name: 'Demo',     color: '#A3A39D', step: 1 },
  grabando: { name: 'Grabando', color: '#77776F', step: 2 },
  mezcla:   { name: 'Mezcla',   color: '#45453F', step: 3 },
  master:   { name: 'Master',   color: '#0E0E0E', step: 4 },
  lista:    { name: 'Lista',    color: '#FF4A1C', step: 5 }
};

export const STATE_ORDER = ['idea', 'demo', 'grabando', 'mezcla', 'master', 'lista'];

// Paleta de portadas de ejemplo (misma familia que la web)
const K = '#0E0E0E', W = '#F4F4F1', A = '#FF4A1C', G = '#BDBDB6', D = '#5E5E58', S = '#E7DFD2', B = '#2A2A27';

// cover: si pones una ruta (p. ej. '/covers/neon.jpg' dentro de /public) se usa la imagen real.
export const SONGS = [
  { title: 'Neón en la M-30', state: 'mezcla',   bpm: 128, key: 'Fm',  dur: '3:24', v: 5, files: 22, c1: A, c2: K, art: 0, edited: 'hace 2 h' },
  { title: 'Madrugada',       state: 'master',   bpm: 92,  key: 'Am',  dur: '2:58', v: 7, files: 17, c1: K, c2: S, art: 5, edited: 'ayer' },
  { title: 'Sin cobertura',   state: 'demo',     bpm: 140, key: 'Gm',  dur: '2:41', v: 2, files: 4,  c1: W, c2: K, art: 2, edited: 'hace 3 días' },
  { title: 'Cristal',         state: 'lista',    bpm: 118, key: 'C♯m', dur: '3:12', v: 9, files: 28, c1: S, c2: A, art: 4, edited: 'hace 5 días' },
  { title: 'Bajo cero',       state: 'grabando', bpm: 85,  key: 'Dm',  dur: '3:47', v: 3, files: 12, c1: G, c2: K, art: 3, edited: 'hoy' },
  { title: 'Kilómetro 0',     state: 'idea',     bpm: 100, key: 'E',   dur: '1:12', v: 1, files: 1,  c1: B, c2: W, art: 0, edited: 'hace 1 semana' },
  { title: 'Humo',            state: 'mezcla',   bpm: 132, key: 'Bm',  dur: '3:05', v: 4, files: 18, c1: D, c2: G, art: 1, edited: 'hace 4 h' },
  { title: 'Polígono',        state: 'demo',     bpm: 150, key: 'F♯m', dur: '2:20', v: 2, files: 4,  c1: A, c2: W, art: 1, edited: 'hace 2 días' },
  { title: 'Lenta',           state: 'master',   bpm: 76,  key: 'E♭m', dur: '4:01', v: 6, files: 18, c1: S, c2: B, art: 5, edited: 'hace 6 días' },
  { title: 'Satélite',        state: 'grabando', bpm: 124, key: 'A♭m', dur: '3:30', v: 3, files: 9,  c1: K, c2: A, art: 2, edited: 'hoy' },
  { title: 'Fuera de plano',  state: 'idea',     bpm: 110, key: 'G',   dur: '0:48', v: 1, files: 1,  c1: W, c2: A, art: 3, edited: 'hace 2 semanas' },
  { title: 'Ultravioleta',    state: 'lista',    bpm: 126, key: 'Cm',  dur: '3:18', v: 8, files: 24, c1: K, c2: G, art: 4, edited: 'hace 1 semana' },
  { title: 'Retrovisor',      state: 'demo',     bpm: 96,  key: 'A',   dur: '2:55', v: 2, files: 4,  c1: G, c2: A, art: 0, edited: 'hace 3 días' },
  { title: 'Última línea',    state: 'mezcla',   bpm: 138, key: 'F',   dur: '3:09', v: 4, files: 16, c1: B, c2: A, art: 3, edited: 'ayer' }
];

// Portadas generadas mientras no hay imágenes reales
export function coverArt(song) {
  if (song.cover) return `url("${song.cover}") center/cover`;
  const { art, c1, c2 } = song;
  switch (art) {
    case 0: return `radial-gradient(circle at 34% 40%, ${c2} 0 28%, transparent 28.5%), ${c1}`;
    case 1: return `repeating-linear-gradient(135deg, ${c1} 0 14px, ${c2} 14px 28px)`;
    case 2: return `radial-gradient(${c2} 2.2px, transparent 2.7px) 0 0/16px 16px, ${c1}`;
    case 3: return `linear-gradient(180deg, ${c1} 0 60%, ${c2} 60% 100%)`;
    case 4: return `conic-gradient(from 200deg at 68% 68%, ${c2} 0 25%, ${c1} 25% 100%)`;
    default: return `radial-gradient(circle at 50% 115%, ${c2} 0 42%, transparent 42.5%), radial-gradient(circle at 50% 115%, ${c1} 0 62%, transparent 62.5%), ${c1 === K ? B : K}`;
  }
}

// Forma de onda falsa (determinista) hasta leer el audio real con Web Audio API
export function waveHeights(seed, n, maxH) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = Math.abs(Math.sin(i * 0.55 + seed) * Math.cos(i * 0.17 + seed * 1.7));
    out.push(Math.max(3, Math.round(3 + a * (maxH - 8) + (Math.sin(i * 1.3 + seed * 3) + 1) * 2.5)));
  }
  return out;
}

export function renderWave(el, heights, played) {
  el.innerHTML = heights
    .map((h, i) => `<span class="${i / heights.length < played ? 'on' : ''}" style="height:${h}px"></span>`)
    .join('');
}

export const ICONS = {
  play: (s = 16) => `<svg aria-hidden="true" width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l10.5-6.5z"/></svg>`,
  pause: (s = 16) => `<svg aria-hidden="true" width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1.2"/><rect x="14" y="5" width="4" height="14" rx="1.2"/></svg>`,
  dots: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>',
  check: '<svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5L20 7"/></svg>'
};
