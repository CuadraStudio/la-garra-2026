/* La Garra 2026 — comportamiento mínimo.
   El sitio funciona sin JS; esto solo mejora la experiencia. */
(function () {
  'use strict';

  // FAQ: al abrir una pregunta se cierran las demás de su misma lista.
  document.querySelectorAll('.faq-l').forEach(function (faq) {
    var items = faq.querySelectorAll('details');
    items.forEach(function (d) {
      d.addEventListener('toggle', function () {
        if (!d.open) return;
        items.forEach(function (o) { if (o !== d) o.open = false; });
      });
    });
  });

  // Si se llega con #faq (o un id dentro) desde otra página, abre el FAQ.
  function openFromHash() {
    var id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    var el = document.getElementById(id);
    if (el && el.tagName === 'DETAILS') el.open = true;
  }
  window.addEventListener('hashchange', openFromHash);
  openFromHash();

  // Los enlaces externos que abren pestaña nueva no deben exponer window.opener.
  document.querySelectorAll('a[target="_blank"]').forEach(function (a) {
    var rel = (a.getAttribute('rel') || '').split(/\s+/).filter(Boolean);
    ['noopener', 'noreferrer'].forEach(function (r) { if (rel.indexOf(r) < 0) rel.push(r); });
    a.setAttribute('rel', rel.join(' '));
  });
})();
