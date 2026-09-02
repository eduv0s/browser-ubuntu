# Browser Ubuntu

Browser Ubuntu está migrando a un prototipo basado en CheerpX: ejecuta binarios
x86 Linux dentro del navegador mediante WebAssembly. Netlify solo sirve la
aplicación estática.

## Estado actual

La aplicación usa CheerpX 1.3.9 y la imagen Alpine gráfica oficial
`alpine_20251007.ext2`, servida por el backend oficial de discos de CheerpX.
El overlay de escritura usa `IDBDevice`, por lo que los cambios están
pensados para persistir localmente. El escritorio XFCE y Firefox todavía no
están integrados ni deben anunciarse como disponibles.

La prueba real ejecutada con Chromium escribe `persistence-proof` en
`/home/user/browser-ubuntu-test.txt`, espera a que termine la operación de
disco, recarga la página y ejecuta `cat` en una instancia nueva. El contenido
se recupera correctamente. El prototipo corrige además los permisos iniciales
del directorio `/home/user` antes de iniciar la shell del usuario.

CheerpX requiere `SharedArrayBuffer` y aislamiento de origen. La configuración
de Vite y Netlify aplica `Cross-Origin-Opener-Policy: same-origin` y
`Cross-Origin-Embedder-Policy: require-corp`.

## Ejecutar

```bash
npm install
npm run dev
```

Pulsa **Iniciar Ubuntu**. La etiqueta indica discretamente la imagen técnica real. No abras `index.html` con `file://`.

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

- CheerpX 1.2.8 se carga desde `https://cxrtnc.leaningtech.com`; su licencia
  comunitaria permite proyectos personales/FOSS/evaluaciones, pero no permite
  autoalojar o redistribuir el runtime sin licencia comercial.
- La imagen Debian de referencia pertenece al flujo oficial de WebVM/CheerpX.

El script `scripts/fetch-assets.sh` permite descargar de nuevo la configuración de assets.

## Diagnóstico gráfico Alpine / Xorg

La receta oficial de la imagen está en
[leaningtech/alpine-image](https://github.com/leaningtech/alpine-image). Su
`Dockerfile` instala Xorg, LightDM e i3, pero no declara `mesa-dri-gallium`.
La imagen remota `alpine_20251007.ext2` tampoco contiene los módulos DRI en
`/usr/lib/xorg/modules/dri/`. Por eso Xorg informa:

```text
failed to load driver: CheerpX KMS
failed to load driver: kms_swrast
failed to load swrast driver
couldn't get display device
```

En Alpine 3.17, el paquete que aporta los controladores de software
`swrast_dri.so` y `kms_swrast_dri.so` es `mesa-dri-gallium`, como confirma el
[índice oficial de contenidos de Alpine](https://pkgs.alpinelinux.org/contents?arch=x86&branch=v3.17&name=mesa-dri-gallium&repo=main).
No hay un paquete Alpine que proporcione un archivo llamado `CheerpX KMS_dri.so`;
ese nombre aparece durante la selección del dispositivo KMS de CheerpX y no es
un asset que pueda descargarse desde este proyecto.

La receta mínima corregida para reconstruir la imagen oficial debe añadir
`mesa-dri-gallium` al primer `apk add`, conservar `xorg-server` y generar de
nuevo el ext2 mediante el pipeline de imagen de WebVM. No se ha incorporado
automáticamente a `alpine_20251007.ext2`: la imagen se sirve remotamente y este
entorno no dispone de Docker, QEMU ni herramientas ext2 para reconstruirla
localmente de forma segura.
