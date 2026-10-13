/* Set the approved API URL here only when ready to deploy. No secrets belong here. */
window.GARRA_CONFIG = { apiUrl: 'https://cuadra-api-v16a.onrender.com/api/lagarra', tenant: 'lagarra' };
if (['localhost', '127.0.0.1'].includes(location.hostname)) {
  window.GARRA_CONFIG.apiUrl = location.origin + '/api/lagarra';
}
