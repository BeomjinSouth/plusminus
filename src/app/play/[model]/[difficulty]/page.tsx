"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { AppFrame } from "@/components/layout/app-frame";
import { SetPlayer } from "@/components/play/set-player";
import { getProblemsByDifficulty } from "@/lib/problem-bank";
import { getModelAvailability } from "@/lib/progress";
import { loadSessionState, loadStudentProgress } from "@/lib/storage";
import type {
  Difficulty,
  ModelId,
  SessionState,
  StudentProgress,
} from "@/lib/types";
import { isDifficulty, isModelId } from "@/lib/utils";

export default function PlayPage() {
  const params = useParams<{ model: string; difficulty: string }>();
  const router = useRouter();
  const [session, setSession] = useState<SessionState | null>(null);
  const [progress, setProgress] = useState<StudentProgress | null>(null);

  const model = params.model;
  const difficulty = params.difficulty;

  useEffect(() => {
    const current = loadSessionState();
    if (!current) {
      router.replace("/enter");
      return;
    }

    setSession(current);
    setProgress(loadStudentProgress(current.student.studentKey));
  }, [router]);

  const isValid = isModelId(model) && isDifficulty(difficulty);
  const availability =
    isValid && progress
      ? getModelAvailability(progress, model as ModelId)
      : null;
  const blockedAvailability =
    availability && availability.status !== "ready" ? availability : null;

  const problems = useMemo(() => {
    if (!isValid) {
      return [];
    }

    return getProblemsByDifficulty(difficulty as Difficulty).filter((problem) =>
      problem.supports.includes(model as ModelId),
    );
  }, [difficulty, isValid, model]);

  if (!session || !progress) {
    return null;
  }

  if (!isValid) {
    return (
      <AppFrame>
        <div className="panel rounded-[2rem] p-8">
          올바르지 않은 세트 주소입니다.
        </div>
      </AppFrame>
    );
  }

  if (blockedAvailability) {
    return (
      <AppFrame>
        <section className="panel-strong rounded-[2rem] px-6 py-8 md:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--ink-soft)]">
            입장 제한
          </p>
          <h1 className="mt-3 font-[var(--font-display)] text-[2.2rem] leading-none tracking-[-0.05em] text-[var(--ink-strong)] md:text-[3rem]">
            {blockedAvailability.status === "disabled"
              ? "지금은 열려 있지 않아요"
              : "아직 잠겨 있어요"}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--ink-soft)] md:text-base">
            {blockedAvailability.reason}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/lobby"
              className="rounded-full bg-[var(--sun)] px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(217,119,44,0.22)]"
            >
              로비로 돌아가기
            </Link>
            {blockedAvailability.status === "locked" && (
              <Link
                href="/play/counting-stones/high"
                className="rounded-full border border-[var(--line-strong)] bg-white/84 px-6 py-3 text-sm font-semibold text-[var(--ink-strong)]"
              >
                돌 놓기 어려움으로 가기
              </Link>
            )}
          </div>
        </section>
      </AppFrame>
    );
  }

  return (
    <AppFrame>
      <SetPlayer
        session={session}
        model={model as ModelId}
        difficulty={difficulty as Difficulty}
        problems={problems}
      />
    </AppFrame>
  );
}

