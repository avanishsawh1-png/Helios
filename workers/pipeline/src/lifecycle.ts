/**
 * Wave O1 — workers/pipeline drain adapter.
 * Finish current PAPER cycle, then stop. LIVE still refused by paper-mode.ts.
 */

import { assertPaperMode } from "./paper-mode.js";
import {
  DEFAULT_O1_OPTIONS,
  ProcessLifecycle,
  type ShutdownHooks,
} from "../../../packages/runtime/src/graceful-shutdown.js";

export interface PipelineDrainState {
  cycleInFlight: boolean;
  paused: boolean;
}

export function createPipelineLifecycle(
  state: PipelineDrainState,
  hooks?: Partial<ShutdownHooks>,
): ProcessLifecycle {
  assertPaperMode();
  const impl: ShutdownHooks = {
    stopAccepting: () => {
      state.paused = true;
    },
    drainInFlight: async () => {
      while (state.cycleInFlight) {
        await new Promise((r) => setTimeout(r, 5));
      }
    },
    ...hooks,
  };
  return new ProcessLifecycle(impl, DEFAULT_O1_OPTIONS);
}
