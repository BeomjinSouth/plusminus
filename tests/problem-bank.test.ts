import { describe, expect, it } from "vitest";

import { getProblemsByDifficulty } from "../src/lib/problem-bank";

describe("problem bank", () => {
  it("keeps 7 problems per difficulty", () => {
    expect(getProblemsByDifficulty("low")).toHaveLength(7);
    expect(getProblemsByDifficulty("medium")).toHaveLength(7);
    expect(getProblemsByDifficulty("high")).toHaveLength(7);
  });

  it("keeps mandatory regression expressions in the bank", () => {
    const allProblems = [
      ...getProblemsByDifficulty("low"),
      ...getProblemsByDifficulty("medium"),
      ...getProblemsByDifficulty("high"),
    ];

    const expressions = allProblems.map((problem) => problem.expression);

    expect(expressions).toContain("-(+3)-(-5)+7");
    expect(expressions).toContain("2/3-(-5/6)-(+1/2)");
    expect(expressions).toContain("2.4-(-1.1)-(+0.5)");
    expect(expressions).toContain("-4+(-3)");
  });

  it("provides rawSplit for high-difficulty rabbit parsing cases", () => {
    const highProblems = getProblemsByDifficulty("high");

    highProblems.forEach((problem) => {
      expect(problem.rawSplit.length).toBeGreaterThanOrEqual(3);
      expect(problem.rawSplit.length).toBe(problem.terms.length);
    });
  });

  it("matches split answers to the displayed expression", () => {
    const lowProblems = getProblemsByDifficulty("low");
    const leadingPositiveProblem = lowProblems.find((problem) => problem.id === "L01");

    expect(leadingPositiveProblem).toMatchObject({
      expression: "3+(+2)",
      rawSplit: ["3", "+(+2)"],
    });
  });
});
