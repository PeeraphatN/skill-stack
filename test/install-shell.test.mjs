import assert from 'node:assert/strict';
import { cp, mkdtemp, mkdir, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

test('shell wrapper runs its adjacent installer from another cwd and preserves arguments and status', {
  skip: process.platform === 'win32' && 'POSIX shell wrapper targets Linux/macOS',
}, async (t) => {
  const directory = await realpath(await mkdtemp(join(tmpdir(), 'wrapper ไทย ')));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const checkout = join(directory, 'checkout ไทย');
  const cwd = join(directory, 'other cwd');
  await mkdir(checkout);
  await mkdir(cwd);
  const wrapper = join(checkout, 'install.sh');
  await cp(new URL('../install.sh', import.meta.url), wrapper);
  await writeFile(join(checkout, 'install.mjs'), `
    console.log(JSON.stringify({ cwd: process.cwd(), args: process.argv.slice(2) }));
    process.exitCode = Number(process.env.WRAPPER_TEST_EXIT);
  `);
  const args = ['', 'ไทย spaces', '*', '$(echo unsafe); &', '--example'];
  for (const code of [0, 37]) {
    for (const [command, prefix] of [['/bin/sh', [wrapper]], [wrapper, []]]) {
      const result = spawnSync(command, [...prefix, ...args], {
        cwd, env: { ...process.env, WRAPPER_TEST_EXIT: String(code), CDPATH: directory },
        encoding: 'utf8', timeout: 10_000,
      });
      assert.equal(result.error, undefined);
      assert.equal(result.status, code, result.stderr);
      assert.deepEqual(JSON.parse(result.stdout), { cwd, args });
    }
  }
});
