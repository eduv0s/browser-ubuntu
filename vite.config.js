import { defineConfig } from 'vite';
export default defineConfig({ publicDir: 'public', server: { host: '127.0.0.1', port: 5173, headers: { 'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Embedder-Policy': 'require-corp' } }, build: { target: 'es2020' } });
