import http from "node:http";
import { validateGatewayCommand } from "./commands.mjs";

const mode = process.env.TRADING_MODE ?? "PAPER";
const port = Number(process.env.PORT ?? 3100);

function send(res, status, body) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

http
  .createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    if (url.pathname === "/health") {
      send(res, 200, { ok: true, service: "control-gateway", tradingMode: mode, live: false });
      return;
    }
    if (url.pathname === "/v1/command" && req.method === "POST") {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      let body = {};
      try {
        body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
      } catch {
        send(res, 400, { ok: false, reason: "invalid_json" });
        return;
      }
      const result = validateGatewayCommand({
        ...body,
        mode,
        apiKey: req.headers["x-api-key"] ?? body.apiKey,
      });
      send(res, result.status, result);
      return;
    }
    send(res, 404, { error: "not_found" });
  })
  .listen(port, "0.0.0.0", () => {
    process.stdout.write(`control-gateway ${port} TRADING_MODE=${mode} not public\n`);
  });
