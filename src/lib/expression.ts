import {
  absRational,
  equalsRational,
  formatSignedRational,
  normalizeMathText,
  parseRational,
  rationalToString,
  type Rational,
} from "@/lib/rational";

export type SplitViewTokenType = "number" | "operator" | "bracket";

export type SplitViewToken = {
  text: string;
  type: SplitViewTokenType;
  boundaryAfter?: number;
};

export function isWrappedBySingleParentheses(value: string) {
  if (!value.startsWith("(") || !value.endsWith(")")) {
    return false;
  }

  let depth = 0;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];

    if (char === "(") {
      depth += 1;
    } else if (char === ")") {
      depth -= 1;
    }

    if (depth === 0 && index < value.length - 1) {
      return false;
    }
  }

  return true;
}

export function splitExpressionIntoTerms(expression: string) {
  const normalized = normalizeMathText(expression);
  const segments: string[] = [];
  let buffer = "";
  let depth = 0;

  for (let index = 0; index < normalized.length; index += 1) {
    const char = normalized[index];

    if ((char === "+" || char === "-") && depth === 0 && buffer.length > 0) {
      segments.push(buffer);
      buffer = char;
      continue;
    }

    if (char === "(") {
      depth += 1;
    } else if (char === ")") {
      depth -= 1;
    }

    buffer += char;
  }

  if (buffer) {
    segments.push(buffer);
  }

  return segments;
}

export function formatTermForFinalExpression(
  term: string,
  options?: { allowBarePositive?: boolean },
) {
  const normalized = normalizeMathText(term);
  parseRational(normalized);

  if (normalized.startsWith("+") && options?.allowBarePositive) {
    return normalized.slice(1);
  }

  return normalized;
}

export function getFinalExpressionSegments(terms: string[]) {
  return terms.map((term, index) => {
    const formatted = formatTermForFinalExpression(term, {
      allowBarePositive: index === 0,
    });

    if (index === 0) {
      return formatted;
    }

    if (formatted.startsWith("-")) {
      return `+(${formatted})`;
    }

    return `+${formatted.replace(/^\+/, "")}`;
  });
}

export function buildFinalExpression(terms: string[]) {
  return getFinalExpressionSegments(terms).join("");
}

function parseNormalizedFinalExpressionTerm(term: string) {
  const normalized = normalizeMathText(term);

  if (!normalized) {
    throw new Error("Empty final expression term");
  }

  if (isWrappedBySingleParentheses(normalized)) {
    return parseRational(normalized.slice(1, -1));
  }

  try {
    return parseRational(normalized);
  } catch {
    const parsed = parseSignedSegment(normalized);

    // Allow fully normalized forms like `-(3)` while still rejecting
    // unresolved nested-sign forms such as `-(-3)` or `-(+3)`.
    if (parsed.outerSign === -1 && parsed.hadExplicitInnerSign) {
      throw new Error("Unnormalized final expression term");
    }

    return parsed.value;
  }
}

export function matchesNormalizedFinalExpression(
  expression: string,
  expectedTerms: string[],
) {
  const normalized = normalizeMathText(expression);

  if (!normalized) {
    return false;
  }

  try {
    const submittedTerms = splitExpressionIntoTerms(normalized);

    if (submittedTerms.length !== expectedTerms.length) {
      return false;
    }

    return submittedTerms.every((submittedTerm, index) =>
      equalsRational(
        parseNormalizedFinalExpressionTerm(submittedTerm),
        parseRational(expectedTerms[index] ?? ""),
      ),
    );
  } catch {
    return false;
  }
}

export function unwrapLeadingSimpleTerm(expression: string) {
  const normalized = normalizeMathText(expression);
  const segments = splitExpressionIntoTerms(normalized);

  if (segments.length === 0) {
    return normalized;
  }

  const [firstSegment, ...restSegments] = segments;
  let firstDisplay = firstSegment;

  if (isWrappedBySingleParentheses(firstSegment)) {
    const inner = firstSegment.slice(1, -1);

    try {
      parseRational(inner);
      firstDisplay = inner.startsWith("+") ? inner.slice(1) : inner;
    } catch {
      firstDisplay = firstSegment;
    }
  } else {
    try {
      firstDisplay = formatTermForFinalExpression(firstSegment, {
        allowBarePositive: true,
      });
    } catch {
      firstDisplay = firstSegment;
    }
  }

  return [firstDisplay, ...restSegments].join("");
}

