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
        "rounded-2xl border bg-white/70 px-4 py-3",
        accent === "sea" && "border-teal-200",
        accent === "sun" && "border-orange-200",
        accent === "berry" && "border-rose-200",
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-soft)]">
        {label}
      </p>
      <p className="mt-1 text-xl font-[var(--font-display)]">{value}</p>
    </div>
  );
}

