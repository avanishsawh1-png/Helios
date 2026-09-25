import http from "node:http";

const mode = process.env.TRADING_MODE ?? "PAPER";
const port = Number(process.env.PORT ?? 3100);

http
  .createServer((req, res) => {
    if (req.url === "/health") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true, service: "control-gateway", tradingMode: mode, live: false }));
      return;
    }
    res.writeHead(404);
    res.end();
  })
  .listen(port, "0.0.0.0", () => {
    process.stdout.write(`control-gateway ${port} TRADING_MODE=${mode} not public\n`);
  });
