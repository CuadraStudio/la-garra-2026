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
