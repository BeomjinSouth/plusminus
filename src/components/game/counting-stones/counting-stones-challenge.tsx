"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type Dispatch,
  type SetStateAction,
} from "react";

import { Button } from "@/components/common/button";
import { FeedbackBanner } from "@/components/common/feedback-banner";
import {
  absRational,
  equalsRational,
  parseRational,
  rationalToUnits,
} from "@/lib/rational";
import type {
  ChallengeAttempt,
  ChallengeComplete,
  Difficulty,
  Problem,
} from "@/lib/types";

type CountingStonesChallengeProps = {
  difficulty: Difficulty;
  problem: Problem;
  onAttempt: (attempt: ChallengeAttempt) => void | Promise<void>;
  onComplete: (result: ChallengeComplete) => void;
};

type StoneToken = {
  id: number;
  animation: "enter" | "leave" | "cancel";
};

type PhaseKey = "place" | "cancel" | "result";

const STONE_PREVIEW_LIMIT = 18;
const STONE_EXIT_MS = 240;
const STONE_CANCEL_MS = 640;
const phaseOrder: PhaseKey[] = ["place", "cancel", "result"];
const phaseLabels: Record<PhaseKey, string> = {
  place: "돌 놓기",
  cancel: "0쌍 찾기",
  result: "답 쓰기",
};

