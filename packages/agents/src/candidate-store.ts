/**
 * Wave 21 — Persistence & provider for validated preset candidates.
 * Store only ACCEPTED_CANDIDATE rows. Load does not activate trading.
 */

import {
  validatePreset,
  type RiskPresetCandidate,
  type ValidationResult,
} from "./preset-validation.js";

export interface StoredCandidate {
  candidate: RiskPresetCandidate;
  validation: ValidationResult;
  storedAt: string;
  active: boolean;
}

export class CandidateStore {
  private readonly rows = new Map<string, StoredCandidate>();

  put(candidate: RiskPresetCandidate, at = new Date().toISOString()): StoredCandidate {
    const validation = validatePreset(candidate);
    if (validation.status !== "ACCEPTED_CANDIDATE") {
      throw new Error(`refuse persist: ${validation.status}`);
    }
    const row: StoredCandidate = { candidate, validation, storedAt: at, active: false };
    this.rows.set(candidate.id, row);
    return row;
  }

  get(id: string): StoredCandidate | null {
    return this.rows.get(id) ?? null;
  }

  list(): StoredCandidate[] {
    return [...this.rows.values()];
  }

  activate(_id: string): never {
    throw new Error("activation is human-gated — Wave 22/30");
  }
}

export class CandidateProvider {
  constructor(private readonly store: CandidateStore) {}

  currentActive(): StoredCandidate | null {
    return this.store.list().find((r) => r.active) ?? null;
  }

  byId(id: string): StoredCandidate | null {
    return this.store.get(id);
  }
}
