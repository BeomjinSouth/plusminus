"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { StatPill } from "@/components/common/stat-pill";
import { AppFrame } from "@/components/layout/app-frame";
import {
  flushPendingProgress,
  flushPendingProgressWithBeacon,
} from "@/lib/logging/client-logger";
import { difficultyMissionLabels, getModelInsight } from "@/lib/model-content";
import { loadLatestResult, loadSessionState } from "@/lib/storage";
import type { SessionState, SetResult } from "@/lib/types";
import { formatDifficultyLabel, toStudentSummary } from "@/lib/utils";

export default function ResultPage() {
  const params = useParams<{ model: string; difficulty: string }>();
  const [result, setResult] = useState<SetResult | null>(null);
  const [session, setSession] = useState<SessionState | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const saveStateRef = useRef(saveState);

  useEffect(() => {
    saveStateRef.current = saveState;
  }, [saveState]);

  useEffect(() => {
    setResult(loadLatestResult());
    setSession(loadSessionState());
    setSaveState("saving");

    void flushPendingProgress()
      .then((didFlush) => {
        setSaveState(didFlush ? "saved" : "error");
      })
      .catch(() => {
        setSaveState("error");
      });
  }, []);

  useEffect(() => {
    function flushOnHide() {
      if (saveStateRef.current === "saved") {
        return;
      }

      flushPendingProgressWithBeacon();
    }

    function onVisibilityChange() {
      if (document.visibilityState === "hidden") {
        flushOnHide();
      }
    }

    window.addEventListener("beforeunload", flushOnHide);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", flushOnHide);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
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
      <section className="panel-strong relative overflow-hidden rounded-[2.5rem] border-4 border-white bg-gradient-to-br from-indigo-50 to-blue-100 px-6 py-8 shadow-xl md:px-10">
        <div className="pointer-events-none absolute -top-10 -right-10 rotate-12 select-none text-[8rem] font-black opacity-15">
          +3
        </div>
        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-indigo-200 bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[var(--sea)] shadow-sm">
                Mission Complete
              </span>
              <span className="rounded-full bg-[var(--sun)] px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white shadow-sm">
                Level {difficultyMissionLabels[result.difficulty] || formatDifficultyLabel(result.difficulty)}
              </span>
            </div>
            <h1 className="mt-5 bg-gradient-to-br from-indigo-800 to-blue-600 bg-clip-text font-[var(--font-display)] text-[3rem] font-extrabold leading-[1.1] tracking-[-0.03em] text-transparent drop-shadow-sm md:text-[4.5rem]">
              Great work!
            </h1>
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-bold text-indigo-700 shadow-sm">
              {toStudentSummary(session.student)}
            </p>
          </div>

          <div className="rotate-2 rounded-[2rem] border-4 border-indigo-100 bg-white p-6 shadow-xl">
            <p className="text-[0.75rem] font-black uppercase tracking-widest text-indigo-400">
              Reward
            </p>
            <div className="mt-3 flex items-center gap-4">
              <div className="rounded-full bg-amber-100 px-4 py-3 text-lg font-black text-amber-600">
                x{result.correctCount}
              </div>
              <div>
                <p className="font-[var(--font-display)] text-[2.2rem] font-bold leading-none text-[var(--ink-strong)]">
                  Carrot {result.correctCount}
                </p>
                <p className="mt-2 text-sm font-bold text-amber-500">
                  {modelInsight.rewardLabel || "Rabbit is happily full."}
                </p>
                <p className="mt-2 text-xs font-bold text-indigo-500">
                  {saveState === "saving" ? "Saving learning records..." : null}
                  {saveState === "saved" ? "Learning records saved." : null}
                  {saveState === "error" ? "Saving is delayed. Stay on this page and it will retry." : null}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <StatPill label="Correct" value={`${result.correctCount}`} />
        <StatPill label="Retries" value={`${result.retryCount}`} accent="sun" />
        <StatPill label="Best Streak" value={`${result.bestStreak}`} accent="berry" />
      </section>

      <section className="mt-8 flex flex-wrap gap-4">
        <Link
          href={`/play/${params.model}/${params.difficulty}`}
          className="rounded-full border-b-4 border-orange-500 bg-[var(--sun)] px-8 py-4 text-[1.1rem] font-bold text-white shadow-lg transition-transform hover:-translate-y-1 hover:brightness-110 active:scale-95"
        >
          Retry this set
        </Link>
        <Link
          href="/lobby"
          className="rounded-full border-2 border-[var(--sea)] border-b-4 border-[color:color-mix(in_srgb,var(--sea),black_20%)] bg-white px-8 py-4 text-[1.1rem] font-bold text-[var(--sea)] shadow-lg transition-transform hover:-translate-y-1 hover:bg-sky-50 active:scale-95"
        >
          Pick another set
        </Link>
      </section>
    </AppFrame>
  );
}
