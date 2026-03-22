import { cn } from "@/lib/utils";

export function StatPill({
  label,
  value,
  accent = "sea",
}: {
  label: string;
  value: string;
  accent?: "sea" | "sun" | "berry";
}) {
  return (
    <div
      className={cn(
        "rounded-[1.6rem] border bg-white/82 px-4 py-4 shadow-[0_16px_28px_rgba(19,34,56,0.05)]",
        accent === "sea" && "border-teal-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(236,253,250,0.88))]",
        accent === "sun" && "border-orange-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(255,247,237,0.9))]",
        accent === "berry" && "border-rose-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(255,241,242,0.9))]",
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-soft)]">
        {label}
      </p>
      <p className="mt-2 text-[1.7rem] leading-none font-[var(--font-display)] tracking-[-0.04em] text-[var(--ink-strong)]">
        {value}
      </p>
    </div>
  );
}
