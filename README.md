# LA GARRA 2026 — Trilogía

Sitio estático (HTML, CSS y JS, sin dependencias ni paso de build) con la landing de la Trilogía 2026 y una página por edición.

| Página | Archivo |
|---|---|
| Landing | `index.html` |
| La Garra Atípica | `atipica.html` |
| La Garra Aqua | `aqua.html` |
| La Garra Montes (Barro&Corazón) | `montes.html` |

```
css/style.css     estilos de todo el sitio (el color de cada edición sale de --ac y --ad en .gp)
js/main.js        FAQ de a una pregunta (.faq-l), apertura por #hash, rel seguro en enlaces externos
img/              fotos y logo
```

## Ver en local

```bash
python3 -m http.server 8000   # luego abrir http://localhost:8000
```

También se puede abrir `index.html` directamente.

## Publicar

Es contenido estático: sirve GitHub Pages (rama `main`, carpeta raíz), Netlify, Cloudflare Pages o cualquier hosting.

## Contenido a mantener

- Fechas, lugares, horarios de retiro de kits, franjas de precio y estados de cupo están escritos a mano en cada HTML y cambian con el tiempo.
- Inscripción: https://lagarra.opc.uy/registration (mismo enlace en las tres ediciones).
- Los PDF de reglamento se enlazan desde lagarra.com.uy.
- Las URLs de WhatsApp, Instagram, X/Twitter y Facebook se armaron a partir de los usuarios publicados (@lagarrauy); conviene confirmarlas.
