import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseManifest, validateManifest } from '../lib/manifest.mjs';

function example() {
  return {
    agents: ['codex', 'pi', 'hermes-agent'],
    skills: [{
      name: 'example', repo: 'someone/public-skills', installer: 'npx-skills',
      skills: ['example-skill'],
    }],
  };
}

test('accepts an explicit public repository selection for supported agents', () => {
  const manifest = example();
  assert.deepEqual(parseManifest(JSON.stringify(manifest)), manifest);
  assert.equal(validateManifest(manifest), manifest);
});

function rejectsAt(manifest, path, reason) {
  assert.throws(() => validateManifest(manifest), (error) => {
    assert.ok(error.message.startsWith(`${path}:`), error.message);
    assert.match(error.message, reason);
    return true;
  });
}

test('rejects malformed JSON with a manifest location', () => {
  assert.throws(() => parseManifest('{'), /manifest: invalid JSON/);
});

test('requires exactly the documented object fields and nonempty lists', () => {
  for (const value of [null, [], 'text', 5, true]) {
    rejectsAt(value, 'manifest', /object/);
  }
  for (const key of ['agents', 'skills']) {
    const missing = example();
    delete missing[key];
    rejectsAt(missing, key, /required/);
    for (const value of [null, {}, 'text', 5, []]) {
      rejectsAt({ ...example(), [key]: value }, key, /nonempty array/);
    }
  }
  rejectsAt({ ...example(), version: 1 }, 'version', /unknown field/);
  for (const value of [null, [], 'text', 5]) {
    rejectsAt({ ...example(), skills: [value] }, 'skills[0]', /object/);
  }
  for (const key of ['name', 'repo', 'installer', 'skills']) {
    const manifest = example();
    delete manifest.skills[0][key];
    rejectsAt(manifest, `skills[0].${key}`, /required/);
  }
  for (const value of [null, {}, 'text', 5, []]) {
    const manifest = example();
    manifest.skills[0].skills = value;
    rejectsAt(manifest, 'skills[0].skills', /nonempty array/);
  }
  const unknown = example();
  unknown.skills[0].args = ['--force'];
  rejectsAt(unknown, 'skills[0].args', /unknown field/);
});

test('rejects unsupported agents, installers, unsafe identifiers and sources', () => {
  for (const value of ['', ' ', null, 42, {}, [], 'hermes', '*', '--all', 'codex;id']) {
    rejectsAt({ ...example(), agents: [value] }, 'agents[0]', /supported agent/);
  }
  for (const value of ['', ' ', null, 42, {}, [], 'bash', 'npx-skills --force']) {
    const manifest = example();
    manifest.skills[0].installer = value;
    rejectsAt(manifest, 'skills[0].installer', /npx-skills/);
  }
  for (const value of ['', ' ', null, 42, {}, [], '*', '../skill', '--all', 'two words', 'foo;id', '$(id)', 'UPPER']) {
    for (const field of ['name', 'skills']) {
      const manifest = example();
      manifest.skills[0][field] = field === 'skills' ? [value] : value;
      rejectsAt(manifest, `skills[0].${field}${field === 'skills' ? '[0]' : ''}`, /identifier/);
    }
  }
  for (const value of ['', ' ', null, 42, {}, [], 'owner', '/tmp/skills', './local', 'https://github.com/owner/repo', 'owner/repo@main', 'owner/repo/tree/main', '--owner/repo', 'owner/repo --force', 'owner/$(id)', 'owner/..']) {
    const manifest = example();
    manifest.skills[0].repo = value;
    rejectsAt(manifest, 'skills[0].repo', /owner\/repository/);
  }
});

test('rejects repeated agents, entry names and destination names across all sources', () => {
  rejectsAt({ ...example(), agents: ['pi', 'pi'] }, 'agents[1]', /duplicate.*agents\[0\]/);
  const sameEntry = example();
  sameEntry.skills.push({ ...sameEntry.skills[0], skills: ['different'] });
  rejectsAt(sameEntry, 'skills[1].name', /duplicate.*skills\[0\]\.name/);
  const sameSkill = example();
  sameSkill.skills[0].skills.push('example-skill');
  rejectsAt(sameSkill, 'skills[0].skills[1]', /destination conflict.*skills\[0\]\.skills\[0\]/);
  const conflict = example();
  conflict.skills.push({
    name: 'other', repo: 'other/repository', installer: 'npx-skills',
    skills: ['example-skill'],
  });
  rejectsAt(conflict, 'skills[1].skills[0]', /destination conflict.*skills\[0\]\.skills\[0\]/);
});

test('allows extending public sources and using a supported subset of agents', () => {
  const manifest = example();
  manifest.agents = ['hermes-agent'];
  manifest.skills.push({
    name: 'another-selection', repo: 'someone/public-skills', installer: 'npx-skills',
    skills: ['another-skill'],
  });
  assert.deepEqual(parseManifest(JSON.stringify(manifest)), manifest);
});

test('ships exactly the selected Issue #5 MVP skills for all three agents', async () => {
  const { readFile } = await import('node:fs/promises');
  const manifest = parseManifest(await readFile(new URL('../manifest.json', import.meta.url), 'utf8'));
  assert.deepEqual(manifest.agents, ['codex', 'pi', 'hermes-agent']);
  // Expected selection from the ticket, independently of validator implementation.
  assert.deepEqual(manifest.skills.map(({ repo, skills }) => [repo, skills]), [
    ['DietrichGebert/ponytail', ['ponytail', 'ponytail-audit', 'ponytail-debt']],
    ['petergyang/no-ai-slop', ['no-ai-slop']],
    ['mattpocock/skills', [
      'code-review', 'codebase-design', 'domain-modeling', 'grill-with-docs', 'implement',
      'improve-codebase-architecture', 'pr', 'research', 'retro', 'tdd', 'to-spec',
      'to-tickets', 'triage', 'wayfinder', 'writing-for-agents',
    ]],
    ['thananon/9arm-skills', ['debug-mantra', 'post-mortem', 'scrutinize', 'management-talk']],
  ]);
});
