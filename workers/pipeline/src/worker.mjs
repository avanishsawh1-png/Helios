import { assertPaper, runPaperCycle } from "./paper-system.mjs";

const mode = assertPaper();
process.stdout.write(`pipeline worker start TRADING_MODE=${mode}\n`);

if (process.env.PIPELINE_RUN_ON_START === "1") {
  const report = await runPaperCycle({ mode });
  process.stdout.write(`pipeline cycle ${report.cycleId} status=${report.status} slot=${report.slot}\n`);
}

setInterval(() => {
  process.stdout.write(`pipeline heartbeat TRADING_MODE=${mode} live=false cycles=${process.env.KEEPALIVE ?? "1"}\n`);
}, 30_000);
