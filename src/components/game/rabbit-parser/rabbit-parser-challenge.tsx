"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/common/button";
import { FeedbackBanner } from "@/components/common/feedback-banner";
import { NumberLine } from "@/components/number-line/number-line";
import { ExpressionSplitter } from "@/components/game/rabbit-parser/expression-splitter";
import {
  addRational,
  compareRational,
  equalsRational,
  parseRational,
  rationalToString,
  subRational,
  type Rational,
} from "@/lib/rational";
import { normalizeSegmentList, splitByGapSelection } from "@/lib/expression";
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

export function RabbitParserChallenge({
  difficulty,
  problem,
  onAttempt,
  onComplete,
}: RabbitParserChallengeProps) {
  const [phase, setPhase] = useState<
    "split" | "normalize" | "start" | "move" | "result"
  >("split");
  const [selectedGaps, setSelectedGaps] = useState<number[]>([]);
  const [normalizedInputs, setNormalizedInputs] = useState<string[]>(
    Array.from({ length: problem.rawSplit.length }, () => ""),
  );
  const [selectedStart, setSelectedStart] = useState<Rational | undefined>();
  const [moveIndex, setMoveIndex] = useState(0);
  const zero = parseRational("0");
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
        ? "먼저 식 아래 표시점을 눌러, 항이 끝나는 곳만 골라 보세요."
        : "식 아래 표시점으로 항을 나누고, 부호를 정리한 뒤 토끼를 움직입니다.",
  });
  const attemptMapRef = useRef<Record<string, number>>({});
  const startedAtRef = useRef(Date.now());

  const tick = parseRational(problem.suggestedTick);
  const lineMin = parseRational(problem.lineMin);
  const lineMax = parseRational(problem.lineMax);
  const moveTargets = problem.intermediateSums.map((value) => parseRational(value));

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
        message:
          "괄호 안은 그대로 두고, 항이 끝나는 곳만 끊어 보세요. 부호와 숫자가 한 묶음입니다.",
      });
      return;
    }

    setPhase("normalize");
    setFeedback({
      tone: "success",
      message: "잘 끊었습니다. 이제 각 조각의 최종 부호를 정리해 보세요.",
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
        message:
          "바깥 부호와 괄호 안 부호를 함께 보고, 최종적으로 오른쪽인지 왼쪽인지 결정해 보세요.",
      });
      return;
    }

    setPhase("start");
    setFeedback({
      tone: "success",
      message: "좋습니다. 이제 수직선에서 토끼의 시작 위치를 클릭하세요.",
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
        message: "토끼는 항상 0에서 출발합니다. 수직선 가운데의 0을 다시 찾아 보세요.",
      });
      return;
    }

    setCurrentPosition(zero);
    setPreviewPosition(zero);
    setPhase("move");
    setFeedback({
      tone: "success",
      message:
        "좋습니다. 각 항만큼 왼쪽 또는 오른쪽으로 움직인 뒤 Enter 또는 제출 버튼을 누르세요.",
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
        message:
          "현재 항의 부호에 따라 방향을 다시 확인해 보세요. 칸 수는 절댓값만큼만 움직이면 됩니다.",
      });
      return;
    }

    setCurrentPosition(previewPosition);

    if (moveIndex === moveTargets.length - 1) {
      setPhase("result");
      setFeedback({
        tone: "success",
        message: "모든 이동이 맞았습니다. 마지막으로 최종 값을 적어 보세요.",
      });
      return;
    }

    setMoveIndex((value) => value + 1);
    setFeedback({
      tone: "success",
      message: "좋습니다. 다음 항도 같은 방식으로 적용해 보세요.",
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
        message: "토끼가 마지막에 멈춘 위치와 같은 값을 적어야 합니다. 최종 위치를 다시 확인해 보세요.",
      });
      return;
    }

    setFeedback({
      tone: "success",
      message: "토끼 모델 해결 완료. 다음 문항으로 넘어갑니다.",
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
    <div className="grid gap-5">
      <div className="rounded-[2rem] bg-white/75 p-5">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--sun)]">
          토끼 부호-분해 미션
        </p>
        <h2 className="mt-1 font-[var(--font-display)] text-3xl">
          {problem.expression}
        </h2>
      </div>

      <FeedbackBanner tone={feedback.tone} message={feedback.message} />

      {phase === "split" && (
        <div className="rounded-[2rem] bg-white/80 p-5">
          <h3 className="font-[var(--font-display)] text-3xl">1단계 · 끊기</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
            식 모양은 그대로 두고, 아래 점을 눌러 끊을 곳만 표시해 주세요. 미리보기에서
            조각이 어떻게 나뉘는지 바로 확인할 수 있습니다.
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
          <Button className="mt-5" onClick={submitSplit}>
            끊기 제출
          </Button>
        </div>
      )}

      {phase === "normalize" && (
        <div className="rounded-[2rem] bg-white/80 p-5">
          <h3 className="font-[var(--font-display)] text-3xl">2단계 · 부호 정리</h3>
          <div className="mt-5 grid gap-4">
            {problem.rawSplit.map((segment, index) => (
              <div key={segment} className="rounded-3xl bg-stone-50 p-4">
                <p className="text-sm font-semibold text-[var(--ink-soft)]">
                  {segment}
                </p>
                <input
                  value={normalizedInputs[index]}
                  onChange={(event) =>
                    setNormalizedInputs((value) =>
                      value.map((item, itemIndex) =>
                        itemIndex === index ? event.target.value : item,
                      ),
                    )
                  }
                  className="mt-3 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
                  placeholder={index === 0 ? "예: -3" : "예: +5 또는 5"}
                />
              </div>
            ))}
          </div>
          <Button className="mt-5" onClick={submitNormalize}>
            부호 정리 제출
          </Button>
        </div>
      )}

      {phase === "start" && (
        <div className="rounded-[2rem] bg-white/80 p-5">
          <h3 className="font-[var(--font-display)] text-3xl">3단계 · 시작 위치</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
            토끼의 시작 위치를 클릭한 뒤 제출하세요.
          </p>
          <div className="mt-5">
            <NumberLine
              min={lineMin}
              max={lineMax}
              tick={tick}
              current={selectedStart}
              selectable
              onSelect={(value) => setSelectedStart(value)}
            />
          </div>
          <Button className="mt-5" onClick={submitStart}>
            시작 위치 제출
          </Button>
        </div>
      )}

      {phase === "move" && (
        <div className="rounded-[2rem] bg-white/80 p-5">
          <h3 className="font-[var(--font-display)] text-3xl">4단계 · 토끼 이동</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
            현재 항 `{problem.terms[moveIndex]}` 을 적용하세요. 키보드 화살표와 Enter도 사용할 수 있습니다.
          </p>
          <div className="mt-5">
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
            <Button tone="ghost" onClick={() => movePreview("left")}>
              왼쪽 1칸
            </Button>
            <Button tone="ghost" onClick={() => movePreview("right")}>
              오른쪽 1칸
            </Button>
            <Button onClick={submitMove}>현재 위치 제출</Button>
          </div>
          <div className="mt-5 rounded-3xl bg-stone-50 p-4 text-sm text-[var(--ink-soft)]">
            시작 위치: {rationalToString(currentPosition)} / 미리보기 위치:{" "}
            {rationalToString(previewPosition)}
          </div>
        </div>
      )}

      {phase === "result" && (
        <div className="rounded-[2rem] bg-white/80 p-5">
          <h3 className="font-[var(--font-display)] text-3xl">5단계 · 최종 값 제출</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
            토끼가 마지막에 도착한 위치를 최종 값으로 적으세요.
          </p>
          <input
            value={resultInput}
            onChange={(event) => setResultInput(event.target.value)}
            className="mt-5 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
            placeholder="예: 9 또는 1"
          />
          <Button className="mt-4" onClick={submitResult}>
            최종 값 제출
          </Button>
        </div>
      )}
    </div>
  );
}
