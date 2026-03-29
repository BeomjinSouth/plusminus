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
    <section className="grid gap-6">
      <div className="rounded-[2.5rem] border-4 border-white bg-gradient-to-b from-blue-50 to-indigo-50 p-6 shadow-xl md:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-1.5 text-sm font-bold text-indigo-700 shadow-sm mb-3">
              <span>🎯</span>
              <span>문제 {problemIndex + 1} / {problems.length}</span>
            </div>
            <h1 className="font-[var(--font-display)] text-[3.5rem] font-bold leading-none tracking-[-0.04em] text-[var(--ink-strong)] md:text-[4.5rem] drop-shadow-sm">
              {problem.expression}
            </h1>
          </div>
          {isFinishing && (
            <div className="animate-pulse rounded-full bg-[var(--sun)] px-5 py-2.5 text-sm font-bold text-white shadow-md">
              결과 저장 중 🚀
            </div>
          )}
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          {jumpSteps.map((step, index) => (
            <div
              key={step}
              className="relative overflow-hidden rounded-[1.5rem] border-2 border-white bg-white/60 p-4 shadow-sm backdrop-blur-sm transition-transform hover:-translate-y-1"
            >
              <div className="absolute -right-2 -bottom-2 text-4xl opacity-[0.05]">🐰</div>
              <p className="text-[0.75rem] font-black uppercase tracking-widest text-indigo-400">
                STEP {index + 1}
              </p>
              <p className="mt-1 text-lg font-bold text-[var(--ink-strong)]">
                {step}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 h-4 w-full overflow-hidden rounded-full bg-white/80 shadow-inner border border-indigo-100 p-1">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 shadow-sm transition-all duration-500 ease-out"
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
