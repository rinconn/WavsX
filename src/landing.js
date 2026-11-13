import { createSphere } from './sphere.js';
import { waveHeights, renderWave } from './data.js';

// 1. esfera
createSphere(document.getElementById('sphere'), { radius: 0.46, centerY: 0.62 });

// 2. subtítulo palabra a palabra (aparece desenfocado → nítido)
document.querySelectorAll('[data-words]').forEach((el) => {
  const words = el.textContent.trim().split(/\s+/);
  el.setAttribute('aria-label', el.textContent.trim());
  el.innerHTML = words
    .map((w, i) => `<span class="w" aria-hidden="true" style="animation-delay:${0.35 + i * 0.045}s">${w} </span>`)
    .join('');
});

// 3. forma de onda de la tarjeta 02 (se va "reproduciendo")
const fw = document.getElementById('feature-wave');
if (fw) {
  const heights = waveHeights(2.4, 56, 64);
  let p = 0;
  renderWave(fw, heights, p);
  setInterval(() => { p = p >= 1 ? 0 : p + 0.02; renderWave(fw, heights, p); }, 120);
}

// 4. aparición al hacer scroll
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.transitionDelay = `${(i % 3) * 0.08}s`;
  io.observe(el);
});
