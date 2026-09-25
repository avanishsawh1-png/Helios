/**
 * Wave C4 — Logging hygiene.
 * Production modules must not use console.log / debugger.
 * Gate scripts may print PASS lines.
 */

export const GATE_FILE =
  /(?:^|\/)(?:wave\d+|o\d+|e\d+|c\d+|stage[\d-]+|checklist)-gate\.[cm]?js$/;

export function isGateFile(relPath: string): boolean {
  const base = relPath.replace(/\\/g, "/");
  return (
    GATE_FILE.test(base) ||
    /\/__tests__\//.test(base) ||
    /\.test\.(t|j)sx?$/.test(base) ||
    /(?:^|\/)(?:paper-e2e|leftover-e2e|worker|migrate)\.mjs$/.test(base) ||
    /(?:^|\/)leftover-e2e\.cjs$/.test(base) ||
    /\/scripts\//.test(base) ||
    /\/dist\//.test(base)
  );
}

export function findHygieneViolations(relPath: string, source: string): string[] {
  if (isGateFile(relPath)) return [];
  const hits: string[] = [];
  if (/\bdebugger\b/.test(source)) hits.push("debugger");
  if (/\bconsole\.(log|debug|info|warn|error)\s*\(/.test(source) && !/logger/.test(relPath)) {
    hits.push("console.*");
  }
  return hits;
}
