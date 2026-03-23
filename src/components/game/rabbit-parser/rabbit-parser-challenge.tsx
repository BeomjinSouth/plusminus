"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/common/button";
import { FeedbackBanner } from "@/components/common/feedback-banner";
import { ExpressionSplitter } from "@/components/game/rabbit-parser/expression-splitter";
import { NumberLine } from "@/components/number-line/number-line";
import { normalizeSegmentList, splitByGapSelection } from "@/lib/expression";
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
  { key: "split", label: "끊기" },
  { key: "normalize", label: "부호" },
  { key: "start", label: "시작" },
  { key: "move", label: "점프" },
  { key: "result", label: "답" },
] as const;

type RabbitPhase = (typeof phaseOrder)[number]["key"];

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
  const zero = parseRational("0");
  const [selectedStart, setSelectedStart] = useState<Rational | undefined>();
  const [moveIndex, setMoveIndex] = useState(0);
  const [currentPosition, setCurrentPosition] = useState<Rational>(zero);
  const [previewPosition, setPreviewPosition] = useState<Rational>(zero);
  const [resultInput, setResultInput] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [feedback, setFeedback] = useState<{
    tone: "info" | "success" | "warning";
    message: string;
  }>({
    tone: "info",
    message:
      difficulty === "high"
        ? "먼저 식을 끊어 보세요."
        : "한 단계씩 차례대로 하면 됩니다.",
  });
  const attemptMapRef = useRef<Record<string, number>>({});
  const startedAtRef = useRef(Date.now());

  const tick = parseRational(problem.suggestedTick);
  const lineMin = parseRational(problem.lineMin);
  const lineMax = parseRational(problem.lineMax);
  const moveTargets = problem.intermediateSums.map((value) => parseRational(value));
  const currentMoveTerm =
    phase === "move" ? parseRational(problem.terms[moveIndex]) : undefined;
  const currentMoveAmount =
    currentMoveTerm ? rationalToString(absRational(currentMoveTerm)) : "";
  const currentMoveDirection =
    currentMoveTerm && currentMoveTerm.numerator < 0 ? "왼쪽" : "오른쪽";

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
  }, [phase, tick, lineMin, lineMax, moveIndex, previewPosition]);

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
      flushNow: isCorrect,
    });

    if (!isCorrect) {
      setRetryCount((value) => value + 1);
      setFeedback({
        tone: "warning",
        message: "항이 끝나는 곳만 끊어 보세요.",
      });
      return;
    }

    setPhase("normalize");
    setFeedback({
      tone: "success",
      message: "좋아요. 이제 각 조각의 부호를 정리해 보세요.",
    });
  }

  async function submitNormalize() {
    const stepId = "normalize-signs";
    const attemptNo = nextAttempt(stepId);
    const responseTimeMs = Date.now() - startedAtRef.current;
    let isCorrect = true;

    try {
      problem.terms.forEach((expected, index) => {
        const actual = parseRational(normalizedInputs[index] ?? "");
        const target = parseRational(expected);
        if (!equalsRational(actual, target)) {
          isCorrect = false;
        }
      });
    } catch {
      isCorrect = false;
    }

    await onAttempt({
      stepId,
      attemptNo,
      inputRaw: normalizedInputs.join(", "),
      normalizedInput: problem.terms.join(", "),
      isCorrect,
      responseTimeMs,
      flushNow: isCorrect,
    });

    if (!isCorrect) {
      setRetryCount((value) => value + 1);
      setFeedback({
        tone: "warning",
        message: "바깥 부호와 안쪽 부호를 같이 보세요.",
      });
      return;
    }

    setPhase("start");
    setFeedback({
      tone: "success",
      message: "이제 토끼가 출발할 곳을 누르세요.",
    });
  }

  async function submitStart() {
    const stepId = "choose-start-point";
    const attemptNo = nextAttempt(stepId);
    const responseTimeMs = Date.now() - startedAtRef.current;
    const isCorrect = !!selectedStart && equalsRational(selectedStart, zero);

    await onAttempt({
      stepId,
      attemptNo,
      inputRaw: selectedStart ? rationalToString(selectedStart) : "",
      normalizedInput: "0",
      isCorrect,
      responseTimeMs,
      flushNow: isCorrect,
    });

    if (!isCorrect) {
      setRetryCount((value) => value + 1);
      setFeedback({
        tone: "warning",
        message: "토끼는 항상 0에서 시작합니다.",
      });
      return;
    }

    setCurrentPosition(zero);
    setPreviewPosition(zero);
    setPhase("move");
    setFeedback({
      tone: "success",
      message: "이제 항을 보고 토끼를 움직이세요.",
    });
  }

  async function submitMove() {
    const stepId = `move-step-${moveIndex + 1}`;
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
      flushNow: isCorrect,
    });

    if (!isCorrect) {
      setRetryCount((value) => value + 1);
      setFeedback({
        tone: "warning",
        message: "방향과 칸 수를 다시 확인해 보세요.",
      });
      return;
    }

    setCurrentPosition(previewPosition);

    if (moveIndex === moveTargets.length - 1) {
      setPhase("result");
      setFeedback({
        tone: "success",
        message: "좋아요. 이제 마지막 답만 쓰면 됩니다.",
      });
      return;
    }

    setMoveIndex((value) => value + 1);
    setFeedback({
      tone: "success",
      message: "좋아요. 다음 항으로 계속 가 보세요.",
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
      flushNow: true,
    });

    if (!isCorrect) {
      setRetryCount((value) => value + 1);
      setFeedback({
        tone: "warning",
        message: "토끼가 멈춘 위치를 그대로 쓰면 됩니다.",
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
            지금 할 일
          </p>
          <h2 className="mt-2 font-[var(--font-display)] text-[2.3rem] leading-none tracking-[-0.05em] text-[var(--ink-strong)] md:text-[2.8rem]">
            식 끊기
          </h2>
          <p className="mt-3 text-sm font-medium text-[var(--ink-soft)]">
            점을 눌러 항이 끝나는 곳만 고르세요.
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
            />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Button
              tone="ghost"
              block
              className="bg-white py-4 text-base"
              onClick={() => setSelectedGaps([])}
              disabled={selectedGaps.length === 0}
            >
              다시 하기
            </Button>
            <Button block className="py-4 text-base" onClick={submitSplit}>
              끊기 확인
            </Button>
          </div>
        </section>
      )}

      {phase === "normalize" && (
        <section className="rounded-[1.9rem] border border-amber-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,247,237,0.95))] p-5 shadow-[0_16px_32px_rgba(245,158,11,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
            지금 할 일
          </p>
          <h2 className="mt-2 font-[var(--font-display)] text-[2.3rem] leading-none tracking-[-0.05em] text-[var(--ink-strong)] md:text-[2.8rem]">
            부호 정리
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {problem.rawSplit.map((segment, index) => (
              <div key={segment} className="rounded-[1.5rem] border border-[var(--line)] bg-white/90 p-4">
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
                  placeholder={index === 0 ? "예: -3" : "예: +5"}
                />
              </div>
            ))}
          </div>
          <Button className="mt-5 py-4 text-base" block onClick={submitNormalize}>
            부호 확인
          </Button>
        </section>
      )}

      {phase === "start" && (
        <section className="rounded-[1.9rem] border border-amber-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,247,237,0.95))] p-5 shadow-[0_16px_32px_rgba(245,158,11,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
            지금 할 일
          </p>
          <h2 className="mt-2 font-[var(--font-display)] text-[2.3rem] leading-none tracking-[-0.05em] text-[var(--ink-strong)] md:text-[2.8rem]">
            시작 위치 고르기
          </h2>
          <p className="mt-3 text-sm font-medium text-[var(--ink-soft)]">
            토끼가 출발할 곳을 누르세요.
          </p>
          <div className="mt-5 rounded-[1.6rem] border border-[var(--line)] bg-white/90 p-4">
            <NumberLine
              min={lineMin}
              max={lineMax}
              tick={tick}
              current={selectedStart}
              selectable
              onSelect={(value) => setSelectedStart(value)}
            />
          </div>
          <Button className="mt-5 py-4 text-base" block onClick={submitStart}>
            시작 확인
          </Button>
        </section>
      )}

      {phase === "move" && currentMoveTerm && (
        <section className="rounded-[1.9rem] border border-amber-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,247,237,0.95))] p-5 shadow-[0_16px_32px_rgba(245,158,11,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
            지금 할 일
          </p>
          <h2 className="mt-2 font-[var(--font-display)] text-[2.3rem] leading-none tracking-[-0.05em] text-[var(--ink-strong)] md:text-[2.8rem]">
            토끼 점프
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.35rem] border border-amber-100 bg-white/90 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                이번 항
              </p>
              <p className="mt-2 text-xl font-semibold text-[var(--ink-strong)]">
                {problem.terms[moveIndex]}
              </p>
            </div>
            <div className="rounded-[1.35rem] border border-amber-100 bg-white/90 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                방향
              </p>
              <p className="mt-2 text-xl font-semibold text-[var(--ink-strong)]">
                {currentMoveDirection}
              </p>
            </div>
            <div className="rounded-[1.35rem] border border-amber-100 bg-white/90 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                칸 수
              </p>
              <p className="mt-2 text-xl font-semibold text-[var(--ink-strong)]">
                {currentMoveAmount}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-[1.6rem] border border-[var(--line)] bg-white/90 p-4">
            <NumberLine
              min={lineMin}
              max={lineMax}
              tick={tick}
              current={currentPosition}
              preview={previewPosition}
              target={moveTargets[moveIndex]}
            />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Button tone="ghost" block className="bg-white py-4 text-base" onClick={() => movePreview("left")}>
              왼쪽 1칸
            </Button>
            <Button tone="ghost" block className="bg-white py-4 text-base" onClick={() => movePreview("right")}>
              오른쪽 1칸
            </Button>
            <Button block className="py-4 text-base" onClick={submitMove}>
              점프 확인
            </Button>
          </div>

          <div className="mt-4 rounded-[1.35rem] border border-dashed border-amber-200 bg-white/76 px-4 py-4 text-sm font-medium text-[var(--ink-soft)]">
            지금 위치 {rationalToString(currentPosition)} · 토끼 위치 {rationalToString(previewPosition)}
          </div>
        </section>
      )}

      {phase === "result" && (
        <section className="rounded-[1.9rem] border border-emerald-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(236,253,245,0.94))] p-5 shadow-[0_16px_32px_rgba(16,185,129,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
            지금 할 일
          </p>
          <h2 className="mt-2 font-[var(--font-display)] text-[2.3rem] leading-none tracking-[-0.05em] text-[var(--ink-strong)] md:text-[2.8rem]">
            마지막 답 쓰기
          </h2>
          <p className="mt-3 text-sm font-medium text-[var(--ink-soft)]">
            토끼가 멈춘 위치를 그대로 쓰세요.
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
