import { tokenizeMathForDisplay } from "@/lib/math-display";
import { cn } from "@/lib/utils";

type MathTextProps = {
  text: string;
  className?: string;
};

export function MathText({ text, className }: MathTextProps) {
  const tokens = tokenizeMathForDisplay(text);

  return (
    <span
      className={cn("inline-flex flex-wrap items-baseline", className)}
      aria-label={text}
    >
      {tokens.map((token, index) => {
        if (token.type === "text") {
          return <span key={`${token.value}-${index}`}>{token.value}</span>;
        }

        return (
          <span
            key={`${token.value}-${index}`}
            className="math-fraction align-[-0.22em]"
          >
            {token.sign ? (
              <span className="math-fraction__sign">{token.sign}</span>
            ) : null}
            <span className="math-fraction__stack">
              <span className="math-fraction__top">{token.numerator}</span>
              <span className="math-fraction__bar" />
              <span className="math-fraction__bottom">{token.denominator}</span>
            </span>
          </span>
        );
      })}
    </span>
  );
}
