const assert = require("node:assert/strict");

function isProtectedTarget(name) {
  const list = ["manualAdminApproval", "wallet", "signer", "secrets", ".env", "TRADING_MODE"];
  return list.some((t) => name === t || name.startsWith(t + ".") || name.startsWith(t + "/"));
}

function sanitizeUntrusted(text, max = 4000) {
  const stripped = String(text).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").replace(/```/g, "'''");
  return `<untrusted>${stripped.slice(0, max)}</untrusted>`;
}

class KnowledgeBase {
  constructor() {
    this.docs = new Map();
  }
  put(doc) {
    if (isProtectedTarget(doc.source) || isProtectedTarget(doc.id)) {
      throw new Error("AGENT_OS_BOUNDARY");
    }
    const stored = { ...doc, title: sanitizeUntrusted(doc.title, 200), body: sanitizeUntrusted(doc.body) };
    this.docs.set(doc.id, stored);
    return stored;
  }
  get(id) {
    return this.docs.get(id) ?? null;
  }
  search(q) {
    const n = q.toLowerCase();
    return [...this.docs.values()].filter((d) => d.title.toLowerCase().includes(n) || d.body.toLowerCase().includes(n));
  }
}

const kb = new KnowledgeBase();
const doc = kb.put({
  id: "inv-null-pnl",
  kind: "invariant",
  title: "null pnl",
  body: "Never collapse null into 0. Token ```rug``` name",
  source: "docs/exits/E1_BASELINE.md",
  createdAt: "2026-09-25T00:00:00.000Z",
});
assert.match(doc.body, /<untrusted>/);
assert.doesNotMatch(doc.body, /```/);
assert.ok(kb.search("never collapse").length === 1);
assert.equal(kb.get("missing"), null);

assert.throws(() =>
  kb.put({
    id: "bad",
    kind: "runbook",
    title: "x",
    body: "y",
    source: "wallet/keystore",
    createdAt: "2026-09-25T00:00:00.000Z",
  }),
);

console.log("Wave 9 knowledge base unit checks: PASS");
