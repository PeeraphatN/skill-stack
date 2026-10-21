import { lstat, stat, realpath, readFile, readdir, access, constants } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';

async function info(path) {
  try { return await lstat(path); } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

export function destinations(home, env, skill, agents) {
  const source = join(home, '.agents', 'skills', skill);
  const paths = [{ agent: 'global', path: source }];
  for (const agent of agents) paths.push({ agent, path: agent === 'hermes-agent'
    ? resolve(env.HERMES_HOME?.trim() || join(home, '.hermes'), 'skills', skill) : source });
  return paths;
}

async function skillFile(path) {
  if (!(await stat(join(path, 'SKILL.md'))).isFile()) throw new Error(`${path}: SKILL.md is not a file`);
  await access(join(path, 'SKILL.md'), constants.R_OK);
}

export async function verify(paths) {
  const source = paths[0].path;
  const canonical = await realpath(source);
  if ((await lstat(source)).isSymbolicLink()) throw new Error(`${source}: global source is a link; review it manually`);
  await skillFile(source);
  const details = [];
  for (const { agent, path } of paths.slice(1)) {
    await skillFile(path);
    if (path === source) details.push(`${agent}: shared ${path}`);
    else if ((await lstat(path)).isSymbolicLink()) {
      if (await realpath(path) !== canonical) throw new Error(`${path}: link points to another source`);
      details.push(`${agent}: linked ${path}`);
    } else {
      if (!await sameTree(source, path)) throw new Error(`${path}: incomplete or different copy fallback`);
      details.push(`WARNING ${agent}: copied fallback ${path}`);
    }
  }
  return { copied: details.some((detail) => detail.startsWith('WARNING')), detail: details.join('; ') };
}

// Compare the full copy, not just SKILL.md; do not follow links in copied trees.
async function sameTree(left, right) {
  const a = await lstat(left);
  const b = await lstat(right);
  if (a.isSymbolicLink() || b.isSymbolicLink()) return false;
  if (a.isFile() && b.isFile()) return (await readFile(left)).equals(await readFile(right));
  if (!a.isDirectory() || !b.isDirectory()) return false;
  const names = (await readdir(left)).sort();
  const others = (await readdir(right)).sort();
  if (names.length !== others.length || names.some((name, index) => name !== others[index])) return false;
  for (const name of names) if (!await sameTree(join(left, name), join(right, name))) return false;
  return true;
}

export async function preflight(paths) {
  let existing = false;
  for (const { path } of paths) {
    // A redirected parent could cause the CLI to clean unrelated directories.
    let parent = dirname(path);
    let checkedWritable = false;
    while (parent !== dirname(parent)) {
      const value = await info(parent);
      if (value?.isSymbolicLink()) throw new Error(`${parent}: linked parent; review this destination manually`);
      if (value && !value.isDirectory()) throw new Error(`${parent}: parent is not a directory`);
      if (value && !checkedWritable) {
        await access(parent, constants.W_OK);
        checkedWritable = true;
      }
      parent = dirname(parent);
    }
    if (await info(path)) existing = true;
  }
  if (!existing) return null;
  try {
    return await verify(paths);
  } catch (error) {
    throw new Error(`destination conflict: ${paths.map(({ path }) => path).filter((path, i, all) => all.indexOf(path) === i).join(', ')}; ${error.message}; move conflicting files aside yourself, then rerun`);
  }
}
