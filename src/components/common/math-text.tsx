import { tokenizeMathForDisplay } from "@/lib/math-display";
import { cn } from "@/lib/utils";

type MathTextProps = {
  text: string;
  className?: string;
};

export function MathText({ text, className }: MathTextProps) {
  const tokens = tokenizeMathForDisplay(text);
  const groups = new Map<number, typeof tokens>();

  tokens.forEach((token) => {
    const current = groups.get(token.group) ?? [];
    current.push(token);
    groups.set(token.group, current);
  });

  return (
    <span
      className={cn(
        "inline-flex max-w-full min-w-0 flex-wrap items-baseline gap-x-[0.08em] gap-y-[0.16em]",
        className,
      )}
      aria-label={text}
    >
      {Array.from(groups.entries()).map(([groupIndex, groupTokens]) => (
        <span
          key={`${text}-${groupIndex}`}
          className="inline-flex shrink-0 items-baseline whitespace-nowrap"
        >
          {groupTokens.map((token, index) => {
            if (token.type === "text") {
              return (
                <span key={`${token.value}-${groupIndex}-${index}`}>
                  {token.value}
                </span>
              );
            }

            return (
              <span
                key={`${token.value}-${groupIndex}-${index}`}
                className="math-fraction align-[-0.22em]"
              >
                {token.sign ? (
                  <span className="math-fraction__sign">{token.sign}</span>
                ) : null}
                <span className="math-fraction__stack">
                  <span className="math-fraction__top">{token.numerator}</span>
                  <span className="math-fraction__bar" />
                  <span className="math-fraction__bottom">
                    {token.denominator}
                  </span>
                </span>
              </span>
            );
          })}
        </span>
      ))}
    </span>
  );
}
