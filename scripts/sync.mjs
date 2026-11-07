#!/usr/bin/env node
// Bring the latest main into your branch, safely. Owner: dev3.
//
//   npm run sync             fetch + merge origin/main into your branch (refuses on main or with uncommitted changes)
//   npm run sync -- --check  preview: which files would conflict, and who owns them (changes nothing; git 2.38+)
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  aheadBehind,
  currentBranch,
  git,
  gitRaw,
  gitVersion,
  hasRemote,
  lines,
  refExists,
  repoRoot,
  versionAtLeast,
} from './lib/git.mjs';
import { branchProblem, loadOwnership, ownerOf, resolveRole } from './lib/ownership.mjs';
import { bad, c, info, ok, parseArgs, run, warn } from './lib/term.mjs';

const { flags } = parseArgs(process.argv.slice(2));
const root = repoRoot(process.cwd());
if (!root) {
  console.error('sync: not inside a git repository');
  process.exit(1);
}
const g = (args, opts = {}) => git(args, { cwd: root, ...opts });

function describe(files) {
  const { role } = resolveRole(root);
  const { rules } = loadOwnership(root);
  return files.map((file) => {
    const { owner } = ownerOf(file, rules);
    const tag =
      file === 'package-lock.json'
        ? 'generated — regenerate'
        : owner === role
          ? 'yours'
          : `owner: ${owner}`;
    return `  - ${file}  ${c.dim(`(${tag})`)}`;
  });
}

function main() {
  const { role } = resolveRole(root);
  const branch = currentBranch(root);
  const problem = branchProblem(role, branch);
  if (problem) {
    bad(problem);
    return 1;
  }
  if (!hasRemote('origin', root)) {
    warn('No "origin" remote — nothing to sync yet.');
    return 0;
  }
  info('git fetch origin…');
  if (g(['fetch', '-q', 'origin'], { allowFail: true }) === null) {
    bad('git fetch failed (offline or no access?).');
    return 1;
  }
  if (!refExists('origin/main', root)) {
    warn('origin/main does not exist yet.');
    return 0;
  }
  const status = aheadBehind('origin/main', root);
  if (!status?.behind) {
    ok(
      `Already up to date with origin/main (${status?.ahead ?? 0} commit(s) of yours not in main yet).`,
    );
    return 0;
  }

  if (flags.check) {
    if (!versionAtLeast(gitVersion(), [2, 38])) {
      warn(
        'Conflict preview needs git 2.38+. Run `npm run sync` and it will stop safely on conflicts.',
      );
      return 0;
    }
    const preview = gitRaw(
      ['merge-tree', '--write-tree', '--name-only', '--no-messages', 'HEAD', 'origin/main'],
      root,
    );
    if (preview.status === 0) {
      ok(`Merging ${status.behind} commit(s) from origin/main would be clean.`);
      return 0;
    }
    if (preview.status !== 1) {
      bad(`git merge-tree failed: ${preview.stderr.trim()}`);
      return 1;
    }
    const files = lines(preview.stdout).slice(1); // first line is the tree id
    warn(`Merging origin/main would conflict in ${files.length} file(s):`);
    for (const line of describe(files)) console.log(line);
    return 1;
  }

  const dirty = g(['status', '--porcelain', '--untracked-files=no']);
  if (dirty) {
    bad(
      "You have uncommitted changes. Commit your own work first (never stash or discard someone else's).",
    );
    return 1;
  }

  const before = g(['rev-parse', 'HEAD']);
  info(`merging ${status.behind} commit(s) from origin/main…`);
  if (run('git', ['merge', '--no-edit', 'origin/main'], { cwd: root }) !== 0) {
    const conflicts = lines(
      g(['diff', '--name-only', '--diff-filter=U'], { allowFail: true }) ?? '',
    );
    bad(`Merge stopped with conflicts in ${conflicts.length} file(s):`);
    for (const line of describe(conflicts)) console.log(line);
    console.log(`
${c.bold('What to do')}
  • package-lock.json → git checkout --theirs package-lock.json && npm install && git add package-lock.json
  • files you own     → resolve them, git add <file>, then git commit --no-edit
  • anyone else's     → git merge --abort, and tell the owner + your human (never resolve their files)`);
    return 1;
  }

  const changed = lines(g(['diff', '--name-only', before, 'HEAD']));
  ok(`Merged origin/main (${changed.length} file(s) changed).`);
  if (changed.some((f) => f === 'package-lock.json' || f.endsWith('package.json'))) {
    info('dependencies changed — running npm install…');
    run('npm', ['install'], { cwd: root });
  }
  if (changed.some((f) => /apps\/api\/src\/features\/[^/]+\/schema\.ts$/.test(f))) {
    warn('DB schema changed — run `npm run db:reset` to recreate your local database.');
  }
  if (existsSync(join(root, 'scripts/guard.mjs')))
    run(process.execPath, ['scripts/guard.mjs', 'check'], { cwd: root });
  return 0;
}

process.exitCode = main();
