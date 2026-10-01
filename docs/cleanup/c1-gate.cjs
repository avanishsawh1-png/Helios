const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const inv = path.resolve(__dirname, "C1_INVENTORY.md");
assert.equal(fs.existsSync(inv), true);
const text = fs.readFileSync(inv, "utf8");
assert.match(text, /NO DELETIONS/);
assert.match(text, /Human must mark DELETE or KEEP/);
const keeps = (text.match(/\| KEEP \|/g) || []).length;
assert.ok(keeps >= 200, `expected many KEEP rows, got ${keeps}`);
console.log(`Wave C1 inventory unit checks: PASS rows_keep=${keeps}`);

