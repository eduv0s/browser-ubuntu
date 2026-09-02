import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('Browser Ubuntu CheerpX prototype', () => {
  it('uses the official CheerpX runtime and persistent overlay design', () => {
    const source = readFileSync('src/main.js', 'utf8');
    expect(source).toContain('CheerpX.Linux.create');
    expect(source).toContain('CheerpX.IDBDevice.create');
    expect(source).toContain('CheerpX.OverlayDevice.create');
    expect(source).toContain('crossOriginIsolated');
  });
});
