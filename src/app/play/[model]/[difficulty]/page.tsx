"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { AppFrame } from "@/components/layout/app-frame";
import { SetPlayer } from "@/components/play/set-player";
import { getProblemsByDifficulty } from "@/lib/problem-bank";
import { loadSessionState } from "@/lib/storage";
import type { Difficulty, ModelId, SessionState } from "@/lib/types";
import { isDifficulty, isModelId } from "@/lib/utils";

export default function PlayPage() {
  const params = useParams<{ model: string; difficulty: string }>();
  const router = useRouter();
  const [session, setSession] = useState<SessionState | null>(null);

  const model = params.model;
  const difficulty = params.difficulty;

  useEffect(() => {
    const current = loadSessionState();
    if (!current) {
      router.replace("/enter");
      return;
    }

    setSession(current);
  }, [router]);

  const isValid = isModelId(model) && isDifficulty(difficulty);

  const problems = useMemo(() => {
    if (!isValid) {
      return [];
    }

    return getProblemsByDifficulty(difficulty as Difficulty).filter((problem) =>
      problem.supports.includes(model as ModelId),
    );
  }, [difficulty, isValid, model]);

  if (!session) {
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

