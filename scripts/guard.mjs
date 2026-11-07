#!/usr/bin/env node
// Team ownership guard — the deterministic layer behind AGENTS.md rule 1. Owner: dev3.
// The map it enforces lives in docs/OWNERSHIP.md. Never bypass it; ask the owner instead.
import { existsSync, realpathSync, statSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import {
  aheadBehind,
  baseRef,
  changedFilesSince,
  currentBranch,
  git,
  gitPath,
  lines,
  refExists,
  repoRoot,
} from './lib/git.mjs';
import {
  branchProblem,
  checkPaths,
  loadOwnership,
  OWNERSHIP_DOC,
  ownedPatterns,
  ownerOf,
  resolveRole,
  toPosix,
} from './lib/ownership.mjs';
import { findSecretsInDiff, isSecretFile } from './lib/secrets.mjs';
import { loadAllTasks, taskFile } from './lib/tasks.mjs';
import { c, parseArgs } from './lib/term.mjs';

const HELP = `Usage: node scripts/guard.mjs <command>   (npm run guard -- <command>)

  check [--base <ref>]   Every file changed on this branch (incl. uncommitted) vs origin/main  [default]
  path <file...>         Can my role edit these paths?
  map [--role devN]      Print the ownership map
  banner                 Who am I: role, branch, sync status, owned paths, open tasks (npm run whoami)
  pre-commit             git hook: branch rules, staged files, secrets
  pre-push               git hook: refs being pushed
  claude-hook            Claude Code PreToolUse hook (reads tool JSON on stdin)
  ci --branch <name> [--base <ref>] [--labels a,b]   CI ownership check for a pull request`;

const REQUEST_HELP = (role) =>
  `Do NOT work around this (Bash, sed, cp, scripts, another path, --no-verify) — hooks and CI re-check everything.
Instead: keep working inside your own paths (mock what you need), add a request under
"Requests to others" in ${taskFile(role ?? '<your-role>')}, and tell your human. The owner makes the change.`;

function requireRoot() {
  const root = repoRoot(process.cwd());
  if (!root) {
    console.error('guard: not inside a git repository');
    process.exit(1);
  }
  return root;
}

function formatBlocked(blocked) {
  return blocked
    .map(
      ({ path, owner }) =>
        `  ${c.red('✗')} ${path}  ${c.dim(`(owner: ${owner ?? 'nobody — add it to the map'})`)}`,
    )
    .join('\n');
}

// ── check ──────────────────────────────────────────────────────────────────────
function cmdCheck(flags) {
  const root = requireRoot();
  const { role } = resolveRole(root);
  if (!role) {
    console.error(
      `${c.red('✗')} No role configured. Run: node scripts/setup-dev.mjs <dev1|dev2|dev3>`,
    );
    return 1;
  }
  const base = flags.base ?? baseRef(root);
  if (!base) {
    console.log(`${c.yellow('!')} No main/origin/main yet — nothing to compare against.`);
    return 0;
  }
  const files = changedFilesSince(base, root, { includeWorkingTree: true });
  if (files === null) {
    console.error(`${c.red('✗')} Could not find a merge base with ${base}.`);
    return 1;
  }
  const { rules, source } = loadOwnership(root, base);
  const { blocked } = checkPaths(role, files, rules);
  if (blocked.length) {
    console.error(
      `${c.red('✗')} ${blocked.length} file(s) on this branch are outside ${role}'s ownership (map: ${source}):`,
    );
    console.error(formatBlocked(blocked));
    console.error(`\n${REQUEST_HELP(role)}`);
    return 1;
  }
  console.log(
    `${c.green('✓')} ownership: all ${files.length} changed file(s) belong to ${role} (vs ${base})`,
  );
  return 0;
}

// ── path ───────────────────────────────────────────────────────────────────────
function cmdPath(paths) {
  const root = requireRoot();
  const { role } = resolveRole(root);
  const { rules } = loadOwnership(root);
  let exitCode = 0;
  const from = process.env.INIT_CWD ?? process.cwd(); // npm runs scripts from the repo root
  for (const input of paths) {
    const rel = toPosix(relative(root, isAbsolute(input) ? input : resolve(from, input)));
    const { owner } = ownerOf(rel, rules);
    const allowed = owner === 'any' || (owner !== null && owner === role);
    if (!allowed) exitCode = 1;
    console.log(
      `${allowed ? c.green('✓ editable') : c.red('✗ not yours')}  ${rel}  ${c.dim(`(owner: ${owner ?? 'none'}; you: ${role ?? 'unset'})`)}`,
    );
  }
  return exitCode;
}

// ── map ────────────────────────────────────────────────────────────────────────
function cmdMap(flags) {
  const root = requireRoot();
  const { rules, source } = loadOwnership(root);
  console.log(c.dim(`${source} — last matching rule wins`));
  for (const rule of rules) {
    if (flags.role && rule.owner !== flags.role && rule.owner !== 'any') continue;
    console.log(`${rule.pattern.padEnd(42)} ${rule.owner}`);
  }
  return 0;
}

// ── banner ─────────────────────────────────────────────────────────────────────
function cmdBanner() {
  const root = repoRoot(process.cwd());
  if (!root) return 0;
  const out = [];
  const { role, source } = resolveRole(root);
  const branch = currentBranch(root);

  out.push(c.bold('━━ Team guard ━━ AGENTS.md is binding'));
  if (!role) {
    out.push(
      `${c.red('✗ No developer role is set for this clone.')} Ask your human to run: node scripts/setup-dev.mjs <dev1|dev2|dev3>`,
    );
    out.push('  Until then every file edit is blocked.');
    console.log(out.join('\n'));
    return 0;
  }
  out.push(
    `You are ${c.bold(role)} on branch ${c.bold(branch ?? '(detached HEAD)')} ${c.dim(`(role from ${source})`)}`,
  );
  const problem = branchProblem(role, branch);
  if (problem) out.push(`${c.red('✗')} ${problem}`);

  const hooksPath = git(['config', '--get', 'core.hooksPath'], { cwd: root, allowFail: true });
  if (hooksPath !== '.githooks')
    out.push(`${c.red('✗')} git hooks are not active — run: node scripts/setup-dev.mjs ${role}`);

  if (refExists('origin/main', root)) {
    const sync = aheadBehind('origin/main', root);
    const fetchHead = gitPath('FETCH_HEAD', root);
    const age =
      fetchHead && existsSync(fetchHead)
        ? Math.round((Date.now() - statSync(fetchHead).mtimeMs) / 60000)
        : null;
    const ageText = age === null ? 'never fetched' : `fetched ${age} min ago`;
    if (sync?.behind)
      out.push(
        `${c.yellow('!')} ${sync.behind} commit(s) behind origin/main (${ageText}) → run \`npm run sync\` before starting new work`,
      );
    else out.push(`main: up to date with origin/main ${c.dim(`(${ageText})`)}`);
  } else {
    out.push(c.dim('main: no origin/main yet (push main to GitHub first)'));
  }

  try {
    const { rules } = loadOwnership(root);
    const { own, shared, isDefaultOwner } = ownedPatterns(role, rules);
    const ownList = own.filter((p) => p !== '**');
    const ownText = isDefaultOwner
      ? `everything not owned by another developer (you are the default owner)${ownList.length ? `, incl. ${ownList.join(', ')}` : ''}`
      : ownList.join(', ');
    out.push(`You may edit: ${ownText}`);
    if (shared.length) out.push(`Shared (anyone): ${shared.join(', ')}`);
    out.push(
      `Edits anywhere else are blocked. Check a path: npm run guard -- path <file>   Map: ${OWNERSHIP_DOC}`,
    );
  } catch (error) {
    out.push(`${c.red('✗')} ${error.message}`);
  }

  const open = loadAllTasks(root).filter((t) => t.owner === role && t.status !== 'Done');
  if (open.length) {
    out.push(
      `Your open tasks (${taskFile(role)}): ${open.map((t) => `${t.id} ${c.dim(t.status)}`).join(' · ')}`,
    );
  }
  out.push(
    'Start a task: /task-start <ID> (Codex: $task-start) · finish: /task-finish · bring in main: /sync',
  );
  console.log(out.join('\n'));
  return 0;
}

// ── pre-commit ─────────────────────────────────────────────────────────────────
function cmdPreCommit() {
  const root = requireRoot();
  const { role } = resolveRole(root);
  const errors = [];

  if (!role) {
    errors.push(
      'No developer role configured for this clone. Run: node scripts/setup-dev.mjs <dev1|dev2|dev3>',
    );
  }
  const branch = currentBranch(root);
  const problem = branchProblem(role, branch);
  if (problem) errors.push(problem);

  const staged = lines(git(['diff', '--cached', '--name-only', '--no-renames'], { cwd: root }));
  const mergeHead = gitPath('MERGE_HEAD', root);
  const merging = mergeHead && existsSync(mergeHead);

  // Ownership of staged files (merge commits are checked as a whole on push/CI instead).
  if (role && !merging && staged.length) {
    const { rules } = loadOwnership(root, refExists('HEAD', root) ? 'HEAD' : undefined);
    const { blocked } = checkPaths(role, staged, rules);
    if (blocked.length) {
      errors.push(
        `${blocked.length} staged file(s) are owned by someone else:\n${formatBlocked(blocked)}`,
      );
    }
  }

  // Secrets: env files and key material never get committed.
  const secretFiles = staged.filter(isSecretFile);
  if (secretFiles.length) {
    errors.push(
      `Secret files staged (keep them local, gitignored):\n${secretFiles.map((f) => `  ✗ ${f}`).join('\n')}`,
    );
  }
  const diff =
    git(
      [
        'diff',
        '--cached',
        '-U0',
        '--no-color',
        '--no-ext-diff',
        '--',
        '.',
        ':(exclude)package-lock.json',
      ],
      { cwd: root, allowFail: true },
    ) ?? '';
  const findings = findSecretsInDiff(diff);
  if (findings.length) {
    errors.push(
      `Possible secrets in staged changes:\n${findings.map((f) => `  ✗ ${f.file}: looks like a ${f.name}`).join('\n')}\nMove secrets to a gitignored .env file and read them via apps/api/src/env.ts.`,
    );
  }

  if (errors.length) {
    console.error(
      `${c.red('✗ Commit blocked by the team guard')} ${c.dim('(docs/OWNERSHIP.md · docs/TEAM_POLICY.md)')}`,
    );
    for (const error of errors) console.error(`\n${error}`);
    console.error(`\n${REQUEST_HELP(role)}`);
    return 1;
  }
  return 0;
}

// ── pre-push ───────────────────────────────────────────────────────────────────
const ZERO = /^0+$/;

function cmdPrePush(stdinText) {
  const root = requireRoot();
  const { role } = resolveRole(root);
  const errors = [];
  const base = refExists('origin/main', root) ? 'origin/main' : null;

  for (const line of lines(stdinText)) {
    const [localRef, localSha, remoteRef, remoteSha] = line.split(/\s+/);
    const remoteBranch = remoteRef?.replace(/^refs\/heads\//, '');
    if (!remoteBranch || remoteRef.startsWith('refs/tags/')) continue;

    if (remoteBranch === 'main' || remoteBranch === 'master') {
      // The very first push that creates main on GitHub is fine; everything after goes through PRs.
      if (ZERO.test(remoteSha) && !ZERO.test(localSha)) continue;
      errors.push(
        `Pushing to ${remoteBranch} is not allowed — open a pull request from your branch instead.`,
      );
      continue;
    }
    if (role && !remoteBranch.startsWith(`${role}/`)) {
      errors.push(`You (${role}) may only push ${role}/* branches, not "${remoteBranch}".`);
      continue;
    }
    if (ZERO.test(localSha) || !base) continue; // deleting your own branch, or nothing to compare yet

    const mergeBase = git(['merge-base', base, localSha], { cwd: root, allowFail: true });
    if (!mergeBase) continue;
    const files = lines(
      git(['diff', '--name-only', '--no-renames', mergeBase, localSha], { cwd: root }),
    );
    const { rules } = loadOwnership(root, base);
    const { blocked } = checkPaths(role, files, rules);
    if (blocked.length) {
      errors.push(
        `${localRef} changes ${blocked.length} file(s) owned by someone else:\n${formatBlocked(blocked)}`,
      );
    }
  }

  if (errors.length) {
    console.error(c.red('✗ Push blocked by the team guard'));
    for (const error of errors) console.error(`\n${error}`);
    console.error(`\n${REQUEST_HELP(role)}`);
    return 1;
  }
  return 0;
}

// ── claude-hook ────────────────────────────────────────────────────────────────
function nearestExistingDir(path) {
  let dir = path;
  while (!existsSync(dir)) {
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
  return dir;
}

function blockClaude(message, role) {
  process.stderr.write(
    `⛔ Blocked by the team ownership guard (${OWNERSHIP_DOC}).\n${message}\n\n${REQUEST_HELP(role)}\n`,
  );
  return 2;
}

function cmdClaudeHook(stdinText) {
  if (process.env.HACKATHON_GUARD === 'off') return 0; // human-only emergency switch, set when launching claude
  let payload;
  try {
    payload = JSON.parse(stdinText);
  } catch {
    return 0;
  }
  const input = payload?.tool_input ?? {};
  const target = input.file_path ?? input.notebook_path ?? input.path;
  if (typeof target !== 'string' || !target) return 0;

  const abs = isAbsolute(target) ? target : resolve(payload.cwd ?? process.cwd(), target);

  // git can't resolve a work tree from inside .git/, so catch edits there explicitly.
  const segments = toPosix(abs).split('/');
  const gitIndex = segments.indexOf('.git');
  if (gitIndex > 0) {
    const candidateRoot = segments.slice(0, gitIndex).join('/') || '/';
    if (existsSync(join(candidateRoot, OWNERSHIP_DOC)))
      return blockClaude('Never edit files inside .git/.', null);
    return 0;
  }

  const dir = nearestExistingDir(dirname(abs));
  if (!dir) return 0;
  const root = repoRoot(dir);
  if (!root || !existsSync(join(root, OWNERSHIP_DOC))) return 0; // not a repo using this system

  const realRoot = realpathSync(root);
  const realTarget = join(realpathSync(dir), relative(dir, abs));
  const rel = toPosix(relative(realRoot, realTarget));
  if (rel.startsWith('..') || isAbsolute(rel)) return 0; // outside the repo

  const { role } = resolveRole(root);
  if (!role) {
    return blockClaude(
      'No developer role is configured for this clone, so all edits are blocked.\nAsk your human to run: node scripts/setup-dev.mjs <dev1|dev2|dev3>',
      role,
    );
  }
  const branch = currentBranch(root);
  if (!branch || branch === 'main' || branch === 'master') {
    return blockClaude(
      `You are on ${branch ?? 'a detached HEAD'}. Never edit on main — switch first: git switch ${role}/work`,
      role,
    );
  }

  let rules;
  try {
    ({ rules } = loadOwnership(root));
  } catch (error) {
    return blockClaude(`The ownership map can't be read: ${error.message}`, role);
  }
  const { owner } = ownerOf(rel, rules);
  if (owner === 'any' || owner === role) return 0;
  return blockClaude(
    `${rel} is owned by ${owner ?? 'nobody (not in the map)'}; you are ${role}.`,
    role,
  );
}

// ── ci ─────────────────────────────────────────────────────────────────────────
function cmdCi(flags) {
  const root = requireRoot();
  const branch = flags.branch;
  const base = flags.base ?? 'origin/main';
  const labels = String(flags.labels ?? '')
    .split(',')
    .map((l) => l.trim())
    .filter(Boolean);
  const match = typeof branch === 'string' && branch.match(/^(dev[1-3])\//);
  if (!match) {
    console.error(
      `✗ PR branch "${branch}" must be named dev1/…, dev2/… or dev3/… so CI knows whose paths apply.`,
    );
    return 1;
  }
  const role = match[1];
  const mergeBase = git(['merge-base', base, 'HEAD'], { cwd: root, allowFail: true });
  if (!mergeBase) {
    console.error(
      `✗ Could not find a merge base between ${base} and HEAD (checkout needs fetch-depth: 0).`,
    );
    return 1;
  }
  const files = lines(
    git(['diff', '--name-only', '--no-renames', mergeBase, 'HEAD'], { cwd: root }),
  );
  const { rules, source } = loadOwnership(root, base);
  const { blocked } = checkPaths(role, files, rules);
  if (!blocked.length) {
    console.log(`✓ ownership: ${files.length} changed file(s), all owned by ${role} (${source})`);
    return 0;
  }
  console.log(`${blocked.length} file(s) in this PR are not owned by ${role} (${source}):`);
  console.log(
    blocked.map(({ path, owner }) => `  - ${path} (owner: ${owner ?? 'none'})`).join('\n'),
  );
  if (labels.includes('ownership-approved')) {
    console.log(
      '⚠ Allowed because the PR has the "ownership-approved" label (added by the file owner / merge captain).',
    );
    return 0;
  }
  console.log(
    '✗ Blocked. The owner should make this change, or add the "ownership-approved" label after reviewing it.',
  );
  return 1;
}

// ── main ───────────────────────────────────────────────────────────────────────
async function readStdin() {
  if (process.stdin.isTTY) return '';
  let data = '';
  for await (const chunk of process.stdin) data += chunk;
  return data;
}

async function main() {
  const [command = 'check', ...rest] = process.argv.slice(2);
  const { flags, positional } = parseArgs(rest);
  switch (command) {
    case 'check':
      return cmdCheck(flags);
    case 'path':
      if (!positional.length) {
        console.error('Usage: npm run guard -- path <file...>');
        return 1;
      }
      return cmdPath(positional);
    case 'map':
      return cmdMap(flags);
    case 'banner':
    case 'whoami':
      return cmdBanner();
    case 'pre-commit':
      return cmdPreCommit();
    case 'pre-push':
      return cmdPrePush(await readStdin());
    case 'claude-hook':
      return cmdClaudeHook(await readStdin());
    case 'ci':
      return cmdCi(flags);
    case 'help':
    case '--help':
    case '-h':
      console.log(HELP);
      return 0;
    default:
      console.error(`Unknown command "${command}".\n\n${HELP}`);
      return 1;
  }
}

try {
  process.exitCode = await main();
} catch (error) {
  // Fail closed: an internal error in the Claude hook blocks the edit (exit 2) instead of letting it through.
  if (process.argv[2] === 'claude-hook') {
    process.stderr.write(
      `⛔ Team guard error (edit blocked): ${error.message}\nTell your human — they can run \`npm run doctor\`.\n`,
    );
    process.exitCode = 2;
  } else {
    console.error(`guard: ${error.message}`);
    process.exitCode = 1;
  }
}
