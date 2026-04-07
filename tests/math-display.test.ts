import { describe, expect, it } from "vitest";

import { tokenizeMathForDisplay } from "../src/lib/math-display";

describe("math display helpers", () => {
  it("keeps plain text chunks untouched", () => {
    expect(tokenizeMathForDisplay("2.4-(-1.1)-(+0.5)")).toEqual([
      { type: "text", value: "2.4-(-1.1)-(+0.5)" },
    ]);
  });

  it("extracts fractions from mixed expressions for stacked rendering", () => {
    expect(tokenizeMathForDisplay("2/3-(-5/6)-(+1/2)")).toEqual([
      {
        type: "fraction",
        sign: "",
        numerator: "2",
        denominator: "3",
        value: "2/3",
      },
      { type: "text", value: "-(" },
      {
        type: "fraction",
        sign: "-",
        numerator: "5",
        denominator: "6",
        value: "-5/6",
      },
      { type: "text", value: ")-(" },
      {
        type: "fraction",
        sign: "+",
        numerator: "1",
        denominator: "2",
        value: "+1/2",
      },
      { type: "text", value: ")" },
    ]);
  });
});
