#!/usr/bin/env node
// One-command developer setup + health check ("doctor"). Owner: dev3.
//
//   node scripts/setup-dev.mjs dev1 --init   first time, on the machine that creates the repo (Keith)
//   node scripts/setup-dev.mjs dev2          after cloning (teammates)
//   node scripts/setup-dev.mjs --check       doctor only: changes nothing     (npm run doctor)
//   options: --no-install (skip npm install)
//
// Only repo-local git config is touched — never your global config.
import { spawnSync } from 'node:child_process';
import { accessSync, chmodSync, constants, copyFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  currentBranch,
  git,
  gitVersion,
  hasRemote,
  refExists,
  versionAtLeast,
} from './lib/git.mjs';
import { branchProblem, ROLES } from './lib/ownership.mjs';
import { bad, c, info, ok, parseArgs, run, warn } from './lib/term.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const HOOKS = ['.githooks/pre-commit', '.githooks/pre-push'];
// Files the whole system depends on. .claude/ and .github/ are delivered separately (agent-config.zip)
// because remote tools can't write there — they must be in place before the first commit.
const REQUIRED = [
  'AGENTS.md',
  'CLAUDE.md',
  'docs/OWNERSHIP.md',
  '.claude/CLAUDE.md',
  '.claude/settings.json',
  '.claude/skills/task-start/SKILL.md',
  '.github/workflows/verify.yml',
  '.github/pull_request_template.md',
];
const missingRequired = () => REQUIRED.filter((f) => !existsSync(join(ROOT, f)));
const ENV_FILES = ['apps/api', 'apps/web'];
const MIN_NODE = [22, 12];
const isWindows = process.platform === 'win32';

const { flags, positional } = parseArgs(process.argv.slice(2));
const role = positional[0];
const checkOnly = Boolean(flags.check);

const g = (args, opts = {}) => git(args, { cwd: ROOT, ...opts });
const isRepo = () => g(['rev-parse', '--is-inside-work-tree'], { allowFail: true }) === 'true';

function commandExists(cmd) {
  const probe = spawnSync(isWindows ? 'where' : 'which', [cmd], {
    encoding: 'utf8',
    shell: isWindows,
  });
  return probe.status === 0;
}

function versionOf(cmd, args = ['--version']) {
  const out = spawnSync(cmd, args, { encoding: 'utf8', shell: isWindows, timeout: 15000 });
  return out.status === 0 ? (out.stdout || out.stderr).trim().split('\n')[0] : null;
}

function chmodHooks() {
  if (isWindows) return;
  for (const hook of HOOKS) if (existsSync(join(ROOT, hook))) chmodSync(join(ROOT, hook), 0o755);
}

