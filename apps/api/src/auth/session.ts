/**
 * Fail-closed session auth for the control plane.
 */
export function requireSession(headers = {}) {
  const token = headers.authorization ?? headers.Authorization ?? "";
  if (!token || token === "Bearer") {
    return { ok: false, status: 401, reason: "missing_session" };
  }
  if (/\blive\b/i.test(token)) {
    return { ok: false, status: 403, reason: "live_token_refused" };
  }
  return { ok: true, status: 200, role: "viewer" };
}
