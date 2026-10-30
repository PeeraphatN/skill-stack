import { readFile, access, constants, realpath } from 'node:fs/promises';
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseManifest } from './lib/manifest.mjs';
import { destinations, preflight, verify } from './lib/destinations.mjs';
import { npmCommands, runProcess } from './lib/process.mjs';
import { runStatus } from './lib/status.mjs';
import { runUpdate } from './lib/update.mjs';

export async function runInstaller({ manifestPath = new URL('./manifest.json', import.meta.url), log = console.log, errorLog = console.error,
  home = homedir(), env = process.env, nodeVersion = process.versions.node, run = runProcess,
  platform = process.platform, commands } = {}) {
  let manifest;
  try {
    manifest = parseManifest(await readFile(manifestPath, 'utf8'));
  } catch (error) {
    errorLog(`Manifest failed: ${error.message}`);
    return { exitCode: 1, results: [] };
  }
  const results = [];
  const finish = () => {
    log('\nInstallation summary:');
    for (const result of results) log(`${result.status}: ${result.name} — ${result.detail}`);
    return { exitCode: results.some((result) => !result.ok) ? 1 : 0, results };
  };
  let tools;
  const execute = (tool, args, timeout = 60_000) => run(tool[0], [...tool.slice(1), ...args], { timeout, env });
  try {
    const [major, minor, patch] = nodeVersion.split('.').map(Number);
    if (!(major > 22 || (major === 22 && (minor > 20 || (minor === 20 && patch >= 0))))) {
      throw new Error('Node.js >=22.20.0 required; install a supported Node.js release');
    }
    await access(home, constants.W_OK);
    tools = commands ?? await npmCommands({ platform, env });
    for (const [name, tool, args] of [
      ['npm', tools.npm, ['--version']], ['npx', tools.npx, ['--version']],
      ['Git', ['git'], ['--version']],
      ...(platform === 'win32' ? [['Windows taskkill', ['taskkill.exe'], ['/?']]] : []),
      ['skills@1.7.2', tools.npx, ['--yes', 'skills@1.7.2', '--version']],
    ]) {
      const result = await execute(tool, args);
      if (result.code !== 0) throw new Error(`${name}: ${result.stderr || result.stdout || 'command failed'}; check installation, PATH, permissions and network`);
      if (name === 'skills@1.7.2' && result.stdout.trim() !== '1.7.2') throw new Error('skills CLI version mismatch; expected 1.7.2');
    }
  } catch (error) {
    errorLog(`Prerequisites failed: ${error.message}`);
    for (const entry of manifest.skills) results.push({ name: entry.name, status: 'skipped', ok: false, detail: 'prerequisites failed; fix the error above and rerun node install.mjs' });
    return finish();
  }
  // Inspect all destinations before starting any installation.
  const plans = [];
  for (const entry of manifest.skills) {
    try {
      if (entry.skills.some((skill) => skill.length > 255)) throw new Error('skill name exceeds CLI destination limit of 255 characters');
      const paths = entry.skills.map((skill) => destinations(home, env, skill, manifest.agents));
      const existing = await Promise.all(paths.map(preflight));
      if (existing.some(Boolean) && !existing.every(Boolean)) throw new Error('destination conflict: partially installed entry; move its selected skills aside before retrying');
      plans.push({ entry, paths, existing });
    } catch (error) { plans.push({ entry, error }); }
  }
  for (const { entry, paths, existing, error } of plans) {
    if (error) {
      results.push({ name: entry.name, status: 'skipped', ok: false, detail: error.message });
      continue;
    }
    if (existing.every(Boolean)) {
      results.push({ name: entry.name, status: 'skipped', ok: true, detail: `already installed and verified; ${existing.map((item) => item.detail).join('; ')}` });
      continue;
    }
    log(`Installing ${entry.name} (${entry.repo})...`);
    try {
      const result = await execute(tools.npx, ['--yes', 'skills@1.7.2', 'add', entry.repo,
        '--global', '--agent', ...manifest.agents, '--skill', ...entry.skills, '--yes'], 300_000);
      if (result.code !== 0) throw new Error(`CLI/download failed (exit ${result.code}): ${result.stderr || result.stdout || result.signal || 'unknown error'}; check network, Git and destination permissions, then rerun`);
      let verified;
      try { verified = await Promise.all(paths.map(verify)); }
      catch (error) { throw new Error(`post-install verification failed: ${error.message}; inspect destinations before retrying`); }
      results.push({ name: entry.name, status: verified.some((item) => item.copied) ? 'copied' : 'linked', ok: true,
        detail: verified.map((item) => item.detail).join('; ') });
    } catch (error) { results.push({ name: entry.name, status: 'failed', ok: false, detail: error.message }); }
  }
  return finish();
}

const invokedPath = process.argv[1] ? await realpath(resolve(process.argv[1])).catch(() => null) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const [command, ...args] = process.argv.slice(2);
  if (!command || command === 'install') process.exitCode = (await runInstaller()).exitCode;
  else if (command === 'status' && args.length === 0) process.exitCode = (await runStatus()).exitCode;
  else if (command === 'update' && args.length === 0) process.exitCode = (await runUpdate()).exitCode;
  else {
    console.error(`Unknown command or arguments: ${[command, ...args].join(' ')}\nUsage: node install.mjs [install|status|update]`);
    process.exitCode = 2;
  }
}
