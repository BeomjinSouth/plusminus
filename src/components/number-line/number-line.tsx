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

function RabbitMarker({ tone }: { tone: "current" | "preview" }) {
  const isPreview = tone === "preview";

  return (
    <div
      className={cn(
        "relative h-12 w-12",
        tone === "current" ? "rabbit-hop" : "rabbit-float opacity-75",
      )}
    >
      <span
        className={cn(
          "absolute left-[0.8rem] top-0 h-4 w-[0.55rem] rounded-full border border-[rgba(19,34,56,0.08)] bg-white",
          isPreview ? "bg-amber-50" : "bg-white",
        )}
      />
      <span
        className={cn(
          "absolute left-[1.55rem] top-0 h-4 w-[0.55rem] rounded-full border border-[rgba(19,34,56,0.08)] bg-white",
          isPreview ? "bg-amber-50" : "bg-white",
        )}
      />
      <span
        className={cn(
          "absolute left-[0.9rem] top-[0.35rem] h-2.25 w-[0.22rem] rounded-full",
          isPreview ? "bg-[rgba(217,119,44,0.24)]" : "bg-[rgba(47,124,121,0.18)]",
        )}
      />
      <span
        className={cn(
          "absolute left-[1.67rem] top-[0.35rem] h-2.25 w-[0.22rem] rounded-full",
          isPreview ? "bg-[rgba(217,119,44,0.24)]" : "bg-[rgba(47,124,121,0.18)]",
        )}
      />
      <span
        className={cn(
          "absolute left-[0.35rem] top-[0.95rem] h-8 w-8 rounded-full border border-[rgba(19,34,56,0.08)]",
          isPreview
            ? "bg-[linear-gradient(180deg,rgba(255,248,237,0.96),rgba(255,230,196,0.96))]"
            : "bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(224,243,240,0.94))]",
        )}
      />
      <span className="absolute left-[1.15rem] top-[1.85rem] h-1.5 w-1.5 rounded-full bg-[var(--ink-strong)]" />
      <span className="absolute left-[1.8rem] top-[2.1rem] h-[0.22rem] w-1.5 rounded-full bg-[rgba(19,34,56,0.45)]" />
      <span className="absolute left-[2.2rem] top-[2.35rem] h-3 w-3 rounded-full border border-[rgba(19,34,56,0.06)] bg-white/96" />
      <span
        className={cn(
          "absolute left-[0.15rem] top-[1.9rem] h-3.5 w-3.5 rounded-full",
          isPreview ? "bg-[var(--sun)]" : "bg-[var(--sea)]",
        )}
      />
    </div>
  );
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
          const isPreview = !isCurrent && preview ? equalsRational(value, preview) : false;
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
                "group relative flex min-h-44 flex-col items-center justify-end px-1 pb-1 text-center disabled:cursor-default",
                selectable && "cursor-pointer",
              )}
            >
              <div className="mb-2 flex h-14 items-center justify-center">
                {isTarget && (
                  <div className="absolute h-10 w-10 rounded-full border-2 border-dashed border-[var(--sun)]/70" />
                )}
                {isCurrent && <RabbitMarker tone="current" />}
                {isPreview && <RabbitMarker tone="preview" />}
              </div>
              <div
                className={cn(
                  "h-12 w-px bg-[var(--line-strong)] transition",
                  isCurrent || isPreview ? "bg-[var(--sun)]" : undefined,
                )}
              />
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
