import "server-only";

import { SHEET_NAMES, appendRows } from "@/lib/sheets/google-sheets";
import type { AttemptEvent, SetResult } from "@/lib/types";

const sessionsHeaders = [
  "timestamp",
  "session_id",
  "school",
  "grade",
  "class_no",
  "student_no",
  "app_version",
];

const attemptHeaders = [
  "timestamp",
  "event_id",
  "session_id",
  "school",
  "grade",
  "class_no",
  "student_no",
  "model",
  "difficulty",
  "set_id",
  "problem_id",
  "step_id",
  "attempt_no",
  "input_raw",
  "normalized_input",
  "is_correct",
  "response_time_ms",
  "current_position",
  "expected_value",
  "app_version",
];

const resultHeaders = [
  "completed_at",
  "session_id",
  "school",
  "grade",
  "class_no",
  "student_no",
  "model",
  "difficulty",
  "set_id",
  "correct_count",
  "retry_count",
  "best_streak",
  "app_version",
];

function getAppVersion() {
  return process.env.APP_VERSION?.trim() || "dev";
}

export async function logSessionStart(input: {
  sessionId: string;
  school: string;
  grade: number;
  classNo: number;
  studentNo: number;
}) {
  return appendRows(
    SHEET_NAMES.sessions,
    [
      [
        new Date().toISOString(),
        input.sessionId,
        input.school,
        input.grade,
        input.classNo,
        input.studentNo,
        getAppVersion(),
      ],
    ],
    {
      headers: sessionsHeaders,
    },
  );
}

export async function appendAttemptEvents(events: AttemptEvent[]) {
  if (events.length === 0) {
    return {
      mode: "noop" as const,
      appendedRows: 0,
    };
  }

  const batchSize = Number.parseInt(process.env.LOG_FLUSH_MAX_BATCH ?? "10", 10);
  let appendedRows = 0;
  let mode: "live" | "noop" = "noop";

  for (let index = 0; index < events.length; index += batchSize) {
    const chunk = events.slice(index, index + batchSize);
    const result = await appendRows(
      SHEET_NAMES.attempts,
      chunk.map((event) => [
        event.createdAt,
        event.eventId,
        event.sessionId,
        event.school,
        event.grade,
        event.classNo,
        event.studentNo,
        event.model,
        event.difficulty,
        event.setId,
        event.problemId,
        event.stepId,
        event.attemptNo,
        event.inputRaw,
        event.normalizedInput,
        event.isCorrect,
        event.responseTimeMs,
        event.currentPosition ?? "",
        event.expectedValue ?? "",
        getAppVersion(),
      ]),
      {
        headers: attemptHeaders,
      },
    );

    appendedRows += result.appendedRows;
    mode = result.mode;
  }

  return {
    mode,
    appendedRows,
  };
}

export async function appendSetResult(result: SetResult) {
  return appendRows(
    SHEET_NAMES.results,
    [
      [
        result.completedAt,
        result.sessionId,
        result.school,
        result.grade,
        result.classNo,
        result.studentNo,
        result.model,
        result.difficulty,
        result.setId,
        result.correctCount,
        result.retryCount,
        result.bestStreak,
        getAppVersion(),
      ],
    ],
    {
      headers: resultHeaders,
    },
  );
}
