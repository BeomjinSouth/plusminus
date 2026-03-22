import rawProblemBank from "../../../problem-bank.json";

import { normalizeMathText } from "@/lib/rational";
import { splitExpressionIntoTerms } from "@/lib/expression";
import type { Difficulty, Problem, ProblemRecord } from "@/lib/types";

const problemBankRecord = rawProblemBank as Record<Difficulty, ProblemRecord[]>;

function normalizeProblemRecord(record: ProblemRecord): Problem {
  return {
    id: record.id,
    expression: normalizeMathText(record.expression),
    rawSplit:
      record.raw_split?.map((segment) => normalizeMathText(segment)) ??
      splitExpressionIntoTerms(record.expression),
    terms: record.terms.map((term) => normalizeMathText(term)),
    answer: normalizeMathText(record.answer),
    intermediateSums: record.intermediateSums.map((value) =>
      normalizeMathText(value),
    ),
    gridDenominator: record.gridDenominator,
    suggestedTick: normalizeMathText(record.suggestedTick),
    lineMin: normalizeMathText(record.lineMin),
    lineMax: normalizeMathText(record.lineMax),
    supports: record.supports,
  };
}

export function getProblemsByDifficulty(difficulty: Difficulty) {
  return problemBankRecord[difficulty].map(normalizeProblemRecord);
}

