import Link from "next/link";

import { AppFrame } from "@/components/layout/app-frame";
import { modelInsights } from "@/lib/model-content";

const missionSteps = [
  "학생 정보를 넣고 10초 안에 시작합니다.",
  "모델 하나를 골라 7문항 미션을 진행합니다.",
  "단계별 피드백과 기록으로 막힌 지점을 바로 확인합니다.",
];

const missionSignals = [
  { label: "Play Loop", value: "입장 > 선택 > 7문항 > 결과" },
  { label: "Mission", value: "3개 모델, 하 · 중 · 상 세트" },
  { label: "Reward", value: "연속 성공감 + 즉시 피드백" },
];

export default function HomePage() {
  return (
    <AppFrame>
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_26rem]">
        <div className="panel-strong relative overflow-hidden rounded-[2.4rem] px-6 py-8 md:px-10 md:py-10">
          <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,rgba(217,119,44,0.18),transparent_45%),radial-gradient(circle_at_top_right,rgba(47,124,121,0.16),transparent_38%)]" />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-[var(--line)] bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sea)]">
                교실용 미션 러너
              </span>
              <span className="rounded-full bg-[var(--ink-strong)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                3 Models
              </span>
            </div>

            <h1 className="mt-6 max-w-4xl font-[var(--font-display)] text-[2.9rem] leading-[1.04] tracking-[-0.05em] md:text-[5rem]">
              수학을
              <br />
              미션처럼
              <br />
              바로 시작하는 화면
            </h1>

            <p className="mt-5 max-w-2xl text-[15px] leading-7 text-[var(--ink-soft)] md:text-lg">
              셈돌, 카드 점수 미션, 토끼 점프 미션으로 같은 개념을 다른 감각으로
              반복합니다. 설명보다 조작이 먼저 보이고, 피드백은 바로 돌아오게
              구성했습니다.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {missionSignals.map((signal) => (
                <div
                  key={signal.label}
                  className="rounded-[1.45rem] border border-[var(--line)] bg-white/78 px-4 py-4 shadow-[0_14px_28px_rgba(19,34,56,0.06)]"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">
                    {signal.label}
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[var(--ink-strong)]">
                    {signal.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/enter"
                className="rounded-full bg-[var(--sun)] px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(217,119,44,0.22)] transition hover:-translate-y-0.5 md:text-base"
              >
                학생 입장하기
              </Link>
              <Link
                href="/lobby"
                className="rounded-full border border-[var(--line-strong)] bg-white/70 px-6 py-3 text-sm font-semibold text-[var(--ink-strong)] transition hover:border-[var(--sea)] hover:bg-white md:text-base"
              >
                모델 먼저 보기
              </Link>
            </div>

            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              {modelInsights.map((model) => (
                <article
                  key={model.id}
                  className={`rounded-[1.8rem] border bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(255,248,241,0.82))] px-4 py-4 ${model.accentClass}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-white/82 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                      {model.badge}
                    </span>
                    <span className="text-sm font-semibold text-[var(--ink-soft)]">
                      {model.shortName}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-4">
                    <div>
                      <h2 className="font-[var(--font-display)] text-[2rem] leading-none tracking-[-0.04em]">
                        {model.title}
                      </h2>
                      <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">
                        {model.hook}
                      </p>
                    </div>
                    <div className="rounded-[1.3rem] border border-white/75 bg-white/70 px-4 py-4 text-center shadow-[0_14px_24px_rgba(19,34,56,0.08)]">
                      <p className="font-[var(--font-display)] text-xl tracking-[-0.04em] text-[var(--ink-strong)]">
                        {model.iconText}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {model.quickPoints.map((point) => (
                      <span
                        key={point}
                        className="rounded-full border border-[var(--line)] bg-white/80 px-3 py-1 text-xs font-semibold text-[var(--ink-soft)]"
                      >
                        {point}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="panel rounded-[2rem] p-6">
            <p className="eyebrow text-[var(--berry)]">오늘의 플레이 루프</p>
            <div className="mt-5 grid gap-4">
              {missionSteps.map((step, index) => (
                <div
                  key={step}
                  className="flex gap-4 border-b border-[var(--line)] pb-4 last:border-b-0 last:pb-0"
                >
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--ink-strong)] text-sm font-semibold text-white shadow-[0_12px_20px_rgba(19,34,56,0.16)]">
                    {index + 1}
                  </span>
                  <p className="pt-1 text-sm leading-6 text-[var(--ink-soft)]">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="panel rounded-[2rem] p-6">
            <p className="eyebrow text-[var(--sea)]">모델별 느낌</p>
            <div className="mt-4 grid gap-3">
              {modelInsights.map((model) => (
                <div
                  key={model.id}
                  className="rounded-[1.5rem] border border-[var(--line)] bg-white/82 px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-[var(--ink-strong)]">
                      {model.missionLabel}
                    </p>
                    <span className="rounded-full bg-stone-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                      {model.rewardLabel}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                    {model.stageTitle}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </AppFrame>
  );
}
