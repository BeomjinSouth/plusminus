import type { CSSProperties } from "react";

const sparkSpecs = [
  { left: "12%", top: "72%", x: "-54px", y: "-54px", color: "#fb7185", delay: "0ms" },
  { left: "18%", top: "30%", x: "-42px", y: "-70px", color: "#f59e0b", delay: "40ms" },
  { left: "28%", top: "80%", x: "-12px", y: "-76px", color: "#38bdf8", delay: "80ms" },
  { left: "38%", top: "22%", x: "14px", y: "-72px", color: "#22c55e", delay: "120ms" },
  { left: "50%", top: "78%", x: "0px", y: "-88px", color: "#f97316", delay: "20ms" },
  { left: "62%", top: "26%", x: "30px", y: "-70px", color: "#8b5cf6", delay: "90ms" },
  { left: "72%", top: "78%", x: "46px", y: "-74px", color: "#14b8a6", delay: "150ms" },
  { left: "82%", top: "30%", x: "58px", y: "-58px", color: "#f43f5e", delay: "60ms" },
] as const;

type SuccessCelebrationProps = {
  id: number;
  label: string;
};

export function SuccessCelebration({ id, label }: SuccessCelebrationProps) {
  return (
    <div
      key={id}
      role="status"
      aria-live="polite"
      className="success-fireworks-pop relative overflow-hidden rounded-[2rem] border-2 border-amber-200/80 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.98),rgba(255,251,235,0.92)_50%,rgba(236,253,245,0.95)_100%)] px-5 py-5 shadow-[0_24px_48px_rgba(15,23,42,0.14)] backdrop-blur-sm"
    >
      <span className="success-fireworks-glow" />
      <span className="success-fireworks-ring success-fireworks-ring--left" />
      <span className="success-fireworks-ring success-fireworks-ring--right" />
      {sparkSpecs.map((spark, index) => (
        <span
          key={`${id}-${index}`}
          className="success-fireworks-spark"
          style={
            {
              left: spark.left,
              top: spark.top,
              animationDelay: spark.delay,
              "--spark-x": spark.x,
              "--spark-y": spark.y,
              "--spark-color": spark.color,
            } as CSSProperties
          }
        />
      ))}
      <div className="relative z-10 flex flex-wrap items-center justify-center gap-3 text-center">
        <span className="text-[2rem] leading-none" aria-hidden>
          🎆
        </span>
        <span className="rounded-full bg-white/85 px-3 py-1 text-[0.7rem] font-black uppercase tracking-[0.22em] text-amber-700 shadow-[0_8px_18px_rgba(245,158,11,0.16)]">
          정답
        </span>
        <p className="text-lg font-black text-emerald-950 sm:text-xl">{label}</p>
      </div>
    </div>
  );
}
