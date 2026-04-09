import type { PendingProgressFlush, SessionState, SetResult } from "@/lib/types";

const SESSION_KEY = "plusminus:session";
const RESULT_KEY = "plusminus:latest-result";
const ATTEMPT_QUEUE_KEY = "plusminus:attempt-queue";
const PENDING_PROGRESS_FLUSH_KEY = "plusminus:pending-progress-flush";

function readStorage<T>(key: string): T | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: unknown) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function loadSessionState() {
  return readStorage<SessionState>(SESSION_KEY);
}

export function saveSessionState(value: SessionState) {
  writeStorage(SESSION_KEY, value);
}

export function clearSessionState() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(SESSION_KEY);
}

export function loadLatestResult() {
  return readStorage<SetResult>(RESULT_KEY);
}

export function saveLatestResult(value: SetResult) {
  writeStorage(RESULT_KEY, value);
}

export function loadAttemptQueue<T>() {
  return readStorage<T[]>(ATTEMPT_QUEUE_KEY) ?? [];
}

export function saveAttemptQueue<T>(value: T[]) {
  writeStorage(ATTEMPT_QUEUE_KEY, value);
}

export function loadPendingProgressFlush() {
  return readStorage<PendingProgressFlush>(PENDING_PROGRESS_FLUSH_KEY);
}

export function savePendingProgressFlush(value: PendingProgressFlush) {
  writeStorage(PENDING_PROGRESS_FLUSH_KEY, value);
}

export function clearPendingProgressFlush() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(PENDING_PROGRESS_FLUSH_KEY);
}
