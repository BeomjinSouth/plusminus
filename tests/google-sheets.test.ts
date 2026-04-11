import { describe, expect, it } from "vitest";

import { buildHeaderRange } from "../src/lib/sheets/a1-range";

describe("google sheets helpers", () => {
  it("builds a valid A1 header range for a single column", () => {
    expect(buildHeaderRange("sessions", 1)).toBe("sessions!A1:A1");
  });

  it("builds a valid A1 header range for multiple columns", () => {
    expect(buildHeaderRange("attempt_events", 7)).toBe("attempt_events!A1:G1");
    expect(buildHeaderRange("set_results", 27)).toBe("set_results!A1:AA1");
  });
});