export function CountingStonesChallenge({
  difficulty,
  problem,
  onAttempt,
  onComplete,
}: CountingStonesChallengeProps) {
  const termValues = problem.terms.map((term) => parseRational(term));
  const [phase, setPhase] = useState<PhaseKey>("place");
  const [termIndex, setTermIndex] = useState(0);
  const [placedPositive, setPlacedPositive] = useState(0);
  const [placedNegative, setPlacedNegative] = useState(0);
  const [boardPositive, setBoardPositive] = useState(0);
  const [boardNegative, setBoardNegative] = useState(0);
  const [trayPositiveStones, setTrayPositiveStones] = useState<StoneToken[]>([]);
  const [trayNegativeStones, setTrayNegativeStones] = useState<StoneToken[]>([]);
  const [boardPositiveStones, setBoardPositiveStones] = useState<StoneToken[]>([]);
  const [boardNegativeStones, setBoardNegativeStones] = useState<StoneToken[]>([]);
  const [cancelInput, setCancelInput] = useState("");
  const [resultInput, setResultInput] = useState("");
  const [isAnimatingCancellation, setIsAnimatingCancellation] = useState(false);
  const [feedback, setFeedback] = useState<{
    tone: "info" | "success" | "warning";
    message: string;
  }>({
    tone: "info",
    message:
      difficulty === "high"
        ? "식을 한 항씩 돌로 바꿔 보세요."
        : "지금 보이는 항을 돌로 바꿔 보세요.",
  });
  const [retryCount, setRetryCount] = useState(0);
  const attemptMapRef = useRef<Record<string, number>>({});
  const startedAtRef = useRef(Date.now());
  const stoneIdRef = useRef(0);
  const timeoutIdsRef = useRef<number[]>([]);

  const currentTerm = termValues[termIndex];
  const currentUnits =
    currentTerm && rationalToUnits(absRational(currentTerm), problem.gridDenominator);
  const currentTone = currentTerm?.numerator > 0 ? "positive" : "negative";
  const currentStoneLabel = currentTone === "positive" ? "양돌" : "음돌";
  const currentPlacedCount =
    currentTone === "positive" ? placedPositive : placedNegative;
  const currentTrayStones =
    currentTone === "positive" ? trayPositiveStones : trayNegativeStones;
  const currentPhaseIndex = phaseOrder.indexOf(phase);
  const stoneValue =
    problem.gridDenominator === 1 ? "1" : `1/${problem.gridDenominator}`;

  useEffect(() => {
    startedAtRef.current = Date.now();
  }, [phase, termIndex]);

  useEffect(() => {
    return () => {
      timeoutIdsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, []);

  function nextAttempt(stepId: string) {
    const next = (attemptMapRef.current[stepId] ?? 0) + 1;
    attemptMapRef.current[stepId] = next;
    return next;
  }

  function nextStoneId() {
    stoneIdRef.current += 1;
    return stoneIdRef.current;
  }

  function queueTimeout(callback: () => void, delay: number) {
    const timeoutId = window.setTimeout(() => {
      timeoutIdsRef.current = timeoutIdsRef.current.filter(
        (activeTimeoutId) => activeTimeoutId !== timeoutId,
      );
      callback();
    }, delay);

    timeoutIdsRef.current.push(timeoutId);
  }

  function createStoneBatch(count: number): StoneToken[] {
    return Array.from({ length: count }, () => ({
      id: nextStoneId(),
      animation: "enter",
    }));
  }

  function clearStoneTokens(
    stones: StoneToken[],
    setStones: Dispatch<SetStateAction<StoneToken[]>>,
  ) {
    const removableIds = stones
      .filter((stone) => stone.animation !== "leave")
      .map((stone) => stone.id);

    if (removableIds.length === 0) {
      return;
    }

    const removableIdsSet = new Set(removableIds);

    setStones((currentStones) =>
      currentStones.map((stone) =>
        removableIdsSet.has(stone.id)
          ? { ...stone, animation: "leave" }
          : stone,
      ),
    );

    queueTimeout(() => {
      setStones((currentStones) =>
        currentStones.filter((stone) => !removableIdsSet.has(stone.id)),
      );
    }, STONE_EXIT_MS);
  }

  function addTrayStone(tone: "positive" | "negative") {
    const newStone = createStoneBatch(1);

    if (tone === "positive") {
      setPlacedPositive((value) => value + 1);
      setTrayPositiveStones((stones) => [...stones, ...newStone]);
      return;
    }

    setPlacedNegative((value) => value + 1);
    setTrayNegativeStones((stones) => [...stones, ...newStone]);
  }

  function removeTrayStone(tone: "positive" | "negative") {
    if (tone === "positive") {
      if (placedPositive === 0) {
        return;
      }

      const targetStone = [...trayPositiveStones]
        .reverse()
        .find((stone) => stone.animation !== "leave");

      setPlacedPositive((value) => Math.max(0, value - 1));

      if (!targetStone) {
        return;
      }

      setTrayPositiveStones((stones) =>
        stones.map((stone) =>
          stone.id === targetStone.id ? { ...stone, animation: "leave" } : stone,
        ),
      );

      queueTimeout(() => {
        setTrayPositiveStones((stones) =>
          stones.filter((stone) => stone.id !== targetStone.id),
        );
      }, STONE_EXIT_MS);

      return;
    }

    if (placedNegative === 0) {
      return;
    }

    const targetStone = [...trayNegativeStones]
      .reverse()
      .find((stone) => stone.animation !== "leave");

    setPlacedNegative((value) => Math.max(0, value - 1));

    if (!targetStone) {
      return;
    }

    setTrayNegativeStones((stones) =>
      stones.map((stone) =>
        stone.id === targetStone.id ? { ...stone, animation: "leave" } : stone,
      ),
    );

    queueTimeout(() => {
      setTrayNegativeStones((stones) =>
        stones.filter((stone) => stone.id !== targetStone.id),
      );
    }, STONE_EXIT_MS);
  }

  function renderStoneStack(
    label: string,
    count: number,
    stones: StoneToken[],
    tone: "positive" | "negative",
    emptyText: string,
  ) {
    const previewStones = stones.slice(-STONE_PREVIEW_LIMIT);
    const visibleCount = previewStones.filter(
      (stone) => stone.animation !== "leave",
    ).length;
    const hiddenCount = Math.max(0, count - visibleCount);

    return (
      <div className="rounded-[1.7rem] border border-[var(--line)] bg-white/92 p-4 shadow-[0_10px_22px_rgba(19,34,56,0.05)]">
        <div className="flex items-center justify-between gap-3">
          <p className="text-base font-semibold text-[var(--ink-strong)]">{label}</p>
          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-[var(--ink-soft)]">
            {count}개
          </span>
        </div>
        <div className="stone-stack mt-4 flex min-h-24 flex-wrap content-start gap-2">
          {previewStones.length > 0 ? (
            previewStones.map((stone, index) => (
              <span
                key={stone.id}
                className={`stone-chip ${
                  tone === "positive"
                    ? "stone-chip-positive"
                    : "stone-chip-negative"
                }`}
                data-animation={stone.animation}
                style={
                  {
                    "--stone-delay": `${Math.min(index, 6) * 45}ms`,
                  } as CSSProperties
                }
              >
                {tone === "positive" ? "+" : "-"}
              </span>
            ))
          ) : (
            <p className="rounded-2xl border border-dashed border-[var(--line)] px-4 py-3 text-sm text-[var(--ink-soft)]/80">
              {emptyText}
            </p>
          )}
          {hiddenCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-stone-100 px-3 py-1 text-sm font-semibold text-stone-700">
              +{hiddenCount}개
            </span>
          )}
        </div>
      </div>
    );
  }

  async function submitPlacement() {
    if (!currentTerm || typeof currentUnits !== "number") {
      return;
    }

    const stepId = `place-term-${termIndex + 1}`;
    const attemptNo = nextAttempt(stepId);
    const responseTimeMs = Date.now() - startedAtRef.current;
    const isPositive = currentTerm.numerator > 0;
    const isCorrect =
      (isPositive && placedPositive === currentUnits && placedNegative === 0) ||
      (!isPositive && placedNegative === currentUnits && placedPositive === 0);

    await onAttempt({
      stepId,
      attemptNo,
      inputRaw: `+${placedPositive}, -${placedNegative}`,
      normalizedInput: `${problem.terms[termIndex]} => ${isCorrect ? "ok" : "retry"}`,
      isCorrect,
      responseTimeMs,
      flushNow: isCorrect,
    });

    if (!isCorrect) {
      setRetryCount((value) => value + 1);
      setFeedback({
        tone: "warning",
        message: `${currentStoneLabel}만 ${currentUnits}개 놓으면 됩니다.`,
      });
      return;
    }

    setBoardPositive((value) => value + placedPositive);
    setBoardNegative((value) => value + placedNegative);
    setBoardPositiveStones((stones) => [...stones, ...createStoneBatch(placedPositive)]);
    setBoardNegativeStones((stones) => [...stones, ...createStoneBatch(placedNegative)]);
    clearStoneTokens(trayPositiveStones, setTrayPositiveStones);
    clearStoneTokens(trayNegativeStones, setTrayNegativeStones);
    setPlacedPositive(0);
    setPlacedNegative(0);

    if (termIndex === problem.terms.length - 1) {
      setPhase("cancel");
      setFeedback({
        tone: "success",
        message: "이제 양돌과 음돌이 몇 쌍 사라지는지 찾아보세요.",
      });
      return;
    }

    setTermIndex((value) => value + 1);
    setFeedback({
      tone: "success",
      message: "좋아요. 다음 항도 같은 방법으로 해 보세요.",
    });
  }

  async function submitCancellation() {
    const stepId = "predict-zero-pairs";
    const attemptNo = nextAttempt(stepId);
    const responseTimeMs = Date.now() - startedAtRef.current;
    const expected = Math.min(boardPositive, boardNegative);
    const isCorrect = Number.parseInt(cancelInput, 10) === expected;

    await onAttempt({
      stepId,
      attemptNo,
      inputRaw: cancelInput,
      normalizedInput: `${expected}`,
      isCorrect,
      responseTimeMs,
      flushNow: isCorrect,
    });

    if (!isCorrect) {
      setRetryCount((value) => value + 1);
      setFeedback({
        tone: "warning",
        message: "양돌 수와 음돌 수 중 더 작은 수가 0쌍입니다.",
      });
      return;
    }

    if (expected === 0) {
      setPhase("result");
      setFeedback({
        tone: "success",
        message: "사라질 0쌍이 없습니다. 남은 돌의 값을 적어 보세요.",
      });
      return;
    }

    const positiveIds = boardPositiveStones
      .filter((stone) => stone.animation !== "leave")
      .slice(-expected)
      .map((stone) => stone.id);
    const negativeIds = boardNegativeStones
      .filter((stone) => stone.animation !== "leave")
      .slice(-expected)
      .map((stone) => stone.id);
    const positiveIdsSet = new Set(positiveIds);
    const negativeIdsSet = new Set(negativeIds);

    setIsAnimatingCancellation(true);
    setBoardPositiveStones((stones) =>
      stones.map((stone) =>
        positiveIdsSet.has(stone.id)
          ? { ...stone, animation: "cancel" }
          : stone,
      ),
    );
    setBoardNegativeStones((stones) =>
      stones.map((stone) =>
        negativeIdsSet.has(stone.id)
          ? { ...stone, animation: "cancel" }
          : stone,
      ),
    );
    setFeedback({
      tone: "success",
      message: "맞았습니다. 0쌍이 사라지고 있어요.",
    });

    queueTimeout(() => {
      setBoardPositiveStones((stones) =>
        stones.filter((stone) => !positiveIdsSet.has(stone.id)),
      );
      setBoardNegativeStones((stones) =>
        stones.filter((stone) => !negativeIdsSet.has(stone.id)),
      );
      setBoardPositive((value) => value - expected);
      setBoardNegative((value) => value - expected);
      setPhase("result");
      setIsAnimatingCancellation(false);
      setFeedback({
        tone: "success",
        message: "이제 남은 돌의 값을 답으로 쓰면 됩니다.",
      });
    }, STONE_CANCEL_MS);

    setCancelInput("");
  }

  async function submitResult() {
    const stepId = "submit-result";
    const attemptNo = nextAttempt(stepId);
    const responseTimeMs = Date.now() - startedAtRef.current;
    const expectedValue = parseRational(problem.answer);
    let isCorrect = false;

    try {
      isCorrect = equalsRational(parseRational(resultInput), expectedValue);
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
        message: "남은 돌 수와 부호를 다시 보고 써 보세요.",
      });
      return;
    }

    setFeedback({
      tone: "success",
      message: "정답입니다. 다음 문제로 넘어갑니다.",
    });
    onComplete({ retriesUsed: retryCount });
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {phaseOrder.map((key, index) => {
          const isActive = key === phase;
          const isDone = index < currentPhaseIndex;

          return (
            <div
              key={key}
              className={`rounded-[1.45rem] border px-4 py-4 ${
                isActive
                  ? "border-sky-300 bg-sky-50"
                  : isDone
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-[var(--line)] bg-white/88"
              }`}
            >
              <p
                className={`text-xs font-semibold uppercase tracking-[0.16em] ${
                  isActive
                    ? "text-sky-700"
                    : isDone
                      ? "text-emerald-700"
                      : "text-[var(--ink-soft)]"
                }`}
              >
                {isDone ? "완료" : isActive ? "지금" : "다음"}
              </p>
              <p className="mt-2 text-lg font-semibold text-[var(--ink-strong)]">
                {phaseLabels[key]}
              </p>
            </div>
          );
        })}
      </div>

      {phase === "place" && currentTerm && typeof currentUnits === "number" && (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
          <section className="rounded-[1.9rem] border border-sky-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(240,249,255,0.95))] p-5 shadow-[0_16px_32px_rgba(14,165,233,0.1)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
              지금 할 일
            </p>
            <p className="mt-3 text-sm font-semibold text-[var(--ink-soft)]">
              항 {termIndex + 1} / {problem.terms.length}
            </p>
            <h2 className="mt-1 font-[var(--font-display)] text-[2.6rem] leading-none tracking-[-0.05em] text-[var(--ink-strong)] md:text-[3.1rem]">
              {problem.terms[termIndex]}
            </h2>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.35rem] border border-sky-100 bg-white/90 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                  놓을 돌
                </p>
                <p className="mt-2 text-xl font-semibold text-[var(--ink-strong)]">
                  {currentStoneLabel}
                </p>
              </div>
              <div className="rounded-[1.35rem] border border-sky-100 bg-white/90 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                  목표 개수
                </p>
                <p className="mt-2 text-xl font-semibold text-[var(--ink-strong)]">
                  {currentUnits}개
                </p>
              </div>
              <div className="rounded-[1.35rem] border border-sky-100 bg-white/90 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                  돌 1개 값
                </p>
                <p className="mt-2 text-xl font-semibold text-[var(--ink-strong)]">
                  {stoneValue}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Button
                tone="secondary"
                block
                className="py-4 text-base"
                onClick={() => addTrayStone(currentTone)}
              >
                {currentStoneLabel} 1개 놓기
              </Button>
              <Button
                tone="ghost"
                block
                className="bg-white py-4 text-base"
                onClick={() => removeTrayStone(currentTone)}
              >
                {currentStoneLabel} 1개 빼기
              </Button>
            </div>

            <div className="mt-4 rounded-[1.35rem] border border-dashed border-sky-200 bg-white/76 px-4 py-4 text-sm font-medium text-[var(--ink-soft)]">
              규칙: 다른 색 돌은 놓지 않고, 맞는 개수만 놓기
            </div>

            <Button className="mt-5 py-4 text-base" block onClick={submitPlacement}>
              이번 항 확인
            </Button>
          </section>

          {renderStoneStack(
            `준비한 ${currentStoneLabel}`,
            currentPlacedCount,
            currentTrayStones,
            currentTone,
            `${currentStoneLabel} 버튼을 눌러 보세요.`,
          )}
        </div>
      )}

      {phase === "cancel" && (
        <section className="rounded-[1.9rem] border border-amber-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,247,237,0.95))] p-5 shadow-[0_16px_32px_rgba(249,115,22,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
            지금 할 일
          </p>
          <h2 className="mt-2 font-[var(--font-display)] text-[2.3rem] leading-none tracking-[-0.05em] text-[var(--ink-strong)] md:text-[2.8rem]">
            0쌍은 몇 개?
          </h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.35rem] border border-amber-100 bg-white/90 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                양돌
              </p>
              <p className="mt-2 text-xl font-semibold text-[var(--ink-strong)]">
                {boardPositive}개
              </p>
            </div>
            <div className="rounded-[1.35rem] border border-amber-100 bg-white/90 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                음돌
              </p>
              <p className="mt-2 text-xl font-semibold text-[var(--ink-strong)]">
                {boardNegative}개
              </p>
            </div>
            <div className="rounded-[1.35rem] border border-amber-100 bg-white/90 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                힌트
              </p>
              <p className="mt-2 text-base font-semibold text-[var(--ink-strong)]">
                더 적은 쪽만큼 사라져요
              </p>
            </div>
          </div>

          <input
            value={cancelInput}
            onChange={(event) => setCancelInput(event.target.value)}
            className="field mt-5 text-lg"
            inputMode="numeric"
            placeholder="예: 3"
            disabled={isAnimatingCancellation}
          />
          <Button
            className="mt-4 py-4 text-base"
            block
            onClick={submitCancellation}
            disabled={isAnimatingCancellation}
          >
            0쌍 제출
          </Button>
        </section>
      )}

      {phase === "result" && (
        <section className="rounded-[1.9rem] border border-emerald-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(236,253,245,0.94))] p-5 shadow-[0_16px_32px_rgba(16,185,129,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
            지금 할 일
          </p>
          <h2 className="mt-2 font-[var(--font-display)] text-[2.3rem] leading-none tracking-[-0.05em] text-[var(--ink-strong)] md:text-[2.8rem]">
            남은 돌의 값 쓰기
          </h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.35rem] border border-emerald-100 bg-white/90 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                양돌
              </p>
              <p className="mt-2 text-xl font-semibold text-[var(--ink-strong)]">
                {boardPositive}개
              </p>
            </div>
            <div className="rounded-[1.35rem] border border-emerald-100 bg-white/90 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                음돌
              </p>
              <p className="mt-2 text-xl font-semibold text-[var(--ink-strong)]">
                {boardNegative}개
              </p>
            </div>
            <div className="rounded-[1.35rem] border border-emerald-100 bg-white/90 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                돌 1개 값
              </p>
              <p className="mt-2 text-xl font-semibold text-[var(--ink-strong)]">
                {stoneValue}
              </p>
            </div>
          </div>

          <input
            value={resultInput}
            onChange={(event) => setResultInput(event.target.value)}
            className="field mt-5 text-lg"
            placeholder="예: -2 또는 1/3"
          />
          <Button className="mt-4 py-4 text-base" block onClick={submitResult}>
            답 제출
          </Button>
        </section>
      )}

      <FeedbackBanner tone={feedback.tone} message={feedback.message} />

      <section className="rounded-[1.9rem] border border-[var(--line)] bg-white/88 p-5 shadow-[0_16px_30px_rgba(19,34,56,0.05)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-soft)]">
              보드
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
              양돌과 음돌 보기
            </h2>
          </div>
          <div className="rounded-full bg-stone-100 px-4 py-2 text-sm font-semibold text-[var(--ink-soft)]">
            양돌 {boardPositive}개 · 음돌 {boardNegative}개
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {renderStoneStack(
            "양돌",
            boardPositive,
            boardPositiveStones,
            "positive",
            "아직 놓인 양돌이 없습니다.",
          )}
          {renderStoneStack(
            "음돌",
            boardNegative,
            boardNegativeStones,
            "negative",
            "아직 놓인 음돌이 없습니다.",
          )}
        </div>
      </section>
    </div>
  );
}
