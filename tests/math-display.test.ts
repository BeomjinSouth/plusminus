import { describe, expect, it } from "vitest";

import { tokenizeMathForDisplay } from "../src/lib/math-display";

describe("math display helpers", () => {
  it("splits long plain expressions into term groups for wrapping", () => {
    expect(tokenizeMathForDisplay("2.4-(-1.1)-(+0.5)")).toEqual([
      { type: "text", group: 0, value: "2.4" },
      { type: "text", group: 1, value: "-(-1.1)" },
      { type: "text", group: 2, value: "-(+0.5)" },
    ]);
  });

  it("extracts fractions from mixed expressions for stacked rendering", () => {
    expect(tokenizeMathForDisplay("2/3-(-5/6)-(+1/2)")).toEqual([
      {
        type: "fraction",
        group: 0,
        sign: "",
        numerator: "2",
        denominator: "3",
        value: "2/3",
      },
      { type: "text", group: 1, value: "-(" },
      {
        type: "fraction",
        group: 1,
        sign: "-",
        numerator: "5",
        denominator: "6",
        value: "-5/6",
      },
      { type: "text", group: 1, value: ")" },
      { type: "text", group: 2, value: "-(" },
      {
        type: "fraction",
        group: 2,
        sign: "+",
        numerator: "1",
        denominator: "2",
        value: "+1/2",
      },
      { type: "text", group: 2, value: ")" },
    ]);
  });
});
