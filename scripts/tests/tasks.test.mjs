// Tests for the task-file parser used by task:start, board and the session banner. Owner: dev3.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { nextId, parseTasks, possibleOverlaps, STATUSES, setStatus } from '../lib/tasks.mjs';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const SAMPLE = `# dev2 tasks

## Tasks

### D2-01 · Build the booking endpoint
- Status: In Progress
- Depends on: C-03, D3-01
- Paths: apps/api/src/features/booking/**
- Accept: returns bookings

### D2-02 · Seed demo bookings
- Paths: apps/api/src/features/booking/seed.ts
- Accept: realistic data

## Requests to others
- REQ dev2→dev3 (open): add C-04
`;

describe('task files', () => {
  test('parse IDs, fields, defaults and lists', () => {
    const [first, second] = parseTasks(SAMPLE, 'dev2');
    assert.equal(first.id, 'D2-01');
    assert.equal(first.title, 'Build the booking endpoint');
    assert.equal(first.status, 'In Progress');
    assert.deepEqual(first.dependsOn, ['C-03', 'D3-01']);
    assert.deepEqual(first.paths, ['apps/api/src/features/booking/**']);
    assert.equal(second.status, 'Not Started');
    assert.deepEqual(second.dependsOn, []);
  });

  test('setStatus replaces or inserts the Status line', () => {
    const updated = setStatus(SAMPLE, 'D2-02', 'Review');
    assert.equal(parseTasks(updated, 'dev2')[1].status, 'Review');
    assert.equal(parseTasks(setStatus(SAMPLE, 'D2-01', 'Done'), 'dev2')[0].status, 'Done');
    assert.throws(() => setStatus(SAMPLE, 'D2-09', 'Done'), /not found/);
    assert.throws(() => setStatus(SAMPLE, 'D2-01', 'Finished'), /Unknown status/);
  });

  test('nextId and overlap detection (common words like "demo path" are ignored)', () => {
    const tasks = parseTasks(SAMPLE, 'dev2');
    assert.equal(nextId('dev2', tasks), 'D2-03');
    assert.equal(nextId('dev1', tasks), 'D1-01');
    const mine = {
      id: 'D1-05',
      title: 'Seed bookings calendar view',
      owner: 'dev1',
      status: 'Not Started',
    };
    assert.deepEqual(
      possibleOverlaps(mine, tasks).map((t) => t.id),
      ['D2-02'],
    );
    const generic = {
      id: 'D1-06',
      title: 'First screen on the demo path',
      owner: 'dev1',
      status: 'Not Started',
    };
    const other = parseTasks('### D2-07 · Seed data for the demo path\n- Paths: x', 'dev2');
    assert.deepEqual(possibleOverlaps(generic, other), []);
  });

  test('the real task files parse, use their owner prefix and valid statuses', () => {
    for (const role of ['dev1', 'dev2', 'dev3']) {
      const tasks = parseTasks(readFileSync(join(ROOT, `docs/tasks/${role}.md`), 'utf8'), role);
      assert.ok(tasks.length > 0, `${role} has tasks`);
      for (const task of tasks) {
        assert.equal(`dev${task.id[1]}`, role, `${task.id} is in ${role}.md`);
        assert.ok(STATUSES.includes(task.status), `${task.id} status "${task.status}"`);
        assert.ok(task.paths.length > 0, `${task.id} lists Paths`);
      }
    }
  });
});
