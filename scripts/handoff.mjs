#!/usr/bin/env node
// Generate the standard handoff block for a PR description. Owner: dev3.
//
//   npm run handoff -- D1-03            fill what git knows; you complete the rest honestly
//   npm run handoff -- D1-03 --verify   also run `npm run verify` and record the result
//
// Also saved to .scratch/handoff-<ID>.md (gitignored) so you can paste it into the PR.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { baseRef, currentBranch, git, lines, repoRoot } from './lib/git.mjs';
import { resolveRole } from './lib/ownership.mjs';
import { loadAllTasks } from './lib/tasks.mjs';
import { c, ok, parseArgs, run, warn } from './lib/term.mjs';

const root = repoRoot(process.cwd());
if (!root) {
  console.error('handoff: not inside a git repository');
  process.exit(1);
}
const { flags, positional } = parseArgs(process.argv.slice(2));
const id = positional[0];
const g = (args) => git(args, { cwd: root, allowFail: true }) ?? '';

const { role } = resolveRole(root);
const branch = currentBranch(root) ?? '(detached)';
const base = baseRef(root);
const mergeBase = base ? g(['merge-base', base, 'HEAD']) : '';
const task = id ? loadAllTasks(root).find((t) => t.id === id) : undefined;
if (id && !task) warn(`${id} not found in docs/tasks/*.md`);

const numstat = mergeBase ? lines(g(['diff', '--numstat', '--no-renames', mergeBase, 'HEAD'])) : [];
let added = 0;
let removed = 0;
const files = numstat.map((line) => {
  const [a, r, file] = line.split('\t');
  added += Number(a) || 0;
  removed += Number(r) || 0;
  return file;
});

const contractFiles = files.filter((f) => f.startsWith('packages/shared/src/contracts/'));
const contractDiff = contractFiles.length
  ? g(['diff', mergeBase, 'HEAD', '--', ...contractFiles])
  : '';
const contractIds = [...new Set(contractDiff.match(/C-\d{2,3}/g) ?? [])];
const uncommitted = lines(g(['status', '--porcelain']));
if (uncommitted.length)
  warn(
    `${uncommitted.length} uncommitted change(s) — commit them; the PR only contains committed work.`,
  );

let tests = '<fill in: commands you ran and their results>';
if (flags.verify) {
  const code = run('npm', ['run', 'verify'], { cwd: root });
  tests =
    code === 0
      ? '`npm run verify` ✓ (format, lint, typecheck, tests, build, ownership)'
      : '`npm run verify` ✗ — FAILING, not ready for review';
}

const fileList =
  files.length > 12
    ? `${files.slice(0, 12).join(', ')}, … (+${files.length - 12} more)`
    : files.join(', ');
const handoff = `### Handoff
**Task:** ${task ? `${task.id} · ${task.title}` : (id ?? '<task id · title>')}
**Owner:** ${role ?? '<role>'}
**Branch:** ${branch}
**Files changed:** ${files.length} file(s) (+${added}/−${removed})${files.length ? ` — ${fileList}` : ''}
**Contracts affected:** ${contractFiles.length ? `${contractFiles.join(', ')}${contractIds.length ? ` (${contractIds.join(', ')})` : ''} — announce to the team before merging` : 'none'}
**Tests performed:** ${tests}
**Dependencies:** ${task?.dependsOn.join(', ') || 'none'}
**Integration notes:** <fill in: anything the merge captain or other devs must know — env vars, db:reset needed, merge order>
**Stubs/mocks remaining:** <fill in honestly — write "none" only if nothing is stubbed>
**Status:** ${task?.status === 'Done' ? 'Done' : 'Review'}
`;

console.log(`\n${handoff}`);
mkdirSync(join(root, '.scratch'), { recursive: true });
const out = join(root, '.scratch', `handoff-${id ?? 'latest'}.md`);
writeFileSync(out, handoff);
ok(`saved to ${c.dim(out)} — paste it into the PR description`);
