// main.ts — entrypoint for news-image-20261126 (Node 22, standard library only).
// Renders the front page with ./draw.ts and writes one deterministic PNG to
// /output/entry.png (or $MAKEFUN_OUTPUT_DIR when set, for local runs).
// No network, no clock, no randomness: two runs write identical bytes.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderFrontPage } from './draw.ts';

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const png = renderFrontPage();

// Validate the deliverable before writing it anywhere.
if (png.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
  throw new Error('renderer did not produce a PNG');
}
if (png.length > 1024 * 1024) {
  throw new Error(`entry.png is ${png.length} bytes, over the 1 MiB cap`);
}
const width = png.readUInt32BE(16);
const height = png.readUInt32BE(20);
if (width !== 1024 || height !== 1024) {
  throw new Error(`entry.png is ${width}x${height}, expected 1024x1024`);
}

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'entry.png'), png);
console.log(`wrote ${join(outDir, 'entry.png')} (${png.length} bytes, 1024x1024)`);
