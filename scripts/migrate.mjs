#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL missing");
  process.exit(1);
}
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const files = [
  "services/migration/src/agent_run_outcomes.sql",
  "services/migration/src/scoring_policy_versions.sql",
];
for (const rel of files) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) {
    console.error("missing", rel);
    process.exit(1);
  }
  const sql = fs.readFileSync(p, "utf8");
  if (!/CREATE TABLE/i.test(sql)) {
    console.error("sql does not look like schema", rel);
    process.exit(1);
  }
}
console.log(
  "migrate validate: schema files present TRADING_MODE=",
  process.env.TRADING_MODE ?? "PAPER",
);
console.log("apply against live Postgres is operator: psql \"$DATABASE_URL\" -f <file>");
