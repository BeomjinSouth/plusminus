"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/common/button";
import { FeedbackBanner } from "@/components/common/feedback-banner";
import { ExpressionSplitter } from "@/components/game/rabbit-parser/expression-splitter";
import { NumberLine } from "@/components/number-line/number-line";
import {
  buildFinalExpression,
  getFinalExpressionSegments,
  normalizeSegmentList,
  splitByGapSelection,
} from "@/lib/expression";
import {
  absRational,
  addRational,
  compareRational,
  equalsRational,
  parseRational,
  rationalToString,
  subRational,
  type Rational,
} from "@/lib/rational";
import type {
  ChallengeAttempt,
  ChallengeComplete,
  Difficulty,
  Problem,
} from "@/lib/types";

type RabbitParserChallengeProps = {
  difficulty: Difficulty;
  problem: Problem;
  onAttempt: (attempt: ChallengeAttempt) => void | Promise<void>;
  onComplete: (result: ChallengeComplete) => void;
};

const phaseOrder = [
  { key: "split", label: "1. 끊기" },
  { key: "normalize", label: "2. 정리" },
  { key: "move", label: "3. 점프" },
  { key: "result", label: "4. 답" },
] as const;

type RabbitPhase = (typeof phaseOrder)[number]["key"];

function ExpressionRibbon({
  segments,
  activeIndex,
}: {
  segments: string[];
  activeIndex?: number;
}) {
  return (
    <div className="rounded-[1.55rem] border border-[var(--line)] bg-white/88 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-soft)]">
        최종 식
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {segments.map((segment, index) => (
          <span
            key={`${segment}-${index}`}
            className={`rounded-[1.1rem] border px-3 py-2 font-mono text-base font-black transition ${
              activeIndex === index
                ? "border-amber-300 bg-amber-100 text-amber-950 shadow-[0_12px_24px_rgba(245,158,11,0.16)]"
                : "border-[var(--line)] bg-white text-[var(--ink-strong)]"
            }`}
          >
            {segment}
          </span>
        ))}
      </div>
    </div>
  );
}

