import { useMemo } from "react";

import { splitByGapSelection } from "@/lib/expression";
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
  const previewSegments = useMemo(
    () => splitByGapSelection(expression, selectedGaps),
    [expression, selectedGaps],
  );

  return (
    <div className="rounded-[2rem] border border-[var(--line)] bg-white/70 p-4 md:p-5">
      <div className="overflow-x-auto pb-2">
        <div className="min-w-max rounded-[1.75rem] border border-[var(--line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,239,231,0.96))] px-5 pb-14 pt-6">
          <div className="inline-flex items-end font-mono text-[clamp(2rem,4vw,3.25rem)] leading-none tracking-[0.02em] text-[var(--ink-strong)]">
            {chars.map((char, index) => {
              const gapIndex = index + 1;
              const isSelected = selectedGaps.includes(gapIndex);

              return (
                <span key={`${char}-${index}`} className="relative inline-flex items-end">
                  <span>{char}</span>
                  {index < chars.length - 1 && (
                    <button
                      type="button"
                      aria-label={`${gapIndex}번째 글자 뒤에서 끊기 표시`}
                      aria-pressed={isSelected}
                      title="끊기 표시"
                      onClick={() => onToggleGap(gapIndex)}
                      className="group absolute left-full top-full z-10 flex h-11 w-6 -translate-x-1/2 translate-y-1 items-start justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sea)] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "absolute top-0 h-6 w-[2px] rounded-full transition",
                          isSelected
                            ? "bg-[var(--sun)] opacity-100"
                            : "bg-[var(--line-strong)] opacity-0 group-hover:opacity-60 group-focus-visible:opacity-60",
                        )}
                      />
                      <span
                        aria-hidden
                        className={cn(
                          "mt-6 h-2.5 w-2.5 rounded-full border transition",
                          isSelected
                            ? "border-[var(--sun)] bg-[var(--sun)] shadow-[0_0_0_5px_rgba(239,124,37,0.12)]"
                            : "border-[var(--line-strong)] bg-white group-hover:border-[var(--sea)] group-focus-visible:border-[var(--sea)]",
                        )}
                      />
                    </button>
                  )}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[var(--ink-soft)]">
          <span className="rounded-full bg-stone-100 px-3 py-1">
            선택한 끊기 {selectedGaps.length}곳
          </span>
          <span className="rounded-full bg-stone-100 px-3 py-1">
            현재 {previewSegments.length}조각
          </span>
        </div>

        <div className="rounded-3xl bg-stone-50/85 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-soft)]">
            미리보기
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {previewSegments.map((segment, index) => (
              <span key={`${segment}-${index}`} className="contents">
                <span className="rounded-2xl bg-white px-3 py-2 font-mono text-sm text-[var(--ink-strong)] shadow-[0_8px_18px_rgba(19,34,56,0.06)]">
                  {segment}
                </span>
                {index < previewSegments.length - 1 ? (
                  <span aria-hidden className="text-sm font-semibold text-[var(--sun)]">
                    |
                  </span>
                ) : null}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
