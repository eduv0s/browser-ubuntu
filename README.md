# Browser Ubuntu

Browser Ubuntu ejecuta Linux real dentro del navegador mediante v86 y WebAssembly. Netlify solo sirve archivos estáticos.

## Estado de la imagen

La imagen activa es **Tiny Core Linux 11 x86**, ISO arrancable de 19.0 MiB. Es la única imagen comprobada que llega a ejecutarse con v86 en este entorno. Xubuntu 18.04.5 i386 (1,45 GiB) y Lubuntu 18.04.5 i386 (1,11 GiB) fueron descargadas y verificadas; ambas se probaron en Chromium real, pero no alcanzaron un escritorio usable: Xubuntu se detuvo en errores BIOS/ACPI y Lubuntu terminó en `soft lockup` tras su menú gráfico. Por eso no se deja una ISO Ubuntu grande que no funcione.

Tiny Core Linux MD5 oficial verificado: `62404bb6b29f03cffcaf4e098855873c`.

## Constructor experimental de Alpine XFCE

La imagen Alpine XFCE todavía no está integrada: este Mac no tiene Docker, un
runtime Linux ni un `qemu-img` ejecutable. Se ha dejado el constructor
reproducible en `scripts/build-alpine-xfce-image.sh`. Usa el script oficial
`alpine-make-vm-image` dentro de un contenedor Linux únicamente durante el
desarrollo, crea un HDD BIOS raw de 512 MiB y prepara Alpine x86 con XFCE,
LightDM, Thunar, terminal y herramientas básicas. Docker/QEMU no forman parte
de la aplicación publicada.

Cuando exista Docker, se ejecuta con:

```bash
scripts/build-alpine-xfce-image.sh
```

El script escribe `public/assets/images/alpine-xfce-v86.img` y su SHA256. No se
debe sustituir la imagen activa hasta probar el arranque gráfico real en
Chromium.

## Ejecutar

```bash
npm install
npm run dev
```

Pulsa **Iniciar Ubuntu**. La etiqueta indica discretamente la imagen técnica real. No abras `index.html` con `file://`.

## Fullscreen y ratón

El botón llama a `machine.screen_go_fullscreen()`, que es la API de v86. El elemento `screen_container` ocupa `100vw/100vh` en fullscreen y el canvas conserva su proporción. Un clic en la pantalla activa `mouse_set_enabled(true)` y `lock_mouse()`; al apagar o salir se ejecuta `exitPointerLock()`.

## Persistencia y consentimiento

Con **Aceptar**, el estado de v86 se guarda en IndexedDB con `save_state()` y se recupera con **Restaurar sesión**. La instancia siempre se crea con las mismas opciones, incluida una imagen HDD virtual de 64 MiB, para que el snapshot pueda restaurar los dispositivos. Con **Rechazar**, la VM funciona pero no se guardan estados. **Nueva sesión** pide confirmación y elimina el snapshot; la carga inicial nunca lo borra automáticamente. Solo se guarda la decisión de consentimiento en `localStorage`; no hay cookies de terceros, analytics ni trackers.

## Build y Netlify

```bash
npm test
npm run build
```

Netlify publica `dist/` mediante `netlify.toml`. No hay backend, networking, cuentas, APIs externas ni procesos persistentes.

## Assets y licencias

- `public/assets/emulator/libv86.mjs` y `v86.wasm`: v86, BSD-2-Clause.
- `public/assets/bios/`: SeaBIOS/vgabios del proyecto v86.
- `public/assets/images/TinyCore-11.0.iso`: Tiny Core Linux x86, GPL-2.0-or-later.

El script `scripts/fetch-assets.sh` permite descargar de nuevo la configuración de assets.
