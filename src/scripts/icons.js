// Iconos propios de WavsX (24×24, trazo redondeado) y pegatinas de pasos.
// Uso: icon('wav') → <svg>…</svg> · sticker({ icon, text, color }) → pegatina con texto girando

const P = {
  subir:     '<circle cx="12" cy="14.5" r="6.5"/><circle cx="12" cy="14.5" r="1.8"/><path d="M12 1.8v6.4M9.2 4.6 12 1.8l2.8 2.8"/>',
  versiones: '<circle cx="9" cy="12" r="6"/><circle cx="9" cy="12" r="1.7"/><path d="M14.3 6.4a7.6 7.6 0 0 1 0 11.2M17.8 4.4a10.4 10.4 0 0 1 0 15.2"/>',
  escucha:   '<path d="M4 15.5V12a8 8 0 0 1 16 0v3.5"/><rect x="2.8" y="13.8" width="4.4" height="6.6" rx="1.6"/><rect x="16.8" y="13.8" width="4.4" height="6.6" rx="1.6"/><path d="M10.4 9.8h3.2v2.6h-3.2zM11 9.8V8.6a1 1 0 0 1 2 0v1.2"/>',
  lanzar:    '<circle cx="10" cy="14" r="7"/><circle cx="10" cy="14" r="1.9"/><path d="M17.6 2.6v3.2M21.4 6.4l-2.3 2.3M21.6 11h-3"/>',
  wav:       '<path d="M2.5 12h1.5M6.5 8.5v7M10 4.5v15M13.5 7v10M17 9.5v5M20.5 11v2"/>',
  stems:     '<path d="M6 3.5v17M12 3.5v17M18 3.5v17"/><rect x="3.8" y="13" width="4.4" height="3.2" rx="1.2"/><rect x="9.8" y="6.8" width="4.4" height="3.2" rx="1.2"/><rect x="15.8" y="10.6" width="4.4" height="3.2" rx="1.2"/>',
  portada:   '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="10" cy="10" r="3.3"/><path d="M21 15.5 16.5 12 8 20.8"/>',
  letra:     '<path d="M3.5 6h10M3.5 10h10M3.5 14h6"/><path d="M18.5 16.5V4.5l3 1.4"/><circle cx="16.4" cy="17.2" r="2.2"/>',
  creditos:  '<circle cx="8.5" cy="8" r="3.2"/><circle cx="16.5" cy="9" r="2.6"/><path d="M2.8 19.5c.7-3.2 2.8-4.9 5.7-4.9s5 1.7 5.7 4.9M14.6 14.4c2.8-.5 4.9 1 5.6 4.3"/>',
  enlace:    '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3A4.5 4.5 0 0 0 13 4.6l-1.1 1.1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.1-1.1"/>',
  check:     '<path d="m5 12.5 4.5 4.5L19.5 7"/>',
  vinilo:    '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5.5"/><circle cx="12" cy="12" r="1.6"/>'
};

export function icon(name, size = 24) {
  return `<svg class="ico" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || ''}</svg>`;
}

let uid = 0;
// Pegatina circular: icono en el centro sobre su color + texto girando alrededor
export function sticker({ icon: name, text, color = 'var(--c1)', size = 96 }) {
  const id = `stk${++uid}`;
  const label = `${text} · `.repeat(2).toUpperCase();
  return `<span class="sticker" style="--sc:${color};width:${size}px;height:${size}px" aria-hidden="true">
    <svg viewBox="0 0 96 96" width="${size}" height="${size}">
      <defs><path id="${id}" d="M48,48 m-37,0 a37,37 0 1,1 74,0 a37,37 0 1,1 -74,0"/></defs>
      <circle cx="48" cy="48" r="46" class="sticker__bg"/>
      <g class="sticker__ring"><text><textPath href="#${id}" textLength="228">${label}</textPath></text></g>
      <circle cx="48" cy="48" r="25" class="sticker__core"/>
      <g transform="translate(34 34) scale(1.17)" class="sticker__icon" fill="none" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${P[name] || ''}</g>
    </svg>
  </span>`;
}
