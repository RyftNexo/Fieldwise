// Small, dependency-free git helpers shared by the team scripts. Owner: dev3.
import { spawnSync } from 'node:child_process';
import { isAbsolute, join } from 'node:path';

/** Run git and return trimmed stdout. With allowFail, returns null instead of throwing. */
export function git(args, { cwd = process.cwd(), allowFail = false, input } = {}) {
  const result = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    input,
    maxBuffer: 64 * 1024 * 1024,
    windowsHide: true,
  });
  if (result.error) {
    if (allowFail) return null;
    throw new Error(`git is not available: ${result.error.message}`);
  }
  if (result.status !== 0) {
    if (allowFail) return null;
    const output = (result.stderr || result.stdout || '').trim();
    throw new Error(`git ${args.join(' ')} failed${output ? `:\n${output}` : ''}`);
  }
  return result.stdout.replace(/\s+$/, '');
}

/** Run git and return { status, stdout, stderr } without throwing (for commands that use exit codes). */
export function gitRaw(args, cwd = process.cwd()) {
  const result = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    windowsHide: true,
  });
  return { status: result.status ?? 1, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}

export const lines = (text) => (text ? text.split(/\r?\n/).filter(Boolean) : []);

export const repoRoot = (cwd) => git(['rev-parse', '--show-toplevel'], { cwd, allowFail: true });

/** Current branch name, or null on a detached HEAD. */
export const currentBranch = (cwd) =>
  git(['symbolic-ref', '--quiet', '--short', 'HEAD'], { cwd, allowFail: true });

export const refExists = (ref, cwd) =>
  git(['rev-parse', '--verify', '--quiet', `${ref}^{commit}`], { cwd, allowFail: true }) !== null;

/** Absolute path of a file inside this worktree's git dir (e.g. MERGE_HEAD, FETCH_HEAD). */
export function gitPath(name, cwd) {
  const path = git(['rev-parse', '--git-path', name], { cwd, allowFail: true });
  if (!path) return null;
  return isAbsolute(path) ? path : join(cwd, path);
}

/** Ref to compare a branch against: origin/main when it exists, else local main. */
export function baseRef(cwd) {
  for (const ref of ['origin/main', 'main']) if (refExists(ref, cwd)) return ref;
  return null;
}

export function hasRemote(name, cwd) {
  return lines(git(['remote'], { cwd, allowFail: true }) ?? '').includes(name);
}

/** [major, minor, patch] of the installed git, or null. */
export function gitVersion() {
  const text = git(['--version'], { allowFail: true });
  const match = text?.match(/(\d+)\.(\d+)(?:\.(\d+))?/);
  return match ? [Number(match[1]), Number(match[2]), Number(match[3] ?? 0)] : null;
}

export function versionAtLeast(version, [major, minor]) {
  if (!version) return false;
  return version[0] > major || (version[0] === major && version[1] >= minor);
}

/** { behind, ahead } of HEAD relative to a ref, or null if the ref is missing. */
export function aheadBehind(ref, cwd) {
  if (!refExists(ref, cwd)) return null;
  const text = git(['rev-list', '--left-right', '--count', `${ref}...HEAD`], {
    cwd,
    allowFail: true,
  });
  if (!text) return null;
  const [behind, ahead] = text.split(/\s+/).map(Number);
  return { behind, ahead };
}

/**
 * Files changed on this branch since it diverged from `base`.
 * includeWorkingTree adds staged, unstaged and untracked files (for pre-PR self-checks).
 */
export function changedFilesSince(base, cwd, { includeWorkingTree = false } = {}) {
  const mergeBase = git(['merge-base', base, 'HEAD'], { cwd, allowFail: true });
  if (!mergeBase) return null;
  const files = new Set(
    lines(git(['diff', '--name-only', '--no-renames', mergeBase, 'HEAD'], { cwd })),
  );
  if (includeWorkingTree) {
    for (const f of lines(git(['diff', '--name-only', '--no-renames', 'HEAD'], { cwd })))
      files.add(f);
    for (const f of lines(git(['diff', '--name-only', '--no-renames', '--cached'], { cwd })))
      files.add(f);
    for (const f of lines(git(['ls-files', '--others', '--exclude-standard'], { cwd })))
      files.add(f);
  }
  return [...files].sort();
}
