# Browser Ubuntu

Browser Ubuntu está migrando a un prototipo basado en CheerpX: ejecuta binarios
x86 Linux dentro del navegador mediante WebAssembly. Netlify solo sirve la
aplicación estática.

## Estado actual

La aplicación usa CheerpX 1.3.9 y la imagen Alpine gráfica oficial
`alpine_20251007.ext2` servida por `https://disks.webvm.io`, que ya expone
`Access-Control-Allow-Origin: *` y por tanto es compatible con el navegador
sin necesidad de un proxy propio. El overlay de escritura usa `IDBDevice`,
por lo que los cambios están pensados para persistir localmente.

CheerpX requiere `SharedArrayBuffer` y aislamiento de origen. La configuración
de Vite y Netlify aplica `Cross-Origin-Opener-Policy: same-origin` y
`Cross-Origin-Embedder-Policy: require-corp`.

## Ejecutar

```bash
npm install
npm run dev
```

Pulsa **Iniciar Linux**. No abras `index.html` con `file://`.

## Persistencia y consentimiento

Con **Aceptar**, CheerpX monta una imagen ext2 de solo lectura sobre un
`OverlayDevice` respaldado por `IDBDevice`. Este es el mecanismo oficial para
persistir bloques modificados en IndexedDB. Con **Rechazar**, la shell puede
funcionar, pero no se debe conservar una sesión. **Nueva sesión** pide
confirmación y borra el overlay local. Solo se guarda la decisión de
consentimiento en `localStorage`; no hay cookies de terceros, analytics ni
trackers.

## Build y Netlify

```bash
npm test
npm run build
```

Netlify publica `dist/` mediante `netlify.toml`. No hay backend, networking, cuentas, APIs externas ni procesos persistentes.

## Assets y licencias

- CheerpX 1.3.9 se carga desde `https://cxrtnc.leaningtech.com`; su licencia
  comunitaria permite proyectos personales/FOSS/evaluaciones, pero no permite
  autoalojar o redistribuir el runtime sin licencia comercial.
- La imagen `alpine_20251007.ext2` se sirve desde el CDN oficial de
  WebVM/CheerpX en `disks.webvm.io`, que ya envía CORS.
- La imagen `alpine-cheerpx-i3.ext2` (~750 MiB) construida por
  `.github/workflows/build-alpine-graphics.yml` se publica como release en
  GitHub Releases. El workflow
  `.github/workflows/publish-alpine-pages.yml` la reempaqueta en GitHub Pages
  para superar el bloqueo CORS de `releases/download`, pero `disks.webvm.io`
  es la fuente de CORS-friendly usada por la app hoy.

El script `scripts/fetch-assets.sh` permite descargar de nuevo la configuración de assets.
