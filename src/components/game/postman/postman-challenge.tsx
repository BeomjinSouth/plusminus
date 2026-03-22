"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/common/button";
import { FeedbackBanner } from "@/components/common/feedback-banner";
import { getDeliveryAction, parseSignedSegment } from "@/lib/expression";
import { equalsRational, parseRational, rationalToString } from "@/lib/rational";
import type {
  ChallengeAttempt,
  ChallengeComplete,
  DeliveryActionKey,
  Difficulty,
  Problem,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type PostmanChallengeProps = {
  difficulty: Difficulty;
  problem: Problem;
  onAttempt: (attempt: ChallengeAttempt) => void | Promise<void>;
  onComplete: (result: ChallengeComplete) => void;
};

type ActionCardDefinition = {
  key: DeliveryActionKey;
  title: string;
  description: string;
  effect: string;
  badge: string;
  movement: string;
  symbol: string;
  buttonClass: string;
  badgeClass: string;
  iconClass: string;
  previewClass: string;
};

type StoryBeat = {
  id: string;
  segment: string;
  action: DeliveryActionKey;
  deltaText: string;
  magnitudeText: string;
};

const actionCards: ActionCardDefinition[] = [
  {
    key: "reward-in",
    title: "보상 카드가 들어와요",
    description: "좋은 카드가 점수판 안으로 들어오는 장면",
    effect: "점수가 커져요",
    badge: "보상 +",
    movement: "들어와요",
    symbol: "+",
    buttonClass:
      "border-emerald-200 bg-[linear-gradient(160deg,rgba(255,255,255,0.97),rgba(236,253,245,0.98))] hover:border-emerald-400 hover:shadow-[0_18px_38px_rgba(16,185,129,0.18)]",
    badgeClass: "bg-emerald-100 text-emerald-900",
    iconClass:
      "bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.9),transparent_32%),linear-gradient(155deg,#34d399,#059669)] text-white shadow-[0_18px_28px_rgba(5,150,105,0.24)]",
    previewClass: "bg-[linear-gradient(160deg,#ecfdf5,#d1fae5)] text-emerald-950",
  },
  {
    key: "reward-out",
    title: "보상 카드가 나가요",
    description: "좋은 카드가 점수판 밖으로 빠져나가는 장면",
    effect: "점수가 작아져요",
    badge: "보상 +",
    movement: "나가요",
    symbol: "+",
    buttonClass:
      "border-sky-200 bg-[linear-gradient(160deg,rgba(255,255,255,0.97),rgba(239,246,255,0.98))] hover:border-sky-400 hover:shadow-[0_18px_38px_rgba(14,165,233,0.18)]",
    badgeClass: "bg-sky-100 text-sky-900",
    iconClass:
      "bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.9),transparent_32%),linear-gradient(155deg,#38bdf8,#2563eb)] text-white shadow-[0_18px_28px_rgba(37,99,235,0.24)]",
    previewClass: "bg-[linear-gradient(160deg,#eff6ff,#dbeafe)] text-sky-950",
  },
  {
    key: "penalty-in",
    title: "벌점 카드가 들어와요",
    description: "아쉬운 카드가 점수판 안으로 들어오는 장면",
    effect: "점수가 작아져요",
    badge: "벌점 -",
    movement: "들어와요",
    symbol: "-",
    buttonClass:
      "border-amber-200 bg-[linear-gradient(160deg,rgba(255,255,255,0.97),rgba(255,247,237,0.98))] hover:border-amber-400 hover:shadow-[0_18px_38px_rgba(245,158,11,0.18)]",
    badgeClass: "bg-amber-100 text-amber-900",
    iconClass:
      "bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.9),transparent_32%),linear-gradient(155deg,#fbbf24,#f97316)] text-white shadow-[0_18px_28px_rgba(249,115,22,0.24)]",
    previewClass: "bg-[linear-gradient(160deg,#fff7ed,#ffedd5)] text-amber-950",
  },
  {
    key: "penalty-out",
    title: "벌점 카드가 나가요",
    description: "아쉬운 카드가 점수판 밖으로 사라지는 장면",
    effect: "점수가 커져요",
    badge: "벌점 -",
    movement: "나가요",
    symbol: "-",
    buttonClass:
      "border-rose-200 bg-[linear-gradient(160deg,rgba(255,255,255,0.97),rgba(255,241,242,0.98))] hover:border-rose-400 hover:shadow-[0_18px_38px_rgba(244,63,94,0.16)]",
    badgeClass: "bg-rose-100 text-rose-900",
    iconClass:
      "bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.9),transparent_32%),linear-gradient(155deg,#fb7185,#e11d48)] text-white shadow-[0_18px_28px_rgba(225,29,72,0.24)]",
    previewClass: "bg-[linear-gradient(160deg,#fff1f2,#ffe4e6)] text-rose-950",
  },
];

const actionCardMap = actionCards.reduce<Record<DeliveryActionKey, ActionCardDefinition>>(
  (map, card) => {
    map[card.key] = card;
    return map;
  },
  {} as Record<DeliveryActionKey, ActionCardDefinition>,
);

export function PostmanChallenge({
  difficulty,
  problem,
  onAttempt,
  onComplete,
}: PostmanChallengeProps) {
  const segments = problem.rawSplit;
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [resultInput, setResultInput] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [feedback, setFeedback] = useState<{
    tone: "info" | "success" | "warning";
    message: string;
  }>({
    tone: "info",
    message:
      difficulty === "low"
        ? "식 한 조각씩 보면서 점수판에 어떤 카드가 들어오거나 나가는지 골라 보세요."
        : "앞 기호는 카드의 움직임, 괄호 안 기호는 카드의 종류예요. 맞는 장면 카드를 눌러 보세요.",
  });
  const [storyLog, setStoryLog] = useState<StoryBeat[]>([]);
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
          "앞 기호는 카드가 들어오거나 나가는 방향, 괄호 안 기호는 보상 카드인지 벌점 카드인지 알려줘요. 둘을 따로 읽어 보세요.",
      });
      return;
    }

    setStoryLog((value) => [
      ...value,
      {
        id: `scene-${segmentIndex + 1}`,
        segment,
        action,
        deltaText: rationalToString(parsed.value),
        magnitudeText: rationalToString(parsed.magnitude),
      },
    ]);

    if (segmentIndex === segments.length - 1) {
      setSegmentIndex((value) => value + 1);
      setFeedback({
        tone: "success",
        message: "장면 카드를 모두 골랐어요. 이제 마지막 점수를 적어 보세요.",
      });
      return;
    }

    setSegmentIndex((value) => value + 1);
    setFeedback({
      tone: "success",
      message: "좋아요. 다음 조각도 같은 방식으로 장면 카드로 바꿔 보세요.",
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
          "완성한 장면 모음을 다시 보면서 보상 카드와 벌점 카드가 얼마나 바뀌었는지 떠올려 보세요.",
      });
      return;
    }

    setFeedback({
      tone: "success",
      message: "카드 점수 미션 완료. 다음 문항으로 넘어갑니다.",
    });
    onComplete({ retriesUsed: retryCount });
  }

  const currentSegment = segmentIndex < segments.length ? segments[segmentIndex] : null;
  const lastScene = storyLog[storyLog.length - 1];
  const lastSceneCard = lastScene ? actionCardMap[lastScene.action] : null;

  return (
    <div className="grid gap-5">
      <section className="panel-strong overflow-hidden rounded-[2.4rem] px-6 py-6 md:px-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="eyebrow text-[var(--berry)]">카드 점수 미션</p>
            <h2 className="mt-3 font-[var(--font-display)] text-[2.35rem] leading-none tracking-[-0.04em] md:text-[3.2rem]">
              {problem.expression}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--ink-soft)] md:text-base">
              식을 숫자만 보지 말고, 점수판 안팎으로 카드가 움직이는 장면으로 바꿔
              보세요. 마지막 숫자는 맨 끝에 직접 적습니다.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.6rem] border border-[rgba(19,34,56,0.08)] bg-[var(--ink-strong)] px-4 py-3 text-white shadow-[0_20px_34px_rgba(19,34,56,0.18)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/68">
                완성한 장면
              </p>
              <p className="mt-2 font-[var(--font-display)] text-3xl leading-none">
                {storyLog.length}/{segments.length}
              </p>
            </div>
            <div className="rounded-[1.6rem] border border-[rgba(19,34,56,0.08)] bg-white/88 px-4 py-3 text-[var(--ink-strong)] shadow-[0_20px_34px_rgba(19,34,56,0.08)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                마지막 숫자
              </p>
              <p className="mt-2 font-[var(--font-display)] text-3xl leading-none">
                ?
              </p>
            </div>
          </div>
        </div>
      </section>

      <FeedbackBanner tone={feedback.tone} message={feedback.message} />

      <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="grid gap-4">
          <section className="panel overflow-hidden rounded-[2.25rem] p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="eyebrow text-[var(--berry)]">점수 쇼 무대</p>
                <h3 className="mt-2 font-[var(--font-display)] text-[2rem] leading-none tracking-[-0.03em]">
                  {currentSegment ?? "모든 장면 완성"}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">
                  {currentSegment
                    ? "이 조각을 보고 맞는 장면 카드를 오른쪽에서 골라 보세요."
                    : "왼쪽 장면 모음을 보고 마지막 점수를 떠올려 보세요."}
                </p>
              </div>
              {currentSegment && (
                <div className="rounded-full border border-[var(--line)] bg-white/88 px-4 py-2 text-sm font-semibold text-[var(--ink-strong)]">
                  조각 {segmentIndex + 1} / {segments.length}
                </div>
              )}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
              <div className="relative min-h-[260px] overflow-hidden rounded-[1.85rem] border border-[rgba(19,34,56,0.08)] bg-[radial-gradient(circle_at_top_left,rgba(253,230,138,0.28),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(20,184,166,0.14),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(250,245,238,0.9))] px-5 py-5">
                <span className="scene-preview-spark left-6 top-10" />
                <span className="scene-preview-spark right-14 top-16" />
                <span className="scene-preview-spark bottom-14 left-12" />

                <div className="absolute left-5 top-5 rounded-full bg-[var(--ink-strong)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/80">
                  score board
                </div>

                <div className="scene-preview-scoreboard absolute bottom-5 right-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                    마지막 숫자
                  </p>
                  <p className="mt-2 font-[var(--font-display)] text-5xl leading-none text-[var(--ink-strong)]">
                    ?
                  </p>
                </div>

                <div className="absolute right-5 top-5 rounded-[1.15rem] border border-[rgba(19,34,56,0.08)] bg-white/88 px-4 py-3 text-sm text-[var(--ink-soft)] shadow-[0_14px_26px_rgba(19,34,56,0.08)]">
                  {lastScene ? "방금 완성한 장면" : "첫 장면을 고르면 카드가 움직여요"}
                </div>

                <div
                  key={lastScene?.id ?? `mystery-${segmentIndex}`}
                  className={cn(
                    "scene-preview-card",
                    lastScene ? `scene-preview-card--${lastScene.action}` : "scene-preview-card--mystery",
                    lastSceneCard?.previewClass ?? "bg-white text-[var(--ink-strong)]",
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-white/78 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-strong)]">
                      {lastSceneCard?.badge ?? "mystery"}
                    </span>
                    <span className="rounded-full border border-white/65 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-strong)]/72">
                      {lastSceneCard?.movement ?? "guess"}
                    </span>
                  </div>
                  <p className="mt-4 font-[var(--font-display)] text-5xl leading-none">
                    {lastScene?.magnitudeText ?? "?"}
                  </p>
                  <p className="mt-3 text-sm font-semibold leading-5 text-[var(--ink-strong)]">
                    {lastSceneCard?.title ?? "어떤 카드가 움직일까요?"}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-[var(--ink-soft)]">
                    {lastScene ? `${lastScene.segment} → 변화 ${lastScene.deltaText}` : "보상 카드인지 벌점 카드인지, 들어오는지 나가는지 골라 보세요."}
                  </p>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="rounded-[1.45rem] border border-[var(--line)] bg-white/80 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sea)]">
                    읽는 힌트 1
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                    앞 기호는 카드가 들어오거나 나가는 움직임이에요.
                  </p>
                </div>
                <div className="rounded-[1.45rem] border border-[var(--line)] bg-white/80 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sun)]">
                    읽는 힌트 2
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                    괄호 안 기호는 보상 카드인지 벌점 카드인지 알려줘요.
                  </p>
                </div>
                <div className="rounded-[1.45rem] border border-[var(--line)] bg-white/80 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--berry)]">
                    읽는 힌트 3
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                    맞힌 장면은 아래 장면 모음에 차곡차곡 쌓여서 마지막 계산 힌트가 됩니다.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="panel rounded-[2rem] p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="eyebrow text-[var(--sea)]">완성한 장면 모음</p>
                <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                  맞힌 장면 카드가 스티커처럼 쌓입니다.
                </p>
              </div>
              <div className="rounded-full bg-white/88 px-4 py-2 text-sm font-semibold text-[var(--ink-strong)]">
                {storyLog.length}개 완성
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {storyLog.length === 0 && (
                <div className="rounded-[1.6rem] border border-dashed border-[var(--line-strong)] bg-white/72 px-5 py-6 text-sm leading-6 text-[var(--ink-soft)]">
                  아직 고른 장면이 없어요. 오른쪽에서 가장 잘 맞는 장면 카드를 눌러
                  보세요.
                </div>
              )}

              {storyLog.map((item, index) => {
                const scene = actionCardMap[item.action];

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "rounded-[1.6rem] border px-4 py-4 shadow-[0_14px_26px_rgba(19,34,56,0.07)]",
                      scene.buttonClass,
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">
                          장면 {index + 1}
                        </p>
                        <p className="mt-2 font-[var(--font-display)] text-[1.6rem] leading-none tracking-[-0.03em] text-[var(--ink-strong)]">
                          {scene.title}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                          {item.segment} → 변화 {item.deltaText}
                        </p>
                      </div>
                      <div className={cn("rounded-2xl px-3 py-2 text-sm font-semibold", scene.badgeClass)}>
                        {item.magnitudeText}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {currentSegment ? (
          <section className="panel-strong rounded-[2.25rem] p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="eyebrow text-[var(--berry)]">장면 카드 고르기</p>
                <h3 className="mt-2 font-[var(--font-display)] text-[2.1rem] leading-none tracking-[-0.03em]">
                  {currentSegment}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">
                  이 조각은 점수판에 어떤 일을 만들까요?
                </p>
              </div>
              <div className="rounded-full bg-[var(--ink-strong)] px-4 py-2 text-sm font-semibold text-white">
                조각 {segmentIndex + 1}/{segments.length}
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {actionCards.map((card) => (
                <button
                  key={card.key}
                  type="button"
                  onClick={() => chooseAction(card.key)}
                  className={cn(
                    "group relative overflow-hidden rounded-[1.8rem] border px-4 py-4 text-left transition duration-200 hover:-translate-y-1",
                    card.buttonClass,
                  )}
                >
                  <div className="absolute right-3 top-3 rounded-full border border-black/8 bg-white/82 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                    {card.movement}
                  </div>
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.2rem] text-3xl font-[var(--font-display)]",
                        card.iconClass,
                      )}
                    >
                      {card.symbol}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-2">
                        <span className={cn("rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]", card.badgeClass)}>
                          {card.badge}
                        </span>
                      </div>
                      <p className="mt-3 font-[var(--font-display)] text-[1.65rem] leading-none tracking-[-0.03em] text-[var(--ink-strong)]">
                        {card.title}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                        {card.description}
                      </p>
                      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                        {card.effect}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        ) : (
          <section className="panel-strong rounded-[2.25rem] p-5 md:p-6">
            <p className="eyebrow text-[var(--sea)]">마지막 숫자 적기</p>
            <h3 className="mt-3 font-[var(--font-display)] text-[2.4rem] leading-none tracking-[-0.04em]">
              점수판에 남은 숫자는?
            </h3>
            <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">
              왼쪽 장면 모음을 다시 보면서 마지막 숫자를 적어 보세요. 보상 카드는
              점수를 올리고, 벌점 카드는 점수를 내립니다.
            </p>

            <div className="mt-5 rounded-[1.6rem] border border-[var(--line)] bg-white/82 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--berry)]">
                계산 힌트
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                카드가 들어오면 그만큼 반영되고, 카드가 나가면 반대로 생각하면 됩니다.
                분수와 소수도 같은 방식으로 읽을 수 있어요.
              </p>
            </div>

            <input
              value={resultInput}
              onChange={(event) => setResultInput(event.target.value)}
              className="field mt-5 w-full"
              placeholder="예: 6 또는 1/3"
            />

            <Button className="mt-4" block onClick={submitResult}>
              마지막 숫자 확인
            </Button>
          </section>
        )}
      </div>
    </div>
  );
}
