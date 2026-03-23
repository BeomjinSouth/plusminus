import { clsx, type ClassValue } from "clsx";

import type { Difficulty, ModelId } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDifficultyLabel(difficulty: Difficulty) {
  return (
    {
      low: "쉬움",
      medium: "보통",
      high: "어려움",
    }[difficulty] ?? difficulty
  );
}

export function formatModelLabel(model: ModelId) {
  return (
    {
      "counting-stones": "돌 놓기",
      postman: "점수 카드",
      "rabbit-sign-parser": "점프 계산",
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
