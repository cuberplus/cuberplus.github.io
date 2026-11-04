import { spawnSync } from 'node:child_process';
import { cpSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
function npm(args, directory = root) {
  const result = spawnSync(process.execPath, [process.env.npm_execpath, ...args], {
    cwd: directory, stdio: 'inherit',
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (process.argv.includes('--install')) {
  for (const app of ['scrambler', 'smartcubeanalyzer', 'timer']) {
    npm(['ci', '--no-audit', '--no-fund'], path.join(root, app));
  }
} else {
  npm(['run', 'build:home']);
  for (const app of ['scrambler', 'smartcubeanalyzer', 'timer']) {
    const directory = path.join(root, app);
    npm(['run', 'build'], directory);
    const destination = path.join(root, 'build', app);
    rmSync(destination, { recursive: true, force: true });
    cpSync(path.join(directory, 'build'), destination, { recursive: true });
  }
}
