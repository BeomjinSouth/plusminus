import { describe, expect, it } from "vitest";

import {
  getDeliveryAction,
  parseSignedSegment,
  splitExpressionIntoTerms,
} from "../src/lib/expression";
import { rationalToString } from "../src/lib/rational";

describe("expression helpers", () => {
  it("splits nested signed expressions into raw terms", () => {
    expect(splitExpressionIntoTerms("-(+3)-(-5)+7")).toEqual([
      "-(+3)",
      "-(-5)",
      "+7",
    ]);
  });

  it("normalizes nested signs correctly", () => {
    expect(rationalToString(parseSignedSegment("-(+3/4)").value)).toBe("-3/4");
    expect(rationalToString(parseSignedSegment("-(-5/4)").value)).toBe("5/4");
  });

  it("maps postman action types from raw segments", () => {
    expect(getDeliveryAction("-(-5)")).toBe("penalty-out");
    expect(getDeliveryAction("+(+3)")).toBe("reward-in");
    expect(getDeliveryAction("-(+2)")).toBe("reward-out");
  });
});
