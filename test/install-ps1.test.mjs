import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

// Static contract checks run without PowerShell; native execution belongs to #9.
test('PowerShell wrapper delegates to its sibling installer and preserves the result', async () => {
  const script = await readFile(new URL('../install.ps1', import.meta.url), 'utf8');
  // Fail if Node cannot start instead of falling through to a stale exit code.
  assert.match(script, /^\$ErrorActionPreference\s*=\s*'Stop'\s*$/m);
  // Quoted, script-relative path; forward arguments without rebuilding a command string.
  assert.match(script, /^& node \(Join-Path \$PSScriptRoot 'install\.mjs'\) @args\s*$/m);
  assert.match(script, /^exit \$LASTEXITCODE\s*$/m);
  // Relative HERMES_HOME must still refer to the caller's working directory.
  assert.doesNotMatch(script, /\b(?:Set-Location|Push-Location|Pop-Location|cd|chdir)\b/i);
});
