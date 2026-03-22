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

const STONE_PREVIEW_LIMIT = 18;
const STONE_EXIT_MS = 240;
const STONE_CANCEL_MS = 640;

export function CountingStonesChallenge({
  difficulty,
  problem,
  onAttempt,
  onComplete,
}: CountingStonesChallengeProps) {
  const termValues = problem.terms.map((term) => parseRational(term));
  const [phase, setPhase] = useState<"place" | "cancel" | "result">("place");
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
        ? "항별로 돌을 놓고, 마지막에 몇 쌍이 사라지는지 판단해 보세요."
        : "현재 항에 맞는 돌을 놓아 보세요.",
  });
  const [retryCount, setRetryCount] = useState(0);
  const attemptMapRef = useRef<Record<string, number>>({});
  const startedAtRef = useRef(Date.now());
  const stoneIdRef = useRef(0);
  const timeoutIdsRef = useRef<number[]>([]);

  const currentTerm = termValues[termIndex];
  const currentUnits =
    currentTerm && rationalToUnits(absRational(currentTerm), problem.gridDenominator);

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
    options?: {
      helperText?: string;
      emptyText?: string;
    },
  ) {
    const previewStones = stones.slice(-STONE_PREVIEW_LIMIT);
    const visibleCount = previewStones.filter(
      (stone) => stone.animation !== "leave",
    ).length;
    const hiddenCount = Math.max(0, count - visibleCount);

    return (
      <div className="rounded-3xl bg-white/75 p-4">
        <p className="text-sm font-semibold text-[var(--ink-soft)]">{label}</p>
        <div className="stone-stack mt-3 flex min-h-24 flex-wrap content-start gap-2">
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
              {options?.emptyText ?? "아직 놓인 돌이 없습니다."}
            </p>
          )}
          {hiddenCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-stone-100 px-3 text-sm font-semibold text-stone-700">
              +{hiddenCount}개
            </span>
          )}
        </div>
        <p className="mt-3 text-sm text-[var(--ink-soft)]">현재 {count}개</p>
        {options?.helperText && (
          <p className="mt-1 text-xs leading-5 text-[var(--ink-soft)]/80">
            {options.helperText}
          </p>
        )}
      </div>
    );
  }

  async function submitPlacement() {
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
        message:
          "현재 항의 부호와 크기를 다시 확인해 보세요. 이번 단계만 다시 하면 됩니다.",
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
        message: "모든 돌을 놓았습니다. 이제 몇 쌍이 0으로 사라지는지 생각해 보세요.",
      });
      return;
    }

    setTermIndex((value) => value + 1);
    setFeedback({
      tone: "success",
      message: "좋습니다. 다음 항을 같은 방식으로 돌로 바꿔 보세요.",
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
        message:
          "양돌과 음돌이 서로 짝을 이루는 수를 다시 세어 보세요. 더 적은 쪽이 사라지는 쌍의 수입니다.",
      });
      return;
    }

    if (expected === 0) {
      setPhase("result");
      setFeedback({
        tone: "success",
        message: "0쌍입니다. 남은 돌의 뜻을 최종 값으로 적어 보세요.",
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
      message: "짝이 된 양돌과 음돌이 0이 되며 사라집니다. 남는 돌을 끝까지 보세요.",
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
        message: "잘 찾았습니다. 이제 남은 돌 수를 유리수로 적어 보세요.",
      });
    }, STONE_CANCEL_MS);

    setCancelInput("");
    return;
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
        message:
          "남은 양돌과 음돌의 차이를 다시 보고 최종 부호까지 함께 확인해 보세요.",
      });
      return;
    }

    setFeedback({
      tone: "success",
      message: "셈돌 모델 해결 완료. 다음 문항으로 넘어갑니다.",
    });
    onComplete({ retriesUsed: retryCount });
  }

  const stoneValue =
    problem.gridDenominator === 1 ? "1" : `1/${problem.gridDenominator}`;

  return (
    <div className="grid gap-5">
      <div className="rounded-[2rem] bg-white/70 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--sea)]">
              셈돌 보드
            </p>
            <h2 className="mt-1 font-[var(--font-display)] text-3xl">
              {problem.expression}
            </h2>
          </div>
          <div className="rounded-2xl bg-[var(--ink-strong)] px-4 py-3 text-sm text-white">
            돌 1개 = {stoneValue}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {renderStoneStack("양돌", boardPositive, boardPositiveStones, "positive", {
          helperText: "보드 위 양의 돌입니다.",
          emptyText: "아직 놓인 양돌이 없습니다.",
        })}
        {renderStoneStack("음돌", boardNegative, boardNegativeStones, "negative", {
          helperText: "보드 위 음의 돌입니다.",
          emptyText: "아직 놓인 음돌이 없습니다.",
        })}
      </div>

      <FeedbackBanner tone={feedback.tone} message={feedback.message} />

      {phase === "place" && currentTerm && (
        <div className="rounded-[2rem] bg-white/80 p-5">
          <p className="text-sm font-semibold text-[var(--ink-soft)]">
            현재 항 {termIndex + 1} / {problem.terms.length}
          </p>
          <h3 className="mt-2 font-[var(--font-display)] text-3xl">
            {problem.terms[termIndex]}
          </h3>
          <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
            필요한 돌 수를 맞춘 뒤 제출하세요. 양수는 양돌, 음수는 음돌을 놓으면 됩니다.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Button
              tone="ghost"
              onClick={() => addTrayStone("positive")}
            >
              양돌 1개 놓기
            </Button>
            <Button
              tone="ghost"
              onClick={() => addTrayStone("negative")}
            >
              음돌 1개 놓기
            </Button>
            <Button
              tone="ghost"
              onClick={() => removeTrayStone("positive")}
            >
              양돌 1개 되돌리기
            </Button>
            <Button
              tone="ghost"
              onClick={() => removeTrayStone("negative")}
            >
              음돌 1개 되돌리기
            </Button>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {renderStoneStack(
              "준비한 양돌",
              placedPositive,
              trayPositiveStones,
              "positive",
              {
                helperText: "현재 항에 쓸 양의 돌입니다.",
                emptyText: "버튼으로 양돌을 추가해 보세요.",
              },
            )}
            {renderStoneStack(
              "준비한 음돌",
              placedNegative,
              trayNegativeStones,
              "negative",
              {
                helperText: "현재 항에 쓸 음의 돌입니다.",
                emptyText: "버튼으로 음돌을 추가해 보세요.",
              },
            )}
          </div>
          <div className="mt-5 rounded-3xl bg-stone-50 p-4 text-sm text-[var(--ink-soft)]">
            현재 배치: 양돌 {placedPositive}개 / 음돌 {placedNegative}개
          </div>
          <Button className="mt-5" onClick={submitPlacement}>
            이번 항 반영
          </Button>
        </div>
      )}

      {phase === "cancel" && (
        <div className="rounded-[2rem] bg-white/80 p-5">
          <h3 className="font-[var(--font-display)] text-3xl">0쌍 예측</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
            양돌과 음돌이 몇 쌍 사라질지 적어 보세요.
          </p>
          <input
            value={cancelInput}
            onChange={(event) => setCancelInput(event.target.value)}
            className="mt-5 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
            inputMode="numeric"
            placeholder="예: 3"
            disabled={isAnimatingCancellation}
          />
          <Button
            className="mt-4"
            onClick={submitCancellation}
            disabled={isAnimatingCancellation}
          >
            쌍 수 제출
          </Button>
        </div>
      )}

      {phase === "result" && (
        <div className="rounded-[2rem] bg-white/80 p-5">
          <h3 className="font-[var(--font-display)] text-3xl">최종 값 제출</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
            남은 돌이 뜻하는 값을 정수, 분수, 소수 중 편한 형식으로 적으세요.
          </p>
          <input
            value={resultInput}
            onChange={(event) => setResultInput(event.target.value)}
            className="mt-5 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
            placeholder="예: -2 또는 1/3"
          />
          <Button className="mt-4" onClick={submitResult}>
            결과 제출
          </Button>
        </div>
      )}
    </div>
  );
}
