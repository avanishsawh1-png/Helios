/**
 * Wave 32 — Change guardrails.
 * Blocks forbidden diffs by path/symbol. Advisory CI helper; does not edit files.
 */

export const FORBIDDEN_CHANGE_PATTERNS = [
  /manualAdminApproval/,
  /Wave\s*36/,
  /ExitEngine\.evaluate[\s\S]{0,200}Llm|Llm[\s\S]{0,80}ExitEngine\.evaluate/,
  /failOpenOnAuth/,
  /CROSSSLOT/,
] as const;

export interface ChangeDiff {
  path: string;
  patch: string;
}

export interface GuardResult {
  allowed: boolean;
  hits: string[];
}

export function reviewChange(diff: ChangeDiff): GuardResult {
  const blob = `${diff.path}\n${diff.patch}`;
  const hits: string[] = [];
  if (/\.env/.test(diff.path) && /PRIVATE|SECRET|SEED/i.test(diff.patch)) {
    hits.push("secrets-in-env");
  }
  if (/wallet/.test(diff.path) && /helios/.test(diff.path)) {
    hits.push("wallet-inside-helios-session");
  }
  for (const re of FORBIDDEN_CHANGE_PATTERNS) {
    if (re.test(blob)) hits.push(re.source);
  }
  return { allowed: hits.length === 0, hits };
}

export function reviewBatch(diffs: ChangeDiff[]): GuardResult {
  const hits = diffs.flatMap((d) => reviewChange(d).hits);
  return { allowed: hits.length === 0, hits };
}
