#!/usr/bin/env node
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");

const root = path.resolve(__dirname, "../..");
const phases = [
  ["E5 exits", "services/exits/src/e5-gate.cjs"],
  ["O1 shutdown", "packages/runtime/src/o1-gate.cjs"],
  ["O2 rpc", "packages/solana/src/o2-gate.cjs"],
  ["O3 supervisor", "packages/runtime/src/o3-gate.cjs"],
  ["O4 bounds", "packages/runtime/src/o4-gate.cjs"],
  ["O5 soak evidence", "packages/runtime/src/o5-gate.cjs"],
  ["W8-32 agents", "docs/cleanup/c6-gate.cjs"],
  ["Stage1 deploy", "docs/deployment/stage1-gate.cjs"],
  ["Stage3-14", "packages/agents/src/stage3-14-gate.cjs"],
  ["Stage3-15", "packages/agents/src/stage3-15-gate.cjs"],
  ["Stage3-16", "packages/agents/src/stage3-16-gate.cjs"],
  ["Stage4-17", "packages/agents/src/stage4-17-gate.cjs"],
  ["Stage4-18", "packages/agents/src/stage4-18-gate.cjs"],
  ["Stage4-19", "packages/agents/src/stage4-19-gate.cjs"],
  ["Stage4-20", "packages/agents/src/stage4-20-gate.cjs"],
  ["Stage4-21", "packages/agents/src/stage4-21-gate.cjs"],
  ["Stage4-22", "docs/deployment/stage4-22-gate.cjs"],
  ["W33", "packages/agents/src/wave33-gate.cjs"],
  ["W34", "packages/agents/src/wave34-gate.cjs"],
  ["W35", "docs/phase-reports/wave35-gate.cjs"],
  ["S70 checklist", "docs/runbooks/checklist-gate.cjs"],
  ["Live engine closed", "services/execution/src/live-engine-gate.cjs"],
  ["Discovery", "services/discovery/src/discovery-gate.cjs"],
  ["Pack", "scripts/pack-check.cjs"],
];

const results = [];
for (const [name, rel] of phases) {
  const r = spawnSync(process.execPath, [path.join(root, rel)], { encoding: "utf8", timeout: 90_000 });
  results.push({
    name,
    rel,
    ok: r.status === 0,
    tail: (r.stdout || r.stderr || "").trim().split("\n").slice(-2).join(" | "),
  });
  console.log(`${r.status === 0 ? "PASS" : "FAIL"} ${name}`);
}

async function realChain() {
  const rpc = process.env.SOLANA_RPC_PRIMARY ?? "https://api.mainnet-beta.solana.com";
  async function call(method, params) {
    try {
      const res = await fetch(rpc, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      });
      const json = await res.json();
      if (!res.ok || json.error) return { availability: "UNAVAILABLE", value: json.error ?? res.status };
      return { availability: "OK", value: json.result };
    } catch (e) {
      return { availability: "UNAVAILABLE", value: String(e) };
    }
  }
  const health = await call("getHealth", []);
  const slot = await call("getSlot", []);
  const { discoverMintUniverse } = await import(path.join(root, "services/discovery/src/discover-mints.mjs"));
  const universe = await discoverMintUniverse({ rpc });
  return { rpc, health, slot, universe };
}

realChain()
  .then((chain) => {
    const fail = results.filter((r) => !r.ok);
    const report = {
      mode: process.env.TRADING_MODE ?? "PAPER",
      live: false,
      gates: { n: results.length, failed: fail.length, rows: results },
      chain,
      blockers: [
        "Section 70 all open",
        "Hostinger compose not running here",
        "No Jupiter key / no paper fill",
        "PRODUCTION_READINESS.md checks packages not in this partial tree",
      ],
    };
    fs.writeFileSync(path.join(root, "docs/phase-reports/PHASE_AUDIT.json"), JSON.stringify(report, null, 2));
    console.log(
      JSON.stringify(
        {
          gatesFailed: fail.length,
          health: chain.health,
          slot: chain.slot,
          mintSource: chain.universe.source,
          mintN: chain.universe.mints.length,
        },
        null,
        2,
      ),
    );
    process.exit(fail.length ? 1 : 0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
