/**
 * Wave D4 — independent panel polling.
 * - Pauses while document.hidden
 * - Backs off on errors
 * - One panel failure does not affect others
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { DataReadResponse } from "../api/client.js";
import type { UiAvailability } from "../ui/types.js";
import { mapDataReadToUi } from "./mapDataRead.js";

export { mapDataReadToUi } from "./mapDataRead.js";

const BASE_MS = 8_000;
const MAX_BACKOFF_MS = 60_000;

export function usePolledAvailability<T>(
  fetcher: () => Promise<
    | { ok: true; data: DataReadResponse<T> }
    | { ok: false; error: { error: { message: string } } }
  >,
  opts?: { intervalMs?: number; enabled?: boolean },
): UiAvailability<T> {
  const intervalMs = opts?.intervalMs ?? BASE_MS;
  const enabled = opts?.enabled !== false;
  const [state, setState] = useState<UiAvailability<T>>({ status: "loading" });
  const backoffRef = useRef(intervalMs);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const tick = useCallback(async () => {
    if (typeof document !== "undefined" && document.hidden) return;
    try {
      const res = await fetcherRef.current();
      setState(mapDataReadToUi(res));
      if (res.ok) backoffRef.current = intervalMs;
      else backoffRef.current = Math.min(MAX_BACKOFF_MS, backoffRef.current * 2);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setState({ status: "error", reason: message });
      backoffRef.current = Math.min(MAX_BACKOFF_MS, backoffRef.current * 2);
    }
  }, [intervalMs]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const loop = async () => {
      if (cancelled) return;
      await tick();
      if (cancelled) return;
      timer = setTimeout(loop, backoffRef.current);
    };

    void loop();

    const onVis = () => {
      if (!document.hidden) void tick();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [enabled, tick]);

  return state;
}
