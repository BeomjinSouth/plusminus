import { describe, expect, it } from "vitest";

import {
  buildSignedTermFromInput,
  buildFinalExpression,
  matchesNormalizedFinalExpression,
  normalizeUnsignedRationalInput,
  parseSignedSegment,
  splitExpressionIntoTerms,
  tokenizeExpressionForSplitView,
  unwrapLeadingSimpleTerm,
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

  it("tokenizes rabbit split expressions into block view tokens", () => {
    expect(tokenizeExpressionForSplitView("-(+3)-(-5)+7")).toEqual([
      { text: "-", type: "operator", boundaryAfter: 1 },
      { text: "(", type: "bracket", boundaryAfter: 2 },
      { text: "+3", type: "number", boundaryAfter: 4 },
      { text: ")", type: "bracket", boundaryAfter: 5 },
      { text: "-", type: "operator", boundaryAfter: 6 },
      { text: "(", type: "bracket", boundaryAfter: 7 },
      { text: "-5", type: "number", boundaryAfter: 9 },
      { text: ")", type: "bracket", boundaryAfter: 10 },
      { text: "+7", type: "number" },
    ]);
  });

  it("builds the normalized final expression for rabbit steps", () => {
    expect(buildFinalExpression(["-4", "-3"])).toBe("-4-3");
    expect(buildFinalExpression(["+2/3", "+5/6", "-1/2"])).toBe(
      "2/3+5/6-1/2",
    );
  });

  it("accepts equivalent normalized final-expression input", () => {
    expect(matchesNormalizedFinalExpression("-4-3", ["-4", "-3"])).toBe(true);
    expect(matchesNormalizedFinalExpression("-(3)+5+7", ["-3", "+5", "+7"])).toBe(
      true,
    );
    expect(
      matchesNormalizedFinalExpression("2.4 + 1.1 - 0.5", [
        "+2.4",
        "+1.1",
        "-0.5",
      ]),
    ).toBe(true);
    expect(
      matchesNormalizedFinalExpression("(+2/3)+(+5/6)-1/2", [
        "+2/3",
        "+5/6",
        "-1/2",
      ]),
    ).toBe(true);
  });

  it("rejects unresolved final-expression sign forms", () => {
    expect(
      matchesNormalizedFinalExpression("5-(-3)+(-2)", ["+5", "+3", "-2"]),
    ).toBe(false);
    expect(matchesNormalizedFinalExpression("-(+3)+5+7", ["-3", "+5", "+7"])).toBe(
      false,
    );
    expect(
      matchesNormalizedFinalExpression("2/3-(-5/6)-(+1/2)", [
        "+2/3",
        "+5/6",
        "-1/2",
      ]),
    ).toBe(false);
  });

  it("unwraps unnecessary parentheses on the leading term", () => {
    expect(unwrapLeadingSimpleTerm("(-4)+(-3)")).toBe("-4+(-3)");
    expect(unwrapLeadingSimpleTerm("(+2.4)-(-1.1)-(+0.5)")).toBe(
      "2.4-(-1.1)-(+0.5)",
    );
  });

  it("normalizes nested signs correctly", () => {
    expect(rationalToString(parseSignedSegment("-(+3/4)").value)).toBe("-3/4");
    expect(rationalToString(parseSignedSegment("-(-5/4)").value)).toBe("5/4");
  });

  it("separates sign choice from magnitude input", () => {
    expect(normalizeUnsignedRationalInput("-2/3")).toBe("2/3");
    expect(buildSignedTermFromInput("+", "2.50")).toBe("+5/2");
    expect(buildSignedTermFromInput("-", "-3/4")).toBe("-3/4");
  });
});
