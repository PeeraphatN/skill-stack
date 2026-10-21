function fail(path, reason) {
  throw new Error(`${path}: ${reason}`);
}

function objectFields(value, fields, path) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    fail(path || 'manifest', 'expected an object');
  }
  const fieldPath = (key) => path ? `${path}.${key}` : key;
  for (const key of Object.keys(value)) {
    if (!fields.includes(key)) fail(fieldPath(key), 'unknown field');
  }
  for (const key of fields) {
    if (!Object.hasOwn(value, key)) fail(fieldPath(key), 'required field');
  }
}

function nonemptyArray(value, path) {
  if (!Array.isArray(value) || value.length === 0) {
    fail(path, 'expected a nonempty array');
  }
}

function identifier(value, path) {
  if (typeof value !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
    fail(path, 'expected a lowercase identifier (letters, digits, single hyphens)');
  }
}

function unique(value, path, seen, reason) {
  if (seen.has(value)) fail(path, `${reason}; first selected at ${seen.get(value)}`);
  seen.set(value, path);
}

/** Validate parsed data without installing or changing files. Returns the input. */
export function validateManifest(manifest) {
  objectFields(manifest, ['agents', 'skills'], '');
  nonemptyArray(manifest.agents, 'agents');
  nonemptyArray(manifest.skills, 'skills');
  const agents = new Map();
  const names = new Map();
  const destinations = new Map();
  manifest.agents.forEach((agent, index) => {
    if (!['codex', 'pi', 'hermes-agent'].includes(agent)) {
      fail(`agents[${index}]`, 'expected a supported agent: codex, pi, hermes-agent');
    }
    unique(agent, `agents[${index}]`, agents, 'duplicate agent');
  });
  manifest.skills.forEach((entry, index) => {
    const path = `skills[${index}]`;
    objectFields(entry, ['name', 'repo', 'installer', 'skills'], path);
    identifier(entry.name, `${path}.name`);
    unique(entry.name, `${path}.name`, names, 'duplicate entry name');
    if (typeof entry.repo !== 'string' ||
        !/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?\/[A-Za-z0-9][A-Za-z0-9._-]*$/.test(entry.repo)) {
      fail(`${path}.repo`, 'expected a GitHub owner/repository, without URL, path, ref or flags');
    }
    if (entry.installer !== 'npx-skills') {
      fail(`${path}.installer`, 'only npx-skills is supported');
    }
    nonemptyArray(entry.skills, `${path}.skills`);
    entry.skills.forEach((skill, skillIndex) => {
      const skillPath = `${path}.skills[${skillIndex}]`;
      identifier(skill, skillPath);
      unique(skill, skillPath, destinations, 'destination conflict');
    });
  });
  return manifest;
}

/** Parse JSON and validate the full manifest before callers perform any work. */
export function parseManifest(text) {
  let manifest;
  try {
    manifest = JSON.parse(text);
  } catch (error) {
    throw new Error(`manifest: invalid JSON (${error.message})`);
  }
  return validateManifest(manifest);
}
