import { cn } from "@/lib/utils";

export function FeedbackBanner({
  tone,
  message,
}: {
  tone: "info" | "success" | "warning";
  message: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3 text-sm leading-6",
        tone === "info" &&
          "border-[var(--line)] bg-white/80 text-[var(--ink-soft)]",
        tone === "success" &&
          "border-emerald-200 bg-emerald-50 text-emerald-900 pulse-good",
        tone === "warning" &&
          "border-amber-200 bg-amber-50 text-amber-950 shake-soft",
      )}
    >
      {message}
    </div>
  );
}

