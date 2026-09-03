import { defineConfig } from 'vite';
import { createReadStream, stat } from 'node:fs';
import { join } from 'node:path';
import { promisify } from 'node:util';

const statAsync = promisify(stat);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD',
  'Access-Control-Allow-Headers': '*',
  'Accept-Ranges': 'bytes',
  'Cache-Control': 'public, max-age=31536000, immutable',
  'Content-Type': 'application/octet-stream',
};

export default defineConfig({
  publicDir: 'public',
  server: {
    host: '127.0.0.1',
    port: 5173,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  preview: {
    host: '127.0.0.1',
    port: 4173,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  build: { target: 'es2020' },
  plugins: [
    // Serve the Alpine ext2 image with CORS + range-request headers so that
    // CheerpX.HttpBytesDevice can load it during development (same as Netlify prod).
    {
      name: 'cheerp-alpine-cors',
      configureServer(server) {
        const ALPINE_FILE = 'alpine-cheerpx-i3.ext2';
        server.middlewares.use(`/${ALPINE_FILE}`, async (req, res) => {
          try {
            const filePath = join(server.config.publicDir, ALPINE_FILE);
            const s = await statAsync(filePath);
            res.setHeader('Content-Length', s.size);
            for (const [k, v] of Object.entries(CORS_HEADERS)) res.setHeader(k, v);
            if (req.headers['if-range']) {
              res.setHeader('Content-Range', `bytes */${s.size}`);
            }
            createReadStream(filePath).pipe(res);
          } catch {
            res.statusCode = 404;
            res.end('Not found');
          }
        });
      },
    },
  ],
});
