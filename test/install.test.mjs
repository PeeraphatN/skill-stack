import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm, mkdir, symlink, readFile, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { runInstaller } from '../install.mjs';

async function fixture(t, manifest = { agents: ['codex', 'pi', 'hermes-agent'], skills: [
  { name: 'first', repo: 'owner/first', installer: 'npx-skills', skills: ['first'] },
] }) {
  const home = await realpath(await mkdtemp(join(tmpdir(), 'installer ไทย ')));
  t.after(() => rm(home, { recursive: true, force: true }));
  const manifestPath = join(home, 'manifest.json');
  await writeFile(manifestPath, JSON.stringify(manifest));
  const calls = [];
  const output = [];
  return { home, manifestPath, calls, output, options: {
    home, manifestPath, nodeVersion: '22.23.2', env: {},
    log: (line) => output.push(line),
    errorLog: (line) => output.push(line),
    run: async (executable, args) => {
      calls.push([executable, args]);
      return { code: 0, stdout: args.includes('skills@1.7.2') ? '1.7.2' : '1.0.0', stderr: '' };
    },
  } };
}

test('rejects the entire invalid manifest before executing any command', async (t) => {
  const f = await fixture(t, { agents: ['codex'], skills: [{}] });
  const result = await runInstaller(f.options);
  assert.equal(result.exitCode, 1);
  assert.deepEqual(f.calls, []);
  assert.match(f.output.join('\n'), /skills\[0\]/);
});

test('missing prerequisites skip every entry without attempting installation', async (t) => {
  const f = await fixture(t);
  f.options.nodeVersion = '22.19.0';
  const result = await runInstaller(f.options);
  assert.equal(result.exitCode, 1);
  assert.equal(result.results[0].status, 'skipped');
  assert.deepEqual(f.calls, []);
  assert.match(f.output.join('\n'), /Node.js >=22.20.0/);
});

async function installed(home, skill, copy = false) {
  const source = join(home, '.agents', 'skills', skill);
  const destination = join(home, '.hermes', 'skills', skill);
  await mkdir(source, { recursive: true });
  await writeFile(join(source, 'SKILL.md'), '# skill');
  await mkdir(join(home, '.hermes', 'skills'), { recursive: true });
  if (copy) {
    await mkdir(destination, { recursive: true });
    await writeFile(join(destination, 'SKILL.md'), '# skill');
  } else await symlink(source, destination, 'junction');
}

test('installs explicit skills and agents, verifies links, and skips a complete rerun', async (t) => {
  const f = await fixture(t);
  const prerequisite = f.options.run;
  f.options.run = async (executable, args, options) => {
    if (args.includes('add')) {
      f.calls.push([executable, args]);
      await installed(f.home, 'first');
      return { code: 0, stdout: '', stderr: '' };
    }
    return prerequisite(executable, args, options);
  };
  const result = await runInstaller(f.options);
  assert.equal(result.exitCode, 0);
  assert.equal(result.results[0].status, 'linked');
  assert.deepEqual(f.calls.find(([, args]) => args.includes('add')), ['npx', [
    '--yes', 'skills@1.7.2', 'add', 'owner/first', '--global', '--agent',
    'codex', 'pi', 'hermes-agent', '--skill', 'first', '--yes',
  ]]);
  const rerun = await runInstaller(f.options);
  assert.equal(rerun.exitCode, 0);
  assert.equal(rerun.results[0].status, 'skipped');
  assert.equal(f.calls.filter(([, args]) => args.includes('add')).length, 1);
});

test('continues after failed downloads and zero-exit incomplete installs; accepts verified copies', async (t) => {
  const f = await fixture(t, { agents: ['codex', 'pi', 'hermes-agent'], skills:
    ['download', 'incomplete', 'copied'].map((name) => ({ name, repo: `owner/${name}`, installer: 'npx-skills', skills: [name] })) });
  const prerequisite = f.options.run;
  f.options.run = async (executable, args, options) => {
    if (!args.includes('add')) return prerequisite(executable, args, options);
    f.calls.push([executable, args]);
    if (args.includes('owner/download')) return { code: 1, stderr: 'network unavailable' };
    if (args.includes('owner/copied')) await installed(f.home, 'copied', true);
    return { code: 0, stdout: '', stderr: '' };
  };
  const result = await runInstaller(f.options);
  assert.equal(result.exitCode, 1);
  assert.deepEqual(result.results.map((entry) => entry.status), ['failed', 'failed', 'copied']);
  assert.match(result.results[0].detail, /network unavailable/);
  assert.match(result.results[1].detail, /post-install verification/);
  assert.match(result.results[2].detail, /WARNING.*copied fallback/);
  assert.equal(f.calls.filter(([, args]) => args.includes('add')).length, 3);
});

