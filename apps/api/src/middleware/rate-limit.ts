/**
 * Rate limiting (Wave B1).
 *
 * Algorithm: sliding-window counter (preferred over fixed-window).
 * Keying: client IP (from trusted proxy hop only) + route class.
 * Store: RATE_LIMIT_STORE = memory | redis — same public contract.
 *
 * Fail-closed on auth routes when the store is unavailable (429/503).
 * Never multi-key CROSSSLOT Lua. Never pin Redis to a single master IP
 * under Sentinel/Cluster (document connection string / Sentinel endpoints).
 */

import type { IncomingMessage, ServerResponse } from "node:http";

/** Route classes used for limit buckets. */
export type RouteClass = "auth" | "read" | "mutate" | "default" | "health";

export interface RateLimitBucketConfig {
  /** Max requests in the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export interface RateLimitConfig {
  /**
   * Number of trusted reverse-proxy hops in front of this process.
   * Only the leftmost client IP after stripping this many hops from
   * X-Forwarded-For is used. 0 = use socket.remoteAddress only
   * (do not trust X-Forwarded-For).
   */
  trustedProxyHops: number;
  /** Per-class limits. */
  buckets: Record<RouteClass, RateLimitBucketConfig>;
  /**
   * Max distinct keys retained in the memory store (LRU/TTL safety valve).
   * Redis path relies on key TTL instead.
   */
  maxKeys: number;
  /**
   * When the store is down or throws:
   * - auth routes always fail closed (429 or 503)
   * - other routes: if failOpenNonAuth is true, allow; else 503
   */
  failOpenNonAuth: boolean;
}

export const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  trustedProxyHops: 0,
  buckets: {
    // Strictest on auth (login / credential endpoints)
    auth: { limit: 10, windowMs: 60_000 },
    mutate: { limit: 60, windowMs: 60_000 },
    read: { limit: 300, windowMs: 60_000 },
    health: { limit: 600, windowMs: 60_000 },
    default: { limit: 120, windowMs: 60_000 },
  },
  maxKeys: 50_000,
  failOpenNonAuth: false,
};

export interface RateLimitDecision {
  allowed: boolean;
  limit: number;
  remaining: number;
  /** Unix epoch seconds when the window resets. */
  resetEpochSec: number;
  /** Milliseconds the client should wait before retrying (if limited). */
  retryAfterMs: number;
  /** True when the decision was forced by store failure (fail-closed). */
  storeUnavailable?: boolean;
}

export interface RateLimitStore {
  /**
   * Record one hit for key in the given window.
   * Returns current count after the hit and window end timestamp (ms).
   */
  hit(
    key: string,
    windowMs: number,
    nowMs: number,
  ): Promise<{ count: number; windowEndMs: number }>;
  /** Optional health probe. */
  isHealthy?(): Promise<boolean>;
}

/** Classify path → route class for limit selection. */
export function classifyRoute(method: string, path: string): RouteClass {
  if (path === "/health") return "health";
  if (path.startsWith("/v1/auth/")) return "auth";
  if (method === "GET" || method === "HEAD") return "read";
  if (
    method === "POST" ||
    method === "PUT" ||
    method === "PATCH" ||
    method === "DELETE"
  ) {
    return "mutate";
  }
  return "default";
}

/**
 * Resolve client IP.
 * Trust X-Forwarded-For only for the configured number of proxy hops.
 */
export function resolveClientIp(
  req: IncomingMessage,
  trustedProxyHops: number,
): string {
  if (trustedProxyHops > 0) {
    const xff = req.headers["x-forwarded-for"];
    if (typeof xff === "string" && xff.trim()) {
      const parts = xff.split(",").map((p) => p.trim()).filter(Boolean);
      // Rightmost hops are the trusted proxies; client is further left.
      // With N trusted hops, client is at index length - N - 1? Standard:
      // XFF is "client, proxy1, proxy2". If we trust 1 hop, client is parts[0]
      // when the immediate proxy is the last entry we trust.
      // Conservative: take the entry at index (parts.length - trustedProxyHops - 0)
      // i.e. strip the last `trustedProxyHops` entries and take the new last,
      // or if fewer, take the first.
      if (parts.length > trustedProxyHops) {
        const idx = parts.length - trustedProxyHops - 1;
        const candidate = parts[Math.max(0, idx)];
        if (candidate) return candidate;
      } else if (parts.length > 0) {
        return parts[0]!;
      }
    }
  }
  return req.socket.remoteAddress ?? "unknown";
}

