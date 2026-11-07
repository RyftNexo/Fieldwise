// Tests for the team guard: map parsing, secrets, and real git scenarios with the hooks installed.
// Run: npm run test:scripts   (part of npm test / npm run verify). Owner: dev3.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, before, describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { branchProblem, globToRegExp, ownerOf, parseOwnershipMap } from '../lib/ownership.mjs';
import { findSecretsInDiff, isSecretFile } from '../lib/secrets.mjs';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const ENV = {
  ...process.env,
  GIT_AUTHOR_NAME: 'Test',
  GIT_AUTHOR_EMAIL: 'test@example.com',
  GIT_COMMITTER_NAME: 'Test',
  GIT_COMMITTER_EMAIL: 'test@example.com',
  NO_COLOR: '1',
  HACKATHON_GUARD: '',
};
// Built at runtime so this file never contains a real-looking secret itself.
const FAKE_ANTHROPIC_KEY = `sk-ant-${'a1B2'.repeat(8)}`;

describe('globToRegExp', () => {
  const cases = [
    ['**', 'anything/at/all.ts', true],
    ['apps/web/**', 'apps/web/src/x.tsx', true],
    ['apps/web/**', 'apps/webby/x.ts', false],
    ['apps/web/', 'apps/web/a/b.ts', true],
    ['docs/*.md', 'docs/A.md', true],
    ['docs/*.md', 'docs/tasks/dev1.md', false],
    ['apps/api/src/features/*/schema.ts', 'apps/api/src/features/notes/schema.ts', true],
    ['**/.env', 'apps/api/.env', true],
    ['**/.env', '.env', true],
    ['package-lock.json', 'package-lock.json', true],
    ['package-lock.json', 'apps/web/package-lock.json', false],
  ];
  for (const [glob, path, expected] of cases) {
    test(`${glob} ${expected ? 'matches' : 'does not match'} ${path}`, () => {
      assert.equal(globToRegExp(glob).test(path), expected);
    });
  }
});

