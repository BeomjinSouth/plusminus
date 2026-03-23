import { Fragment, useMemo } from "react";

import {
  splitByGapSelection,
  tokenizeExpressionForSplitView,
  type SplitViewTokenType,
} from "@/lib/expression";
import { cn } from "@/lib/utils";

type ExpressionSplitterProps = {
  expression: string;
  selectedGaps: number[];
  onToggleGap: (index: number) => void;
};

function getTokenStyle(type: SplitViewTokenType) {
  if (type === "number") {
    return "border-sky-300 bg-sky-100 text-sky-950 shadow-[0_10px_0_rgb(125,211,252)]";
  }

  if (type === "operator") {
    return "border-rose-300 bg-rose-100 text-rose-950 shadow-[0_10px_0_rgb(253,164,175)]";
  }

  return "border-stone-300 bg-stone-50 text-stone-500 shadow-[0_10px_0_rgb(214,211,209)]";
}

export function ExpressionSplitter({
  expression,
  selectedGaps,
  onToggleGap,
}: ExpressionSplitterProps) {
  const tokens = useMemo(() => tokenizeExpressionForSplitView(expression), [expression]);
  const selectedGapSet = useMemo(() => new Set(selectedGaps), [selectedGaps]);
  const previewSegments = useMemo(
    () => splitByGapSelection(expression, selectedGaps),
    [expression, selectedGaps],
  );

  return (
    <div className="rounded-[2.25rem] border border-[#f0dcb1] bg-[linear-gradient(180deg,#fff7e5,#fffaf1)] p-4 shadow-[0_24px_60px_rgba(217,119,44,0.12)] md:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-amber-100 px-4 py-2 text-sm font-black text-amber-800">
          블록 사이 빈칸을 눌러 보세요
        </span>
        <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-[var(--ink-soft)]">
          선택한 끊기 {selectedGaps.length}곳
        </span>
        <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-[var(--ink-soft)]">
          현재 {previewSegments.length}조각
        </span>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="min-w-max rounded-[2rem] border-4 border-[#f6e7c2] bg-white px-4 py-6 shadow-[0_18px_40px_rgba(231,178,88,0.12)] md:px-6 md:py-8">
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
                      "relative mx-1.5 flex min-h-[5.75rem] min-w-[4.5rem] items-center justify-center rounded-[1.6rem] border-4 px-4 py-5 text-[clamp(2rem,4.8vw,3.5rem)] font-black leading-none transition duration-300 ease-out select-none md:min-h-[6.5rem] md:min-w-[5rem] md:px-5 md:py-6",
                      "hover:-translate-y-1.5",
                      getTokenStyle(token.type),
                      hasGapBefore && "translate-x-3 md:translate-x-4",
                      hasGapAfter && "-translate-x-3 md:-translate-x-4",
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
                        "group relative z-10 flex shrink-0 items-center justify-center transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#f7d589] focus-visible:ring-offset-4 focus-visible:ring-offset-[#fff7e5]",
                        isSelected ? "mx-2 w-20 sm:w-24" : "mx-0.5 w-9 opacity-80 hover:opacity-100 sm:w-10",
                      )}
                    >
                      {isSelected ? (
                        <span className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-rose-700 bg-rose-500 text-4xl font-black text-white shadow-[0_10px_0_rgb(190,24,93)] animate-bounce sm:h-16 sm:w-16 sm:text-5xl">
                          /
                        </span>
                      ) : (
                        <span className="flex h-14 w-9 items-center justify-center rounded-full border-4 border-dashed border-amber-300 bg-[#fff9ee] text-2xl text-amber-600 shadow-sm transition-all duration-200 group-hover:scale-110 group-hover:border-amber-500 group-hover:bg-amber-200 sm:h-16 sm:w-10">
                          ✂
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

      <div className="mt-5 rounded-[1.75rem] border border-[#eadfc8] bg-white/85 px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-soft)]">
          미리보기
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {previewSegments.map((segment, index) => (
            <Fragment key={`${segment}-${index}`}>
              <span className="rounded-[1.3rem] border border-[#ebe1d0] bg-white px-4 py-3 font-mono text-base font-black text-[var(--ink-strong)] shadow-[0_12px_24px_rgba(19,34,56,0.08)]">
                {segment}
              </span>
              {index < previewSegments.length - 1 ? (
                <span aria-hidden className="text-lg font-black text-rose-500">
                  /
                </span>
              ) : null}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