// ---------------------------------------------------------------------------
// In-memory sliding-window store
// ---------------------------------------------------------------------------

interface MemoryEntry {
  /** Timestamps (ms) of hits inside the current tracking window. */
  hits: number[];
  /** Last access for crude LRU eviction. */
  lastAccessMs: number;
}

export class MemoryRateLimitStore implements RateLimitStore {
  private readonly map = new Map<string, MemoryEntry>();
  private readonly maxKeys: number;

  constructor(maxKeys: number = DEFAULT_RATE_LIMIT_CONFIG.maxKeys) {
    this.maxKeys = maxKeys;
  }

  async hit(
    key: string,
    windowMs: number,
    nowMs: number,
  ): Promise<{ count: number; windowEndMs: number }> {
    const cutoff = nowMs - windowMs;
    let entry = this.map.get(key);
    if (!entry) {
      this.evictIfNeeded(nowMs);
      entry = { hits: [], lastAccessMs: nowMs };
      this.map.set(key, entry);
    }
    entry.hits = entry.hits.filter((t) => t > cutoff);
    entry.hits.push(nowMs);
    entry.lastAccessMs = nowMs;
    const windowEndMs = (entry.hits[0] ?? nowMs) + windowMs;
    return { count: entry.hits.length, windowEndMs };
  }

  private evictIfNeeded(nowMs: number): void {
    if (this.map.size < this.maxKeys) return;
    // Evict oldest lastAccess first (simple LRU).
    let oldestKey: string | null = null;
    let oldest = Infinity;
    for (const [k, v] of this.map) {
      if (v.lastAccessMs < oldest) {
        oldest = v.lastAccessMs;
        oldestKey = k;
      }
    }
    if (oldestKey) this.map.delete(oldestKey);
    // Also drop entries with no recent hits (idle > 2 min).
    const idleCutoff = nowMs - 120_000;
    for (const [k, v] of this.map) {
      if (v.lastAccessMs < idleCutoff) this.map.delete(k);
    }
  }

  /** Test helper. */
  size(): number {
    return this.map.size;
  }

  clear(): void {
    this.map.clear();
  }
}

/**
 * Redis-backed store using a single-key sorted set (ZSET) per rate-limit key.
 * Score = timestamp. No multi-key CROSSSLOT operations — each key is independent
 * and safe under Redis Cluster slot migration.
 *
 * Connection notes (operator):
 * - Prefer Sentinel endpoints or Cluster-aware client; do not pin to one master IP.
 * - On slot migration, single-key commands retry; never use multi-key Lua.
 * - Pass an already-configured Redis client (ioredis with Sentinel/Cluster options).
 */
export interface RedisLike {
  zremrangebyscore(key: string, min: number | string, max: number | string): Promise<number>;
  zadd(key: string, score: number, member: string): Promise<number>;
  zcard(key: string): Promise<number>;
  zrange(key: string, start: number, stop: number, withScores: "WITHSCORES"): Promise<string[]>;
  pexpire(key: string, ms: number): Promise<number>;
}

export class RedisRateLimitStore implements RateLimitStore {
  constructor(
    private readonly redis: RedisLike,
    private readonly keyPrefix: string = "rl:",
  ) {}

