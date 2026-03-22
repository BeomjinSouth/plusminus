import {
  addRational,
  compareRational,
  equalsRational,
  rationalToString,
  type Rational,
} from "@/lib/rational";
import { cn } from "@/lib/utils";

type NumberLineProps = {
  min: Rational;
  max: Rational;
  tick: Rational;
  current?: Rational;
  preview?: Rational;
  target?: Rational;
  onSelect?: (value: Rational) => void;
  selectable?: boolean;
};

function buildTicks(min: Rational, max: Rational, tick: Rational) {
  const ticks: Rational[] = [];
  let current = min;
  let guard = 0;

  while (compareRational(current, max) <= 0) {
    ticks.push(current);
    current = addRational(current, tick);
    guard += 1;

    if (guard > 300) {
      break;
    }
  }

  return ticks;
}

export function NumberLine({
  min,
  max,
  tick,
  current,
  preview,
  target,
  onSelect,
  selectable = false,
}: NumberLineProps) {
  const ticks = buildTicks(min, max, tick);
  const stride = Math.max(1, Math.ceil(ticks.length / 10));
  const zero = { numerator: 0, denominator: 1 };

  return (
    <div className="overflow-x-auto pb-2">
      <div
        className="grid min-w-[760px] items-end gap-0"
        style={{
          gridTemplateColumns: `repeat(${ticks.length}, minmax(44px, 1fr))`,
        }}
      >
        {ticks.map((value, index) => {
          const isCurrent = current ? equalsRational(value, current) : false;
          const isPreview = preview ? equalsRational(value, preview) : false;
          const isTarget = target ? equalsRational(value, target) : false;
          const showLabel =
            ticks.length <= 24 ||
            index % stride === 0 ||
            isCurrent ||
            isPreview ||
            isTarget ||
            equalsRational(value, zero);

          return (
            <button
              key={`${rationalToString(value)}-${index}`}
              type="button"
              disabled={!selectable}
              onClick={() => onSelect?.(value)}
              className={cn(
                "group flex min-h-40 flex-col items-center justify-end px-1 pb-1 text-center disabled:cursor-default",
                selectable && "cursor-pointer",
              )}
            >
              <div className="mb-2 flex h-10 items-center justify-center">
                {isTarget && (
                  <div className="h-8 w-8 rounded-full border-2 border-dashed border-[var(--sun)]" />
                )}
                {isCurrent && (
                  <div className="absolute h-6 w-6 rounded-full bg-[var(--sea)]/90" />
                )}
                {!isCurrent && isPreview && (
                  <div className="absolute h-6 w-6 rounded-full bg-[var(--sun)]/85" />
                )}
              </div>
              <div className="h-10 w-px bg-[var(--line-strong)]" />
              <div
                className={cn(
                  "mt-2 min-h-10 text-xs font-medium text-[var(--ink-soft)]",
                  showLabel ? "opacity-100" : "opacity-20",
                )}
              >
                {showLabel ? rationalToString(value) : "·"}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
