#!/usr/bin/env node
// `npm run verify` — the definition of "passes" for every task and PR. Owner: dev3.
// Steps stop at the first failure. CI runs `npm run verify -- --ci` plus its own ownership and smoke steps.
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { c, parseArgs, run } from './lib/term.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const { flags } = parseArgs(process.argv.slice(2));

const steps = [
  ['format + lint (biome)', 'npm', ['run', 'check']],
  ['typecheck', 'npm', ['run', 'typecheck']],
  ['tests', 'npm', ['test']],
  ['build', 'npm', ['run', 'build']],
];
if (!flags.ci) steps.push(['ownership', process.execPath, ['scripts/guard.mjs', 'check']]);

const results = [];
for (const [name, command, args] of steps) {
  console.log(c.bold(`\n▶ ${name}`));
  const started = performance.now();
  const code = run(command, args, { cwd: ROOT });
  const seconds = ((performance.now() - started) / 1000).toFixed(1);
  results.push(`${code === 0 ? c.green('✓') : c.red('✗')} ${name} ${c.dim(`${seconds}s`)}`);
  if (code !== 0) {
    console.log(`\n${results.join('\n')}`);
    console.log(c.red(`\n✗ verify failed at "${name}".`));
    if (name.startsWith('format'))
      console.log('  Formatting only? Run `npm run format` (fixes your files), then verify again.');
    console.log(
      "  Fix failures in YOUR files. If the failure is in someone else's area, stop and tell them.",
    );
    process.exit(1);
  }
}
console.log(`\n${results.join('\n')}`);
console.log(c.green('\n✓ verify passed'));
