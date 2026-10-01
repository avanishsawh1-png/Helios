import type { DataReadResponse } from "../api/client.js";
import type { UiAvailability } from "../ui/types.js";

export function mapDataReadToUi<T>(
  res:
    | { ok: true; data: DataReadResponse<T> }
    | { ok: false; error: { error: { message: string } } },
): UiAvailability<T> {
  if (!res.ok) {
    return { status: "error", reason: res.error.error.message };
  }
  const body = res.data;
  const status = (body.status ?? body.availability) as string;
  if (status === "OK" && body.data !== undefined) {
    return { status: "OK", data: body.data, asOf: body.asOf };
  }
  if (status === "EMPTY") {
    return { status: "EMPTY", reason: body.reason ?? "Empty", asOf: body.asOf };
  }
  if (status === "STALE" && body.data !== undefined) {
    return {
      status: "STALE",
      data: body.data,
      asOf: body.asOf,
      staleReason: body.staleReason ?? "Stale",
    };
  }
  if (status === "UNAVAILABLE") {
    return { status: "UNAVAILABLE", reason: body.reason ?? "Unavailable" };
  }
  if (body.data !== undefined && (status === "OK" || !status)) {
    return { status: "OK", data: body.data as T, asOf: body.asOf };
  }
  return {
    status: "UNAVAILABLE",
    reason: body.reason ?? `Unexpected status ${status}`,
  };
}
