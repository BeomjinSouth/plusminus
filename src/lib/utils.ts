import { clsx, type ClassValue } from "clsx";

import type { Difficulty, ModelId } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDifficultyLabel(difficulty: Difficulty) {
  return (
    {
      low: "하",
      medium: "중",
      high: "상",
    }[difficulty] ?? difficulty
  );
}

export function formatModelLabel(model: ModelId) {
  return (
    {
      "counting-stones": "셈돌 모델",
      postman: "카드 점수 미션",
      "rabbit-sign-parser": "토끼 부호-분해 모델",
    }[model] ?? model
  );
}

export function isDifficulty(value: string): value is Difficulty {
  return value === "low" || value === "medium" || value === "high";
}

export function isModelId(value: string): value is ModelId {
  return (
    value === "counting-stones" ||
    value === "postman" ||
    value === "rabbit-sign-parser"
  );
}

export function toStudentSummary(student: {
  school: string;
  grade: number;
  classNo: number;
  studentNo: number;
}) {
  return `${student.school} · ${student.grade}학년 ${student.classNo}반 ${student.studentNo}번`;
}

export function makeSetId(model: ModelId, difficulty: Difficulty) {
  return `${model}-${difficulty}`;
}
