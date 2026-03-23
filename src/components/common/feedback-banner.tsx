"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export function FeedbackBanner({
  tone,
  message,
}: {
  tone: "info" | "success" | "warning";
  message: string;
}) {
  const [animationNonce, setAnimationNonce] = useState(0);

  useEffect(() => {
    if (tone === "success") {
      setAnimationNonce((value) => value + 1);
    }
  }, [message, tone]);

  return (
    <div
      key={`${tone}-${animationNonce}`}
      className={cn(
        "relative overflow-hidden rounded-2xl border px-4 py-3 text-sm leading-6",
        tone === "info" &&
          "border-[var(--line)] bg-white/80 text-[var(--ink-soft)]",
        tone === "success" &&
          "feedback-success-burst border-emerald-200 bg-emerald-50 text-emerald-900 pulse-good",
        tone === "warning" &&
          "border-amber-200 bg-amber-50 text-amber-950 shake-soft",
      )}
    >
      {tone === "success" ? (
        <>
          <span className="feedback-success-spark left-[1rem] top-[0.8rem]" />
          <span className="feedback-success-spark left-[2.6rem] top-[2.1rem]" />
          <span className="feedback-success-spark right-[2.4rem] top-[0.9rem]" />
          <span className="feedback-success-spark right-[1rem] top-[2rem]" />
          <span className="feedback-success-glow" />
        </>
      ) : null}
      <span className="relative z-10">{message}</span>
    </div>
  );
}