describe('ownership map', () => {
  const sample =
    '```ownership\n** dev3\napps/web/** dev1 # comment\napps/api/** dev2\ndocs/tasks/dev1.md dev1\npackage-lock.json any\n```';

  test('last matching rule wins', () => {
    const rules = parseOwnershipMap(sample);
    assert.equal(ownerOf('apps/web/src/a.tsx', rules).owner, 'dev1');
    assert.equal(ownerOf('apps/api/src/a.ts', rules).owner, 'dev2');
    assert.equal(ownerOf('README.md', rules).owner, 'dev3');
    assert.equal(ownerOf('package-lock.json', rules).owner, 'any');
  });

  test('rejects unknown owners and malformed lines', () => {
    assert.throws(() => parseOwnershipMap('```ownership\napps/** bob\n```'), /unknown owner/);
    assert.throws(() => parseOwnershipMap('```ownership\napps/** dev1 extra\n```'), /must be/);
    assert.throws(() => parseOwnershipMap('no block here'), /no ```ownership block/);
  });

  test('the real docs/OWNERSHIP.md assigns the key paths', () => {
    const rules = parseOwnershipMap(readFileSync(join(ROOT, 'docs/OWNERSHIP.md'), 'utf8'));
    const expected = {
      'apps/web/src/features/home/HomePage.tsx': 'any',
      'apps/web/package.json': 'any',
      'apps/api/src/features/notes/schema.ts': 'any',
      'apps/api/.env.example': 'any',
      'packages/shared/src/contracts/endpoints.ts': 'any',
      'scripts/guard.mjs': 'any',
      '.claude/settings.json': 'any',
      '.claude/rules/web.md': 'any',
      '.claude/rules/api.md': 'any',
      'AGENTS.md': 'any',
      'docs/OWNERSHIP.md': 'any',
      'docs/TASK_BOARD.md': 'any',
      'docs/tasks/dev2.md': 'any',
      'package-lock.json': 'any',
      '.scratch/notes.md': 'any',
    };
    for (const [path, owner] of Object.entries(expected)) {
      assert.equal(ownerOf(path, rules).owner, owner, path);
    }
  });

  test('branch rules', () => {
    assert.equal(branchProblem('dev1', 'dev1/work'), null);
    assert.match(branchProblem('dev1', 'main'), /never commit/);
    assert.match(branchProblem('dev1', 'dev2/work'), /does not match/);
    assert.match(branchProblem('dev1', null), /detached/);
  });
});

describe('secret detection', () => {
  test('flags env files but not templates', () => {
    assert.equal(isSecretFile('apps/api/.env'), true);
    assert.equal(isSecretFile('.env.local'), true);
    assert.equal(isSecretFile('apps/api/.env.example'), false);
    assert.equal(isSecretFile('certs/server.pem'), true);
    assert.equal(isSecretFile('src/environment.ts'), false);
  });

  test('flags keys in added lines only', () => {
    const diff = `+++ b/apps/api/src/x.ts\n+const key = '${FAKE_ANTHROPIC_KEY}';\n-const old = '${FAKE_ANTHROPIC_KEY}';`;
    const findings = findSecretsInDiff(diff);
    assert.equal(findings.length, 1);
    assert.equal(findings[0].file, 'apps/api/src/x.ts');
    assert.equal(
      findSecretsInDiff('+++ b/a.ts\n+const task = "desk-top risk-assessment";').length,
      0,
    );
  });
});

// ── git scenarios ──────────────────────────────────────────────────────────────

function makeRepo() {
  const dir = mkdtempSync(join(tmpdir(), 'guard-test-'));
  const repo = join(dir, 'repo');
  mkdirSync(join(repo, 'docs'), { recursive: true });
  cpSync(join(ROOT, 'scripts'), join(repo, 'scripts'), { recursive: true });
  cpSync(join(ROOT, '.githooks'), join(repo, '.githooks'), { recursive: true });
  // Exercise exclusive-map enforcement independently from the active shared policy.
  writeFileSync(
    join(repo, 'docs/OWNERSHIP.md'),
    '```ownership\n** dev3\napps/web/** dev1\napps/api/** dev2\ndocs/tasks/dev1.md dev1\npackage-lock.json any\n.scratch/** any\n```',
  );
  cpSync(join(ROOT, 'docs/tasks'), join(repo, 'docs/tasks'), { recursive: true });
  writeFileSync(
    join(repo, '.gitignore'),
    'node_modules/\n.env\n.env.*\n!.env.example\n.scratch/\n',
  );
  if (process.platform !== 'win32') {
    chmodSync(join(repo, '.githooks/pre-commit'), 0o755);
    chmodSync(join(repo, '.githooks/pre-push'), 0o755);
  }
  const git = (...args) => spawnSync('git', args, { cwd: repo, encoding: 'utf8', env: ENV });
  git('init', '-q', '-b', 'main');
  git('add', '-A');
  git('commit', '-q', '-m', 'init');
  git('config', 'core.hooksPath', '.githooks');
  git('config', 'hackathon.role', 'dev1');
  git('switch', '-q', '-c', 'dev1/work');
  return { dir, repo, git };
}

function write(repo, path, content = 'x\n') {
  mkdirSync(dirname(join(repo, path)), { recursive: true });
  writeFileSync(join(repo, path), content);
}

function hook(repo, input) {
  return spawnSync(process.execPath, ['scripts/guard.mjs', 'claude-hook'], {
    cwd: repo,
    encoding: 'utf8',
    env: ENV,
    input: JSON.stringify(input),
  });
}

describe('pre-commit hook', () => {
  let ctx;
  before(() => {
    ctx = makeRepo();
  });
  after(() => rmSync(ctx.dir, { recursive: true, force: true }));

  const commit = (path, content) => {
    write(ctx.repo, path, content);
    ctx.git('add', '-f', path);
    const result = ctx.git('commit', '-q', '-m', `add ${path}`);
    if (result.status !== 0) {
      ctx.git('reset', '-q');
      rmSync(join(ctx.repo, path), { force: true });
    }
    return result;
  };

  test('allows files you own', () => {
    assert.equal(commit('apps/web/src/ok.tsx').status, 0);
    assert.equal(commit('package-lock.json', '{}\n').status, 0);
  });

  test("blocks another developer's files", () => {
    const result = commit('apps/api/src/sneaky.ts');
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /owned by someone else/);
    assert.match(result.stderr, /owner: dev2/);
  });

  test('blocks commits on main', () => {
    ctx.git('switch', '-q', 'main');
    const result = commit('apps/web/src/on-main.tsx');
    ctx.git('switch', '-q', 'dev1/work');
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /never commit/);
  });

  test("blocks branches that don't match the role", () => {
    ctx.git('switch', '-q', '-c', 'dev2/pretend');
    const result = commit('apps/web/src/wrong-branch.tsx');
    ctx.git('switch', '-q', 'dev1/work');
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /does not match your role dev1/);
  });

  test('blocks .env files but allows templates', () => {
    const env = commit('apps/web/.env', 'VITE_API_MODE=live\n');
    assert.notEqual(env.status, 0);
    assert.match(env.stderr, /Secret files staged/);
    assert.equal(commit('apps/web/.env.example', 'VITE_API_MODE=live\n').status, 0);
  });

  test('blocks secrets in content', () => {
    const result = commit(
      'apps/web/src/config.ts',
      `export const key = '${FAKE_ANTHROPIC_KEY}';\n`,
    );
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Anthropic API key/);
  });
});

describe('Claude Code PreToolUse hook', () => {
  let ctx;
  before(() => {
    ctx = makeRepo();
  });
  after(() => rmSync(ctx.dir, { recursive: true, force: true }));
  const edit = (path) =>
    hook(ctx.repo, {
      tool_name: 'Edit',
      tool_input: { file_path: join(ctx.repo, path) },
      cwd: ctx.repo,
    });

  test('allows owned paths, including new nested folders', () => {
    assert.equal(edit('apps/web/src/a.tsx').status, 0);
    assert.equal(edit('apps/web/src/brand/new/deep/file.tsx').status, 0);
    assert.equal(edit('.scratch/plan.md').status, 0);
    assert.equal(edit('docs/tasks/dev1.md').status, 0);
  });

  test('blocks unowned paths with exit 2 and an explanation', () => {
    const result = edit('apps/api/src/index.ts');
    assert.equal(result.status, 2);
    assert.match(result.stderr, /owned by dev2; you are dev1/);
    assert.match(result.stderr, /Do NOT work around this/);
    assert.equal(edit('docs/OWNERSHIP.md').status, 2);
    assert.equal(edit('scripts/guard.mjs').status, 2);
    assert.equal(edit('.git/config').status, 2);
  });

  test('ignores files outside the repo and malformed input', () => {
    assert.equal(
      hook(ctx.repo, { tool_input: { file_path: join(tmpdir(), 'elsewhere.txt') } }).status,
      0,
    );
    assert.equal(
      spawnSync(process.execPath, ['scripts/guard.mjs', 'claude-hook'], {
        cwd: ctx.repo,
        input: 'not json',
        env: ENV,
      }).status,
      0,
    );
  });

  test('blocks edits on main and when no role is set', () => {
    ctx.git('switch', '-q', 'main');
    const onMain = edit('apps/web/src/a.tsx');
    ctx.git('switch', '-q', 'dev1/work');
    assert.equal(onMain.status, 2);
    assert.match(onMain.stderr, /Never edit on main/);

    ctx.git('config', '--unset', 'hackathon.role');
    ctx.git('switch', '-q', '-c', 'scratch-branch');
    const noRole = edit('apps/web/src/a.tsx');
    ctx.git('switch', '-q', 'dev1/work');
    ctx.git('config', 'hackathon.role', 'dev1');
    assert.equal(noRole.status, 2);
    assert.match(noRole.stderr, /No developer role/);
  });

  test('the human-only emergency switch turns it off', () => {
    const result = spawnSync(process.execPath, ['scripts/guard.mjs', 'claude-hook'], {
      cwd: ctx.repo,
      encoding: 'utf8',
      env: { ...ENV, HACKATHON_GUARD: 'off' },
      input: JSON.stringify({ tool_input: { file_path: join(ctx.repo, 'apps/api/x.ts') } }),
    });
    assert.equal(result.status, 0);
  });
});

describe('pre-push hook, branch check and CI check', () => {
  let ctx;
  before(() => {
    ctx = makeRepo();
    const remote = join(ctx.dir, 'remote.git');
    spawnSync('git', ['init', '-q', '--bare', '-b', 'main', remote], {
      encoding: 'utf8',
      env: ENV,
    });
    ctx.git('remote', 'add', 'origin', remote);
  });
  after(() => rmSync(ctx.dir, { recursive: true, force: true }));

  test('the first push that creates main is allowed', () => {
    const result = ctx.git('push', '-q', 'origin', 'main');
    assert.equal(result.status, 0, result.stderr);
  });

  test('pushing your own branch with owned changes is allowed', () => {
    write(ctx.repo, 'apps/web/src/feature.tsx');
    ctx.git('add', '-A');
    assert.equal(ctx.git('commit', '-q', '-m', 'web work').status, 0);
    const result = ctx.git('push', '-q', '-u', 'origin', 'dev1/work');
    assert.equal(result.status, 0, result.stderr);
  });

  test('merging main brings in other owners’ files without flagging them', () => {
    ctx.git('switch', '-q', 'main');
    write(ctx.repo, 'apps/api/src/from-main.ts');
    ctx.git('add', '-A');
    ctx.git('-c', 'core.hooksPath=/dev/null', 'commit', '-q', '-m', 'dev2 work merged via PR');
    ctx.git('-c', 'core.hooksPath=/dev/null', 'push', '-q', 'origin', 'main');
    ctx.git('switch', '-q', 'dev1/work');
    assert.equal(ctx.git('merge', '-q', '--no-edit', 'origin/main').status, 0);
    const check = spawnSync(process.execPath, ['scripts/guard.mjs', 'check'], {
      cwd: ctx.repo,
      encoding: 'utf8',
      env: ENV,
    });
    assert.equal(check.status, 0, check.stderr + check.stdout);
  });

  test('a --no-verify commit of unowned files is still stopped at push, check and CI', () => {
    write(ctx.repo, 'apps/api/src/bypass.ts');
    ctx.git('add', '-A');
    ctx.git('commit', '-q', '--no-verify', '-m', 'bypass');

    const push = ctx.git('push', '-q', 'origin', 'dev1/work');
    assert.notEqual(push.status, 0);
    assert.match(push.stderr, /owned by someone else/);

    const check = spawnSync(process.execPath, ['scripts/guard.mjs', 'check'], {
      cwd: ctx.repo,
      encoding: 'utf8',
      env: ENV,
    });
    assert.equal(check.status, 1);

    const ci = (...extra) =>
      spawnSync(
        process.execPath,
        ['scripts/guard.mjs', 'ci', '--branch', 'dev1/work', '--base', 'origin/main', ...extra],
        {
          cwd: ctx.repo,
          encoding: 'utf8',
          env: ENV,
        },
      );
    assert.equal(ci().status, 1);
    assert.equal(ci('--labels', 'bug,ownership-approved').status, 0);
    const badBranch = spawnSync(
      process.execPath,
      ['scripts/guard.mjs', 'ci', '--branch', 'feature/x'],
      { cwd: ctx.repo, encoding: 'utf8', env: ENV },
    );
    assert.equal(badBranch.status, 1);
  });

  test("pushing to main or someone else's branch is blocked", () => {
    const toMain = ctx.git('push', '-q', 'origin', 'dev1/work:main');
    assert.notEqual(toMain.status, 0);
    assert.match(toMain.stderr, /Pushing to main is not allowed/);
    const toOther = ctx.git('push', '-q', 'origin', 'dev1/work:dev2/work');
    assert.notEqual(toOther.status, 0);
    assert.match(toOther.stderr, /may only push dev1\/\*/);
  });
});
