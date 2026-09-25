import { describe, expect, it } from "vitest";
import { mapDataReadToUi } from "../mapDataRead.js";

describe("Wave D4 mapDataReadToUi", () => {
  it("maps OK with data", () => {
    const ui = mapDataReadToUi({
      ok: true,
      data: {
        availability: "OK",
        status: "OK",
        data: { n: 1 },
        asOf: "t",
        correlationId: "c",
      },
    });
    expect(ui.status).toBe("OK");
    if (ui.status === "OK") expect(ui.data.n).toBe(1);
  });

  it("maps EMPTY", () => {
    const ui = mapDataReadToUi({
      ok: true,
      data: {
        availability: "EMPTY",
        status: "EMPTY",
        reason: "none",
        asOf: "t",
        correlationId: "c",
      },
    });
    expect(ui.status).toBe("EMPTY");
  });

  it("maps UNAVAILABLE", () => {
    const ui = mapDataReadToUi({
      ok: true,
      data: {
        availability: "UNAVAILABLE",
        status: "UNAVAILABLE",
        reason: "down",
        correlationId: "c",
      },
    });
    expect(ui.status).toBe("UNAVAILABLE");
  });

  it("maps STALE", () => {
    const ui = mapDataReadToUi({
      ok: true,
      data: {
        availability: "STALE",
        status: "STALE",
        data: { n: 2 },
        asOf: "t",
        staleReason: "old",
        correlationId: "c",
      },
    });
    expect(ui.status).toBe("STALE");
  });

  it("maps transport error", () => {
    const ui = mapDataReadToUi({
      ok: false,
      error: { error: { message: "network" } },
    });
    expect(ui.status).toBe("error");
  });
});

describe("Wave D4 design-preview flag", () => {
  it("production default excludes fixture mode", () => {
    expect(process.env.VITE_HELIOS_DESIGN_PREVIEW === "1").toBe(false);
  });
});
