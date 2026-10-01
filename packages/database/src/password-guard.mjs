const FORBIDDEN = [
  "change_me",
  "change_me_in_production",
  "helios",
  "helios_ci",
  "password",
  "postgres",
];

export function assertDatabasePasswordRotated(databaseUrl, env = process.env) {
  if (!databaseUrl) {
    if ((env.NODE_ENV ?? "production") === "test" || env.ALLOW_MISSING_DATABASE_URL === "1") {
      return { ok: true, skipped: true };
    }
    throw new Error("DATABASE_URL missing");
  }
  const nodeEnv = env.NODE_ENV ?? "production";
  if (nodeEnv === "test" || nodeEnv === "development") return { ok: true, skipped: true };
  let password = "";
  try {
    password = decodeURIComponent(new URL(databaseUrl).password || "");
  } catch {
    throw new Error("DATABASE_URL unparseable");
  }
  if (!password || FORBIDDEN.includes(password)) {
    throw new Error("DATABASE password is a published placeholder — rotate helios_app before boot");
  }
  return { ok: true, skipped: false };
}
