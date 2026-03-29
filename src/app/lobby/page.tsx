"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/common/button";
import { AppFrame } from "@/components/layout/app-frame";
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
      <section className="panel-strong relative overflow-hidden rounded-[2rem] px-6 py-8 md:px-8">
        <div className="absolute -right-6 -top-6 text-[8rem] opacity-10 rotate-12 pointer-events-none select-none">🐰</div>
        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div>
            <h1 className="font-[var(--font-display)] text-[2.2rem] font-bold leading-none tracking-[-0.03em] md:text-[3rem] text-[var(--ink-strong)]">
              점프 계산 <span className="inline-block animate-bounce">🏃</span>
            </h1>
            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-[var(--sea)]/10 px-4 py-1.5 text-sm font-semibold text-[var(--sea)] shadow-sm">
              <span className="text-base">👋</span> {toStudentSummary(session.student)}
            </p>
          </div>
          <Button tone="ghost" onClick={() => router.push("/enter")} className="border-2 rounded-full px-5">
            학생 정보 다시 입력
          </Button>
        </div>
      </section>

      <section className="mt-6 panel-strong rounded-[2rem] p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-500 text-xl font-bold shadow-sm">
            🎯
          </div>
          <p className="text-[1.1rem] font-bold text-[var(--ink-strong)]">
            어떤 단계부터 시작할까요?
          </p>
        </div>
        
        <p className="mb-6 text-sm font-semibold text-[var(--ink-soft)] bg-[var(--line)]/30 inline-block px-4 py-2 rounded-full">
          💡 코스: 식 끊기 ➡️ 부호 정리 ➡️ 수직선 점프
        </p>
        
        <div className="grid gap-4 md:grid-cols-3">
          {difficulties.map((difficulty) => {
            const icons = { low: "🌱", medium: "⭐", high: "🔥" };
            return (
              <Link
                key={difficulty}
                href={`/play/rabbit-sign-parser/${difficulty}`}
                className="group relative flex flex-col items-center overflow-hidden rounded-[1.75rem] border-2 border-[var(--line)] bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[var(--sea)] hover:shadow-xl active:scale-95"
              >
                <div className="mb-4 text-4xl drop-shadow-sm transition-transform duration-300 group-hover:scale-110">
                  {icons[difficulty as keyof typeof icons]}
                </div>
                <h3 className="mb-4 text-xl font-bold text-[var(--ink-strong)]">
                  {formatDifficultyLabel(difficulty)}
                </h3>
                <span className="mt-auto w-full rounded-2xl bg-stone-100 py-3 text-center text-sm font-bold text-[var(--ink-soft)] transition-colors duration-300 group-hover:bg-[var(--sea)] group-hover:text-white group-hover:shadow-md">
                  도전하기!
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </AppFrame>
  );
}
