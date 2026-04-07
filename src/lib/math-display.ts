export type MathDisplayToken =
  | {
      type: "text";
      group: number;
      value: string;
    }
  | {
      type: "fraction";
      group: number;
      sign: "" | "+" | "-";
      numerator: string;
      denominator: string;
      value: string;
    };

const FRACTION_PATTERN = /[+-]?\d+\/\d+/g;

function splitMathDisplayGroups(text: string) {
  const groups: string[] = [];
  let buffer = "";
  let depth = 0;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if ((char === "+" || char === "-") && depth === 0 && buffer.length > 0) {
      groups.push(buffer);
      buffer = char;
      continue;
    }

    if (char === "(") {
      depth += 1;
    } else if (char === ")") {
      depth = Math.max(0, depth - 1);
    }

    buffer += char;
  }

  if (buffer) {
    groups.push(buffer);
  }

  return groups.length > 0 ? groups : [text];
}

export function tokenizeMathForDisplay(text: string): MathDisplayToken[] {
  const tokens: MathDisplayToken[] = [];
  const groups = splitMathDisplayGroups(text);

  groups.forEach((groupText, groupIndex) => {
    let lastIndex = 0;

    for (const match of groupText.matchAll(FRACTION_PATTERN)) {
      const value = match[0];
      const matchIndex = match.index ?? 0;

      if (matchIndex > lastIndex) {
        tokens.push({
          type: "text",
          group: groupIndex,
          value: groupText.slice(lastIndex, matchIndex),
        });
      }

      const signChar = value[0];
      const sign = signChar === "+" || signChar === "-" ? signChar : "";
      const unsignedValue = sign ? value.slice(1) : value;
      const [numerator = "", denominator = ""] = unsignedValue.split("/");

      if (!numerator || !denominator) {
        tokens.push({
          type: "text",
          group: groupIndex,
          value,
        });
      } else {
        tokens.push({
          type: "fraction",
          group: groupIndex,
          sign,
          numerator,
          denominator,
          value,
        });
      }

      lastIndex = matchIndex + value.length;
    }

    if (lastIndex < groupText.length) {
      tokens.push({
        type: "text",
        group: groupIndex,
        value: groupText.slice(lastIndex),
      });
    }
  });

  if (tokens.length === 0) {
    return [{ type: "text", group: 0, value: text }];
  }

  return tokens;
}
