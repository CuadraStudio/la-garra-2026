(function () {
  'use strict';
  window.garraApi = async function (action, payload, token) {
    var config = window.GARRA_CONFIG;
    if (!config || !config.apiUrl) {
      throw new Error('El servicio todavía no está conectado. Podés contactarnos por WhatsApp.');
    }
    var headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = 'Bearer ' + token;
    var response = await fetch(config.apiUrl, {
      method: 'POST', headers: headers, cache: 'no-store',
      body: JSON.stringify({ action: action, payload: payload || {} })
    });
    var result = await response.json();
    if (!result.ok) {
      var error = new Error(result.error && result.error.message || 'No se pudo completar la solicitud.');
      error.code = result.error && result.error.code;
      throw error;
    }
    return result.data;
  };
})();
