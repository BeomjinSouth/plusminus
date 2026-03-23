"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/common/button";
import { AppFrame } from "@/components/layout/app-frame";
import { modelInsights } from "@/lib/model-content";
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
        {modelInsights.map((model) => (
          <article
            key={model.id}
            className={`panel-strong rounded-[2rem] p-5 md:p-6 ${model.accentClass}`}
          >
            <h2 className="font-[var(--font-display)] text-[2rem] leading-none tracking-[-0.04em]">
              {model.title}
            </h2>

            <div className="mt-4 rounded-[1.5rem] border border-white/70 bg-white/84 px-4 py-4">
              <div className="grid gap-2 text-sm font-semibold text-[var(--ink-strong)]">
                {model.quickPoints.map((point, index) => (
                  <p key={point}>
                    Step {index + 1}. {point}
                  </p>
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
          </article>
        ))}
      </section>
    </AppFrame>
  );
}
