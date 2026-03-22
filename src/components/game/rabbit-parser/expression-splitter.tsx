import { useMemo } from "react";

import { cn } from "@/lib/utils";

type ExpressionSplitterProps = {
  expression: string;
  selectedGaps: number[];
  onToggleGap: (index: number) => void;
};

export function ExpressionSplitter({
  expression,
  selectedGaps,
  onToggleGap,
}: ExpressionSplitterProps) {
  const chars = useMemo(() => expression.split(""), [expression]);

  return (
    <div className="overflow-x-auto rounded-[2rem] bg-stone-100/90 p-4">
      <div className="flex min-w-max items-center">
        {chars.map((char, index) => (
          <div key={`${char}-${index}`} className="flex items-center">
            <span className="rounded-xl bg-white px-3 py-2 font-mono text-lg">
              {char}
            </span>
            {index < chars.length - 1 && (
              <button
                type="button"
                onClick={() => onToggleGap(index + 1)}
                className={cn(
                  "mx-1 rounded-full border px-2 py-1 text-xs font-semibold transition",
                  selectedGaps.includes(index + 1)
                    ? "border-[var(--sun)] bg-[var(--sun)] text-white"
                    : "border-[var(--line)] bg-white text-[var(--ink-soft)]",
                )}
              >
                끊기
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

