/**
 * Wave D3 — additive read-model handlers.
 * Pass DataAvailability discriminant through untouched.
 * Default: UNAVAILABLE with specific reason when source method missing.
 */

import type { ControlPlaneDataSource } from "../data/types.js";
import type { HandlerResult } from "../types.js";

function wrapAvailability(
  correlationId: string,
  availability: { status: string; [k: string]: unknown },
): HandlerResult {
  return {
    status: 200,
    body: {
      ...availability,
      correlationId,
    },
  };
}

async function fromOptional<T>(
  correlationId: string,
  fn: (() => Promise<T>) | undefined,
  missingReason: string,
): Promise<HandlerResult> {
  if (!fn) {
    return wrapAvailability(correlationId, {
      status: "UNAVAILABLE",
      reason: missingReason,
    });
  }
  try {
    const availability = await fn();
    return wrapAvailability(correlationId, availability as { status: string });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return wrapAvailability(correlationId, {
      status: "UNAVAILABLE",
      reason: message,
    });
  }
}

export async function handleHealthSnapshot(
  data: ControlPlaneDataSource | null,
  correlationId: string,
): Promise<HandlerResult> {
  return fromOptional(
    correlationId,
    data?.getHealthSnapshot
      ? () => data.getHealthSnapshot!(correlationId)
      : undefined,
    "Health snapshot source not configured on this API instance.",
  );
}

export async function handleRiskState(
  data: ControlPlaneDataSource | null,
  correlationId: string,
): Promise<HandlerResult> {
  return fromOptional(
    correlationId,
    data?.getRiskState ? () => data.getRiskState!(correlationId) : undefined,
    "Risk state source not configured on this API instance.",
  );
}

export async function handlePipelineFunnel(
  data: ControlPlaneDataSource | null,
  correlationId: string,
): Promise<HandlerResult> {
  return fromOptional(
    correlationId,
    data?.getPipelineFunnel
      ? () => data.getPipelineFunnel!(correlationId)
      : undefined,
    "Pipeline funnel source not configured on this API instance.",
  );
}

export async function handlePortfolioSeries(
  data: ControlPlaneDataSource | null,
  correlationId: string,
): Promise<HandlerResult> {
  return fromOptional(
    correlationId,
    data?.getPortfolioSeries
      ? () => data.getPortfolioSeries!(correlationId)
      : undefined,
    "Portfolio series source not configured on this API instance.",
  );
}

export async function handleRecentEvents(
  data: ControlPlaneDataSource | null,
  correlationId: string,
  cursor?: string,
): Promise<HandlerResult> {
  return fromOptional(
    correlationId,
    data?.getRecentEvents
      ? () => data.getRecentEvents!(correlationId, cursor)
      : undefined,
    "Events feed source not configured on this API instance.",
  );
}

export async function handleReadiness(
  data: ControlPlaneDataSource | null,
  correlationId: string,
): Promise<HandlerResult> {
  return fromOptional(
    correlationId,
    data?.getReadiness ? () => data.getReadiness!(correlationId) : undefined,
    "Production readiness source not configured on this API instance.",
  );
}