test('preserves conflicting files and unrelated skills while continuing safe entries', async (t) => {
  const f = await fixture(t, { agents: ['codex', 'hermes-agent'], skills:
    ['conflict', 'safe'].map((name) => ({ name, repo: `owner/${name}`, installer: 'npx-skills', skills: [name] })) });
  const collision = join(f.home, '.hermes', 'skills', 'conflict');
  await mkdir(collision, { recursive: true });
  await writeFile(join(collision, 'SKILL.md'), 'keep my files');
  const unrelated = join(f.home, '.agents', 'skills', 'qwen-agent');
  await mkdir(unrelated, { recursive: true });
  await writeFile(join(unrelated, 'SKILL.md'), 'non-MVP');
  const prerequisite = f.options.run;
  f.options.run = async (executable, args, options) => {
    if (!args.includes('add')) return prerequisite(executable, args, options);
    f.calls.push([executable, args]);
    await installed(f.home, 'safe');
    return { code: 0 };
  };
  const result = await runInstaller(f.options);
  assert.equal(result.exitCode, 1);
  assert.deepEqual(result.results.map((entry) => entry.status), ['skipped', 'linked']);
  assert.match(result.results[0].detail, /destination conflict.*move conflicting files/);
  assert.equal(await readFile(join(collision, 'SKILL.md'), 'utf8'), 'keep my files');
  assert.equal(await readFile(join(unrelated, 'SKILL.md'), 'utf8'), 'non-MVP');
  assert.equal(f.calls.filter(([, args]) => args.includes('add')).length, 1);
});

test('honors HERMES_HOME and rejects a copy missing supporting files', async (t) => {
  const f = await fixture(t);
  f.options.env.HERMES_HOME = ` ${join(f.home, 'profile ไทย')} `;
  const prerequisite = f.options.run;
  f.options.run = async (executable, args, options) => {
    if (!args.includes('add')) return prerequisite(executable, args, options);
    const source = join(f.home, '.agents', 'skills', 'first');
    const destination = join(f.home, 'profile ไทย', 'skills', 'first');
    await mkdir(source, { recursive: true });
    await mkdir(destination, { recursive: true });
    await writeFile(join(source, 'SKILL.md'), 'skill');
    await writeFile(join(source, 'helper.mjs'), 'supporting file');
    await writeFile(join(destination, 'SKILL.md'), 'skill');
    return { code: 0 };
  };
  const result = await runInstaller(f.options);
  assert.equal(result.exitCode, 1);
  assert.match(result.results[0].detail, /profile ไทย.*incomplete.*copy/);
});

test('a missing npm/npx, wrong CLI version, or process error skips installation', async (t) => {
  for (const failure of ['npm', 'npx', 'version', 'throw']) {
    const f = await fixture(t);
    const prerequisite = f.options.run;
    f.options.run = async (executable, args, options) => {
      if (failure === 'throw') throw new Error('spawn unavailable');
      if (executable === failure) return { code: 1, stderr: `${failure} missing` };
      if (failure === 'version' && args.includes('skills@1.7.2')) return { code: 0, stdout: '1.8.0' };
      return prerequisite(executable, args, options);
    };
    const result = await runInstaller(f.options);
    assert.equal(result.exitCode, 1);
    assert.equal(result.results[0].status, 'skipped');
    assert.equal(f.calls.filter(([, args]) => args.includes('add')).length, 0);
  }
});

test('reruns safely with a complete byte-identical copied fallback without overwriting it', async (t) => {
  const f = await fixture(t);
  await installed(f.home, 'first', true);
  const result = await runInstaller(f.options);
  assert.equal(result.exitCode, 0);
  assert.equal(result.results[0].status, 'skipped');
  assert.match(result.results[0].detail, /WARNING.*copied fallback/);
  assert.equal(f.calls.filter(([, args]) => args.includes('add')).length, 0);
});

test('wrong and dangling Hermes links never cause an overwrite', async (t) => {
  for (const dangling of [false, true]) {
    const f = await fixture(t);
    const other = join(f.home, 'other-source');
    if (!dangling) {
      await mkdir(other);
      await writeFile(join(other, 'SKILL.md'), 'other owner');
    }
    await mkdir(join(f.home, '.hermes', 'skills'), { recursive: true });
    await symlink(other, join(f.home, '.hermes', 'skills', 'first'), 'junction');
    const result = await runInstaller(f.options);
    assert.equal(result.exitCode, 1);
    assert.equal(result.results[0].status, 'skipped');
    assert.match(result.results[0].detail, /destination conflict/);
    assert.equal(f.calls.filter(([, args]) => args.includes('add')).length, 0);
    if (!dangling) assert.equal(await readFile(join(other, 'SKILL.md'), 'utf8'), 'other owner');
  }
});

test('Windows requires taskkill before starting processes that may time out', async (t) => {
  const f = await fixture(t);
  f.options.platform = 'win32';
  f.options.commands = { npm: ['npm'], npx: ['npx'] };
  const prerequisite = f.options.run;
  f.options.run = async (executable, args, options) => executable === 'taskkill.exe'
    ? { code: 1, stderr: 'taskkill not available' } : prerequisite(executable, args, options);
  const result = await runInstaller(f.options);
  assert.equal(result.exitCode, 1);
  assert.equal(result.results[0].status, 'skipped');
  assert.match(f.output.join('\n'), /taskkill/);
  assert.equal(f.calls.filter(([, args]) => args.includes('add')).length, 0);
});
