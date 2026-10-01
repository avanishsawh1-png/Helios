/**
 * Wave O1 — apps/api drain adapter.
 * Wire server.close + in-flight request counter at boot. Not 24/7 claim.
 */

import {
  DEFAULT_O1_OPTIONS,
  ProcessLifecycle,
  type ShutdownHooks,
} from "../../../packages/runtime/src/graceful-shutdown.js";

export interface HttpDrainState {
  inFlight: number;
  closed: boolean;
}

export function createApiLifecycle(
  state: HttpDrainState,
  hooks?: Partial<ShutdownHooks>,
): ProcessLifecycle {
  const impl: ShutdownHooks = {
    stopAccepting: () => {
      state.closed = true;
    },
    drainInFlight: async () => {
      while (state.inFlight > 0) {
        await new Promise((r) => setTimeout(r, 5));
      }
    },
    ...hooks,
  };
  return new ProcessLifecycle(impl, DEFAULT_O1_OPTIONS);
}
