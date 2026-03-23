"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { RabbitParserChallenge } from "@/components/game/rabbit-parser/rabbit-parser-challenge";
import { finalizeProgress, flushAttemptQueue, flushAttemptQueueWithBeacon, queueAttemptEvent } from "@/lib/logging/client-logger";
import { saveLatestResult } from "@/lib/storage";
import type {
  AttemptEvent,
  ChallengeAttempt,
  ChallengeComplete,
  Difficulty,
  ModelId,
  Problem,
  SessionState,
  SetResult,
} from "@/lib/types";
import { makeSetId } from "@/lib/utils";

type SetPlayerProps = {
  session: SessionState;
  model: ModelId;
  difficulty: Difficulty;
  problems: Problem[];
};

const jumpSteps = ["식 끊기", "부호 정리", "점프하기", "답 쓰기"];

export function SetPlayer({
  session,
  model,
  difficulty,
  problems,
}: SetPlayerProps) {
  const router = useRouter();
  const [problemIndex, setProblemIndex] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);
  const retryCountRef = useRef(0);
  const bestStreakRef = useRef(0);
  const currentStreakRef = useRef(0);
  const isFinishingRef = useRef(false);

  const setId = useMemo(() => makeSetId(model, difficulty), [model, difficulty]);
  const problem = problems[problemIndex];
  const progressPercent = ((problemIndex + 1) / problems.length) * 100;

  useEffect(() => {
    isFinishingRef.current = isFinishing;
  }, [isFinishing]);

  useEffect(() => {
    void flushAttemptQueue(session.sessionId);
  }, [session.sessionId]);

  useEffect(() => {
    function flushOnHide() {
      if (isFinishingRef.current) {
        return;
      }

      flushAttemptQueueWithBeacon(session.sessionId);
    }

    function onVisibilityChange() {
      if (document.visibilityState === "hidden") {
        flushOnHide();
      }
    }

    window.addEventListener("beforeunload", flushOnHide);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", flushOnHide);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [session.sessionId]);

  async function handleAttempt(attempt: ChallengeAttempt) {
    if (!attempt.isCorrect) {
      const nextRetryCount = retryCountRef.current + 1;
      retryCountRef.current = nextRetryCount;
      setRetryCount(nextRetryCount);
    }

    const event: AttemptEvent = {
      eventId: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      sessionId: session.sessionId,
      school: session.student.school,
      grade: session.student.grade,
      classNo: session.student.classNo,
      studentNo: session.student.studentNo,
      model,
      difficulty,
      setId,
      problemId: problem.id,
      stepId: attempt.stepId,
      attemptNo: attempt.attemptNo,
      inputRaw: attempt.inputRaw,
      normalizedInput: attempt.normalizedInput,
      isCorrect: attempt.isCorrect,
      responseTimeMs: attempt.responseTimeMs,
      currentPosition: attempt.currentPosition,
      expectedValue: attempt.expectedValue,
    };

    await queueAttemptEvent(event);

    if (attempt.flushNow) {
      await flushAttemptQueue(session.sessionId);
    }
  }

  async function handleProblemComplete(result: ChallengeComplete) {
    const nextStreak = result.retriesUsed === 0 ? currentStreakRef.current + 1 : 0;
    const nextBestStreak = Math.max(bestStreakRef.current, nextStreak);
    const isLastProblem = problemIndex === problems.length - 1;

    currentStreakRef.current = nextStreak;
    bestStreakRef.current = nextBestStreak;
    setCurrentStreak(nextStreak);
    setBestStreak(nextBestStreak);

    if (!isLastProblem) {
      setProblemIndex((value) => value + 1);
      return;
    }

    const setResult: SetResult = {
      sessionId: session.sessionId,
      school: session.student.school,
      grade: session.student.grade,
      classNo: session.student.classNo,
      studentNo: session.student.studentNo,
      model,
      difficulty,
      setId,
      correctCount: problems.length,
      retryCount: retryCountRef.current,
      bestStreak: nextBestStreak,
      completedAt: new Date().toISOString(),
    };

    setIsFinishing(true);
    await finalizeProgress(session.sessionId, setResult);
    saveLatestResult(setResult);
    router.push(`/result/${model}/${difficulty}`);
  }

  return (
    <section className="grid gap-4">
      <div className="rounded-[2rem] border border-amber-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,247,237,0.94))] p-5 shadow-[0_20px_40px_rgba(245,158,11,0.12)] md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-amber-700">
              문제 {problemIndex + 1} / {problems.length}
            </p>
            <h1 className="mt-3 font-[var(--font-display)] text-[3rem] leading-none tracking-[-0.06em] text-[var(--ink-strong)] md:text-[4rem]">
              {problem.expression}
            </h1>
          </div>
          {isFinishing && (
            <div className="rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white">
              결과 저장 중
            </div>
          )}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {jumpSteps.map((step, index) => (
            <div
              key={step}
              className="rounded-[1.35rem] border border-amber-100 bg-white/88 px-4 py-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
                해야 할 일 {index + 1}
              </p>
              <p className="mt-2 text-base font-semibold text-[var(--ink-strong)]">
                {step}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 h-3 overflow-hidden rounded-full bg-amber-100">
          <div
            className="h-full rounded-full bg-amber-500 transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <RabbitParserChallenge
        key={problem.id}
        difficulty={difficulty}
        problem={problem}
        onAttempt={handleAttempt}
        onComplete={handleProblemComplete}
      />
    </section>
  );
}
