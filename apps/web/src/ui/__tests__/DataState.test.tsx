import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DataState } from "../DataState.js";
import { formatUnknown, normalizeMode } from "../types.js";
import { ChartFrame } from "../ChartFrame.js";
import { MetricTile } from "../MetricTile.js";

describe("Wave D2 DataState", () => {
  it("renders loading", () => {
    render(
      <DataState state={{ status: "loading" }}>{() => <span>data</span>}</DataState>,
    );
    expect(screen.getByText(/Loading/)).toBeTruthy();
    expect(screen.queryByText("data")).toBeNull();
  });

  it("renders EMPTY distinct from data", () => {
    render(
      <DataState state={{ status: "EMPTY", reason: "No rows" }}>{() => <span>data</span>}</DataState>,
    );
    expect(screen.getByText(/No rows/)).toBeTruthy();
    expect(screen.getByText("EMPTY")).toBeTruthy();
  });

  it("renders UNAVAILABLE distinct from EMPTY", () => {
    render(
      <DataState state={{ status: "UNAVAILABLE", reason: "DB down" }}>
        {() => <span>data</span>}
      </DataState>,
    );
    expect(screen.getByText(/DB down/)).toBeTruthy();
    expect(screen.getByText("UNAVAILABLE")).toBeTruthy();
  });

  it("renders OK children", () => {
    render(
      <DataState state={{ status: "OK", data: { n: 1 }, asOf: "2026-01-01T00:00:00Z" }}>
        {(d) => <span>value-{d.n}</span>}
      </DataState>,
    );
    expect(screen.getByText("value-1")).toBeTruthy();
  });

  it("renders STALE with banner and children", () => {
    render(
      <DataState
        state={{
          status: "STALE",
          data: { n: 2 },
          asOf: "2026-01-01T00:00:00Z",
          staleReason: "older than 120s",
        }}
      >
        {(d) => <span>value-{d.n}</span>}
      </DataState>,
    );
    expect(screen.getByText(/older than 120s/)).toBeTruthy();
    expect(screen.getByText("value-2")).toBeTruthy();
  });

  it("renders error", () => {
    render(
      <DataState state={{ status: "error", reason: "boom" }}>{() => <span>x</span>}</DataState>,
    );
    expect(screen.getByRole("alert")).toBeTruthy();
  });
});

describe("Wave D2 formatUnknown / mode", () => {
  it("null becomes em dash not zero", () => {
    expect(formatUnknown(null)).toBe("—");
    expect(formatUnknown(undefined)).toBe("—");
    expect(formatUnknown(0)).toBe("0");
  });

  it("normalizeMode", () => {
    expect(normalizeMode("LIVE")).toBe("LIVE");
    expect(normalizeMode(null)).toBe("STOPPED");
  });
});

describe("Wave D2 MetricTile", () => {
  it("shows em dash for null", () => {
    render(<MetricTile label="Equity" value={null} />);
    expect(screen.getByText("—")).toBeTruthy();
  });
});

describe("Wave D2 ChartFrame", () => {
  it("does not treat null as zero — breaks path into gaps", () => {
    const { container } = render(
      <ChartFrame values={[1, null, 3, 4]} label="test series" />,
    );
    const path = container.querySelector("path");
    expect(path).toBeTruthy();
    // Multiple M commands indicate a gap (null not drawn as 0)
    const d = path!.getAttribute("d") ?? "";
    expect(d.startsWith("M")).toBe(true);
  });
});
