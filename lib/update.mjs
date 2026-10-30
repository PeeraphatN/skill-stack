import { readFile, access, constants } from 'node:fs/promises';
import { homedir } from 'node:os';
import { destinations, preflight, verify } from './destinations.mjs';
import { parseManifest } from './manifest.mjs';
import { npmCommands, runProcess } from './process.mjs';

function supportedNodeVersion(version) {
  const [major, minor, patch] = version.split('.').map(Number);
  return major > 22 || (major === 22 && (minor > 20 || (minor === 20 && patch >= 0)));
}

export async function runUpdate({ manifestPath = new URL('../manifest.json', import.meta.url),
  log = console.log, errorLog = console.error, home = homedir(), env = process.env,
  nodeVersion = process.versions.node, run = runProcess, platform = process.platform, commands } = {}) {
  let manifest;
  try {
    manifest = parseManifest(await readFile(manifestPath, 'utf8'));
  } catch (error) {
    errorLog(`Manifest failed: ${error.message}`);
    return { exitCode: 1, results: [] };
  }

  const plans = [];
  for (const entry of manifest.skills) {
    const skills = [];
    let problem;
    for (const skill of entry.skills) {
      try {
        const installed = await preflight(destinations(home, env, skill, manifest.agents));
        skills.push({ skill, installed: Boolean(installed), detail: installed?.detail });
      } catch (error) {
        skills.push({ skill, conflict: error.message });
        problem = true;
      }
    }
    plans.push({ entry, skills, problem });
  }

  const results = [];
  for (const plan of plans) {
    if (plan.problem) {
      for (const item of plan.skills) results.push(item.conflict
        ? { name: `${plan.entry.name}/${item.skill}`, status: 'conflict', ok: false, detail: item.conflict }
        : { name: `${plan.entry.name}/${item.skill}`, status: 'skipped', ok: false, detail: 'entry has a destination conflict; resolve it before updating this source' });
    } else if (plan.skills.some((item) => !item.installed)) {
      for (const item of plan.skills) results.push({ name: `${plan.entry.name}/${item.skill}`,
        status: item.installed ? 'skipped' : 'missing', ok: false,
        detail: item.installed ? 'entry is incomplete; install missing skills before updating it' : 'not installed; run node install.mjs to install it' });
    }
  }

  const updatable = plans.filter((plan) => !plan.problem && plan.skills.every((item) => item.installed));
  if (updatable.length === 0) {
    log('\nUpdate summary:');
    for (const result of results) log(`${result.status}: ${result.name} — ${result.detail}`);
    if (results.length === 0) log('No manifest skills to update.');
    return { exitCode: results.some((result) => !result.ok) ? 1 : 0, results };
  }

  let tools;
  const execute = (tool, args, timeout = 60_000) => run(tool[0], [...tool.slice(1), ...args], { timeout, env });
  try {
    if (!supportedNodeVersion(nodeVersion)) throw new Error('Node.js >=22.20.0 required; install a supported Node.js release');
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
    for (const plan of updatable) for (const item of plan.skills) results.push({
      name: `${plan.entry.name}/${item.skill}`, status: 'failed', ok: false, detail: 'prerequisites failed; fix the error above and retry',
    });
    log('\nUpdate summary:');
    for (const result of results) log(`${result.status}: ${result.name} — ${result.detail}`);
    return { exitCode: 1, results };
  }

  for (const plan of updatable) {
    const names = plan.skills.map((item) => item.skill);
    log(`Updating ${plan.entry.name} (${names.join(', ')})...`);
    try {
      const result = await execute(tools.npx, ['--yes', 'skills@1.7.2', 'update', ...names, '--global', '--yes'], 300_000);
      if (result.code !== 0) throw new Error(`CLI/update failed (exit ${result.code}): ${result.stderr || result.stdout || result.signal || 'unknown error'}; check network, Git and destination permissions, then rerun`);
      if (/No installed skills found matching|cannot be checked automatically/i.test(`${result.stdout}\n${result.stderr}`)) {
        throw new Error(`CLI/update could not update the selected skills: ${result.stdout || result.stderr}`);
      }
      for (const skill of names) {
        try {
          const verified = await verify(destinations(home, env, skill, manifest.agents));
          results.push({ name: `${plan.entry.name}/${skill}`, status: 'updated', ok: true, detail: verified.detail });
        } catch (error) {
          results.push({ name: `${plan.entry.name}/${skill}`, status: 'failed', ok: false,
            detail: `post-update verification failed: ${error.message}` });
        }
      }
    } catch (error) {
      for (const skill of names) results.push({ name: `${plan.entry.name}/${skill}`,
        status: 'failed', ok: false, detail: error.message });
    }
  }

  log('\nUpdate summary:');
  for (const result of results) log(`${result.status}: ${result.name} — ${result.detail}`);
  return { exitCode: results.some((result) => !result.ok) ? 1 : 0, results };
}
