const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const ws = fs.readFileSync(path.join(root, "pnpm-workspace.yaml"), "utf8");
assert.match(ws, /apps\/\*/);
assert.match(ws, /packages\/\*/);
assert.match(ws, /services\/\*/);
assert.match(ws, /workers\/\*/);

const expected = [
  ["apps/api", "@helios/api"],
  ["apps/web", "@helios/web"],
  ["packages/agents", "@helios/agents"],
  ["packages/database", "@helios/database"],
  ["packages/runtime", "@helios/runtime"],
  ["packages/shared", "@helios/shared"],
  ["packages/solana", "@helios/solana"],
  ["packages/config", "@helios/config"],
  ["packages/wallet", "@helios/wallet"],
  ["packages/secrets", "@helios/secrets"],
  ["services/control-gateway", "@helios/services-control-gateway"],
  ["services/discovery", "@helios/discovery"],
  ["services/execution", "@helios/execution"],
  ["services/exits", "@helios/exits"],
  ["services/migration", "@helios/migration"],
  ["services/monitoring", "@helios/monitoring"],
  ["services/quote", "@helios/quote"],
  ["services/smart-money", "@helios/smart-money"],
  ["services/transaction-simulator", "@helios/transaction-simulator"],
  ["workers/pipeline", "@helios/worker-pipeline"],
];

const names = [];
for (const [rel, name] of expected) {
  const pj = path.join(root, rel, "package.json");
  assert.equal(fs.existsSync(pj), true, `missing ${rel}/package.json`);
  const json = JSON.parse(fs.readFileSync(pj, "utf8"));
  assert.equal(json.name, name, rel);
  names.push(name);
}
assert.equal(names.length, 20);
assert.equal(new Set(names).size, 20, "duplicate package names");

const notInHandoff = [
  "services/risk",
  "services/scoring",
  "services/signal",
  "services/position",
];
for (const rel of notInHandoff) {
  assert.equal(fs.existsSync(path.join(root, rel)), false);
}

const api = JSON.parse(fs.readFileSync(path.join(root, "apps/api/package.json"), "utf8"));
assert.equal(api.dependencies["@helios/database"], "workspace:*");
assert.equal(api.dependencies["@helios/runtime"], "workspace:*");
assert.ok(api.dependencies.pg);

const mig = JSON.parse(fs.readFileSync(path.join(root, "services/migration/package.json"), "utf8"));
assert.equal(mig.dependencies["@helios/solana"], "workspace:*");
assert.ok(mig.dependencies["@solana/web3.js"]);

const db = JSON.parse(fs.readFileSync(path.join(root, "packages/database/package.json"), "utf8"));
assert.ok(db.dependencies.pg);

const web = JSON.parse(fs.readFileSync(path.join(root, "apps/web/package.json"), "utf8"));
assert.ok(web.dependencies.react);

assert.equal(fs.existsSync(path.join(root, "packages/solana/src/metadata/find-metadata-pda.ts")), true);
assert.equal(fs.existsSync(path.join(root, "services/discovery/src/sources/pumpfun-parse.ts")), true);


console.log(`Monorepo pack check: PASS packages=${names.length} workspace_ok deps_declared`);

