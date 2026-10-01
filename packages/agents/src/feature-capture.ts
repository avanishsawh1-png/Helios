/**
 * Wave 10 — Feature capture / instrumentation.
 * Fail-open: hook throws must not change the captured pipeline value.
 * No writes to RiskPort, orders, or positions.
 */

export type FeatureAvailability = "OK" | "EMPTY" | "UNAVAILABLE" | "STALE";

export interface FeatureEvent {
  name: string;
  value: number | string | boolean | null;
  availability: FeatureAvailability;
  at: string;
  source: string;
}

export class FeatureCapture {
  readonly events: FeatureEvent[] = [];
  hookErrors = 0;

  /**
   * Run producer; on throw, record UNAVAILABLE and return original `passthrough`.
   */
  observe<T>(
    name: string,
    source: string,
    passthrough: T,
    producer: () => { value: FeatureEvent["value"]; availability: FeatureAvailability },
    at = new Date().toISOString(),
  ): T {
    try {
      const produced = producer();
      this.events.push({
        name,
        value: produced.availability === "OK" ? produced.value : null,
        availability: produced.availability,
        at,
        source,
      });
    } catch {
      this.hookErrors += 1;
      this.events.push({
        name,
        value: null,
        availability: "UNAVAILABLE",
        at,
        source,
      });
    }
    return passthrough;
  }

  snapshot(name: string): FeatureEvent | null {
    for (let i = this.events.length - 1; i >= 0; i -= 1) {
      if (this.events[i].name === name) return this.events[i];
    }
    return null;
  }
}
