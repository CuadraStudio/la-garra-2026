(function () {
  'use strict';
  var token = '', content, changes = {};
  var login = document.getElementById('login-form'), panel = document.getElementById('panel');
  var status = document.getElementById('panel-status'), save = document.getElementById('save');
  var edition = document.getElementById('edition');
  function notify(message, error) { status.textContent = message; status.classList.toggle('error', !!error); }
  function updateCount() {
    var count = Object.keys(changes).length;
    document.getElementById('changes-count').textContent = count ? count + ' texto(s) con cambios pendientes' : 'Sin cambios pendientes';
    save.disabled = !count;
  }
  function render() {
    document.getElementById('gmail-settings').hidden = edition.value !== 'index';
    var editor = document.getElementById('editor'); editor.replaceChildren();
    var groups = {};
    Object.entries(content.fields).forEach(function (entry) {
      var key = entry[0], field = entry[1];
      if (field.page !== edition.value) return;
      if (!groups[field.group]) {
        var group = document.createElement('details'); group.className = 'editor-group'; group.open = true;
        var heading = document.createElement('summary'); heading.textContent = field.group; group.append(heading);
        var fields = document.createElement('div'); fields.className = 'editor-fields'; group.append(fields);
        editor.append(group); groups[field.group] = fields;
      }
      var wrapper = document.createElement('div'), label = document.createElement('label');
      var input = document.createElement(field.type === 'url' ? 'input' : 'textarea'), preview = document.createElement('p');
      label.htmlFor = key; label.textContent = field.label;
      if (field.type === 'url') { input.type = 'url'; input.placeholder = 'https://…'; }
      input.id = key; input.maxLength = 10000; input.value = Object.hasOwn(changes, key) ? changes[key] : field.value;
      input.rows = Math.min(12, Math.max(2, input.value.split('\n').length));
      preview.className = 'edited-preview'; preview.textContent = input.value;
      input.addEventListener('input', function () {
        if (input.value === field.value) delete changes[key]; else changes[key] = input.value;
        preview.textContent = input.value; updateCount();
      });
      wrapper.append(label, input, preview); groups[field.group].append(wrapper);
    });
  }
  async function gmailSettings() {
    try {
      var settings = await window.garraApi('getWebsiteSettings', {}, token);
      document.getElementById('gmail-connect').disabled = !settings.gmailAvailable;
      document.getElementById('gmail-test').disabled = !settings.gmailAvailable || !settings.gmailConnected;
      document.getElementById('gmail-status').textContent = settings.gmailConnected
        ? 'Gmail conectado: ' + settings.emailFrom + ' · Destino habitual: ' + settings.contactTo
        : settings.gmailAvailable ? 'Google está configurado. Conectá la cuenta de CuadraStudio para activar el envío.'
        : 'Falta completar la configuración de Google Cloud en Render.';
    } catch (error) { handle(error); }
  }
  document.getElementById('gmail-refresh').addEventListener('click', gmailSettings);
  document.getElementById('gmail-connect').addEventListener('click', async function () {
    try {
      var result = await window.garraApi('getGmailAuthUrl', {}, token);
      var url = new URL(result.url);
      if (url.origin !== 'https://accounts.google.com') throw new Error('Enlace de conexión inválido.');
      if (Object.keys(changes).length && !confirm('Hay textos sin guardar. ¿Querés continuar y descartarlos?')) return;
      changes = {}; window.location.assign(url.href);
    } catch (error) { handle(error); }
  });
  document.getElementById('gmail-test').addEventListener('click', async function () {
    var button = this; button.disabled = true;
    try {
      var result = await window.garraApi('sendWebsiteTestEmail', {}, token);
      notify(result.message, !result.sent);
    } catch (error) { handle(error); }
  });
  function endSession() { token = ''; content = null; changes = {}; panel.hidden = true; login.hidden = false; login.reset(); }
  function handle(error) {
    if (error.code === 'UNAUTHORIZED') {
      endSession(); document.getElementById('login-status').textContent = 'Tu sesión venció. Volvé a ingresar.';
    } else { notify(error.message, true); }
  }
  login.addEventListener('submit', async function (event) {
    event.preventDefault(); var button = login.querySelector('button'); button.disabled = true;
    var message = document.getElementById('login-status'); message.textContent = 'Ingresando…';
    try {
      var result = await window.garraApi('login', { pin: login.elements.pin.value }); token = result.token;
      content = await window.garraApi('getWebsiteContent', {}, token);
      changes = {}; render(); updateCount(); gmailSettings(); login.reset(); message.textContent = ''; login.hidden = true; panel.hidden = false;
    } catch (error) { token = ''; message.textContent = error.message; message.classList.add('error'); }
    finally { button.disabled = false; }
  });
  edition.addEventListener('change', render);
  save.addEventListener('click', async function () {
    if (Object.values(changes).some(function (value) { return !value.trim(); })) { notify('Completá los textos vacíos antes de guardar.', true); return; }
    save.disabled = true;
    // Prevent edits during a save from being silently discarded.
    panel.querySelectorAll('#editor input, textarea, select').forEach(function (element) { element.disabled = true; });
    try {
      content = await window.garraApi('updateWebsiteContent', { revision: content.revision, changes: changes }, token);
      changes = {}; render(); notify('Cambios guardados. Ya están disponibles en la web conectada.');
    } catch (error) { handle(error); }
    finally { panel.querySelectorAll('#editor input, textarea, select').forEach(function (element) { element.disabled = false; }); updateCount(); }
  });
  document.getElementById('logout').addEventListener('click', function () {
    if (Object.keys(changes).length && !confirm('Hay cambios sin guardar. ¿Querés cerrar la sesión y descartarlos?')) return;
    endSession();
  });
  window.addEventListener('beforeunload', function (event) {
    if (!Object.keys(changes).length) return; event.preventDefault(); event.returnValue = '';
  });
  async function messages() {
    var target = document.getElementById('messages'); target.textContent = 'Cargando consultas…';
    try {
      var results = await Promise.all([window.garraApi('getWebsiteSettings', {}, token), window.garraApi('listContactMessages', {}, token)]);
      var settings = results[0], rows = results[1];
      document.getElementById('email-status').textContent = 'Destino: ' + settings.contactTo + (settings.emailConfigured ? ' · Envío de email configurado.' : ' · Falta configurar el envío de email. Las consultas quedan guardadas aquí.');
      target.replaceChildren();
      if (!rows.length) target.textContent = 'Todavía no hay consultas recibidas.';
      rows.forEach(function (row) {
        var card = document.createElement('article'); card.className = 'inquiry';
        var heading = document.createElement('h2'); heading.textContent = row.subject;
        var meta = document.createElement('p'); meta.className = 'meta';
        meta.textContent = row.name + ' · ' + new Date(row.created_at).toLocaleString('es-UY', { timeZone: 'America/Montevideo' });
        var contact = document.createElement('p'); contact.textContent = row.email + (row.phone ? ' · ' + row.phone : '');
        var body = document.createElement('p'); body.className = 'message'; body.textContent = row.message;
        var delivery = document.createElement('p'); delivery.className = 'meta'; delivery.textContent = row.email_status === 'sent' ? 'Email enviado' : 'Email pendiente de envío';
        card.append(heading, meta, contact, body, delivery);
        if (row.email_status !== 'sent') {
          var retry = document.createElement('button'); retry.type = 'button'; retry.className = 'secondary'; retry.textContent = 'Reintentar envío';
          retry.addEventListener('click', async function () {
            retry.disabled = true;
            try {
              var result = await window.garraApi('retryContactEmail', { id: row.id }, token);
              notify(result.sent ? 'Email enviado.' : 'El email sigue pendiente. Revisá la configuración de envío.', !result.sent); await messages();
            } catch (error) { handle(error); } finally { retry.disabled = false; }
          }); card.append(retry);
        }
        target.append(card);
      });
    } catch (error) { target.textContent = ''; handle(error); }
  }
  document.getElementById('refresh-messages').addEventListener('click', messages);
  ['content', 'messages'].forEach(function (name) {
    document.getElementById('tab-' + name).addEventListener('click', function () {
      document.getElementById('content-panel').hidden = name !== 'content';
      document.getElementById('messages-panel').hidden = name !== 'messages';
      document.getElementById('tab-content').setAttribute('aria-pressed', name === 'content');
      document.getElementById('tab-messages').setAttribute('aria-pressed', name === 'messages');
      if (name === 'messages') messages();
    });
  });
})();
