/**
 * AuthEngine — control-plane sessions. No LIVE tokens. No wallet keys.
 */

export type Role = "viewer" | "operator" | "admin";

export interface AuthUser {
  id: string;
  role: Role;
}

export class AuthEngine {
  constructor(private readonly sessions = new Map()) {}

  seed(token: string, user: AuthUser): string {
    this.sessions.set(token, user);
    return token;
  }

  issue(user: AuthUser): string {
    const token = `paper.${user.id}.${user.role}.${Date.now().toString(36)}`;
    this.sessions.set(token, user);
    return token;
  }

  verify(authorization: string | undefined | null): { ok: true; user: AuthUser } | { ok: false; status: number; reason: string } {
    if (!authorization) return { ok: false, status: 401, reason: "missing_session" };
    const token = authorization.replace(/^Bearer\s+/i, "").trim();
    if (!token) return { ok: false, status: 401, reason: "missing_session" };
    if (/live/i.test(token)) return { ok: false, status: 403, reason: "live_token_refused" };
    const user = this.sessions.get(token);
    if (!user) return { ok: false, status: 401, reason: "unknown_session" };
    return { ok: true, user };
  }

  requireRole(authorization: string | undefined | null, roles: Role[]) {
    const v = this.verify(authorization);
    if (!v.ok) return v;
    if (!roles.includes(v.user.role)) return { ok: false, status: 403, reason: "rbac_denied" };
    return v;
  }
}

export const defaultAuthEngine = new AuthEngine();
