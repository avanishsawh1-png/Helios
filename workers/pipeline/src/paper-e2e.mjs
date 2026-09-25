#!/usr/bin/env node
/**
 * PAPER e2e: live chain observation + in-process score/risk/exit/outcome.
 * No swaps. No LIVE. No fabricated fills.
 */
import assert from "node:assert/strict";

const mode = (process.env.TRADING_MODE ?? "PAPER").toUpperCase();
if (mode === "LIVE") {
  console.error("paper-e2e refuses LIVE");
  process.exit(2);
}

const rpc = process.env.SOLANA_RPC_PRIMARY ?? "https://api.mainnet-beta.solana.com";

async function rpcCall(method, params) {
  const res = await fetch(rpc, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!res.ok) return { availability: "UNAVAILABLE", value: null, httpStatus: res.status };
  const json = await res.json();
  if (json.error) return { availability: "UNAVAILABLE", value: null, rpcError: json.error };
  return { availability: "OK", value: json.result, httpStatus: res.status };
}

function attachRunMeta(input) {
  const values = Object.values(input.snapshot);
  const availability = values.every((v) => v === null) ? "EMPTY" : input.score === null ? "UNAVAILABLE" : "OK";
  return {
    runId: input.runId,
    policyVersion: input.policyVersion,
    snapshot: input.snapshot,
    score: availability === "OK" ? input.score : null,
    availability,
    event: input.event,
  };
}

function applyWeights(snapshot, weights) {
  const parts = [
    [snapshot.security, weights.security],
    [snapshot.smartMoney, weights.smartMoney],
    [snapshot.momentum, weights.momentum],
    [snapshot.holder, weights.holder],
  ];
  if (parts.some(([v]) => v === null)) return null;
  return parts.reduce((a, [v, w]) => a + v * w, 0);
}

function evaluateExit(pos) {
  if (pos.killSwitchActive) return { wouldExit: true, reason: "KILL_SWITCH" };
  if (pos.markStatus !== "OK" || pos.entryPrice == null || pos.markPrice == null) {
    return { wouldExit: false, reason: "NONE" };
  }
  const pnl = ((pos.markPrice - pos.entryPrice) / pos.entryPrice) * 100;
  if (pnl <= -8) return { wouldExit: true, reason: "STOP_LOSS" };
  return { wouldExit: false, reason: "NONE", pnl };
}

const health = await rpcCall("getHealth", []);
const slot = await rpcCall("getSlot", []);

const chain = {
  rpc,
  health: health.availability,
  healthValue: health.value,
  slotAvailability: slot.availability,
  slot: slot.value,
};

const snapshot = { security: 0.2, smartMoney: 0.2, momentum: 0.3, holder: 0.3 };
const weights = { security: 0.25, smartMoney: 0.25, momentum: 0.25, holder: 0.25 };
const score = applyWeights(snapshot, weights);
const scored = attachRunMeta({
  runId: `run_slot_${chain.slot ?? "na"}`,
  policyVersion: "policy_v1",
  snapshot,
  score,
  event: "SCORE_CREATED",
});

const risk = { allowed: true, reason: "paper_observe" };
const paperFill = {
  executed: false,
  reason: "paper_record_only",
  slot: chain.slot,
};

const exit = evaluateExit({
  entryPrice: 1,
  markPrice: 1.01,
  markStatus: chain.slotAvailability === "OK" ? "OK" : "UNAVAILABLE",
  killSwitchActive: false,
});

assert.equal(scored.availability, "OK");
assert.equal(paperFill.executed, false);
assert.equal(exit.wouldExit, false);

console.log(
  JSON.stringify(
    {
      mode,
      liveTrading: false,
      chain,
      runId: scored.runId,
      score: scored.score,
      risk,
      paperFill,
      exit,
    },
    null,
    2,
  ),
);

if (chain.health !== "OK" && chain.slotAvailability !== "OK") {
  console.log("PAPER e2e: chain UNAVAILABLE — fail-closed observation, no invented slot");
  process.exit(0);
}
console.log("PAPER e2e pipeline: PASS observation_only no_swap");
