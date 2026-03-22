import { loadAttemptQueue, saveAttemptQueue } from "@/lib/storage";
import type { AttemptEvent, SetResult } from "@/lib/types";

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

export async function finalizeProgress(sessionId: string, setResult: SetResult) {
  const queue = loadAttemptQueue<AttemptEvent>();

  const response = await fetch("/api/progress/flush", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sessionId,
      events: queue,
      setResult,
    }),
  });

  if (!response.ok) {
    return false;
  }

  saveAttemptQueue<AttemptEvent>([]);
  return true;
}
