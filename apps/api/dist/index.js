import http from "node:http";

const mode = process.env.TRADING_MODE ?? "PAPER";
const port = Number(process.env.PORT ?? 3000);

const server = http.createServer((req, res) => {
  if (req.url === "/health" || req.url === "/v1/health") {
    const body = JSON.stringify({
      ok: true,
      tradingMode: mode,
      live: false,
      service: "api",
    });
    res.writeHead(200, { "content-type": "application/json" });
    res.end(body);
    return;
  }
  res.writeHead(404);
  res.end();
});

server.listen(port, "0.0.0.0", () => {
  process.stdout.write(`api listening ${port} TRADING_MODE=${mode}\n`);
});
