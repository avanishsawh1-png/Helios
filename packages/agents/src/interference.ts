/**
 * Wave 34 — Interference check: intelligence hooks must not change trading results.
 */

import { FeatureCapture } from "./feature-capture.js";
import { HardLimitRiskPort, ObservingRiskPort } from "./risk-observe.js";
import { applyShadow } from "./shadow-mode.js";

export function interferenceCheck(): { ok: boolean; notes: string[] } {
  const notes: string[] = [];
  const inner = new HardLimitRiskPort(100);
  const baseline = inner.authorize({ sizeUsd: 50 });

  const cap = new FeatureCapture();
  const observed = cap.observe("risk.allowed", "wave34", baseline, () => {
    throw new Error("capture hook");
  });
  if (observed !== baseline) notes.push("feature-capture mutated decision");

  const wrapped = new ObservingRiskPort(inner, () => {
    throw new Error("risk hook");
  });
  const after = wrapped.authorize({ sizeUsd: 50 });
  if (after.allowed !== baseline.allowed || after.reason !== baseline.reason) {
    notes.push("observing risk port mutated authorize");
  }

  let shadowWrite = false;
  try {
    applyShadow({
      id: "x",
      maxPositionUsd: 50,
      maxExposurePct: 5,
      maxDailyLossUsd: 10,
      stopLossPct: 8,
    });
    shadowWrite = true;
  } catch {
    /* expected */
  }
  if (shadowWrite) notes.push("shadow wrote");

  return { ok: notes.length === 0, notes };
}
