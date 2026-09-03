# Browser Ubuntu

Linux real ejecutándose en tu navegador mediante CheerpX 1.3.9 y WebAssembly.
Sin backend, sin servidor remoto. Todo en client-side.

## Arquitectura

```
Navegador (COOP/COEP enabled)
├── CheerpX 1.3.9 (cxrtnc.leaningtech.com)
│   ├── HttpBytesDevice → /alpine-cheerpx-i3.ext2 (mismo origen)
│   │   └── OverlayDevice → IDBDevice (IndexedDB, persistencia)
│   ├── Linux.create(diskImageType: "bytes")
│   └── setKmsCanvas → <canvas>
├── Alpine Linux + Xorg + i3 (escritorio gráfico)
└── OverlayDevice → escribe cambios en IndexedDB
```

**Imagen**: Alpine Linux + Xorg + i3 (786 MB), publicada en GitHub Releases,
descargada durante el build de Netlify. Servida desde el mismo origen que la
web, con CORS + byte-range headers, para que `HttpBytesDevice` pueda leerla.

**Fallback**: si la imagen local falla, usa `wss://disks.webvm.io`
(Cloudflare Worker, necesita WebSocket).

## Ejecutar en local

```bash
# Descargar la imagen Alpine (750 MB) y arrancar dev server
npm run prepare:image
npm run dev
```

Abre `http://localhost:5173` y pulsa **Iniciar Linux**.

> Requiere Chrome/Chromium. Firefox no es compatible con SharedArrayBuffer
> en contextos no-aislados.

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Dev server (precarga imagen con `prepare:image`) |
| `npm run prepare:image` | Descarga la imagen Alpine a `public/` |
| `npm run build` | Build rápido (sin imagen) |
| `npm run build:netlify` | Build completo con descarga de imagen |
| `npm test` | Tests unitarios |
| `npm run preview` | Preview del build |

## Cambios desde la versión anterior

- **Antes**: `CloudDevice.create(HTTPS_URL)` — nunca funcionó porque
  `CloudDevice` necesita `wss://`. El fallback `wss→https` era un no-op.
- **Ahora**: `diskImageType: "bytes"` + `HttpBytesDevice.create(URL)` —
  patrón exacto de la implementación oficial de WebVM.
- **Imagen servida desde el mismo origen** (`/alpine-cheerpx-i3.ext2`)
  durante dev (Vite con plugin CORS) y producción (Netlify CDN con headers).
- **Build**: durante `npm run build:netlify` / `npm run dev`, la imagen se
  descarga de GitHub Releases a `public/`. Netlify la sirve con CORS.
- **Netlify**: configuración completa en `netlify.toml` con headers COOP/COEP
  y CORS para la imagen.

## Requisitos

- Chrome/Chromium (no Firefox)
- `SharedArrayBuffer` → necesita COOP/COEP (ya configurado)
- Conexión a internet para descargar CheerpX runtime (solo primera vez)
