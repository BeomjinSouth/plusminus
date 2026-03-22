import { describe, expect, it } from "vitest";

import {
  addRational,
  equalsRational,
  parseRational,
  rationalToString,
  subRational,
} from "../src/lib/rational";

describe("rational engine", () => {
  it("parses decimal input without floating point drift", () => {
    const result = subRational(
      addRational(parseRational("+2.4"), parseRational("+1.1")),
      parseRational("+0.5"),
    );

    expect(rationalToString(result)).toBe("3");
  });

  it("handles fraction regression case", () => {
    const result = subRational(
      addRational(parseRational("+2/3"), parseRational("+5/6")),
      parseRational("+1/2"),
    );

    expect(rationalToString(result)).toBe("1");
  });

  it("recognizes equivalent rational inputs", () => {
    expect(equalsRational(parseRational("1.5"), parseRational("3/2"))).toBe(true);
  });
});

