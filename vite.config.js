import { defineConfig } from 'vite';
export default defineConfig({ publicDir: 'public', server: { host: '127.0.0.1', port: 5173 }, build: { target: 'es2020' } });
