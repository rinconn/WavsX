import { createVinyl } from './vinyl.js';
import { waveHeights, renderWave } from './data.js';

// 1. vinilo de partículas (a la derecha en escritorio, centrado en móvil)
const wide = window.matchMedia('(min-width: 901px)').matches;
createVinyl(document.getElementById('vinyl'), wide
  ? { cx: 0.7, cy: 0.5, size: 0.3 }
  : { cx: 0.5, cy: 0.3, size: 0.42 });

// 2. subtítulo palabra a palabra
document.querySelectorAll('[data-words]').forEach((el) => {
  const text = el.textContent.trim();
  el.setAttribute('aria-label', text);
  el.innerHTML = text.split(/\s+/)
    .map((w, i) => `<span class="w" aria-hidden="true" style="animation-delay:${0.5 + i * 0.045}s">${w} </span>`)
    .join('');
});

// 3. forma de onda de la tarjeta 02 (se va "reproduciendo")
const fw = document.getElementById('feature-wave');
if (fw) {
  const heights = waveHeights(2.4, 110, 80);
  let p = 0;
  renderWave(fw, heights, p);
  setInterval(() => { p = p >= 1 ? 0 : p + 0.01; renderWave(fw, heights, p); }, 100);
}

// 4. aparición al hacer scroll
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.transitionDelay = `${(i % 2) * 0.08}s`;
  io.observe(el);
});
