"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { StatPill } from "@/components/common/stat-pill";
import { AppFrame } from "@/components/layout/app-frame";
import { difficultyMissionLabels, getModelInsight } from "@/lib/model-content";
import { loadLatestResult, loadSessionState } from "@/lib/storage";
import type { SessionState, SetResult } from "@/lib/types";
import { formatDifficultyLabel, formatModelLabel, toStudentSummary } from "@/lib/utils";

export default function ResultPage() {
  const params = useParams<{ model: string; difficulty: string }>();
  const [result, setResult] = useState<SetResult | null>(null);
  const [session, setSession] = useState<SessionState | null>(null);

  useEffect(() => {
    setResult(loadLatestResult());
    setSession(loadSessionState());
  }, []);

  if (!result || !session) {
    return (
      <AppFrame>
        <div className="panel rounded-[2rem] p-8">
          Recent result not found. Go back to the lobby and try again.
        </div>
      </AppFrame>
    );
  }

  const modelInsight = getModelInsight(result.model);

  return (
    <AppFrame>
      <section className={`panel-strong relative overflow-hidden rounded-[2.5rem] px-6 py-8 md:px-10 border-4 border-white bg-gradient-to-br from-indigo-50 to-blue-100 shadow-xl`}>
        <div className="absolute -top-10 -right-10 text-[10rem] opacity-20 rotate-12 pointer-events-none select-none">🎉</div>
        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-indigo-200 bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[var(--sea)] shadow-sm">
                미션 완료 ✨
              </span>
              <span className="rounded-full bg-[var(--sun)] px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white shadow-sm">
                난이도: {difficultyMissionLabels[result.difficulty] || formatDifficultyLabel(result.difficulty)}
              </span>
            </div>
            <h1 className="mt-5 font-[var(--font-display)] text-[3rem] font-extrabold leading-[1.1] tracking-[-0.03em] md:text-[4.5rem] bg-gradient-to-br from-indigo-800 to-blue-600 bg-clip-text text-transparent drop-shadow-sm">
              정말 잘했어요! 🥳
            </h1>
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-bold text-indigo-700 shadow-sm">
              <span className="text-xl">🙌</span> {toStudentSummary(session.student)}
            </p>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-xl border-4 border-indigo-100 rotate-2">
            <p className="text-[0.75rem] font-black uppercase tracking-widest text-indigo-400">
              오늘의 보상
            </p>
            <div className="mt-3 flex items-center gap-4">
              <div className="text-5xl animate-bounce">🥕</div>
              <div>
                <p className="font-[var(--font-display)] text-[2.2rem] font-bold text-[var(--ink-strong)] leading-none">
                  당근 {result.correctCount}개 획득
                </p>
                <p className="mt-2 text-sm font-bold text-amber-500">
                  {modelInsight.rewardLabel || "토끼가 배불리 먹었어요!"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <StatPill label="맞은 문제" value={`${result.correctCount}개`} />
        <StatPill label="다시 시도한 횟수" value={`${result.retryCount}번`} accent="sun" />
        <StatPill label="최고 연속 정답" value={`${result.bestStreak}번 연속`} accent="berry" />
      </section>

      <section className="mt-8 flex flex-wrap gap-4">
        <Link
          href={`/play/${params.model}/${params.difficulty}`}
          className="rounded-full bg-[var(--sun)] px-8 py-4 text-[1.1rem] font-bold text-white shadow-lg transition-transform hover:-translate-y-1 hover:brightness-110 active:scale-95 border-b-4 border-orange-500"
        >
          🔄 같은 난이도로 다시 하기
        </Link>
        <Link
          href="/lobby"
          className="rounded-full border-2 border-[var(--sea)] bg-white px-8 py-4 text-[1.1rem] font-bold text-[var(--sea)] shadow-lg transition-transform hover:-translate-y-1 hover:bg-sky-50 active:scale-95 border-b-4 border-[color:color-mix(in_srgb,var(--sea),black_20%)]"
        >
          🏠 다른 난이도 고르기
        </Link>
      </section>
    </AppFrame>
  );
}
