"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { StatPill } from "@/components/common/stat-pill";
import { AppFrame } from "@/components/layout/app-frame";
import { loadLatestResult, loadSessionState } from "@/lib/storage";
import type { SessionState, SetResult } from "@/lib/types";
import {
  formatDifficultyLabel,
  formatModelLabel,
  toStudentSummary,
} from "@/lib/utils";

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
          최근 결과를 찾지 못했습니다. 로비로 돌아가 다시 시작해 주세요.
        </div>
      </AppFrame>
    );
  }

  return (
    <AppFrame>
      <section className="panel rounded-[2rem] px-6 py-8 md:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--sea)]">
          Result
        </p>
        <h1 className="mt-2 font-[var(--font-display)] text-5xl leading-none">
          세트 완료
        </h1>
        <p className="mt-4 text-sm leading-6 text-[var(--ink-soft)]">
          {toStudentSummary(session.student)}
        </p>
        <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
          {formatModelLabel(result.model)} · {formatDifficultyLabel(result.difficulty)} 세트가
          기록되었습니다.
        </p>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <StatPill label="정답 문항" value={`${result.correctCount}개`} />
        <StatPill label="재도전" value={`${result.retryCount}회`} accent="sun" />
        <StatPill label="최고 무실수 연속" value={`${result.bestStreak}문항`} accent="berry" />
      </section>

      <section className="mt-6 flex flex-wrap gap-3">
        <Link
          href={`/play/${params.model}/${params.difficulty}`}
          className="rounded-full bg-[var(--sun)] px-6 py-3 text-sm font-semibold text-white"
        >
          같은 세트 다시 하기
        </Link>
        <Link
          href="/lobby"
          className="rounded-full border border-[var(--line-strong)] px-6 py-3 text-sm font-semibold text-[var(--ink-strong)]"
        >
          다른 모델 선택하기
        </Link>
      </section>
    </AppFrame>
  );
}
