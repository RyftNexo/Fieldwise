#!/usr/bin/env node
// Extra working copies of this repo on the SAME laptop (optional). Owner: dev3.
//
//   npm run worktree -- <topic>        new folder ../<repo>-<topic> on branch <role>/<topic> (from origin/main)
//   npm run worktree -- --main         ../<repo>-main: read-only checkout of origin/main (merge captain verifies here)
//   npm run worktree -- --list
//   npm run worktree -- --remove <topic>
//
// Use one only when you run a second agent session in parallel. Never point two agents at one folder.
import { copyFileSync, existsSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { git, hasRemote, refExists, repoRoot } from './lib/git.mjs';
import { resolveRole } from './lib/ownership.mjs';
import { bad, c, info, ok, parseArgs, run } from './lib/term.mjs';

const root = repoRoot(process.cwd());
if (!root) {
  console.error('worktree: not inside a git repository');
  process.exit(1);
}
// Always place worktrees beside the MAIN checkout, even when run from inside a worktree.
const commonDir = git(['rev-parse', '--path-format=absolute', '--git-common-dir'], {
  cwd: root,
  allowFail: true,
});
const mainRoot = commonDir ? dirname(commonDir) : root;
const repoName = basename(mainRoot);
const { flags, positional } = parseArgs(process.argv.slice(2));
const g = (args) => git(args, { cwd: root });

function copyEnv(target) {
  for (const dir of ['apps/api', 'apps/web']) {
    const from = join(mainRoot, dir, '.env');
    if (existsSync(from) && !existsSync(join(target, dir, '.env')))
      copyFileSync(from, join(target, dir, '.env'));
  }
}

function main() {
  if (flags.list) return run('git', ['worktree', 'list'], { cwd: root });

  if (flags.remove) {
    const target = join(dirname(mainRoot), `${repoName}-${flags.remove}`);
    // `git worktree remove` refuses when there is uncommitted work — never force it.
    return run('git', ['worktree', 'remove', target], { cwd: root });
  }

  if (hasRemote('origin', root)) git(['fetch', '-q', 'origin'], { cwd: root, allowFail: true });
  const start = refExists('origin/main', root) ? 'origin/main' : 'main';

  if (flags.main) {
    const target = join(dirname(mainRoot), `${repoName}-main`);
    if (existsSync(target)) {
      run('git', ['-C', target, 'checkout', '-q', '--detach', start], { cwd: root });
      ok(`updated ${target} to ${start}`);
    } else {
      g(['worktree', 'add', '-q', '--detach', target, start]);
      copyEnv(target);
      ok(`created ${target} (detached at ${start} — commits are blocked there by design)`);
    }
    console.log(`\n  cd "${target}" && npm ci && npm run verify && npm run build && npm run smoke`);
    return 0;
  }

  const topic = positional[0];
  if (!topic || !/^[a-z0-9][a-z0-9-]*$/.test(topic)) {
    bad('Usage: npm run worktree -- <topic>   (lowercase letters, digits, dashes)');
    return 1;
  }
  const { role } = resolveRole(root);
  if (!role) {
    bad('No role set — run node scripts/setup-dev.mjs <role> first.');
    return 1;
  }
  const branch = `${role}/${topic}`;
  const target = join(dirname(mainRoot), `${repoName}-${topic}`);
  if (existsSync(target)) {
    bad(`${target} already exists.`);
    return 1;
  }
  g(['worktree', 'add', '-q', '-b', branch, target, start]);
  git(['branch', '-q', '--unset-upstream', branch], { cwd: root, allowFail: true });
  copyEnv(target);
  ok(`created ${c.bold(target)} on branch ${c.bold(branch)} (from ${start})`);
  info('Role and hooks are shared with this clone automatically.');
  console.log(`\n  cd "${target}" && npm install\n  then start your agent there (claude / codex)`);
  return 0;
}

process.exitCode = main();
