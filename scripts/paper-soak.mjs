#!/usr/bin/env node
/**
 * PAPER soak runner. Never writes paperModePass=true.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runPaperCycle } from "../workers/pipeline/src/paper-system.mjs";

export function classifySoak({ n, liveSubmitted }) {
  if (liveSubmitted > 0) {
    return { availability: "UNAVAILABLE", reason: "live_submit_during_paper_soak" };
  }
  if (n >= 20) return { availability: "OK", reason: "n_gte_20" };
  return { availability: "INSUFFICIENT_SAMPLE", reason: "n_lt_20" };
}

export function soakReport(rows) {
  const n = rows.length;
  const liveSubmitted = rows.filter((r) => r.liveAttempt?.submitted).length;
  const cls = classifySoak({ n, liveSubmitted });
  return {
    ...cls,
    n,
    paperExecuted: rows.filter((r) => r.paperExecuted).length,
    liveSubmitted,
    paperModePass: false,
    liveModeEnabled: false,
    manualAdminApproval: null,
  };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  const n = Number(process.env.SOAK_CYCLES ?? 3);
  const rows = [];
  for (let i = 0; i < n; i += 1) {
    rows.push(await runPaperCycle({ mode: "PAPER" }));
  }
  const body = soakReport(rows);
  const outDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../docs/phase-reports/soaks");
  fs.mkdirSync(outDir, { recursive: true });
  const file = path.join(outDir, `paper-${new Date().toISOString().slice(0, 10)}.json`);
  fs.writeFileSync(file, JSON.stringify(body, null, 2));
  console.log(`paper soak ${body.availability} n=${body.n} paperModePass=${body.paperModePass}`);
}