  async hit(
    key: string,
    windowMs: number,
    nowMs: number,
  ): Promise<{ count: number; windowEndMs: number }> {
    const rkey = `${this.keyPrefix}${key}`;
    const cutoff = nowMs - windowMs;
    // Single-key pipeline semantics without MULTI across keys.
    await this.redis.zremrangebyscore(rkey, 0, cutoff);
    const member = `${nowMs}:${Math.random().toString(36).slice(2, 10)}`;
    await this.redis.zadd(rkey, nowMs, member);
    await this.redis.pexpire(rkey, windowMs + 1_000);
    const count = await this.redis.zcard(rkey);
    const oldest = await this.redis.zrange(rkey, 0, 0, "WITHSCORES");
    const oldestScore =
      oldest.length >= 2 ? Number(oldest[1]) : nowMs;
    const windowEndMs = (Number.isFinite(oldestScore) ? oldestScore : nowMs) + windowMs;
    return { count, windowEndMs };
  }

  async isHealthy(): Promise<boolean> {
    try {
      // Lightweight: zcard on a probe key is enough; callers may inject ping.
      await this.redis.zcard(`${this.keyPrefix}__health__`);
      return true;
    } catch {
      return false;
    }
  }
}

export async function checkRateLimit(
  store: RateLimitStore,
  config: RateLimitConfig,
  routeClass: RouteClass,
  clientIp: string,
  nowMs: number = Date.now(),
): Promise<RateLimitDecision> {
  const bucket = config.buckets[routeClass] ?? config.buckets.default;
  const key = `${routeClass}:${clientIp}`;

  try {
    const { count, windowEndMs } = await store.hit(key, bucket.windowMs, nowMs);
    const remaining = Math.max(0, bucket.limit - count);
    const resetEpochSec = Math.ceil(windowEndMs / 1000);
    const allowed = count <= bucket.limit;
    const retryAfterMs = allowed ? 0 : Math.max(0, windowEndMs - nowMs);
    return {
      allowed,
      limit: bucket.limit,
      remaining,
      resetEpochSec,
      retryAfterMs,
    };
  } catch {
    // Store unavailable.
    if (routeClass === "auth" || !config.failOpenNonAuth) {
      return {
        allowed: false,
        limit: bucket.limit,
        remaining: 0,
        resetEpochSec: Math.ceil((nowMs + bucket.windowMs) / 1000),
        retryAfterMs: 1_000,
        storeUnavailable: true,
      };
    }
    // Explicit fail-open for non-auth when configured (not default).
    return {
      allowed: true,
      limit: bucket.limit,
      remaining: bucket.limit,
      resetEpochSec: Math.ceil((nowMs + bucket.windowMs) / 1000),
      retryAfterMs: 0,
      storeUnavailable: true,
    };
  }
}

/** Write standard RateLimit-* and Retry-After headers. */
export function applyRateLimitHeaders(
  res: ServerResponse,
  decision: RateLimitDecision,
): void {
  res.setHeader("RateLimit-Limit", String(decision.limit));
  res.setHeader("RateLimit-Remaining", String(decision.remaining));
  res.setHeader("RateLimit-Reset", String(decision.resetEpochSec));
  if (!decision.allowed) {
    const retrySec = Math.max(1, Math.ceil(decision.retryAfterMs / 1000));
    res.setHeader("Retry-After", String(retrySec));
  }
}

/**
 * Build a 429 (or 503 when store down on auth) HandlerResult-like body.
 */
export function rateLimitResponseBody(
  correlationId: string,
  decision: RateLimitDecision,
): { status: number; body: unknown } {
  const status = decision.storeUnavailable ? 503 : 429;
  const code = decision.storeUnavailable
    ? "RATE_LIMIT_STORE_UNAVAILABLE"
    : "RATE_LIMITED";
  const message = decision.storeUnavailable
    ? "Rate-limit store unavailable; request rejected (fail-closed)."
    : "Too many requests. Retry after the period indicated by Retry-After.";
  return {
    status,
    body: {
      error: {
        code,
        message,
        correlationId,
        limit: decision.limit,
        reset: decision.resetEpochSec,
      },
    },
  };
}
