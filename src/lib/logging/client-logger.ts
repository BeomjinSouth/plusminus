import {
  clearPendingProgressFlush,
  loadAttemptQueue,
  loadPendingProgressFlush,
  saveAttemptQueue,
  savePendingProgressFlush,
} from "@/lib/storage";
import type { AttemptEvent, PendingProgressFlush, SetResult } from "@/lib/types";

export async function queueAttemptEvent(event: AttemptEvent) {
  const queue = loadAttemptQueue<AttemptEvent>();
  queue.push(event);
  saveAttemptQueue(queue);
}

function buildJsonBlob(payload: unknown) {
  return new Blob([JSON.stringify(payload)], {
    type: "application/json",
  });
}

export async function flushAttemptQueue(sessionId: string) {
  const queue = loadAttemptQueue<AttemptEvent>();

  if (queue.length === 0) {
    return true;
  }

  const response = await fetch("/api/attempts/log", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sessionId,
      events: queue,
    }),
  });

  if (!response.ok) {
    return false;
  }

  saveAttemptQueue<AttemptEvent>([]);
  return true;
}

export function flushAttemptQueueWithBeacon(sessionId: string) {
  if (typeof navigator === "undefined" || typeof navigator.sendBeacon !== "function") {
    return false;
  }

  const queue = loadAttemptQueue<AttemptEvent>();

  if (queue.length === 0) {
    return true;
  }

  const didQueue = navigator.sendBeacon(
    "/api/attempts/log",
    buildJsonBlob({
      sessionId,
      events: queue,
    }),
  );

  if (didQueue) {
    saveAttemptQueue<AttemptEvent>([]);
  }

  return didQueue;
}

function buildPendingProgressFlush(
  sessionId: string,
  setResult: SetResult,
): PendingProgressFlush {
  return {
    sessionId,
    events: loadAttemptQueue<AttemptEvent>(),
    setResult,
  };
}

async function postPendingProgressFlush(payload: PendingProgressFlush) {
  return fetch("/api/progress/flush", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

function completePendingProgressFlush() {
  saveAttemptQueue<AttemptEvent>([]);
  clearPendingProgressFlush();
}

export function stagePendingProgressFlush(sessionId: string, setResult: SetResult) {
  const payload = buildPendingProgressFlush(sessionId, setResult);
  savePendingProgressFlush(payload);
  return payload;
}

export async function flushPendingProgress() {
  const payload = loadPendingProgressFlush();

  if (!payload) {
    return true;
  }

  const response = await postPendingProgressFlush(payload);

  if (!response.ok) {
    return false;
  }

  completePendingProgressFlush();
  return true;
}

export function flushPendingProgressWithBeacon() {
  if (typeof navigator === "undefined" || typeof navigator.sendBeacon !== "function") {
    return false;
  }

  const payload = loadPendingProgressFlush();

  if (!payload) {
    return true;
  }

  const didQueue = navigator.sendBeacon("/api/progress/flush", buildJsonBlob(payload));

  if (didQueue) {
    completePendingProgressFlush();
  }

  return didQueue;
}

export async function finalizeProgress(sessionId: string, setResult: SetResult) {
  stagePendingProgressFlush(sessionId, setResult);
  return flushPendingProgress();
}
