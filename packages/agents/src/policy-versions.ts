/**
 * Stage 4 §17 — versioned scoring weights.
 * Active flag is human-set. Agents may insert inactive rows only.
 */

export interface ScoringWeights {
  security: number;
  smartMoney: number;
  momentum: number;
  holder: number;
}

export interface PolicyVersionRow {
  policyVersion: string;
  weights: ScoringWeights;
  active: boolean;
  createdBy: "human" | "agent";
}

export function weightsValid(w: ScoringWeights): boolean {
  const xs = [w.security, w.smartMoney, w.momentum, w.holder];
  if (xs.some((x) => !Number.isFinite(x) || x < 0)) return false;
  const sum = xs.reduce((a, b) => a + b, 0);
  return Math.abs(sum - 1) < 1e-6;
}

export class PolicyVersionStore {
  private readonly rows = new Map<string, PolicyVersionRow>();

  insert(row: PolicyVersionRow): PolicyVersionRow {
    if (!weightsValid(row.weights)) throw new Error("invalid_weights");
    if (row.active && row.createdBy !== "human") throw new Error("agent_cannot_activate");
    if (row.active) {
      for (const r of this.rows.values()) r.active = false;
    }
    const stored = { ...row, weights: { ...row.weights } };
    this.rows.set(row.policyVersion, stored);
    return stored;
  }

  active(): PolicyVersionRow | null {
    return [...this.rows.values()].find((r) => r.active) ?? null;
  }

  get(id: string): PolicyVersionRow | null {
    return this.rows.get(id) ?? null;
  }
}
