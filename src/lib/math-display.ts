export type MathDisplayToken =
  | {
      type: "text";
      value: string;
    }
  | {
      type: "fraction";
      sign: "" | "+" | "-";
      numerator: string;
      denominator: string;
      value: string;
    };

const FRACTION_PATTERN = /[+-]?\d+\/\d+/g;

export function tokenizeMathForDisplay(text: string): MathDisplayToken[] {
  const tokens: MathDisplayToken[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(FRACTION_PATTERN)) {
    const value = match[0];
    const matchIndex = match.index ?? 0;

    if (matchIndex > lastIndex) {
      tokens.push({
        type: "text",
        value: text.slice(lastIndex, matchIndex),
      });
    }

    const signChar = value[0];
    const sign = signChar === "+" || signChar === "-" ? signChar : "";
    const unsignedValue = sign ? value.slice(1) : value;
    const [numerator = "", denominator = ""] = unsignedValue.split("/");

    if (!numerator || !denominator) {
      tokens.push({
        type: "text",
        value,
      });
    } else {
      tokens.push({
        type: "fraction",
        sign,
        numerator,
        denominator,
        value,
      });
    }

    lastIndex = matchIndex + value.length;
  }

  if (lastIndex < text.length) {
    tokens.push({
      type: "text",
      value: text.slice(lastIndex),
    });
  }

  if (tokens.length === 0) {
    return [{ type: "text", value: text }];
  }

  return tokens;
}
