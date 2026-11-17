# WavsX

Web y app para artistas: cada canción con sus WAV, stems, portadas, letra, créditos y versiones en un solo sitio.
Astro estático, sin framework de UI. Todo en español.

## Cómo trabajar con el dueño
- Gasta los mínimos tokens: respuestas de 1-3 líneas en español, sin capturas salvo que las pida.
- Verifica tú con una captura a escala 1 (Playwright), pero no se la mandes.
- Lo que más odia: que "parezca hecho por IA". Evita lo genérico: tarjetas en rejilla con icono + título + texto, degradados de neón por todas partes, brillos sin motivo, líneas que brillan.
- Prefiere cosas reales y de estudio de música. Si algo no convence, lo dice rápido: cambia sin defender lo anterior.

## Código
- `npm run build` genera `dist/`. Vista previa: servir `dist` (por ejemplo `python3 -m http.server`).
- Landing: `src/pages/index.astro`, `src/styles/landing.css`, `src/scripts/landing.js`.
- Base compartida: `src/styles/styles.css`. La paleta la pone `public/theme.js`, que se carga en el `<head>` y sobrescribe `--c1..--c4`, `--grad` y los fondos.
- Hero activo: `.heroC`. Es texto centrado sobre una pared de espuma acústica desenfocada (`.foam`, solo CSS), con la onda `src/scripts/scope.js` delante. Al dueño le encanta la onda: no la quites.
- Color del hero: `--led` en `landing.css`, en la regla `.heroC, .nav, .ledline`. Cambiándolo se recolorea la pared, la luz, la onda y los botones.
- Scroll suave propio: `src/scripts/smooth.js` (no hay dependencias; instalar paquetes de npm se ha bloqueado antes).
- Animación de entrada: añade `.reveal` y la clase `.is-in` llega sola.
- Separadores entre secciones: `.ledline`. `landing.js` los convierte en una forma de onda.

## Paleta "Ácido" (elegida por el dueño)
`#C6FF3D` (lima, acción principal) · `#8EF05A` · `#E6FF94` · `#5BE6B4` (menta). Fondo casi negro. Texto sobre lima: `#0B0D06`.

## Ya descartado (no repetir)
Sala 3D dibujada (ladrillo, focos, monitores, mesa de mezclas), micro dibujado, ficha de canción en el hero, carrusel, lámpara cálida, neón azul/rosa, medidores ámbar, luz que sigue al ratón, onda que "cambia como una canción", separador de línea brillante.
Las fotos de iStock que mandó son de pago: solo sirven de referencia.

## Pendiente
Ver `TODO` en la sección "Lo que guarda cada canción" más abajo.

### Sección "Lo que guarda cada canción" (`.desk` en index.astro)
Lista a la izquierda + panel a la derecha, con animación solo en el panel visible (bucle en `landing.js`): espectrograma que desfila (WAV), vúmetros y M/S (stems), reproductor con 4 portadas (cambian al pulsar), letra karaoke, reparto con donut y firmas, línea de versiones que avanza.
Falta: las portadas son procedurales (`.c0`-`.c3`); sustituir por fotos reales de Unsplash (entorno "wavsx") en `public/covers/` y un vídeo/gif corto para la animada.

## Publicar para el dueño (no puede abrir localhost)
`npm run build && python3 tools/prep.py` deja en `pub/` un `index.html` con CSS y JS dentro, y `pub/covers/` y `pub/assets/`. Publícalo en el artifact https://claude.ai/artifact/NDtmmfirVkScpEaN9JvgUx: léelo antes con la acción `read` y sube covers/ y assets/ en `files`.
