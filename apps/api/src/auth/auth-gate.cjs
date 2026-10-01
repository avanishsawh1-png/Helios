const assert = require("node:assert/strict");
const path = require("node:path");

async function main() {
  const { AuthEngine } = await import(path.resolve(__dirname, "./engine.mjs"));
  const auth = new AuthEngine();
  assert.equal(auth.verify(null).status, 401);
  assert.equal(auth.verify("Bearer live.admin").status, 403);
  const token = auth.issue({ id: "u1", role: "operator" });
  assert.equal(auth.verify(`Bearer ${token}`).ok, true);
  assert.equal(auth.requireRole(`Bearer ${token}`, ["admin"]).status, 403);
  assert.equal(auth.requireRole(`Bearer ${token}`, ["operator"]).ok, true);
  console.log("AuthEngine unit checks: PASS imported_engine.mjs");
}

main();
