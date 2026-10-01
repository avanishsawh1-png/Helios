/**
 * Wave 24 — Dashboard preset editor view-model.
 * Hard limits are read-only. Submit uses existing RBAC canConfig.
 * null → "—". No LIVE default.
 */

export interface EditorState {
  canConfig: boolean;
  hardMaxPositionUsd: number;
  draftMaxPositionUsd: number | null;
  lastError: string | null;
}

export function formatField(value: number | null): string {
  return value === null || Number.isNaN(value) ? "—" : String(value);
}

export function canSubmit(state: EditorState): boolean {
  return state.canConfig && state.draftMaxPositionUsd !== null;
}

export function submitDraft(state: EditorState): { ok: boolean; error: string | null } {
  if (!state.canConfig) return { ok: false, error: "forbidden" };
  if (state.draftMaxPositionUsd === null) return { ok: false, error: "unknown_draft" };
  if (state.draftMaxPositionUsd > state.hardMaxPositionUsd) return { ok: false, error: "exceeds_hard" };
  return { ok: true, error: null };
}
