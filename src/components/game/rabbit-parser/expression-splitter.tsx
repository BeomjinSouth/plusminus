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
    return "border-[rgba(47,124,121,0.14)] bg-[linear-gradient(180deg,rgba(247,252,251,0.98),rgba(227,239,236,0.96))] text-[var(--sea)] shadow-[0_16px_30px_rgba(47,124,121,0.12)]";
  }

  if (type === "operator") {
    return "border-[rgba(181,82,67,0.16)] bg-[linear-gradient(180deg,rgba(253,247,246,0.98),rgba(246,228,224,0.96))] text-[var(--berry)] shadow-[0_16px_30px_rgba(181,82,67,0.12)]";
  }

  return "border-[var(--line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(241,236,228,0.96))] text-[var(--ink-soft)] shadow-[0_14px_26px_rgba(19,34,56,0.08)]";
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
    <div className="rounded-[2rem] border border-[rgba(217,119,44,0.14)] bg-[linear-gradient(180deg,rgba(255,252,247,0.96),rgba(247,241,232,0.82))] p-4 shadow-[0_22px_50px_rgba(33,31,26,0.08)] md:p-5">
      <p className="mb-4 text-sm font-semibold text-[var(--ink-soft)]">
        점을 눌러 끊을 곳을 고르세요.
      </p>

      <div className="overflow-x-auto pb-2">
        <div className="min-w-max rounded-[1.8rem] border border-[rgba(217,119,44,0.14)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(250,246,239,0.94))] px-4 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_16px_34px_rgba(33,31,26,0.06)] md:px-5 md:py-6">
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
                      "relative mx-1 flex min-h-[5.4rem] min-w-[4.25rem] items-center justify-center rounded-[1.35rem] border px-4 py-4 text-[clamp(1.9rem,4.5vw,3.2rem)] font-black leading-none transition duration-200 ease-out select-none md:min-h-[6rem] md:min-w-[4.7rem] md:px-5 md:py-5",
                      "hover:-translate-y-0.5",
                      getTokenStyle(token.type),
                      hasGapBefore && "translate-x-2 md:translate-x-2.5",
                      hasGapAfter && "-translate-x-2 md:-translate-x-2.5",
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
                        "group relative z-10 flex shrink-0 items-center justify-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(217,119,44,0.18)] focus-visible:ring-offset-4 focus-visible:ring-offset-[rgba(247,241,232,0.9)]",
                        isSelected ? "mx-1.5 w-14 sm:w-16" : "mx-0.5 w-8 sm:w-9",
                      )}
                    >
                      {isSelected ? (
                        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(217,119,44,0.16)] bg-[linear-gradient(180deg,var(--sun),#c86a22)] text-2xl font-black text-white shadow-[0_14px_24px_rgba(217,119,44,0.2)] sm:h-12 sm:w-12">
                          /
                        </span>
                      ) : (
                        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-[rgba(217,119,44,0.34)] bg-white/88 shadow-[0_8px_18px_rgba(33,31,26,0.06)] transition group-hover:border-[var(--sun)] group-hover:bg-white sm:h-10 sm:w-10">
                          <span className="h-2.5 w-2.5 rounded-full bg-[var(--gold)] shadow-[0_0_0_5px_rgba(231,178,88,0.14)]" />
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

      <div className="mt-4 rounded-[1.55rem] border border-[var(--line)] bg-white/82 px-4 py-4 shadow-[0_14px_24px_rgba(19,34,56,0.05)]">
        <p className="text-sm font-semibold text-[var(--ink-soft)]">지금 끊은 모양</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {previewSegments.map((segment, index) => (
            <Fragment key={`${segment}-${index}`}>
              <span className="rounded-[1.15rem] border border-[var(--line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,244,238,0.94))] px-4 py-2.5 font-mono text-sm font-semibold text-[var(--ink-strong)] shadow-[0_10px_18px_rgba(19,34,56,0.06)] md:text-base">
                {segment}
              </span>
              {index < previewSegments.length - 1 ? (
                <span aria-hidden className="text-sm font-black text-[var(--sun)]">
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
