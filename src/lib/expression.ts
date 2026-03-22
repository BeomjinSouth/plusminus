import {
  absRational,
  formatSignedRational,
  normalizeMathText,
  parseRational,
  type Rational,
} from "@/lib/rational";
import type { DeliveryActionKey } from "@/lib/types";

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
    magnitude: absRational(magnitude),
    value: signedValue,
    normalizedTerm: formatSignedRational(signedValue),
  };
}

export function getDeliveryAction(segment: string): DeliveryActionKey {
  const parsed = parseSignedSegment(segment);

  if (parsed.outerSign === 1 && parsed.innerSign === 1) {
    return "reward-in";
  }
  if (parsed.outerSign === 1 && parsed.innerSign === -1) {
    return "penalty-in";
  }
  if (parsed.outerSign === -1 && parsed.innerSign === 1) {
    return "reward-out";
  }

  return "penalty-out";
}

