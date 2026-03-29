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
        "relative overflow-hidden rounded-[1.25rem] border-2 px-5 py-4 text-[1rem] font-bold leading-6 shadow-sm",
        tone === "info" &&
          "border-sky-200 bg-sky-50 text-sky-800",
        tone === "success" &&
          "feedback-success-burst border-emerald-300 bg-emerald-100 text-emerald-900 pulse-good shadow-emerald-500/10",
        tone === "warning" &&
          "border-amber-300 bg-amber-100 text-amber-950 shake-soft shadow-amber-500/10",
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
      <span className="relative z-10 flex items-center gap-3">
        {tone === 'info' && <span className="text-2xl animate-bounce">💡</span>}
        {tone === 'success' && <span className="text-2xl animate-bounce">🌟</span>}
        {tone === 'warning' && <span className="text-2xl shake-soft">🤔</span>}
        <span>{message}</span>
      </span>
    </div>
  );
}
