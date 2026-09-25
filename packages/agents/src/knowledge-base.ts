/**
 * Wave 9 — Agent OS knowledge base (read-only).
 * Untrusted on-chain/log text is sanitized, length-capped, never executed.
 */

import { AgentOsBoundaryError, isProtectedTarget } from "./charter.js";

export const KB_MAX_BODY_CHARS = 4_000;

export type KnowledgeKind = "runbook" | "invariant" | "glossary" | "incident_note";

export interface KnowledgeDoc {
  id: string;
  kind: KnowledgeKind;
  title: string;
  body: string;
  source: string;
  createdAt: string;
}

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function sanitizeUntrusted(text: string, max = KB_MAX_BODY_CHARS): string {
  const stripped = text.replace(CONTROL_CHARS, "").replace(/```/g, "'''");
  const wrapped = `<untrusted>${stripped.slice(0, max)}</untrusted>`;
  return wrapped;
}

export class KnowledgeBase {
  private readonly docs = new Map<string, KnowledgeDoc>();

  put(doc: KnowledgeDoc): KnowledgeDoc {
    if (isProtectedTarget(doc.source) || isProtectedTarget(doc.id)) {
      throw new AgentOsBoundaryError(`kb refuses protected source/id: ${doc.source}`);
    }
    const stored: KnowledgeDoc = {
      ...doc,
      title: sanitizeUntrusted(doc.title, 200),
      body: sanitizeUntrusted(doc.body),
    };
    this.docs.set(doc.id, stored);
    return stored;
  }

  get(id: string): KnowledgeDoc | null {
    return this.docs.get(id) ?? null;
  }

  list(kind?: KnowledgeKind): KnowledgeDoc[] {
    const all = [...this.docs.values()];
    return kind ? all.filter((d) => d.kind === kind) : all;
  }

  search(q: string): KnowledgeDoc[] {
    const n = q.toLowerCase();
    return [...this.docs.values()].filter(
      (d) => d.title.toLowerCase().includes(n) || d.body.toLowerCase().includes(n),
    );
  }
}
