export type Rational = {
  numerator: number;
  denominator: number;
};

const ASCII_MINUS = /[−–—]/g;

function assertInteger(value: number) {
  if (!Number.isInteger(value)) {
    throw new Error("Expected integer arithmetic only");
  }
}

export function normalizeMathText(value: string) {
  return value.replace(ASCII_MINUS, "-").replace(/\s+/g, "").trim();
}

export function gcd(a: number, b: number): number {
  let left = Math.abs(a);
  let right = Math.abs(b);

  while (right !== 0) {
    const next = left % right;
    left = right;
    right = next;
  }

  return left === 0 ? 1 : left;
}

export function lcm(a: number, b: number): number {
  return Math.abs((a * b) / gcd(a, b));
}

export function normalizeRational(rational: Rational): Rational {
  assertInteger(rational.numerator);
  assertInteger(rational.denominator);

  if (rational.denominator === 0) {
    throw new Error("Denominator must not be zero");
  }

  const sign = rational.denominator < 0 ? -1 : 1;
  const numerator = rational.numerator * sign;
  const denominator = rational.denominator * sign;
  const divisor = gcd(numerator, denominator);

  return {
    numerator: numerator / divisor,
    denominator: denominator / divisor,
  };
}

export function parseRational(input: string): Rational {
  const normalized = normalizeMathText(input);

  if (!normalized) {
    throw new Error("Empty rational input");
  }

  let sign = 1;
  let unsigned = normalized;

  if (unsigned.startsWith("+")) {
    unsigned = unsigned.slice(1);
  } else if (unsigned.startsWith("-")) {
    sign = -1;
    unsigned = unsigned.slice(1);
  }

  if (!unsigned) {
    throw new Error("Invalid rational input");
  }

  if (unsigned.includes("/")) {
    const [numeratorPart, denominatorPart] = unsigned.split("/");
    if (!numeratorPart || !denominatorPart) {
      throw new Error(`Invalid fraction input: ${input}`);
    }

    const numerator = Number.parseInt(numeratorPart, 10);
    const denominator = Number.parseInt(denominatorPart, 10);

    if (!Number.isInteger(numerator) || !Number.isInteger(denominator)) {
      throw new Error(`Invalid fraction input: ${input}`);
    }

    return normalizeRational({
      numerator: sign * numerator,
      denominator,
    });
  }

  if (unsigned.includes(".")) {
    const [intPart, decimalPart] = unsigned.split(".");
    if (decimalPart === undefined || decimalPart.length === 0) {
      throw new Error(`Invalid decimal input: ${input}`);
    }

    const digits = `${intPart}${decimalPart}`;
    const numerator = Number.parseInt(digits, 10);
    const denominator = 10 ** decimalPart.length;

    if (!Number.isInteger(numerator)) {
      throw new Error(`Invalid decimal input: ${input}`);
    }

    return normalizeRational({
      numerator: sign * numerator,
      denominator,
    });
  }

  const numerator = Number.parseInt(unsigned, 10);

  if (!Number.isInteger(numerator)) {
    throw new Error(`Invalid integer input: ${input}`);
  }

  return {
    numerator: sign * numerator,
    denominator: 1,
  };
}

export function addRational(left: Rational, right: Rational): Rational {
  return normalizeRational({
    numerator:
      left.numerator * right.denominator +
      right.numerator * left.denominator,
    denominator: left.denominator * right.denominator,
  });
}

export function subRational(left: Rational, right: Rational): Rational {
  return addRational(left, negateRational(right));
}

export function negateRational(value: Rational): Rational {
  return {
    numerator: value.numerator * -1,
    denominator: value.denominator,
  };
}

export function absRational(value: Rational): Rational {
  return {
    numerator: Math.abs(value.numerator),
    denominator: value.denominator,
  };
}

export function compareRational(left: Rational, right: Rational): number {
  const scaled =
    left.numerator * right.denominator - right.numerator * left.denominator;

  if (scaled === 0) {
    return 0;
  }

  return scaled > 0 ? 1 : -1;
}

export function equalsRational(left: Rational, right: Rational): boolean {
  return compareRational(left, right) === 0;
}

export function rationalToString(value: Rational) {
  const normalized = normalizeRational(value);

  if (normalized.denominator === 1) {
    return `${normalized.numerator}`;
  }

  return `${normalized.numerator}/${normalized.denominator}`;
}

export function formatSignedRational(
  value: Rational,
  options?: { allowBarePositive?: boolean },
) {
  const normalized = normalizeRational(value);
  const bare = rationalToString(absRational(normalized));

  if (normalized.numerator < 0) {
    return `-${bare}`;
  }

  if (options?.allowBarePositive) {
    return bare;
  }

  return `+${bare}`;
}

export function rationalToUnits(value: Rational, denominator: number) {
  const normalized = normalizeRational(value);

  if (denominator % normalized.denominator !== 0) {
    throw new Error("Denominator mismatch for unit conversion");
  }

  return normalized.numerator * (denominator / normalized.denominator);
}

export function sumRationals(values: Rational[]) {
  return values.reduce(addRational, { numerator: 0, denominator: 1 });
}

