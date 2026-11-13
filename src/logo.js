// Logo compartido: un vinilo con la X dentro. Se inyecta en cualquier [data-logo].
const MARK = `<svg class="logo__mark" viewBox="0 0 32 32" aria-hidden="true">
  <circle cx="16" cy="16" r="15" fill="currentColor"/>
  <circle cx="16" cy="16" r="10.5" fill="none" stroke="var(--logo-groove, #3a3a3a)" stroke-width="0.8"/>
  <circle cx="16" cy="16" r="6.5" fill="#FF4A1C"/>
  <path d="M13.6 13.6l4.8 4.8M18.4 13.6l-4.8 4.8" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>
</svg>`;

document.querySelectorAll('[data-logo]').forEach((el) => {
  el.insertAdjacentHTML('afterbegin', MARK);
});
