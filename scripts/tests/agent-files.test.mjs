// Guards the governance layer itself: instruction files load, skills match across tools, hooks are wired.
// Owner: dev3.
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const read = (path) => readFileSync(join(ROOT, path), 'utf8');

function frontmatter(path) {
  const match = read(path).match(/^---\n([\s\S]*?)\n---\n/);
  assert.ok(match, `${path} must start with a --- frontmatter block`);
  assert.notEqual(match[1].split('\n')[0].trim(), '', `${path}: no blank line right after ---`);
  return match[1];
}

describe('instruction files', () => {
  test('CLAUDE.md imports AGENTS.md and .claude/CLAUDE.md', () => {
    const lines = read('CLAUDE.md').split('\n');
    assert.ok(lines.includes('@AGENTS.md'));
    assert.ok(lines.includes('@.claude/CLAUDE.md'));
  });

  test('AGENTS.md stays far below Codex’s 32 KiB instruction limit', () => {
    assert.ok(statSync(join(ROOT, 'AGENTS.md')).size < 16 * 1024);
  });

  test('path-scoped rules have valid paths frontmatter', () => {
    for (const name of readdirSync(join(ROOT, '.claude/rules'))) {
      const fm = frontmatter(`.claude/rules/${name}`);
      assert.match(fm, /^paths:\n {2}- "[^"]+"/m, `.claude/rules/${name}`);
    }
  });
});

describe('skills', () => {
  const claude = readdirSync(join(ROOT, '.claude/skills')).sort();
  const codex = readdirSync(join(ROOT, '.agents/skills')).sort();

  test('Claude Code and Codex get the same skills', () => {
    assert.deepEqual(claude, codex);
  });

  test('every skill has name + description matching its folder', () => {
    for (const [dir, names] of [
      ['.claude/skills', claude],
      ['.agents/skills', codex],
    ]) {
      for (const name of names) {
        const fm = frontmatter(`${dir}/${name}/SKILL.md`);
        assert.match(fm, new RegExp(`^name: ${name}$`, 'm'), `${dir}/${name}`);
        assert.match(fm, /^description: .{20,}$/m, `${dir}/${name}`);
      }
    }
  });
});

describe('hook wiring', () => {
  test('.claude/settings.json runs the guard on edits (fail-closed) and at session start', () => {
    const settings = JSON.parse(read('.claude/settings.json'));
    const pre = settings.hooks.PreToolUse.find((h) => h.matcher.includes('Edit'));
    assert.ok(pre.matcher.split('|').includes('Write'));
    assert.match(pre.hooks[0].command, /scripts\/guard\.mjs" claude-hook$/);
    assert.equal(pre.hooks[0].onFailure, 'block');
    assert.match(settings.hooks.SessionStart[0].hooks[0].command, /guard\.mjs" banner$/);
    assert.ok(settings.permissions.deny.some((rule) => rule.includes('--no-verify')));
  });

  test('git hooks exist and call the guard', () => {
    for (const hook of ['pre-commit', 'pre-push']) {
      const path = join(ROOT, '.githooks', hook);
      assert.ok(existsSync(path), hook);
      assert.match(readFileSync(path, 'utf8'), new RegExp(`guard\\.mjs" ${hook}`));
    }
  });

  test('CI runs verify, the ownership check and the smoke test', () => {
    const ci = read('.github/workflows/verify.yml');
    for (const needle of [
      'npm run verify -- --ci',
      'guard.mjs ci --branch',
      'npm run smoke',
      'fetch-depth: 0',
    ]) {
      assert.ok(ci.includes(needle), needle);
    }
  });
});
