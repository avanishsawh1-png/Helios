import http from "node:http";
import { ledger, runPaperCycle, readiness, assertPaper } from "../../../workers/pipeline/src/paper-system.mjs";

const mode = assertPaper();
const port = Number(process.env.PORT ?? 3000);

function send(res, status, body) {
  const json = JSON.stringify(body);
  res.writeHead(status, { "content-type": "application/json" });
  res.end(json);
}

function avail(status, extra) {
  return { status, asOf: new Date().toISOString(), ...extra };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://127.0.0.1");
  try {
    if (url.pathname === "/health" || url.pathname === "/v1/health") {
      send(res, 200, { ok: true, tradingMode: mode, live: false, service: "api" });
      return;
    }
    if (url.pathname === "/v1/status") {
      send(res, 200, avail("OK", { data: { tradingMode: mode, live: false } }));
      return;
    }
    if (url.pathname === "/v1/readiness") {
      send(res, 200, avail("OK", { data: readiness() }));
      return;
    }
    if (url.pathname === "/v1/funnel") {
      if (!ledger.cycles.length) {
        send(res, 200, avail("EMPTY", { reason: "no cycles yet" }));
        return;
      }
      send(res, 200, avail("OK", { data: { stages: ledger.cycles.at(-1).stages } }));
      return;
    }
    if (url.pathname === "/v1/positions") {
      if (!ledger.positions.length) {
        send(res, 200, avail("EMPTY", { reason: "no paper positions" }));
        return;
      }
      send(res, 200, avail("OK", { data: ledger.positions }));
      return;
    }
    if (url.pathname === "/v1/pipeline/cycle" && req.method === "POST") {
      const report = await runPaperCycle({ mode });
      send(res, 200, avail("OK", { data: report }));
      return;
    }
    send(res, 404, { error: "not_found" });
  } catch (err) {
    send(res, 500, { error: String(err?.message ?? err) });
  }
});

server.listen(port, "0.0.0.0", () => {
  process.stdout.write(`api listening ${port} TRADING_MODE=${mode}\n`);
});

export { server };