// ── doctor ─────────────────────────────────────────────────────────────────────
function doctor() {
  let failures = 0;
  const fail = (text) => {
    failures++;
    bad(text);
  };
  console.log(c.bold('\nDoctor'));

  const missing = missingRequired();
  missing.length
    ? fail(
        `missing repo files: ${missing.join(', ')} — extract agent-config.zip into the repo folder`,
      )
    : ok('agent config and CI files present');

  const [major, minor] = process.versions.node.split('.').map(Number);
  if (major > MIN_NODE[0] || (major === MIN_NODE[0] && minor >= MIN_NODE[1]))
    ok(`Node ${process.versions.node}`);
  else
    fail(
      `Node ${process.versions.node} — need ${MIN_NODE.join('.')}+ (install Node 22 LTS or newer)`,
    );

  const npmVersion = versionOf('npm');
  npmVersion ? ok(`npm ${npmVersion}`) : fail('npm not found');

  const gv = gitVersion();
  if (!gv) fail('git not found');
  else if (!versionAtLeast(gv, [2, 28])) fail(`git ${gv.join('.')} — need 2.28+`);
  else if (!versionAtLeast(gv, [2, 38]))
    warn(`git ${gv.join('.')} — works; 2.38+ enables \`npm run sync -- --check\``);
  else ok(`git ${gv.join('.')}`);

  const name = g(['config', 'user.name'], { allowFail: true });
  const email = g(['config', 'user.email'], { allowFail: true });
  name && email
    ? ok(`git identity: ${name} <${email}>`)
    : fail(
        'git identity missing — run: git config --global user.name "Your Name" && git config --global user.email you@example.com',
      );

  if (!isRepo()) {
    fail('not a git repository yet (first machine: node scripts/setup-dev.mjs dev1 --init)');
  } else {
    const configuredRole = g(['config', '--get', 'hackathon.role'], { allowFail: true });
    ROLES.includes(configuredRole)
      ? ok(`role: ${configuredRole}`)
      : fail('role not set — run: node scripts/setup-dev.mjs <dev1|dev2|dev3>');

    const hooksPath = g(['config', '--get', 'core.hooksPath'], { allowFail: true });
    hooksPath === '.githooks'
      ? ok('git hooks active (.githooks)')
      : fail('git hooks not active — run setup');
    if (!isWindows) {
      const notExecutable = HOOKS.filter((h) => {
        try {
          accessSync(join(ROOT, h), constants.X_OK);
          return false;
        } catch {
          return true;
        }
      });
      notExecutable.length
        ? fail(`hooks not executable: ${notExecutable.join(', ')} — run setup again`)
        : ok('hooks executable');
    }

    const branch = currentBranch(ROOT);
    const problem = branchProblem(configuredRole, branch);
    problem ? warn(`branch: ${problem}`) : ok(`branch: ${branch}`);

    hasRemote('origin', ROOT)
      ? ok(`remote: origin → ${g(['remote', 'get-url', 'origin'], { allowFail: true })}`)
      : warn('no "origin" remote yet (create the GitHub repo and push — see README)');
  }

  existsSync(join(ROOT, 'node_modules'))
    ? ok('dependencies installed')
    : warn('dependencies not installed — run: npm install');
  for (const dir of ENV_FILES) {
    existsSync(join(ROOT, dir, '.env'))
      ? ok(`${dir}/.env present`)
      : warn(`${dir}/.env missing — copy ${dir}/.env.example`);
  }

  console.log(c.dim('\nAgent tools'));
  if (commandExists('claude')) {
    const text = versionOf('claude') ?? '';
    const v = text
      .match(/(\d+)\.(\d+)\.(\d+)/)
      ?.slice(1)
      .map(Number);
    const recent = v && (v[0] > 2 || (v[0] === 2 && (v[1] > 1 || (v[1] === 1 && v[2] >= 295))));
    if (!v)
      info('Claude Code found (version unknown) — needs 2.1.295+ for the fail-closed edit guard');
    else if (recent) ok(`Claude Code ${v.join('.')}`);
    else
      warn(
        `Claude Code ${v.join('.')} — run \`claude update\` (2.1.295+ needed for the fail-closed edit guard)`,
      );
  } else {
    info('claude not found — needed by dev1/dev2 (Claude Code)');
  }
  for (const [cmd, why] of [
    ['codex', 'Codex CLI (dev3)'],
    ['gh', 'GitHub CLI — handy for PRs'],
  ]) {
    commandExists(cmd) ? info(`${cmd} found — ${why}`) : info(`${cmd} not found — ${why}`);
  }

  console.log(
    failures ? c.red(`\n${failures} problem(s) to fix.`) : c.green('\nAll required checks passed.'),
  );
  return failures;
}

// ── setup ──────────────────────────────────────────────────────────────────────
function initRepo() {
  if (isRepo()) {
    info('already a git repository — skipping init');
    return true;
  }
  const missing = missingRequired();
  if (missing.length) {
    bad(`These files must be in place before the first commit:\n    ${missing.join('\n    ')}`);
    console.log(
      '  Extract agent-config.zip into this folder (it adds .claude/ and .github/), then re-run.',
    );
    return false;
  }
  const name = git(['config', 'user.name'], { allowFail: true });
  const email = git(['config', 'user.email'], { allowFail: true });
  if (!name || !email) {
    bad(
      'Set your git identity first: git config --global user.name "Your Name" && git config --global user.email you@example.com',
    );
    return false;
  }
  if (g(['init', '-b', 'main'], { allowFail: true }) === null) {
    g(['init']);
    g(['symbolic-ref', 'HEAD', 'refs/heads/main']);
  }
  ok('git repository created (branch main)');
  chmodHooks();
  if (!flags['no-install']) {
    info('installing dependencies (npm install)…');
    if (run('npm', ['install'], { cwd: ROOT }) !== 0)
      warn('npm install failed — fix and re-run `npm install` later');
  }
  g(['add', '-A']);
  g(['update-index', '--chmod=+x', ...HOOKS]);
  g(['commit', '-q', '-m', 'chore: team foundation (governance layer + app skeleton)']);
  ok('initial commit on main');
  return true;
}

