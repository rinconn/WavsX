// Logo compartido: un vinilo con la etiqueta en neón. Se inyecta en cualquier [data-logo].
const MARK = `<svg class="logo__mark" viewBox="0 0 32 32" aria-hidden="true">
  <circle cx="16" cy="16" r="15" fill="#16161B" stroke="#30303B"/>
  <circle cx="16" cy="16" r="11" fill="none" stroke="#2A2A33" stroke-width="0.8"/>
  <circle cx="16" cy="16" r="7.5" fill="none" stroke="#2A2A33" stroke-width="0.8"/>
  <circle cx="16" cy="16" r="4.5" fill="#C6FF3D"/>
  <circle cx="16" cy="16" r="1.1" fill="#08080B"/>
</svg>`;

document.querySelectorAll('[data-logo]').forEach((el) => {
  el.insertAdjacentHTML('afterbegin', MARK);
});
