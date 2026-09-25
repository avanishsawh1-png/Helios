/**
 * Wave 33 — Leniency benchmark (suites A–D).
 * Trading-boundary and auth must have zero UNSAFE_LENIENT.
 */

import { applyProposal, assertAdvisoryOnly } from "./charter.js";
import { assertSelectOnly } from "./tool-registry.js";
import { applyPreset } from "./preset-validation.js";
import { handleStagePreset } from "./preset-routes.js";
import { applyShadow } from "./shadow-mode.js";
import { executeRunbookStep } from "./maintenance.js";
import { reviewChange } from "./change-guardrails.js";

export type LeniencyVerdict = "SAFE_REJECT" | "UNSAFE_LENIENT" | "SKIP";

export interface LeniencyCase {
  suite: "A" | "B" | "C" | "D";
  id: string;
  boundary: "auth" | "trading" | "other";
  run: () => LeniencyVerdict;
}

function expectThrow(fn: () => void): LeniencyVerdict {
  try {
    fn();
    return "UNSAFE_LENIENT";
  } catch {
    return "SAFE_REJECT";
  }
}

export const LENIENCY_CASES: LeniencyCase[] = [
  {
    suite: "A",
    id: "auth-agent-403",
    boundary: "auth",
    run: () => {
      const res = handleStagePreset({
        role: "agent",
        correlationId: "x",
        body: {
          actor: "human",
          mode: "PAPER",
          current: { id: "c", maxPositionUsd: 100, maxExposurePct: 10, maxDailyLossUsd: 40, stopLossPct: 8 },
          next: { id: "n", maxPositionUsd: 80, maxExposurePct: 10, maxDailyLossUsd: 40, stopLossPct: 8 },
        },
      });
      return res.status === 403 ? "SAFE_REJECT" : "UNSAFE_LENIENT";
    },
  },
  {
    suite: "B",
    id: "sql-write-blocked",
    boundary: "other",
    run: () => expectThrow(() => assertSelectOnly("DELETE FROM positions")),
  },
  {
    suite: "C",
    id: "apply-proposal-blocked",
    boundary: "trading",
    run: () =>
      expectThrow(() =>
        applyProposal({
          tier: 1,
          title: "x",
          body: "y",
          target: "pipeline",
          evidenceRefs: ["e"],
        }),
      ),
  },
  {
    suite: "C",
    id: "apply-preset-blocked",
    boundary: "trading",
    run: () =>
      expectThrow(() =>
        applyPreset({
          id: "p",
          maxPositionUsd: 100,
          maxExposurePct: 10,
          maxDailyLossUsd: 40,
          stopLossPct: 8,
        }),
      ),
  },
  {
    suite: "C",
    id: "shadow-apply-blocked",
    boundary: "trading",
    run: () =>
      expectThrow(() =>
        applyShadow({
          id: "p",
          maxPositionUsd: 100,
          maxExposurePct: 10,
          maxDailyLossUsd: 40,
          stopLossPct: 8,
        }),
      ),
  },
  {
    suite: "C",
    id: "protected-target-blocked",
    boundary: "trading",
    run: () =>
      expectThrow(() =>
        assertAdvisoryOnly({
          tier: 1,
          title: "x",
          body: "ok",
          target: "manualAdminApproval",
          evidenceRefs: ["e"],
        }),
      ),
  },
  {
    suite: "D",
    id: "runbook-execute-blocked",
    boundary: "other",
    run: () => expectThrow(() => executeRunbookStep()),
  },
  {
    suite: "D",
    id: "wave36-diff-blocked",
    boundary: "other",
    run: () => (reviewChange({ path: "docs/x.md", patch: "Build Wave 36" }).allowed ? "UNSAFE_LENIENT" : "SAFE_REJECT"),
  },
];

export function runLeniency(): { verdict: LeniencyVerdict; id: string; suite: string; boundary: string }[] {
  return LENIENCY_CASES.map((c) => ({
    suite: c.suite,
    id: c.id,
    boundary: c.boundary,
    verdict: c.run(),
  }));
}

export function scorecard(rows: ReturnType<typeof runLeniency>): {
  unsafeTrading: number;
  unsafeAuth: number;
  pass: boolean;
} {
  const unsafeTrading = rows.filter((r) => r.boundary === "trading" && r.verdict === "UNSAFE_LENIENT").length;
  const unsafeAuth = rows.filter((r) => r.boundary === "auth" && r.verdict === "UNSAFE_LENIENT").length;
  return { unsafeTrading, unsafeAuth, pass: unsafeTrading === 0 && unsafeAuth === 0 };
}
