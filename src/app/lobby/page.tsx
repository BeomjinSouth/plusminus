"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/common/button";
import { AppFrame } from "@/components/layout/app-frame";
import { difficultyMissionLabels, modelInsights } from "@/lib/model-content";
import { loadSessionState } from "@/lib/storage";
import type { SessionState } from "@/lib/types";
import { formatDifficultyLabel, toStudentSummary } from "@/lib/utils";

const difficulties = ["low", "medium", "high"] as const;

export default function LobbyPage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionState | null>(null);

  useEffect(() => {
    const current = loadSessionState();
    if (!current) {
      router.replace("/enter");
      return;
    }

    setSession(current);
  }, [router]);

  if (!session) {
    return null;
  }

  return (
    <AppFrame>
      <section className="panel-strong overflow-hidden rounded-[2.3rem] px-6 py-7 md:px-8 md:py-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-[var(--line)] bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sea)]">
                Mission Lobby
              </span>
              <span className="rounded-full bg-[var(--ink-strong)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                7문항 러닝 세트
              </span>
            </div>
            <h1 className="mt-4 font-[var(--font-display)] text-[2.5rem] leading-[1.02] tracking-[-0.05em] md:text-[4rem]">
              어떤 방식으로
              <br />
              먼저 풀어볼까요?
            </h1>
            <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)] md:text-base">
              {toStudentSummary(session.student)}. 같은 내용을 다른 감각으로 푸는
              세 가지 미션이 준비되어 있습니다. 가장 끌리는 화면부터 시작하면 됩니다.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.5rem] bg-[var(--ink-strong)] px-4 py-4 text-white shadow-[0_20px_34px_rgba(19,34,56,0.16)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/65">
                플레이 규칙
              </p>
              <p className="mt-2 text-sm leading-6 text-white/90">
                세트 하나를 고르면 7문항을 연속으로 진행합니다.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-[var(--line)] bg-white/86 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">
                추천 흐름
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                셈돌 -&gt; 카드 점수 미션 -&gt; 토끼 점프 순으로 가면 구조가 더 잘 이어집니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-3">
        {modelInsights.map((model) => (
          <article
            key={model.id}
            className={`panel-strong overflow-hidden rounded-[2.2rem] p-5 md:p-6 ${model.accentClass}`}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-white/70 bg-white/82 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                  {model.badge}
                </span>
                <span className="text-sm font-semibold text-[var(--ink-soft)]">
                  {model.shortName}
                </span>
              </div>
              <div className="rounded-[1.15rem] border border-white/75 bg-white/78 px-4 py-3 text-center shadow-[0_14px_24px_rgba(19,34,56,0.08)]">
                <p className="font-[var(--font-display)] text-lg tracking-[-0.04em] text-[var(--ink-strong)]">
                  {model.iconText}
                </p>
              </div>
            </div>

            <h2 className="mt-5 font-[var(--font-display)] text-[2.2rem] leading-none tracking-[-0.04em]">
              {model.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">
              {model.hook}
            </p>

            <div className="mt-5 rounded-[1.7rem] border border-white/65 bg-white/76 p-4 shadow-[0_18px_30px_rgba(19,34,56,0.07)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">
                Stage Preview
              </p>
              <p className="mt-2 font-semibold text-[var(--ink-strong)]">
                {model.stageTitle}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                {model.stageBody}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {model.quickPoints.map((point) => (
                  <span
                    key={point}
                    className="rounded-full border border-[var(--line)] bg-white/84 px-3 py-1 text-xs font-semibold text-[var(--ink-soft)]"
                  >
                    {point}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {difficulties.map((difficulty) => (
                <Link
                  key={`${model.id}-${difficulty}`}
                  href={`/play/${model.id}/${difficulty}`}
                  className="group rounded-[1.45rem] border border-[var(--line)] bg-white/84 px-4 py-4 transition hover:-translate-y-0.5 hover:border-[var(--sea)] hover:bg-white"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">
                        {formatDifficultyLabel(difficulty)} 세트
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[var(--ink-strong)]">
                        {difficultyMissionLabels[difficulty]}
                      </p>
                    </div>
                    <span className="rounded-full bg-stone-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-soft)] transition group-hover:bg-[var(--ink-strong)] group-hover:text-white">
                      Start
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="mt-6 flex justify-end">
        <Button tone="ghost" onClick={() => router.push("/enter")}>
          학생 정보 다시 입력
        </Button>
      </section>
    </AppFrame>
  );
}
