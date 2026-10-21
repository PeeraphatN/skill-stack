import { readFile } from 'node:fs/promises';
import { parseManifest } from '../lib/manifest.mjs';

const source = process.argv[2] ?? new URL('../manifest.json', import.meta.url);
try {
  parseManifest(await readFile(source, 'utf8'));
  console.log('Manifest valid');
} catch (error) {
  console.error(`Manifest validation failed: ${error.message}`);
  process.exitCode = 1;
}
