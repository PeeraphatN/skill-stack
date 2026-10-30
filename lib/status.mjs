import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { destinations, preflight } from './destinations.mjs';
import { parseManifest } from './manifest.mjs';

export async function runStatus({ manifestPath = new URL('../manifest.json', import.meta.url),
  log = console.log, errorLog = console.error, home = homedir(), env = process.env } = {}) {
  let manifest;
  try {
    manifest = parseManifest(await readFile(manifestPath, 'utf8'));
  } catch (error) {
    errorLog(`Manifest failed: ${error.message}`);
    return { exitCode: 1, results: [] };
  }

  const results = [];
  for (const entry of manifest.skills) {
    for (const skill of entry.skills) {
      const name = `${entry.name}/${skill}`;
      try {
        const installed = await preflight(destinations(home, env, skill, manifest.agents));
        results.push(installed
          ? { name, status: 'installed', ok: true, detail: installed.detail }
          : { name, status: 'missing', ok: false, detail: 'not installed for every selected agent' });
      } catch (error) {
        results.push({ name, status: 'conflict', ok: false, detail: error.message });
      }
    }
  }

  log('\nSkill status:');
  for (const result of results) log(`${result.status}: ${result.name} — ${result.detail}`);
  return { exitCode: results.some((result) => !result.ok) ? 1 : 0, results };
}
