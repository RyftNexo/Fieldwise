#!/usr/bin/env node
// Task board helpers over docs/tasks/dev{1,2,3}.md. Owner: dev3.
//
//   npm run task:start -- D1-03                       preflight before writing code
//   npm run board  [-- --all]                         every open task (add --all to include Done)
//   npm run task -- status D1-03 "In Progress"        update YOUR task's status (+ log line)
//   npm run task -- new "Login screen" --paths "apps/web/src/features/auth/**" --depends "C-03" --accept "…"
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { aheadBehind, currentBranch, repoRoot } from './lib/git.mjs';
import { branchProblem, loadOwnership, ownerOf, resolveRole } from './lib/ownership.mjs';
import {
  loadAllTasks,
  nextId,
  possibleOverlaps,
  roleOfTaskId,
  STATUSES,
  setStatus,
  taskFile,
} from './lib/tasks.mjs';
import { bad, c, info, ok, parseArgs, warn } from './lib/term.mjs';

const root = repoRoot(process.cwd());
if (!root) {
  console.error('task: not inside a git repository');
  process.exit(1);
}
const TASK_ID = /^D[1-3]-\d{2,3}$/;
const read = (path) => (existsSync(path) ? readFileSync(path, 'utf8') : '');

function needRole() {
  const { role, source } = resolveRole(root);
  if (!role) {
    bad(
      'No role set for this clone — ask your human to run: node scripts/setup-dev.mjs <dev1|dev2|dev3>',
    );
    process.exit(1);
  }
  return { role, source };
}

// ── start ──────────────────────────────────────────────────────────────────────
function cmdStart(id) {
  if (!TASK_ID.test(id ?? '')) {
    bad('Usage: npm run task:start -- <ID>   (e.g. D1-03)');
    return 1;
  }
  let problems = 0;
  const { role, source } = needRole();
  ok(`You are ${role} ${c.dim(`(${source})`)}`);

  const branch = currentBranch(root);
  const branchIssue = branchProblem(role, branch);
  if (branchIssue) {
    bad(`Branch: ${branchIssue}`);
    problems++;
  } else ok(`Branch ${branch}`);

  const all = loadAllTasks(root);
  const task = all.find((t) => t.id === id);
  if (!task) {
    bad(`${id} is not on the board (docs/tasks/*.md). Never start unlisted work.`);
    console.log(
      `  If your human just assigned it, add it to ${taskFile(role)} first: npm run task -- new "<title>" --paths "…"`,
    );
    return 1;
  }
  if (task.owner !== role) {
    bad(`${id} belongs to ${task.owner}, not you (${role}). Stop — don't work on it.`);
    return 1;
  }
  ok(`${id} · ${task.title}  ${c.dim(`[${task.status}]`)}`);
  if (task.status === 'Done')
    warn('Already marked Done — confirm with your human before reopening.');

  const sync = aheadBehind('origin/main', root);
  if (sync?.behind)
    warn(`${sync.behind} commit(s) behind origin/main — run \`npm run sync\` first`);
  else if (sync) ok('Up to date with origin/main (as of your last fetch)');

  const { rules } = loadOwnership(root);
  if (!task.paths.length) warn('No Paths listed — add them so ownership is explicit.');
  for (const pattern of task.paths) {
    const sample = pattern.replace(/\*\*/g, 'x/x').replace(/\*/g, 'x');
    const { owner } = ownerOf(sample, rules);
    if (owner === role || owner === 'any') ok(`Path ${pattern} → yours`);
    else {
      bad(
        `Path ${pattern} → owned by ${owner}. That part needs a request to ${owner} (see AGENTS.md §6).`,
      );
      problems++;
    }
  }

  const registry = read(join(root, 'packages/shared/src/contracts/endpoints.ts'));
  for (const dep of task.dependsOn) {
    const depId = dep.match(/^(D[1-3]-\d{2,3}|C-\d{2,3})/)?.[1];
    if (!depId) {
      info(`Depends on: ${dep}`);
      continue;
    }
    if (depId.startsWith('C-')) {
      if (registry.includes(`'${depId}'`)) ok(`Contract ${depId} is in the registry`);
      else
        warn(
          `Contract ${depId} is not in packages/shared yet — mock it locally and request it from dev3`,
        );
      continue;
    }
    const other = all.find((t) => t.id === depId);
    if (!other) warn(`Dependency ${depId} not found on the board`);
    else if (other.status === 'Done') ok(`Dependency ${depId} (${other.owner}) is Done`);
    else
      warn(
        `Dependency ${depId} (${other.owner}) is ${other.status} — build against mocks or coordinate`,
      );
  }

  const overlaps = possibleOverlaps(task, all);
  for (const other of overlaps) {
    warn(
      `Possible overlap with ${other.id} (${other.owner}): "${other.title}" — check before building`,
    );
  }
  if (!overlaps.length) ok('No overlapping tasks on the board');

  console.log(
    `\n${c.bold('Accept:')} ${task.accept || c.yellow('(none — ask your human for acceptance criteria)')}`,
  );
  console.log(
    `${c.bold('Next:')} search for existing code first (rg / Explore), read the contracts involved, write a short plan,\n` +
      `      then: npm run task -- status ${id} "In Progress"`,
  );
  return problems ? 1 : 0;
}

