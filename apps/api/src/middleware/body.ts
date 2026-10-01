import type { IncomingMessage } from "node:http";
import type { BodyParseResult } from "../types.js";

/**
 * Read and JSON-parse a request body with a hard size limit.
 * Empty body → ok with value undefined (callers decide if required).
 */
export async function readJsonBody(
  req: IncomingMessage,
  maxBytes: number,
): Promise<BodyParseResult> {
  const chunks: Buffer[] = [];
  let total = 0;

  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buf.length;
    if (total > maxBytes) {
      // Drain remaining so the socket can close cleanly.
      req.resume();
      return {
        ok: false,
        code: "BODY_TOO_LARGE",
        message: `Request body exceeds ${maxBytes} bytes.`,
      };
    }
    chunks.push(buf);
  }

  if (total === 0) {
    return { ok: true, value: undefined };
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  try {
    return { ok: true, value: JSON.parse(raw) as unknown };
  } catch {
    return {
      ok: false,
      code: "INVALID_JSON",
      message: "Request body is not valid JSON.",
    };
  }
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
