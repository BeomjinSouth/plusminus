import type { ModelId, SetResult, StudentProgress } from "@/lib/types";

export type ModelAvailability = {
  status: "ready" | "locked" | "disabled";
  reason: string;
  actionLabel: string;
};

export const COUNTING_STONES_MASTERY_SET_ID = "counting-stones-high";

export function createEmptyStudentProgress(): StudentProgress {
  return {
    completedSetIds: [],
  };
}

export function recordCompletedSet(
  progress: StudentProgress | null | undefined,
  setId: string,
) {
  const current = progress ?? createEmptyStudentProgress();

  if (current.completedSetIds.includes(setId)) {
    return current;
  }

  return {
    ...current,
    completedSetIds: [...current.completedSetIds, setId],
  };
}

export function recordSetResult(
  progress: StudentProgress | null | undefined,
  result: SetResult,
) {
  return recordCompletedSet(progress, result.setId);
}

export function hasCompletedSet(
  progress: StudentProgress | null | undefined,
  setId: string,
) {
  return (progress?.completedSetIds ?? []).includes(setId);
}

export function hasMasteredCountingStones(
  progress: StudentProgress | null | undefined,
) {
  return hasCompletedSet(progress, COUNTING_STONES_MASTERY_SET_ID);
}

export function isModelUnlocked(
  progress: StudentProgress | null | undefined,
  model: ModelId,
) {
  if (model === "counting-stones") {
    return true;
  }

  if (model === "postman") {
    return false;
  }

  return hasMasteredCountingStones(progress);
}

export function getModelAvailability(
  progress: StudentProgress | null | undefined,
  model: ModelId,
): ModelAvailability {
  if (model === "postman") {
    return {
      status: "disabled",
      reason: "점수 카드는 지금은 잠시 꺼 두었습니다.",
      actionLabel: "비활성화",
    };
  }

  if (model === "rabbit-sign-parser" && !hasMasteredCountingStones(progress)) {
    return {
      status: "locked",
      reason: "돌 놓기 어려움 세트를 완료하면 점프 계산이 열립니다.",
      actionLabel: "잠금",
    };
  }

  return {
    status: "ready",
    reason: "",
    actionLabel: "시작",
  };
}
