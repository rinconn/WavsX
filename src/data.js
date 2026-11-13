// Datos de ejemplo hasta que haya backend.

export const STATES = {
  idea:     { name: 'Idea',     label: 'IDEA',     color: '#A3ABC6', step: 0 },
  demo:     { name: 'Demo',     label: 'DEMO',     color: '#6FA8FF', step: 1 },
  grabando: { name: 'Grabando', label: 'GRABANDO', color: '#B49BFF', step: 2 },
  mezcla:   { name: 'Mezcla',   label: 'MEZCLA',   color: '#FFC24D', step: 3 },
  master:   { name: 'Master',   label: 'MASTER',   color: '#FF4FD8', step: 4 },
  lista:    { name: 'Lista',    label: 'LISTA',    color: '#3DF5FF', step: 5 }
};

export const STATE_ORDER = ['idea', 'demo', 'grabando', 'mezcla', 'master', 'lista'];

// art: estilo de portada generada (0–5) · c1/c2: colores de portada · c2 también es la etiqueta del vinilo
export const SONGS = [
  { title: 'Neón en la M-30', state: 'mezcla',   bpm: 128, key: 'Fm',  dur: '03:24', wav: 4, stems: 12, img: 6, v: 5, c1: '#FF3D6E', c2: '#FFD23F', art: 0, edited: 'HACE 2 H' },
  { title: 'Madrugada',       state: 'master',   bpm: 92,  key: 'Am',  dur: '02:58', wav: 3, stems: 9,  img: 4, v: 7, c1: '#14205A', c2: '#6FA8FF', art: 5, edited: 'AYER' },
  { title: 'Sin cobertura',   state: 'demo',     bpm: 140, key: 'Gm',  dur: '02:41', wav: 2, stems: 0,  img: 1, v: 2, c1: '#0B0D16', c2: '#3DF5FF', art: 2, edited: 'HACE 3 D' },
  { title: 'Cristal',         state: 'lista',    bpm: 118, key: 'C♯m', dur: '03:12', wav: 5, stems: 14, img: 8, v: 9, c1: '#BDF3FF', c2: '#2B59FF', art: 4, edited: 'HACE 5 D' },
  { title: 'Bajo cero',       state: 'grabando', bpm: 85,  key: 'Dm',  dur: '03:47', wav: 6, stems: 4,  img: 2, v: 3, c1: '#0B2F3A', c2: '#3DF5FF', art: 3, edited: 'HOY' },
  { title: 'Kilómetro 0',     state: 'idea',     bpm: 100, key: 'E',   dur: '01:12', wav: 1, stems: 0,  img: 0, v: 1, c1: '#1A1F33', c2: '#B49BFF', art: 0, edited: 'HACE 1 SEM' },
  { title: 'Humo',            state: 'mezcla',   bpm: 132, key: 'Bm',  dur: '03:05', wav: 4, stems: 11, img: 3, v: 4, c1: '#20243A', c2: '#8A93B0', art: 1, edited: 'HACE 4 H' },
  { title: 'Polígono',        state: 'demo',     bpm: 150, key: 'F♯m', dur: '02:20', wav: 2, stems: 0,  img: 2, v: 2, c1: '#FFC24D', c2: '#120C02', art: 1, edited: 'HACE 2 D' },
  { title: 'Lenta',           state: 'master',   bpm: 76,  key: 'E♭m', dur: '04:01', wav: 3, stems: 10, img: 5, v: 6, c1: '#3A0A33', c2: '#FF4FD8', art: 5, edited: 'HACE 6 D' },
  { title: 'Satélite',        state: 'grabando', bpm: 124, key: 'A♭m', dur: '03:30', wav: 5, stems: 3,  img: 1, v: 3, c1: '#07070F', c2: '#B49BFF', art: 2, edited: 'HOY' },
  { title: 'Fuera de plano',  state: 'idea',     bpm: 110, key: 'G',   dur: '00:48', wav: 1, stems: 0,  img: 0, v: 1, c1: '#EAF2FF', c2: '#FF3D6E', art: 3, edited: 'HACE 2 SEM' },
  { title: 'Ultravioleta',    state: 'lista',    bpm: 126, key: 'Cm',  dur: '03:18', wav: 4, stems: 13, img: 7, v: 8, c1: '#22094F', c2: '#FF4FD8', art: 4, edited: 'HACE 1 SEM' },
  { title: 'Retrovisor',      state: 'demo',     bpm: 96,  key: 'A',   dur: '02:55', wav: 2, stems: 0,  img: 1, v: 2, c1: '#05231A', c2: '#5CFFA8', art: 0, edited: 'HACE 3 D' },
  { title: 'Última línea',    state: 'mezcla',   bpm: 138, key: 'F',   dur: '03:09', wav: 4, stems: 10, img: 2, v: 4, c1: '#0B0D16', c2: '#FF3D6E', art: 3, edited: 'AYER' }
];

// Portadas generadas con CSS mientras no hay imágenes reales
export function coverArt(type, c1, c2) {
  switch (type) {
    case 0: return `radial-gradient(circle at 32% 38%, ${c2} 0 30%, transparent 30.5%), ${c1}`;
    case 1: return `repeating-linear-gradient(135deg, ${c1} 0 16px, ${c2} 16px 32px)`;
    case 2: return `radial-gradient(${c2} 2.5px, transparent 3px) 0 0/18px 18px, ${c1}`;
    case 3: return `linear-gradient(180deg, ${c1} 0 58%, ${c2} 58% 100%)`;
    case 4: return `conic-gradient(from 200deg at 70% 70%, ${c2} 0 25%, ${c1} 25% 100%)`;
    default: return `radial-gradient(circle at 50% 115%, ${c2} 0 42%, transparent 42.5%), radial-gradient(circle at 50% 115%, ${c1} 0 62%, transparent 62.5%), #0B0D16`;
  }
}

// Forma de onda falsa (determinista) hasta que se lea el audio real con Web Audio API
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
  play: '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
  pause: '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>',
  dots: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>',
  check: '<svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5L20 7"/></svg>'
};
