// Lightweight secret detection for the pre-commit hook. High-confidence patterns only. Owner: dev3.

const TEMPLATE_ENV = /(^|\/)\.env\.(example|sample|template)$/;
const SECRET_FILES = [
  /(^|\/)\.env(\.[^/]*)?$/, // .env, .env.local, apps/api/.env …
  /\.(pem|key|p12|pfx|keystore)$/i,
  /(^|\/)id_(rsa|dsa|ecdsa|ed25519)$/,
];

export const SECRET_PATTERNS = [
  { name: 'Anthropic API key', regex: /sk-ant-[A-Za-z0-9_-]{20,}/ },
  { name: 'OpenAI API key', regex: /\bsk-(?!ant-)(?:proj-|svcacct-|admin-)?[A-Za-z0-9_-]{32,}/ },
  { name: 'AWS access key ID', regex: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/ },
  {
    name: 'GitHub token',
    regex: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36,}|\bgithub_pat_[A-Za-z0-9_]{40,}/,
  },
  { name: 'Google API key', regex: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { name: 'Slack token', regex: /\bxox[abprs]-[A-Za-z0-9-]{10,}/ },
  { name: 'Stripe live key', regex: /\b(?:sk|rk)_live_[A-Za-z0-9]{20,}/ },
  { name: 'Private key', regex: /-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----/ },
];

export function isSecretFile(path) {
  if (TEMPLATE_ENV.test(path)) return false;
  return SECRET_FILES.some((regex) => regex.test(path));
}

/**
 * Scan a unified diff (`git diff --cached -U0`) and report added lines that look like secrets.
 * Returns [{ file, name }].
 */
export function findSecretsInDiff(diff) {
  const findings = [];
  let file = null;
  for (const line of diff.split(/\r?\n/)) {
    if (line.startsWith('+++ ')) {
      file = line.startsWith('+++ b/') ? line.slice(6) : null;
      continue;
    }
    if (!file || !line.startsWith('+')) continue;
    const hit = SECRET_PATTERNS.find(({ regex }) => regex.test(line));
    if (hit) findings.push({ file, name: hit.name });
  }
  return findings;
}
