const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const yml = fs.readFileSync(path.join(root, "infrastructure/docker/docker-compose.prod.yml"), "utf8");
assert.match(yml, /TRADING_MODE: PAPER/);
assert.match(yml, /HELIOS_SIGNER_ENABLE: "0"/);
assert.doesNotMatch(yml, /3100:3100/);
assert.doesNotMatch(yml, /3200:3200/);
assert.match(yml, /expose:[\s\S]*3100/);
const doc = fs.readFileSync(path.join(root, "docs/deployment/HOSTINGER.md"), "utf8");
assert.match(doc, /Hostinger/);
assert.doesNotMatch(doc, /Replit/);
console.log("S8 Hostinger compose unit checks: PASS paper_only no_host_signer_port");
