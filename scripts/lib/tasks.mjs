// Task files: docs/tasks/dev1.md, dev2.md, dev3.md — one writer each. Owner: dev3.
//
// Format (one block per task):
//   ### D1-03 · Short title
//   - Status: Not Started | In Progress | Blocked | Review | Done
//   - Depends on: C-02, D2-01            (or —)
//   - Paths: apps/web/src/features/auth/**
//   - Accept: what "done" means, testable
//   - Notes: optional
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROLES } from './ownership.mjs';

export const TASK_DIR = 'docs/tasks';
export const STATUSES = ['Not Started', 'In Progress', 'Blocked', 'Review', 'Done'];
const HEADING = /^###\s+(D[1-3]-\d{2,3})\s*[·:—–-]\s*(.+?)\s*$/;
const FIELD = /^-\s+([A-Za-z][A-Za-z ]*?):\s*(.*)$/;

export const taskFile = (role) => `${TASK_DIR}/${role}.md`;
export const roleOfTaskId = (id) => `dev${id[1]}`;

export function parseTasks(text, owner) {
  const tasks = [];
  let current = null;
  text.split(/\r?\n/).forEach((line, index) => {
    const heading = line.match(HEADING);
    if (heading) {
      current = { id: heading[1], title: heading[2], owner, line: index + 1, fields: {} };
      tasks.push(current);
      return;
    }
    if (/^#{1,3}\s/.test(line)) {
      current = null;
      return;
    }
    const field = current && line.match(FIELD);
    if (field) current.fields[field[1].trim().toLowerCase()] = field[2].trim();
  });
  return tasks.map((task) => ({
    ...task,
    status: task.fields.status ?? 'Not Started',
    dependsOn: splitList(task.fields['depends on']),
    paths: splitList(task.fields.paths),
    accept: task.fields.accept ?? '',
  }));
}

function splitList(value) {
  if (!value || /^(—|-|none|n\/a)$/i.test(value)) return [];
  return value
    .split(/[,;]\s*/)
    .map((item) => item.replace(/`/g, '').trim())
    .filter(Boolean);
}

export function loadAllTasks(root) {
  const all = [];
  for (const role of ROLES) {
    const file = join(root, taskFile(role));
    if (existsSync(file)) all.push(...parseTasks(readFileSync(file, 'utf8'), role));
  }
  return all;
}

/** Return new file text with the task's Status line replaced (throws if the task is not there). */
export function setStatus(text, id, status) {
  if (!STATUSES.includes(status)) {
    throw new Error(`Unknown status "${status}". Use one of: ${STATUSES.join(', ')}`);
  }
  const lines = text.split('\n');
  const start = lines.findIndex((line) => HEADING.test(line) && line.match(HEADING)[1] === id);
  if (start === -1) throw new Error(`Task ${id} not found`);
  for (let i = start + 1; i < lines.length; i++) {
    if (/^#{1,3}\s/.test(lines[i])) break;
    if (/^-\s+Status:/i.test(lines[i])) {
      lines[i] = `- Status: ${status}`;
      return lines.join('\n');
    }
  }
  lines.splice(start + 1, 0, `- Status: ${status}`);
  return lines.join('\n');
}

/** Next free ID for a role, e.g. D1-04. */
export function nextId(role, tasks) {
  const prefix = `D${role.slice(-1)}-`;
  const numbers = tasks.filter((t) => t.id.startsWith(prefix)).map((t) => Number(t.id.slice(3)));
  return `${prefix}${String(Math.max(0, ...numbers) + 1).padStart(2, '0')}`;
}

const STOP = new Set([
  'the',
  'and',
  'for',
  'with',
  'from',
  'into',
  'page',
  'add',
  'build',
  'make',
  'create',
  'update',
  'implement',
  'screen',
  'feature',
  'endpoint',
  'api',
  'web',
  'basic',
  'first',
  'real',
  'example',
  'remove',
  'demo',
  'path',
  'mock',
  'mode',
  'once',
  'exists',
  'contract',
]);
const words = (title) =>
  new Set(
    title
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length >= 4 && !STOP.has(w)),
  );

/** Other developers' tasks whose titles share 2+ significant words with this one. */
export function possibleOverlaps(task, all) {
  const mine = words(task.title);
  return all.filter((other) => {
    if (other.owner === task.owner || other.status === 'Done') return false;
    let shared = 0;
    for (const word of words(other.title)) if (mine.has(word)) shared++;
    return shared >= 2;
  });
}
