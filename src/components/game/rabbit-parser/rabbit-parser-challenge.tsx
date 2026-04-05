"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/common/button";
import { ExpressionSplitter } from "@/components/game/rabbit-parser/expression-splitter";
import { NumberLine } from "@/components/number-line/number-line";
import {
  buildFinalExpression,
  buildSignedTermFromInput,
  getFinalExpressionSegments,
  matchesNormalizedFinalExpression,
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
] as const;

type RabbitPhase = (typeof phaseOrder)[number]["key"];

type NormalizeEntry = {
  sign: "+" | "-" | null;
  magnitude: string;
};

function createEmptyNormalizeEntries(length: number): NormalizeEntry[] {
  return Array.from({ length }, () => ({
    sign: null,
    magnitude: "",
  }));
}

function formatNormalizeEntryForAttempt(entry: NormalizeEntry) {
  return `${entry.sign ?? "?"}${entry.magnitude || "?"}`;
}

function getNormalizeEntryPreview(entry: NormalizeEntry) {
  if (!entry.sign || !entry.magnitude) {
    return null;
  }

  try {
    return buildSignedTermFromInput(entry.sign, entry.magnitude);
  } catch {
    return null;
  }
}

function ExpressionRibbon({
  segments,
  activeIndex,
}: {
  segments: string[];
  activeIndex?: number;
}) {
  return (
    <div className="rounded-[1.55rem] border border-[var(--line)] bg-white/95 p-6 shadow-sm">
      <p className="text-center text-sm font-bold uppercase tracking-[0.16em] text-[var(--ink-soft)]">
        최종 식
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        {segments.map((segment, index) => (
          <span
            key={`${segment}-${index}`}
            className={`rounded-[1.2rem] border-2 px-4 py-3 font-mono text-xl sm:text-2xl md:text-3xl font-black transition-all ${
              activeIndex === index
                ? "border-amber-400 bg-amber-100 text-amber-950 shadow-[0_8px_16px_rgba(245,158,11,0.2)] scale-110 z-10"
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
  const [normalizeEntries, setNormalizeEntries] = useState<NormalizeEntry[]>(
    () => createEmptyNormalizeEntries(problem.rawSplit.length),
  );
  const [finalExpressionInput, setFinalExpressionInput] = useState("");
  const [moveIndex, setMoveIndex] = useState(0);
  const [currentPosition, setCurrentPosition] = useState<Rational>(
    parseRational("0"),
  );
  const [previewPosition, setPreviewPosition] = useState<Rational>(
    parseRational("0"),
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
    () => problem.intermediateSums.map((value) => parseRational(value)),
    [problem.intermediateSums],
  );
  const currentMoveTermIndex = moveIndex;
  const currentMoveTerm =
    phase === "move" && currentMoveTermIndex < problem.terms.length
      ? problem.terms[currentMoveTermIndex]
      : undefined;

  useEffect(() => {
    startedAtRef.current = Date.now();
  }, [phase, moveIndex]);

  useEffect(() => {
    if (phase !== "move" || !currentMoveTerm) {
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
  }, [phase, tick, lineMin, lineMax, moveIndex, currentMoveTerm]);

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
      message:
        "좋아요. 각 항마다 부호 버튼을 고르고 숫자 칸에 크기를 쓴 뒤, 아래 최종 식도 적어 보세요.",
    });
  }

  async function submitNormalize() {
    const stepId = "normalize-signs";
    const attemptNo = nextAttempt(stepId);
    const responseTimeMs = Date.now() - startedAtRef.current;
    const rawTermEntries = normalizeEntries.map(formatNormalizeEntryForAttempt);
    let submittedTerms: string[] = [];
    let areTermsCorrect = true;

    try {
      submittedTerms = normalizeEntries.map((entry) => {
        if (!entry.sign) {
          throw new Error("Missing sign");
        }

        return buildSignedTermFromInput(entry.sign, entry.magnitude);
      });

      problem.terms.forEach((expected, index) => {
        const actual = parseRational(submittedTerms[index] ?? "");
        const target = parseRational(expected);
        if (!equalsRational(actual, target)) {
          areTermsCorrect = false;
        }
      });
    } catch {
      areTermsCorrect = false;
    }

    const isExpressionCorrect = matchesNormalizedFinalExpression(
      finalExpressionInput,
      problem.terms,
    );
    const isCorrect = areTermsCorrect && isExpressionCorrect;

    await onAttempt({
      stepId,
      attemptNo,
      inputRaw: `${(submittedTerms.length > 0 ? submittedTerms : rawTermEntries).join(", ")} | ${finalExpressionInput}`,
      normalizedInput: `${problem.terms.join(", ")} | ${finalExpression}`,
      isCorrect,
      responseTimeMs,
    });

    if (!areTermsCorrect) {
      setRetryCount((value) => value + 1);
      setFeedback({
        tone: "warning",
        message: "부호 버튼과 숫자 칸을 다시 확인해 보세요.",
      });
      return;
    }

    if (!isExpressionCorrect) {
      setRetryCount((value) => value + 1);
      setFeedback({
        tone: "warning",
        message:
          "최종 식은 첫 번째 항부터 순서대로 쓰고, 각 항의 부호가 맞는지 다시 확인해 보세요.",
      });
      return;
    }

    setCurrentPosition(parseRational("0"));
    setPreviewPosition(parseRational("0"));

    setPhase("move");
    if (moveTargets.length === 0) {
      setFeedback({
        tone: "success",
        message: "출발 위치를 잘 찾았어요. 이제 마지막 답만 적으면 됩니다.",
      });
    } else {
      setFeedback({
        tone: "success",
        message: "식을 잘 정리했어요! 이제 토끼를 순서대로 하나씩 점프시켜 보세요.",
      });
    }
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
    setMoveIndex((value) => value + 1);

    if (moveIndex === moveTargets.length - 1) {
      setFeedback({
        tone: "success",
        message: "마지막 점프까지 맞았어요. 이제 답을 적어 주세요.",
      });
    } else {
      setFeedback({
        tone: "success",
        message: "좋아요. 다음 강조 항으로 이어서 점프해 보세요.",
      });
    }
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

  function updateNormalizeEntrySign(index: number, sign: "+" | "-") {
    setNormalizeEntries((value) =>
      value.map((entry, entryIndex) => {
        if (entryIndex !== index) return entry;

        let newText = entry.magnitude || "";
        if (newText.startsWith("+") || newText.startsWith("-")) {
          newText = sign + newText.slice(1);
        } else {
          newText = sign + newText;
        }

        return { ...entry, sign, magnitude: newText };
      }),
    );
  }

  function updateNormalizeEntryMagnitude(index: number, rawValue: string) {
    setNormalizeEntries((value) =>
      value.map((entry, entryIndex) => {
        if (entryIndex !== index) return entry;

        let newSign = entry.sign;
        if (rawValue.startsWith("+")) newSign = "+";
        if (rawValue.startsWith("-")) newSign = "-";

        return { ...entry, magnitude: rawValue, sign: newSign };
      }),
    );
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-4">
        {phaseOrder.map((item, index) => {
          const currentIndex = phaseOrder.findIndex((phaseItem) => phaseItem.key === phase);
          const isActive = item.key === phase;
          const isDone = index < currentIndex;

          return (
            <div
              key={item.key}
              className={`relative overflow-hidden rounded-[1.5rem] border-2 px-4 py-4 transition-all duration-300 ${
                isActive
                  ? "border-[var(--sea)] bg-[var(--bg-paper)] shadow-md -translate-y-1"
                  : isDone
                    ? "border-[var(--grass)] bg-emerald-50 opacity-80"
                    : "border-white bg-white/60"
              }`}
            >
              {isActive && (
                <div className="absolute top-0 right-0 p-2 text-2xl animate-bounce">📍</div>
              )}
              {isDone && (
                <div className="absolute top-0 right-0 p-2 text-xl opacity-50">✅</div>
              )}
              <p
                className={`text-[0.7rem] font-black uppercase tracking-widest ${
                  isActive
                    ? "text-[var(--sea)]"
                    : isDone
                      ? "text-[var(--grass)]"
                      : "text-[var(--ink-soft)]"
                }`}
              >
                {isDone ? "완료" : isActive ? "지금" : "다음"}
              </p>
              <p className="mt-1 text-lg font-bold text-[var(--ink-strong)]">
                {item.label}
              </p>
            </div>
          );
        })}
      </div>

      {phase === "split" && (
        <section className="rounded-[2.5rem] border-4 border-white bg-gradient-to-br from-blue-50 to-cyan-50 p-6 shadow-xl md:p-8">
          <p className="inline-block rounded-full bg-cyan-100 px-3 py-1 text-xs font-black uppercase tracking-widest text-cyan-700">
            STEP 1 ✂️
          </p>
          <h2 className="mt-4 font-[var(--font-display)] text-[2.5rem] font-bold leading-none tracking-[-0.03em] text-[var(--ink-strong)] md:text-[3rem]">
            식을 톡 잘라보기
          </h2>
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
        <section className="rounded-[2.5rem] border-4 border-white bg-gradient-to-br from-indigo-50 to-purple-50 p-6 shadow-xl md:p-8">
          <p className="inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-black uppercase tracking-widest text-indigo-700">
            STEP 2 🔧
          </p>
          <h2 className="mt-4 font-[var(--font-display)] text-[2.5rem] font-bold leading-none tracking-[-0.03em] text-[var(--ink-strong)] md:text-[3rem]">
            값 정리하기
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {problem.rawSplit.map((segment, index) => {
              const entry = normalizeEntries[index];
              const previewTerm = entry ? getNormalizeEntryPreview(entry) : null;

              return (
                <div
                  key={segment}
                  className="rounded-[1.5rem] border border-[var(--line)] bg-white/90 p-4"
                >
                <p className="text-2xl font-black text-[var(--ink-strong)]">{segment}</p>
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                    부호
                  </p>
                  <div className="mt-2 flex gap-2">
                    {(["+", "-"] as const).map((sign) => {
                      const isActive = entry?.sign === sign;

                      return (
                        <button
                          key={sign}
                          type="button"
                          aria-pressed={isActive}
                          onClick={() => updateNormalizeEntrySign(index, sign)}
                          className={`min-w-14 rounded-[1rem] border px-4 py-3 text-lg font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink-strong)] focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
                            isActive
                              ? "border-amber-300 bg-amber-100 text-amber-950"
                              : "border-[var(--line)] bg-white text-[var(--ink-strong)] hover:border-amber-200 hover:bg-amber-50"
                          }`}
                        >
                          {sign}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                  숫자
                </p>
                <input
                  value={entry?.magnitude ?? ""}
                  onChange={(event) =>
                    updateNormalizeEntryMagnitude(index, event.target.value)
                  }
                  className="field mt-4"
                  inputMode="text"
                  placeholder="예: +4, -2/3, +1.5"
                />
              </div>
              );
            })}
          </div>

          <div className="mt-4 rounded-[1.6rem] border border-[var(--line)] bg-white/92 p-4">
            <p className="text-sm font-semibold text-[var(--ink-soft)]">최종 식</p>
            <input
              value={finalExpressionInput}
              onChange={(event) => setFinalExpressionInput(event.target.value)}
              className="field mt-3"
              placeholder={finalExpression}
            />
          </div>

          <Button className="mt-5 py-4 text-base" block onClick={submitNormalize}>
            정리 제출
          </Button>
        </section>
      )}

      {phase === "move" && (
        <section className="rounded-[2.5rem] border-4 border-white bg-gradient-to-br from-emerald-50 to-teal-50 p-6 shadow-xl md:p-8">
          <p className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-black uppercase tracking-widest text-emerald-700">
            STEP 3 🐰
          </p>
          <h2 className="mt-4 font-[var(--font-display)] text-[2.5rem] font-bold leading-none tracking-[-0.03em] text-[var(--ink-strong)] md:text-[3rem]">
            {currentMoveTerm ? "토끼 점프" : "최종 답안 작성"}
          </h2>
          {currentMoveTerm ? (
            <>
              <div className="mt-6 mb-6">
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

              <div className="mt-4 rounded-[1.35rem] border border-dashed border-[var(--line)] bg-white/76 px-5 py-4 text-sm font-medium text-[var(--ink-soft)] flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <span>현재 위치 {rationalToString(currentPosition)} · 토끼 위치{" "}
                {rationalToString(previewPosition)}</span>
                <span className="inline-flex items-center gap-1.5 text-indigo-600 font-semibold bg-indigo-50/80 px-3 py-1.5 rounded-lg border border-indigo-100">
                  <span className="text-[1.1rem]">⌨️</span> 방향키(←, →)와 Enter로 점프할 수 있어요
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="mt-5">
                <ExpressionRibbon segments={finalExpressionSegments} />
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
              <p className="mt-4 text-sm font-medium text-[var(--ink-soft)]">
                토끼가 마지막에 멈춘 위치를 그대로 적어 주세요.
              </p>
              <input
                value={resultInput}
                onChange={(event) => setResultInput(event.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void submitResult();
                  }
                }}
                className="field mt-5 text-lg"
                placeholder="예: 9"
              />
              <Button className="mt-4 py-4 text-base" block onClick={submitResult}>
                답 제출
              </Button>
            </>
          )}
        </section>
      )}
    </div>
  );
}