export function tokenizeExpressionForSplitView(expression: string): SplitViewToken[] {
  const normalized = normalizeMathText(expression);
  const tokens: SplitViewToken[] = [];
  let cursor = 0;

  while (cursor < normalized.length) {
    const char = normalized[cursor];
    let text = "";
    let type: SplitViewTokenType = "number";

    if (char === "(" || char === ")") {
      text = char;
      type = "bracket";
      cursor += 1;
    } else if ((char === "+" || char === "-") && normalized[cursor + 1] === "(") {
      text = char;
      type = "operator";
      cursor += 1;
    } else {
      const start = cursor;

      if (char === "+" || char === "-") {
        cursor += 1;
      }

      while (cursor < normalized.length) {
        const nextChar = normalized[cursor];
        if (nextChar === "+" || nextChar === "-" || nextChar === "(" || nextChar === ")") {
          break;
        }
        cursor += 1;
      }

      text = normalized.slice(start, cursor);
      type = "number";
    }

    if (!text) {
      continue;
    }

    tokens.push({
      text,
      type,
      boundaryAfter: cursor < normalized.length ? cursor : undefined,
    });
  }

  return tokens;
}

export function splitByGapSelection(expression: string, selectedGaps: number[]) {
  const normalized = normalizeMathText(expression);
  const sorted = [...selectedGaps].sort((left, right) => left - right);
  const segments: string[] = [];
  let start = 0;

  for (const gap of sorted) {
    segments.push(normalized.slice(start, gap));
    start = gap;
  }

  segments.push(normalized.slice(start));

  return segments.filter(Boolean);
}

export function normalizeSegmentList(segments: string[]) {
  return segments.map((segment) => normalizeMathText(segment));
}

export function parseSignedSegment(segment: string) {
  const normalized = normalizeMathText(segment);
  let outerSign = 1;
  let rest = normalized;

  if (rest.startsWith("+")) {
    rest = rest.slice(1);
  } else if (rest.startsWith("-")) {
    outerSign = -1;
    rest = rest.slice(1);
  }

  let inner = rest;

  if (isWrappedBySingleParentheses(inner)) {
    inner = inner.slice(1, -1);
  }

  inner = normalizeMathText(inner);

  const hadExplicitInnerSign = inner.startsWith("+") || inner.startsWith("-");
  let innerSign = 1;
  if (inner.startsWith("+")) {
    inner = inner.slice(1);
  } else if (inner.startsWith("-")) {
    innerSign = -1;
    inner = inner.slice(1);
  }

  const magnitude = parseRational(inner);
  const signedValue: Rational = {
    numerator: magnitude.numerator * outerSign * innerSign,
    denominator: magnitude.denominator,
  };

  return {
    outerSign,
    innerSign,
    hadExplicitInnerSign,
    magnitude: absRational(magnitude),
    value: signedValue,
    normalizedTerm: formatSignedRational(signedValue),
  };
}

export function normalizeUnsignedRationalInput(input: string) {
  const normalized = normalizeMathText(input);

  if (normalized.startsWith("+") || normalized.startsWith("-")) {
    return normalized.slice(1);
  }

  return normalized;
}

export function buildSignedTermFromInput(
  sign: "+" | "-",
  magnitudeInput: string,
) {
  const magnitude = normalizeUnsignedRationalInput(magnitudeInput);

  if (!magnitude) {
    throw new Error("Empty magnitude input");
  }

  const normalizedMagnitude = rationalToString(
    absRational(parseRational(magnitude)),
  );

  return `${sign}${normalizedMagnitude}`;
}