function configure() {
  g(['config', 'hackathon.role', role]);
  g(['config', 'core.hooksPath', '.githooks']);
  g(['config', 'pull.rebase', 'false']);
  g(['config', 'rerere.enabled', 'true']);
  const gv = gitVersion();
  g(['config', 'merge.conflictStyle', versionAtLeast(gv, [2, 35]) ? 'zdiff3' : 'diff3']);
  if (versionAtLeast(gv, [2, 37])) g(['config', 'push.autoSetupRemote', 'true']);
  chmodHooks();
  ok(`role ${c.bold(role)} saved in this clone (git config hackathon.role); hooks active`);
}

function switchToWorkBranch() {
  const branch = currentBranch(ROOT);
  if (branch?.startsWith(`${role}/`)) {
    ok(`already on ${branch}`);
    return;
  }
  const target = `${role}/work`;
  const dirty = g(['status', '--porcelain', '--untracked-files=no'], { allowFail: true });
  if (dirty) {
    warn(
      `uncommitted changes on ${branch ?? 'HEAD'} — not switching. Commit or move them, then: git switch ${target}`,
    );
    return;
  }
  if (refExists(target, ROOT)) {
    g(['switch', '-q', target]);
  } else if (refExists(`origin/${target}`, ROOT)) {
    g(['switch', '-q', '--track', `origin/${target}`]);
  } else {
    const start = refExists('origin/main', ROOT) ? 'origin/main' : 'main';
    g(['switch', '-q', '-c', target, start]);
    if (start === 'origin/main') g(['branch', '-q', '--unset-upstream'], { allowFail: true });
  }
  ok(`on branch ${c.bold(target)}`);
}

function copyEnvFiles() {
  for (const dir of ENV_FILES) {
    const example = join(ROOT, dir, '.env.example');
    const target = join(ROOT, dir, '.env');
    if (existsSync(example) && !existsSync(target)) {
      copyFileSync(example, target);
      ok(`created ${dir}/.env from .env.example`);
    }
  }
}

function main() {
  if (checkOnly) return doctor() ? 1 : 0;

  if (!ROLES.includes(role)) {
    console.log(
      'Usage: node scripts/setup-dev.mjs <dev1|dev2|dev3> [--init] [--no-install]\n       node scripts/setup-dev.mjs --check',
    );
    return 1;
  }
  console.log(c.bold(`Setting up this clone as ${role}`));

  if (flags.init) {
    if (!initRepo()) return 1;
  } else if (!isRepo()) {
    bad('Not a git repository. On the first machine run: node scripts/setup-dev.mjs dev1 --init');
    return 1;
  }

  if (hasRemote('origin', ROOT)) {
    g(['fetch', '-q', 'origin'], { allowFail: true }) === null
      ? warn('git fetch failed (offline?) — continuing')
      : ok('fetched origin');
  }
  configure();
  switchToWorkBranch();
  copyEnvFiles();

  if (!flags.init && !flags['no-install']) {
    info('installing dependencies (npm install)…');
    if (run('npm', ['install'], { cwd: ROOT }) !== 0)
      warn('npm install failed — fix and re-run `npm install`');
  }

  const failures = doctor();
  console.log(c.bold('\nNext steps'));
  if (!hasRemote('origin', ROOT)) {
    console.log(`  1. Create an EMPTY GitHub repo (no README), then:
       git remote add origin https://github.com/<you>/<repo>.git
       git push -u origin main
       git push -u origin ${role}/work
  2. GitHub settings: allow merge commits only; ruleset on main (require PR + "verify" check,
     block force pushes and deletion); create label "ownership-approved"; add teammates.
  3. Teammates: git clone … && node scripts/setup-dev.mjs dev2   (or dev3)`);
  } else {
    console.log(`  npm run whoami   — confirm your role and paths
  npm run dev      — web on http://localhost:5173, API on http://localhost:8787
  Start Claude Code / Codex in this folder and run /task-start <ID> (Codex: $task-start)`);
  }
  return failures ? 1 : 0;
}

process.exitCode = main();
