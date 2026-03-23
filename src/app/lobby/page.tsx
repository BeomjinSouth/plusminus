"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/common/button";
import { AppFrame } from "@/components/layout/app-frame";
import { getModelAvailability } from "@/lib/progress";
import { modelInsights } from "@/lib/model-content";
import { loadSessionState, loadStudentProgress } from "@/lib/storage";
import type { SessionState, StudentProgress } from "@/lib/types";
import { formatDifficultyLabel, toStudentSummary } from "@/lib/utils";

const difficulties = ["low", "medium", "high"] as const;
const lobbyModelOrder = [
  "counting-stones",
  "rabbit-sign-parser",
  "postman",
] as const;

export default function LobbyPage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionState | null>(null);
  const [progress, setProgress] = useState<StudentProgress | null>(null);

  useEffect(() => {
    const current = loadSessionState();
    if (!current) {
      router.replace("/enter");
      return;
    }

    setSession(current);
    setProgress(loadStudentProgress(current.student.studentKey));
  }, [router]);

  if (!session || !progress) {
    return null;
  }

  const orderedModels = lobbyModelOrder
    .map((id) => modelInsights.find((model) => model.id === id))
    .filter(
      (model): model is (typeof modelInsights)[number] => model !== undefined,
    );

  return (
    <AppFrame>
      <section className="panel-strong rounded-[2rem] px-5 py-5 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-[var(--font-display)] text-[2rem] leading-none tracking-[-0.05em] md:text-[2.7rem]">
              연습 고르기
            </h1>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">
              {toStudentSummary(session.student)}
            </p>
          </div>
          <Button tone="ghost" onClick={() => router.push("/enter")}>
            학생 정보 다시 입력
          </Button>
        </div>
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-3">
        {orderedModels.map((model) => {
          const availability = getModelAvailability(progress, model.id);
          const isReady = availability.status === "ready";

          return (
            <article
              key={model.id}
              className={`panel-strong rounded-[2rem] p-5 md:p-6 ${model.accentClass} ${!isReady ? "opacity-85" : ""}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="font-[var(--font-display)] text-[2rem] leading-none tracking-[-0.04em]">
                  {model.title}
                </h2>
                <span className="rounded-full border border-white/80 bg-white/88 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                  {availability.actionLabel}
                </span>
              </div>

              <div className="mt-4 rounded-[1.5rem] border border-white/70 bg-white/84 px-4 py-4">
                <div className="grid gap-2 text-sm font-semibold text-[var(--ink-strong)]">
                  {model.quickPoints.map((point, index) => (
                    <p key={point}>
                      Step {index + 1}. {point}
                    </p>
                  ))}
                </div>
              </div>

              {isReady ? (
                <div className="mt-5 grid gap-3">
                  {difficulties.map((difficulty) => (
                    <Link
                      key={`${model.id}-${difficulty}`}
                      href={`/play/${model.id}/${difficulty}`}
                      className="group rounded-[1.45rem] border border-[var(--line)] bg-white/84 px-4 py-4 transition hover:-translate-y-0.5 hover:border-[var(--sea)] hover:bg-white"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-[var(--ink-strong)]">
                          {formatDifficultyLabel(difficulty)}
                        </p>
                        <span className="rounded-full bg-stone-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-soft)] transition group-hover:bg-[var(--ink-strong)] group-hover:text-white">
                          시작
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-[1.45rem] border border-dashed border-[var(--line-strong)] bg-white/78 px-4 py-4">
                  <p className="text-sm font-semibold text-[var(--ink-strong)]">
                    {availability.reason}
                  </p>
                  <p className="mt-2 text-sm text-[var(--ink-soft)]">
                    {availability.status === "locked"
                      ? "먼저 돌 놓기 어려움 세트를 마치고 다음 활동으로 넘어갑니다."
                      : "점수 카드는 다시 열기 전까지 로비와 직접 진입을 모두 막아 둡니다."}
                  </p>
                </div>
              )}
            </article>
          );
        })}
      </section>
    </AppFrame>
  );
}
