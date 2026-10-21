import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const script = fileURLToPath(new URL('../scripts/validate-manifest.mjs', import.meta.url));

test('validation CLI works from another directory and reports invalid input without installing', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'manifest ทดสอบ '));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const run = (...args) => spawnSync(process.execPath, [script, ...args], {
    cwd: directory, encoding: 'utf8',
  });
  const valid = run();
  assert.equal(valid.status, 0, valid.stderr);
  assert.match(valid.stdout, /Manifest valid/);
  assert.equal(valid.stderr, '');

  const invalidPath = join(directory, 'ข้อมูลผิด.json');
  await writeFile(invalidPath, '{"agents":["hermes"],"skills":[{}]}');
  const invalid = run(invalidPath);
  assert.equal(invalid.status, 1);
  assert.match(invalid.stderr, /agents\[0\]:.*supported agent/);
  assert.equal(invalid.stdout, '');

  await writeFile(invalidPath, '{');
  const brokenJson = run(invalidPath);
  assert.equal(brokenJson.status, 1);
  assert.match(brokenJson.stderr, /manifest: invalid JSON/);

  const missing = run(join(directory, 'missing.json'));
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /missing\.json/);
});
