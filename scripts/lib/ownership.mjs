// Ownership map parsing and matching. The map itself lives in docs/OWNERSHIP.md. Owner: dev3.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { currentBranch, git } from './git.mjs';

export const OWNERSHIP_DOC = 'docs/OWNERSHIP.md';
export const ROLES = ['dev1', 'dev2', 'dev3'];
export const OWNERS = [...ROLES, 'any'];

export const toPosix = (path) => path.replace(/\\/g, '/').replace(/^\.\//, '');

/**
 * Glob → RegExp. Patterns are anchored at the repo root.
 *   **  any characters including "/"      *  any characters except "/"      ?  one character
 *   a trailing "/" means "everything inside" (same as "/**").
 */
export function globToRegExp(glob) {
  let pattern = toPosix(glob.trim()).replace(/^\//, '');
  if (pattern.endsWith('/')) pattern += '**';
  let source = '';
  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i];
    if (char === '*') {
      if (pattern[i + 1] === '*') {
        i++;
        if (pattern[i + 1] === '/') {
          i++;
          source += '(?:.*/)?';
        } else {
          source += '.*';
        }
      } else {
        source += '[^/]*';
      }
    } else if (char === '?') {
      source += '[^/]';
    } else if ('\\^$+.()|{}[]'.includes(char)) {
      source += `\\${char}`;
    } else {
      source += char;
    }
  }
  return new RegExp(`^${source}$`);
}

/**
 * Parse the fenced ```ownership block. One rule per line: `<pattern> <owner>`.
 * `#` starts a comment. Later rules override earlier ones (last match wins, like CODEOWNERS).
 */
export function parseOwnershipMap(markdown, source = OWNERSHIP_DOC) {
  const block = markdown.match(/```ownership\r?\n([\s\S]*?)```/);
  if (!block) throw new Error(`${source}: no \`\`\`ownership block found`);
  const rules = [];
  block[1].split(/\r?\n/).forEach((raw, index) => {
    const line = raw.replace(/#.*$/, '').trim();
    if (!line) return;
    const parts = line.split(/\s+/);
    if (parts.length !== 2) {
      throw new Error(
        `${source}: ownership line ${index + 1} must be "<pattern> <owner>": "${raw}"`,
      );
    }
    const [pattern, owner] = parts;
    if (!OWNERS.includes(owner)) {
      throw new Error(`${source}: unknown owner "${owner}" (use ${OWNERS.join(', ')}): "${raw}"`);
    }
    rules.push({ pattern, owner, regex: globToRegExp(pattern) });
  });
  if (rules.length === 0) throw new Error(`${source}: the ownership block is empty`);
  return rules;
}

/** Owner of a repo-relative path: { owner, rule } (owner null if no rule matches). */
export function ownerOf(path, rules) {
  const normalized = toPosix(path);
  let match = null;
  for (const rule of rules) if (rule.regex.test(normalized)) match = rule;
  return { owner: match?.owner ?? null, rule: match };
}

export function canEdit(role, path, rules) {
  const { owner } = ownerOf(path, rules);
  return owner === 'any' || (owner !== null && owner === role);
}

/** Split paths into allowed and blocked ({ path, owner }) for a role. */
export function checkPaths(role, paths, rules) {
  const allowed = [];
  const blocked = [];
  for (const path of paths) {
    const { owner } = ownerOf(path, rules);
    if (owner === 'any' || (owner !== null && owner === role)) allowed.push(path);
    else blocked.push({ path: toPosix(path), owner });
  }
  return { allowed, blocked };
}

/** Patterns a role owns (explicitly) plus shared ones — for banners and docs. */
export function ownedPatterns(role, rules) {
  const own = rules.filter((r) => r.owner === role).map((r) => r.pattern);
  const shared = rules.filter((r) => r.owner === 'any').map((r) => r.pattern);
  return { own, shared, isDefaultOwner: own.includes('**') };
}

/**
 * Load the map from a git revision (e.g. "origin/main", "HEAD") when available, otherwise from the
 * working tree. Checks use the base branch's map so nobody can grant themselves paths in their PR.
 */
export function loadOwnership(root, rev) {
  if (rev) {
    const text = git(['show', `${rev}:${OWNERSHIP_DOC}`], { cwd: root, allowFail: true });
    if (text !== null)
      return {
        rules: parseOwnershipMap(text, `${rev}:${OWNERSHIP_DOC}`),
        source: `${rev}:${OWNERSHIP_DOC}`,
      };
  }
  const file = join(root, OWNERSHIP_DOC);
  if (!existsSync(file)) throw new Error(`${OWNERSHIP_DOC} not found in ${root}`);
  return { rules: parseOwnershipMap(readFileSync(file, 'utf8')), source: OWNERSHIP_DOC };
}

/** Role of this clone: `git config hackathon.role`, else the branch prefix (dev1/…). */
export function resolveRole(root) {
  const configured = git(['config', '--get', 'hackathon.role'], { cwd: root, allowFail: true });
  if (configured && ROLES.includes(configured.trim())) {
    return { role: configured.trim(), source: 'git config hackathon.role' };
  }
  const branch = currentBranch(root);
  const match = branch?.match(/^(dev[1-3])\//);
  if (match) return { role: match[1], source: `branch ${branch}` };
  return { role: null, source: null };
}

/** Branch naming rule: commits only on `<role>/<topic>`, never on main or a detached HEAD. */
export function branchProblem(role, branch) {
  if (!branch) return 'you are on a detached HEAD — switch to your branch first';
  if (branch === 'main' || branch === 'master') {
    return `you are on ${branch} — never commit there; switch to your branch: git switch ${role ?? '<role>'}/work`;
  }
  if (role && !branch.startsWith(`${role}/`)) {
    return `branch "${branch}" does not match your role ${role} — use ${role}/<topic> (rename: git branch -m ${role}/<topic>)`;
  }
  return null;
}
