import { createVinyl } from './vinyl.js';

createVinyl(document.getElementById('vinyl'), { cx: 0.5, cy: 0.5, size: 0.36, tilt: 1.05 });

const form = document.getElementById('login');
const email = document.getElementById('email');
const pass = document.getElementById('pass');
const submit = document.getElementById('submit');

// mostrar / ocultar contraseña
document.getElementById('toggle-pass').addEventListener('click', (e) => {
  const show = pass.type === 'password';
  pass.type = show ? 'text' : 'password';
  e.currentTarget.setAttribute('aria-pressed', show);
  e.currentTarget.setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña');
});

function enter() {
  submit.classList.add('is-loading');
  submit.textContent = 'Entrando…';
  // TODO: llamar al backend (POST /api/auth/login) cuando exista
  setTimeout(() => { window.location.href = '/app'; }, 600);
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  let ok = true;
  [email, pass].forEach((input) => {
    const bad = !input.value.trim();
    input.classList.toggle('is-error', bad);
    input.setAttribute('aria-invalid', bad);
    if (bad) ok = false;
  });
  if (!ok) { (email.value.trim() ? pass : email).focus(); return; }
  enter();
});

document.getElementById('google').addEventListener('click', enter);
