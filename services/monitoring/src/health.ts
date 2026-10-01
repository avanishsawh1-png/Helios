export class MetricsRegistry {
  constructor() {
    this.counters = new Map();
  }
  inc(name, by = 1) {
    this.counters.set(name, (this.counters.get(name) ?? 0) + by);
  }
  text() {
    return [...this.counters.entries()].map(([k, v]) => `${k} ${v}`).join("\n");
  }
}

export function createLogger(opts = {}) {
  const sink = opts.sink ?? ((line) => process.stdout.write(line + "\n"));
  return {
    info(msg, fields = {}) {
      const safe = { ...fields };
      for (const k of Object.keys(safe)) {
        if (/key|secret|password|seed/i.test(k)) safe[k] = "[redacted]";
      }
      sink(JSON.stringify({ level: "info", msg, ...safe }));
    },
  };
}

export function productionGate() {
  return { verified: false, live: false, reason: "section70_closed" };
}
