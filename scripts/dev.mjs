/**
 * Development runner: watches the shared package, then starts the API and the
 * Vite dev server (which proxies /ws to the API).
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const children = [];

function run(name, args) {
  const child = spawn('npm', args, { cwd: root, stdio: 'inherit', shell: true });
  child.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`[${name}] exited with code ${code}`);
      shutdown(code);
    }
  });
  children.push(child);
  return child;
}

function shutdown(code = 0) {
  for (const child of children) child.kill();
  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

// The shared package is consumed from dist, so it must be built once up front.
const build = spawn('npm', ['run', 'build', '-w', '@zudoku/shared'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
});

build.on('exit', (code) => {
  if (code !== 0) shutdown(code ?? 1);
  run('shared', ['run', 'dev', '-w', '@zudoku/shared']);
  run('server', ['run', 'dev', '-w', '@zudoku/server']);
  run('client', ['run', 'dev', '-w', '@zudoku/client']);
});