export function RabbitParserChallenge({
  difficulty,
  problem,
  onAttempt,
  onComplete,
}: RabbitParserChallengeProps) {
  const [phase, setPhase] = useState<RabbitPhase>("split");
  const [selectedGaps, setSelectedGaps] = useState<number[]>([]);
  const [normalizedInputs, setNormalizedInputs] = useState<string[]>(
    Array.from({ length: problem.rawSplit.length }, () => ""),
  );
  const [finalExpressionInput, setFinalExpressionInput] = useState("");
  const [moveIndex, setMoveIndex] = useState(0);
  const [currentPosition, setCurrentPosition] = useState<Rational>(
    parseRational(problem.terms[0]),
  );
  const [previewPosition, setPreviewPosition] = useState<Rational>(
    parseRational(problem.terms[0]),
  );
  const [resultInput, setResultInput] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [feedback, setFeedback] = useState<{
    tone: "info" | "success" | "warning";
    message: string;
  }>({
    tone: "info",
    message:
      difficulty === "high"
        ? "먼저 식을 항 단위로 잘라 보세요."
        : "단계를 따라 차례대로 풀면 됩니다.",
  });
  const attemptMapRef = useRef<Record<string, number>>({});
  const startedAtRef = useRef(Date.now());

  const tick = parseRational(problem.suggestedTick);
  const lineMin = parseRational(problem.lineMin);
  const lineMax = parseRational(problem.lineMax);
  const finalExpression = useMemo(
    () => buildFinalExpression(problem.terms),
    [problem.terms],
  );
  const finalExpressionSegments = useMemo(
    () => getFinalExpressionSegments(problem.terms),
    [problem.terms],
  );
  const startValue = useMemo(() => parseRational(problem.terms[0]), [problem.terms]);
  const moveTargets = useMemo(
    () => problem.intermediateSums.slice(1).map((value) => parseRational(value)),
    [problem.intermediateSums],
  );
  const currentMoveTermIndex = moveIndex + 1;
  const currentMoveTerm =
    phase === "move" && currentMoveTermIndex < problem.terms.length
      ? problem.terms[currentMoveTermIndex]
      : undefined;

  useEffect(() => {
    startedAtRef.current = Date.now();
  }, [phase, moveIndex]);

  useEffect(() => {
    if (phase !== "move") {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setPreviewPosition((value) => {
          const next = subRational(value, tick);
          if (compareRational(next, lineMin) < 0) {
            return value;
          }
          return next;
        });
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        setPreviewPosition((value) => {
          const next = addRational(value, tick);
          if (compareRational(next, lineMax) > 0) {
            return value;
          }
          return next;
        });
      }

      if (event.key === "Enter") {
        event.preventDefault();
        void submitMove();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase, tick, lineMin, lineMax, moveIndex]);

  function nextAttempt(stepId: string) {
    const next = (attemptMapRef.current[stepId] ?? 0) + 1;
    attemptMapRef.current[stepId] = next;
    return next;
  }

  async function submitSplit() {
    const stepId = "split-expression";
    const attemptNo = nextAttempt(stepId);
    const responseTimeMs = Date.now() - startedAtRef.current;
    const submittedSegments = splitByGapSelection(problem.expression, selectedGaps);
    const isCorrect =
      JSON.stringify(normalizeSegmentList(submittedSegments)) ===
      JSON.stringify(normalizeSegmentList(problem.rawSplit));

    await onAttempt({
      stepId,
      attemptNo,
      inputRaw: submittedSegments.join(" / "),
      normalizedInput: problem.rawSplit.join(" / "),
      isCorrect,
      responseTimeMs,
    });

    if (!isCorrect) {
      setRetryCount((value) => value + 1);
      setFeedback({
        tone: "warning",
        message: "항이 끝나는 곳만 끊어 주세요. 괄호 안은 그대로 한 묶음입니다.",
      });
      return;
    }

    setPhase("normalize");
    setFeedback({
      tone: "success",
      message: "좋아요. 이제 각 항의 부호와 전체 최종 식을 적어 보세요.",
    });
  }

  async function submitNormalize() {
    const stepId = "normalize-signs";
    const attemptNo = nextAttempt(stepId);
    const responseTimeMs = Date.now() - startedAtRef.current;
    let areTermsCorrect = true;

    try {
      problem.terms.forEach((expected, index) => {
        const actual = parseRational(normalizedInputs[index] ?? "");
        const target = parseRational(expected);
        if (!equalsRational(actual, target)) {
          areTermsCorrect = false;
        }
      });
    } catch {
      areTermsCorrect = false;
    }

    const isExpressionCorrect =
      finalExpressionInput.trim().length > 0 &&
      finalExpressionInput.replace(/\s+/g, "") === finalExpression;
    const isCorrect = areTermsCorrect && isExpressionCorrect;

    await onAttempt({
      stepId,
      attemptNo,
      inputRaw: `${normalizedInputs.join(", ")} | ${finalExpressionInput}`,
      normalizedInput: `${problem.terms.join(", ")} | ${finalExpression}`,
      isCorrect,
      responseTimeMs,
    });

    if (!areTermsCorrect) {
      setRetryCount((value) => value + 1);
      setFeedback({
        tone: "warning",
        message: "각 항의 최종 부호를 다시 확인해 보세요.",
      });
      return;
    }

    if (!isExpressionCorrect) {
      setRetryCount((value) => value + 1);
      setFeedback({
        tone: "warning",
        message:
          "최종 식은 첫 번째 항을 앞에 두고, 뒤 음수 항은 +(-3)처럼 써 주세요.",
      });
      return;
    }

    setCurrentPosition(startValue);
    setPreviewPosition(startValue);

    if (moveTargets.length === 0) {
      setPhase("result");
      setFeedback({
        tone: "success",
        message: "출발 위치를 잘 찾았어요. 이제 마지막 답만 적으면 됩니다.",
      });
      return;
    }

    setPhase("move");
    setFeedback({
      tone: "success",
      message: "토끼가 첫 번째 항 위치로 갔어요. 이제 다음 항부터 점프하세요.",
    });
  }

  async function submitMove() {
    if (!currentMoveTerm) {
      return;
    }

    const stepId = `move-step-${currentMoveTermIndex + 1}`;
    const attemptNo = nextAttempt(stepId);
    const responseTimeMs = Date.now() - startedAtRef.current;
    const expectedTarget = moveTargets[moveIndex];
    const isCorrect = equalsRational(previewPosition, expectedTarget);

    await onAttempt({
      stepId,
      attemptNo,
      inputRaw: rationalToString(previewPosition),
      normalizedInput: rationalToString(expectedTarget),
      isCorrect,
      responseTimeMs,
      currentPosition: rationalToString(previewPosition),
      expectedValue: rationalToString(expectedTarget),
    });

    if (!isCorrect) {
      setRetryCount((value) => value + 1);
      setFeedback({
        tone: "warning",
        message: "강조된 항만 적용해서 토끼를 다시 점프시켜 보세요.",
      });
      return;
    }

    setCurrentPosition(previewPosition);

    if (moveIndex === moveTargets.length - 1) {
      setPhase("result");
      setFeedback({
        tone: "success",
        message: "마지막 점프까지 맞았어요. 이제 답만 적으면 됩니다.",
      });
      return;
    }

    setMoveIndex((value) => value + 1);
    setFeedback({
      tone: "success",
      message: "좋아요. 다음 강조 항으로 이어서 점프해 보세요.",
    });
  }

  async function submitResult() {
    const stepId = "submit-final";
    const attemptNo = nextAttempt(stepId);
    const responseTimeMs = Date.now() - startedAtRef.current;
    let isCorrect = false;

    try {
      isCorrect = equalsRational(parseRational(resultInput), parseRational(problem.answer));
    } catch {
      isCorrect = false;
    }

    await onAttempt({
      stepId,
      attemptNo,
      inputRaw: resultInput,
      normalizedInput: problem.answer,
      isCorrect,
      responseTimeMs,
    });

    if (!isCorrect) {
      setRetryCount((value) => value + 1);
      setFeedback({
        tone: "warning",
        message: "토끼가 마지막에 멈춘 위치를 그대로 답으로 적어 주세요.",
      });
      return;
    }

    setFeedback({
      tone: "success",
      message: "정답입니다. 다음 문제로 넘어갑니다.",
    });
    onComplete({ retriesUsed: retryCount });
  }

  function movePreview(direction: "left" | "right") {
    setPreviewPosition((value) => {
      const next =
        direction === "right" ? addRational(value, tick) : subRational(value, tick);

      if (compareRational(next, lineMin) < 0 || compareRational(next, lineMax) > 0) {
        return value;
      }

      return next;
    });
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-5">
        {phaseOrder.map((item, index) => {
          const currentIndex = phaseOrder.findIndex((phaseItem) => phaseItem.key === phase);
          const isActive = item.key === phase;
          const isDone = index < currentIndex;

          return (
            <div
              key={item.key}
              className={`rounded-[1.35rem] border px-4 py-4 ${
                isActive
                  ? "border-amber-300 bg-amber-50"
                  : isDone
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-[var(--line)] bg-white/88"
              }`}
            >
              <p
                className={`text-xs font-semibold uppercase tracking-[0.16em] ${
                  isActive
                    ? "text-amber-700"
                    : isDone
                      ? "text-emerald-700"
                      : "text-[var(--ink-soft)]"
                }`}
              >
                {isDone ? "완료" : isActive ? "지금" : "다음"}
              </p>
              <p className="mt-2 text-lg font-semibold text-[var(--ink-strong)]">
                {item.label}
              </p>
            </div>
          );
        })}
      </div>

      <FeedbackBanner tone={feedback.tone} message={feedback.message} />

      {phase === "split" && (
        <section className="rounded-[1.9rem] border border-amber-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,247,237,0.95))] p-5 shadow-[0_16px_32px_rgba(245,158,11,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
            지금 단계
          </p>
          <h2 className="mt-2 font-[var(--font-display)] text-[2.3rem] leading-none tracking-[-0.05em] text-[var(--ink-strong)] md:text-[2.8rem]">
            식을 톡 잘라보기
          </h2>
          <p className="mt-3 text-sm font-medium text-[var(--ink-soft)]">
            블록 사이 빈칸을 눌러 항이 끝나는 위치만 골라 주세요.
          </p>
          <div className="mt-5">
            <ExpressionSplitter
              expression={problem.expression}
              selectedGaps={selectedGaps}
              onToggleGap={(gap) =>
                setSelectedGaps((value) =>
                  value.includes(gap)
                    ? value.filter((item) => item !== gap)
                    : [...value, gap],
                )
              }
              onReset={() => setSelectedGaps([])}
            />
          </div>
          <Button block className="mt-5 py-4 text-base" onClick={submitSplit}>
            끊기 제출
          </Button>
        </section>
      )}

      {phase === "normalize" && (
        <section className="rounded-[1.9rem] border border-amber-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,247,237,0.95))] p-5 shadow-[0_16px_32px_rgba(245,158,11,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
            지금 단계
          </p>
          <h2 className="mt-2 font-[var(--font-display)] text-[2.3rem] leading-none tracking-[-0.05em] text-[var(--ink-strong)] md:text-[2.8rem]">
            항과 최종 식 정리
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {problem.rawSplit.map((segment, index) => (
              <div
                key={segment}
                className="rounded-[1.5rem] border border-[var(--line)] bg-white/90 p-4"
              >
                <p className="text-sm font-semibold text-[var(--ink-soft)]">{segment}</p>
                <input
                  value={normalizedInputs[index]}
                  onChange={(event) =>
                    setNormalizedInputs((value) =>
                      value.map((item, itemIndex) =>
                        itemIndex === index ? event.target.value : item,
                      ),
                    )
                  }
                  className="field mt-3"
                  placeholder={index === 0 ? "예: -4" : "예: -3 또는 +5"}
                />
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-[1.6rem] border border-[var(--line)] bg-white/92 p-4">
            <p className="text-sm font-semibold text-[var(--ink-soft)]">최종 식</p>
            <input
              value={finalExpressionInput}
              onChange={(event) => setFinalExpressionInput(event.target.value)}
              className="field mt-3"
              placeholder={finalExpression}
            />
            <p className="mt-3 text-xs font-medium leading-6 text-[var(--ink-soft)]">
              첫 번째 항은 괄호 없이 쓰고, 뒤 음수 항은 <span className="font-mono">+(-3)</span>
              처럼 적어요.
            </p>
          </div>

          <Button className="mt-5 py-4 text-base" block onClick={submitNormalize}>
            정리 제출
          </Button>
        </section>
      )}

      {phase === "move" && currentMoveTerm && (
        <section className="rounded-[1.9rem] border border-amber-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,247,237,0.95))] p-5 shadow-[0_16px_32px_rgba(245,158,11,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
            지금 단계
          </p>
          <h2 className="mt-2 font-[var(--font-display)] text-[2.3rem] leading-none tracking-[-0.05em] text-[var(--ink-strong)] md:text-[2.8rem]">
            토끼 점프
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <div className="rounded-[1.25rem] border border-amber-100 bg-white/90 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                출발
              </p>
              <p className="mt-2 text-lg font-semibold text-[var(--ink-strong)]">
                {problem.terms[0]}
              </p>
            </div>
            <div className="rounded-[1.25rem] border border-amber-100 bg-white/90 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                이번 항
              </p>
              <p className="mt-2 text-lg font-semibold text-[var(--ink-strong)]">
                {currentMoveTerm}
              </p>
            </div>
            <div className="rounded-[1.25rem] border border-amber-100 bg-white/90 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                방향
              </p>
              <p className="mt-2 text-lg font-semibold text-[var(--ink-strong)]">
                {currentMoveTerm.startsWith("-") ? "왼쪽" : "오른쪽"}
              </p>
            </div>
            <div className="rounded-[1.25rem] border border-amber-100 bg-white/90 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                칸 수
              </p>
              <p className="mt-2 text-lg font-semibold text-[var(--ink-strong)]">
                {rationalToString(absRational(parseRational(currentMoveTerm)))}
              </p>
            </div>
          </div>
          <div className="mt-5">
            <ExpressionRibbon
              segments={finalExpressionSegments}
              activeIndex={currentMoveTermIndex}
            />
          </div>
          <div className="mt-5 rounded-[1.6rem] border border-[var(--line)] bg-white/90 p-4">
            <NumberLine
              min={lineMin}
              max={lineMax}
              tick={tick}
              current={currentPosition}
              preview={previewPosition}
            />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Button
              tone="ghost"
              block
              className="bg-white py-4 text-base"
              onClick={() => movePreview("left")}
            >
              왼쪽 1칸
            </Button>
            <Button
              tone="ghost"
              block
              className="bg-white py-4 text-base"
              onClick={() => movePreview("right")}
            >
              오른쪽 1칸
            </Button>
            <Button block className="py-4 text-base" onClick={submitMove}>
              점프 확인
            </Button>
          </div>

          <div className="mt-4 rounded-[1.35rem] border border-dashed border-amber-200 bg-white/76 px-4 py-4 text-sm font-medium text-[var(--ink-soft)]">
            현재 위치 {rationalToString(currentPosition)} · 토끼 위치{" "}
            {rationalToString(previewPosition)}
          </div>
        </section>
      )}

      {phase === "result" && (
        <section className="rounded-[1.9rem] border border-emerald-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(236,253,245,0.94))] p-5 shadow-[0_16px_32px_rgba(16,185,129,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
            지금 단계
          </p>
          <h2 className="mt-2 font-[var(--font-display)] text-[2.3rem] leading-none tracking-[-0.05em] text-[var(--ink-strong)] md:text-[2.8rem]">
            마지막 답 적기
          </h2>
          <div className="mt-5">
            <ExpressionRibbon segments={finalExpressionSegments} />
          </div>
          <p className="mt-4 text-sm font-medium text-[var(--ink-soft)]">
            토끼가 마지막에 멈춘 위치를 그대로 적어 주세요.
          </p>
          <input
            value={resultInput}
            onChange={(event) => setResultInput(event.target.value)}
            className="field mt-5 text-lg"
            placeholder="예: 9"
          />
          <Button className="mt-4 py-4 text-base" block onClick={submitResult}>
            답 제출
          </Button>
        </section>
      )}
    </div>
  );
}
