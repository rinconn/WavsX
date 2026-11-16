// Scroll suave con inercia para rueda y trackpad (sin dependencias).
// El táctil y el teclado siguen siendo nativos. Se desactiva con "reducir movimiento".
export function smoothScroll({ ease = 0.085 } = {}) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || matchMedia('(pointer: coarse)').matches) {
    return { to: (y) => scrollTo({ top: y, behavior: 'smooth' }) };
  }
  document.documentElement.style.scrollBehavior = 'auto';
  let target = scrollY, current = scrollY, raf = 0;
  const max = () => document.documentElement.scrollHeight - innerHeight;
  const clamp = (v) => Math.max(0, Math.min(max(), v));
  function tick() {
    current += (target - current) * ease;
    if (Math.abs(target - current) < 0.5) { current = target; raf = 0; }
    scrollTo(0, current);
    if (raf) raf = requestAnimationFrame(tick);
  }
  const run = () => { if (!raf) raf = requestAnimationFrame(tick); };
  addEventListener('wheel', (e) => {
    if (e.ctrlKey || e.defaultPrevented) return;                       // zoom con pellizco
    let el = e.target;                                                 // deja hacer scroll a cajas internas
    while (el && el !== document.body) {
      const s = getComputedStyle(el);
      if (/(auto|scroll)/.test(s.overflowY) && el.scrollHeight > el.clientHeight) return;
      el = el.parentElement;
    }
    e.preventDefault();
    if (!raf) current = scrollY;
    target = clamp(target + e.deltaY * (e.deltaMode === 1 ? 40 : 1));
    run();
  }, { passive: false });
  // si el scroll llega por otra vía (teclado, barra, táctil), lo seguimos sin pelear
  addEventListener('scroll', () => { if (!raf) target = current = scrollY; }, { passive: true });
  return { to: (y) => { if (!raf) current = scrollY; target = clamp(y); run(); } };
}
