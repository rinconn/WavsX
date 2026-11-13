// Color de acento de toda la web + selector para probar colores.
// Script clásico (no módulo) cargado en el <head> para que no haya parpadeo.
// Cuando elijas color definitivo: deja solo ese en ACCENTS y pon SHOW_PICKER = false.
(function () {
  var SHOW_PICKER = true;
  var ACCENTS = [
    { id: 'lima',    name: 'Lima',    hex: '#C6FF3D' },
    { id: 'cian',    name: 'Cian',    hex: '#3DF5FF' },
    { id: 'violeta', name: 'Violeta', hex: '#9B7BFF' },
    { id: 'naranja', name: 'Naranja', hex: '#FF6A2B' },
    { id: 'rosa',    name: 'Rosa',    hex: '#FF4FD8' }
  ];
  var KEY = 'wavsx-accent';

  function rgb(hex) {
    var n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255].join(', ');
  }

  function find(id) {
    for (var i = 0; i < ACCENTS.length; i++) if (ACCENTS[i].id === id) return ACCENTS[i];
    return ACCENTS[0];
  }

  function apply(id) {
    var a = find(id);
    var root = document.documentElement.style;
    root.setProperty('--accent', a.hex);
    root.setProperty('--accent-rgb', rgb(a.hex));
    try { localStorage.setItem(KEY, a.id); } catch (e) { /* modo privado */ }
    window.dispatchEvent(new CustomEvent('accentchange', { detail: a }));
    var btns = document.querySelectorAll('.tweak [data-accent]');
    for (var i = 0; i < btns.length; i++) btns[i].setAttribute('aria-pressed', String(btns[i].getAttribute('data-accent') === a.id));
  }

  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) { /* nada */ }
  apply(saved || ACCENTS[0].id);
  window.wavsxAccent = { apply: apply, list: ACCENTS };

  if (!SHOW_PICKER) return;
  document.addEventListener('DOMContentLoaded', function () {
    var box = document.createElement('div');
    box.className = 'tweak';
    box.setAttribute('role', 'group');
    box.setAttribute('aria-label', 'Probar color de acento');
    box.innerHTML = '<span>Color</span>' + ACCENTS.map(function (a) {
      return '<button type="button" data-accent="' + a.id + '" aria-label="' + a.name + '" title="' + a.name + '" style="--sw:' + a.hex + '"></button>';
    }).join('');
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-accent]');
      if (b) apply(b.getAttribute('data-accent'));
    });
    document.body.appendChild(box);
    apply((function () { try { return localStorage.getItem(KEY); } catch (e) { return null; } })() || ACCENTS[0].id);
  });
})();
