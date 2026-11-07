// Tiny terminal helpers (no dependencies). Owner: dev3.
import { spawnSync } from 'node:child_process';

const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code) => (text) => (useColor ? `\u001b[${code}m${text}\u001b[0m` : String(text));

export const c = {
  bold: paint('1'),
  dim: paint('2'),
  red: paint('31'),
  green: paint('32'),
  yellow: paint('33'),
  cyan: paint('36'),
};

export const ok = (text) => console.log(`${c.green('✓')} ${text}`);
export const warn = (text) => console.log(`${c.yellow('!')} ${text}`);
export const bad = (text) => console.log(`${c.red('✗')} ${text}`);
export const info = (text) => console.log(`${c.cyan('·')} ${text}`);

/** Run a command with inherited stdio; returns the exit code. Works for npm on Windows too. */
export function run(command, args, { cwd = process.cwd(), env } = {}) {
  const isWindows = process.platform === 'win32';
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    env: env ? { ...process.env, ...env } : process.env,
    shell: isWindows,
  });
  if (result.error) {
    console.error(result.error.message);
    return 1;
  }
  return result.status ?? 1;
}

/** Parse `--flag value` / `--flag` / positional arguments. */
export function parseArgs(argv) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    } else {
      positional.push(arg);
    }
  }
  return { flags, positional };
}
