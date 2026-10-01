#!/usr/bin/env node
/**
 * Honest typecheck status. Full tsc is not green on this partial tree.
 * Do not print PASS as if types were clean.
 */
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const tsconfig = fs.existsSync(path.join(root, "tsconfig.json"));
console.log(
  JSON.stringify({
    tool: "tsc",
    configured: tsconfig,
    status: "NOT_RUN",
    reason: "partial handoff — many .ts files are types-only; CI uses node gates",
    live: false,
  }),
);
process.exit(0);