// ── board ──────────────────────────────────────────────────────────────────────
function cmdBoard(flags) {
  const all = loadAllTasks(root).filter((t) => flags.all || t.status !== 'Done');
  if (!all.length) {
    console.log('No open tasks.');
    return 0;
  }
  const width = Math.min(60, Math.max(...all.map((t) => t.title.length)));
  console.log(
    c.bold(
      `${'ID'.padEnd(7)}${'Owner'.padEnd(6)}${'Status'.padEnd(13)}${'Title'.padEnd(width + 2)}Depends on`,
    ),
  );
  for (const t of all) {
    const status =
      t.status === 'Blocked'
        ? c.red(t.status.padEnd(13))
        : t.status === 'In Progress'
          ? c.cyan(t.status.padEnd(13))
          : t.status.padEnd(13);
    console.log(
      `${t.id.padEnd(7)}${t.owner.padEnd(6)}${status}${t.title.slice(0, width).padEnd(width + 2)}${t.dependsOn.join(', ') || '—'}`,
    );
  }
  return 0;
}

// ── status ─────────────────────────────────────────────────────────────────────
function cmdStatus(id, status) {
  const { role } = needRole();
  if (!TASK_ID.test(id ?? '') || !status) {
    bad(`Usage: npm run task -- status <ID> "<${STATUSES.join(' | ')}>"`);
    return 1;
  }
  if (roleOfTaskId(id) !== role) {
    bad(`${id} belongs to ${roleOfTaskId(id)} — you can only update your own tasks.`);
    return 1;
  }
  const file = join(root, taskFile(role));
  let text = setStatus(read(file), id, status);
  const time = new Date().toTimeString().slice(0, 5);
  if (/^## Log\s*$/m.test(text))
    text = `${text.replace(/\s*$/, '')}\n- ${time} ${id} → ${status}\n`;
  writeFileSync(file, text);
  ok(`${id} → ${status}`);
  return 0;
}

// ── new ────────────────────────────────────────────────────────────────────────
function cmdNew(title, flags) {
  const { role } = needRole();
  if (!title) {
    bad(
      'Usage: npm run task -- new "<title>" --paths "<globs>" [--depends "C-03, D2-01"] [--accept "<criteria>"]',
    );
    return 1;
  }
  const file = join(root, taskFile(role));
  const text = read(file);
  const id = nextId(role, loadAllTasks(root));
  const block = [
    `### ${id} · ${title}`,
    '- Status: Not Started',
    `- Depends on: ${flags.depends ?? '—'}`,
    `- Paths: ${flags.paths ?? '—'}`,
    `- Accept: ${flags.accept ?? '—'}`,
    '',
  ].join('\n');
  const marker = text.indexOf('## Requests to others');
  const updated =
    marker === -1
      ? `${text.replace(/\s*$/, '')}\n\n${block}`
      : `${text.slice(0, marker)}${block}\n${text.slice(marker)}`;
  writeFileSync(file, updated);
  ok(`Added ${id} · ${title} to ${taskFile(role)}`);
  if (!flags.paths || !flags.accept)
    warn('Fill in Paths and Accept before starting — the preflight checks them.');
  return 0;
}

const [command, ...rest] = process.argv.slice(2);
const { flags, positional } = parseArgs(rest);
switch (command) {
  case 'start':
    process.exitCode = cmdStart(positional[0]);
    break;
  case 'board':
    process.exitCode = cmdBoard(flags);
    break;
  case 'status':
    process.exitCode = cmdStatus(positional[0], positional.slice(1).join(' '));
    break;
  case 'new':
    process.exitCode = cmdNew(positional.join(' '), flags);
    break;
  default:
    console.log(
      'Usage: npm run task -- <start <ID> | board [--all] | status <ID> "<Status>" | new "<title>" …>',
    );
    process.exitCode = command ? 1 : 0;
}
