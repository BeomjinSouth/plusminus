import { describe, expect, it } from "vitest";

import {
  COUNTING_STONES_MASTERY_SET_ID,
  createEmptyStudentProgress,
  getModelAvailability,
  recordCompletedSet,
} from "../src/lib/progress";

describe("student progress gating", () => {
  it("keeps 점프 계산 locked before 돌 놓기 mastery", () => {
    const progress = createEmptyStudentProgress();

    expect(getModelAvailability(progress, "counting-stones").status).toBe(
      "ready",
    );
    expect(getModelAvailability(progress, "rabbit-sign-parser").status).toBe(
      "locked",
    );
    expect(getModelAvailability(progress, "postman").status).toBe("disabled");
  });

  it("unlocks 점프 계산 after 돌 놓기 어려움 completion", () => {
    const progress = recordCompletedSet(
      createEmptyStudentProgress(),
      COUNTING_STONES_MASTERY_SET_ID,
    );

    expect(getModelAvailability(progress, "rabbit-sign-parser").status).toBe(
      "ready",
    );
  });

  it("deduplicates completed set ids", () => {
    const once = recordCompletedSet(
      createEmptyStudentProgress(),
      COUNTING_STONES_MASTERY_SET_ID,
    );
    const twice = recordCompletedSet(once, COUNTING_STONES_MASTERY_SET_ID);

    expect(twice.completedSetIds).toEqual([COUNTING_STONES_MASTERY_SET_ID]);
  });
});
