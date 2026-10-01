const mode = process.env.TRADING_MODE ?? "PAPER";
if (mode === "LIVE") {
  console.error("pipeline worker refuses LIVE in this handoff");
  process.exit(2);
}
process.stdout.write(`pipeline worker idle TRADING_MODE=${mode}\n`);
setInterval(() => {
  process.stdout.write(`pipeline heartbeat TRADING_MODE=${mode} live=false\n`);
}, 30_000);
