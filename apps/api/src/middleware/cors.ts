/**
 * Explicit CORS allowlist middleware (Wave B1).
 *
 * Origins are never `*`. Dashboard origin is added via ApiConfig.cors.allowedOrigins
 * (env/config at process start). Preflight (OPTIONS) is answered here; actual
 * responses get Access-Control-* headers when the request Origin is allowed.
 */

import type { IncomingMessage, ServerResponse } from "node:http";

export interface CorsConfig {
  /**
   * Exact origin strings allowed (e.g. "http://localhost:5173",
   * "https://ops.example.com"). Empty list = no CORS headers (same-origin only).
   * Never use "*".
   */
  allowedOrigins: string[];
  /** Methods advertised on preflight. */
  allowedMethods: string[];
  /** Request headers advertised on preflight. */
  allowedHeaders: string[];
  /** Whether Access-Control-Allow-Credentials is set. */
  allowCredentials: boolean;
  /** Access-Control-Max-Age seconds for preflight cache. */
  maxAgeSeconds: number;
}

export const DEFAULT_CORS_CONFIG: CorsConfig = {
  allowedOrigins: [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ],
  allowedMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Correlation-Id",
    "X-Requested-With",
  ],
  allowCredentials: true,
  maxAgeSeconds: 600,
};

function isOriginAllowed(origin: string | undefined, allowed: string[]): string | null {
  if (!origin || allowed.length === 0) return null;
  // Exact match only — no wildcard suffix matching (avoids subdomain surprises).
  return allowed.includes(origin) ? origin : null;
}

/**
 * Apply CORS headers if Origin is on the allowlist.
 * Returns true when the request was a handled preflight (caller should end the response).
 */
export function applyCors(
  req: IncomingMessage,
  res: ServerResponse,
  config: CorsConfig,
): { handledPreflight: boolean } {
  const originHeader = req.headers.origin;
  const origin =
    typeof originHeader === "string" ? originHeader : undefined;
  const allowed = isOriginAllowed(origin, config.allowedOrigins);

  if (allowed) {
    res.setHeader("Access-Control-Allow-Origin", allowed);
    res.setHeader("Vary", "Origin");
    if (config.allowCredentials) {
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }
    res.setHeader(
      "Access-Control-Expose-Headers",
      "X-Correlation-Id, X-Authorization-Boundary, Retry-After, RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset",
    );
  }

  if ((req.method ?? "").toUpperCase() === "OPTIONS") {
    if (allowed) {
      res.setHeader(
        "Access-Control-Allow-Methods",
        config.allowedMethods.join(", "),
      );
      res.setHeader(
        "Access-Control-Allow-Headers",
        config.allowedHeaders.join(", "),
      );
      res.setHeader("Access-Control-Max-Age", String(config.maxAgeSeconds));
      res.writeHead(204);
      res.end();
      return { handledPreflight: true };
    }
    // Disallowed origin on preflight: no CORS headers, 403.
    res.writeHead(403, { "Content-Type": "application/json; charset=utf-8" });
    res.end(
      JSON.stringify({
        error: {
          code: "CORS_ORIGIN_DENIED",
          message: "Origin is not on the CORS allowlist.",
        },
      }),
    );
    return { handledPreflight: true };
  }

  return { handledPreflight: false };
}
