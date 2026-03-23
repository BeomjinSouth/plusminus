"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { StatPill } from "@/components/common/stat-pill";
import { CountingStonesChallenge } from "@/components/game/counting-stones/counting-stones-challenge";
import { PostmanChallenge } from "@/components/game/postman/postman-challenge";
import { RabbitParserChallenge } from "@/components/game/rabbit-parser/rabbit-parser-challenge";
import {
  difficultyMissionLabels,
  getModelInsight,
} from "@/lib/model-content";
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
import { formatDifficultyLabel, makeSetId, toStudentSummary } from "@/lib/utils";

type SetPlayerProps = {
  session: SessionState;
  model: ModelId;
  difficulty: Difficulty;
  problems: Problem[];
};

const countingStonesSteps = [
  "돌 놓기",
  "0쌍 찾기",
  "답 쓰기",
];

type MinimalHeaderConfig = {
  textClass: string;
  panelClass: string;
  stepClass: string;
  progressClass: string;
  progressTrackClass: string;
  steps: string[];
};

const minimalModelHeader: Partial<Record<ModelId, MinimalHeaderConfig>> = {
  "counting-stones": {
    textClass: "text-sky-700",
    panelClass:
      "border-sky-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(240,249,255,0.94))] shadow-[0_20px_40px_rgba(14,165,233,0.12)]",
    stepClass: "border-sky-100 bg-white/88",
    progressClass: "bg-sky-500",
    progressTrackClass: "bg-sky-100",
    steps: countingStonesSteps,
  },
  "rabbit-sign-parser": {
    textClass: "text-amber-700",
    panelClass:
      "border-amber-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,247,237,0.94))] shadow-[0_20px_40px_rgba(245,158,11,0.12)]",
    stepClass: "border-amber-100 bg-white/88",
    progressClass: "bg-amber-500",
    progressTrackClass: "bg-amber-100",
    steps: ["끊기", "부호 정리", "토끼 이동"],
  },
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
  const modelInsight = getModelInsight(model);
  const minimalHeader = minimalModelHeader[model];
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

  if (minimalHeader) {
    return (
      <section className="grid gap-4">
        <div className={`rounded-[2rem] border p-5 md:p-6 ${minimalHeader.panelClass}`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className={`text-sm font-semibold uppercase tracking-[0.14em] ${minimalHeader.textClass}`}>
                문제 {problemIndex + 1} / {problems.length}
              </p>
              <h1 className="mt-3 font-[var(--font-display)] text-[3rem] leading-none tracking-[-0.06em] text-[var(--ink-strong)] md:text-[4rem]">
                {problem.expression}
              </h1>
            </div>
            {isFinishing && (
              <div className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white">
                결과 저장 중
              </div>
            )}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {minimalHeader.steps.map((step, index) => (
              <div
                key={step}
                className={`rounded-[1.35rem] border px-4 py-4 ${minimalHeader.stepClass}`}
              >
                <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${minimalHeader.textClass}`}>
                  해야 할 일 {index + 1}
                </p>
                <p className="mt-2 text-base font-semibold text-[var(--ink-strong)]">
                  {step}
                </p>
              </div>
            ))}
          </div>

          <div className={`mt-4 h-3 overflow-hidden rounded-full ${minimalHeader.progressTrackClass}`}>
            <div
              className={`h-full rounded-full transition-all ${minimalHeader.progressClass}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {renderChallenge()}
      </section>
    );
  }

  return (
    <section className="grid gap-6">
      <div
        className={`panel-strong overflow-hidden rounded-[2.2rem] px-5 py-5 md:px-6 ${modelInsight.accentClass}`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-white/75 bg-white/82 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sea)]">
                {modelInsight.missionLabel}
              </span>
              <span className="rounded-full bg-[var(--ink-strong)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                {formatDifficultyLabel(difficulty)} 세트 · {difficultyMissionLabels[difficulty]}
              </span>
            </div>
            <h1 className="mt-4 font-[var(--font-display)] text-[2.3rem] leading-[1.02] tracking-[-0.05em] md:text-[3.4rem]">
              문제 {problemIndex + 1}
              <span className="text-[var(--ink-soft)]"> / {problems.length}</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--ink-soft)] md:text-base">
              {modelInsight.hook}
            </p>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">
              {toStudentSummary(session.student)}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.5rem] bg-[var(--ink-strong)] px-4 py-4 text-white shadow-[0_20px_34px_rgba(19,34,56,0.16)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/65">
                진행 중 미션
              </p>
              <p className="mt-2 text-lg font-semibold">{modelInsight.rewardLabel}</p>
              <p className="mt-1 text-sm text-white/78">
                지금은 {problemIndex + 1}번째 문제를 진행하고 있습니다.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-[var(--line)] bg-white/84 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">
                현재 식
              </p>
              <p className="mt-2 font-[var(--font-display)] text-[1.75rem] leading-none tracking-[-0.04em] text-[var(--ink-strong)]">
                {problem.expression}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {modelInsight.quickPoints.map((point) => (
              <span
                key={point}
                className="rounded-full border border-[var(--line)] bg-white/82 px-3 py-1 text-xs font-semibold text-[var(--ink-soft)]"
              >
                {point}
              </span>
            ))}
          </div>
          {isFinishing && (
            <div className="rounded-full bg-[var(--sea)] px-4 py-2 text-sm font-semibold text-white">
              결과 저장 중
            </div>
          )}
        </div>

        <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/60">
          <div
            className="h-full rounded-full bg-[var(--sun)] transition-all"
            style={{ width: `${progressPercent}%` }}
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
