#!/usr/bin/env node
// Pre-download the Alpine ext2 image into public/ so Vite (dev) and Netlify (prod)
// serve it with CORS. CheerpX.HttpBytesDevice needs HTTPS + CORS + byte-range.
import { mkdir, stat } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { dirname, resolve } from 'node:path';

const URL = process.env.ALPINE_IMAGE_URL
  || 'https://github.com/eduv0s/browser-ubuntu/releases/download/alpine-cheerpx-i3/alpine-cheerpx-i3.ext2';
const OUT = resolve(process.cwd(), 'public', 'alpine-cheerpx-i3.ext2');
const MIN = 700 * 1024 * 1024;

const exists = async (p) => { try { await stat(p); return true; } catch { return false; } };

const main = async () => {
  if (await exists(OUT)) {
    const s = await stat(OUT);
    if (s.size >= MIN) {
      console.log(`[prepare-image] Reusing ${OUT} (${(s.size/1024**2).toFixed(1)} MB)`);
      return;
    }
  }
  await mkdir(dirname(OUT), { recursive: true });
  console.log(`[prepare-image] Downloading ${URL}`);
  const res = await fetch(URL, { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(OUT));
  const s = await stat(OUT);
  console.log(`[prepare-image] Saved (${(s.size/1024**2).toFixed(1)} MB)`);
  if (s.size < MIN) throw new Error(`File too small: ${s.size} < ${MIN}`);
};
main().catch(e => { console.error(e); process.exit(1); });
