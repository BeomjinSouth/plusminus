"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { StatPill } from "@/components/common/stat-pill";
import { AppFrame } from "@/components/layout/app-frame";
import { difficultyMissionLabels, getModelInsight } from "@/lib/model-content";
import {
  COUNTING_STONES_MASTERY_SET_ID,
  hasMasteredCountingStones,
} from "@/lib/progress";
import {
  loadLatestResult,
  loadSessionState,
  loadStudentProgress,
} from "@/lib/storage";
import type { SessionState, SetResult, StudentProgress } from "@/lib/types";
import {
  formatDifficultyLabel,
  formatModelLabel,
  toStudentSummary,
} from "@/lib/utils";

export default function ResultPage() {
  const params = useParams<{ model: string; difficulty: string }>();
  const [result, setResult] = useState<SetResult | null>(null);
  const [session, setSession] = useState<SessionState | null>(null);
  const [progress, setProgress] = useState<StudentProgress | null>(null);

  useEffect(() => {
    const latestResult = loadLatestResult();
    const currentSession = loadSessionState();

    setResult(latestResult);
    setSession(currentSession);

    if (currentSession) {
      setProgress(loadStudentProgress(currentSession.student.studentKey));
    }
  }, []);

  if (!result || !session || !progress) {
    return (
      <AppFrame>
        <div className="panel rounded-[2rem] p-8">
          최근 결과를 찾지 못했습니다. 로비로 돌아가 다시 시작해 주세요.
        </div>
      </AppFrame>
    );
  }

  const modelInsight = getModelInsight(result.model);
  const rabbitUnlocked = hasMasteredCountingStones(progress);
  const unlockedByThisResult =
    result.setId === COUNTING_STONES_MASTERY_SET_ID && rabbitUnlocked;

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
              세트 완료
            </h1>
            <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)] md:text-base">
              {toStudentSummary(session.student)}
            </p>
            <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)] md:text-base">
              {formatModelLabel(result.model)} · {formatDifficultyLabel(result.difficulty)} 세트가
              기록되었습니다.
            </p>
          </div>

          <div className="rounded-[1.8rem] bg-[var(--ink-strong)] px-5 py-5 text-white shadow-[0_24px_42px_rgba(19,34,56,0.16)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/65">
              완료한 미션
            </p>
            <p className="mt-2 font-[var(--font-display)] text-[2rem] leading-none">
              {modelInsight.missionLabel}
            </p>
            <p className="mt-3 text-sm text-white/80">{modelInsight.rewardLabel}</p>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <StatPill label="정답 문항" value={`${result.correctCount}개`} />
        <StatPill label="재도전" value={`${result.retryCount}회`} accent="sun" />
        <StatPill label="최고 무실수 연속" value={`${result.bestStreak}문항`} accent="berry" />
      </section>

      <section className="mt-6 flex flex-wrap gap-3">
        {unlockedByThisResult && (
          <Link
            href="/play/rabbit-sign-parser/low"
            className="rounded-full bg-[var(--berry)] px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(225,29,72,0.18)]"
          >
            점프 계산 시작하기
          </Link>
        )}
        <Link
          href={`/play/${params.model}/${params.difficulty}`}
          className="rounded-full bg-[var(--sun)] px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(217,119,44,0.22)]"
        >
          같은 세트 다시 하기
        </Link>
        <Link
          href="/lobby"
          className="rounded-full border border-[var(--line-strong)] bg-white/84 px-6 py-3 text-sm font-semibold text-[var(--ink-strong)]"
        >
          다른 모델 선택하기
        </Link>
      </section>

      {result.model === "counting-stones" && (
        <section className="mt-6 rounded-[1.8rem] border border-[var(--line)] bg-white/84 px-5 py-5">
          <p className="text-sm font-semibold text-[var(--ink-strong)]">
            {rabbitUnlocked
              ? "돌 놓기 마스터 완료. 이제 점프 계산으로 이어서 갈 수 있습니다."
              : "점프 계산은 돌 놓기 어려움 세트를 완료하면 열립니다."}
          </p>
        </section>
      )}
    </AppFrame>
  );
}
