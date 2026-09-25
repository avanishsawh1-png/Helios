const assert = require("node:assert/strict");

class ResourceGuard {
  constructor(bounds, now, random = () => 0.5) {
    this.bounds = bounds;
    this.now = now;
    this.random = random;
    this.sockets = 0;
    this.reconnectAt = [];
    this.lastMessageAt = null;
    this.closed = false;
  }
  openSocket() {
    if (this.closed) return false;
    if (this.sockets >= this.bounds.maxWsSockets) return false;
    this.sockets += 1;
    this.lastMessageAt = this.now();
    return true;
  }
  closeSocket() {
    this.sockets = Math.max(0, this.sockets - 1);
  }
  noteMessage() {
    this.lastMessageAt = this.now();
  }
  idleStalled() {
    if (this.lastMessageAt === null) return false;
    return this.now() - this.lastMessageAt >= this.bounds.idleWatchdogMs;
  }
  canReconnect() {
    if (this.closed) return false;
    const t = this.now();
    const start = t - this.bounds.reconnectWindowMs;
    this.reconnectAt = this.reconnectAt.filter((ts) => ts >= start);
    return this.reconnectAt.length < this.bounds.maxReconnectsPerWindow;
  }
  nextReconnectDelayMs(attempt) {
    if (!this.canReconnect()) return null;
    this.reconnectAt.push(this.now());
    const exp = Math.min(this.bounds.reconnectCapMs, this.bounds.reconnectBaseMs * 2 ** Math.max(0, attempt - 1));
    const jitter = exp * this.bounds.jitterRatio * (this.random() * 2 - 1);
    return Math.max(0, Math.round(exp + jitter));
  }
  shutdown() {
    this.closed = true;
    this.sockets = 0;
  }
}

let t = 0;
const g = new ResourceGuard(
  {
    maxWsSockets: 2,
    maxReconnectsPerWindow: 3,
    reconnectWindowMs: 1000,
    reconnectBaseMs: 100,
    reconnectCapMs: 800,
    jitterRatio: 0.25,
    idleWatchdogMs: 50,
  },
  () => t,
);

assert.equal(g.openSocket(), true);
assert.equal(g.openSocket(), true);
assert.equal(g.openSocket(), false);
g.closeSocket();
assert.equal(g.openSocket(), true);

t = 60;
assert.equal(g.idleStalled(), true);
g.noteMessage();
assert.equal(g.idleStalled(), false);

assert.ok(g.nextReconnectDelayMs(1) >= 75 && g.nextReconnectDelayMs(1) <= 125);
assert.equal(typeof g.nextReconnectDelayMs(1), "number");
assert.equal(g.nextReconnectDelayMs(1), null);

t = 2000;
const d = g.nextReconnectDelayMs(8);
assert.ok(d !== null && d <= 800 * 1.25);

g.shutdown();
assert.equal(g.openSocket(), false);
assert.equal(g.nextReconnectDelayMs(1), null);
assert.equal(g.sockets, 0);

console.log("O4 resource bounds + WS reconnect unit checks: PASS");
