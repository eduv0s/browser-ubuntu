import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('Browser Ubuntu CheerpX prototype', () => {
  it('uses the official CheerpX runtime, persistent overlay design and HttpBytesDevice', () => {
    const source = readFileSync('src/main.js', 'utf8');
    expect(source).toContain('CheerpX.Linux.create');
    expect(source).toContain('CheerpX.IDBDevice.create');
    expect(source).toContain('CheerpX.OverlayDevice.create');
    expect(source).toContain('HttpBytesDevice.create');
    expect(source).toContain('crossOriginIsolated');
    expect(source).toContain('diskImageType');
  });
});
