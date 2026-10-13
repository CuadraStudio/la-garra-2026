(function () {
  'use strict';
  if (!window.GARRA_CONFIG.apiUrl) return;
  window.garraApi('getWebsiteContent').then(function (content) {
    document.querySelectorAll('[data-edit-id]').forEach(function (element) {
      var field = content.fields[element.dataset.editId];
      if (!field || !field.edited) return;
      // Editable content is plain text, never executable markup.
      element.textContent = field.value;
      element.classList.add('edited-text');
    });
    document.querySelectorAll('[data-social-id]').forEach(function (element) {
      var field = content.fields[element.dataset.socialId];
      if (!field) return;
      try {
        var url = new URL(field.value);
        if (url.protocol !== 'https:' || url.username || url.password) return;
        element.href = url.href;
        if (field.edited) {
          var label = url.pathname.replace(/^\/+|\/+$/g, '') || url.hostname;
          if (element.dataset.socialId === 'social-whatsapp') label = '+' + label;
          else label = (element.dataset.socialId === 'social-facebook' ? '/' : '@') + label;
          var span = element.querySelector('span');
          if (span) span.textContent = label; else element.textContent = label + ' ↗';
          element.setAttribute('aria-label', field.label + ' ' + label + ' (se abre en una pestaña nueva)');
        }
      } catch (error) { /* Preserve the existing link if invalid. */ }
    });
    document.querySelectorAll('[data-event-stamp]').forEach(function (element) {
      var field = content.fields[element.dataset.eventStamp + '-date'];
      if (field && field.edited) {
        element.textContent = field.value;
        element.classList.add('stamp-edited');
      }
    });
  }).catch(function () {
    // Preserve original HTML if the service is unavailable.
  });
})();
