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
      <section className="panel rounded-[2rem] px-6 py-6 md:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">
          Lobby
        </p>
        <h1 className="mt-2 font-[var(--font-display)] text-4xl">
          어떤 방식으로 시작할까요?
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">
          {toStudentSummary(session.student)}
        </p>
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-3">
        {modelInsights.map((model) => (
          <article key={model.id} className="panel rounded-[2rem] p-6">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                {model.badge}
              </span>
              <span className="text-sm font-semibold text-[var(--sea)]">
                {model.shortName}
              </span>
            </div>
            <h2 className="mt-4 font-[var(--font-display)] text-3xl">
              {model.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">
              {model.meaning}
            </p>
            <div className="mt-5 grid gap-2">
              {difficulties.map((difficulty) => (
                <Link
                  key={`${model.id}-${difficulty}`}
                  href={`/play/${model.id}/${difficulty}`}
                  className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm font-semibold transition hover:border-[var(--sun)] hover:-translate-y-0.5"
                >
                  {formatDifficultyLabel(difficulty)} 세트 시작
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
