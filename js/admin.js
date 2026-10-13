(function () {
  'use strict';
  var token = '', content, changes = {}, saving = false;
  var login = document.getElementById('login-form'), panel = document.getElementById('panel');
  var status = document.getElementById('panel-status'), save = document.getElementById('save');
  var edition = document.getElementById('edition'), historyNext = null, historyBusy = false;
  var historySelect = document.getElementById('history-version'), historyRestore = document.getElementById('history-restore');
  function notify(message, error) { status.textContent = message; status.classList.toggle('error', !!error); }
  function updateCount() {
    var count = Object.keys(changes).length;
    document.getElementById('changes-count').textContent = count ? count + ' texto(s) con cambios pendientes' : 'Sin cambios pendientes';
    save.disabled = !count || saving || historyBusy;
  }
  function render() {
    historySelect.value = ''; historyRestore.disabled = true; document.getElementById('history-preview').replaceChildren();

    var editor = document.getElementById('editor'); editor.replaceChildren();
    var groups = {};
    Object.entries(content.fields).forEach(function (entry) {
      var key = entry[0], field = entry[1];
      if (field.page !== edition.value) return;
      if (!groups[field.group]) {
        var group = document.createElement('details'); group.className = 'editor-group'; group.open = false;
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
      changes = {}; render(); updateCount(); login.reset(); message.textContent = ''; login.hidden = true; panel.hidden = false;
    } catch (error) { token = ''; message.textContent = error.message; message.classList.add('error'); }
    finally { button.disabled = false; }
  });
  edition.addEventListener('change', render);
  save.addEventListener('click', async function () {
    if (saving || historyBusy) return;
    if (Object.values(changes).some(function (value) { return !value.trim(); })) { notify('Completá los textos vacíos antes de guardar.', true); return; }
    saving = true; save.disabled = true; historyRestore.disabled = true;
    // Prevent edits during a save from being silently discarded.
    panel.querySelectorAll('#editor input, textarea, select').forEach(function (element) { element.disabled = true; });
    try {
      content = await window.garraApi('updateWebsiteContent', { revision: content.revision, changes: changes }, token);
      changes = {}; render(); if (document.getElementById('version-history').open) loadHistory(false); notify('Cambios guardados. Ya están disponibles en la web conectada.');
    } catch (error) { handle(error); }
    finally { saving = false; panel.querySelectorAll('#editor input, textarea, select').forEach(function (element) { element.disabled = false; }); updateCount(); }
  });
  async function loadHistory(more) {
    if (historyBusy) return;
    historyBusy = true;
    var info = document.getElementById('history-status');
    try {
      var result = await window.garraApi('listWebsiteVersions', more && historyNext ? { beforeRevision: historyNext } : {}, token);
      if (!more) {
        historySelect.replaceChildren(new Option('Seleccioná una versión', ''));
        historyRestore.disabled = true; document.getElementById('history-preview').replaceChildren();
      }
      result.versions.forEach(function (version) {
        historySelect.append(new Option('Versión ' + version.revision + ' · ' + new Date(version.savedAt).toLocaleString('es-UY', { timeZone: 'America/Montevideo' }), version.revision));
      });
      historyNext = result.nextBefore;
      document.getElementById('history-more').hidden = !historyNext;
      info.textContent = historySelect.options.length > 1 ? 'Seleccioná una versión para comparar los textos antes de recuperarla.' : 'Todavía no hay versiones anteriores. Se conservarán al guardar el próximo cambio.';
    } catch (error) { handle(error); } finally { historyBusy = false; updateCount(); }
  }
  document.getElementById('version-history').addEventListener('toggle', function () { if (this.open) loadHistory(false); });
  document.getElementById('history-refresh').addEventListener('click', function () { loadHistory(false); });
  document.getElementById('history-more').addEventListener('click', function () { loadHistory(true); });
  historySelect.addEventListener('change', async function () {
    historyRestore.disabled = true;
    var target = document.getElementById('history-preview'); target.replaceChildren();
    if (!this.value) return;
    var selected = this.value, selectedPage = edition.value;
    try {
      var version = await window.garraApi('getWebsiteVersion', { version: Number(selected) }, token);
      if (historySelect.value !== selected || edition.value !== selectedPage) return;
      var count = 0;
      Object.entries(content.fields).forEach(function (entry) {
        var key = entry[0], current = entry[1], old = version.fields[key];
        if (current.page !== selectedPage || !old || (current.value === old.value && current.edited === old.edited)) return;
        count++;
        var card = document.createElement('article'); card.className = 'inquiry';
        var heading = document.createElement('h3'); heading.textContent = current.label;
        var now = document.createElement('p'), before = document.createElement('p');
        now.className = before.className = 'message';
        now.textContent = 'Actual: ' + current.value; before.textContent = 'Versión anterior: ' + old.value;
        card.append(heading, now, before); target.append(card);
      });
      document.getElementById('history-status').textContent = count ? count + ' campo(s) de esta edición se recuperarán. La versión actual quedará guardada en el historial.' : 'Esta versión tiene los mismos textos para la edición seleccionada.';
      historyRestore.disabled = !count;
    } catch (error) { handle(error); }
  });
  historyRestore.addEventListener('click', async function () {
    if (historyBusy || saving || !historySelect.value) return;
    var label = edition.options[edition.selectedIndex].text;
    if (!confirm('¿Recuperar los textos de ' + label + ' de esta versión?' + (Object.keys(changes).length ? ' Se descartarán los cambios sin guardar.' : '') + ' La versión actual quedará conservada.')) return;
    historyBusy = true; historyRestore.disabled = true; save.disabled = true;
    panel.querySelectorAll('input, textarea, select, #history-refresh, #history-more').forEach(function (element) { element.disabled = true; });
    try {
      content = await window.garraApi('restoreWebsiteVersion', { version: Number(historySelect.value), page: edition.value, revision: content.revision }, token);
      changes = {}; render(); notify('Versión recuperada. Los textos de ' + label + ' ya están disponibles en la web.');
    } catch (error) { handle(error); }
    finally {
      panel.querySelectorAll('input, textarea, select, #history-refresh, #history-more').forEach(function (element) { element.disabled = false; });
      historyBusy = false; updateCount(); loadHistory(false);
    }
  });
  window.addEventListener('beforeunload', function (event) {
    if (!Object.keys(changes).length) return; event.preventDefault(); event.returnValue = '';
  });
  async function messages() {
    var target = document.getElementById('messages'); target.textContent = 'Cargando consultas…';
    try {
      var rows = await window.garraApi('listContactMessages', {}, token);
      target.replaceChildren();
      if (!rows.length) target.textContent = 'Todavía no hay consultas recibidas.';
      rows.forEach(function (row) {
        var card = document.createElement('details'); card.className = 'inquiry inquiry-card';
        var summary = document.createElement('summary'); summary.className = 'inquiry-summary';
        var overview = document.createElement('div'); overview.className = 'inquiry-overview';
        var name = document.createElement('strong'); name.textContent = row.name;
        var email = document.createElement('span'); email.className = 'inquiry-email'; email.textContent = row.email;
        var subject = document.createElement('span'); subject.className = 'inquiry-subject'; subject.textContent = row.subject;
        var date = document.createElement('time'); date.className = 'inquiry-date'; date.dateTime = row.created_at;
        date.textContent = new Date(row.created_at).toLocaleString('es-UY', { timeZone: 'America/Montevideo' });
        var badge = document.createElement('span'); badge.className = 'inquiry-badge';
        overview.append(name, email, subject, date); summary.append(overview, badge); card.append(summary);
        var detail = document.createElement('div'); detail.className = 'inquiry-detail';
        if (row.phone) { var phone = document.createElement('p'); phone.textContent = 'Celular: ' + row.phone; detail.append(phone); }
        var body = document.createElement('p'); body.className = 'message'; body.textContent = row.message;
        var readButton = document.createElement('button'); readButton.type = 'button'; readButton.className = 'secondary';
        function showReadStatus() {
          var isRead = !!row.read_at;
          card.classList.toggle('is-read', isRead); card.classList.toggle('is-unread', !isRead);
          badge.textContent = isRead ? 'Leída' : 'No leída';
          readButton.textContent = isRead ? 'Marcar como no leída' : 'Marcar como leída';
        }
        showReadStatus();
        readButton.addEventListener('click', async function () {
          readButton.disabled = true;
          try {
            var result = await window.garraApi('setContactMessageRead', { id: row.id, read: !row.read_at }, token);
            row.read_at = result.readAt; showReadStatus();
          } catch (error) { handle(error); } finally { readButton.disabled = false; }
        });
        detail.append(body, readButton); card.append(detail);
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

