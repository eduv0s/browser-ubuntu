import { describe, expect, it } from 'vitest';
describe('Browser Ubuntu assets',()=>{it('uses the local Xubuntu image and v86 runtime',()=>{expect('/assets/emulator/v86.wasm').toMatch(/^\/assets\//);expect('/assets/images/xubuntu-18.04.5-desktop-i386.iso').toMatch(/^\/assets\//);});});
