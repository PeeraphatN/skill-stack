import { spawn } from 'node:child_process';
import { access } from 'node:fs/promises';
import { dirname, join } from 'node:path';

// Windows .cmd files require a shell. Execute npm's JS entry points with Node instead.
export async function npmCommands({ platform = process.platform, env = process.env, executable = process.execPath } = {}) {
  if (platform !== 'win32') return { npm: ['npm'], npx: ['npx'] };
  const pathValue = Object.entries(env).find(([key]) => key.toLowerCase() === 'path')?.[1] ?? '';
  const directories = [dirname(executable), ...pathValue.split(';')];
  for (const directory of directories.filter(Boolean)) {
    const bin = join(directory, 'node_modules', 'npm', 'bin');
    try {
      await access(join(bin, 'npm-cli.js'));
      await access(join(bin, 'npx-cli.js'));
      return { npm: [executable, join(bin, 'npm-cli.js')], npx: [executable, join(bin, 'npx-cli.js')] };
    } catch { /* Try the next npm installation on PATH. */ }
  }
  throw new Error('npm/npx JS entry points not found; install Node.js with npm and add it to PATH');
}

export function runProcess(executable, args, { timeout = 60_000, env = process.env } = {}) {
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    const child = spawn(executable, args, { shell: false, env, windowsHide: true, detached: process.platform !== 'win32', stdio: ['ignore', 'pipe', 'pipe'] });
    const timer = setTimeout(() => {
      timedOut = true;
      if (process.platform === 'win32') {
        // Kill the entire npm -> skills -> git tree without cmd.exe.
        const killer = spawn('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], { shell: false, windowsHide: true, stdio: 'ignore' });
        killer.on('error', () => child.kill('SIGKILL'));
      } else {
        try { process.kill(-child.pid, 'SIGKILL'); }
        catch { child.kill('SIGKILL'); }
      }
    }, timeout);
    child.stdout.on('data', (chunk) => { stdout = (stdout + chunk).slice(-1_000_000); });
    child.stderr.on('data', (chunk) => { stderr = (stderr + chunk).slice(-1_000_000); });
    child.on('error', (error) => { clearTimeout(timer); resolve({ code: 1, stdout, stderr: error.message }); });
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      resolve({ code: timedOut ? 1 : code ?? 1, stdout, stderr: timedOut ? `Timed out after ${timeout / 1000}s` : stderr, signal });
    });
  });
}
