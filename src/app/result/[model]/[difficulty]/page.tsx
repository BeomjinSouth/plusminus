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
      <section className={`panel-strong overflow-hidden rounded-[2.3rem] px-6 py-8 md:px-8 ${modelInsight.accentClass}`}>
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-white/70 bg-white/82 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sea)]">
                Mission Complete
              </span>
              <span className="rounded-full bg-[var(--ink-strong)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                {difficultyMissionLabels[result.difficulty]}
              </span>
            </div>
            <h1 className="mt-4 font-[var(--font-display)] text-[2.7rem] leading-[1.02] tracking-[-0.05em] md:text-[4.4rem]">
              Set Complete
            </h1>
            <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)] md:text-base">
              {toStudentSummary(session.student)}
            </p>
            <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)] md:text-base">
              {formatModelLabel(result.model)} · {formatDifficultyLabel(result.difficulty)}
            </p>
          </div>

          <div className="rounded-[1.8rem] bg-[var(--ink-strong)] px-5 py-5 text-white shadow-[0_24px_42px_rgba(19,34,56,0.16)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/65">
              Completed Mission
            </p>
            <p className="mt-2 font-[var(--font-display)] text-[2rem] leading-none">
              {modelInsight.missionLabel}
            </p>
            <p className="mt-3 text-sm text-white/80">{modelInsight.rewardLabel}</p>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <StatPill label="Correct" value={`${result.correctCount}`} />
        <StatPill label="Retries" value={`${result.retryCount}`} accent="sun" />
        <StatPill label="Best Streak" value={`${result.bestStreak}`} accent="berry" />
      </section>

      <section className="mt-6 flex flex-wrap gap-3">
        <Link
          href={`/play/${params.model}/${params.difficulty}`}
          className="rounded-full bg-[var(--sun)] px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(217,119,44,0.22)]"
        >
          Retry Set
        </Link>
        <Link
          href="/lobby"
          className="rounded-full border border-[var(--line-strong)] bg-white/84 px-6 py-3 text-sm font-semibold text-[var(--ink-strong)]"
        >
          Choose Difficulty
        </Link>
      </section>
    </AppFrame>
  );
}
