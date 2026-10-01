/**
 * Wave 14 — Risk engine wiring fix.
 * Observation wraps RiskPort without changing authorize() results.
 * Agent output is never passed into RiskPort.
 */

export interface RiskDecision {
  allowed: boolean;
  reason: string;
  limitsVersion: string;
}

export interface RiskPort {
  authorize(intent: { sizeUsd: number | null }): RiskDecision;
}

export class HardLimitRiskPort implements RiskPort {
  constructor(private readonly maxSizeUsd: number, private readonly limitsVersion = "hard-v1") {}

  authorize(intent: { sizeUsd: number | null }): RiskDecision {
    if (intent.sizeUsd === null) {
      return { allowed: false, reason: "size_unknown", limitsVersion: this.limitsVersion };
    }
    if (intent.sizeUsd > this.maxSizeUsd) {
      return { allowed: false, reason: "hard_limit", limitsVersion: this.limitsVersion };
    }
    return { allowed: true, reason: "ok", limitsVersion: this.limitsVersion };
  }
}

export class ObservingRiskPort implements RiskPort {
  hookErrors = 0;
  observations = 0;

  constructor(
    private readonly inner: RiskPort,
    private readonly hook?: (decision: RiskDecision) => void,
  ) {}

  authorize(intent: { sizeUsd: number | null }): RiskDecision {
    const decision = this.inner.authorize(intent);
    try {
      this.observations += 1;
      this.hook?.(decision);
    } catch {
      this.hookErrors += 1;
    }
    return decision;
  }
}

export function assertNoAgentMutation(decision: RiskDecision, after: RiskDecision): void {
  if (decision.allowed !== after.allowed || decision.reason !== after.reason) {
    throw new Error("risk decision mutated by observer");
  }
}
