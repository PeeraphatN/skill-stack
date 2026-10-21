import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile, cp, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { npmCommands, runProcess } from '../lib/process.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));

test('CLI loads its adjacent manifest from another working directory and exits nonzero with no npm', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'installer CLI ไทย '));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await writeFile(join(directory, 'manifest.json'), '{');
  const script = join(root, 'install.mjs');
  const result = spawnSync(process.execPath, [script], {
    cwd: directory, env: { ...process.env, PATH: '', Path: '' }, encoding: 'utf8', timeout: 10_000,
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Prerequisites failed:.*(?:npm|Git)/);
  assert.doesNotMatch(result.stderr, /invalid JSON/);
  assert.match(result.stdout, /skipped: ponytail/);
});

test('CLI rejects its invalid manifest before starting prerequisites, including through a symlink', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'installer invalid ไทย '));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await cp(join(root, 'lib'), join(directory, 'lib'), { recursive: true });
  await cp(join(root, 'install.mjs'), join(directory, 'install.mjs'));
  await writeFile(join(directory, 'manifest.json'), '{');
  const script = join(directory, 'alias.mjs');
  if (process.platform === 'win32') {
    // Creating a file symlink needs elevated privileges on some Windows hosts.
    await cp(join(directory, 'install.mjs'), script);
  } else await symlink(join(directory, 'install.mjs'), script);
  const result = spawnSync(process.execPath, [script], { cwd: tmpdir(), encoding: 'utf8', timeout: 10_000 });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Manifest failed: manifest: invalid JSON/);
});

test('Windows npm/npx use JS entry points through Node even with spaces in their path', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'npm windows ไทย '));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const bin = join(directory, 'node_modules', 'npm', 'bin');
  await mkdir(bin, { recursive: true });
  await writeFile(join(bin, 'npm-cli.js'), '');
  await writeFile(join(bin, 'npx-cli.js'), '');
  const commands = await npmCommands({ platform: 'win32', env: { Path: directory }, executable: join(directory, 'node.exe') });
  assert.deepEqual(commands, {
    npm: [join(directory, 'node.exe'), join(bin, 'npm-cli.js')],
    npx: [join(directory, 'node.exe'), join(bin, 'npx-cli.js')],
  });
  await assert.rejects(npmCommands({ platform: 'win32', env: {}, executable: join(directory, 'absent', 'node.exe') }), /npm\/npx.*not found/);
});

test('process runner passes arguments literally and reports missing executables and timeout', async () => {
  const literal = 'ไทย spaces; $(echo unsafe) & echo unsafe';
  const result = await runProcess(process.execPath, ['-e', 'console.log(process.argv[1])', literal]);
  assert.equal(result.code, 0);
  assert.equal(result.stdout.trim(), literal);
  const missing = await runProcess('skill-stack-nonexistent-executable', []);
  assert.equal(missing.code, 1);
  const timeout = await runProcess(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { timeout: 100 });
  assert.equal(timeout.code, 1);
  assert.match(timeout.stderr, /Timed out/);
});

test('a timeout stops descendant processes before they can write destinations', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'installer timeout '));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const marker = join(directory, 'should-not-exist');
  const childScript = `setTimeout(() => { require('node:fs').writeFileSync(process.argv[1], 'unsafe'); }, 700);`;
  const parentScript = `require('node:child_process').spawn(process.execPath, ['-e', ${JSON.stringify(childScript)}, process.argv[1]], { stdio: 'inherit' }); setInterval(() => {}, 1000);`;
  const result = await runProcess(process.execPath, ['-e', parentScript, marker], { timeout: 250 });
  assert.equal(result.code, 1);
  await new Promise((resolve) => setTimeout(resolve, 800));
  const { access } = await import('node:fs/promises');
  await assert.rejects(access(marker), { code: 'ENOENT' });
});
