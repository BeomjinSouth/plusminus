"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { StatPill } from "@/components/common/stat-pill";
import { CountingStonesChallenge } from "@/components/game/counting-stones/counting-stones-challenge";
import { PostmanChallenge } from "@/components/game/postman/postman-challenge";
import { RabbitParserChallenge } from "@/components/game/rabbit-parser/rabbit-parser-challenge";
import {
  finalizeProgress,
  flushAttemptQueue,
  flushAttemptQueueWithBeacon,
  queueAttemptEvent,
} from "@/lib/logging/client-logger";
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
import {
  formatDifficultyLabel,
  formatModelLabel,
  makeSetId,
  toStudentSummary,
} from "@/lib/utils";

type SetPlayerProps = {
  session: SessionState;
  model: ModelId;
  difficulty: Difficulty;
  problems: Problem[];
};

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

  function renderChallenge() {
    switch (model) {
      case "counting-stones":
        return (
          <CountingStonesChallenge
            key={problem.id}
            difficulty={difficulty}
            problem={problem}
            onAttempt={handleAttempt}
            onComplete={handleProblemComplete}
          />
        );
      case "postman":
        return (
          <PostmanChallenge
            key={problem.id}
            difficulty={difficulty}
            problem={problem}
            onAttempt={handleAttempt}
            onComplete={handleProblemComplete}
          />
        );
      default:
        return (
          <RabbitParserChallenge
            key={problem.id}
            difficulty={difficulty}
            problem={problem}
            onAttempt={handleAttempt}
            onComplete={handleProblemComplete}
          />
        );
    }
  }

  return (
    <section className="grid gap-6">
      <div className="panel rounded-[2rem] px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">
              {formatModelLabel(model)} · {formatDifficultyLabel(difficulty)} 세트
            </p>
            <h1 className="mt-1 font-[var(--font-display)] text-4xl">
              문제 {problemIndex + 1} / {problems.length}
            </h1>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">
              {toStudentSummary(session.student)}
            </p>
          </div>
          {isFinishing && (
            <div className="rounded-2xl bg-[var(--sea)] px-4 py-3 text-sm text-white">
              결과 저장 중...
            </div>
          )}
        </div>
        <div className="mt-5 h-3 overflow-hidden rounded-full bg-stone-200">
          <div
            className="h-full rounded-full bg-[var(--sun)] transition-all"
            style={{
              width: `${((problemIndex + 1) / problems.length) * 100}%`,
            }}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatPill label="현재 문제" value={`${problemIndex + 1}/${problems.length}`} />
        <StatPill label="총 재도전" value={`${retryCount}회`} accent="sun" />
        <StatPill label="최고 무실수 연속" value={`${bestStreak}문항`} accent="berry" />
      </div>

      {renderChallenge()}
    </section>
  );
}
