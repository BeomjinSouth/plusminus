"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/common/button";
import { FeedbackBanner } from "@/components/common/feedback-banner";
import { addRational, equalsRational, parseRational, rationalToString, type Rational } from "@/lib/rational";
import { getDeliveryAction, parseSignedSegment } from "@/lib/expression";
import type {
  ChallengeAttempt,
  ChallengeComplete,
  DeliveryActionKey,
  Difficulty,
  Problem,
} from "@/lib/types";

type PostmanChallengeProps = {
  difficulty: Difficulty;
  problem: Problem;
  onAttempt: (attempt: ChallengeAttempt) => void | Promise<void>;
  onComplete: (result: ChallengeComplete) => void;
};

const actionCards: Array<{
  key: DeliveryActionKey;
  label: string;
  description: string;
}> = [
  {
    key: "reward-in",
    label: "보상 카드 가져오기",
    description: "점수가 커지는 장면",
  },
  {
    key: "reward-out",
    label: "보상 카드 가져가기",
    description: "좋은 카드를 없애 점수가 줄어드는 장면",
  },
  {
    key: "penalty-in",
    label: "벌점 카드 가져오기",
    description: "벌점이 들어와 점수가 내려가는 장면",
  },
  {
    key: "penalty-out",
    label: "벌점 카드 가져가기",
    description: "벌점이 사라져 점수가 올라가는 장면",
  },
];

export function PostmanChallenge({
  difficulty,
  problem,
  onAttempt,
  onComplete,
}: PostmanChallengeProps) {
  const segments = problem.rawSplit;
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [currentTotal, setCurrentTotal] = useState<Rational>({
    numerator: 0,
    denominator: 1,
  });
  const [resultInput, setResultInput] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [feedback, setFeedback] = useState<{
    tone: "info" | "success" | "warning";
    message: string;
  }>({
    tone: "info",
    message:
      difficulty === "low"
        ? "각 조각이 점수를 올리는지 내리는지 이야기로 읽어 보세요."
        : "가져옴/가져감과 보상/벌점의 조합을 골라 보세요.",
  });
  const [storyLog, setStoryLog] = useState<string[]>([]);
  const attemptMapRef = useRef<Record<string, number>>({});
  const startedAtRef = useRef(Date.now());

  useEffect(() => {
    startedAtRef.current = Date.now();
  }, [segmentIndex, storyLog.length]);

  function nextAttempt(stepId: string) {
    const next = (attemptMapRef.current[stepId] ?? 0) + 1;
    attemptMapRef.current[stepId] = next;
    return next;
  }

  async function chooseAction(action: DeliveryActionKey) {
    const stepId = `delivery-${segmentIndex + 1}`;
    const attemptNo = nextAttempt(stepId);
    const responseTimeMs = Date.now() - startedAtRef.current;
    const segment = segments[segmentIndex];
    const expectedAction = getDeliveryAction(segment);
    const parsed = parseSignedSegment(segment);
    const isCorrect = action === expectedAction;

    await onAttempt({
      stepId,
      attemptNo,
      inputRaw: action,
      normalizedInput: expectedAction,
      isCorrect,
      responseTimeMs,
      flushNow: isCorrect,
    });

    if (!isCorrect) {
      setRetryCount((value) => value + 1);
      setFeedback({
        tone: "warning",
        message:
          "연산 기호는 가져옴/가져감, 수의 부호는 보상/벌점을 뜻합니다. 두 층위를 분리해서 다시 보세요.",
      });
      return;
    }

    setCurrentTotal((value) => addRational(value, parsed.value));
    setStoryLog((value) => [
      ...value,
      `${segment} → ${actionCards.find((card) => card.key === action)?.label}`,
    ]);

    if (segmentIndex === segments.length - 1) {
      setSegmentIndex((value) => value + 1);
      setFeedback({
        tone: "success",
        message: "모든 배달 장면을 골랐습니다. 이제 최종 값을 적어 보세요.",
      });
      return;
    }

    setSegmentIndex((value) => value + 1);
    setFeedback({
      tone: "success",
      message: "좋습니다. 다음 조각도 같은 방식으로 읽어 보세요.",
    });
  }

  async function submitResult() {
    const stepId = "submit-result";
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
        message:
          "벌점 카드가 사라졌는지, 보상 카드가 추가됐는지를 순서대로 다시 떠올려 보세요.",
      });
      return;
    }

    setFeedback({
      tone: "success",
      message: "우체부 모델 해결 완료. 다음 문항으로 넘어갑니다.",
    });
    onComplete({ retriesUsed: retryCount });
  }

  const currentSegment = segments[segmentIndex];

  return (
    <div className="grid gap-5">
      <div className="rounded-[2rem] bg-white/75 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--berry)]">
              우체부 미션
            </p>
            <h2 className="mt-1 font-[var(--font-display)] text-3xl">
              {problem.expression}
            </h2>
          </div>
          <div className="rounded-2xl bg-[var(--sea)] px-4 py-3 text-sm text-white">
            현재 누적값: {rationalToString(currentTotal)}
          </div>
        </div>
      </div>

      <FeedbackBanner tone={feedback.tone} message={feedback.message} />

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[2rem] bg-white/75 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--ink-soft)]">
            배달 기록
          </p>
          <div className="mt-4 grid gap-3">
            {storyLog.length === 0 && (
              <p className="text-sm leading-6 text-[var(--ink-soft)]">
                아직 선택한 배달 장면이 없습니다.
              </p>
            )}
            {storyLog.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm text-[var(--ink-soft)]"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        {segmentIndex < segments.length ? (
          <div className="rounded-[2rem] bg-white/80 p-5">
            <p className="text-sm font-semibold text-[var(--ink-soft)]">
              현재 조각 {segmentIndex + 1} / {segments.length}
            </p>
            <h3 className="mt-2 font-[var(--font-display)] text-4xl">
              {currentSegment}
            </h3>
            <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">
              이 조각을 이야기로 번역하면 어떤 장면일까요?
            </p>
            <div className="mt-5 grid gap-3">
              {actionCards.map((card) => (
                <button
                  key={card.key}
                  type="button"
                  onClick={() => chooseAction(card.key)}
                  className="rounded-3xl border border-[var(--line)] bg-white px-4 py-4 text-left transition hover:border-[var(--sea)] hover:-translate-y-0.5"
                >
                  <p className="font-semibold">{card.label}</p>
                  <p className="mt-1 text-sm leading-6 text-[var(--ink-soft)]">
                    {card.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-[2rem] bg-white/80 p-5">
            <h3 className="font-[var(--font-display)] text-3xl">최종 값 제출</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
              모든 배달 장면을 반영한 뒤 남은 최종 값을 적으세요.
            </p>
            <input
              value={resultInput}
              onChange={(event) => setResultInput(event.target.value)}
              className="mt-5 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
              placeholder="예: 6 또는 1/3"
            />
            <Button className="mt-4" onClick={submitResult}>
              결과 제출
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
