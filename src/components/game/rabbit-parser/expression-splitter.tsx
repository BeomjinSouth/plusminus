import { Fragment, useMemo } from "react";
import { RotateCcw, Scissors } from "lucide-react";

import {
  tokenizeExpressionForSplitView,
  type SplitViewTokenType,
} from "@/lib/expression";
import { cn } from "@/lib/utils";

type ExpressionSplitterProps = {
  expression: string;
  selectedGaps: number[];
  onToggleGap: (index: number) => void;
  onReset: () => void;
};

function getTokenStyle(type: SplitViewTokenType) {
  if (type === "number") {
    return "bg-white border-[var(--line-strong)] text-[var(--ink-strong)] shadow-[0_8px_0_rgba(148,163,184,0.55)] hover:shadow-[0_10px_0_rgba(148,163,184,0.65)]";
  }

  if (type === "operator") {
    return "bg-stone-100 border-stone-300 text-[var(--ink-strong)] shadow-[0_8px_0_rgba(161,161,170,0.55)] hover:shadow-[0_10px_0_rgba(161,161,170,0.65)]";
  }

  return "bg-stone-50 border-stone-300 text-stone-500 shadow-[0_8px_0_rgba(212,212,216,0.7)] hover:shadow-[0_10px_0_rgba(212,212,216,0.82)]";
}

export function ExpressionSplitter({
  expression,
  selectedGaps,
  onToggleGap,
  onReset,
}: ExpressionSplitterProps) {
  const tokens = useMemo(() => tokenizeExpressionForSplitView(expression), [expression]);
  const selectedGapSet = useMemo(() => new Set(selectedGaps), [selectedGaps]);

  return (
    <div className="rounded-[2.2rem] border border-[var(--line)] bg-white/84 p-5 shadow-[0_18px_38px_rgba(19,34,56,0.06)] md:p-6">
      <div className="overflow-x-auto pb-2">
        <div className="min-w-max rounded-[2rem] border border-[var(--line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,244,238,0.96))] px-4 py-5 shadow-[0_16px_30px_rgba(19,34,56,0.05)] md:px-5 md:py-6">
          <div className="flex items-center">
            {tokens.map((token, index) => {
              const boundaryAfter = token.boundaryAfter;
              const previousBoundary = index > 0 ? tokens[index - 1]?.boundaryAfter : undefined;
              const hasGapBefore =
                previousBoundary !== undefined && selectedGapSet.has(previousBoundary);
              const isSelected =
                boundaryAfter !== undefined && selectedGapSet.has(boundaryAfter);
              const hasGapAfter = isSelected;

              return (
                <Fragment key={`${token.text}-${index}`}>
                  <div
                    className={cn(
                      "relative mx-1 flex min-h-[4.7rem] min-w-[3.6rem] items-center justify-center rounded-[1.2rem] border-2 px-3 py-4 text-[clamp(1.45rem,3.6vw,2.45rem)] font-black leading-none transition-all duration-300 ease-out select-none md:min-h-[5.2rem] md:min-w-[4rem] md:px-4 md:py-4",
                      "hover:-translate-y-1",
                      getTokenStyle(token.type),
                      hasGapBefore && "translate-x-4 opacity-80",
                      hasGapAfter && "-translate-x-4 opacity-80",
                    )}
                  >
                    {token.text}
                  </div>

                  {boundaryAfter !== undefined ? (
                    <button
                      type="button"
                      aria-label={`${index + 1}번째 블록 뒤에서 끊기`}
                      aria-pressed={isSelected}
                      title="끊기 선택"
                      onClick={() => onToggleGap(boundaryAfter)}
                      className={cn(
                        "group z-10 flex items-center justify-center transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-stone-200",
                        isSelected
                          ? "mx-2 w-20 opacity-100 sm:w-24"
                          : "mx-0.5 w-8 cursor-pointer opacity-100 sm:w-10",
                      )}
                    >
                      {isSelected ? (
                        <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[var(--ink-strong)] bg-white text-4xl font-black text-[var(--ink-strong)] shadow-[0_10px_18px_rgba(19,34,56,0.12)] sm:h-14 sm:w-14 sm:text-5xl">
                          /
                        </span>
                      ) : (
                        <span className="flex h-12 w-8 items-center justify-center rounded-full opacity-0 transition-all duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 sm:h-14 sm:w-9">
                          <Scissors className="h-6 w-6 -rotate-90 text-[var(--ink-soft)]" strokeWidth={2.6} />
                        </span>
                      )}
                    </button>
                  ) : null}
                </Fragment>
              );
            })}
          </div>
        </div>
      </div>

      <div
        className={cn(
          "mt-5 transition-all duration-500",
          selectedGaps.length > 0
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-6 opacity-0",
        )}
      >
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-3 rounded-full border border-[var(--line-strong)] bg-white px-7 py-3 text-lg font-black text-[var(--ink-strong)] shadow-[0_10px_18px_rgba(19,34,56,0.06)] transition-all hover:-translate-y-1 hover:border-[var(--ink-soft)] hover:bg-stone-50"
        >
          <RotateCcw className="h-5 w-5" strokeWidth={2.6} />
          다시 붙이기
        </button>
      </div>
    </div>
  );
}
