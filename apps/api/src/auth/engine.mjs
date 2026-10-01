export class AuthEngine {
  constructor(sessions = new Map()) {
    this.sessions = sessions;
  }

  seed(token, user) {
    this.sessions.set(token, user);
    return token;
  }

  issue(user) {
    const token = `paper.${user.id}.${user.role}.${Date.now().toString(36)}`;
    this.sessions.set(token, user);
    return token;
  }

  verify(authorization) {
    if (!authorization) return { ok: false, status: 401, reason: "missing_session" };
    const token = String(authorization).replace(/^Bearer\s+/i, "").trim();
    if (!token) return { ok: false, status: 401, reason: "missing_session" };
    if (/live/i.test(token)) return { ok: false, status: 403, reason: "live_token_refused" };
    const user = this.sessions.get(token);
    if (!user) return { ok: false, status: 401, reason: "unknown_session" };
    return { ok: true, user };
  }

  requireRole(authorization, roles) {
    const v = this.verify(authorization);
    if (!v.ok) return v;
    if (!roles.includes(v.user.role)) return { ok: false, status: 403, reason: "rbac_denied" };
    return v;
  }
}

export const defaultAuthEngine = new AuthEngine();
