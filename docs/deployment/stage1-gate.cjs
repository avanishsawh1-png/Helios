const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "../..");
const files = [
  "apps/api/Dockerfile",
  "apps/web/Dockerfile",
  "services/control-gateway/Dockerfile",
  "workers/pipeline/Dockerfile",
  "infrastructure/nginx/helios.conf",
  "infrastructure/docker/docker-compose.prod.yml",
  ".env.control-plane.example",
  ".env.trading-runtime.example",
  "scripts/migrate.mjs",
  "scripts/backup-db.sh",
];
for (const rel of files) {
  assert.equal(fs.existsSync(path.join(root, rel)), true, rel);
}

const compose = fs.readFileSync(path.join(root, "infrastructure/docker/docker-compose.prod.yml"), "utf8");
assert.match(compose, /TRADING_MODE: PAPER/);
assert.doesNotMatch(compose, /3100:3100/);
assert.match(compose, /expose:\n\s+- "3100"/);

const nginx = fs.readFileSync(path.join(root, "infrastructure/nginx/helios.conf"), "utf8");
assert.match(nginx, /proxy_pass http:\/\/api:3000/);
assert.match(nginx, /NOT proxied/);

const envT = fs.readFileSync(path.join(root, ".env.trading-runtime.example"), "utf8");
assert.match(envT, /TRADING_MODE=PAPER/);
assert.doesNotMatch(envT, /PRIVATE_KEY|SECRET_KEY|SEED/);

const worker = fs.readFileSync(path.join(root, "workers/pipeline/src/paper-system.mjs"), "utf8");
assert.match(worker, /LIVE_MODE_REFUSED/);

const r = spawnSync(process.execPath, [path.join(root, "scripts/migrate.mjs")], {
  env: { ...process.env, DATABASE_URL: "postgres://x", TRADING_MODE: "PAPER" },
  encoding: "utf8",
});
assert.equal(r.status, 0, r.stderr);

console.log("Stage 1 deploy artifacts unit checks: PASS paper_only gateway_unpublished");
