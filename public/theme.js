// Paletas de WavsX ("luces de estudio") + selector para probarlas.
// Script clásico (no módulo) cargado en el <head> para que no haya parpadeo.
// Cada paleta tiene 4 colores que se usan siempre en el mismo orden:
//   c1 → acción principal (botones, play, estado "Lista")
//   c2..c4 → acompañan en degradados, iconos, pasos y el vinilo
// Cuando elijas la definitiva: deja solo esa en PALETTES y pon SHOW_PICKER = false.
(function () {
  var SHOW_PICKER = true;
  var PALETTES = [
    {
      id: 'golden', name: 'Golden hour',
      c: ['#FF8A3D', '#FF4F8B', '#8B6CFF', '#3DD6F5'],
      bg: ['#0A090E', '#131219', '#1A1922', '#211F2A', '#26242F', '#34313F']
    },
    {
      id: 'tungsteno', name: 'Tungsteno',
      c: ['#FFB347', '#FF6B5A', '#F0D3A8', '#5FB3A8'],
      bg: ['#0E0B0A', '#171311', '#1E1916', '#26201C', '#2C2521', '#3A312B']
    },
    {
      id: 'acuario', name: 'Acuario',
      c: ['#3DE0F5', '#4F8BFF', '#9B7BFF', '#5CF2B5'],
      bg: ['#070A0F', '#0F141B', '#151B24', '#1B222D', '#1F2732', '#2B3542']
    }
  ];
  var KEY = 'wavsx-palette';
  var BG_VARS = ['--bg', '--surface', '--surface-2', '--raised', '--line', '--line-2'];

  function rgb(hex) {
    var n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255].join(', ');
  }
  function find(id) {
    for (var i = 0; i < PALETTES.length; i++) if (PALETTES[i].id === id) return PALETTES[i];
    return PALETTES[0];
  }

  function apply(id) {
    var p = find(id);
    var s = document.documentElement.style;
    for (var i = 0; i < 4; i++) {
      s.setProperty('--c' + (i + 1), p.c[i]);
      s.setProperty('--c' + (i + 1) + '-rgb', rgb(p.c[i]));
    }
    s.setProperty('--accent', p.c[0]);
    s.setProperty('--accent-rgb', rgb(p.c[0]));
    s.setProperty('--grad', 'linear-gradient(90deg, ' + p.c.join(', ') + ')');
    for (var j = 0; j < BG_VARS.length; j++) s.setProperty(BG_VARS[j], p.bg[j]);
    try { localStorage.setItem(KEY, p.id); } catch (e) { /* modo privado */ }
    window.dispatchEvent(new CustomEvent('accentchange', { detail: p }));
    var btns = document.querySelectorAll('.tweak [data-palette]');
    for (var k = 0; k < btns.length; k++) btns[k].setAttribute('aria-pressed', String(btns[k].getAttribute('data-palette') === p.id));
  }

  function saved() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  apply(saved() || PALETTES[0].id);
  window.wavsxPalette = { apply: apply, list: PALETTES };

  if (!SHOW_PICKER) return;
  document.addEventListener('DOMContentLoaded', function () {
    var box = document.createElement('div');
    box.className = 'tweak';
    box.setAttribute('role', 'group');
    box.setAttribute('aria-label', 'Probar paleta de colores');
    box.innerHTML = '<span>Paleta</span>' + PALETTES.map(function (p) {
      return '<button type="button" data-palette="' + p.id + '" style="--sw: linear-gradient(90deg, ' + p.c.join(', ') + ')">' + p.name + '</button>';
    }).join('');
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-palette]');
      if (b) apply(b.getAttribute('data-palette'));
    });
    document.body.appendChild(box);
    apply(saved() || PALETTES[0].id);
  });
})();
