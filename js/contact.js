(function () {
  'use strict';
  var form = document.getElementById('contact-form');
  var status = document.getElementById('contact-status');
  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!form.reportValidity()) return;
    var button = form.querySelector('button');
    button.disabled = true;
    status.classList.remove('error');
    status.textContent = 'Enviando tu mensaje…';
    try {
      await window.garraApi('createContactMessage', { doc: Object.fromEntries(new FormData(form)) });
      form.reset();
      status.textContent = 'Recibimos tu mensaje. ¡Gracias por escribirnos!';
    } catch (error) {
      status.classList.add('error');
      status.textContent = error.message;
    } finally { button.disabled = false; }
  });
})();
