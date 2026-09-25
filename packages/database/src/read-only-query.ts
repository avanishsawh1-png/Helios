/**
 * Wave 8B — read-only SQL guard.
 *
 * Rejects any statement containing a write verb before it reaches the pool.
 * This is a defense-in-depth layer on top of a SELECT-only DB role.
 */

import type { Pool, QueryResult, QueryResultRow } from "pg";

const WRITE_VERB =
  /\b(INSERT|UPDATE|DELETE|UPSERT|MERGE|TRUNCATE|ALTER|DROP|CREATE|GRANT|REVOKE|COPY|CALL|DO)\b/i;

export class ReadOnlyQueryError extends Error {
  readonly code = "READ_ONLY_QUERY_REJECTED" as const;

  constructor(message: string) {
    super(message);
    this.name = "ReadOnlyQueryError";
  }
}

/**
 * Execute a SQL statement only if it does not contain a write verb.
 * Always prefer parameterized queries ($1, $2, …).
 */
export async function readOnlyQuery<T extends QueryResultRow = QueryResultRow>(
  pool: Pool,
  text: string,
  params: unknown[] = [],
): Promise<QueryResult<T>> {
  if (WRITE_VERB.test(text)) {
    throw new ReadOnlyQueryError(
      `readOnlyQuery rejected statement containing a write verb: ${text.slice(0, 80)}`,
    );
  }
  // Extra safety: only allow SELECT / WITH … SELECT
  const trimmed = text.trim().replace(/^\(/, "");
  if (!/^(SELECT|WITH)\b/i.test(trimmed)) {
    throw new ReadOnlyQueryError(
      `readOnlyQuery only allows SELECT/WITH statements, got: ${text.slice(0, 40)}`,
    );
  }
  return pool.query<T>(text, params);
}

export function statementLooksLikeWrite(sql: string): boolean {
  return WRITE_VERB.test(sql);
}
