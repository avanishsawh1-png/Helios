/**
 * Security response headers (Wave B1).
 * Applied on every response. HSTS only when TLS is known present (config flag).
 */

import type { ServerResponse } from "node:http";

export interface SecurityHeadersConfig {
  /**
   * Content-Security-Policy value. Default is strict for a JSON API
   * (no scripts/frames from the API itself).
   */
  contentSecurityPolicy: string;
  /** X-Frame-Options. */
  xFrameOptions: "DENY" | "SAMEORIGIN";
  /** Referrer-Policy. */
  referrerPolicy: string;
  /**
   * When true, emit Strict-Transport-Security.
   * Set true only behind TLS termination (see deployment-topology.md).
   */
  enableHsts: boolean;
  /** HSTS max-age seconds (default 1 year). */
  hstsMaxAgeSeconds: number;
  /** Include subdomains in HSTS. */
  hstsIncludeSubDomains: boolean;
}

export const DEFAULT_SECURITY_HEADERS_CONFIG: SecurityHeadersConfig = {
  contentSecurityPolicy:
    "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
  xFrameOptions: "DENY",
  referrerPolicy: "no-referrer",
  enableHsts: false,
  hstsMaxAgeSeconds: 31_536_000,
  hstsIncludeSubDomains: true,
};

export function applySecurityHeaders(
  res: ServerResponse,
  config: SecurityHeadersConfig,
): void {
  res.setHeader("Content-Security-Policy", config.contentSecurityPolicy);
  res.setHeader("X-Frame-Options", config.xFrameOptions);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", config.referrerPolicy);
  // API responses should not be cached by shared caches by default.
  res.setHeader("Cache-Control", "no-store");
  if (config.enableHsts) {
    let hsts = `max-age=${config.hstsMaxAgeSeconds}`;
    if (config.hstsIncludeSubDomains) {
      hsts += "; includeSubDomains";
    }
    res.setHeader("Strict-Transport-Security", hsts);
  }
}
