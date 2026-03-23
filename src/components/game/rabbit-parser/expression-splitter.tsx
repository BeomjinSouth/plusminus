import { Fragment, useMemo } from "react";
import { RotateCcw, Scissors } from "lucide-react";

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
  onReset: () => void;
};

function getTokenStyle(type: SplitViewTokenType) {
  if (type === "number") {
    return "bg-blue-200 border-blue-400 text-blue-900 shadow-[0_8px_0_rgb(96,165,250)] hover:shadow-[0_12px_0_rgb(96,165,250)]";
  }

  if (type === "operator") {
    return "bg-pink-200 border-pink-400 text-pink-900 shadow-[0_8px_0_rgb(244,114,182)] hover:shadow-[0_12px_0_rgb(244,114,182)]";
  }

  return "bg-white border-gray-300 text-gray-500 shadow-[0_8px_0_rgb(209,213,219)] hover:shadow-[0_12px_0_rgb(209,213,219)]";
}

export function ExpressionSplitter({
  expression,
  selectedGaps,
  onToggleGap,
  onReset,
}: ExpressionSplitterProps) {
  const tokens = useMemo(() => tokenizeExpressionForSplitView(expression), [expression]);
  const selectedGapSet = useMemo(() => new Set(selectedGaps), [selectedGaps]);
  const previewSegments = useMemo(
    () => splitByGapSelection(expression, selectedGaps),
    [expression, selectedGaps],
  );

  return (
    <div className="rounded-[2.4rem] border-4 border-amber-100 bg-[#fff7ea] p-5 shadow-[0_24px_50px_rgba(217,119,44,0.12)] md:p-6">
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-amber-100 px-4 py-2 text-sm font-black text-amber-800">
          블록 사이 빈칸을 눌러보세요!
        </span>
        <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-[var(--ink-soft)]">
          선택한 끊기 {selectedGaps.length}곳
        </span>
        <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-[var(--ink-soft)]">
          현재 {previewSegments.length}조각
        </span>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="min-w-max rounded-[2.2rem] border-4 border-amber-100 bg-white px-5 py-6 shadow-xl md:px-6 md:py-8">
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
                      "relative mx-1.5 flex min-h-[5.8rem] min-w-[4.4rem] items-center justify-center rounded-[1.6rem] border-4 px-4 py-5 text-[clamp(2rem,4.8vw,3.5rem)] font-black leading-none transition-all duration-500 ease-out select-none md:min-h-[6.4rem] md:min-w-[4.9rem] md:px-5 md:py-6",
                      "hover:-translate-y-2",
                      getTokenStyle(token.type),
                      hasGapBefore && "translate-x-6 opacity-80",
                      hasGapAfter && "-translate-x-6 opacity-80",
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
                        "group z-10 flex items-center justify-center transition-all duration-500 ease-in-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-200",
                        isSelected
                          ? "mx-2 w-24 opacity-100 sm:w-28"
                          : "mx-0.5 w-10 cursor-pointer opacity-30 hover:opacity-100 sm:w-12",
                      )}
                    >
                      {isSelected ? (
                        <span className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-red-700 bg-red-500 text-5xl font-black text-white shadow-[0_12px_0_rgb(185,28,28)] animate-bounce drop-shadow-2xl sm:h-16 sm:w-16 sm:text-6xl">
                          /
                        </span>
                      ) : (
                        <span className="flex h-16 w-10 items-center justify-center rounded-full border-4 border-dashed border-amber-300 bg-amber-50 shadow-sm transition-all duration-200 group-hover:scale-125 group-hover:border-amber-500 group-hover:bg-amber-200 sm:w-11">
                          <Scissors className="h-8 w-8 -rotate-90 text-amber-600" strokeWidth={3} />
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

      <div className="mt-5 rounded-[1.7rem] bg-white/86 px-4 py-4">
        <p className="text-sm font-black text-[var(--ink-soft)]">미리보기</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {previewSegments.map((segment, index) => (
            <Fragment key={`${segment}-${index}`}>
              <span className="rounded-[1.2rem] bg-white px-4 py-3 font-mono text-sm font-black text-[var(--ink-strong)] shadow-[0_12px_24px_rgba(19,34,56,0.08)] md:text-base">
                {segment}
              </span>
              {index < previewSegments.length - 1 ? (
                <span aria-hidden className="text-lg font-black text-red-500">
                  /
                </span>
              ) : null}
            </Fragment>
          ))}
        </div>
      </div>

      <div
        className={cn(
          "mt-6 transition-all duration-500",
          selectedGaps.length > 0
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-6 opacity-0",
        )}
      >
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-3 rounded-full border-4 border-green-600 bg-green-400 px-8 py-4 text-2xl font-black text-green-950 shadow-[0_10px_0_rgb(22,163,74)] transition-all hover:-translate-y-2 hover:bg-green-300 hover:shadow-[0_14px_0_rgb(22,163,74)] active:translate-y-2 active:shadow-none"
        >
          <RotateCcw className="h-7 w-7" strokeWidth={3} />
          다시 붙이기
        </button>
      </div>
    </div>
  );
}
